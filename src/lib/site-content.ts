export const navigationLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#markets", label: "Markets" },
  { href: "#protocols", label: "Protocols" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#insights", label: "Insights" }
] as const;

export const heroHighlights = [
  {
    title: "Cross-chain coverage",
    description: "Track performance across 12+ networks with unified metrics and benchmarks."
  },
  {
    title: "Risk-scored strategies",
    description: "Understand volatility, health factors, and collateral usage before you deploy liquidity."
  },
  {
    title: "Team-ready workspaces",
    description: "Collaborate with exported dashboards, scheduled reports, and shared alerts."
  }
] as const;

export const heroStrategies = [
  {
    name: "Stable Yield Loop",
    metric: "Net APR",
    value: "12.4%",
    change: "+0.8%"
  },
  {
    name: "ETH Liquid Staking",
    metric: "Rewards",
    value: "4.9%",
    change: "+0.2%"
  },
  {
    name: "Multi-chain Lending",
    metric: "Health",
    value: "Safe",
    change: "88%"
  }
] as const;

export const marketStats = [
  {
    label: "Total DeFi Market Cap",
    value: "$128.7B",
    caption: "vs. yesterday",
    delta: "+2.1%",
    trend: "up"
  },
  {
    label: "24h Trading Volume",
    value: "$18.6B",
    caption: "Major DEXes",
    delta: "+12.3%",
    trend: "up"
  },
  {
    label: "Stablecoin Supply",
    value: "$139.2B",
    caption: "Circulating",
    delta: "-0.6%",
    trend: "down"
  },
  {
    label: "Total Value Locked",
    value: "$78.1B",
    caption: "Across all protocols",
    delta: "+4.2%",
    trend: "up"
  }
] as const;

export const trendingTokens = [
  {
    rank: 1,
    name: "Solana",
    symbol: "SOL",
    price: "$148.32",
    change: "+6.18%",
    tvl: "$3.9B",
    volume: "$1.8B"
  },
  {
    rank: 2,
    name: "Ether",
    symbol: "ETH",
    price: "$3,452.10",
    change: "+3.52%",
    tvl: "$29.6B",
    volume: "$8.4B"
  },
  {
    rank: 3,
    name: "Chainlink",
    symbol: "LINK",
    price: "$18.05",
    change: "+4.09%",
    tvl: "$1.4B",
    volume: "$612M"
  },
  {
    rank: 4,
    name: "Aave",
    symbol: "AAVE",
    price: "$102.87",
    change: "+2.41%",
    tvl: "$5.8B",
    volume: "$324M"
  },
  {
    rank: 5,
    name: "Uniswap",
    symbol: "UNI",
    price: "$9.76",
    change: "+5.12%",
    tvl: "$4.2B",
    volume: "$489M"
  }
] as const;

export const dexPairLeaders = [
  {
    pair: "ETH / USDC",
    protocol: "Uniswap v3",
    volume: "$612M",
    fees: "$1.22M"
  },
  {
    pair: "WBTC / ETH",
    protocol: "Curve",
    volume: "$148M",
    fees: "$392K"
  },
  {
    pair: "SOL / USDT",
    protocol: "Raydium",
    volume: "$96M",
    fees: "$214K"
  },
  {
    pair: "ARB / ETH",
    protocol: "GMX",
    volume: "$71M",
    fees: "$188K"
  }
] as const;

export const protocolLeaders = [
  {
    name: "Lido",
    chain: "Ethereum",
    tvl: "$31.4B",
    change: "+3.7%",
    category: "Liquid Staking"
  },
  {
    name: "Aave",
    chain: "Multi-chain",
    tvl: "$11.2B",
    change: "+2.2%",
    category: "Lending"
  },
  {
    name: "MakerDAO",
    chain: "Ethereum",
    tvl: "$8.7B",
    change: "+4.8%",
    category: "CDP"
  },
  {
    name: "Jupiter",
    chain: "Solana",
    tvl: "$5.6B",
    change: "+9.1%",
    category: "DEX Aggregator"
  }
] as const;

export const toolkitFeatures = [
  {
    title: "Yield Planner",
    description: "Simulate returns with slippage, gas, and incentive projections before committing capital.",
    tag: "Simulation"
  },
  {
    title: "Risk Radar",
    description: "Monitor liquidation ranges, oracle dependencies, and governance updates in real time.",
    tag: "Monitoring"
  },
  {
    title: "Gas Optimizer",
    description: "Plan multi-step transactions with the most efficient routes across rollups and L2s.",
    tag: "Automation"
  }
] as const;

export const insightHighlights = [
  {
    title: "How RWAs are rebalancing DeFi yields",
    excerpt: "Tokenised treasury bills now account for 18% of aggregate stablecoin collateral across top lending markets.",
    category: "Market Intel",
    time: "6 min read"
  },
  {
    title: "Layer 2 liquidity flows in Q3",
    excerpt: "Arbitrum and Base captured 64% of new deposits as incentives shifted from emissions to fee rebates.",
    category: "Research",
    time: "8 min read"
  },
  {
    title: "Designing safer leverage loops",
    excerpt: "We break down best practices for maintaining healthy collateral ratios during periods of volatility.",
    category: "Strategy",
    time: "5 min read"
  }
] as const;

export const footerLinks = [
  { href: "https://twitter.com/", label: "Twitter" },
  { href: "https://discord.com/", label: "Discord" },
  { href: "https://mirror.xyz/", label: "Research" }
] as const;
