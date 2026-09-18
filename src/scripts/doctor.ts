import { findInText, scoreLabel } from "style-doctor/rules.js";
import {
  escapeHtml,
  scoreOf,
  scoreTone,
  buildHighlightHtml,
  diagnosticsListHtml,
  categoryCountsHtml,
} from "../lib/render";

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

function syncScroll() {
  highlightLayer.scrollTop = input.scrollTop;
  highlightLayer.scrollLeft = input.scrollLeft;
}

// Keeps the backdrop's text (and thus its line-wrapping) identical to the
// textarea on every keystroke/paste, synchronously, with no marks yet. A
// large paste scrolls the textarea to the cursor immediately; if the
// backdrop kept showing pre-paste content until the debounced scan below
// finished, the two would show different, differently-wrapped text at the
// same position for that whole window, i.e. the doubled-text glitch.
function syncPlainText() {
  highlightLayer.textContent = "";
  highlightLayer.innerHTML = input.value.split("\n").map(escapeHtml).join("\n") + "\n";
  syncScroll();
}

function run() {
  const text = input.value;

  if (text.trim().length === 0) {
    scoreValue.textContent = "–";
    scoreValue.dataset.tone = "empty";
    scoreLabelEl.textContent = "";
    wordCountEl.textContent = "";
    categoryCounts.innerHTML = "";
    diagnosticsList.innerHTML = `<p class="empty-state">Paste or type some text to see it scored.</p>`;
    highlightLayer.innerHTML = "";
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
  // Only replace the backdrop here if the textarea hasn't changed again
  // since this scan started (a stray keystroke during a big scan shouldn't
  // clobber the plain-text sync that already happened for the newer value).
  if (input.value === text) {
    highlightLayer.innerHTML = buildHighlightHtml(text, diagnostics);
    syncScroll();
  }
}

let scheduled = 0;
function schedule() {
  syncPlainText();
  window.clearTimeout(scheduled);
  scheduled = window.setTimeout(run, 400);
}

input.addEventListener("input", schedule);
input.addEventListener("scroll", syncScroll);
