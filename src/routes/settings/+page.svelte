<script lang="ts">
	import { theme, setTheme, effectiveTheme } from '$lib/stores/theme';
	import { REFRESH_INTERVALS, setRefreshInterval, toggleAutoRefresh, autoRefreshEnabled, refreshInterval } from '$lib/stores/sensors';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { Moon, Sun, Monitor, Clock } from 'lucide-svelte';

	const themes = [
		{ value: 'light' as const, label: 'Light', icon: Sun },
		{ value: 'dark' as const, label: 'Dark', icon: Moon },
		{ value: 'system' as const, label: 'System', icon: Monitor }
	];
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<Header />

	<div class="flex">
		<Sidebar />

		<main class="flex-1 p-6 overflow-auto">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
				<p class="text-gray-600 dark:text-gray-400">Configure application preferences</p>
			</div>

			<!-- Theme Settings -->
			<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>

				<div class="space-y-4">
					<div>
						<span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Theme
						</span>
						<div class="flex flex-wrap gap-3">
							{#each themes as themeOption (themeOption.value)}
								{@const Icon = themeOption.icon}
								<button
									onclick={() => setTheme(themeOption.value)}
									class="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all {$theme === themeOption.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'}"
								>
									<Icon class="w-4 h-4" />
									{themeOption.label}
								</button>
							{/each}
						</div>
						<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
							Current: <span class="font-medium">{$theme}</span> (Effective: {$effectiveTheme})
						</p>
					</div>
				</div>
			</div>

			<!-- Data Settings -->
			<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Refresh</h2>

				<div class="space-y-4">
					<div>
						<span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Default Refresh Interval
						</span>
						<div class="flex flex-wrap gap-3">
							{#each REFRESH_INTERVALS as interval (interval.value)}
								<button
									onclick={() => setRefreshInterval(interval.value)}
									class="px-4 py-2 rounded-lg border-2 transition-all {$refreshInterval === interval.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'}"
								>
									{interval.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
						<div class="flex items-center gap-3">
							<Clock class="w-5 h-5 text-gray-500 dark:text-gray-400" />
							<div>
								<p class="font-medium text-gray-900 dark:text-white">Auto Refresh</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{$autoRefreshEnabled ? 'Enabled' : 'Paused'}
								</p>
							</div>
						</div>
						<button
							onclick={() => toggleAutoRefresh()}
							class="px-4 py-2 rounded-lg font-medium transition-colors {$autoRefreshEnabled ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'}"
						>
							{$autoRefreshEnabled ? 'Pause' : 'Enable'}
						</button>
					</div>
				</div>
			</div>

			<!-- About -->
			<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
				<div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
					<p><span class="font-medium">Version:</span> 1.0.0</p>
					<p><span class="font-medium">Framework:</span> Svelte 5 + SvelteKit 2</p>
					<p><span class="font-medium">Runtime:</span> Bun</p>
					<p><span class="font-medium">Styling:</span> Tailwind CSS v4</p>
					<p><span class="font-medium">Charts:</span> Lightweight Charts (TradingView)</p>
					<p><span class="font-medium">API:</span> OpenRPC JSON-RPC 2.0</p>
				</div>
			</div>
		</main>
	</div>
</div>
