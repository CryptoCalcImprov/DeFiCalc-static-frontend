# Calculator Process Flow Map

## Overview
The calculator system is a modular, AI-powered DeFi strategy modeling tool that uses Nova AI to generate projections, insights, and visualizations.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /main_app (Calculator Workspace)                        │  │
│  │  - CalculatorHubSection (main orchestrator)               │  │
│  │  - CalculatorDeck (calculator selector)                  │  │
│  │  - CalculatorWorkspace (layout)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Calculator Definitions                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ DCA          │  │ Buy The Dip  │  │ Trend       │        │
│  │ Calculator   │  │ Calculator   │  │ Following   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  Each calculator provides:                                     │
│  - Form component (UI)                                         │
│  - Initial state                                               │
│  - Prompt builder                                              │
│  - Reply parser                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nova AI Integration                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  nova-client.ts                                          │  │
│  │  - requestNova() → POST /ai                              │  │
│  │  - clearNovaHistory() → DELETE /ai?ref_id=...           │  │
│  │  - Session management (ref_id)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Response Processing                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  summary.ts (parseCalculatorReply)                      │  │
│  │  - Parses JSON response                                   │  │
│  │  - Extracts insight (structured)                         │  │
│  │  - Extracts dataset (time series)                         │  │
│  │  - Falls back to legacy format if needed                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Result Display                              │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ SummaryPanel    │  │ PriceTrajectory  │                   │
│  │ - Structured    │  │ Panel            │                   │
│  │   insights      │  │ - Chart.js       │                   │
│  │ - Metrics       │  │ - Time series    │                   │
│  │ - Risks         │  │   visualization  │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Process Flow

### 1. **Initialization Phase**

```
User navigates to /main_app
    │
    ▼
CalculatorHubSection mounts
    │
    ├─► Loads calculator definitions from index.ts
    │   - dcaCalculatorDefinition
    │   - buyTheDipCalculatorDefinition
    │   - trendFollowingCalculatorDefinition
    │
    ├─► Initializes state:
    │   - activeCalculatorId (defaults to first calculator)
    │   - calculatorStates (one state object per calculator)
    │   - recentCalculatorIds (local history)
    │   - favoriteCalculatorIds (user preferences)
    │
    └─► Renders CalculatorWorkspace with:
        - CalculatorDeck (selector UI)
        - CalculatorFormComponent (from active calculator)
        - SummaryPanel (initially empty)
        - PriceTrajectoryPanel (initially empty)
```

### 2. **User Input Phase**

```
User fills out calculator form (e.g., DCA)
    │
    ├─► Token: "ETH"
    ├─► Amount: "500" USD
    ├─► Interval: "bi-weekly"
    └─► Duration: "6 months"
    │
    ▼
handleFormStateChange() updates calculatorStates
    │
    └─► State stored per calculator ID
        (allows switching between calculators without losing data)
```

### 3. **Submission Phase**

```
User clicks "Run DCA projection"
    │
    ▼
handleSubmit() triggered
    │
    ├─► Sets loading state: isLoading = true
    ├─► Clears previous results (dataset, insight, error)
    ├─► Sets pending message: "Generating Nova's latest projection..."
    │
    ├─► Gets request config from active calculator:
    │   activeDefinition.getRequestConfig(formState)
    │   │
    │   └─► buildPrompt() creates structured prompt:
    │       - Instructions for Nova AI
    │       - User inputs (token, amount, interval, duration)
    │       - Expected JSON schema format
    │       - Guidelines for price path generation
    │
    ├─► Ensures Nova session ref_id:
    │   ensureNovaRefId("calculator")
    │
    └─► Calls requestNova(prompt, options, { refId })
```

### 4. **Nova AI Request Phase**

```
requestNova() in nova-client.ts
    │
    ├─► Builds request URL:
    │   - Production: NEXT_PUBLIC_NOVA_API_URL/ai
    │   - Development: /ai (relative)
    │
    ├─► Builds headers:
    │   - Content-Type: application/json
    │   - Authorization: Bearer NEXT_PUBLIC_NOVA_API_KEY
    │
    ├─► Builds request body:
    │   {
    │     "input": "<prompt>",
    │     "model": "gpt-5-mini",
    │     "verbosity": "medium",
    │     "max_tokens": 18000,
    │     "reasoning": false,
    │     "ref_id": "<session-id>"
    │   }
    │
    └─► POST request to Nova API
        │
        ▼
    Nova AI processes request
        │
        ├─► Uses coindesk tool for price data (if available)
        ├─► Generates synthetic price path
        ├─► Calculates metrics (total invested, cost basis, etc.)
        ├─► Analyzes risks and assumptions
        └─► Returns structured JSON response
```

