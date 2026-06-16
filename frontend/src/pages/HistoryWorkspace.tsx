import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { getHistory, deleteHistoryEntry } from '../utils/history';
import type { HistoryEntry } from '../utils/history';
import { ExportModal } from '../components/ExportModal';
import { Search, FileText, Trash2, Copy, Download, ExternalLink } from 'lucide-react';

export default function HistoryWorkspace() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExportEntry, setSelectedExportEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this analysis record?')) {
      deleteHistoryEntry(id);
      setHistory(getHistory());
    }
  };

  const handleDuplicate = (entry: HistoryEntry) => {
    navigate('/', { state: { duplicateJd: entry.jobDescriptionText || entry.jobDescriptionSnippet } });
  };

  const handleDownload = (entry: HistoryEntry) => {
    setSelectedExportEntry(entry);
  };

  const filteredHistory = history.filter(entry => {
    const q = searchQuery.toLowerCase();
    return (
      (entry.title?.toLowerCase() || '').includes(q) ||
      (entry.resumeName?.toLowerCase() || '').includes(q) ||
      (entry.summarySnippet?.toLowerCase() || '').includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-on-surface font-ui overflow-hidden flex flex-col">
      <Header 
        selectedModel="none"
        onModelSelect={() => {}}
        onHomeClick={() => navigate('/')}
        phase="history"
        onNavClick={(phase) => {
          if (phase === 'upload') navigate('/');
        }}
      />

      <main className="flex-1 mt-[56px] overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end border-b border-outline-variant/30 pb-6 mb-8">
          <div>
            <h1 className="font-display text-4xl text-crimson tracking-tight">ANALYSIS WORKSPACE</h1>
            <p className="font-data text-xs text-on-surface-variant uppercase mt-2 tracking-wider">
              Repository of Neural Cartography Sessions
            </p>
          </div>
          
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input 
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-outline-variant/30 py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-crimson text-on-surface rounded-sm"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="mx-auto text-outline-variant mb-4" size={48} />
            <h3 className="text-xl font-display text-on-surface-variant">No Analysis Records Found</h3>
            <p className="text-sm mt-2 text-on-surface-variant/70">Upload a resume to begin tracking your mapping sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map(entry => (
              <div key={entry.id} className="bg-surface border border-outline-variant/30 hover:border-crimson/50 transition-colors flex flex-col">
                <div className="p-5 border-b border-outline-variant/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-ui font-semibold text-base truncate pr-4">{entry.title || 'Untitled Analysis'}</h3>
                    {entry.matchScore !== undefined && (
                      <span className="font-display text-xl text-crimson shrink-0">{entry.matchScore}%</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-data mt-3">
                    <FileText size={12} />
                    <span className="truncate">{entry.resumeName || 'Unknown file'}</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant/60 font-data uppercase mt-1">
                    {new Date(entry.timestamp).toLocaleString()} • {entry.model}
                  </div>
                </div>
                
                <div className="p-5 flex-1 bg-background/30">
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                    {entry.summarySnippet || entry.jobDescriptionSnippet || 'No summary available.'}
                  </p>
                </div>

                <div className="p-3 border-t border-outline-variant/20 flex justify-between gap-2 bg-surface">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDuplicate(entry)}
                      title="Duplicate Analysis"
                      className="p-2 text-on-surface-variant hover:text-crimson hover:bg-background rounded transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => handleDownload(entry)}
                      title="Download Report"
                      className="p-2 text-on-surface-variant hover:text-crimson hover:bg-background rounded transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(entry.id)}
                      title="Delete Record"
                      className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-background rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/analysis/${entry.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-crimson text-white text-[10px] font-data uppercase tracking-wider hover:bg-opacity-90 rounded-sm"
                  >
                    Open Analysis <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ExportModal 
        isOpen={!!selectedExportEntry} 
        onClose={() => setSelectedExportEntry(null)} 
        data={selectedExportEntry} 
      />
    </div>
  );
}
