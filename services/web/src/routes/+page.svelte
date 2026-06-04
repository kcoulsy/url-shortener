<script lang="ts">
	import CreateLinkForm from '$components/links/CreateLinkForm.svelte';
	import RecentLinksTable from '$components/links/RecentLinksTable.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>URL Shortener</title>
</svelte:head>

<main class="min-h-screen bg-slate-100 text-slate-950">
	<div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
		<header class="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-medium text-sky-700">URL shortener</p>
				<h1 class="mt-2 text-3xl font-semibold tracking-normal text-slate-950">Create and manage links</h1>
				<p class="mt-2 text-sm text-slate-500">{data.user.email ?? data.user.username ?? data.user.sub}</p>
			</div>
			<div class="flex gap-3">
				<a
					class="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
					href="/logout"
				>
					Sign out
				</a>
			</div>
		</header>

		<section class="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
			<CreateLinkForm {form} urlsBase={data.urlsBase} />
			<RecentLinksTable links={data.links} />
		</section>
	</div>
</main>
