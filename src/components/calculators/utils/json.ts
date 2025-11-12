/**
 * Attempts to extract a balanced JSON object substring from a string that may
 * contain extra trailing characters (e.g. logging noise after a closing brace).
 */
export function extractBalancedJsonObject(input: string): string | null {
  if (!input) {
    return null;
  }

  const startIndex = input.indexOf("{");
  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return input.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}
