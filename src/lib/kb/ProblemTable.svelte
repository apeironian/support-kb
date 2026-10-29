<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { exportedRows, problemRows, reportCount, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  type Issue = { href: string; state: string };
  // `issues`: where each problem is tracked now, problem → ticket link and its state.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, Issue>> } = $props();

  const rows = $derived(problemRows(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(reportCount(reports as Report[], ticket));
  const exported = $derived(exportedRows(reports as Report[], ticket));
  const tags = (r: { taggedAs: Record<string, number> }) =>
    Object.entries(r.taggedAs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
  const label = (href: string) => '#' + href.split('/').pop();
</script>

<p class="sum">
  <strong>{total}</strong> reports in #{ticket} ({exported} rows in the export; one id counts once) ·
  <strong>{rows.length}</strong>
  {rows.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.problem)}
      {@const issue = issues[r.problem]}
      <tr class:open={!issue || issue.state === 'open'}>
        <td><code>{r.problem}</code></td>
        <td>{r.reports}{#if r.countedIn}<sup>*</sup>{/if}</td>
        <td class="tags">{tags(r)}</td>
        <td>{r.tenants}</td>
        <td>{r.firstSeen} → {r.lastSeen}</td>
        <td>{#if issue}<a href={issue.href}>{label(issue.href)}</a> · {issue.state}{:else}no ticket yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each rows.filter((r) => r.countedIn) as r (r.problem)}
  <p class="note">* also counted in <code>{r.countedIn}</code>: the desk files these {r.reports} by tenant.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
