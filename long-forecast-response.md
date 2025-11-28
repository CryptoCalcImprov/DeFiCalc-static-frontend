{
  "forecast": {
    "type": "long",
    "value": {
      "horizon": "one_year",
      "mean_price": 4638.63,
      "percentile_10": 2150.12,
      "percentile_90": 7890.45,
      "confidence": 0.72,
      "technical_signals": {
        "rsi": 49.51,
        "macd_divergence": -213.55,
        "bollinger_width": 0.32,
        "trend_strength": 7.05
      },
      "ml_prediction": 4420.10,
      "sentiment": {
        "news_score": 0.0,
        "social_score": 0.0
      },
      "sample_paths": [
        {
          "label": "bearish",
          "points": [
            3582.41,
            3545.12,
            3510.55,
            "...",
            2150.12
          ]
        },
        {
          "label": "mean",
          "points": [
            3582.41,
            3605.33,
            3628.15,
            "...",
            4638.63
          ]
        },
        {
          "label": "bullish",
          "points": [
            3582.41,
            3680.45,
            3750.88,
            "...",
            7890.45
          ]
        }
      ]
    }
  },
  "chart": {
    "history": [
      {
        "timestamp": "2024-11-27T00:00:00Z",
        "open": 3580.00,
        "high": 3600.00,
        "low": 3550.00,
        "close": 3582.41,
        "volume": 15000000000.0
      },
      {
        "timestamp": "2024-11-28T00:00:00Z",
        "open": 3582.41,
        "high": 3620.00,
        "low": 3570.00,
        "close": 3610.20,
        "volume": 14500000000.0
      },
      "..."
    ],
    "projection": [
      {
        "timestamp": "2025-11-28T00:00:00Z",
        "percentile_10": 3550.10,
        "mean": 3605.12,
        "percentile_90": 3660.50
      },
      {
        "timestamp": "2025-11-29T00:00:00Z",
        "percentile_10": 3540.20,
        "mean": 3615.45,
        "percentile_90": 3690.80
      },
      "...",
      {
        "timestamp": "2026-11-27T00:00:00Z",
        "percentile_10": 2150.12,
        "mean": 4638.63,
        "percentile_90": 7890.45
      }
    ]
  }
}