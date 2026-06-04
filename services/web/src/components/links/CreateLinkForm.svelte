<script lang="ts">
	import Button from '$components/ui/Button.svelte';
	import TextInput from '$components/ui/TextInput.svelte';

	type FormState = {
		customSlug?: string;
		customize?: boolean;
		created?: string;
		error?: string;
		url?: string;
	};

	let { form, urlsBase }: { form?: FormState | null; urlsBase: string } = $props();
	let customSlug = $state('');
	let customize = $state(false);

	const previewSlug = $derived(customSlug || 'custom-slug');
	const customSlugUrl = $derived(`${urlsBase.replace(/\/$/, '')}/urls/${previewSlug}`);

	$effect(() => {
		if (form) {
			customSlug = form.customSlug ?? '';
			customize = Boolean(form.customize || form.customSlug);
		}
	});
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

	<div class="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="text-sm font-medium text-slate-800">Custom URL</p>
				<p class="mt-1 text-xs text-slate-500">{customSlugUrl}</p>
			</div>
			<Button
				aria-controls="custom-url-fields"
				aria-expanded={customize}
				onclick={() => (customize = !customize)}
				size="sm"
				type="button"
				variant="secondary"
			>
				{customize ? 'Use generated' : 'Customize'}
			</Button>
		</div>

		{#if customize}
			<input name="customize" type="hidden" value="true" />
			<div id="custom-url-fields">
				<TextInput
					description="3-64 characters: letters, numbers, hyphens, and underscores."
					label="Slug"
					maxlength={64}
					minlength={3}
					name="customSlug"
					pattern={'[0-9A-Za-z_-]{3,64}'}
					placeholder="summer-sale"
					title="Use 3-64 letters, numbers, hyphens, or underscores."
					bind:value={customSlug}
				/>
			</div>
		{/if}
	</div>

	<div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
		<Button type="submit">Shorten URL</Button>
	</div>
</form>
