/**
 * Sensor Type to Lucide Icon Mapping
 * Maps each sensor type to an appropriate Lucide icon component
 */

import type { SvelteComponent } from "svelte";
import {
    Thermometer,
    Gauge,
    Ruler,
    Weight,
    Box,
    Droplets,
    Activity,
} from "lucide-svelte";
import type { SensorType } from "../api/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = typeof SvelteComponent<any, any, any>;

/**
 * Map sensor types to Lucide icon components
 */
export const sensorTypeIcons: Record<SensorType, IconComponent> = {
    temperature: Thermometer,
    pressure: Gauge,
    length: Ruler,
    mass: Weight,
    volume: Box,
    humidity: Droplets,
};

/**
 * Map sensor types to colors (for UI theming)
 */
export const sensorTypeColors: Record<SensorType, string> = {
    temperature: "text-red-500 dark:text-red-400",
    pressure: "text-blue-500 dark:text-blue-400",
    length: "text-green-500 dark:text-green-400",
    mass: "text-yellow-500 dark:text-yellow-400",
    volume: "text-purple-500 dark:text-purple-400",
    humidity: "text-cyan-500 dark:text-cyan-400",
};

/**
 * Map sensor types to background colors
 */
export const sensorTypeBgColors: Record<SensorType, string> = {
    temperature: "bg-red-100 dark:bg-red-900/30",
    pressure: "bg-blue-100 dark:bg-blue-900/30",
    length: "bg-green-100 dark:bg-green-900/30",
    mass: "bg-yellow-100 dark:bg-yellow-900/30",
    volume: "bg-purple-100 dark:bg-purple-900/30",
    humidity: "bg-cyan-100 dark:bg-cyan-900/30",
};

/**
 * Get icon component for sensor type
 */
export function getSensorIcon(type: SensorType): IconComponent {
    return sensorTypeIcons[type] || Activity;
}

/**
 * Get color class for sensor type
 */
export function getSensorColor(type: SensorType): string {
    return sensorTypeColors[type] || "text-gray-500";
}

/**
 * Get background color class for sensor type
 */
export function getSensorBgColor(type: SensorType): string {
    return sensorTypeBgColors[type] || "bg-gray-100";
}

/**
 * Format sensor type for display
 */
export function formatSensorType(type: SensorType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
}
