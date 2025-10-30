export const navigationLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#workspace", label: "Calculator Lab" },
  { href: "#workspace", label: "Sandbox" },
  { href: "#markets", label: "Markets & DeFi" },
  { href: "#insights", label: "AI Insights by Nova" }
] as const;

export const heroStrategies = [
  {
    name: "Stable Yield Loop",
    netApr: "8.4%",
    rewards: "USDC + OP",
    health: "92",
    riskLevel: "Safe",
    riskTone: "low",
    tags: ["Multi-chain", "Auto-compound"]
  },
  {
    name: "ETH Liquid Staking",
    netApr: "6.1%",
    rewards: "stETH",
    health: "87",
    riskLevel: "Balanced",
    riskTone: "medium",
    tags: ["LST", "Ethereum"]
  },
  {
    name: "Multi-chain Lending",
    netApr: "12.5%",
    rewards: "ARB + GMX",
    health: "74",
    riskLevel: "Adventurous",
    riskTone: "high",
    tags: ["Looping", "Volatile"]
  }
] as const;

export const protocolFilters = {
  sortOptions: ["TVL", "24h Growth", "Category"],
  categories: ["Liquid Staking", "Lending", "CDP", "DEX Aggregator"],
  chains: ["Ethereum", "Solana", "Arbitrum", "Polygon"]
} as const;

export const marketPulse = {
  totals: [
    { label: "Total TVL", value: "$47.2B", change: "+2.1%" },
    { label: "Stablecoin Cap", value: "$129.4B", change: "-0.4%" },
    { label: "DEX Volume (24h)", value: "$5.7B", change: "+6.2%" }
  ],
  trending: [
    { name: "rETH - wstETH", metric: "APR 6.9%", change: "+0.5%" },
    { name: "USDC - USDT", metric: "Fees $1.2M", change: "+3.4%" },
    { name: "ARB Perps", metric: "OI $420M", change: "-1.1%" }
  ],
  alerts: [
    { title: "Maker vault health", detail: "3 vaults below 160% collateral" },
    { title: "Solana staking", detail: "Epoch 517 rewards posting in 2h" },
    { title: "Perps funding flips", detail: "ETH perpetuals turn positive on major venues" }
  ]
} as const;

export const protocolLeaders = [
  {
    name: "Lido",
    chain: "Ethereum",
    category: "Liquid Staking",
    tvl: "$15.4B",
    change24h: "+1.8%",
    governanceNote: "Governance vote closes in 3 days",
    changeDirection: "up"
  },
  {
    name: "Aave V3",
    chain: "Multi-chain",
    category: "Lending",
    tvl: "$6.7B",
    change24h: "+0.6%",
    governanceNote: "New collateral listing proposed",
    changeDirection: "up"
  },
  {
    name: "MakerDAO",
    chain: "Ethereum",
    category: "CDP",
    tvl: "$5.1B",
    change24h: "-0.9%",
    governanceNote: "Endgame plan update posted",
    changeDirection: "down"
  },
  {
    name: "GMX",
    chain: "Arbitrum",
    category: "Perpetuals",
    tvl: "$1.3B",
    change24h: "+3.1%",
    governanceNote: "Fee switch pilot in progress",
    changeDirection: "up"
  },
  {
    name: "Jupiter",
    chain: "Solana",
    category: "DEX Aggregator",
    tvl: "$870M",
    change24h: "+4.6%",
    governanceNote: "Community airdrop round 2",
    changeDirection: "up"
  },
  {
    name: "Pendle",
    chain: "Ethereum",
    category: "Yield Markets",
    tvl: "$610M",
    change24h: "-1.2%",
    governanceNote: "vePENDLE boost proposal",
    changeDirection: "down",
    sponsored: true
  }
] as const;

export const toolkitHighlights = [
  {
    title: "Cross-chain coverage",
    description:
      "Track opportunities across 12+ networks with unified metrics, curated benchmarks, and actionable alerts.",
    icon: "network",
    networks: ["Ethereum", "BNB", "Polygon", "Arbitrum", "Solana"]
  },
  {
    title: "Risk-scored strategies",
    description:
      "See volatility, collateral usage, and health factors at a glance so you can size positions confidently.",
    icon: "gauge"
  },
  {
    title: "Team-ready workspaces",
    description:
      "Collaborate on dashboards, export CSVs, schedule email summaries, and route alerts to the right teammates.",
    icon: "team"
  },
  {
    title: "Calculator Sandbox",
    description:
      "Drag and drop formula blocks like token price, borrow rate, and emissions to model custom DeFi plays.",
    icon: "sandbox"
  }
] as const;

export const insightHighlights = [
  "Getting Started", "Yield Explainers", "Risk Playbooks"
] as const;

export const insightsLibrary = [
  {
    title: "DeFi 101",
    description: "A friendly primer that breaks down TVL, APY, and smart contract risk with interactive explainers.",
    action: "Start tutorial"
  },
  {
    title: "Yield Explainers",
    description: "Understand how staking, liquidity mining, and delta-neutral strategies stack in different market regimes.",
    action: "Browse guides"
  },
  {
    title: "Risk Playbooks",
    description: "Scenario templates to stress-test positions across liquidation levels, volatility, and oracle shocks.",
    action: "Open playbooks"
  },
  {
    title: "Nova Desk Briefs",
    description: "Replay Nova’s daily AI briefings with governance alerts, liquidity moves, and action checklists for your desk.",
    action: "Review briefs"
  }
] as const;

export const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "#workspace", label: "Calculator Lab" },
      { href: "#markets", label: "Market Pulse" },
      { href: "#defi", label: "Protocol Watch" },
      { href: "#insights", label: "AI Insights" }
    ]
  },
  {
    title: "Nova AI",
    links: [
      { href: "#insights", label: "Education Hub" },
      { href: "#nova", label: "Nova Assistant" },
      { href: "/main_app", label: "Launch Nova Workspace" }
    ]
  },
  {
    title: "Resources",
    links: [
      { href: "#workspace", label: "Module Sandbox" },
      { href: "#markets", label: "Risk & Alert Monitor" },
      { href: "#insights", label: "Nova Desk Briefs" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "https://twitter.com", label: "X (Twitter)", external: true },
      { href: "https://discord.com", label: "Discord", external: true },
      { href: "mailto:hello@deficalc.io", label: "Contact" }
    ]
  }
] as const;

export const socialLinks = [
  { href: "https://twitter.com", label: "X (Twitter)" },
  { href: "https://discord.com", label: "Discord" },
  { href: "https://github.com", label: "GitHub" }
] as const;
