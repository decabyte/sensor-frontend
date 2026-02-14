<script lang="ts">
	import { authUser } from '$lib/stores/auth';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { User, Shield, Mail, Calendar, Settings } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<Header />

	<div class="flex">
		<Sidebar />

		<main class="flex-1 p-6 overflow-auto">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
				<p class="text-gray-600 dark:text-gray-400">Manage your account settings</p>
			</div>

			<!-- Profile Card -->
			<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
				<div class="px-6 py-8">
					<div class="flex items-start gap-6">
						<!-- Avatar -->
						<div class="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
							<User class="w-12 h-12 text-blue-600 dark:text-blue-400" />
						</div>

						<!-- User Info -->
						<div class="flex-1">
							<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
								{$authUser?.username || 'User'}
							</h2>
							<div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
								<span class="flex items-center gap-1">
									<Shield class="w-4 h-4" />
									{$authUser?.role || 'Admin'}
								</span>
								<span class="flex items-center gap-1">
									<Mail class="w-4 h-4" />
									{$authUser?.username || 'user'}@sensor-platform.local
								</span>
								<span class="flex items-center gap-1">
									<Calendar class="w-4 h-4" />
									Member since 2024
								</span>
							</div>

							<!-- Role Badge -->
							<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
								<Shield class="w-4 h-4" />
								{$authUser?.role || 'Admin'} Access
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Account Settings -->
			<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
						<Settings class="w-5 h-5" />
						Account Settings
					</h3>
				</div>
				<div class="divide-y divide-gray-200 dark:divide-gray-700">
					<!-- Username -->
					<div class="px-6 py-4 flex items-center justify-between">
						<div>
							<p class="font-medium text-gray-900 dark:text-white">Username</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">Your unique identifier</p>
						</div>
						<span class="text-gray-600 dark:text-gray-300">{$authUser?.username || 'user'}</span>
					</div>

					<!-- Role -->
					<div class="px-6 py-4 flex items-center justify-between">
						<div>
							<p class="font-medium text-gray-900 dark:text-white">Role</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">Your permission level</p>
						</div>
						<span class="text-gray-600 dark:text-gray-300">{$authUser?.role || 'Admin'}</span>
					</div>

					<!-- User ID -->
					<div class="px-6 py-4 flex items-center justify-between">
						<div>
							<p class="font-medium text-gray-900 dark:text-white">User ID</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">Unique identifier for API calls</p>
						</div>
						<span class="text-gray-600 dark:text-gray-300 font-mono text-sm">{$authUser?.id || '00000000-0000-0000-0000-000000000000'}</span>
					</div>
				</div>
			</div>

			<!-- Preferences -->
			<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Theme</p>
							<p class="text-gray-900 dark:text-white">Managed in header (dark/light/system)</p>
						</div>
						<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
							<p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notifications</p>
							<p class="text-gray-900 dark:text-white">Coming soon</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</div>
