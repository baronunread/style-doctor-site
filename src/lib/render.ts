// Pure string-building functions shared between the server (Astro frontmatter,
// to render the initial state so there's no client-JS pop-in) and the browser
// (src/scripts/doctor.ts, re-rendering on input). No DOM access here.
import { CATEGORY_ORDER, WEIGHT, K, type Diagnostic } from "style-doctor/rules.js";

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function scoreOf(diagnostics: Diagnostic[], words: number) {
  const weight = diagnostics.reduce((s, d) => s + WEIGHT[d.severity], 0);
  return Math.max(0, Math.min(100, Math.round(100 - (K * weight * 100) / Math.max(words, 1))));
}

export function scoreTone(score: number) {
  if (score >= 90) return "excellent";
  if (score >= 80) return "healthy";
  if (score >= 50) return "needs-work";
  return "critical";
}

// Highlighted markup for the backdrop layer: same text as the textarea, with
// <mark> around each diagnostic's matched span. Diagnostics are grouped by
// line, sorted by column; an overlapping match is dropped rather than nested,
// keeping this a plain string-splice instead of a real span tree.
export function buildHighlightHtml(raw: string, diagnostics: Diagnostic[]) {
  const byLine = new Map<number, Diagnostic[]>();
  for (const d of diagnostics) {
    const list = byLine.get(d.line) ?? [];
    list.push(d);
    byLine.set(d.line, list);
  }
  for (const list of byLine.values()) list.sort((a, b) => a.column - b.column);

  const lines = raw.split("\n");
  const out = lines.map((line, i) => {
    const ds = byLine.get(i + 1);
    if (!ds) return escapeHtml(line);
    let html = "";
    let cursor = 0;
    for (const d of ds) {
      const start = d.column - 1;
      const end = start + d.match.length;
      if (start < cursor) continue; // overlapping match, skip
      html += escapeHtml(line.slice(cursor, start));
      html += `<mark class="sev-${d.severity}" title="${escapeHtml(d.title)}">${escapeHtml(line.slice(start, end))}</mark>`;
      cursor = end;
    }
    html += escapeHtml(line.slice(cursor));
    return html;
  });
  return out.join("\n") + "\n"; // trailing newline: textarea always renders one more line
}

export function diagnosticsListHtml(diagnostics: Diagnostic[]) {
  if (diagnostics.length === 0) {
    return `<p class="empty-state">No findings. Clean prose.</p>`;
  }
  const groups = new Map<string, Diagnostic[]>();
  for (const d of diagnostics) {
    const list = groups.get(d.rule) ?? [];
    list.push(d);
    groups.set(d.rule, list);
  }
  const ordered = [...groups.values()].sort((a, b) => {
    const A = a[0];
    const B = b[0];
    const catDiff = CATEGORY_ORDER.indexOf(A.category) - CATEGORY_ORDER.indexOf(B.category);
    if (catDiff !== 0) return catDiff;
    if (A.severity !== B.severity) return A.severity === "error" ? -1 : 1;
    return b.length - a.length;
  });

  return ordered
    .map((group) => {
      const d = group[0];
      const lines = group.map((g) => `L${g.line}:${g.column}`).join(", ");
      return `
        <details class="finding sev-${d.severity}">
          <summary>
            <span class="finding-dot"></span>
            <span class="finding-title">${escapeHtml(d.title)}${group.length > 1 ? ` ×${group.length}` : ""}</span>
            <span class="finding-rule">${d.rule}</span>
          </summary>
          <div class="finding-body">
            <p class="finding-message">${escapeHtml(d.message)}</p>
            <p class="finding-help">${escapeHtml(d.help)}</p>
            <p class="finding-lines">${lines}</p>
          </div>
        </details>`;
    })
    .join("");
}

export function categoryCountsHtml(diagnostics: Diagnostic[]) {
  const counts = new Map<string, number>();
  for (const d of diagnostics) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  return CATEGORY_ORDER.filter((c) => counts.get(c))
    .map((c) => `<span class="category-chip">${c} <b>${counts.get(c)}</b></span>`)
    .join("");
}
