/**
 * Sensor Stores
 * Manages sensor data with real-time updates
 *
 * Features:
 * - Configurable refresh intervals (1s, 5s, 10s, 30s, 60s)
 * - Automatic polling with cleanup
 * - Sensor data cache
 * - Last 100 readings per sensor
 */

import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import {
    listUserSensors,
    getData,
    getDataBatch,
    getDataForSensors,
} from "../api/client";
import { getAccessToken, accessToken } from "./auth";
import { batchToSensorData } from "../types";
import type { SensorInfo, SensorData } from "../api/types";
import type { RefreshInterval } from "../types";

// Available refresh intervals
export const REFRESH_INTERVALS: { value: RefreshInterval; label: string }[] = [
    { value: 1000, label: "1s" },
    { value: 2000, label: "2s" },
    { value: 5000, label: "5s" },
    { value: 10000, label: "10s" },
    { value: 30000, label: "30s" },
    { value: 60000, label: "60s" },
];

const DEFAULT_REFRESH_INTERVAL: RefreshInterval = 5000;
const MAX_READINGS = 100;

/**
 * Individual sensor state
 */
interface SensorState {
    info: SensorInfo;
    latestData: SensorData | null;
    history: SensorData[];
    isLoading: boolean;
    lastUpdated: Date | null;
}

// Create stores
export const sensorsById = writable<Map<string, SensorState>>(new Map());
export const sensorsLoading = writable(false);
export const sensorsError = writable<string | null>(null);
export const refreshInterval = writable<RefreshInterval>(
    DEFAULT_REFRESH_INTERVAL,
);
export const autoRefreshEnabled = writable(true);
export const lastFetchTime = writable<Date | null>(null);

// Timer reference for cleanup
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Load all sensors
 */
export async function loadSensors(): Promise<void> {
    const token = getAccessToken();
    if (!token) {
        sensorsError.set("Not authenticated");
        return;
    }

    sensorsLoading.set(true);
    sensorsError.set(null);

    try {
        const sensorList = await listUserSensors(token);

        sensorsById.update((current) => {
            const newMap = new Map(current);
            for (const info of sensorList) {
                const existing = current.get(info.id);
                newMap.set(info.id, {
                    info,
                    latestData: existing?.latestData || null,
                    history: existing?.history || [],
                    isLoading: false,
                    lastUpdated: existing?.lastUpdated || null,
                });
            }
            return newMap;
        });

        lastFetchTime.set(new Date());
    } catch (err) {
        sensorsError.set(
            err instanceof Error ? err.message : "Failed to load sensors",
        );
    } finally {
        sensorsLoading.set(false);
    }
}

/**
 * Refresh data for a single sensor
 */
export async function refreshSensor(sensorId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) return;

    sensorsById.update((map) => {
        const sensor = map.get(sensorId);
        if (!sensor) return map;

        const newMap = new Map(map);
        newMap.set(sensorId, { ...sensor, isLoading: true });
        return newMap;
    });

    try {
        const data = await getData(sensorId, token);

        sensorsById.update((map) => {
            const sensor = map.get(sensorId);
            if (!sensor) return map;

            const newMap = new Map(map);
            newMap.set(sensorId, {
                ...sensor,
                latestData: data,
                history: [data, ...sensor.history].slice(0, MAX_READINGS),
                lastUpdated: new Date(),
                isLoading: false,
            });
            return newMap;
        });
    } catch (err) {
        sensorsById.update((map) => {
            const sensor = map.get(sensorId);
            if (sensor) {
                const newMap = new Map(map);
                newMap.set(sensorId, { ...sensor, isLoading: false });
                return newMap;
            }
            return map;
        });
        console.error(`Failed to refresh sensor ${sensorId}:`, err);
    }
}

/**
 * Load historical data for a sensor (up to 100 readings)
 */
