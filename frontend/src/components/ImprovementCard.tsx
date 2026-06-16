import React from 'react';
import type { Suggestion } from '../types';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface ImprovementCardProps {
  suggestion: Suggestion;
}

const ImprovementCard: React.FC<ImprovementCardProps> = ({ suggestion }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-3">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
          {suggestion.section}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-start text-red-600 mb-2">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p className="text-gray-800 font-medium">{suggestion.issue}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <div className="flex items-start text-green-700">
          <ArrowRight className="w-5 h-5 mr-2 shrink-0 mt-0.5 text-green-600" />
          <div>
            <span className="font-semibold text-green-800 block mb-1">How to fix it:</span>
            <p className="text-gray-700 leading-relaxed">{suggestion.fix}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovementCard;
