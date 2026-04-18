import { CryptoAsset } from "../types";

const baseMockData: CryptoAsset[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 64200.5,
    market_cap: 1265000000000,
    market_cap_rank: 1,
    total_volume: 45000000000,
    price_change_24h: 1200.5,
    price_change_percentage_24h: 1.85,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 63000 + Math.random() * 2000),
    },
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 3450.2,
    market_cap: 415000000000,
    market_cap_rank: 2,
    total_volume: 18000000000,
    price_change_24h: -50.4,
    price_change_percentage_24h: -1.45,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 3400 + Math.random() * 150),
    },
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    current_price: 1.0,
    market_cap: 110000000000,
    market_cap_rank: 3,
    total_volume: 55000000000,
    price_change_24h: 0.0001,
    price_change_percentage_24h: 0.01,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 0.999 + Math.random() * 0.002),
    },
  },
  {
    id: "binancecoin",
    symbol: "bnb",
    name: "BNB",
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    current_price: 590.5,
    market_cap: 90000000000,
    market_cap_rank: 4,
    total_volume: 1500000000,
    price_change_24h: 15.2,
    price_change_percentage_24h: 2.65,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 580 + Math.random() * 20),
    },
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 145.8,
    market_cap: 65000000000,
    market_cap_rank: 5,
    total_volume: 4500000000,
    price_change_24h: 8.5,
    price_change_percentage_24h: 6.2,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 135 + Math.random() * 15),
    },
  },
  {
    id: "ripple",
    symbol: "xrp",
    name: "XRP",
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    current_price: 0.61,
    market_cap: 33000000000,
    market_cap_rank: 6,
    total_volume: 1200000000,
    price_change_24h: -0.01,
    price_change_percentage_24h: -1.5,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 0.6 + Math.random() * 0.03),
    },
  },
  {
    id: "usd-coin",
    symbol: "usdc",
    name: "USDC",
    image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    current_price: 1.0,
    market_cap: 32000000000,
    market_cap_rank: 7,
    total_volume: 5000000000,
    price_change_24h: 0,
    price_change_percentage_24h: 0,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 0.999 + Math.random() * 0.002),
    },
  },
  {
    id: "staked-ether",
    symbol: "steth",
    name: "Lido Staked Ether",
    image: "https://assets.coingecko.com/coins/images/13442/large/steth_logo.png",
    current_price: 3420.5,
    market_cap: 32000000000,
    market_cap_rank: 8,
    total_volume: 80000000,
    price_change_24h: -40.5,
    price_change_percentage_24h: -1.2,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 3380 + Math.random() * 100),
    },
  },
  {
    id: "dogecoin",
    symbol: "doge",
    name: "Dogecoin",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    current_price: 0.165,
    market_cap: 23000000000,
    market_cap_rank: 9,
    total_volume: 1800000000,
    price_change_24h: 0.012,
    price_change_percentage_24h: 7.8,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 0.15 + Math.random() * 0.03),
    },
  },
  {
    id: "toncoin",
    symbol: "ton",
    name: "Toncoin",
    image: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png",
    current_price: 6.8,
    market_cap: 22000000000,
    market_cap_rank: 10,
    total_volume: 350000000,
    price_change_24h: -0.2,
    price_change_percentage_24h: -2.8,
    sparkline_in_7d: {
      price: Array.from({ length: 24 }).map((_, i) => 6.5 + Math.random() * 0.5),
    },
  }
];

export function getMockDataWithJitter(): CryptoAsset[] {
  return baseMockData.map(asset => {
    // Add ±0.5% jitter
    const jitter = asset.current_price * (Math.random() * 0.01 - 0.005);
    const newPrice = asset.current_price + jitter;
    
    // stablecoins flutter less
    if (asset.symbol === 'usdt' || asset.symbol === 'usdc') {
        return {
            ...asset,
            current_price: 1 + (Math.random() * 0.002 - 0.001)
        }
    }
    
    return {
      ...asset,
      current_price: newPrice,
      price_change_24h: asset.price_change_24h + jitter,
      price_change_percentage_24h: asset.price_change_percentage_24h + (Math.random() * 0.2 - 0.1)
    };
  });
}
