// Which problems a big ticket really holds. Counts are the desk's own view (causes.ts, the
// CauseTable on the incident page); this adds the problem that view files under `parser` by
// tenant: dates that moved by one day.

import { groupByCause, readAs, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `shift`: the date moved by a day, not a day/month swap. Nothing in a report's fields says so;
// the desk reads the body and lists the ids (desk-notes.json `oneDayMove`).
export type Problem = Cause | 'shift' | 'unplaced';

export type ProblemRow = {
  problem: Problem;
  reports: number;
  // For `shift`: the problem whose count also holds these reports, where the desk files them.
  countedIn: Problem | null;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export function problemRows(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemRow[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const rows: ProblemRow[] = groupByCause(merged, tenantOf).map((g) => ({
    problem: g.cause,
    reports: g.reports.length,
    countedIn: null,
    taggedAs: g.taggedAs,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
  }));
  const shift = merged.filter((r) => shifted.includes(r.id));
  if (shift.length) {
    const days = shift.map((r) => r.receivedAt.slice(0, 10)).sort();
    const home = groupByCause(merged, tenantOf).find((g) => readAs(g, shifted) > 0)?.cause ?? null;
    rows.push({
      problem: 'shift',
      reports: shift.length,
      countedIn: home,
      taggedAs: shift.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      tenants: new Set(shift.map((r) => r.tenant)).size,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    });
  }
  return rows;
}

// Reports in the ticket, one id counted once; and rows in the export before that.
export function reportCount(reports: Report[], ticket: number): number {
  return uniqueById(reports).filter((r) => r.mergedInto === ticket).length;
}

export function exportedRows(reports: Report[], ticket: number): number {
  return reports.filter((r) => r.mergedInto === ticket).length;
}
