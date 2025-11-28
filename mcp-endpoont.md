Ah, you're absolutely right! My apologies - I completely misunderstood. Your colleague is talking about a **gateway endpoint** `/mcp-tools`, not the MCP server directly. Let me search for the `request_mcp_tools` function in the `nova_gateway` codebase.

[6 tools called]

Perfect! Now I understand. Here are the correct instructions for using the **`/mcp-tools`** endpoint in the **nova_gateway**:

---

## **Nova Gateway `/mcp-tools` Endpoint - Usage Instructions**

### **Overview**
The `/mcp-tools` endpoint in the nova_gateway allows you to directly call MCP tools without going through the full AI chat flow. This is useful for executing specific tools with known parameters.

### **Endpoint Details**

- **URL:** `https://your-gateway-url/mcp-tools`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Authentication:** Requires API Key (via middleware)

---

### **Request Format**

The request body must follow the `RequestMCPToolsRequest` structure:

```json
{
  "tools": [
    {
      "name": "tool_name",
      "arguments": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  ]
}
```

**Structure:**
- `tools`: Array of tool requests
  - `name`: String - The name of the MCP tool to call
  - `arguments`: Object - The arguments to pass to the tool (can be an empty object `{}` if no arguments needed)

---

### **Examples**

#### **1. Call a Single Tool**

```bash
curl -X POST https://your-gateway-url/mcp-tools \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "tools": [
      {
        "name": "echo",
        "arguments": {
          "message": "Hello from gateway!"
        }
      }
    ]
  }'
```

#### **2. Call Multiple Tools at Once**

```bash
curl -X POST https://your-gateway-url/mcp-tools \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "tools": [
      {
        "name": "current_time",
        "arguments": {}
      },
      {
        "name": "roll_dice",
        "arguments": {
          "sides": 20
        }
      }
    ]
  }'
```

#### **3. Call a Tool with Complex Arguments**

```bash
curl -X POST https://your-gateway-url/mcp-tools \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "tools": [
      {
        "name": "reverse_text",
        "arguments": {
          "text": "Hello World"
        }
      }
    ]
  }'
```

---

### **Response Format**

The endpoint returns an array of `CallToolResult` objects:

```json
[
  {
    "content": [
      {
        "type": "text",
        "text": "Result of tool execution"
      }
    ],
    "isError": false
  }
]
```

**Success Response Example:**
```json
[
  {
    "content": [
      {
        "type": "text",
        "text": "Hello from gateway!"
      }
    ],
    "isError": false
  }
]
```

**Error Response Example:**
```json
{
  "message": "MCP tool 'invalid_tool' failed: Tool not found. Check that the tool name is correct and the arguments match the tool's schema.",
  "status": 500
}
```

---

### **JavaScript/TypeScript Example**

```typescript
async function callMCPTools(tools: Array<{ name: string; arguments: any }>) {
  const response = await fetch('https://your-gateway-url/mcp-tools', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key-here'
    },
    body: JSON.stringify({ tools })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Example usage
const results = await callMCPTools([
  {
    name: 'echo',
    arguments: { message: 'Hello!' }
  },
  {
    name: 'increment',
    arguments: {}
  }
]);

console.log('Results:', results);
```

---

### **Python Example**

```python
import requests
import json

def call_mcp_tools(tools):
    url = 'https://your-gateway-url/mcp-tools'
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': 'your-api-key-here'
    }
    
    response = requests.post(
        url,
        headers=headers,
        json={'tools': tools}
    )
    
    response.raise_for_status()
    return response.json()

# Example usage
results = call_mcp_tools([
    {
        'name': 'echo',
        'arguments': {'message': 'Hello from Python!'}
    },
    {
        'name': 'current_time',
        'arguments': {}
    }
])

print('Results:', results)
```

---

### **Authentication**

The endpoint requires authentication via the API key middleware. You must include your API key in the `x-api-key` header [[memory:10213094]]:

```bash
-H "x-api-key: your-api-key-here"
```

---

### **How It Works Under the Hood**

