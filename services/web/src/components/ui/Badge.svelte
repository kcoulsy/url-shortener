<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

	type Props = HTMLAttributes<HTMLSpanElement> & {
		tone?: BadgeTone;
	};

	let { tone = 'neutral', class: className = '', children, ...rest }: Props = $props();

	const tones: Record<BadgeTone, string> = {
		neutral: 'bg-slate-100 text-slate-700',
		success: 'bg-emerald-50 text-emerald-700',
		warning: 'bg-amber-50 text-amber-700',
		danger: 'bg-red-50 text-red-700'
	};
</script>

<span class={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${tones[tone]} ${className}`} {...rest}>
	{@render children?.()}
</span>
