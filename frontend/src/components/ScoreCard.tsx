import React from 'react';

interface ScoreCardProps {
  score: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  let colorClass = 'text-green-500';
  let bgClass = 'bg-green-100';
  let strokeClass = 'stroke-green-500';

  if (score < 40) {
    colorClass = 'text-red-500';
    bgClass = 'bg-red-100';
    strokeClass = 'stroke-red-500';
  } else if (score < 70) {
    colorClass = 'text-yellow-500';
    bgClass = 'bg-yellow-100';
    strokeClass = 'stroke-yellow-500';
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex items-center justify-center p-6 rounded-2xl ${bgClass} w-full`}>
      <div className="relative flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-white"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`${strokeClass} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${colorClass}`}>{score}%</span>
          <span className={`text-xs font-semibold ${colorClass} uppercase tracking-wider`}>Match</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
