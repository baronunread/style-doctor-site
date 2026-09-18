declare module "style-doctor/rules.js" {
  export interface Diagnostic {
    filePath: string;
    plugin: string;
    rule: string;
    severity: "error" | "warning";
    category: string;
    title: string;
    message: string;
    help: string;
    line: number;
    column: number;
    match: string;
    id: string;
  }

  export interface FindResult {
    diagnostics: Diagnostic[];
    words: number;
  }

  export const CATEGORY_ORDER: string[];
  export const WEIGHT: { error: number; warning: number };
  export const K: number;

  export function findInText(
    text: string,
    filePath: string,
    opts: { only?: Set<string>; ignore?: Set<string>; plain?: boolean },
  ): FindResult;

  export function scoreLabel(score: number): string;
}
