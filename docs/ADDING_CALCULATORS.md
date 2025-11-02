# Quick Guide: Adding a New Calculator

## Checklist

- [ ] Create calculator directory: `src/components/calculators/{name}/`
- [ ] Create calculator file: `{name}-calculator.tsx`
- [ ] Define `FormState` type
- [ ] Create `defaultFormState`
- [ ] Implement `buildPrompt()` function
- [ ] Implement `parseNovaReply()` (usually just uses `parseSummaryAndDataset`)
- [ ] Create `Form` component
- [ ] Export `calculatorDefinition`
- [ ] Import and add to `calculatorDefinitions` array in `index.ts`

## File Structure Template

```
src/components/calculators/
├── {calculator-name}/
│   └── {calculator-name}-calculator.tsx
├── index.ts                    ← Add import & register here
├── types.ts                    ← Types (usually no changes needed)
└── utils/
    ├── forms.ts                ← buildFieldChangeHandler
    ├── prompt.ts               ← joinPromptLines
    ├── request.ts              ← buildNovaRequestOptions
    └── summary.ts              ← parseSummaryAndDataset, formatSummaryLines
```

## Code Template

```typescript
"use client";

import type { ChangeEvent } from "react";
import type {
  CalculatorDefinition,
  CalculatorFormProps,
  CalculatorResult,
} from "@/components/calculators/types";
import { buildFieldChangeHandler } from "@/components/calculators/utils/forms";
import { joinPromptLines } from "@/components/calculators/utils/prompt";
import {
  formatSummaryLines,
  parseSummaryAndDataset,
} from "@/components/calculators/utils/summary";
import { buildNovaRequestOptions } from "@/components/calculators/utils/request";

// 1. Define Form State
export type YourCalculatorFormState = {
  token: string;
  amount: string;
  interval: string;
  duration: string;
};

// 2. Default State
const defaultFormState: YourCalculatorFormState = {
  token: "ETH",
  amount: "500",
  interval: "bi-weekly",
  duration: "6 months",
};

// 3. Messages
const initialSummaryMessage = "Run the projection to see Nova's perspective on this plan.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

// 4. Build Prompt
function buildPrompt({ token, amount, interval, duration }: YourCalculatorFormState) {
  return joinPromptLines([
    `Using your coindesk tool, evaluate the following strategy.`,
    `Respond in a single message, DO NOT request clarification, and DO NOT ask any follow-up questions.`,
    `Plan details: [describe your strategy with ${token}, ${amount}, ${interval}, ${duration}].`,
    "",
    "Guidelines:",
    "1. Determine the schedule start date automatically: call your date/time capability to retrieve today's UTC date and use it as the starting point. Do not ask the user.",
    "2. Generate a plausible synthetic price path that matches the cadence and duration. When real history improves realism, use the available data tools silently; otherwise craft a consistent synthetic series.",
    "3. Summarize performance factors, expected cost basis shifts, and key risks in exactly three concise bullet points. State any assumptions directly inside the bullets.",
    "4. After the summary, output a JSON array labeled DATA containing objects formatted as {\"date\":\"YYYY-MM-DD\",\"price\":number}. Provide one entry per scheduled date, ordered chronologically. Prices must be numbers, not strings.",
    "5. Never ask questions, never defer the calculation, and always include both the SUMMARY section and the DATA array.",
    "",
    "Use the following structure exactly:",
    "SUMMARY:",
    "- bullet point one",
    "- bullet point two",
    "- bullet point three",
    "DATA:",
    "[{\"date\":\"2024-01-01\",\"price\":123.45}, ...]",
  ]);
}

// 5. Parse Reply
function parseNovaReply(reply: string): CalculatorResult {
  return parseSummaryAndDataset(reply);
}

// 6. Format Summary (usually standard)
const formatSummary = formatSummaryLines;

// 7. Form Component
export function YourCalculatorForm({
  formState,
  onFormStateChange,
  onSubmit,
  isLoading,
  error,
}: CalculatorFormProps<YourCalculatorFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<YourCalculatorFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof YourCalculatorFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  return (
    <form
      className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-slate-900/30 p-4 sm:gap-5 sm:rounded-3xl sm:p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your strategy</h3>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
          Adjust parameters to see how Nova models this strategy over time.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {/* Your form fields here */}
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:px-5 sm:py-3 sm:text-sm"
        disabled={isLoading}
      >
        {isLoading ? "Generating projection..." : "Run projection"}
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error ? <p className="text-sm text-critical">{error}</p> : null}
    </form>
  );
}

// 8. Export Definition
export const yourCalculatorDefinition: CalculatorDefinition<YourCalculatorFormState> = {
  id: "your-calculator",
  label: "Your Calculator",
  description: "Brief description of what this calculator does.",
  Form: YourCalculatorForm,
  getInitialState: () => ({ ...defaultFormState }),
  getRequestConfig: (formState) => {
    const prompt = buildPrompt(formState);
    return buildNovaRequestOptions(prompt, { max_tokens: 18000 });
  },
  parseReply: parseNovaReply,
  formatSummary,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
```

## Registration

Add to `src/components/calculators/index.ts`:

```typescript
import { yourCalculatorDefinition } from "@/components/calculators/your-calculator/your-calculator-calculator";

export const calculatorDefinitions = [
  dcaCalculatorDefinition,
  yourCalculatorDefinition, // ← Add here
] as CalculatorDefinition<any>[];
```

## Form Field Patterns

### Text Input
```typescript
<label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
  Token
  <input
    type="text"
    value={formState.token}
    onChange={handleFieldChange("token")}
    className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
    placeholder="e.g. ETH"
    required
  />
</label>
```

### Number Input
```typescript
<label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
  Amount (USD)
  <input
    type="number"
    min="10"
    step="10"
    value={formState.amount}
    onChange={handleFieldChange("amount")}
    className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
    placeholder="e.g. 500"
    required
  />
</label>
```

### Select Dropdown
```typescript
<label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
  Interval
  <select
    value={formState.interval}
    onChange={handleFieldChange("interval")}
    className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
  >
    <option value="weekly">Weekly</option>
    <option value="bi-weekly">Bi-weekly</option>
    <option value="monthly">Monthly</option>
  </select>
</label>
```

## Testing Checklist

- [ ] Calculator appears in CalculatorDeck dropdown
- [ ] Form renders with correct default values
- [ ] Form state updates when fields change
- [ ] Submit button triggers loading state
- [ ] Nova response is parsed correctly (summary + dataset)
- [ ] Summary panel displays bullets correctly
- [ ] Chart displays time-series data
- [ ] Error handling works (invalid inputs, API errors)
- [ ] Calculator switching preserves form state
- [ ] Recent/Favorites tracking works

## Common Issues

**Calculator doesn't show up:**
- Check import path in `index.ts`
- Verify `id` is unique and kebab-case
- Ensure export is correct

**Form fields not updating:**
- Verify field names match FormState keys exactly
- Check `handleFieldChange` is wired correctly

**Chart shows no data:**
- Verify DATA array has valid `date` (YYYY-MM-DD format)
- Ensure `price` is a number, not string
- Check console for parsing warnings

**Styling looks off:**
- Match class names exactly from DCA calculator
- Use `card-surface` for form container
- Follow responsive grid pattern: `sm:grid-cols-2`

