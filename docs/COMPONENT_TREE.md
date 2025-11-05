# Calculator Component Tree

## Component Hierarchy

```
CalculatorHubSection (Entry Point)
│
├── CalculatorWorkspace (Layout Container)
│   │
│   ├── Controls Section
│   │   ├── CalculatorDeck (Dropdown Selector)
│   │   │   ├── Search Input
│   │   │   ├── Favorites Section
│   │   │   ├── Recent Section
│   │   │   └── All Calculators List
│   │   └── Clear History Button
│   │
│   ├── Calculator Panel (Left)
│   │   └── CalculatorFormComponent (Dynamic)
│   │       └── [Your Calculator Form]
│   │           ├── Form Fields (token, amount, interval, etc.)
│   │           ├── Submit Button
│   │           └── Error Display
│   │
│   ├── Summary Panel (Right)
│   │   └── SummaryPanel
│   │       ├── Title: "Nova's takeaway"
│   │       ├── CalculatorSpinner (when loading)
│   │       └── Bullet List (from parsed summary)
│   │           └── MessageParser (for each line)
│   │
│   └── Chart Panel (Bottom)
│       └── PriceTrajectoryPanel
│           ├── Title: "Price trajectory"
│           ├── CalculatorSpinner (when loading/empty)
│           └── Chart.js Canvas (when data available)
│               └── Line Chart (date vs price)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interaction                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CalculatorForm Component                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Form State (per calculator)                              │  │
│  │ {                                                         │  │
│  │   token: "ETH",                                          │  │
│  │   amount: "500",                                         │  │
│  │   interval: "bi-weekly",                                  │  │
│  │   duration: "6 months"                                    │  │
│  │ }                                                         │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ onSubmit
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              CalculatorHubSection.handleSubmit()                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Extract formState from calculatorStates map          │  │
│  │ 2. Call definition.getRequestConfig(formState)           │  │
│  │    └── buildPrompt(formState)                            │  │
│  │    └── buildNovaRequestOptions(prompt)                    │  │
│  │ 3. Set loading state                                     │  │
│  │ 4. Call requestNova(prompt, options)                     │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ reply: string
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              CalculatorHubSection.handleSubmit()                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. Call definition.parseReply(reply)                     │  │
│  │    └── parseSummaryAndDataset(reply)                      │  │
│  │        ├── Extract SUMMARY section → summary string      │  │
│  │        └── Parse DATA JSON array → TimeSeriesPoint[]     │  │
│  │ 6. Update state: setSummary(parsedSummary)              │  │
│  │ 7. Update state: setDataset(parsedDataset)                │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        State Updates                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ summary: string                                         │  │
│  │ dataset: TimeSeriesPoint[]                              │  │
│  │ isLoading: false                                        │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Component Re-render                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SummaryPanel                                             │  │
│  │ ├── formatSummary(summary) → string[]                   │  │
│  │ └── Render bullet list                                  │  │
│  │                                                          │  │
│  │ PriceTrajectoryPanel                                     │  │
│  │ ├── Chart.js renders dataset                            │  │
│  │ └── Labels: dataset.map(p => p.date)                    │  │
│  │ └── Data: dataset.map(p => p.price)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## State Management

```
CalculatorHubSection State:
├── activeCalculatorId: string
│   └── Currently selected calculator ID
│
├── calculatorStates: Record<string, FormState>
│   └── Per-calculator form state persistence
│   └── Example: { "dca": { token: "ETH", ... }, "va": { ... } }
│
├── summary: string
│   └── Raw summary text from Nova
│
├── dataset: TimeSeriesPoint[]
│   └── Array of { date, price } points
│
├── isLoading: boolean
│   └── Request in progress
│
├── error: string | null
│   └── Error message if request fails
│
├── recentCalculatorIds: string[]
│   └── Last 4 calculators used (for deck ordering)
│
└── favoriteCalculatorIds: string[]
    └── User-favorited calculators (for deck ordering)
```

## Calculator Registration Flow

```
1. Create Calculator File
   └── src/components/calculators/{name}/{name}-calculator.tsx
       └── Export: {name}CalculatorDefinition

