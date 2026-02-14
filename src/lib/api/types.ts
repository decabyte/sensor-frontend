/**
 * API Types for Sensor Platform
 * Types derived from OpenRPC specification
 *
 * This file contains all types that correspond to the OpenRPC specification
 * and are used by the JSON-RPC client.
 */

// =============================================================================
// SENSOR TYPES
// =============================================================================

export type SensorType =
    | "temperature"
    | "pressure"
    | "length"
    | "mass"
    | "volume"
    | "humidity";

export type SensorValue =
    | { type: "temperature"; celsius: number }
    | { type: "pressure"; pascals: number }
    | { type: "length"; meters: number }
    | { type: "mass"; kilograms: number }
    | { type: "volume"; cubic_meters: number }
    | { type: "humidity"; percent: number };

export type BatchOrder = "newest" | "oldest";

export interface SensorInfo {
    id: string;
    owner_id: string;
    sensor_type: SensorType;
    name: string;
    location: string | null;
}

export interface SensorData {
    sensor_id: string;
    value: SensorValue;
    timestamp: string;
}

export interface BatchQuery {
    max_values?: number;
    min_timestamp?: string;
    order?: BatchOrder;
}

export interface SensorDataBatch {
    sensor_id: string;
    base_timestamp: string;
    values: number[];
    timestamp_offsets_sec: number[];
}

export interface StatisticsWindowInfo {
    from: string;
    to: string;
    count: number;
}

export interface StatisticsValues {
    average: number;
    weighted_average: number;
    median: number;
    min: number;
    max: number;
    std_dev: number;
    unit: string;
}

export interface SensorStatistics {
    sensor_id: string;
    window: StatisticsWindowInfo;
    statistics: StatisticsValues;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export type Role = "Admin" | "User";

export interface User {
    id: string;
    username: string;
    role: Role;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface TokenPair {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface RefreshRequest {
    refresh_token: string;
}

export interface RefreshResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface LogoutRequest {
    refresh_token: string;
}

export interface LogoutResponse {
    message: string;
}

export interface AuthErrorResponse {
    error: string;
    message: string;
}

// =============================================================================
// JSON-RPC TYPES
// =============================================================================

export interface JsonRpcRequest<T = unknown> {
    jsonrpc: "2.0";
    method: string;
    params?: T;
    id: number | string;
}

export interface JsonRpcResponse<T = unknown> {
    jsonrpc: "2.0";
    result?: T;
    error?: JsonRpcError;
    id: number | string | null;
}

export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

export const JsonRpcErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    BATCH_TOO_LARGE: -32000,
} as const;

// =============================================================================
// RATE LIMITING TYPES
// =============================================================================

export interface RateLimitState {
    limit: number | null;
    remaining: number | null;
    resetTime: number | null;
}

export interface RateLimitInfo {
    retryAfter: number | null;
    state: RateLimitState;
    attempt: number;
}

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    useExponentialBackoff: boolean;
    useJitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    useExponentialBackoff: true,
    useJitter: true,
};

export const NO_RETRY_CONFIG: RetryConfig = {
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    useExponentialBackoff: false,
    useJitter: false,
};

export interface ThrottlingConfig {
    enabled: boolean;
    threshold: number;
    slowDownFactor: number;
}

export const DEFAULT_THROTTLING_CONFIG: ThrottlingConfig = {
    enabled: false,
    threshold: 5,
    slowDownFactor: 2,
};
