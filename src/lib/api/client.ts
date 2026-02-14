/**
 * JSON-RPC 2.0 API Client for Sensor Platform
 * Implements the OpenRPC specification from /docs/openrpc.json
 *
 * This client connects to the sensor-service backend running on localhost:8080
 *
 * Features:
 * - Automatic retry with exponential backoff on rate limiting (HTTP 429)
 * - Configurable preemptive throttling when approaching rate limits
 * - Rate limit state tracking from response headers
 */

import type {
    SensorInfo,
    SensorData,
    SensorDataBatch,
    SensorStatistics,
    BatchQuery,
    JsonRpcRequest,
    JsonRpcResponse,
    LoginCredentials,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    LogoutRequest,
    LogoutResponse,
    RateLimitState,
    RateLimitInfo,
    RetryConfig,
    ThrottlingConfig,
} from "./types";
import { DEFAULT_RETRY_CONFIG, DEFAULT_THROTTLING_CONFIG } from "./types";

// API Configuration
const API_BASE_URL = "http://localhost:8080";
const RPC_ENDPOINT = `${API_BASE_URL}/rpc`;

export { API_BASE_URL, RPC_ENDPOINT };

/**
 * Maximum number of requests allowed in a single JSON-RPC batch request.
 *
 * This limit is enforced by the server (sensor-service). Requests exceeding
 * this limit will result in a server error. The client automatically handles
 * this by chunking large requests into multiple batch calls.
 *
 * See: https://www.jsonrpc.org/specification#batch
 */
export const MAX_BATCH_SIZE = 16;

// Global rate limit state
let currentRateLimitState: RateLimitState = {
    limit: null,
    remaining: null,
    resetTime: null,
};

// Configuration
let retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG };
let throttlingConfig: ThrottlingConfig = { ...DEFAULT_THROTTLING_CONFIG };

/**
 * Update retry configuration
 */
export function setRetryConfig(config: Partial<RetryConfig>): void {
    retryConfig = { ...retryConfig, ...config };
    console.info("[API Client] Retry configuration updated:", retryConfig);
}

/**
 * Get current retry configuration
 */
export function getRetryConfig(): RetryConfig {
    return { ...retryConfig };
}

/**
 * Update throttling configuration
 */
export function setThrottlingConfig(config: Partial<ThrottlingConfig>): void {
    throttlingConfig = { ...throttlingConfig, ...config };
    console.info(
        "[API Client] Throttling configuration updated:",
        throttlingConfig,
    );
}

/**
 * Get current throttling configuration
 */
export function getThrottlingConfig(): ThrottlingConfig {
    return { ...throttlingConfig };
}

/**
 * Get current rate limit state
 */
export function getRateLimitState(): RateLimitState {
    return { ...currentRateLimitState };
}

/**
 * Check if we're approaching the rate limit
 */
export function isApproachingRateLimit(threshold = 5): boolean {
    return (
        currentRateLimitState.remaining !== null &&
        currentRateLimitState.remaining < threshold
    );
}

/**
 * Validate access token by making a test request
 */
export async function validateToken(token: string): Promise<boolean> {
    try {
        // Try to list sensors as a validation check
        await listUserSensors(token);
        return true;
    } catch {
        return false;
    }
}

/**
 * Fetch OpenRPC specification
 */
