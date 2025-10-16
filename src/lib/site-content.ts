export const navigationLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#markets", label: "Markets" },
  { href: "#protocols", label: "Protocols" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#insights", label: "Insights" }
] as const;

export const strategyMonitor = [
  {
    name: "Stable Yield Loop",
    tag: "Safe",
    netApr: "+14.2%",
    rewards: "USDC + OP",
    health: 92,
    status: "Low volatility, optimal collateral"
  },
  {
    name: "ETH Liquid Staking",
    tag: "Balanced",
    netApr: "+8.7%",
    rewards: "stETH",
    health: 86,
    status: "Restake points accruing via EigenLayer"
  },
  {
    name: "Multi-chain Lending",
    tag: "Growth",
    netApr: "+21.9%",
    rewards: "ARB + GMX",
    health: 74,
    status: "Bridged capital monitoring health checks"
  }
] as const;

export const marketPulseMetrics = [
  {
    label: "Total DeFi TVL",
    value: "$78.4B",
    change: 2.3,
    descriptor: "7d net inflows"
  },
  {
    label: "24h Protocol Volume",
    value: "$6.1B",
    change: -1.1,
    descriptor: "Across 12 tracked networks"
  },
  {
    label: "Avg. Stablecoin APY",
    value: "5.4%",
    change: 0.6,
    descriptor: "Weighted across top pools"
  },
  {
    label: "Risk Alerts",
    value: "3 Active",
    change: 0,
    descriptor: "Governance + oracle anomalies"
  }
] as const;

export const protocolFilters = [
  "TVL",
  "Category",
  "Growth",
  "Chain",
  "Governance"
] as const;

export const protocolLeaders = [
  {
    name: "Lido",
    chain: "Ethereum",
    category: "Liquid Staking",
    tvl: "$15.2B",
    change: 3.2,
    governanceNote: "Staked withdrawal queue clears in 2d",
    risk: "Safe",
    sponsored: false
  },
  {
    name: "Aave v3",
    chain: "Multi-chain",
    category: "Lending",
    tvl: "$7.9B",
    change: 1.4,
    governanceNote: "New collateral listing vote ongoing",
    risk: "Balanced",
    sponsored: false
  },
  {
    name: "Curve Finance",
    chain: "Ethereum",
    category: "Stable DEX",
    tvl: "$4.8B",
    change: -0.8,
    governanceNote: "Gauge weight snapshot in 6h",
    risk: "Balanced",
    sponsored: true
  },
  {
    name: "GMX",
    chain: "Arbitrum",
    category: "Perps",
    tvl: "$1.9B",
    change: 4.6,
    governanceNote: "Synthetic markets beta live",
    risk: "Growth",
    sponsored: false
  },
  {
    name: "MakerDAO",
    chain: "Ethereum",
    category: "CDP",
    tvl: "$7.1B",
    change: 0.9,
    governanceNote: "Endgame phase 2 discussion thread",
    risk: "Safe",
    sponsored: false
  },
  {
    name: "Pendle",
    chain: "Ethereum",
    category: "Yield Trading",
    tvl: "$640M",
    change: 6.1,
    governanceNote: "vePENDLE boost proposal drafted",
    risk: "Growth",
    sponsored: false
  }
] as const;

export const toolkitHighlights = [
  {
    title: "Cross-chain coverage",
    description:
      "Track portfolios across 12+ L1 and L2 networks with unified metrics, synchronized benchmarks, and chain-aware alerts.",
    icon: "networks",
    meta: "Ethereum · BNB · Polygon · Base · Solana"
  },
  {
    title: "Risk-scored strategies",
    description:
      "Compare volatility, collateral usage, and reward decay with intuitive gauges so teams can deploy liquidity confidently.",
    icon: "risk",
    meta: "Health scoring · Stress tests · Alerts"
  },
  {
    title: "Team-ready workspaces",
    description:
      "Collaborate with shared dashboards, export-ready CSVs, scheduled summaries, and role-based notifications.",
    icon: "collaboration",
    meta: "Exports · Email digests · Shared alerts"
  },
  {
    title: "Calculator Sandbox",
    description:
      "Assemble drag-and-drop modules like token price, borrow rate, and incentive boosts into custom calculators in minutes.",
    icon: "sandbox",
    meta: "Visual builder · Version history · Templates"
  }
] as const;

export const novaSuggestions = [
  "How can I calculate leveraged staking yield?",
  "Explain TVL vs APY like I'm new to DeFi",
  "What governance votes should I watch this week?"
] as const;

export const deliverables = [
  {
    title: "Mood boards & palette",
    description:
      "Curate inspiration references (Stohn gradients, PancakeSwap pastels) and lock in the blue/green core palette plus supporting accents."
  },
  {
    title: "Responsive wireframes",
    description:
      "Map desktop and mobile flows for hero, protocol discovery, toolkit highlights, and Nova entry points before committing to visuals."
  },
  {
    title: "High-fidelity mockups",
    description:
      "Render the final dark-mode UI with hover states, chart treatments, empty states, and modular panels that flex as new data sources arrive."
  },
  {
    title: "Component library & handoff",
    description:
      "Document reusable cards, buttons, chat panels, and annotations so engineers can implement quickly without guessing spacing or tokens."
  }
] as const;

export const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "#overview" },
      { label: "Protocols", href: "#protocols" },
      { label: "Toolkit", href: "#toolkit" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "Strategy Monitor", href: "#overview" },
      { label: "Nova Assistant", href: "#nova" },
      { label: "Calculator Sandbox", href: "#toolkit" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Getting Started", href: "#insights" },
      { label: "Community", href: "#footer-community" },
      { label: "Support", href: "mailto:hello@deficalc.io" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#overview" },
      { label: "Advertise", href: "#protocols" },
      { label: "Contact", href: "mailto:partners@deficalc.io" }
    ]
  }
] as const;

export const socialLinks = [
  { label: "Twitter", href: "https://twitter.com/" },
  { label: "Telegram", href: "https://t.me/" },
  { label: "GitHub", href: "https://github.com/" }
] as const;
