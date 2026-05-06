export type SignalDirection = "BUY" | "SELL";
export type SignalSource = "tradingview" | "forexfactory" | "youtube" | "telegram";
export type SignalStatus = "active" | "expired" | "hit_tp" | "hit_sl";
export type SignalOutcome = "pending" | "hit_tp" | "hit_sl" | "expired" | "manual_close";

export interface Signal {
  _id?: string;
  source: SignalSource;
  pair: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  slPips: number;
  tpPips: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
  sourceUrl: string;
  sourceAuthor: string;
  rawText: string;
  status: SignalStatus;
  outcome: SignalOutcome;
  resultPips: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapeResult {
  source: SignalSource;
  signals: Omit<Signal, "status" | "updatedAt" | "outcome" | "resultPips">[];
  errors: string[];
  calendarItems?: string[];
}

export interface NewsAnalysis {
  pair: string;
  news: string;
  impact: "high" | "medium" | "low";
  direction: "BUY" | "SELL" | "WAIT";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  slPips: number;
  tpPips: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export const MONITORED_PAIRS = [
  "XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY",
  "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"
];