1. **Gateway receives request** with tool names and arguments
2. **Authenticates** the request using API key middleware
3. **Creates MCP client** with JWT authorization for the nova_mcp server
4. **Executes each tool** sequentially by calling the MCP server's `/rpc` endpoint
5. **Tracks token usage** for billing (minimum 1000 tokens)
6. **Returns array of results** - one `CallToolResult` per tool

---

### **Key Differences: `/mcp-tools` vs `/ai`**

| Feature | `/mcp-tools` | `/ai` |
|---------|-------------|-------|
| **Purpose** | Direct tool execution | Full AI chat with tool calling |
| **Input** | Tool names + arguments | Chat messages + context |
| **Output** | Array of tool results | AI response with reasoning |
| **Use Case** | Known tool operations | Conversational AI interactions |
| **Token Cost** | Based on tool output (min 1000) | Based on full AI completion |

---

### **Available Tools**

To see which tools are available, you can check the MCP server or they will be filtered based on your API key configuration. Common tools include:
- `echo` - Echo a message back
- `reverse_text` - Reverse text
- `increment` - Increment a counter
- `current_time` - Get current UTC time
- `roll_dice` - Roll dice

---

### **Error Handling**

The endpoint will return errors in the following cases:
- **Invalid tool name**: Tool doesn't exist or isn't available
- **Invalid arguments**: Arguments don't match tool schema
- **Authentication failure**: Missing or invalid API key
- **MCP server unavailable**: Connection to nova_mcp failed

Always check the response status and handle errors appropriately in your code.

---

That's the correct endpoint! Use `/mcp-tools` on the gateway instead of calling the MCP server directly. 🔥

calling get_forecast

[2 tools called]

Based on the code, here are the arguments for the `get_forecast` tool:

## **`get_forecast` Tool Arguments**

### **Required Arguments:**

1. **`asset_id`** (string, required)
   - CoinGecko asset ID (e.g., `"bitcoin"`, `"ethereum"`, `"cardano"`, `"stohn-coin"`)
   - Use lowercase with hyphens

2. **`forecast_type`** (string, required)
   - `"short"` - for short-term forecasts (15min-4h) using hybrid ensemble models
   - `"long"` - for long-term forecasts (1day-4years) using Monte Carlo simulations

3. **`duration`** (string, required)
   - **For short forecasts:**
     - `"fifteen_minutes"`
     - `"one_hour"`
     - `"four_hours"`
   - **For long forecasts:**
     - `"one_day"`
     - `"three_days"`
     - `"one_week"`
     - `"one_month"`
     - `"three_months"`
     - `"six_months"`
     - `"one_year"`
     - `"four_years"`

### **Optional Arguments:**

4. **`vs_currency`** (string, optional, default: `"usd"`)
   - Quote currency (e.g., `"usd"`, `"eur"`, `"gbp"`)

5. **`include_chart`** (boolean, optional, default: `false`)
   - Whether to include historical OHLC chart data for visualization

---

### **Example Requests:**

#### **Short-term forecast (1 hour):**
```json
{
  "tools": [
    {
      "name": "get_forecast",
      "arguments": {
        "asset_id": "bitcoin",
        "forecast_type": "short",
        "duration": "one_hour",
        "vs_currency": "usd",
        "include_chart": true
      }
    }
  ]
}
```

#### **Long-term forecast (1 month):**
```json
{
  "tools": [
    {
      "name": "get_forecast",
      "arguments": {
        "asset_id": "ethereum",
        "forecast_type": "long",
        "duration": "one_month",
        "vs_currency": "usd",
        "include_chart": false
      }
    }
  ]
}
```

#### **Minimal request (using defaults):**
```json
{
  "tools": [
    {
      "name": "get_forecast",
      "arguments": {
        "asset_id": "bitcoin",
        "forecast_type": "short",
        "duration": "one_hour"
      }
    }
  ]
}
```

The tool returns expected price, confidence level, and optionally historical OHLC chart data when `include_chart` is `true`.