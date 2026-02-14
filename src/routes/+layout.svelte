<script lang="ts">
	import '../app.css';
	import { checkAuth, isAuthenticated } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Check auth on mount
	onMount(async () => {
		const isValid = await checkAuth();
		const isLoginPage = page.url.pathname === '/';

		if (!isValid && !isLoginPage) {
			goto(resolve('/'));
		} else if (isValid && isLoginPage) {
			goto(resolve('/dashboard'));
		}
	});

	// Redirect on auth state change
	$effect(() => {
		if (!$isAuthenticated && page.url.pathname !== '/') {
			goto(resolve('/'));
		}
	});
</script>

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
	{@render children()}
</div>