### 5. **Response Processing Phase**

```
Nova returns JSON response
    │
    ▼
parseCalculatorReply() in summary.ts
    │
    ├─► Attempts to parse as JSON
    │
    ├─► Extracts structured insight:
    │   {
    │     "calculator": { id, label, category, version },
    │     "context": { as_of, asset, inputs, assumptions },
    │     "sections": [
    │       {
    │         "type": "performance_driver",
    │         "headline": "...",
    │         "summary": "...",
    │         "metrics": [
    │           { "label": "Total USD invested", "value": 1300 },
    │           { "label": "Estimated cost basis", "value": 1.91 }
    │         ],
    │         "assumptions": [...],
    │         "risks": [...]
    │       },
    │       {
    │         "type": "risk_assumption",
    │         ...
    │       }
    │     ],
    │     "notes": [...]
    │   }
    │
    ├─► Extracts time series dataset:
    │   {
    │     "series": [{
    │       "points": [
    │         { "date": "2024-01-01", "price": 2500.00 },
    │         { "date": "2024-01-15", "price": 2550.00 },
    │         ...
    │       ]
    │     }]
    │   }
    │
    └─► Falls back to legacy format if structured data missing:
        - Parses SUMMARY: ... DATA: [...] format
        - Extracts text summary and array of points
```

### 6. **State Update Phase**

```
parseCalculatorReply() returns CalculatorResult
    │
    ▼
handleSubmit() updates component state:
    │
    ├─► setInsight(parsedInsight)
    │   └─► Structured insight object (or null)
    │
    ├─► setDataset(parsedDataset)
    │   └─► Array of TimeSeriesPoint: [{ date, price }, ...]
    │
    ├─► setSummaryMessage("")
    │   └─► Cleared if structured insight exists
    │
    ├─► setFallbackLines([])
    │   └─► Cleared if structured insight exists
    │
    └─► setLoading(false)
```

### 7. **Display Phase**

```
Component re-renders with new data
    │
    ├─► SummaryPanel receives insight
    │   │
    │   ├─► Displays context chips (asset, as_of date)
    │   ├─► Renders SectionCard for each section:
    │   │   - Headline
    │   │   - Summary text
    │   │   - Metrics (key-value pairs)
    │   │   - Assumptions (bulleted list)
    │   │   - Risks (bulleted list)
    │   │
    │   ├─► Shows "View full insight" toggle if:
    │   │   - More than 2 sections exist
    │   │   - Hidden details (assumptions, risks) exist
    │   │   - Context inputs/assumptions exist
    │   │
    │   └─► Falls back to FallbackCard if no structured insight
    │
    └─► PriceTrajectoryPanel receives dataset
        │
        ├─► Dynamically imports Chart.js
        ├─► Creates line chart configuration:
        │   - X-axis: dates
        │   - Y-axis: prices
        │   - Styling: mint/teal colors, gradients
        │
        └─► Renders interactive chart
```

---

## Calculator Definition Structure

Each calculator follows this interface:

```typescript
type CalculatorDefinition<FormState> = {
  id: string;                    // Unique identifier
  label: string;                 // Display name
  description?: string;           // Tooltip/help text
  Form: Component;               // React form component
  getInitialState: () => FormState;  // Default form values
  getRequestConfig: (state) => {      // Builds Nova prompt
    prompt: string;
    options: RequestInit;
  };
  parseReply: (reply: string) => CalculatorResult;  // Parses Nova response
  getSeriesLabel?: (state) => string;  // Chart label
  initialSummary?: string;        // Default summary message
  pendingSummary?: string;        // Loading message
};
```

---

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Inputs     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────────┐
│ Form Component  │─────▶│ Calculator State │
│ (DCA/BTD/etc)   │      │ (per calculator) │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │ Prompt Builder   │
                          │ (getRequestConfig)│
                          └────────┬─────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │  Nova Client     │
                          │  (requestNova)   │
                          └────────┬─────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │   Nova API       │
                          │   (gpt-5-mini)   │
                          └────────┬─────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │ JSON Response     │
                          │ { insight, data } │
                          └────────┬─────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │ Reply Parser     │
                          │ (parseReply)     │
                          └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌─────────────────┐      ┌──────────────────┐
          │  CalculatorResult│      │  TimeSeriesPoint[]│
          │  - insight       │      │  [{date, price}] │
          │  - dataset       │      │                  │
          └────────┬─────────┘      └────────┬─────────┘
                   │                         │
                   └─────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   UI Components        │
                    │  - SummaryPanel        │
                    │  - PriceTrajectoryPanel│
                    └────────────────────────┘
