# Sensor Frontend

A modern web interface for the Sensor Platform, built with Svelte 5, TypeScript, and Tailwind CSS. This frontend provides real-time sensor monitoring, data visualization, and platform management capabilities.

## Features

- **Real-time Sensor Monitoring**: Live data updates with configurable refresh intervals (1s, 5s, 10s, 30s, 60s)
- **Interactive Charts**: Time-series visualization using Lightweight Charts (TradingView)
- **Dark/Light/System Themes**: User-selectable color scheme with system preference detection
- **OpenRPC Compliance**: JSON-RPC 2.0 client matching the sensor-service API specification
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **TypeScript**: Full type safety with strict mode enabled
- **Modern Stack**: Svelte 5 runes, Bun runtime, Vite bundler

## Technology Stack

- **Framework**: Svelte 5 + SvelteKit 2
- **Language**: TypeScript 5 (strict mode)
- **Package Manager**: Bun
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide (native Svelte 5 components)
- **Charts**: Lightweight Charts (TradingView)
- **State Management**: Svelte stores (writable/derived)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed on your system
- Sensor Platform backend running on `http://localhost:8080`

### Installation

```bash
# From the sensor-platform-rs directory
cd sensor-frontend

# Install dependencies
bun install

# Start development server
bun run dev
```

The application will be available at `http://localhost:5173`

### Demo Credentials

For development, use these mock credentials:

- **Username**: `admin`
- **Password**: `admin`

## Project Structure

```plain
sensor-frontend/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts          # JSON-RPC API client
│   │   ├── components/
│   │   │   ├── layout/            # Header, Sidebar
│   │   │   └── charts/            # Chart components
│   │   ├── stores/
│   │   │   ├── auth.ts            # Authentication state
│   │   │   ├── theme.ts           # Theme management
│   │   │   └── sensors.ts         # Sensor data & real-time updates
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types (OpenRPC spec)
│   │   └── utils/
│   │       └── icons.ts           # Sensor type to Lucide icon mapping
│   ├── routes/
│   │   ├── +layout.svelte         # Root layout with auth check
│   │   ├── +page.svelte           # Login page
│   │   ├── dashboard/+page.svelte # Main dashboard
│   │   ├── sensors/+page.svelte   # Sensor list
│   │   └── sensors/[id]/+page.svelte # Sensor detail with charts
│   ├── app.html                   # HTML template
│   └── app.css                    # Tailwind CSS import
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

## OpenRPC API Implementation

This frontend implements the OpenRPC specification from `/docs/openrpc.json`. The API client in `src/lib/api/client.ts` provides methods matching the JSON-RPC interface:

### Methods

| Method                   | Description                           | Auth Required |
| ------------------------ | ------------------------------------- | ------------- |
| `sensor.listUserSensors` | List all accessible sensors           | Bearer Token  |
| `sensor.getData`         | Get latest measurement                | Bearer Token  |
| `sensor.getDataBatch`    | Get batch data (100 readings)         | Bearer Token  |
| `sensor.getStatistics`   | Get statistical analysis              | Bearer Token  |
| `getDataForSensors`      | Get data for multiple sensors (batch) | Bearer Token  |
| `getDataBatchForSensors` | Get batch data for multiple sensors   | Bearer Token  |

### TypeScript Types

All types are defined in `src/lib/types/index.ts` and match the OpenRPC schemas:

- `SensorInfo` - Sensor metadata
- `SensorData` - Individual reading with timestamp
- `SensorDataBatch` - Efficient batch format (100 readings)
- `SensorStatistics` - Statistical analysis results
- `SensorValue` - Discriminated union for typed values
- `BatchQuery` - Query parameters for batch requests

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_RPC_ENDPOINT=/rpc
```

### Refresh Intervals

Configure auto-refresh intervals in `src/lib/stores/sensors.svelte.ts`:

