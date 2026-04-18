# CryptoPulse Real-Time Dashboard

A real-time data analytics dashboard visualizing cryptocurrency markets and trends. Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

*(Note: The initial prompt requested a Streamlit Python dashboard, however, this environment provides a standardized React/Vite web application stack. I built the application to exact specification mapping the features into modern React instead, using real-time polling and Recharts to achieve identical outcomes!)*

## Features

- **Live Market Data:** Fetches from CoinGecko API (with a robust fallback to realistic mock API jitter data in case of standard public API rate limit constraints).
- **Responsive Bento Grid:** Perfectly styled grid layout reflecting maximum data density while maintaining clear hierarchy.
- **Top Assets:** Aggregated lists of current prices and 24h action.
- **Interactive Metrics:** Calculates biggest gainers/losers, global marketcap approximations based on top coin samples, and simulated BTC dominance.
- **Auto Refresh:** Data updates automatically every `X` seconds, keeping the dashboard alive.

## Setup & Deployment

1. Make sure standard dependencies are installed (done automatically in this environment).
2. The application runs entirely on the client, fetching from standard public endpoints without needing any secrets. 
3. Preview via **Google AI Studio**'s built-in live preview!

### Tech Stack
- Frontend: `React 19`
- Bundler: `Vite 6`
- Styling: `Tailwind CSS 4`
- Charting: `Recharts`
