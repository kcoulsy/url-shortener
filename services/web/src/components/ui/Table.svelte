<script lang="ts">
	import type { HTMLTableAttributes } from 'svelte/elements';

	let { class: className = '', children, ...rest }: HTMLTableAttributes = $props();
</script>

<div class="w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
	<table class={`w-full caption-bottom text-left text-sm ${className}`} {...rest}>
		{@render children?.()}
	</table>
</div>
