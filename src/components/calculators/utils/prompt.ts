/**
 * Joins optional prompt fragments while preserving intentional breaks.
 */
export function joinPromptLines(lines: Array<string | false | null | undefined>) {
  return lines.filter(Boolean).join("\n");
}
