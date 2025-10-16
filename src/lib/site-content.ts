export const navigationLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#markets", label: "Markets" },
  { href: "#protocols", label: "Protocols" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#insights", label: "Insights" }
] as const;

export const heroHighlights = [
  {
    label: "Unified analytics",
    description: "Blend on-chain and off-chain data to understand protocol health at a glance."
  },
  {
    label: "Guided onboarding",
    description: "Explain complex DeFi concepts with approachable tooltips and micro-copy."
  },
  {
    label: "Future-ready modules",
    description: "Design space for Nova AI, calculator sandbox and sponsored insights."
  }
] as const;

export const strategyMonitorEntries = [
  {
    name: "Stable Yield Loop",
    chain: "Optimism",
    netApr: 8.4,
    rewards: "USDC + OP",
    health: 92,
    riskLabel: "Safe",
    riskTone: "success",
    note: "Leverages Velodrome incentives with conservative leverage."
  },
  {
    name: "ETH Liquid Staking",
    chain: "Ethereum",
    netApr: 5.9,
    rewards: "stETH",
    health: 87,
    riskLabel: "Balanced",
    riskTone: "warning",
    note: "Blend of Lido and Rocket Pool positions with coverage alerts."
  },
  {
    name: "Multi-chain Lending",
    chain: "Polygon",
    netApr: 12.1,
    rewards: "MATIC + USDT",
    health: 71,
    riskLabel: "Watch",
    riskTone: "danger",
    note: "Tracks utilisation spikes across Aave v3 deployments."
  }
] as const;

export const protocolFilters = [
  "All chains",
  "TVL",
  "Category",
  "Governance",
  "Sponsored"
] as const;

export const protocolLeaders = [
  {
    name: "Lido",
    chain: "Ethereum",
    category: "Liquid Staking",
    tvl: "$19.4B",
    change24h: 2.1,
    governanceNote: "Governance vote closes in 3 days",
    sponsored: false
  },
  {
    name: "Aave v3",
    chain: "Multi-chain",
    category: "Lending",
    tvl: "$12.7B",
    change24h: -1.4,
    governanceNote: "New collateral listing proposed",
    sponsored: false
  },
  {
    name: "EigenLayer",
    chain: "Ethereum",
    category: "Restaking",
    tvl: "$9.2B",
    change24h: 4.5,
    governanceNote: "Operator onboarding wave starts next week",
    sponsored: true
  },
  {
    name: "Jupiter",
    chain: "Solana",
    category: "DEX Aggregator",
    tvl: "$1.8B",
    change24h: 6.3,
    governanceNote: "Community sprint review posted",
    sponsored: false
  },
  {
    name: "MakerDAO",
    chain: "Ethereum",
    category: "CDP",
    tvl: "$6.5B",
    change24h: 1.2,
    governanceNote: "Spark Lend revenue report released",
    sponsored: false
  },
  {
    name: "Radiant Capital",
    chain: "Arbitrum",
    category: "Lending",
    tvl: "$790M",
    change24h: 3.8,
    governanceNote: "Emissions reduction vote underway",
    sponsored: false
  }
] as const;

export const featureHighlights = [
  {
    title: "Cross-chain coverage",
    description:
      "Track performance across 12+ networks with unified metrics, benchmark scoring and native chain badges.",
    accent: "from-primary to-accent",
    details: ["Unified TVL methodology", "Network switcher", "Latency-aware refresh"],
    icon: "network"
  },
  {
    title: "Risk-scored strategies",
    description:
      "Combine volatility, utilisation and collateral health to surface risk-aware opportunities with clear guardrails.",
    accent: "from-accent to-highlight",
    details: ["Transparent scoring", "Health factor history", "Alert presets"],
    icon: "gauge"
  },
  {
    title: "Team-ready workspaces",
    description:
      "Collaborate with teammates via shared dashboards, scheduled recaps, CSV exports and alert routing.",
    accent: "from-highlight to-primary",
    details: ["Roles & permissions", "Scheduled email digests", "One-click CSV export"],
    icon: "collaboration"
  },
  {
    title: "Calculator sandbox",
    description:
      "Preview the drag-and-drop builder for custom ROI formulas before Nova automation ships.",
    accent: "from-primary to-highlight",
    details: ["Draggable inputs", "Formula timeline", "Save & share templates"],
    icon: "sandbox"
  }
] as const;

