<script lang="ts">
	import { onMount } from 'svelte';
	import { sensorsById, loadSensors, refreshAllSensors, toggleAutoRefresh, setRefreshInterval, REFRESH_INTERVALS, autoRefreshEnabled, refreshInterval } from '$lib/stores/sensors';
	import { getSensorIcon, getSensorColor, getSensorBgColor, formatSensorType } from '$lib/utils/icons';
	import { getSensorValueDisplay } from '$lib/types';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { Radio, RefreshCw, Activity } from 'lucide-svelte';

	onMount(() => {
		loadSensors();
	});

	const sensorArray = $derived(Array.from($sensorsById.values()));
	const onlineCount = $derived(sensorArray.filter(s => s.latestData ? (Date.now() - new Date(s. latestData.timestamp).getTime() < 60000) : false).length);
	const totalCount = $derived(sensorArray.length);
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<Header />

	<div class="flex">
		<Sidebar />

		<main class="flex-1 p-6 overflow-auto">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
				<p class="text-gray-600 dark:text-gray-400">Overview of your sensor network</p>
			</div>

			<!-- Stats Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<!-- Total Sensors -->
				<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sensors</p>
							<p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalCount}</p>
						</div>
						<div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<Radio class="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
				</div>

				<!-- Online Sensors -->
				<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
							<p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{onlineCount}</p>
						</div>
						<div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
							<Activity class="w-6 h-6 text-green-600 dark:text-green-400" />
						</div>
					</div>
				</div>

				<!-- Offline Sensors -->
				<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</p>
							<p class="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{totalCount - onlineCount}</p>
						</div>
						<div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
							<Activity class="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
					</div>
				</div>

				<!-- Refresh Status -->
				<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Refresh</p>
							<p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
								{$autoRefreshEnabled ? 'On' : 'Off'}
							</p>
						</div>
						<div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
							<RefreshCw class="w-6 h-6 text-purple-600 dark:text-purple-400 {$autoRefreshEnabled ? 'animate-spin' : ''}" style="animation-duration: 3s;" />
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
				<div class="flex flex-wrap gap-4">
					<button
						onclick={() => refreshAllSensors()}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						<RefreshCw class="w-4 h-4" />
						Refresh All
					</button>

					<button
						onclick={() => toggleAutoRefresh()}
						class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
					>
						{$autoRefreshEnabled ? 'Disable' : 'Enable'} Auto Refresh
					</button>

					<div class="flex items-center gap-2">
						<span class="text-sm text-gray-600 dark:text-gray-400">Interval:</span>
						<select
							value={$refreshInterval}
							onchange={(e) => setRefreshInterval(Number(e.currentTarget.value) as typeof $refreshInterval)}
							class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
						>
							{#each REFRESH_INTERVALS as interval (interval.value)}
								<option value={interval.value}>{interval.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Recent Activity -->
			<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
				</div>
				<div class="divide-y divide-gray-200 dark:divide-gray-700">
					{#if sensorArray.length === 0}
						<div class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
							<p>No sensors found</p>
						</div>
					{:else}
						{#each sensorArray.slice(0, 5) as sensor (sensor.info.id)}
							{@const Icon = getSensorIcon(sensor.info.sensor_type)}
							{@const isOnline = sensor.latestData ? (Date.now() - new Date(sensor.latestData.timestamp).getTime() < 60000) : false}
							<div class="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
								<div class="flex items-center gap-4">
									<div class="w-10 h-10 rounded-lg {getSensorBgColor(sensor.info.sensor_type)} flex items-center justify-center">
										<Icon class="w-5 h-5 {getSensorColor(sensor.info.sensor_type)}" />
									</div>
									<div>
										<p class="font-medium text-gray-900 dark:text-white">{sensor.info.name}</p>
										<p class="text-sm text-gray-500 dark:text-gray-400">{formatSensorType(sensor.info.sensor_type)} • {sensor.info.location || 'No location'}</p>
									</div>
								</div>
								<div class="flex items-center gap-4">
									{#if sensor.latestData}
										{@const { value: displayValue, unit } = getSensorValueDisplay(sensor.latestData.value)}
										<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
											{displayValue.toFixed(1)} {unit}
										</span>
									{/if}
									<div class="flex items-center gap-2">
										<span class="w-2 h-2 rounded-full {isOnline ? 'bg-green-500' : 'bg-red-500'}"></span>
										<span class="text-sm text-gray-500 dark:text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</main>
	</div>
</div>
