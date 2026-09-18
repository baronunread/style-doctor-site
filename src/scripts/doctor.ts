import { findInText, scoreLabel } from "style-doctor/rules.js";
import { scoreOf, scoreTone, buildHighlightHtml, diagnosticsListHtml, categoryCountsHtml } from "../lib/render";

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

function formatElapsed(ms: number) {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}μs` : `${ms.toFixed(1)}ms`;
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

  categoryCounts.innerHTML = categoryCountsHtml(diagnostics);
  diagnosticsList.innerHTML = diagnosticsListHtml(diagnostics);
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
