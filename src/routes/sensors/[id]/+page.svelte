<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { loadSensors, loadSensorHistory, refreshSensor, setRefreshInterval, REFRESH_INTERVALS, refreshInterval, sensorsById } from '$lib/stores/sensors';
	import { getSensorIcon, formatSensorType } from '$lib/utils/icons';
	import { formatSensorValue, getUnitForSensorType } from '$lib/types';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import {
		ArrowLeft,
		RefreshCw,
		Activity,
		TrendingUp,
		TrendingDown,
		BarChart3
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { createChart, type IChartApi, type ISeriesApi, type Time, type SingleValueData, AreaSeries } from 'lightweight-charts';

	const sensorId = $derived(page.params.id ?? '');
	const sensorsMap = $derived($sensorsById);
	const sensor = $derived(sensorId ? sensorsMap.get(sensorId) : undefined);
	const isOnline = $derived(sensor && sensorId ? (sensor.latestData ? (Date.now() - new Date(sensor.latestData.timestamp).getTime() < 60000) : false) : false);

	// Chart refs
	let chartContainer = $state<HTMLElement | null>(null);
	let chart: IChartApi | null = null;
	let lineSeries: ISeriesApi<'Area'> | null = null;
	let resizeObserver: ResizeObserver | null = null;

	// Statistics
	const stats = $derived.by(() => {
		if (!sensor || sensor.history.length === 0) return null;

		const values = sensor.history.map(h => {
			switch (h.value.type) {
				case 'temperature': return h.value.celsius;
				case 'humidity': return h.value.percent;
				case 'pressure': return h.value.pascals;
				case 'length': return h.value.meters;
				case 'mass': return h.value.kilograms;
				case 'volume': return h.value.cubic_meters;
			}
		});

		const min = Math.min(...values);
		const max = Math.max(...values);
		const avg = values.reduce((a, b) => a + b, 0) / values.length;

		return { min, max, avg };
	});

	// Initialize chart
	function initChart() {
		if (!chartContainer || !sensor) return;

		// Create chart
		chart = createChart(chartContainer, {
			layout: {
				background: { color: 'transparent' },
				textColor: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563'
			},
			grid: {
				vertLines: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' },
				horzLines: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' }
			},
			crosshair: {
				mode: 1
			},
			rightPriceScale: {
				borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
			},
			timeScale: {
				borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
				timeVisible: true,
				secondsVisible: true
			}
		});

		// Create area series
		lineSeries = chart.addSeries(AreaSeries, {
			lineColor: '#3b82f6',
			topColor: 'rgba(59, 130, 246, 0.4)',
			bottomColor: 'rgba(59, 130, 246, 0.05)',
			lineWidth: 2
		});

		// Set initial data
		updateChartData();

		// Handle resize
		resizeObserver = new ResizeObserver(() => {
			if (chart && chartContainer) {
				chart.applyOptions({
					width: chartContainer.clientWidth,
					height: chartContainer.clientHeight
				});
			}
		});
		if (chartContainer) {
			resizeObserver.observe(chartContainer);
		}
	}

	// Update chart data
	function updateChartData() {
		if (!lineSeries || !sensor) return;

		const data: SingleValueData[] = sensor.history
			.slice()
			.reverse()
			.map(h => {
				let value: number;
				switch (h.value.type) {
					case 'temperature': value = h.value.celsius; break;
					case 'humidity': value = h.value.percent; break;
					case 'pressure': value = h.value.pascals / 1000; break; // Show in kPa
					case 'length': value = h.value.meters; break;
					case 'mass': value = h.value.kilograms; break;
					case 'volume': value = h.value.cubic_meters; break;
				}

				return {
					time: Math.floor(new Date(h.timestamp).getTime() / 1000) as Time,
					value
				};
			})
			.filter((item, index, self) =>
				// Remove duplicates by time
				index === self.findIndex(t => t.time === item.time)
			)
			.sort((a, b) => (a.time as number) - (b.time as number));

		lineSeries.setData(data);
		chart?.timeScale().fitContent();
	}

	// Watch for history updates
	$effect(() => {
		if (lineSeries && sensor?.history) {
			updateChartData();
		}
	});

	onMount(() => {
		if (!sensorId) return;

		// Load sensor data
		loadSensors().then(() => {
			loadSensorHistory(sensorId);
		});

		// Initialize chart after a short delay to ensure container is ready
		setTimeout(() => {
			initChart();
		}, 100);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (chart) {
			chart.remove();
			chart = null;
		}
	});

	// Refresh handler
	async function handleRefresh() {
		if (!sensorId) return;
		await refreshSensor(sensorId);
		await loadSensorHistory(sensorId);
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<Header />

	<div class="flex">
		<Sidebar />

		<main class="flex-1 p-6 overflow-auto">
			{#if !sensor}
				<div class="text-center py-12">
					<p class="text-gray-500 dark:text-gray-400">Sensor not found</p>
					<a data-sveltekit-preload-data="hover" href={resolve('/sensors')} class="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
						← Back to sensors
					</a>
				</div>
			{:else}
				{@const Icon = getSensorIcon(sensor.info.sensor_type)}
				{@const currentStats = stats}

				<!-- Header -->
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
					<div class="flex items-center gap-4">
						<button
							onclick={() => goto(resolve(`/sensors`))}
							class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
						>
							<ArrowLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
						</button>

						<div class="flex items-center gap-3">
							<div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
								<Icon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<h1 class="text-2xl font-bold text-gray-900 dark:text-white">{sensor.info.name}</h1>
									<span class="w-2 h-2 rounded-full {isOnline ? 'bg-green-500' : 'bg-red-500'}"></span>
								</div>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{formatSensorType(sensor.info.sensor_type)} • {sensor.info.location || 'No location'}
								</p>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<select
							value={$refreshInterval}
							onchange={(e) => setRefreshInterval(Number(e.currentTarget.value) as typeof $refreshInterval)}
							class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
						>
							{#each REFRESH_INTERVALS as interval (interval.value)}
								<option value={interval.value}>Refresh: {interval.label}</option>
							{/each}
						</select>

						<button
							onclick={handleRefresh}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
							disabled={sensor.isLoading}
						>
							<RefreshCw class="w-4 h-4 {sensor.isLoading ? 'animate-spin' : ''}" />
							Refresh
						</button>
					</div>
				</div>

				<!-- Stats Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<!-- Current Value -->
					<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
						<div class="flex items-center gap-3 mb-2">
							<Activity class="w-5 h-5 text-blue-500" />
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Current Value</span>
						</div>
						<p class="text-3xl font-bold text-gray-900 dark:text-white">
							{#if sensor.latestData}
								{sensor.latestData.value.type === 'pressure'
									? (sensor.latestData.value.pascals / 1000).toFixed(2)
									: formatSensorValue(sensor.latestData.value).split(' ')[0]}
							{:else}
								--
							{/if}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{ getUnitForSensorType(sensor.info.sensor_type) }
						</p>
					</div>

					<!-- Average -->
					<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
						<div class="flex items-center gap-3 mb-2">
							<BarChart3 class="w-5 h-5 text-purple-500" />
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Average (100 pts)</span>
						</div>
						<p class="text-3xl font-bold text-gray-900 dark:text-white">
							{currentStats ? currentStats.avg.toFixed(2) : '--'}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{ getUnitForSensorType(sensor.info.sensor_type) }
						</p>
					</div>

					<!-- Min Value -->
					<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
						<div class="flex items-center gap-3 mb-2">
							<TrendingDown class="w-5 h-5 text-red-500" />
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Minimum</span>
						</div>
						<p class="text-3xl font-bold text-gray-900 dark:text-white">
							{currentStats ? currentStats.min.toFixed(2) : '--'}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{ getUnitForSensorType(sensor.info.sensor_type) }
						</p>
					</div>

					<!-- Max Value -->
					<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
						<div class="flex items-center gap-3 mb-2">
							<TrendingUp class="w-5 h-5 text-green-500" />
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Maximum</span>
						</div>
						<p class="text-3xl font-bold text-gray-900 dark:text-white">
							{currentStats ? currentStats.max.toFixed(2) : '--'}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{ getUnitForSensorType(sensor.info.sensor_type) }
						</p>
					</div>
				</div>

				<!-- Chart -->
				<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
					<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Historical Data (Last 100 Readings)</h2>
					</div>
					<div class="p-6">
						<div bind:this={chartContainer} class="w-full h-96"></div>
					</div>
				</div>

				<!-- Sensor Info -->
				<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sensor Details</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Sensor ID</p>
							<p class="text-sm font-mono text-gray-900 dark:text-white">{sensor.info.id}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Owner ID</p>
							<p class="text-sm font-mono text-gray-900 dark:text-white">{sensor.info.owner_id}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Type</p>
							<p class="text-sm text-gray-900 dark:text-white">{formatSensorType(sensor.info.sensor_type)}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Location</p>
							<p class="text-sm text-gray-900 dark:text-white">{sensor.info.location || 'Not specified'}</p>
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>
</div>
