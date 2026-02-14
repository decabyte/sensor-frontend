<script lang="ts">
	import { authUser, logout } from '$lib/stores/auth';
	import { theme, cycleTheme } from '$lib/stores/theme';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		Activity,
		Moon,
		Sun,
		Monitor,
		LogOut,
		User
	} from 'lucide-svelte';

	function handleLogout() {
		logout();
		goto(resolve('/'));
	}

	function getThemeIcon() {
		switch ($theme) {
			case 'light': return Sun;
			case 'dark': return Moon;
			case 'system': return Monitor;
		}
	}

	const ThemeIcon = $derived(getThemeIcon());
</script>

<header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a data-sveltekit-preload-data="hover" href={resolve('/dashboard')} class="flex items-center gap-3 hover:opacity-80 transition-opacity">
				<div class="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
					<Activity class="w-5 h-5 text-white" />
				</div>
				<span class="text-xl font-bold text-gray-900 dark:text-white">Sensor Platform</span>
			</a>

			<!-- Right Section -->
			<div class="flex items-center gap-4">
				<!-- Theme Toggle -->
				<button
					onclick={() => cycleTheme()}
					class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					title="Theme: {$theme}"
				>
					<ThemeIcon class="w-5 h-5" />
				</button>

				<!-- User Menu -->
				<div class="flex items-center gap-2">
					<a data-sveltekit-preload-data="hover" href={resolve('/profile')} class="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors -m-2 p-2">
						<div class="text-right hidden sm:block">
							<p class="text-sm font-medium text-gray-900 dark:text-white">{$authUser?.username || 'User'}</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">{$authUser?.role || 'Admin'}</p>
						</div>
						<div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
							<User class="w-5 h-5 text-blue-600 dark:text-blue-400" />
						</div>
					</a>
					<button
						onclick={handleLogout}
						class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
						title="Logout"
					>
						<LogOut class="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	</div>
</header>
