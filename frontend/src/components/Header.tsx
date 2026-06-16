import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface HeaderProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onHomeClick?: () => void;
  phase?: 'upload' | 'analyzing' | 'results' | 'history';
  onNavClick?: (phase: 'upload' | 'results' | 'history') => void;
  hasResult?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  selectedModel, 
  onModelSelect, 
  onHomeClick,
  phase = 'upload',
  onNavClick,
  hasResult = false
}) => {
  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[60] flex justify-between items-center px-8 h-[56px] bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_15px_rgba(79,142,247,0.15)] no-print">
        <div className="flex items-center gap-6">
          <span 
            onClick={onHomeClick} 
            className="font-display text-2xl font-bold text-crimson tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          >
            ResumeIQ
          </span>
          <nav className="hidden md:flex gap-6">
            <button 
              onClick={() => onNavClick?.('upload')} 
              className={`font-ui text-sm font-semibold uppercase tracking-widest transition-colors ${phase === 'upload' ? 'text-crimson border-b-2 border-crimson' : 'text-on-surface-variant hover:text-crimson'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavClick?.('results')} 
              disabled={!hasResult} 
              className={`font-ui text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${phase === 'results' ? 'text-crimson border-b-2 border-crimson' : 'text-on-surface-variant hover:text-crimson'}`}
            >
              Analysis & Optimizer
            </button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="font-data text-[10px] leading-none text-crimson">
              AI STATUS: {phase === 'analyzing' ? 'PROCESSING' : 'ACTIVE'}
            </span>
            <div className="mt-1">
              <ModelSelector 
                selectedModelId={selectedModel} 
                onModelSelect={onModelSelect} 
              />
            </div>
          </div>
          
          <button 
            onClick={() => onNavClick?.('history')}
            className={`transition-colors ${phase === 'history' ? 'text-crimson' : 'text-on-surface-variant hover:text-crimson'}`}
            title="Workspace History"
          >
            <HistoryIcon size={24} />
          </button>
        </div>
      </header>
    </>
  );
};
