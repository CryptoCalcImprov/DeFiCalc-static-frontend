import { dexPairLeaders, trendingTokens } from "@/lib/site-content";

export function MarketTrendsSection() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
      <article className="overflow-hidden rounded-3xl border border-slate-900/70 bg-slate-950/80 shadow-lg shadow-slate-950/50">
        <header className="flex items-center justify-between border-b border-slate-900/60 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Trending Assets</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Top DeFi tokens by growth</h3>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">Updated 12m ago</span>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-900/60 text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">Rank</th>
                <th scope="col" className="px-6 py-3 text-left">Asset</th>
                <th scope="col" className="px-6 py-3 text-right">Price</th>
                <th scope="col" className="px-6 py-3 text-right">24h Change</th>
                <th scope="col" className="px-6 py-3 text-right">TVL</th>
                <th scope="col" className="px-6 py-3 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {trendingTokens.map((token) => (
                <tr key={token.rank} className="transition hover:bg-slate-900/60">
                  <td className="px-6 py-4 text-sm text-slate-500">#{token.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{token.name}</span>
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{token.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-200">{token.price}</td>
                  <td className="px-6 py-4 text-right text-emerald-400">{token.change}</td>
                  <td className="px-6 py-4 text-right text-slate-200">{token.tvl}</td>
                  <td className="px-6 py-4 text-right text-slate-200">{token.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <article className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-slate-900/70 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/50">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">DEX Leaders</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Most active pools</h3>
          <p className="mt-3 text-sm text-slate-400">Fees and volume over the last 24 hours across top decentralized exchanges.</p>
        </div>
        <ul className="space-y-4">
          {dexPairLeaders.map((pair) => (
            <li key={pair.pair} className="rounded-2xl border border-slate-900 bg-slate-950/70 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{pair.pair}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{pair.protocol}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Hot</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <span>Volume: <span className="font-semibold text-white">{pair.volume}</span></span>
                <span>Fees: <span className="font-semibold text-white">{pair.fees}</span></span>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
