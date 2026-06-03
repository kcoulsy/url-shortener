<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className = '', children, ...rest }: HTMLAttributes<HTMLElement> = $props();
</script>

<tbody class={`divide-y divide-slate-100 ${className}`} {...rest}>
	{@render children?.()}
</tbody>
