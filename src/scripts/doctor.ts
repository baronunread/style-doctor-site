import { findInText, scoreLabel } from "style-doctor/rules.js";
import {
  scoreOf,
  scoreTone,
  highlightRanges,
  diagnosticsListHtml,
  categoryCountsHtml,
} from "../lib/render";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, keymap, type DecorationSet } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`doctor: missing element ${selector}`);
  return el;
}

const mount = must<HTMLDivElement>("#editor-mount");
const scoreValue = must<HTMLDivElement>("#score-value");
const scoreLabelEl = must<HTMLDivElement>("#score-label");
const wordCountEl = must<HTMLDivElement>("#word-count");
const categoryCounts = must<HTMLDivElement>("#category-counts");
const diagnosticsList = must<HTMLDivElement>("#diagnostics-list");

function formatElapsed(ms: number) {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}μs` : `${ms.toFixed(1)}ms`;
}

// A CodeMirror StateField holding the current set of highlight decorations,
// replaced wholesale via setHighlights whenever a scan finishes. This is the
// single source of truth for what's highlighted — no separate DOM layer to
// keep in sync, so there's nothing that can visually desync on scroll.
const setHighlights = StateEffect.define<DecorationSet>();
const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) if (e.is(setHighlights)) deco = e.value;
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

function decorationsFor(text: string, diagnostics: ReturnType<typeof findInText>["diagnostics"]) {
  const marks = highlightRanges(text, diagnostics).map((r) =>
    Decoration.mark({ class: `sev-${r.severity}`, attributes: { title: r.title } }).range(
      r.from,
      r.to,
    ),
  );
  return Decoration.set(marks, true);
}

function scan(view: EditorView) {
  const text = view.state.doc.toString();

  if (text.trim().length === 0) {
    scoreValue.textContent = "–";
    scoreValue.dataset.tone = "empty";
    scoreLabelEl.textContent = "";
    wordCountEl.textContent = "";
    categoryCounts.innerHTML = "";
    diagnosticsList.innerHTML = `<p class="empty-state">Paste or type some text to see it scored.</p>`;
    view.dispatch({ effects: setHighlights.of(Decoration.none) });
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
  view.dispatch({ effects: setHighlights.of(decorationsFor(text, diagnostics)) });
}

let scheduled = 0;
function schedule(view: EditorView) {
  window.clearTimeout(scheduled);
  scheduled = window.setTimeout(() => scan(view), 400);
}

const initialText = mount.textContent ?? "";
mount.textContent = "";

const view = new EditorView({
  state: EditorState.create({
    doc: initialText,
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      highlightField,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) schedule(update.view);
      }),
      EditorView.theme({
        "&": { height: "100%", fontSize: "13px" },
        ".cm-scroller": {
          fontFamily: "var(--font-mono)",
          lineHeight: "1.65",
          overflow: "auto",
          scrollbarGutter: "stable",
        },
        ".cm-content": { padding: 0, caretColor: "var(--accent)" },
        "&.cm-focused": { outline: "none" },
        ".cm-line": { padding: 0 },
      }),
    ],
  }),
  parent: mount,
});

scan(view); // seed highlights/sidebar immediately; debounce only applies to edits after this
mount.classList.add("ready"); // reveal now that CodeMirror has actually laid the text out
