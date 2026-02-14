<script lang="ts">
	import { onMount } from 'svelte';
	import { sensorsById, loadSensors, refreshAllSensors, toggleAutoRefresh, setRefreshInterval, sensorsLoading, REFRESH_INTERVALS, autoRefreshEnabled, refreshInterval } from '$lib/stores/sensors';
	import { getSensorIcon, getSensorColor, getSensorBgColor, formatSensorType } from '$lib/utils/icons';
	import { getSensorValueDisplay } from '$lib/types';
	import { resolve } from '$app/paths';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { RefreshCw, Search, Activity } from 'lucide-svelte';

	let searchQuery = $state('');

	onMount(() => {
		loadSensors();
	});

	const sensorArray = $derived(Array.from($sensorsById.values()));

	const filteredSensors = $derived(
		sensorArray.filter(s =>
			s.info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(s.info.location && s.info.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
			s.info.sensor_type.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<Header />

	<div class="flex">
		<Sidebar />

		<main class="flex-1 p-6 overflow-auto">
			<!-- Page Header -->
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sensors</h1>
					<p class="text-gray-600 dark:text-gray-400">Manage and monitor your sensor network</p>
				</div>

				<div class="flex items-center gap-3">
					<button
						onclick={() => refreshAllSensors()}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
						disabled={$sensorsLoading}
					>
						<RefreshCw class="w-4 h-4 {$sensorsLoading ? 'animate-spin' : ''}" />
						Refresh
					</button>

					<button
						onclick={() => toggleAutoRefresh()}
						class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					>
						{$autoRefreshEnabled ? 'Pause' : 'Resume'}
					</button>
				</div>
			</div>

			<!-- Controls Bar -->
			<div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
				<div class="flex flex-col sm:flex-row gap-4">
					<!-- Search -->
					<div class="flex-1 relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search sensors..."
							bind:value={searchQuery}
							class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
						/>
					</div>

					<!-- Refresh Interval -->
					<div class="flex items-center gap-2">
						<span class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Refresh:</span>
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

			<!-- Sensor Grid -->
			{#if filteredSensors.length === 0}
				<div class="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
					<div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
						<Activity class="w-8 h-8 text-gray-400" />
					</div>
					<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
						{sensorArray.length === 0 ? 'No sensors found' : 'No matching sensors'}
					</h3>
					<p class="text-gray-500 dark:text-gray-400">
						{sensorArray.length === 0 ? 'Add sensors to your network to get started.' : 'Try adjusting your search criteria.'}
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredSensors as sensor (sensor.info.id)}
						{@const Icon = getSensorIcon(sensor.info.sensor_type)}
						{@const isOnline = sensor.latestData ? (Date.now() - new Date(sensor.latestData.timestamp).getTime() < 60000) : false}
						{@const latestValue = sensor.latestData}

						<a
							href={resolve(`/sensors/${sensor.info.id}`)}
							class="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
						>
							<div class="flex items-start justify-between mb-4">
								<div class="w-12 h-12 rounded-xl {getSensorBgColor(sensor.info.sensor_type)} flex items-center justify-center">
									<Icon class="w-6 h-6 {getSensorColor(sensor.info.sensor_type)}" />
								</div>
								<div class="flex items-center gap-2">
									<span class="w-2 h-2 rounded-full {isOnline ? 'bg-green-500' : 'bg-red-500'}"></span>
									<span class="text-sm text-gray-500 dark:text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
								</div>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
								{sensor.info.name}
							</h3>

							<p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
								{formatSensorType(sensor.info.sensor_type)} • {sensor.info.location || 'No location'}
							</p>

							<div class="border-t border-gray-200 dark:border-gray-700 pt-4">
								<div class="flex items-baseline gap-2">
									<span class="text-2xl font-bold text-gray-900 dark:text-white">
										{#if latestValue}
											{@const display = getSensorValueDisplay(latestValue.value)}
											{display.value.toFixed(1)}
										{:else}
											--
										{/if}
									</span>
									<span class="text-sm text-gray-500 dark:text-gray-400">
										{#if latestValue}
											{@const display = getSensorValueDisplay(latestValue.value)}
											{display.unit}
										{/if}
									</span>
								</div>

								{#if sensor.lastUpdated}
									<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
										Updated {new Date(sensor.lastUpdated).toLocaleTimeString()}
									</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>
