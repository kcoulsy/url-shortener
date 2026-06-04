<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type ButtonSize = 'sm' | 'md' | 'lg';

	type Props = HTMLButtonAttributes & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	};

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55';

	const variants: Record<ButtonVariant, string> = {
		primary: 'border-sky-700 bg-sky-700 text-white hover:bg-sky-800',
		secondary: 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
		ghost: 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100',
		danger: 'border-red-700 bg-red-700 text-white hover:bg-red-800'
	};

	const sizes: Record<ButtonSize, string> = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-11 px-5 text-base'
	};
</script>

<button class={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {type} {disabled} {...rest}>
	{@render children?.()}
</button>
