<script lang="ts">
	import type { HTMLTdAttributes } from 'svelte/elements';

	let { class: className = '', children, ...rest }: HTMLTdAttributes = $props();
</script>

<td class={`px-4 py-3 align-middle text-slate-700 ${className}`} {...rest}>
	{@render children?.()}
</td>
