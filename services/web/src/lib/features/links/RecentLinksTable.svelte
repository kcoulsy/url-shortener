<script lang="ts">
	import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib';

	type Link = {
		createdAt: string;
		longUrl: string;
		shortCode: string;
		shortUrl: string;
	};

	let { links }: { links: Link[] } = $props();
</script>

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
			{#each links as link}
				<TableRow>
					<TableCell class="font-medium">
						<a
							class="text-sky-700 underline-offset-2 hover:text-sky-800 hover:underline"
							href={link.shortUrl}
							target="_blank"
							rel="noreferrer"
						>
							{link.shortUrl}
						</a>
					</TableCell>
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
