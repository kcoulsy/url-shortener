<script lang="ts">
	import { Button, PasswordInput, TextInput } from '$lib';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign Up | URL Shortener</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-950">
	<form method="post" class="grid w-full max-w-sm gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
		<div>
			<p class="text-sm font-medium text-sky-700">URL shortener</p>
			<h1 class="mt-2 text-2xl font-semibold text-slate-950">Create account</h1>
		</div>

		{#if form?.error}
			<p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{form.error}</p>
		{/if}

		<TextInput label="Email" name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
		<PasswordInput
			label="Password"
			name="password"
			autocomplete="new-password"
			description="Use a password that satisfies your Cognito password policy."
			required
		/>

		<Button type="submit" class="w-full">Create account</Button>

		<p class="text-center text-sm text-slate-600">
			Already confirmed?
			<a class="font-medium text-sky-700 hover:text-sky-800" href="/login">Sign in</a>
		</p>
	</form>
</main>
