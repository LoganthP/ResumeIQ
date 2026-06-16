import type { AnalysisResult } from '../types';

export const analyzeResume = async (resumeFile: File, jobDescription: string, model?: string): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('job_description', jobDescription);
  if (model) {
    formData.append('model', model);
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'An error occurred during analysis.');
    }

    const data: AnalysisResult = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
};
