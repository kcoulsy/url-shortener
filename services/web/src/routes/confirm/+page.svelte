<script lang="ts">
	import Button from '$components/ui/Button.svelte';
	import TextInput from '$components/ui/TextInput.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Confirm Account | URL Shortener</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-950">
	<form method="post" class="grid w-full max-w-sm gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
		<div>
			<p class="text-sm font-medium text-sky-700">URL shortener</p>
			<h1 class="mt-2 text-2xl font-semibold text-slate-950">Confirm account</h1>
		</div>

		{#if form?.error}
			<p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{form.error}</p>
		{/if}

		<TextInput label="Email" name="email" type="email" value={form?.email ?? data.email} required />
		<TextInput label="Confirmation code" name="code" inputmode="numeric" value={form?.code ?? ''} required />

		<Button type="submit" class="w-full">Confirm account</Button>
	</form>
</main>