export async function getOpenRpcSpec(): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/openrpc.json`);
    if (!response.ok) {
        throw new Error(`Failed to fetch OpenRPC spec: ${response.status}`);
    }
    return response.json();
}

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

/**
 * Authenticate user and get token pair
 * POST /auth/login
 */
export async function login(
    credentials: LoginCredentials,
): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: "Login failed" }));
        throw new Error(error.message || "Authentication failed");
    }

    return response.json();
}

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 */
export async function refreshToken(
    refreshToken: string,
): Promise<RefreshResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken } as RefreshRequest),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: "Token refresh failed" }));
        throw new Error(error.message || "Token refresh failed");
    }

    return response.json();
}

/**
 * Logout user and invalidate refresh token
 * POST /auth/logout
 */
export async function logout(refreshToken: string): Promise<LogoutResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken } as LogoutRequest),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: "Logout failed" }));
        throw new Error(error.message || "Logout failed");
    }

    return response.json();
}

// =============================================================================
// RATE LIMITING HELPERS
// =============================================================================

/**
 * Parse rate limit headers from response
 *
 * Supports both standard X-RateLimit-* headers and IETF draft RateLimit-* headers.
 */
function parseRateLimitHeaders(headers: Headers): RateLimitState {
    // Try standard X-RateLimit-* headers first, then IETF draft RateLimit-*
    const limit =
        headers.get("x-ratelimit-limit") || headers.get("ratelimit-limit");
    const remaining =
        headers.get("x-ratelimit-remaining") ||
        headers.get("ratelimit-remaining");
    const resetTime =
        headers.get("x-ratelimit-reset") || headers.get("ratelimit-reset");

    return {
        limit: limit ? parseInt(limit, 10) : null,
        remaining: remaining ? parseInt(remaining, 10) : null,
        resetTime: resetTime ? parseInt(resetTime, 10) : null,
    };
}

/**
 * Calculate delay for retry with exponential backoff and jitter
 */
function calculateRetryDelay(
    attempt: number,
    retryAfter: number | null,
): number {
    // Use server-provided retry-after if available
    let baseDelay: number;
    if (retryAfter !== null && retryAfter > 0) {
        baseDelay = retryAfter * 1000; // Convert to ms
    } else if (retryConfig.useExponentialBackoff) {
        // Exponential backoff: baseDelay * 2^attempt
        baseDelay = retryConfig.baseDelayMs * Math.pow(2, attempt);
    } else {
        // Fixed delay
        baseDelay = retryConfig.baseDelayMs;
    }

    // Cap at max delay
    baseDelay = Math.min(baseDelay, retryConfig.maxDelayMs);

    // Add jitter (±25%) to prevent thundering herd
    if (retryConfig.useJitter) {
        const jitter = Math.random() * 0.5 - 0.25;
        baseDelay = Math.floor(baseDelay * (1 + jitter));
    }

    return baseDelay;
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// JSON-RPC HELPERS
// =============================================================================

/**
 * Generate unique request ID
 */
let requestId = 0;
function getRequestId(): number {
    return ++requestId;
}

/**
 * Build JSON-RPC request
 */
function buildRequest<T>(method: string, params: T): JsonRpcRequest<T> {
    return {
        jsonrpc: "2.0",
        method,
        params,
        id: getRequestId(),
    };
}

/**
 * Execute multiple JSON-RPC calls in a single batch request
 *
 * This is more efficient than making individual calls when you need
 * data from multiple sources, as it uses JSON-RPC batch requests
 * to reduce HTTP overhead and better utilizes rate limits.
 */
async function executeBatchRpcCall<TResponse>(
    requests: JsonRpcRequest<unknown>[],
    token: string | null,
): Promise<TResponse[]> {
    if (requests.length === 0) {
        return [];
    }

    // Apply preemptive throttling if enabled and approaching limit
    if (
        throttlingConfig.enabled &&
        isApproachingRateLimit(throttlingConfig.threshold)
    ) {
        const throttleDelay =
            retryConfig.baseDelayMs * throttlingConfig.slowDownFactor;
        console.debug(
            `[API Client] Preemptive throttling: waiting ${throttleDelay}ms before batch request`,
        );
        await sleep(throttleDelay);
    }

    let attempt = 0;

    while (true) {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(RPC_ENDPOINT, {
                method: "POST",
                headers,
                body: JSON.stringify(requests),
            });

            // Parse rate limit headers from response
            const rateLimitState = parseRateLimitHeaders(response.headers);
            currentRateLimitState = rateLimitState;

            // Log rate limit state for debugging
            if (rateLimitState.remaining !== null) {
                console.debug(
                    `[API Client] Rate limit: ${rateLimitState.remaining}/${rateLimitState.limit} remaining`,
                );
            }

            // Check for rate limiting (HTTP 429)
            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");
                const retryAfterSeconds = retryAfter
                    ? parseInt(retryAfter, 10)
                    : null;

                const rateLimitInfo: RateLimitInfo = {
                    retryAfter: retryAfterSeconds,
                    state: rateLimitState,
                    attempt,
                };

                // Check if we should retry
                if (attempt < retryConfig.maxRetries) {
                    const delay = calculateRetryDelay(
                        attempt,
                        retryAfterSeconds,
                    );

                    console.info(
                        `[API Client] Rate limited on batch request (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). ` +
                            `Retrying after ${delay}ms...`,
                        rateLimitInfo,
                    );

                    await sleep(delay);
                    attempt++;
                    continue;
                } else {
                    // Max retries exceeded
                    console.error(
                        `[API Client] Rate limit exceeded after ${attempt + 1} attempts on batch request`,
                        rateLimitInfo,
                    );
                    throw new Error(
                        `Rate limit exceeded. Please wait ${retryAfterSeconds || 60} seconds before retrying.`,
                    );
                }
            }

            // Handle other HTTP errors
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rpcResponses: JsonRpcResponse<TResponse>[] =
                await response.json();

            const results: TResponse[] = [];
            for (const rpcResponse of rpcResponses) {
                if (rpcResponse.error) {
                    throw new Error(
                        `RPC Error ${rpcResponse.error.code}: ${rpcResponse.error.message}`,
                    );
                }

                if (rpcResponse.result === undefined) {
                    throw new Error("RPC response missing result");
                }

                results.push(rpcResponse.result);
            }

            // Log successful request after retries
            if (attempt > 0) {
                console.info(
                    `[API Client] Batch request succeeded after ${attempt + 1} attempts`,
                );
            }

            return results;
        } catch (error) {
            // Re-throw non-rate-limit errors immediately
            if (
                error instanceof Error &&
                !error.message.includes("Rate limit")
            ) {
                throw error;
            }
            // Re-throw rate limit errors if max retries exceeded
            if (attempt >= retryConfig.maxRetries) {
                throw error;
            }
            // Otherwise, let the loop continue to retry
            console.debug(`[API Client] Retrying after error: ${error}`);
        }
    }
}

/**
 * Execute JSON-RPC call with automatic retry on rate limiting
 */
async function executeRpcCall<TRequest, TResponse>(
    method: string,
    params: TRequest,
    token: string | null,
): Promise<TResponse> {
    // Apply preemptive throttling if enabled and approaching limit
    if (
        throttlingConfig.enabled &&
        isApproachingRateLimit(throttlingConfig.threshold)
    ) {
        const throttleDelay =
            retryConfig.baseDelayMs * throttlingConfig.slowDownFactor;
        console.debug(
            `[API Client] Preemptive throttling: waiting ${throttleDelay}ms before ${method}`,
        );
        await sleep(throttleDelay);
    }

    const request = buildRequest(method, params);
    let attempt = 0;

    while (true) {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(RPC_ENDPOINT, {
                method: "POST",
                headers,
                body: JSON.stringify(request),
            });

            // Parse rate limit headers from response
            const rateLimitState = parseRateLimitHeaders(response.headers);
            currentRateLimitState = rateLimitState;

            // Log rate limit state for debugging
            if (rateLimitState.remaining !== null) {
                console.debug(
                    `[API Client] Rate limit: ${rateLimitState.remaining}/${rateLimitState.limit} remaining`,
                );
            }

            // Check for rate limiting (HTTP 429)
            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");
                const retryAfterSeconds = retryAfter
                    ? parseInt(retryAfter, 10)
                    : null;

                const rateLimitInfo: RateLimitInfo = {
                    retryAfter: retryAfterSeconds,
                    state: rateLimitState,
                    attempt,
                };

                // Check if we should retry
                if (attempt < retryConfig.maxRetries) {
                    const delay = calculateRetryDelay(
                        attempt,
                        retryAfterSeconds,
                    );

                    console.info(
                        `[API Client] Rate limited on ${method} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). ` +
                            `Retrying after ${delay}ms...`,
                        rateLimitInfo,
                    );

                    await sleep(delay);
                    attempt++;
                    continue;
                } else {
                    // Max retries exceeded
                    console.error(
                        `[API Client] Rate limit exceeded after ${attempt + 1} attempts on ${method}`,
                        rateLimitInfo,
                    );
                    throw new Error(
                        `Rate limit exceeded. Please wait ${retryAfterSeconds || 60} seconds before retrying.`,
                    );
                }
            }

            // Handle other HTTP errors
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rpcResponse: JsonRpcResponse<TResponse> =
                await response.json();

            if (rpcResponse.error) {
                throw new Error(
                    `RPC Error ${rpcResponse.error.code}: ${rpcResponse.error.message}`,
                );
            }

            if (rpcResponse.result === undefined) {
                throw new Error("RPC response missing result");
            }

            // Log successful request after retries
            if (attempt > 0) {
                console.info(
                    `[API Client] Request succeeded after ${attempt + 1} attempts: ${method}`,
                );
            }

            return rpcResponse.result;
        } catch (error) {
            // Re-throw non-rate-limit errors immediately
            if (
                error instanceof Error &&
                !error.message.includes("Rate limit")
            ) {
                throw error;
            }
            // Re-throw rate limit errors if max retries exceeded
            if (attempt >= retryConfig.maxRetries) {
                throw error;
            }
            // Otherwise, let the loop continue to retry
            console.debug(`[API Client] Retrying after error: ${error}`);
        }
    }
}

// =============================================================================
// API CLIENT METHODS
// =============================================================================

/**
 * List all sensors accessible to the user
 * OpenRPC Method: sensor.listUserSensors
 */
export async function listUserSensors(token: string): Promise<SensorInfo[]> {
    return executeRpcCall<null, SensorInfo[]>(
        "sensor.listUserSensors",
        null,
        token,
    );
}

/**
 * Get latest measurement for a sensor
 * OpenRPC Method: sensor.getData
 */
export async function getData(
    sensorId: string,
    token: string,
): Promise<SensorData> {
    return executeRpcCall<{ sensor_id: string }, SensorData>(
        "sensor.getData",
        { sensor_id: sensorId },
        token,
    );
}

/**
 * Get batch data for a sensor
 * OpenRPC Method: sensor.getDataBatch
 */
export async function getDataBatch(
    sensorId: string,
    query: BatchQuery,
    token: string,
): Promise<SensorDataBatch> {
    return executeRpcCall<
        { sensor_id: string; query?: BatchQuery },
        SensorDataBatch
    >("sensor.getDataBatch", { sensor_id: sensorId, query }, token);
}

/**
 * Get statistics for a sensor
 * OpenRPC Method: sensor.getStatistics
 */
export async function getStatistics(
    sensorId: string,
    window: string,
    token: string,
): Promise<SensorStatistics> {
    return executeRpcCall<
        { sensor_id: string; window: string },
        SensorStatistics
    >("sensor.getStatistics", { sensor_id: sensorId, window }, token);
}

/**
 * Get latest measurement for multiple sensors in a single batch request
 * OpenRPC Method: sensor.getData (batch)
 *
 * This is more efficient than making individual calls when you need
 * data from multiple sensors, as it uses JSON-RPC batch requests
 * to reduce HTTP overhead and better utilizes rate limits.
 *
 * @param sensorIds - Array of sensor IDs to fetch
 * @param token - Authentication token
 * @returns Array of SensorData in the same order as input sensorIds
 */
export async function getDataForSensors(
    sensorIds: string[],
    token: string,
): Promise<SensorData[]> {
    if (sensorIds.length === 0) {
        return [];
    }

    const allResults: SensorData[] = [];

    for (let i = 0; i < sensorIds.length; i += MAX_BATCH_SIZE) {
        const chunk = sensorIds.slice(i, i + MAX_BATCH_SIZE);
        const requests = chunk.map((sensorId) =>
            buildRequest("sensor.getData", { sensor_id: sensorId }),
        );

        const chunkResults = await executeBatchRpcCall<SensorData>(
            requests,
            token,
        );
        allResults.push(...chunkResults);
    }

    return allResults;
}

/**
 * Get batch data for multiple sensors in a single batch request
 * OpenRPC Method: sensor.getDataBatch (batch)
 *
 * @param sensorIds - Array of sensor IDs to fetch
 * @param query - Batch query parameters
 * @param token - Authentication token
 * @returns Array of SensorDataBatch in the same order as input sensorIds
 */
export async function getDataBatchForSensors(
    sensorIds: string[],
    query: BatchQuery,
    token: string,
): Promise<SensorDataBatch[]> {
    if (sensorIds.length === 0) {
        return [];
    }

    const allResults: SensorDataBatch[] = [];

    for (let i = 0; i < sensorIds.length; i += MAX_BATCH_SIZE) {
        const chunk = sensorIds.slice(i, i + MAX_BATCH_SIZE);
        const requests = chunk.map((sensorId) =>
            buildRequest("sensor.getDataBatch", { sensor_id: sensorId, query }),
        );

        const chunkResults = await executeBatchRpcCall<SensorDataBatch>(
            requests,
            token,
        );
        allResults.push(...chunkResults);
    }

    return allResults;
}
