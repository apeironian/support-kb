// Which problem a report in a big ticket really is. causes.ts tells the two swap bugs apart by
// tenant; this adds what it files under them by mistake: dates that moved by one day.

import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `shift`: the date moved by a day, not a day/month swap. Nothing in a report's fields says so;
// the desk reads the body and lists the ids (desk-notes.json `oneDayMove`).
export type Problem = Cause | 'shift' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // What intake tagged these reports as, and how many it tagged as something else.
  taggedAs: Record<string, number>;
  mistagged: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export function problemOf(r: Report, t: Tenant | undefined, shifted: readonly string[]): Problem {
  if (shifted.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), shifted);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      const taggedAs = rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {});
      return {
        problem,
        reports: rs,
        taggedAs,
        mistagged: rs.length - (taggedAs[problem] ?? 0),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

// Rows in the export, before one id counts once.
export function exportedRows(reports: Report[], ticket: number): number {
  return reports.filter((r) => r.mergedInto === ticket).length;
}
