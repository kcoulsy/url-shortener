<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = Omit<HTMLTextareaAttributes, 'value'> & {
		description?: string;
		error?: string;
		label?: string;
		value?: string;
	};

	let {
		id,
		label,
		description,
		error,
		value = $bindable(''),
		class: className = '',
		...rest
	}: Props = $props();

	const generatedId = crypto.randomUUID();
	const inputId = $derived(id ?? generatedId);
	const describedBy = $derived(
		[description ? `${inputId}-description` : '', error ? `${inputId}-error` : '']
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class="grid gap-1.5">
	{#if label}
		<label for={inputId} class="text-sm font-medium text-slate-800">{label}</label>
	{/if}

	<textarea
		class={`min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : ''} ${className}`}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy || undefined}
		id={inputId}
		bind:value
		{...rest}
	></textarea>

	{#if description}
		<p id={`${inputId}-description`} class="text-xs text-slate-500">{description}</p>
	{/if}

	{#if error}
		<p id={`${inputId}-error`} class="text-xs font-medium text-red-600">{error}</p>
	{/if}
</div>
