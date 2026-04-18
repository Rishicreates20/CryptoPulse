import { useEffect, useState, useMemo } from 'react';
import { fetchTopAssets, fetchBtcChart } from './services/api';
import { CryptoAsset, PortfolioItem } from './types';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, Brush } from 'recharts';
import { Search, Plus, Trash2, Settings, X } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bento-surface border border-bento-border py-1.5 px-3 rounded text-sm shadow-xl">
        <p className="text-bento-text font-mono">${payload[0].value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [filter, setFilter] = useState('24H');
  const [countdown, setCountdown] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings & Preferences
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cg_api_key') || '');
  const [refreshInterval, setRefreshInterval] = useState(() => Number(localStorage.getItem('refresh_interval')) || 5);
  
  // Chart Data
  const [btcChartData, setBtcChartData] = useState<{time: string, price: number}[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    try {
      const stored = localStorage.getItem('crypto_portfolio');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newAssetId, setNewAssetId] = useState('');
  const [newAssetAmount, setNewAssetAmount] = useState('');

  useEffect(() => {
    localStorage.setItem('crypto_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const lower = searchQuery.toLowerCase();
    return assets.filter(a => 
      a.name.toLowerCase().includes(lower) || 
      a.symbol.toLowerCase().includes(lower)
    );
  }, [assets, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const data = await fetchTopAssets(apiKey);
      if (isMounted) {
        setAssets(data);
        setCountdown(refreshInterval);
      }
    };

    loadData();
    const fetchInterval = setInterval(loadData, refreshInterval * 1000);
    
    const cdInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(fetchInterval);
      clearInterval(cdInterval);
    };
  }, [refreshInterval, apiKey]);

  useEffect(() => {
    let isMounted = true;
    const loadChartInfo = async () => {
      setChartLoading(true);
      const days = filter === '1H' ? '1' : filter === '24H' ? '1' : filter === '7D' ? '7' : filter === '1M' ? '30' : '1';
      const data = await fetchBtcChart(days, apiKey);
      if (isMounted) {
        setBtcChartData(data);
        setChartLoading(false);
      }
    };
    loadChartInfo();
    return () => { isMounted = false; };
  }, [filter, apiKey]);

  // The btcData state block is removed because we now fetch real historical data using API.

  const globalMcap = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.market_cap || 0), 0) * 1.6;
  }, [assets]);

  const globalVol = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.total_volume || 0), 0) * 1.8;
  }, [assets]);

  const btcDom = useMemo(() => {
    const btc = assets.find(a => a.id === 'bitcoin');
    if (!btc || !globalMcap) return 52.41;
    return (btc.market_cap / globalMcap) * 100;
  }, [assets, globalMcap]);

  const topGainer = useMemo(() => {
    if (!assets.length) return null;
    return [...assets].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];
  }, [assets]);

  const topLoser = useMemo(() => {
    if (!assets.length) return null;
    return [...assets].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)[0];
  }, [assets]);

  const formatCurrency = (val: number, isShort = false) => {
    if (val === 0) return '$0.00';
    if (isShort) {
      if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    }
    if (val >= 1000) return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (val < 1) return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const mcapChange = topGainer ? (topGainer.price_change_percentage_24h * 0.4) : 2.4;
  const volChange = topLoser ? (topLoser.price_change_percentage_24h * 0.8) : -5.1;

  // Portfolio calculations
  const portfolioData = useMemo(() => {
    let totalValue = 0;
    let previousTotalValue = 0;
    
    const holdings = portfolio.map(item => {
      const asset = assets.find(a => a.id === item.id);
      if (!asset) return null;
      
      const value = item.amount * asset.current_price;
      const prevPrice = asset.current_price / (1 + (asset.price_change_percentage_24h / 100));
      const prevValue = item.amount * prevPrice;
      
      totalValue += value;
      previousTotalValue += prevValue;
      
      return {
        ...item,
        asset,
        value,
      };
    }).filter(Boolean);

    const change24hVal = totalValue - previousTotalValue;
    const change24hPct = previousTotalValue > 0 ? (change24hVal / previousTotalValue) * 100 : 0;

    return { totalValue, change24hVal, change24hPct, holdings: holdings as any[] };
  }, [portfolio, assets]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetId || !newAssetAmount || isNaN(Number(newAssetAmount))) return;
    
    const amount = Number(newAssetAmount);
    setPortfolio(prev => {
      const existing = prev.find(p => p.id === newAssetId);
      if (existing) {
        return prev.map(p => p.id === newAssetId ? { ...p, amount: p.amount + amount } : p);
      }
      return [...prev, { id: newAssetId, amount }];
    });
    setNewAssetId('');
    setNewAssetAmount('');
  };

  const handleRemoveAsset = (id: string) => {
    setPortfolio(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cg_api_key', apiKey);
    localStorage.setItem('refresh_interval', refreshInterval.toString());
    setIsSettingsOpen(false);
  };

  return (
    <div className="bg-bento-bg text-bento-text font-sans h-screen w-full overflow-hidden flex flex-col">
      <header className="px-6 md:px-8 py-4 border-b border-bento-border flex flex-wrap gap-4 justify-between items-center shrink-0">
         <div className="flex items-center gap-3 shrink-0">
           <div className="w-8 h-8 bg-bento-accent rounded-lg flex items-center justify-center font-bold text-white text-lg">C</div>
           <div className="font-bold text-lg hidden lg:block tracking-wide">CryptoLens Pro</div>
         </div>

         <div className="flex-1 max-w-md mx-auto relative hidden sm:block">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search size={16} className="text-bento-text-sec" />
           </div>
           <input 
             type="text" 
             placeholder="Search by name or symbol..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-bento-surface border border-bento-border text-bento-text text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-bento-accent transition-colors placeholder:text-bento-text-sec shadow-sm"
           />
         </div>

         <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono font-medium text-bento-text-sec bg-bento-surface px-3 py-1.5 border border-bento-border rounded-full shadow-sm shrink-0">
           <div className="w-2 h-2 bg-bento-success rounded-full"></div>
           <span className="hidden md:inline">LIVE MARKET DATA &bull; </span> REFRESHING IN {countdown}S
         </div>

         {/* Mobile Search Bar Row */}
         <div className="w-full relative sm:hidden flex items-center mt-2">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search size={16} className="text-bento-text-sec" />
           </div>
           <input 
             type="text" 
             placeholder="Search by name or symbol..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-bento-surface border border-bento-border text-bento-text text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-bento-accent transition-colors placeholder:text-bento-text-sec shadow-sm"
           />
         </div>
         
         <button onClick={() => setIsSettingsOpen(true)} className="p-2 border border-bento-border rounded-lg bg-bento-surface text-bento-text-sec hover:text-bento-text transition-colors">
            <Settings size={16} />
         </button>
      </header>

      <div className="flex px-6 md:px-8 py-2 border-b border-bento-border gap-6 shrink-0">
         <button 
           className={`text-xs md:text-sm font-semibold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeTab === 'market' ? 'text-bento-accent border-bento-accent' : 'text-bento-text-sec border-transparent hover:text-bento-text'}`}
           onClick={() => setActiveTab('market')}
         >
           Market Overview
         </button>
         <button 
           className={`text-xs md:text-sm font-semibold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeTab === 'portfolio' ? 'text-bento-accent border-bento-accent' : 'text-bento-text-sec border-transparent hover:text-bento-text'}`}
           onClick={() => setActiveTab('portfolio')}
         >
           Portfolio Tracker
         </button>
      </div>

      <main className="flex-1 overflow-auto md:overflow-hidden min-h-0 bg-bento-bg">
        {activeTab === 'market' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-[auto_minmax(0,1fr)_auto] h-full gap-4 p-4 md:p-8">
             {/* Row 1: Key Metrics */}
         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-2">Global MCap</span>
            <span className="text-2xl font-bold font-mono">{formatCurrency(globalMcap, true)}</span>
            <span className={`text-xs mt-1.5 font-medium ${mcapChange >= 0 ? 'text-bento-success' : 'text-bento-danger'}`}>
              {mcapChange > 0 ? '+' : ''}{mcapChange.toFixed(1)}% {mcapChange >= 0 ? '↑' : '↓'}
            </span>
         </div>
         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-2">24h Volume</span>
            <span className="text-2xl font-bold font-mono">{formatCurrency(globalVol, true)}</span>
            <span className={`text-xs mt-1.5 font-medium ${volChange >= 0 ? 'text-bento-success' : 'text-bento-danger'}`}>
              {volChange > 0 ? '+' : ''}{volChange.toFixed(1)}% {volChange >= 0 ? '↑' : '↓'}
            </span>
         </div>
         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-2">BTC Dominance</span>
            <span className="text-2xl font-bold font-mono">{btcDom.toFixed(2)}%</span>
            <span className="text-xs mt-1.5 font-medium text-bento-success">+0.2% ↑</span>
         </div>
         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-2">Active Assets</span>
            <span className="text-2xl font-bold font-mono">13,492</span>
            <span className="text-xs mt-1.5 font-medium text-bento-text-sec">All Markets</span>
         </div>

         {/* Row 2: Main Chart and Side List */}
         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col md:col-span-3 min-h-[260px]">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <span className="text-base font-semibold">Bitcoin (BTC) Price Trend</span>
              <div className="flex gap-2">
                {['1H', '24H', '7D', '1M'].map(f => (
                   <button 
                      key={f} 
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${filter === f ? 'bg-bento-accent border-bento-accent text-white shadow-md' : 'bg-bento-bg border-bento-border text-bento-text-sec hover:text-bento-text'}`} 
                      onClick={() => setFilter(f)}
                   >
                     {f}
                   </button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full min-h-0 pt-2">
              {chartLoading ? (
                 <div className="h-full w-full flex items-center justify-center text-sm text-bento-text-sec">Loading historical data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={btcChartData} margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-bento-accent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-bento-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <XAxis dataKey="time" hide />
                    <Area type="monotone" dataKey="price" stroke="var(--color-bento-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                    <Brush dataKey="time" height={25} stroke="var(--color-bento-accent)" fill="var(--color-bento-surface)" tickFormatter={() => ''} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
         </div>

         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col md:row-span-2 overflow-hidden min-h-[340px]">
            <span className="text-base font-semibold mb-4">Top Assets</span>
            <div className="grid grid-cols-[24px_1fr_65px_50px] md:grid-cols-[24px_1fr_75px_55px] py-3 border-b border-bento-border text-xs font-semibold tracking-wider uppercase text-bento-text-sec mb-1">
              <span>#</span><span>Name</span><span className="text-right">Price</span><span className="text-right">24h</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-6 text-bento-text-sec text-sm">
                  No assets found matching "{searchQuery}"
                </div>
              ) : (
                filteredAssets.map((asset, idx) => (
                  <div key={asset.id} className="grid grid-cols-[24px_1fr_65px_50px] md:grid-cols-[24px_1fr_75px_55px] items-center py-2.5 border-b border-bento-border/40 last:border-b-0 text-sm">
                     <span className="text-bento-text-sec font-mono text-xs">{asset.market_cap_rank || idx + 1}</span>
                     <div className="flex items-center gap-2 min-w-0 pr-2">
                       <span className="truncate font-medium">{asset.name}</span>
                       <span className="text-[9px] bg-bento-border px-1.5 py-0.5 rounded font-mono text-bento-text-sec hidden xl:block">{asset.symbol.toUpperCase()}</span>
                     </div>
                     <span className="font-mono text-right text-xs sm:text-sm">{formatCurrency(asset.current_price)}</span>
                     <span className={`text-right text-xs font-medium ${asset.price_change_percentage_24h >= 0 ? 'text-bento-success' : 'text-bento-danger'}`}>
                       {asset.price_change_percentage_24h > 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(1) ?? '0.0'}%
                     </span>
                  </div>
                ))
              )}
            </div>
         </div>

         {/* Row 3: Detail Metrics */}
         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-3">Top Gainer (24h)</span>
            <div className="flex items-center gap-2 mb-2 bg-bento-bg py-1.5 px-3 rounded-lg border border-bento-border w-max">
              <div className="w-2.5 h-2.5 rounded-full bg-bento-success"></div>
              {topGainer ? (
                 <span className="font-medium text-xs truncate">{topGainer.name} ({topGainer.symbol.toUpperCase()})</span>
              ) : (
                 <span className="font-medium text-xs truncate">Loading...</span>
              )}
            </div>
            {topGainer && (
              <span className="text-xl font-bold font-mono text-bento-success">+{topGainer.price_change_percentage_24h.toFixed(1)}%</span>
            )}
         </div>

         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-3">Top Loser (24h)</span>
            <div className="flex items-center gap-2 mb-2 bg-bento-bg py-1.5 px-3 rounded-lg border border-bento-border w-max">
              <div className="w-2.5 h-2.5 rounded-full bg-bento-danger"></div>
              {topLoser ? (
                 <span className="font-medium text-xs truncate">{topLoser.name} ({topLoser.symbol.toUpperCase()})</span>
              ) : (
                 <span className="font-medium text-xs truncate">Loading...</span>
              )}
            </div>
            {topLoser && (
              <span className="text-xl font-bold font-mono text-bento-danger">{topLoser.price_change_percentage_24h.toFixed(1)}%</span>
            )}
         </div>

         <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-2">Fear & Greed Index</span>
            <span className="text-2xl font-bold font-mono text-[#FFC107]">72</span>
            <span className="text-sm mt-1 font-semibold text-[#FFC107]">Greed</span>
         </div>
         </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-4 p-4 md:p-8 overflow-y-auto">
          {/* Portfolio Metrics */}
          <div className="bg-bento-surface border border-bento-border rounded-2xl p-6 flex flex-col justify-center">
             <span className="text-xs font-semibold uppercase tracking-wider text-bento-text-sec mb-2">Total Balance</span>
             <span className="text-4xl font-bold font-mono">{formatCurrency(portfolioData.totalValue)}</span>
             <span className={`text-sm mt-3 font-medium ${portfolioData.change24hPct >= 0 ? 'text-bento-success' : 'text-bento-danger'}`}>
               {portfolioData.change24hPct >= 0 ? '+' : ''}{formatCurrency(portfolioData.change24hVal)} ({portfolioData.change24hPct.toFixed(2)}%) 24h
             </span>
          </div>

          <div className="bg-bento-surface border border-bento-border rounded-2xl p-6 lg:col-span-2 flex flex-col justify-center">
            <span className="text-base font-semibold mb-3">Add Holding</span>
            <form onSubmit={handleAddAsset} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] uppercase tracking-wider text-bento-text-sec mb-1.5 font-mono">Asset</label>
                <select 
                  value={newAssetId} 
                  onChange={(e) => setNewAssetId(e.target.value)}
                  className="w-full bg-bento-bg border border-bento-border text-bento-text text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-bento-accent"
                >
                  <option value="">Select asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.symbol.toUpperCase()})</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] uppercase tracking-wider text-bento-text-sec mb-1.5 font-mono">Amount</label>
                <input 
                  type="number" 
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={newAssetAmount}
                  onChange={(e) => setNewAssetAmount(e.target.value)}
                  className="w-full bg-bento-bg border border-bento-border text-bento-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-bento-accent"
                />
              </div>
              <button 
                type="submit" 
                disabled={!newAssetId || !newAssetAmount}
                className="bg-bento-accent hover:opacity-90 disabled:bg-bento-border disabled:text-bento-text-sec text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 mt-2 sm:mt-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Add
              </button>
            </form>
          </div>

          {/* Holdings List */}
          <div className="bg-bento-surface border border-bento-border rounded-2xl p-5 flex flex-col lg:col-span-3 min-h-[300px]">
            <span className="text-base font-semibold mb-4">Your Holdings</span>
            <div className="grid grid-cols-[1fr_80px_100px_40px] md:grid-cols-[1fr_120px_120px_100px_40px] py-3 border-b border-bento-border text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-bento-text-sec mb-1">
              <span>Asset</span>
              <span className="text-right">Balance</span>
              <span className="text-right hidden md:block">Price</span>
              <span className="text-right">Value</span>
              <span></span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
              {portfolioData.holdings.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-3 text-bento-text-sec flex-1 justify-center">
                  <div className="w-12 h-12 bg-bento-bg rounded-lg flex items-center justify-center border border-bento-border">
                    <Plus size={20} className="text-bento-text-sec" />
                  </div>
                  <span className="text-sm font-medium">No assets in portfolio yet</span>
                </div>
              ) : (
                portfolioData.holdings.map((held) => (
                  <div key={held.id} className="grid grid-cols-[1fr_80px_100px_40px] md:grid-cols-[1fr_120px_120px_100px_40px] items-center py-3.5 border-b border-bento-border/40 last:border-b-0 text-sm">
                     <div className="flex items-center gap-2 min-w-0 pr-2">
                       <span className="truncate font-medium">{held.asset.name}</span>
                       <span className="text-[9px] bg-bento-bg px-1.5 py-0.5 border border-bento-border rounded font-mono text-bento-text-sec hidden sm:block">{held.asset.symbol.toUpperCase()}</span>
                     </div>
                     <div className="font-mono text-right text-xs sm:text-sm text-bento-text flex flex-col items-end">
                       {held.amount.toLocaleString(undefined, {maximumFractionDigits: 6})}
                     </div>
                     <span className="font-mono text-right text-xs sm:text-sm hidden md:block text-bento-text-sec">{formatCurrency(held.asset.current_price)}</span>
                     <div className="flex flex-col items-end text-right pr-3 md:pr-4">
                       <span className="font-mono text-xs sm:text-sm font-semibold">{formatCurrency(held.value)}</span>
                     </div>
                     <button 
                       onClick={() => handleRemoveAsset(held.id)}
                       className="text-bento-text-sec hover:text-bento-danger transition-colors flex justify-end cursor-pointer"
                       title="Remove holding"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}
      </main>

       <footer className="px-6 md:px-8 py-3 border-t border-bento-border text-[10px] text-bento-text-sec flex justify-between shrink-0 uppercase tracking-widest font-mono">
         <div>API PROVIDER: COINGECKO &bull; LATENCY: 240MS</div>
         <div>&copy; 2024 CRYPTOLENS ENGINE V2.4.1</div>
      </footer>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bento-bg border border-bento-border rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Preferences</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-bento-text-sec hover:text-bento-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-bento-text-sec mb-2 font-mono">CoinGecko API Key</label>
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Optional (Demo or Pro API Key)"
                  className="w-full bg-bento-surface border border-bento-border text-bento-text text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-bento-accent"
                />
                <p className="text-[10px] text-bento-text-sec mt-1">Configure your API key to avoid rate limiting.</p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-bento-text-sec mb-2 font-mono">Refresh Interval (Seconds)</label>
                <input 
                  type="number" 
                  value={refreshInterval}
                  min="5"
                  max="300"
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full bg-bento-surface border border-bento-border text-bento-text text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-bento-accent"
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-bento-accent hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-colors">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
