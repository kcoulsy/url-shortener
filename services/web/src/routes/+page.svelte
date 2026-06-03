<script lang="ts">
	import {
		Badge,
		Button,
		Checkbox,
		PasswordInput,
		Select,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
		Textarea,
		TextInput
	} from '$lib';

	let destinationUrl = $state('');
	let customSlug = $state('');
	let password = $state('');
	let expiration = $state('');
	let notes = $state('');
	let protectedLink = $state(false);
	let trackAnalytics = $state(true);

	const links = [
		{
			shortUrl: 'sho.rt/sprint',
			destination: 'https://example.com/product/spring-launch',
			clicks: 842,
			status: 'Active',
			tone: 'success'
		},
		{
			shortUrl: 'sho.rt/docs',
			destination: 'https://example.com/internal/url-shortener-spec',
			clicks: 128,
			status: 'Protected',
			tone: 'warning'
		},
		{
			shortUrl: 'sho.rt/old',
			destination: 'https://example.com/retired-campaign',
			clicks: 23,
			status: 'Expired',
			tone: 'neutral'
		}
	] as const;
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
			</div>
			<div class="flex gap-3">
				<Button variant="secondary">Import CSV</Button>
				<Button>Create link</Button>
			</div>
		</header>

		<section class="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
			<form class="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
				<div>
					<h2 class="text-base font-semibold text-slate-950">New short link</h2>
					<p class="mt-1 text-sm text-slate-500">Reusable base form controls for the shortener workflow.</p>
				</div>

				<TextInput
					label="Destination URL"
					placeholder="https://example.com/landing-page"
					type="url"
					bind:value={destinationUrl}
				/>

				<TextInput
					label="Custom slug"
					description="Leave blank to generate one automatically."
					placeholder="summer-campaign"
					bind:value={customSlug}
				/>

				<Select
					label="Expiration"
					placeholder="No expiration"
					bind:value={expiration}
					options={[
						{ label: '24 hours', value: '24h' },
						{ label: '7 days', value: '7d' },
						{ label: '30 days', value: '30d' }
					]}
				/>

				<Checkbox
					label="Require password"
					description="Visitors must enter a password before redirecting."
					bind:checked={protectedLink}
				/>

				{#if protectedLink}
					<PasswordInput label="Link password" placeholder="Set access password" bind:value={password} />
				{/if}

				<Checkbox
					label="Track analytics"
					description="Collect click totals, referrers, devices, and countries."
					bind:checked={trackAnalytics}
				/>

				<Textarea label="Internal notes" placeholder="Campaign owner, purpose, or rollout details" bind:value={notes} />

				<div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
					<Button variant="ghost">Reset</Button>
					<Button type="submit">Shorten URL</Button>
				</div>
			</form>

			<section class="grid gap-4">
				<div class="flex items-center justify-between gap-4">
					<div>
						<h2 class="text-base font-semibold text-slate-950">Recent links</h2>
						<p class="mt-1 text-sm text-slate-500">Table primitives for management views.</p>
					</div>
					<Button variant="secondary" size="sm">Export</Button>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Short URL</TableHead>
							<TableHead>Destination</TableHead>
							<TableHead class="text-right">Clicks</TableHead>
							<TableHead>Status</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each links as link}
							<TableRow>
								<TableCell class="font-medium text-slate-950">{link.shortUrl}</TableCell>
								<TableCell class="max-w-72 truncate">{link.destination}</TableCell>
								<TableCell class="text-right tabular-nums">{link.clicks}</TableCell>
								<TableCell><Badge tone={link.tone}>{link.status}</Badge></TableCell>
								<TableCell>
									<div class="flex justify-end gap-2">
										<Button variant="ghost" size="sm">Copy</Button>
										<Button variant="secondary" size="sm">Edit</Button>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</section>
		</section>
	</div>
</main>
