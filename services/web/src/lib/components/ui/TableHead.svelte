<script lang="ts">
	import type { HTMLThAttributes } from 'svelte/elements';

	let { class: className = '', children, ...rest }: HTMLThAttributes = $props();
</script>

<th class={`h-10 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`} {...rest}>
	{@render children?.()}
</th>