export async function loadSensorHistory(sensorId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) return;

    const sensors = get(sensorsById);
    const sensor = sensors.get(sensorId);
    if (!sensor) return;

    const sensorType = sensor.info.sensor_type;

    try {
        const batch = await getDataBatch(
            sensorId,
            {
                max_values: MAX_READINGS,
                order: "oldest",
            },
            token,
        );

        const history = batchToSensorData(batch, sensorType);

        sensorsById.update((map) => {
            const sensor = map.get(sensorId);
            if (!sensor) return map;

            const newMap = new Map(map);
            newMap.set(sensorId, {
                ...sensor,
                history,
                latestData: history.length > 0 ? history[0] : null,
            });
            return newMap;
        });
        console.debug(`History loaded for sensor: ${sensorId}`);
    } catch (err) {
        console.error(`Failed to load history for sensor ${sensorId}:`, err);
    }
}

/**
 * Refresh all sensors using batch request for efficiency
 */
export async function refreshAllSensors(): Promise<void> {
    const token = getAccessToken();
    if (!token) return;

    const sensors = get(sensorsById);
    const sensorIds = Array.from(sensors.keys());

    if (sensorIds.length === 0) return;

    sensorsById.update((map) => {
        const newMap = new Map(map);
        for (const [id, sensor] of newMap) {
            newMap.set(id, { ...sensor, isLoading: true });
        }
        return newMap;
    });

    try {
        const dataList = await getDataForSensors(sensorIds, token);

        sensorsById.update((map) => {
            const newMap = new Map(map);
            for (let i = 0; i < sensorIds.length; i++) {
                const sensorId = sensorIds[i];
                const data = dataList[i];
                const sensor = newMap.get(sensorId);
                if (sensor) {
                    newMap.set(sensorId, {
                        ...sensor,
                        latestData: data || null,
                        history: data
                            ? [data, ...sensor.history].slice(0, MAX_READINGS)
                            : sensor.history,
                        lastUpdated: data ? new Date() : sensor.lastUpdated,
                        isLoading: false,
                    });
                }
            }
            return newMap;
        });

        lastFetchTime.set(new Date());
    } catch (err) {
        sensorsById.update((map) => {
            const newMap = new Map(map);
            for (const [id, sensor] of newMap) {
                newMap.set(id, { ...sensor, isLoading: false });
            }
            return newMap;
        });
        console.error("Failed to refresh all sensors:", err);
    }
}

/**
 * Set refresh interval
 */
export function setRefreshInterval(interval: RefreshInterval): void {
    refreshInterval.set(interval);
    // Restart auto-refresh with new interval
    const isEnabled = get(autoRefreshEnabled);
    if (isEnabled) {
        startAutoRefresh();
    }
}

/**
 * Toggle auto-refresh
 */
export function toggleAutoRefresh(): void {
    autoRefreshEnabled.update((enabled) => {
        const newValue = !enabled;
        if (newValue) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
        return newValue;
    });
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh(): void {
    // Clear existing timer
    stopAutoRefresh();

    if (!browser) return;

    const isEnabled = get(autoRefreshEnabled);
    if (!isEnabled) return;

    const interval = get(refreshInterval);

    // Start new timer
    refreshTimer = setInterval(() => {
        refreshAllSensors();
    }, interval);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh(): void {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

/**
 * Clear error state
 */
export function clearSensorsError(): void {
    sensorsError.set(null);
}

/**
 * Cleanup on destroy
 */
export function destroySensorsStore(): void {
    stopAutoRefresh();
}

// Auto-refresh subscription
if (browser) {
    // Start auto-refresh when auth token is available
    accessToken.subscribe((token) => {
        if (token && get(autoRefreshEnabled)) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });

    // Restart on interval change
    refreshInterval.subscribe(() => {
        if (get(autoRefreshEnabled)) {
            startAutoRefresh();
        }
    });
}

// Convenience object for easier imports
export const sensors = {
    byId: sensorsById,
    isLoading: sensorsLoading,
    error: sensorsError,
    refreshInterval,
    isAutoRefreshEnabled: autoRefreshEnabled,
    lastFetchTime,
    REFRESH_INTERVALS,
    loadSensors,
    refreshSensor,
    refreshAll: refreshAllSensors,
    loadSensorHistory,
    setRefreshInterval,
    toggleAutoRefresh,
    clearError: clearSensorsError,
    destroy: destroySensorsStore,
};
