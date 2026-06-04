<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className = '', children, ...rest }: HTMLAttributes<HTMLTableRowElement> = $props();
</script>

<tr class={`transition hover:bg-slate-50 ${className}`} {...rest}>
	{@render children?.()}
</tr>
