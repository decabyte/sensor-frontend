<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import {
		LayoutDashboard,
		Radio,
		Settings,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	let isCollapsed = $state(false);

	const navigation = [
		{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ name: 'Sensors', href: '/sensors', icon: Radio },
		{ name: 'Settings', href: '/settings', icon: Settings }
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<aside class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 {isCollapsed ? 'w-16' : 'w-64'}">
	<div class="h-full flex flex-col">
		<!-- Navigation -->
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navigation as item (item.href)}
				{@const Icon = item.icon}
				<a
					href={resolve(item.href as "/dashboard" | "/sensors" | "/settings")}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(item.href) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
					title={isCollapsed ? item.name : undefined}
				>
					<Icon class="w-5 h-5 flex-shrink-0" />
					{#if !isCollapsed}
						<span class="truncate">{item.name}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Collapse Button -->
		<div class="p-3 border-t border-gray-200 dark:border-gray-700">
			<button
				onclick={() => isCollapsed = !isCollapsed}
				class="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			>
				{#if isCollapsed}
					<ChevronRight class="w-5 h-5" />
				{:else}
					<div class="flex items-center gap-2">
						<ChevronLeft class="w-5 h-5" />
						<span class="text-sm">Collapse</span>
					</div>
				{/if}
			</button>
		</div>
	</div>
</aside>
