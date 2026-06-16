export interface Suggestion {
  section: string;
  issue: string;
  fix: string;
}

export interface AnalysisResult {
  match_score: number;
  strengths: string[];
  gaps: string[];
  keywords_found: string[];
  keywords_missing: string[];
  suggestions: Suggestion[];
  improved_resume: string;
}

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';
