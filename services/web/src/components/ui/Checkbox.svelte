<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'checked' | 'type'> & {
		checked?: boolean;
		description?: string;
		error?: string;
		label?: string;
	};

	let {
		id,
		label,
		description,
		error,
		checked = $bindable(false),
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
	<label class="flex items-start gap-3 text-sm text-slate-800" for={inputId}>
		<input
			class={`mt-0.5 size-4 rounded border-slate-300 text-sky-700 shadow-sm focus:ring-2 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy || undefined}
			id={inputId}
			type="checkbox"
			bind:checked
			{...rest}
		/>
		<span class="grid gap-0.5">
			{#if label}
				<span class="font-medium">{label}</span>
			{/if}
			{#if description}
				<span id={`${inputId}-description`} class="text-xs text-slate-500">{description}</span>
			{/if}
		</span>
	</label>

	{#if error}
		<p id={`${inputId}-error`} class="pl-7 text-xs font-medium text-red-600">{error}</p>
	{/if}
</div>
