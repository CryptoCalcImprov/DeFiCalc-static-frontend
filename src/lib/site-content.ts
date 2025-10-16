export const navigationLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#markets", label: "Markets" },
  { href: "#protocols", label: "Protocols" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#insights", label: "Insights" }
] as const;

export const strategyMonitorEntries = [
  {
    name: "Stable Yield Loop",
    chain: "Arbitrum",
    netApr: "12.8%",
    rewards: "USDC + ARB",
    health: 92,
    risk: "Safe",
    description: "Delta-neutral stablecoin loop with auto-compounding rewards."
  },
  {
    name: "ETH Liquid Staking",
    chain: "Ethereum",
    netApr: "9.4%",
    rewards: "stETH",
    health: 88,
    risk: "Balanced",
    description: "Stake ETH across LST providers with auto rebalancing safeguards."
  },
  {
    name: "Multi-chain Lending",
    chain: "Base + Polygon",
    netApr: "18.2%",
    rewards: "OP",
    health: 76,
    risk: "Growth",
    description: "Diversified lending ladder capturing emissions across L2s."
  }
] as const;

export const protocolLeaders = [
  {
    name: "Lido",
    symbol: "LD",
    chain: "Ethereum",
    category: "Liquid Staking",
    tvl: "$29.6B",
    change24h: "+2.3%",
    sentiment: "up",
    governance: "Governance vote closes in 3 days"
  },
  {
    name: "Aave V3",
    symbol: "AA",
    chain: "Multi-chain",
    category: "Lending",
    tvl: "$12.4B",
    change24h: "+1.1%",
    sentiment: "up",
    governance: "New collateral listing proposed"
  },
  {
    name: "MakerDAO",
    symbol: "MK",
    chain: "Ethereum",
    category: "CDP",
    tvl: "$8.9B",
    change24h: "-0.6%",
    sentiment: "down",
    governance: "Spark subDAO update published"
  },
  {
    name: "Jupiter",
    symbol: "JU",
    chain: "Solana",
    category: "DEX Aggregator",
    tvl: "$1.9B",
    change24h: "+4.1%",
    sentiment: "up",
    governance: "Liquidity mining restart under review"
  },
  {
    name: "Pendle",
    symbol: "PE",
    chain: "Ethereum",
    category: "Yield Trading",
    tvl: "$720M",
    change24h: "+6.4%",
    sentiment: "up",
    governance: "Sponsored: Season 2 incentives live"
  },
  {
    name: "Kamino",
    symbol: "KA",
    chain: "Solana",
    category: "Structured Vaults",
    tvl: "$540M",
    change24h: "-1.8%",
    sentiment: "down",
    governance: "Risk params adjusted for SOL pairs"
  }
] as const;

export const protocolFilters = [
  "All",
  "Liquid Staking",
  "Lending",
  "CDP",
  "DEX",
  "Structured",
  "Sponsored"
] as const;

export const featureHighlights = [
  {
    title: "Cross-chain coverage",
    description: "Track performance across 12+ networks with normalized metrics, liquidity depth and benchmark scores.",
    icon: "network",
    accent: "Networks",
    detail: ["Ethereum", "BNB", "Polygon", "Base", "Solana", "Optimism"]
  },
  {
    title: "Risk-scored strategies",
    description: "Assess volatility, collateral usage and health factors so you can deploy liquidity with confidence.",
    icon: "gauge",
    accent: "Risk Engine",
    detail: ["Volatility bands", "Protocol health", "Auto rebalancing"]
  },
  {
    title: "Team-ready workspaces",
    description: "Collaborate on dashboards, export CSVs, schedule email summaries and share alerts with your team.",
    icon: "workspace",
    accent: "Collaboration",
    detail: ["Shared views", "Report exports", "Alert scheduling"]
  },
  {
    title: "Calculator sandbox",
    description: "Preview the upcoming drag-and-drop builder for custom DeFi calculators and scenario testing.",
    icon: "sandbox",
    accent: "Coming Soon",
    detail: ["Drag components", "Chain data", "Formula editor"]
  }
] as const;

export const insightPrompts = [
  "How can I calculate my blended APY across vaults?",
  "Explain TVL vs. Total Deposits",
  "What risks impact liquid staking yields right now?"
] as const;

export const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "#overview" },
      { label: "Markets", href: "#markets" },
      { label: "Protocols", href: "#protocols" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "Analyst Toolkit", href: "#toolkit" },
      { label: "Calculator Sandbox", href: "#toolkit" },
      { label: "Nova Assistant", href: "#insights" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Getting Started", href: "#insights" },
      { label: "Documentation", href: "#insights" },
      { label: "Changelog", href: "#insights" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "Community", href: "https://discord.com/invite/defi" },
      { label: "Partnerships", href: "https://t.me/deficalc" },
      { label: "Press", href: "mailto:hello@deficalc.io" }
    ]
  }
] as const;

export const socialLinks = [
  { label: "X", href: "https://twitter.com/deficalc" },
  { label: "Telegram", href: "https://t.me/deficalc" },
  { label: "GitHub", href: "https://github.com" }
] as const;