```

---

## Key Components

### CalculatorHubSection
- **Location**: `src/components/sections/calculator-hub.tsx`
- **Role**: Main orchestrator, manages calculator state and submission flow
- **Key Functions**:
  - `handleSubmit()` - Orchestrates calculation request
  - `handleCalculatorChange()` - Switches between calculators
  - `handleClearHistory()` - Resets Nova session

### Calculator Definitions
- **Location**: `src/components/calculators/{dca,buy-the-dip,trend-following}/`
- **Role**: Define calculator-specific logic
- **Key Files**:
  - `dca-calculator.tsx` - DCA calculator implementation
  - `buy-the-dip-calculator.tsx` - Buy the dip calculator
  - `trend-following-calculator.tsx` - Trend following calculator

### Nova Client
- **Location**: `src/lib/nova-client.ts`
- **Role**: API communication layer
- **Key Functions**:
  - `requestNova()` - Sends requests to Nova API
  - `clearNovaHistory()` - Clears conversation history
  - Session management via `ref_id`

### Response Parsers
- **Location**: `src/components/calculators/utils/summary.ts`
- **Role**: Parse and normalize Nova responses
- **Key Functions**:
  - `parseCalculatorReply()` - Main parser
  - `parseInsight()` - Extracts structured insight
  - `parsePoints()` - Extracts time series data

### Display Components
- **SummaryPanel**: `src/components/calculators/workspace/SummaryPanel.tsx`
  - Displays structured insights, metrics, risks
- **PriceTrajectoryPanel**: `src/components/calculators/workspace/PriceTrajectoryPanel.tsx`
  - Renders Chart.js line chart for price data

---

## Error Handling

```
Request fails
    │
    ├─► Network error → catch block
    ├─► Nova API error → response.ok === false
    └─► Empty response → warning logged
    │
    ▼
setError(errorMessage)
setLoading(false)
    │
    └─► Error displayed in form component
```

---

## Session Management

```
Nova sessions tracked via ref_id
    │
    ├─► Calculator: ensureNovaRefId("calculator")
    ├─► Assistant: ensureNovaRefId("assistant")
    │
    ├─► Stored in localStorage
    ├─► Persists across page reloads
    └─► Can be cleared via "Clear History" button
```

---

## Example: DCA Calculator Flow

1. **User Input**:
   - Token: ETH
   - Amount: $500
   - Interval: Bi-weekly
   - Duration: 6 months

2. **Prompt Generated**:
   ```
   Using your coindesk tool, evaluate the following dollar-cost-averaging plan.
   Plan details: invest 500 USD of ETH on a bi-weekly cadence for 6 months.
   [Detailed instructions for JSON response format...]
   ```

3. **Nova Response** (simplified):
   ```json
   {
     "insight": {
       "calculator": { "id": "dca", "label": "Dollar-Cost Averaging" },
       "context": { "asset": "ETH", "as_of": "2024-01-15" },
       "sections": [
         {
           "type": "performance_driver",
           "headline": "Accumulation Strategy",
           "metrics": [
             { "label": "Total USD invested", "value": 6500 },
             { "label": "Estimated cost basis", "value": 2850 }
           ]
         }
       ]
     },
     "series": [{
       "points": [
         { "date": "2024-01-15", "price": 2800 },
         { "date": "2024-01-29", "price": 2850 },
         ...
       ]
     }]
   }
   ```

4. **Display**:
   - SummaryPanel shows metrics and insights
   - PriceTrajectoryPanel shows price chart over time

---

## Notes

- **Modular Design**: Each calculator is self-contained with its own form, prompt builder, and parser
- **State Isolation**: Each calculator maintains its own state, allowing users to switch without losing data
- **AI-Powered**: Calculations are performed by Nova AI, not client-side JavaScript
- **Structured Responses**: Uses JSON schema for consistent parsing
- **Fallback Support**: Handles both structured and legacy response formats
- **Session Persistence**: Conversation history maintained via ref_id for context



