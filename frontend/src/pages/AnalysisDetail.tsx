import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistoryEntry } from '../utils/history';
import type { HistoryEntry } from '../utils/history';
import { Header } from '../components/Header';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { RadarChartWrapper } from '../components/ResumeCharts';
import { ExportModal } from '../components/ExportModal';

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getHistoryEntry(id);
      if (data) setEntry(data);
    }
  }, [id]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-ui text-on-surface">
        <h2 className="text-2xl mb-4 font-display text-crimson">Analysis Not Found</h2>
        <button onClick={() => navigate('/history')} className="text-on-surface-variant hover:text-crimson underline">Return to Workspace</button>
      </div>
    );
  }

  const data = entry.fullAnalysis;

  return (
    <div className="min-h-screen bg-background text-on-surface font-ui overflow-hidden flex flex-col">
      <Header 
        selectedModel="none"
        onModelSelect={() => {}}
        onHomeClick={() => navigate('/')}
        phase="history"
        onNavClick={(phase) => {
          if (phase === 'upload') navigate('/');
          if (phase === 'history') navigate('/history');
        }}
      />

      <main className="flex-1 mt-[56px] overflow-y-auto p-8 max-w-7xl mx-auto w-full print:p-0 print:mt-0">
        
        {/* Back Button */}
        <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-on-surface-variant hover:text-crimson transition-colors mb-6 font-data text-xs uppercase no-print">
          <ArrowLeft size={14} /> Back to Workspace
        </button>

        {/* Header Section */}
        <div className="bg-surface border border-outline-variant/30 p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-display text-3xl text-crimson tracking-tight">{entry.title || 'Untitled Analysis'}</h1>
            <div className="flex gap-4 mt-2 font-data text-xs text-on-surface-variant uppercase tracking-wider">
              <span>{new Date(entry.timestamp).toLocaleString()}</span>
              <span>Model: {entry.model}</span>
              <span>ID: {entry.id}</span>
            </div>
          </div>
          <div className="text-center md:text-right shrink-0">
            <div className="font-data text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Match Score</div>
            <div className="font-display text-5xl text-crimson font-bold">{entry.matchScore || 0}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Uploaded Documents */}
            <section className="bg-surface border border-outline-variant/30 p-6">
              <h3 className="font-ui font-bold text-sm uppercase tracking-wide border-b border-outline-variant/30 pb-3 mb-4">Source Documents</h3>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant mb-3">
                <FileText size={16} className="text-crimson" />
                <span>{entry.resumeName || 'Unknown file'}</span>
              </div>
              <div className="bg-background/50 p-3 rounded text-xs font-data text-on-surface-variant line-clamp-4">
                <strong>Target Job Snippet:</strong><br/>
                {entry.jobDescriptionSnippet}
              </div>
            </section>

            {/* Export Options */}
            <section className="bg-surface border border-outline-variant/30 p-6 no-print">
              <h3 className="font-ui font-bold text-sm uppercase tracking-wide border-b border-outline-variant/30 pb-3 mb-4">Export Report</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setIsExportModalOpen(true)} 
                  className="flex items-center justify-between px-4 py-3 bg-crimson text-white hover:bg-opacity-90 border border-outline-variant/30 rounded text-sm transition-colors font-bold tracking-wide"
                >
                  <span className="flex items-center gap-2"><Download size={16} /> Export Analysis</span>
                </button>
              </div>
            </section>
            
            {data && (
              <section className="bg-surface border border-outline-variant/30 p-6">
                <h3 className="font-ui font-bold text-sm uppercase tracking-wide border-b border-outline-variant/30 pb-3 mb-4">Skill Radar Snapshot</h3>
                <div className="h-[220px] w-full bg-background/50 p-2">
                  <RadarChartWrapper 
                    matchScore={data.match_score}
                    keywordsFound={data.keywords_found}
                    keywordsMissing={data.keywords_missing}
                  />
                </div>
              </section>
            )}

          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Results Details */}
            {data ? (
              <>
                <section className="bg-surface border border-outline-variant/30 p-6">
                  <h3 className="font-ui font-bold text-sm uppercase tracking-wide border-b border-outline-variant/30 pb-3 mb-4 text-emerald-600">Identified Strengths</h3>
                  <ul className="space-y-2">
                    {data.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-on-surface-variant before:content-['•'] before:text-emerald-500">
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-surface border border-outline-variant/30 p-6">
                  <h3 className="font-ui font-bold text-sm uppercase tracking-wide border-b border-outline-variant/30 pb-3 mb-4 text-crimson">Identified Gaps</h3>
                  <ul className="space-y-2">
                    {data.gaps.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-on-surface-variant before:content-['•'] before:text-crimson">
                        {g}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-surface border border-outline-variant/30 p-6">
                  <h3 className="font-display text-2xl text-crimson tracking-tight border-b border-outline-variant/30 pb-3 mb-6">Optimization Recommendations</h3>
                  <div className="space-y-6">
                    {data.suggestions.map((sug, idx) => (
                      <div key={idx} className="border-l-2 border-crimson pl-4">
                        <span className="font-data text-[10px] bg-crimson text-white px-2 py-0.5 uppercase">
                          {sug.section}
                        </span>
                        <p className="font-ui font-semibold text-sm text-on-surface mt-2 mb-1">
                          {sug.issue}
                        </p>
                        <p className="font-ui text-xs text-on-surface-variant italic">
                          <span className="font-bold not-italic">Recommended Fix: </span>{sug.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
                
                {/* Print only detailed resume - we don't need to show it on screen as it makes it too long, but available for PDF */}
                <div className="hidden print-only mt-8 bg-white p-8">
                   <h2 className="text-xl font-bold mb-4">Improved Resume Draft</h2>
                   <pre className="whitespace-pre-wrap text-xs font-ui">{data.improved_resume}</pre>
                </div>
              </>
            ) : (
              <div className="bg-surface border border-outline-variant/30 p-6 text-center text-on-surface-variant">
                Detailed analysis data is not available for this record.
              </div>
            )}
            
          </div>
        </div>
      </main>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        data={entry} 
      />
    </div>
  );
}
