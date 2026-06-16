import type { AnalysisResult } from '../types';

export interface HistoryEntry {
  id: string;
  title: string;
  timestamp: string;
  model: string;
  latencyMs: number;
  status: 'success' | 'error';
  queryType: string;
  resumeName?: string;
  jobDescriptionText?: string;
  jobDescriptionSnippet?: string;
  matchScore?: number;
  summarySnippet?: string;
  fullAnalysis?: AnalysisResult;
}

const STORAGE_KEY = 'resume_iq_history_v2'; // Changed key to avoid breaking with old schema

export const getHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const addHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
  const newEntry: HistoryEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
  };
  const history = getHistory();
  history.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return newEntry;
};

export const deleteHistoryEntry = (id: string) => {
  const history = getHistory();
  const updated = history.filter(entry => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getHistoryEntry = (id: string): HistoryEntry | undefined => {
  const history = getHistory();
  return history.find(entry => entry.id === id);
};
