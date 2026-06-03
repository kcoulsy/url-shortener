<script lang="ts">
	import {
		Badge,
		Button,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		TextInput
	} from '$lib';
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
			<form method="post" action="?/create" class="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
				<div>
					<h2 class="text-base font-semibold text-slate-950">New short link</h2>
					<p class="mt-1 text-sm text-slate-500">Create a link owned by your signed-in account.</p>
				</div>

				{#if form?.error}
					<p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{form.error}</p>
				{/if}

				{#if form?.created}
					<p class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
						Created {form.created}
					</p>
				{/if}

				<TextInput
					label="Destination URL"
					name="url"
					placeholder="https://example.com/landing-page"
					type="url"
					value={form?.url ?? ''}
					required
				/>

				<div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
					<Button type="submit">Shorten URL</Button>
				</div>
			</form>

			<section class="grid gap-4">
				<div class="flex items-center justify-between gap-4">
					<div>
						<h2 class="text-base font-semibold text-slate-950">Recent links</h2>
						<p class="mt-1 text-sm text-slate-500">Links created by your account.</p>
					</div>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Short URL</TableHead>
							<TableHead>Destination</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.links as link}
							<TableRow>
								<TableCell class="font-medium text-slate-950">/urls/{link.shortCode}</TableCell>
								<TableCell class="max-w-72 truncate">{link.longUrl}</TableCell>
								<TableCell><Badge tone="success">Active</Badge></TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell class="text-slate-500" colspan={3}>No links yet.</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</section>
		</section>
	</div>
</main>
