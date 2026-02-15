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
    Sun,
    Cloud,
    Users,
    Wind,
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
    light: Sun,
    co2: Cloud,
    occupancy: Users,
    motion: Activity,
    pm10: Wind,
    pm25: Wind,
    pm1: Wind,
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
    light: "text-amber-500 dark:text-amber-400",
    co2: "text-gray-500 dark:text-gray-400",
    occupancy: "text-indigo-500 dark:text-indigo-400",
    motion: "text-green-500 dark:text-green-400",
    pm10: "text-orange-500 dark:text-orange-400",
    pm25: "text-pink-500 dark:text-pink-400",
    pm1: "text-sky-500 dark:text-sky-400",
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
    light: "bg-amber-100 dark:bg-amber-900/30",
    co2: "bg-gray-100 dark:bg-gray-900/30",
    occupancy: "bg-indigo-100 dark:bg-indigo-900/30",
    motion: "bg-green-100 dark:bg-green-900/30",
    pm10: "bg-orange-100 dark:bg-orange-900/30",
    pm25: "bg-pink-100 dark:bg-pink-900/30",
    pm1: "bg-sky-100 dark:bg-sky-900/30",
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
