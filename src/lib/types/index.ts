/**
 * TypeScript types for Sensor Frontend
 * Types specifically for the frontend (not from OpenRPC)
 */

import type {
    SensorType,
    SensorData,
    SensorDataBatch,
    SensorValue,
} from "../api/types";
export type {
    SensorType,
    SensorData,
    SensorDataBatch,
    SensorValue,
} from "../api/types";

/**
 * Theme type
 */
export type Theme = "light" | "dark" | "system";

/**
 * Refresh interval in milliseconds
 */
export type RefreshInterval = 1000 | 2000 | 5000 | 10000 | 30000 | 60000;

/**
 * Chart data point for Lightweight Charts
 */
export interface ChartDataPoint {
    time: number; // Unix timestamp in seconds
    value: number;
}

/**
 * Helper function to get display value from SensorValue
 */
export function getSensorValueDisplay(value: SensorValue): {
    value: number;
    unit: string;
} {
    switch (value.type) {
        case "temperature":
            return { value: value.celsius, unit: "°C" };
        case "pressure":
            return { value: value.pascals, unit: "Pa" };
        case "length":
            return { value: value.meters, unit: "m" };
        case "mass":
            return { value: value.kilograms, unit: "kg" };
        case "volume":
            return { value: value.cubic_meters, unit: "m³" };
        case "humidity":
            return { value: value.percent, unit: "%" };
    }
}

/**
 * Helper function to format SensorValue as string
 */
export function formatSensorValue(value: SensorValue): string {
    const { value: num, unit } = getSensorValueDisplay(value);
    return `${num.toFixed(2)} ${unit}`;
}

/**
 * Helper function to get unit for sensor type
 */
export function getUnitForSensorType(type: SensorType): string {
    switch (type) {
        case "temperature":
            return "°C";
        case "pressure":
            return "Pa";
        case "length":
            return "m";
        case "mass":
            return "kg";
        case "volume":
            return "m³";
        case "humidity":
            return "%";
    }
}

/**
 * Convert SensorDataBatch to array of SensorData
 */
export function batchToSensorData(
    batch: SensorDataBatch,
    sensorType: SensorType,
): SensorData[] {
    const baseTime = new Date(batch.base_timestamp).getTime();

    return batch.values.map((value, index) => {
        const offsetMs = batch.timestamp_offsets_sec[index] * 1000;
        const timestamp = new Date(baseTime + offsetMs).toISOString();

        let sensorValue: SensorValue;
        switch (sensorType) {
            case "temperature":
                sensorValue = { type: "temperature", celsius: value };
                break;
            case "pressure":
                sensorValue = { type: "pressure", pascals: value };
                break;
            case "length":
                sensorValue = { type: "length", meters: value };
                break;
            case "mass":
                sensorValue = { type: "mass", kilograms: value };
                break;
            case "volume":
                sensorValue = { type: "volume", cubic_meters: value };
                break;
            case "humidity":
                sensorValue = { type: "humidity", percent: value };
                break;
        }

        return {
            sensor_id: batch.sensor_id,
            value: sensorValue,
            timestamp,
        };
    });
}
