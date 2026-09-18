import {
  findInText,
  scoreLabel,
  CATEGORY_ORDER,
  WEIGHT,
  K,
  type Diagnostic,
} from "style-doctor/rules.js";

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`doctor: missing element ${selector}`);
  return el;
}

const input = must<HTMLTextAreaElement>("#input");
const highlightLayer = must<HTMLDivElement>("#highlight-layer");
const scoreValue = must<HTMLDivElement>("#score-value");
const scoreLabelEl = must<HTMLDivElement>("#score-label");
const wordCountEl = must<HTMLDivElement>("#word-count");
const categoryCounts = must<HTMLDivElement>("#category-counts");
const diagnosticsList = must<HTMLDivElement>("#diagnostics-list");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function scoreOf(diagnostics: Diagnostic[], words: number) {
  const weight = diagnostics.reduce((s, d) => s + WEIGHT[d.severity], 0);
  return Math.max(0, Math.min(100, Math.round(100 - (K * weight * 100) / Math.max(words, 1))));
}

function scoreTone(score: number) {
  if (score >= 90) return "excellent";
  if (score >= 80) return "healthy";
  if (score >= 50) return "needs-work";
  return "critical";
}

function formatElapsed(ms: number) {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}μs` : `${ms.toFixed(1)}ms`;
}

// Build highlighted markup for the backdrop layer: same text as the textarea,
// with <mark> around each diagnostic's matched span. Diagnostics are grouped
// by line, sorted by column; an overlapping match is dropped rather than
// nested, keeping this a plain string-splice instead of a real span tree.
function buildHighlightHtml(raw: string, diagnostics: Diagnostic[]) {
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

function renderDiagnosticsList(diagnostics: Diagnostic[]) {
  if (diagnostics.length === 0) {
    diagnosticsList.innerHTML = `<p class="empty-state">No findings. Clean prose.</p>`;
    return;
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

  diagnosticsList.innerHTML = ordered
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

function renderCategoryCounts(diagnostics: Diagnostic[]) {
  const counts = new Map<string, number>();
  for (const d of diagnostics) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  categoryCounts.innerHTML = CATEGORY_ORDER.filter((c) => counts.get(c))
    .map((c) => `<span class="category-chip">${c} <b>${counts.get(c)}</b></span>`)
    .join("");
}

function run() {
  const text = input.value;
  highlightLayer.innerHTML = "";

  if (text.trim().length === 0) {
    scoreValue.textContent = "–";
    scoreValue.dataset.tone = "empty";
    scoreLabelEl.textContent = "";
    wordCountEl.textContent = "";
    categoryCounts.innerHTML = "";
    diagnosticsList.innerHTML = `<p class="empty-state">Paste or type some text to see it scored.</p>`;
    return;
  }

  const started = performance.now();
  const { diagnostics, words } = findInText(text, "input.md", {});
  const score = scoreOf(diagnostics, words);
  const elapsed = performance.now() - started;

  scoreValue.textContent = String(score);
  scoreValue.dataset.tone = scoreTone(score);
  scoreLabelEl.textContent = scoreLabel(score);
  wordCountEl.textContent = `${words} word${words === 1 ? "" : "s"} · ${diagnostics.length} finding${diagnostics.length === 1 ? "" : "s"} · ${formatElapsed(elapsed)}`;

  renderCategoryCounts(diagnostics);
  renderDiagnosticsList(diagnostics);
  highlightLayer.innerHTML = buildHighlightHtml(text, diagnostics);
}

let scheduled = 0;
function schedule() {
  window.clearTimeout(scheduled);
  scheduled = window.setTimeout(run, 400);
}

input.addEventListener("input", schedule);
input.addEventListener("scroll", () => {
  highlightLayer.scrollTop = input.scrollTop;
  highlightLayer.scrollLeft = input.scrollLeft;
});

run();
