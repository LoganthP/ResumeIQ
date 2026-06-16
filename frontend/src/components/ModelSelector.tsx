import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Clock } from 'lucide-react';

export interface ORModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface ModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
}

const RECENT_MODELS_KEY = 'resume_iq_recent_models';

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModelId, onModelSelect }) => {
  const [models, setModels] = useState<ORModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentModels, setRecentModels] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch models from OpenRouter
    fetch('https://openrouter.ai/api/v1/models')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setModels(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch OpenRouter models', err));

    // Load recent models
    const storedRecent = localStorage.getItem(RECENT_MODELS_KEY);
    if (storedRecent) {
      try {
        setRecentModels(JSON.parse(storedRecent));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (modelId: string) => {
    onModelSelect(modelId);
    setIsOpen(false);
    
    // Update recent
    const newRecent = [modelId, ...recentModels.filter(id => id !== modelId)].slice(0, 5);
    setRecentModels(newRecent);
    localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(newRecent));
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    const provider = model.id.split('/')[0];
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, ORModel[]>);

  const selectedModel = models.find(m => m.id === selectedModelId);
  const displayName = selectedModel ? selectedModel.name.replace(/^[^:]+:\s*/, '') : selectedModelId;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 transition-colors text-xs text-on-surface hover:text-crimson group"
      >
        <span className="font-data max-w-[150px] truncate">{displayName}</span>
        <ChevronDown size={12} className={`text-on-surface-variant group-hover:text-crimson transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-surface border border-outline-variant/30 rounded shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[400px]">
          {/* Search Bar */}
          <div className="p-2 border-b border-outline-variant/30 flex items-center gap-2 bg-background/50">
            <Search size={14} className="text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search models..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-ui text-sm text-on-surface w-full placeholder-on-surface-variant/50"
            />
          </div>

          <div className="overflow-y-auto flex-1 p-2 custom-scrollbar bg-background">
            {/* Recent Models */}
            {!searchQuery && recentModels.length > 0 && (
              <div className="mb-3">
                <div className="font-data text-[10px] text-crimson mb-1 px-2 flex items-center gap-1 uppercase tracking-wider">
                  <Clock size={10} /> Recent
                </div>
                {recentModels.map(id => {
                  const m = models.find(mod => mod.id === id);
                  if (!m) return null;
                  return (
                    <button 
                      key={`recent-${id}`}
                      onClick={() => handleSelect(id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex flex-col font-ui ${id === selectedModelId ? 'bg-crimson/10 text-crimson' : 'text-on-surface hover:bg-surface'}`}
                    >
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{Math.round(m.context_length / 1000)}k context</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grouped Models */}
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider} className="mb-3">
                <div className="font-data text-[10px] text-on-surface-variant mb-1 px-2 uppercase tracking-wider border-b border-outline-variant/20 pb-0.5">
                  {provider}
                </div>
                {providerModels.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex flex-col font-ui ${m.id === selectedModelId ? 'bg-crimson/10 text-crimson' : 'text-on-surface hover:bg-surface'}`}
                  >
                    <span className="font-semibold truncate">{m.name.replace(/^[^:]+:\s*/, '')}</span>
                    <span className="text-[10px] text-on-surface-variant">{Math.round(m.context_length / 1000)}k context</span>
                  </button>
                ))}
              </div>
            ))}

            {filteredModels.length === 0 && (
              <div className="p-4 text-center font-ui text-sm text-on-surface-variant">
                No models found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