export const deliverableMilestones = [
  {
    title: "Mood boards & palette",
    description: "Curate dark-mode inspiration (Stohn, PancakeSwap) and finalise the blue/green accent set.",
    status: "In discovery",
    tasks: ["Collect 6-8 reference shots", "Document colour ramps & contrast ratios", "Share palette tokens"]
  },
  {
    title: "Responsive wireframes",
    description: "Outline hero, protocol grid, toolkit highlights and Nova entry points for desktop & mobile.",
    status: "Sketching",
    tasks: ["Define 12-column desktop grid", "Mobile stacking rules", "Dedicated Nova panel slot"]
  },
  {
    title: "High-fidelity mockups",
    description: "Produce polished screens with typography, gradients, hover states and sponsored callouts.",
    status: "Upcoming",
    tasks: ["Hero + dashboard overview", "Protocol detail view", "Nova chat interaction"]
  },
  {
    title: "Component library",
    description: "Assemble reusable buttons, cards, badges and chat modules for smoother engineering handoff.",
    status: "Planned",
    tasks: ["Tokens in Figma", "Annotation specs", "Publish to design system"]
  }
] as const;

export const novaSuggestions = [
  "How can I calculate yield on my LP position?",
  "Explain TVL vs APY like I'm new to DeFi.",
  "Show protocols with low liquidation risk.",
  "What changed in EigenLayer governance this week?"
] as const;

export const footerColumns = [
  {
    title: "Platform",
    links: [
      { href: "#overview", label: "Overview" },
      { href: "#protocols", label: "Protocols" },
      { href: "#toolkit", label: "Toolkit" },
      { href: "#insights", label: "Insights" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { href: "#markets", label: "Market monitoring" },
      { href: "#protocols", label: "Risk scoring" },
      { href: "#toolkit", label: "Team workspaces" },
      { href: "#toolkit", label: "Calculator sandbox" }
    ]
  },
  {
    title: "Resources",
    links: [
      { href: "#insights", label: "Getting started" },
      { href: "#insights", label: "Design roadmap" },
      { href: "https://stohn.xyz", label: "Stohn inspiration", external: true },
      { href: "https://coingecko.com", label: "Market references", external: true }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "https://twitter.com", label: "Updates", external: true },
      { href: "https://discord.com", label: "Community", external: true },
      { href: "mailto:design@deficalc.io", label: "Contact" },
      { href: "https://github.com", label: "Open source", external: true }
    ]
  }
] as const;

export const socialLinks = [
  { href: "https://twitter.com", label: "Twitter" },
  { href: "https://discord.com", label: "Discord" },
  { href: "https://github.com", label: "GitHub" }
] as const;

export const marketSnapshot = [
  {
    label: "Total DeFi TVL",
    value: "$52.3B",
    change: 3.2,
    description: "Past 7 days across tracked chains"
  },
  {
    label: "Stablecoin liquidity",
    value: "$125.6B",
    change: -0.8,
    description: "Aggregate supply with 24h delta"
  },
  {
    label: "DEX volume (24h)",
    value: "$4.7B",
    change: 5.1,
    description: "Spot + perpetual venues"
  }
] as const;

export const narrativeHighlights = [
  {
    title: "Restaking momentum",
    description: "EigenLayer warm-up draws LRT flows; highlight safety nets for new operators.",
    tag: "Insight"
  },
  {
    title: "L2 yield loops",
    description: "Optimism + Base incentives keep stablecoin loops attractive for conservative users.",
    tag: "Strategy"
  },
  {
    title: "Treasury hedging",
    description: "DAOs rotating into real-world asset strategies seek reliable reporting dashboards.",
    tag: "Governance"
  }
] as const;
