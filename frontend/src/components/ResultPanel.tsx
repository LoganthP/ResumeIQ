import React, { useState } from 'react';
import type { AnalysisResult } from '../types';
import ScoreCard from './ScoreCard';
import ImprovementCard from './ImprovementCard';
import { CheckCircle2, XCircle, Search, FileText } from 'lucide-react';

interface ResultPanelProps {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'improved'>('overview');

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'suggestions' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Actionable Suggestions
        </button>
        <button
          onClick={() => setActiveTab('improved')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'improved' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Improved Resume
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <ScoreCard score={result.match_score} />
              
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-4 flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Keyword Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">Found Keywords</span>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords_found.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-sm border border-green-200">
                          {kw}
                        </span>
                      ))}
                      {result.keywords_found.length === 0 && <span className="text-sm text-gray-400">None found</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">Missing Keywords</span>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords_missing.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md text-sm border border-red-200">
                          {kw}
                        </span>
                      ))}
                      {result.keywords_missing.length === 0 && <span className="text-sm text-gray-400">None missing</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />
                  Strengths
                </h3>
                <ul className="space-y-3">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 mr-3 shrink-0"></span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                  {result.strengths.length === 0 && <p className="text-gray-500 italic">No significant strengths identified for this role.</p>}
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <XCircle className="w-6 h-6 text-red-500 mr-2" />
                  Gaps & Weaknesses
                </h3>
                <ul className="space-y-3">
                  {result.gaps.map((gap, i) => (
                    <li key={i} className="flex items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 mr-3 shrink-0"></span>
                      <span className="text-gray-700">{gap}</span>
                    </li>
                  ))}
                  {result.gaps.length === 0 && <p className="text-gray-500 italic">No major gaps identified!</p>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Improve Your Resume</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.suggestions.map((sug, i) => (
                <ImprovementCard key={i} suggestion={sug} />
              ))}
              {result.suggestions.length === 0 && (
                <p className="text-gray-500 col-span-2">Your resume is perfectly optimized!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'improved' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI-Optimized Resume</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.improved_resume);
                  alert('Copied to clipboard!');
                }}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Copy Text
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl whitespace-pre-wrap font-sans text-gray-800 leading-relaxed shadow-inner max-h-[600px] overflow-y-auto">
              {result.improved_resume}
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            Analyze Another Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
