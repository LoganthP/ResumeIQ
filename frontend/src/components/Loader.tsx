import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Analyzing your resume...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-6" />
      <h3 className="text-xl font-semibold text-gray-800">{message}</h3>
      <p className="text-gray-500 mt-2 text-center max-w-md">
        Our AI is acting as a senior technical recruiter to evaluate your resume against the job description. This may take up to 30 seconds.
      </p>
    </div>
  );
};

export default Loader;