```typescript
export const REFRESH_INTERVALS = [
    { value: 1000, label: "1s" },
    { value: 5000, label: "5s" },
    { value: 10000, label: "10s" },
    { value: 30000, label: "30s" },
    { value: 60000, label: "60s" },
];
```

## Sensor Type Icons

Each sensor type maps to a Lucide icon:

| Sensor Type | Icon        | Color  |
| ----------- | ----------- | ------ |
| Temperature | Thermometer | Red    |
| Pressure    | Gauge       | Blue   |
| Length      | Ruler       | Green  |
| Mass        | Weight      | Yellow |
| Volume      | Box         | Purple |
| Humidity    | Droplets    | Cyan   |

## State Management

Uses standard Svelte stores for reactive state:

### Authentication Store

```typescript
// src/lib/stores/auth.ts
export const authToken = writable<string | null>(null);
export const authUser = writable<User | null>(null);
export const isAuthenticated = derived(authToken, ($token) => $token !== null);
```

### Theme Store

```typescript
// src/lib/stores/theme.ts
export const theme = writable<Theme>('dark');
export const systemTheme = writable<'light' | 'dark'>('light');
export const effectiveTheme = derived([theme, systemTheme], ...);
```

### Sensors Store

```typescript
// src/lib/stores/sensors.ts
export const sensorsList = writable<SensorState[]>([]);
export const refreshInterval = writable<RefreshInterval>(5000);
export const autoRefreshEnabled = writable(true);
```

## Development

### Available Scripts

```bash
# Development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run check

# Format code
bun run format

# Lint code
bun run lint
```

### Adding New Features

1. **New API Methods**: Add to `src/lib/api/client.ts` following OpenRPC spec
2. **New Types**: Add to `src/lib/types/index.ts` matching schemas
3. **New Routes**: Create in `src/routes/` following SvelteKit conventions
4. **New Components**: Add to `src/lib/components/`

## API Connection

The frontend now connects to the real **sensor-service** backend via JSON-RPC 2.0:

### Backend Requirements

- **sensor-service** must be running on `http://localhost:8080`
- The service provides the OpenRPC specification at `http://localhost:8080/openrpc.json`

### Authentication

The sensor-service uses simple Bearer token authentication:

- **Admin Token**: `admin_token` (full access to all sensors)
- **User Token**: `user_token` (access to owned sensors only)

The login page accepts these credentials:

- **Username**: `admin` → receives `admin_token`
- **Username**: `user` → receives `user_token`
- **Password**: must match username

### API Methods

All OpenRPC methods are implemented and connect to the live backend:

| Method                   | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `sensor.listUserSensors` | Lists sensors accessible to the authenticated user |
| `sensor.getData`         | Gets the latest reading for a specific sensor      |
| `sensor.getDataBatch`    | Retrieves batch data (up to 100 readings)          |
| `sensor.getStatistics`   | Calculates statistics over a time window           |
| `getDataForSensors`      | Gets latest data for multiple sensors (batch)      |
| `getDataBatchForSensors` | Gets batch data for multiple sensors               |

### Real-time Updates

The frontend polls the backend at configurable intervals:

- Default: 5 seconds
- Options: 1s, 5s, 10s, 30s, 60s
- Auto-refresh can be paused/resumed

## Chart Configuration

Charts use Lightweight Charts with the following features:

- **Time Scale**: Unix timestamps with seconds precision
- **Data Points**: Last 100 readings per sensor
- **Visualization**: Area chart with gradient fill
- **Responsive**: Auto-resizes with container
- **Dark Mode**: Automatic theme switching

Example configuration:

```typescript
const chart = createChart(container, {
    layout: {
        background: { color: "transparent" },
        textColor: isDark ? "#9ca3af" : "#4b5563",
    },
    timeScale: {
        timeVisible: true,
        secondsVisible: true,
    },
});
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires ES2020+ and native ES modules support.

## Related Documentation

- [OpenRPC Specification](../docs/openrpc.json)
- [Architecture Documentation](../docs/architecture.md)
- [Sensor Domain Types](../sensor-domain/src/entities.rs)
