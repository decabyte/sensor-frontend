<script lang="ts">
	import { login, authError } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Activity } from 'lucide-svelte';

	let username = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		const success = await login({ username, password });

		if (success) {
			goto(resolve('/dashboard'));
		}

		isSubmitting = false;
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
	<div class="w-full max-w-md">
		<!-- Logo and Title -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 dark:bg-blue-500 mb-4 shadow-lg">
				<Activity class="w-8 h-8 text-white" />
			</div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
				Sensor Platform
			</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Sign in to monitor your sensors
			</p>
		</div>

		<!-- Login Form -->
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Username
					</label>
					<input
						type="text"
						id="username"
						bind:value={username}
						placeholder="admin"
						required
						class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Password
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="admin"
						required
						class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					/>
				</div>

				{#if $authError}
					<div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
						<p class="text-sm text-red-600 dark:text-red-400">{$authError}</p>
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Sign In
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Demo credentials: <span class="font-medium text-gray-700 dark:text-gray-300">admin / admin</span>
				</p>
			</div>
		</div>

		<!-- Footer -->
		<p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
			Sensor Platform Frontend v1.0.0
		</p>
	</div>
</div>
