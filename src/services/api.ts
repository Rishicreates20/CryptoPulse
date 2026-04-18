import { CryptoAsset } from '../types';
import { getMockDataWithJitter } from './mockData';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const getHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }
  return headers;
};

export async function fetchTopAssets(apiKey?: string): Promise<CryptoAsset[]> {
  try {
    const response = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h`, {
      method: "GET",
      headers: getHeaders(apiKey),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("CoinGecko rate limit reached. Using mock data.");
        return getMockDataWithJitter();
      }
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch assets, falling back to mock data.", err);
    return getMockDataWithJitter();
  }
}

export async function fetchBtcChart(days: string, apiKey?: string): Promise<{time: string, price: number}[]> {
  try {
    const response = await fetch(`${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`, {
      method: "GET",
      headers: getHeaders(apiKey),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('rate_limit');
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.prices.map((item: [number, number]) => {
      const date = new Date(item[0]);
      return {
        time: days === '1' ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString(),
        price: item[1]
      };
    });
  } catch (err) {
    console.warn("Using mock chart data due to error", err);
    // Return mock data for the chart if API fails
    const mockData = [];
    const points = days === '1' ? 24 : days === '7' ? 168 : days === '30' ? 30 : 365;
    let currentPrice = 64000;
    const now = Date.now();
    const intervalMs = (Number(days) * 24 * 60 * 60 * 1000) / points;
    
    for (let i = 0; i < points; i++) {
        currentPrice = currentPrice + (Math.random() * 1000 - 450);
        const timestamp = now - ((points - i) * intervalMs);
        const date = new Date(timestamp);
        mockData.push({
            time: days === '1' ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString(),
            price: currentPrice
        });
    }
    return mockData;
  }
}
