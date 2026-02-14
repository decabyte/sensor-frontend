/**
 * Authentication Store
 * Manages authentication state with localStorage persistence
 * Supports JWT-style access/refresh token pairs with automatic refresh
 */

import { writable, derived, type Readable, get } from "svelte/store";
import { browser } from "$app/environment";
import {
    login as apiLogin,
    refreshToken,
    logout as apiLogout,
    validateToken,
} from "../api/client";
import type { User, LoginCredentials, TokenPair } from "../api/types";

// Storage keys
const ACCESS_TOKEN_KEY = "sensor_access_token";
const REFRESH_TOKEN_KEY = "sensor_refresh_token";
const TOKEN_EXPIRES_KEY = "sensor_token_expires";
const USER_KEY = "sensor_auth_user";

// Refresh token 60 seconds before expiration
const REFRESH_BUFFER_MS = 60 * 1000;

// Helper to safely access localStorage
function getStoredItem<T>(key: string, defaultValue: T): T {
    if (!browser) return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function getStoredString(
    key: string,
    defaultValue: string | null = null,
): string | null {
    if (!browser) return defaultValue;
    return localStorage.getItem(key) || defaultValue;
}

function getStoredNumber(key: string, defaultValue: number = 0): number {
    if (!browser) return defaultValue;
    const value = localStorage.getItem(key);
    return value ? parseInt(value, 10) : defaultValue;
}

// Check for saved auth on initialization
const savedAccessToken = getStoredString(ACCESS_TOKEN_KEY);
const savedRefreshToken = getStoredString(REFRESH_TOKEN_KEY);
const savedTokenExpires = getStoredNumber(TOKEN_EXPIRES_KEY);
const savedUser = savedAccessToken
    ? getStoredItem<User | null>(USER_KEY, null)
    : null;

// Create stores
export const accessToken = writable<string | null>(savedAccessToken);
export const refreshTokenStore = writable<string | null>(savedRefreshToken);
export const tokenExpiresAt = writable<number>(savedTokenExpires);
export const authUser = writable<User | null>(savedUser);
export const authLoading = writable(false);
export const authError = writable<string | null>(null);

// Derived store for authentication status
export const isAuthenticated: Readable<boolean> = derived(
    accessToken,
    ($token) => $token !== null,
);

// Token refresh timer
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule token refresh before expiration
 */
function scheduleTokenRefresh(expiresInMs: number): void {
    if (!browser) return;

    // Clear existing timer
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    // Calculate refresh time (expiresInMs - REFRESH_BUFFER)
    const refreshInMs = Math.max(0, expiresInMs - REFRESH_BUFFER_MS);

    console.log(
        `[Auth] Scheduling token refresh in ${Math.round(refreshInMs / 1000)}s`,
    );

    refreshTimer = setTimeout(async () => {
        console.log("[Auth] Auto-refreshing token...");
        const currentRefreshToken = get(refreshTokenStore);
        if (currentRefreshToken) {
            try {
                await performTokenRefresh(currentRefreshToken);
            } catch (err) {
                console.error("[Auth] Auto-refresh failed:", err);
                logout();
            }
        }
    }, refreshInMs);
}

/**
 * Perform token refresh
 */
async function performTokenRefresh(currentRefreshToken: string): Promise<void> {
    try {
        const response = await refreshToken(currentRefreshToken);

        // Update stores
        accessToken.set(response.access_token);
        refreshTokenStore.set(response.refresh_token);

        // Calculate expiration timestamp
        const expiresAt = Date.now() + response.expires_in * 1000;
        tokenExpiresAt.set(expiresAt);

        // Persist to localStorage
        if (browser) {
            localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
            localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
            localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString());
        }

        // Schedule next refresh
        scheduleTokenRefresh(response.expires_in * 1000);

        console.log("[Auth] Token refreshed successfully");
    } catch (err) {
        console.error("[Auth] Token refresh failed:", err);
        throw err;
    }
}

/**
 * Save token pair to storage and schedule refresh
 */
function saveTokenPair(tokens: TokenPair, user: User): void {
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Update stores
    accessToken.set(tokens.access_token);
    refreshTokenStore.set(tokens.refresh_token);
    tokenExpiresAt.set(expiresAt);
    authUser.set(user);

    // Persist to localStorage
    if (browser) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString());
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    // Schedule automatic refresh
    scheduleTokenRefresh(tokens.expires_in * 1000);
}

/**
 * Clear all auth state
 */
function clearAuthState(): void {
    accessToken.set(null);
    refreshTokenStore.set(null);
    tokenExpiresAt.set(0);
    authUser.set(null);
    authError.set(null);

    // Clear timer
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    // Clear localStorage
    if (browser) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

/**
 * Login with credentials
 */
export async function login(credentials: LoginCredentials): Promise<boolean> {
    authLoading.set(true);
    authError.set(null);

    try {
        const response = await apiLogin(credentials);

        // Create user from response (we'll extract user info from token or use defaults)
        const user: User = {
            id: "unknown", // Will be extracted from token if possible
            username: credentials.username,
            role: credentials.username === "admin" ? "Admin" : "User",
        };

        saveTokenPair(response, user);

        return true;
    } catch (err) {
        authError.set(err instanceof Error ? err.message : "Login failed");
        return false;
    } finally {
        authLoading.set(false);
    }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
    const currentRefreshToken = get(refreshTokenStore);

    // Call logout endpoint if we have a refresh token
    if (currentRefreshToken) {
        try {
            await apiLogout(currentRefreshToken);
            console.log("[Auth] Logout successful on server");
        } catch (err) {
            console.error("[Auth] Server logout failed:", err);
            // Continue with client-side logout even if server fails
        }
    }

    clearAuthState();
}

/**
 * Validate current token and refresh if needed
 */
export async function checkAuth(): Promise<boolean> {
    const currentAccessToken = get(accessToken);
    const currentRefreshToken = get(refreshTokenStore);
    const expiresAt = get(tokenExpiresAt);

    if (!currentAccessToken || !currentRefreshToken) {
        return false;
    }

    // Check if token is expired or about to expire
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= REFRESH_BUFFER_MS) {
        // Token is expired or about to expire, try to refresh
        console.log(
            "[Auth] Token expired or expiring soon, attempting refresh...",
        );
        try {
            await performTokenRefresh(currentRefreshToken);
            return true;
        } catch {
            clearAuthState();
            return false;
        }
    }

    // Token is still valid, validate it
    try {
        const isValid = await validateToken(currentAccessToken);

        if (!isValid) {
            // Token invalid, try refresh
            try {
                await performTokenRefresh(currentRefreshToken);
                return true;
            } catch {
                clearAuthState();
                return false;
            }
        }

        // Schedule refresh if not already scheduled
        if (!refreshTimer && timeUntilExpiry > REFRESH_BUFFER_MS) {
            scheduleTokenRefresh(timeUntilExpiry);
        }

        return true;
    } catch {
        clearAuthState();
        return false;
    }
}

/**
 * Get current access token for API calls
 */
export function getAccessToken(): string | null {
    return get(accessToken);
}

/**
 * Clear error state
 */
export function clearAuthError(): void {
    authError.set(null);
}

// Convenience object for easier imports
export const auth = {
    token: accessToken,
    refreshToken: refreshTokenStore,
    user: authUser,
    isLoading: authLoading,
    error: authError,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    getAccessToken,
    clearError: clearAuthError,
};

// Backward compatibility - authToken is now accessToken
export const authToken = accessToken;
