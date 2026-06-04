<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className = '', children, ...rest }: HTMLAttributes<HTMLElement> = $props();
</script>

<thead class={`border-b border-slate-200 bg-slate-50 ${className}`} {...rest}>
	{@render children?.()}
</thead>