2. Import in Index
   └── src/components/calculators/index.ts
       └── import { {name}CalculatorDefinition } from "..."
       └── Add to calculatorDefinitions array

3. Auto-Discovery
   └── CalculatorHubSection reads calculatorDefinitions
   └── CalculatorDeck maps over definitions
   └── Form renders based on activeDefinition.Form

4. State Initialization
   └── On first use: definition.getInitialState()
   └── Stored in: calculatorStates[calculatorId]
   └── Persists across calculator switches
```

## Calculator Definition Contracts

### Required Functions

```typescript
getInitialState(): FormState
├── Returns default form values
└── Called once per calculator on first use

getRequestConfig(formState: FormState): CalculatorRequestConfig
├── Builds prompt from form state
├── Returns { prompt: string, options: RequestInit }
└── Called on form submit

parseReply(reply: string): CalculatorResult
├── Parses Nova's response
├── Extracts summary and dataset
└── Called after Nova responds
```

### Optional Functions

```typescript
formatSummary?(summary: string): string[]
├── Custom formatting for summary bullets
└── Default: formatSummaryLines

getSeriesLabel?(formState: FormState): string
├── Dynamic chart series label
└── Default: "Modeled price"
```

## Key Utilities

### buildFieldChangeHandler
```typescript
// Creates type-safe field change handler
const handler = buildFieldChangeHandler(onFormStateChange);
handler("token")("ETH"); // Updates formState.token = "ETH"
```

### joinPromptLines
```typescript
// Joins prompt fragments, filters falsy values
joinPromptLines([
  "Line 1",
  false,        // Filtered out
  "Line 2",
  null,         // Filtered out
  "Line 3"
]);
// Result: "Line 1\nLine 2\nLine 3"
```

### buildNovaRequestOptions
```typescript
// Builds Nova API request config
buildNovaRequestOptions(prompt, {
  max_tokens: 18000,
  temperature: 0.0
});
// Returns: { prompt, options: { body: JSON.stringify(...) } }
```

### parseSummaryAndDataset
```typescript
// Extracts SUMMARY and DATA from Nova response
parseSummaryAndDataset(reply);
// Returns: { summary: string, dataset: TimeSeriesPoint[] }
// Handles:
// - Missing SUMMARY/DATA sections
// - Malformed JSON
// - Invalid date/price formats
// - Empty arrays
```

### formatSummaryLines
```typescript
// Normalizes bullet point summary
formatSummaryLines("- First point\n- Second point");
// Returns: ["First point", "Second point"]
// Strips "- " prefix, filters empty lines
```

## Calculator Switching Flow

```
User selects new calculator in CalculatorDeck
    │
    ▼
handleCalculatorChange(nextId)
    │
    ├── setActiveCalculatorId(nextId)
    │
    ├── Update recentCalculatorIds
    │   └── Move nextId to front, limit to 4
    │
    ├── Load or initialize state
    │   └── If calculatorStates[nextId] exists → use it
    │   └── Else → definition.getInitialState()
    │
    ├── Reset UI state
    │   ├── setDataset([])
    │   ├── setError(null)
    │   └── setSummary(definition.initialSummary)
    │
    └── setIsDeckOpen(false)
        └── Close calculator selector
```

## Error Handling

```
Form Submit Error Path:
    │
    ├── try/catch around requestNova()
    │
    ├── On Error:
    │   ├── setError(error.message)
    │   ├── setDataset([])
    │   ├── setSummary("Nova couldn't complete...")
    │   └── setIsLoading(false)
    │
    └── On Success but no data:
        └── setError("Nova didn't return price history...")
            └── Still shows summary, just no chart
```

## Nova Response Format

All calculators must instruct Nova to return:

```
SUMMARY:
- First bullet point
- Second bullet point  
- Third bullet point
DATA:
[{"date":"2024-01-01","price":123.45},{"date":"2024-01-15","price":125.67}]
```

The `parseSummaryAndDataset()` utility handles:
- Finding SUMMARY: label
- Finding DATA: label  
- Extracting JSON array
- Validating date format (YYYY-MM-DD)
- Converting price to number
- Filtering invalid entries
- Fallback messages


