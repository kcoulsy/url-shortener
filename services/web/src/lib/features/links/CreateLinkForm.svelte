<script lang="ts">
	import { Button, TextInput } from '$lib';

	type FormState = {
		created?: string;
		error?: string;
		url?: string;
	};

	let { form }: { form?: FormState | null } = $props();
</script>

<form method="post" action="?/create" class="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
	<div>
		<h2 class="text-base font-semibold text-slate-950">New short link</h2>
		<p class="mt-1 text-sm text-slate-500">Create a link owned by your signed-in account.</p>
	</div>

	{#if form?.error}
		<p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{form.error}</p>
	{/if}

	{#if form?.created}
		<p class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
			Created {form.created}
		</p>
	{/if}

	<TextInput
		label="Destination URL"
		name="url"
		placeholder="https://example.com/landing-page"
		type="url"
		value={form?.url ?? ''}
		required
	/>

	<div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
		<Button type="submit">Shorten URL</Button>
	</div>
</form>
