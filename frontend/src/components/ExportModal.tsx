import React, { useState, useRef } from 'react';
import type { HistoryEntry } from '../utils/history';
import { FileText, Image, FileJson, FileCode2, Table, X, Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HistoryEntry | null;
}

type ExportFormat = 'PDF' | 'PNG' | 'TXT' | 'JSON' | 'MD' | 'CSV';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data }) => {
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // PDF Options
  const [pdfOptions, setPdfOptions] = useState({
    summary: true,
    score: true,
    strengths: true,
    weaknesses: true,
    recommendations: true,
    skills: true,
    metadata: true,
    jd: true,
    ai: true,
    improvedResume: true,
    quality: 'High Quality' as 'Standard' | 'High Quality'
  });

  // PNG Options
  const [pngOptions, setPngOptions] = useState({
    section: 'Entire Analysis' as 'Entire Analysis' | 'Summary Only' | 'Match Score Card' | 'Recommendations',
    resolution: '1080p' as '1080p' | '2K' | '4K'
  });

  const captureRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;
  const analysis = data.fullAnalysis;

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);
    const startTime = performance.now();
    
    console.log(`[Export Started] Format: ${format}, Analysis ID: ${data.id}`);
    console.log(`[Export Options] PDF:`, pdfOptions, `PNG:`, pngOptions);

    try {
      if (!data) throw new Error("Analysis data is missing or null");
      
      if (format === 'JSON') exportJSON();
      else if (format === 'TXT') exportTXT();
      else if (format === 'MD') exportMD();
      else if (format === 'CSV') exportCSV();
      else if (format === 'PNG') await exportPNG();
      else if (format === 'PDF') await exportPDF();
      
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[Export Success] Format: ${format}, Duration: ${duration}ms`);
      
    } catch (error) {
      console.error(`[Export Failed] Format: ${format}`, error);
      if (error instanceof Error) {
        console.error("Stack:", error.stack);
        setExportError(error.message);
      } else {
        setExportError("An unknown error occurred during export.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (content: string | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const exportData = {
      analysisId: data.id,
      timestamp: data.timestamp,
      modelUsed: data.model,
      resumeFile: data.resumeName,
      jobDescriptionSnippet: data.jobDescriptionSnippet,
      jobDescriptionText: data.jobDescriptionText,
      matchScore: data.matchScore,
      summary: data.summarySnippet,
      strengths: analysis?.strengths,
      weaknesses: analysis?.gaps,
      recommendations: analysis?.suggestions,
      keywordsFound: analysis?.keywords_found,
      keywordsMissing: analysis?.keywords_missing,
      improvedResume: analysis?.improved_resume
    };
    downloadBlob(JSON.stringify(exportData, null, 2), `Analysis_${data.id}.json`, 'application/json');
  };

  const exportTXT = () => {
    const content = `RESUME ANALYSIS REPORT\nTitle: ${data.title}\nDate: ${new Date(data.timestamp).toLocaleString()}\nModel: ${data.model}\nMatch Score: ${data.matchScore}%\n\n--- STRENGTHS ---\n${analysis?.strengths.map(s => `- ${s}`).join('\n')}\n\n--- WEAKNESSES ---\n${analysis?.gaps.map(g => `- ${g}`).join('\n')}\n\n--- RECOMMENDATIONS ---\n${analysis?.suggestions.map(s => `[${s.section}]\nIssue: ${s.issue}\nFix: ${s.fix}`).join('\n\n')}\n\n--- IMPROVED RESUME ---\n${analysis?.improved_resume}`;
    downloadBlob(content, `Analysis_${data.id}.txt`, 'text/plain');
  };

  const exportMD = () => {
    const md = `# ${data.title}
**Date:** ${new Date(data.timestamp).toLocaleString()}
**Model:** ${data.model}
**Match Score:** ${data.matchScore}%

## Original Files
- ${data.resumeName || 'Unknown Resume'}

## Analysis Summary
${data.summarySnippet}

## Detailed Feedback
**Strengths:**
${analysis?.strengths.map(s => `- ${s}`).join('\n') || 'N/A'}

**Weaknesses:**
${analysis?.gaps.map(g => `- ${g}`).join('\n') || 'N/A'}

## Recommendations
${analysis?.suggestions.map(s => `### ${s.section}\n**Issue:** ${s.issue}\n**Fix:** ${s.fix}`).join('\n\n') || 'N/A'}
`;
    downloadBlob(md, `Analysis_${data.id}.md`, 'text/markdown');
  };

  const exportCSV = () => {
    if (!analysis) return;
    const header = "Section,Issue,Fix\n";
    const rows = analysis.suggestions.map(s => `"${s.section.replace(/"/g, '""')}","${s.issue.replace(/"/g, '""')}","${s.fix.replace(/"/g, '""')}"`).join('\n');
    downloadBlob(header + rows, `Analysis_Recommendations_${data.id}.csv`, 'text/csv');
  };

  const getScale = (resolution: string) => {
    if (resolution === '4K') return 4;
    if (resolution === '2K') return 2;
    return 1; // 1080p roughly standard 1x scale for large containers
  };

  const sanitizeColors = (element: HTMLElement, isDark: boolean) => {
    const allElements = element.querySelectorAll('*');
    allElements.forEach(node => {
      const el = node as HTMLElement;
      if (!el.style) return;
      const styles = window.getComputedStyle(el);
      if (styles.color.includes('oklch') || styles.color.includes('oklab')) {
        el.style.color = isDark ? '#e0e0e0' : '#111827';
      }
      if (styles.backgroundColor.includes('oklch') || styles.backgroundColor.includes('oklab')) {
        el.style.backgroundColor = isDark ? '#1E1E1E' : '#ffffff';
      }
      if (styles.borderColor.includes('oklch') || styles.borderColor.includes('oklab')) {
        el.style.borderColor = isDark ? '#333333' : '#d1d5db';
      }
    });
  };

  const exportPNG = async () => {
    console.log("Export Options:", pdfOptions);
    if (!captureRef.current) {
      throw new Error("Preview element (captureRef) not found in DOM.");
    }
    const scale = getScale(pngOptions.resolution);
    
    const canvas = await html2canvas(captureRef.current, {
      scale,
      useCORS: true,
      backgroundColor: '#1E1E1E', // Match dark theme
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('export-capture-target');
        if (el) sanitizeColors(el, true);
      }
    });

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `Analysis_${data.id}.png`, 'image/png');
    });
  };

  const exportPDF = async () => {
    console.log("Export Options:", pdfOptions);
    if (!captureRef.current) {
      throw new Error("Preview element (captureRef) not found in DOM.");
    }
    
    const scale = pdfOptions.quality === 'High Quality' ? 2 : 1;
    
    const canvas = await html2canvas(captureRef.current, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff', // PDFs look better white
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('export-capture-target');
        if (el) sanitizeColors(el, false);
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const totalPdfHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = totalPdfHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pageHeight;
    
    // Add subsequent pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - totalPdfHeight; // Shift image up by pages already rendered
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`Analysis_${data.id}.pdf`);
  };

  // Toggles helper
  const togglePdfOption = (key: keyof typeof pdfOptions) => {
    setPdfOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="bg-surface w-full max-w-6xl h-[85vh] border border-outline-variant/30 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-background/50">
          <div>
            <h2 className="font-display text-2xl text-crimson flex items-center gap-2">
              <Download size={20} /> EXPORT ANALYSIS
            </h2>
            <p className="font-data text-xs text-on-surface-variant mt-1">Choose how you would like to export this analysis.</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-crimson transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        {exportError && (
          <div className="bg-red-500/10 border-l-4 border-red-500 text-red-500 px-4 py-3 mx-6 mt-4 font-ui text-sm flex justify-between items-start">
            <div>
              <strong className="font-bold block mb-1">Export Failed</strong>
              <span className="block">{exportError}</span>
              <span className="block text-xs mt-1 opacity-80">Check the developer console for the full stack trace.</span>
            </div>
            <button onClick={() => setExportError(null)} className="opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Formats */}
          <div className="w-64 border-r border-outline-variant/30 bg-background/30 p-4 space-y-2 overflow-y-auto">
            <h3 className="font-data text-[10px] uppercase text-on-surface-variant tracking-wider mb-4 px-2">Export Format</h3>
            
            {[
              { id: 'PDF', icon: FileText, label: 'PDF Report', desc: 'Professional formatted report.' },
              { id: 'PNG', icon: Image, label: 'PNG Snapshot', desc: 'High-resolution image.' },
              { id: 'JSON', icon: FileJson, label: 'JSON Data', desc: 'Structured raw data.' },
              { id: 'MD', icon: FileCode2, label: 'Markdown', desc: 'Formatted markdown.' },
              { id: 'TXT', icon: FileText, label: 'Plain Text', desc: 'Simple text version.' },
              { id: 'CSV', icon: Table, label: 'CSV Metrics', desc: 'Tabular score & metrics.' },
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFormat(f.id as ExportFormat)}
                className={`w-full text-left p-3 rounded border transition-all flex items-start gap-3 ${
                  format === f.id 
                    ? 'border-crimson bg-crimson/10 text-crimson' 
                    : 'border-transparent hover:bg-surface text-on-surface-variant'
                }`}
              >
                <f.icon size={18} className="mt-0.5 shrink-0" />
                <div>
                  <div className={`font-ui font-bold text-sm ${format === f.id ? 'text-crimson' : 'text-on-surface'}`}>{f.label}</div>
                  <div className="font-data text-[10px] opacity-70 mt-1">{f.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Middle Panel: Options */}
          <div className="w-80 border-r border-outline-variant/30 bg-surface p-6 overflow-y-auto">
            <h3 className="font-data text-[10px] uppercase text-crimson tracking-wider mb-6">Format Options</h3>
            
            {format === 'PDF' && (
              <div className="space-y-6">
                <div>
                  <label className="font-ui text-xs text-on-surface block mb-3 font-semibold">Include Sections:</label>
                  <div className="space-y-2">
                    {[
                      { key: 'summary', label: 'Analysis Summary' },
                      { key: 'score', label: 'Match Score' },
                      { key: 'strengths', label: 'Strengths' },
                      { key: 'weaknesses', label: 'Weaknesses' },
                      { key: 'recommendations', label: 'Recommendations' },
                      { key: 'improvedResume', label: 'Improved Resume' },
                      { key: 'skills', label: 'Skills Breakdown' },
                      { key: 'metadata', label: 'Resume Metadata' },
                      { key: 'jd', label: 'Job Description Metadata' },
                      { key: 'ai', label: 'AI Model Information' },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${pdfOptions[opt.key as keyof typeof pdfOptions] ? 'bg-crimson border-crimson text-white' : 'border-outline-variant group-hover:border-crimson'}`}>
                          {pdfOptions[opt.key as keyof typeof pdfOptions] && <Check size={12} />}
                        </div>
                        <span className="font-ui text-xs text-on-surface-variant group-hover:text-on-surface">{opt.label}</span>
                        <input type="checkbox" className="hidden" checked={!!pdfOptions[opt.key as keyof typeof pdfOptions]} onChange={() => togglePdfOption(opt.key as keyof typeof pdfOptions)} />
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="font-ui text-xs text-on-surface block mb-2 font-semibold">Export Quality:</label>
                  <select 
                    value={pdfOptions.quality} 
                    onChange={e => setPdfOptions(prev => ({...prev, quality: e.target.value as any}))}
                    className="w-full bg-background border border-outline-variant/30 text-xs p-2 text-on-surface rounded focus:outline-none focus:border-crimson"
                  >
                    <option value="Standard">Standard</option>
                    <option value="High Quality">High Quality (Slower)</option>
                  </select>
                </div>
              </div>
            )}

            {format === 'PNG' && (
              <div className="space-y-6">
                <div>
                  <label className="font-ui text-xs text-on-surface block mb-2 font-semibold">Export Section:</label>
                  <select 
                    value={pngOptions.section} 
                    onChange={e => setPngOptions(prev => ({...prev, section: e.target.value as any}))}
                    className="w-full bg-background border border-outline-variant/30 text-xs p-2 text-on-surface rounded focus:outline-none focus:border-crimson"
                  >
                    <option value="Entire Analysis">Entire Analysis</option>
                    <option value="Summary Only">Summary Only</option>
                    <option value="Match Score Card">Match Score Card</option>
                    <option value="Recommendations">Recommendations Section</option>
                  </select>
                </div>
                <div>
                  <label className="font-ui text-xs text-on-surface block mb-2 font-semibold">Resolution:</label>
                  <select 
                    value={pngOptions.resolution} 
                    onChange={e => setPngOptions(prev => ({...prev, resolution: e.target.value as any}))}
                    className="w-full bg-background border border-outline-variant/30 text-xs p-2 text-on-surface rounded focus:outline-none focus:border-crimson"
                  >
                    <option value="1080p">1080p</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K (High Memory)</option>
                  </select>
                </div>
              </div>
            )}

            {(format === 'JSON' || format === 'TXT' || format === 'MD' || format === 'CSV') && (
              <div className="text-xs text-on-surface-variant font-ui leading-relaxed">
                This format does not require configuration options. The complete data structure will be exported.
              </div>
            )}
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 bg-background/50 flex flex-col p-6 overflow-hidden relative">
            <h3 className="font-data text-[10px] uppercase text-on-surface-variant tracking-wider mb-4 absolute top-6 left-6 bg-background/80 px-2 py-1 rounded backdrop-blur z-10 border border-outline-variant/20">Live Preview</h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar rounded border border-outline-variant/20 bg-surface/50 shadow-inner p-8 flex justify-center">
              
              {/* Preview Rendering based on format */}
              {format === 'PDF' && (
                <div className="w-[210mm] min-h-[297mm] bg-white text-black shadow-lg p-[20mm] font-ui space-y-6 text-left">
                   <h1 className="text-3xl font-bold border-b pb-2 text-gray-900">{data.title}</h1>
                   {pdfOptions.metadata && (
                     <div className="text-xs text-gray-500 mb-4 space-y-1">
                       <p><strong>Candidate Resume:</strong> {data.resumeName || 'N/A'}</p>
                       <p><strong>Date:</strong> {new Date(data.timestamp).toLocaleString()}</p>
                     </div>
                   )}
                   {pdfOptions.score && (
                     <div className="bg-gray-50 p-6 rounded text-center my-6 border border-gray-200">
                       <div className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-2">Match Score</div>
                       <div className="text-5xl font-bold text-red-800">{data.matchScore}%</div>
                     </div>
                   )}
                   {pdfOptions.summary && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Summary</h2>
                       <p className="text-sm leading-relaxed text-gray-700">{data.summarySnippet}</p>
                     </div>
                   )}
                   {pdfOptions.strengths && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Strengths</h2>
                       <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                         {analysis?.strengths.map((s,i)=><li key={i}>{s}</li>)}
                       </ul>
                     </div>
                   )}
                   {pdfOptions.weaknesses && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Gaps & Weaknesses</h2>
                       <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                         {analysis?.gaps.map((g,i)=><li key={i}>{g}</li>)}
                       </ul>
                     </div>
                   )}
                   {pdfOptions.recommendations && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Recommendations</h2>
                       <div className="space-y-3">
                         {analysis?.suggestions.map((sug, i) => (
                           <div key={i} className="pl-3 border-l-2 border-red-500">
                             <div className="font-bold text-xs text-gray-800">{sug.section}</div>
                             <div className="text-xs text-gray-600 mt-0.5">{sug.issue}</div>
                             <div className="text-xs text-gray-500 italic">Fix: {sug.fix}</div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   {pdfOptions.skills && (analysis?.keywords_found || analysis?.keywords_missing) && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Skills Breakdown</h2>
                       <div className="grid grid-cols-2 gap-4 text-xs">
                         <div>
                           <h3 className="font-semibold text-green-700 mb-1">Found</h3>
                           <div className="flex flex-wrap gap-1">
                             {analysis?.keywords_found.map((kw, i) => (
                               <span key={i} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">{kw}</span>
                             ))}
                           </div>
                         </div>
                         <div>
                           <h3 className="font-semibold text-orange-700 mb-1">Missing</h3>
                           <div className="flex flex-wrap gap-1">
                             {analysis?.keywords_missing.map((kw, i) => (
                               <span key={i} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-200">{kw}</span>
                             ))}
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                   {pdfOptions.improvedResume && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Improved Resume</h2>
                       <pre className="whitespace-pre-wrap font-sans text-xs bg-gray-50 p-3 rounded text-gray-700 max-h-40 overflow-y-auto">
                         {analysis?.improved_resume}
                       </pre>
                     </div>
                   )}
                   {pdfOptions.jd && (data.jobDescriptionText || data.jobDescriptionSnippet) && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">Job Description</h2>
                       <div className="text-xs text-gray-600 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded whitespace-pre-wrap">
                         {data.jobDescriptionText || data.jobDescriptionSnippet}
                       </div>
                     </div>
                   )}
                   {pdfOptions.ai && (
                     <div>
                       <h2 className="text-lg font-bold mb-2 text-red-800 border-b border-red-100 pb-1">AI Model Information</h2>
                       <div className="text-xs text-gray-600 space-y-1">
                         <p><strong>Model:</strong> {data.model}</p>
                         {data.latencyMs && <p><strong>Latency:</strong> {(data.latencyMs / 1000).toFixed(2)}s ({data.latencyMs} ms)</p>}
                         <p><strong>Status:</strong> {data.status}</p>
                       </div>
                     </div>
                   )}
                </div>
              )}

              {format === 'PNG' && (
                <div className="w-full max-w-2xl bg-[#1E1E1E] text-[#e0e0e0] border border-[#333] p-8 shadow-2xl rounded-lg">
                   <div className="mb-6 flex justify-between items-center border-b border-[#333] pb-4">
                     <div>
                       <h2 className="text-xl font-bold text-[#f28b82]">{data.title}</h2>
                       <p className="text-xs text-[#aaa] mt-1">{data.resumeName}</p>
                     </div>
                     <div className="text-3xl font-bold text-[#f28b82]">{data.matchScore}%</div>
                   </div>
                   {pngOptions.section !== 'Match Score Card' && (
                     <div className="text-sm leading-relaxed text-[#ccc] space-y-4">
                       <p>{data.summarySnippet}</p>
                       {pngOptions.section === 'Entire Analysis' && (
                         <div className="mt-4 p-4 bg-[#2a2a2a] rounded">
                           <strong className="text-[#f28b82] block mb-2">Top Recommendation</strong>
                           <p>{analysis?.suggestions[0]?.issue}</p>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              )}

              {format === 'JSON' && (
                <pre className="w-full text-xs font-data text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify({
                    analysisId: data.id,
                    modelUsed: data.model,
                    matchScore: data.matchScore,
                    strengths: analysis?.strengths.slice(0,2).concat(['...']),
                    "note": "// Preview truncated for display"
                  }, null, 2)}
                </pre>
              )}

              {format === 'MD' && (
                <pre className="w-full text-xs font-ui text-on-surface-variant whitespace-pre-wrap">
                  {`# ${data.title}\n**Score:** ${data.matchScore}%\n\n## Strengths\n- ${analysis?.strengths[0]}\n- ${analysis?.strengths[1]}`}
                </pre>
              )}
              
              {format === 'TXT' && (
                <pre className="w-full text-xs font-ui text-on-surface-variant whitespace-pre-wrap">
                  {`RESUME ANALYSIS REPORT\nTitle: ${data.title}\nMatch Score: ${data.matchScore}%\n\n--- STRENGTHS ---\n- ${analysis?.strengths[0]}\n- ${analysis?.strengths[1]}`}
                </pre>
              )}

              {format === 'CSV' && (
                <div className="w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/50"><th className="p-2">Section</th><th className="p-2">Issue</th></tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-outline-variant/20"><td className="p-2">{analysis?.suggestions[0]?.section}</td><td className="p-2">{analysis?.suggestions[0]?.issue}</td></tr>
                      <tr className="border-b border-outline-variant/20"><td className="p-2">{analysis?.suggestions[1]?.section}</td><td className="p-2">{analysis?.suggestions[1]?.issue}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-4 bg-background/50">
          <button onClick={onClose} className="px-4 py-2 font-ui text-sm text-on-surface hover:text-crimson transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-crimson text-white font-ui font-bold text-sm tracking-wide rounded-sm hover:bg-opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? 'Generating...' : `Export ${format}`}
          </button>
        </div>

      </div>

      {/* Hidden Render Target for html2canvas */}
      <div 
        ref={captureRef} 
        id="export-capture-target"
        style={{ 
          position: 'absolute', top: '-9999px', left: '-9999px', width: '1200px', zIndex: -100,
          backgroundColor: format === 'PDF' ? '#ffffff' : '#1E1E1E',
          color: format === 'PDF' ? '#000000' : '#e0e0e0',
          borderColor: format === 'PDF' ? '#e5e7eb' : '#333333'
        }}
        className="p-12 font-ui text-left"
      >
        {/* Actual capture template based on options */}
        <h1 className="text-4xl font-bold mb-2" style={{ color: format === 'PDF' ? '#111827' : '#f28b82' }}>{data.title}</h1>
        
        {/* Resume Metadata */}
        {(format === 'PDF' ? pdfOptions.metadata : pngOptions.section === 'Entire Analysis') && (
          <div className="text-sm opacity-70 mb-6" style={{ color: format === 'PDF' ? '#4b5563' : '#aaaaaa' }}>
            <p className="mb-1"><strong>Candidate Resume:</strong> {data.resumeName || 'N/A'}</p>
            <p><strong>Analysis Date:</strong> {new Date(data.timestamp).toLocaleString()}</p>
          </div>
        )}

        {/* Match Score Block */}
        {(format === 'PDF' ? pdfOptions.score : (pngOptions.section === 'Entire Analysis' || pngOptions.section === 'Match Score Card')) && (
          <div 
            className="p-6 rounded text-center mb-8 border" 
            style={{ 
              backgroundColor: format === 'PDF' ? '#f9fafb' : '#2a2a2a', 
              borderColor: format === 'PDF' ? '#e5e7eb' : '#333333',
              maxWidth: '300px'
            }}
          >
            <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: format === 'PDF' ? '#4b5563' : '#aaaaaa' }}>Match Score</div>
            <div className="text-4xl font-bold" style={{ color: format === 'PDF' ? '#991b1b' : '#f28b82' }}>{data.matchScore}%</div>
          </div>
        )}
        
        {(format === 'PDF' ? pdfOptions.summary : (pngOptions.section === 'Entire Analysis' || pngOptions.section === 'Summary Only')) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ borderBottom: '1px solid', borderColor: 'inherit' }}>Analysis Summary</h2>
            <p className="text-lg leading-relaxed">{data.summarySnippet}</p>
          </div>
        )}

        {(format === 'PDF' ? pdfOptions.strengths : pngOptions.section === 'Entire Analysis') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ color: '#059669', borderBottom: '1px solid', borderColor: 'inherit' }}>Strengths</h2>
            <ul className="list-disc pl-6 text-lg space-y-2">
              {analysis?.strengths.map((s,i)=><li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {(format === 'PDF' ? pdfOptions.weaknesses : pngOptions.section === 'Entire Analysis') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ color: '#ea580c', borderBottom: '1px solid', borderColor: 'inherit' }}>Gaps & Weaknesses</h2>
            <ul className="list-disc pl-6 text-lg space-y-2">
              {analysis?.gaps.map((g,i)=><li key={i}>{g}</li>)}
            </ul>
          </div>
        )}

        {(format === 'PDF' ? pdfOptions.recommendations : (pngOptions.section === 'Entire Analysis' || pngOptions.section === 'Recommendations')) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ color: '#dc2626', borderBottom: '1px solid', borderColor: 'inherit' }}>Optimization Recommendations</h2>
            <div className="space-y-6">
              {analysis?.suggestions.map((sug,i) => (
                <div key={i} className="pl-4" style={{ borderLeft: '4px solid #dc2626' }}>
                  <div className="font-bold">{sug.section}</div>
                  <div className="mt-1">{sug.issue}</div>
                  <div className="mt-1 italic opacity-80" style={{ color: format === 'PDF' ? '#4b5563' : '#aaaaaa' }}>Fix: {sug.fix}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(format === 'PDF' ? pdfOptions.skills : pngOptions.section === 'Entire Analysis') && (analysis?.keywords_found || analysis?.keywords_missing) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ borderBottom: '1px solid', borderColor: 'inherit' }}>Skills Breakdown</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#059669' }}>Found Keywords</h3>
                {analysis?.keywords_found && analysis.keywords_found.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords_found.map((kw, i) => (
                      <span key={i} className="px-3 py-1 text-sm rounded border" style={{ backgroundColor: format === 'PDF' ? '#e6f4ea' : '#1b3b22', borderColor: '#059669', color: format === 'PDF' ? '#137333' : '#81c784' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-60">None found</p>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#ea580c' }}>Missing Keywords</h3>
                {analysis?.keywords_missing && analysis.keywords_missing.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords_missing.map((kw, i) => (
                      <span key={i} className="px-3 py-1 text-sm rounded border" style={{ backgroundColor: format === 'PDF' ? '#fce8e6' : '#3c1b18', borderColor: '#ea580c', color: format === 'PDF' ? '#c5221f' : '#e57373' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm opacity-60">None missing</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {(format === 'PDF' ? pdfOptions.improvedResume : pngOptions.section === 'Entire Analysis') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ color: '#2563eb', borderBottom: '1px solid', borderColor: 'inherit' }}>Improved Resume Draft</h2>
            <pre className="whitespace-pre-wrap font-ui text-sm leading-relaxed p-4 rounded" style={{ backgroundColor: format === 'PDF' ? '#f3f4f6' : '#2a2a2a', color: format === 'PDF' ? '#1f2937' : '#e0e0e0' }}>
              {analysis?.improved_resume}
            </pre>
          </div>
        )}

        {(format === 'PDF' ? pdfOptions.jd : pngOptions.section === 'Entire Analysis') && (data.jobDescriptionText || data.jobDescriptionSnippet) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ borderBottom: '1px solid', borderColor: 'inherit' }}>Job Description</h2>
            <div className="text-lg leading-relaxed whitespace-pre-wrap p-4 rounded" style={{ backgroundColor: format === 'PDF' ? '#f9fafb' : '#2a2a2a', border: '1px solid', borderColor: 'inherit' }}>
              {data.jobDescriptionText || data.jobDescriptionSnippet}
            </div>
          </div>
        )}

        {(format === 'PDF' ? pdfOptions.ai : pngOptions.section === 'Entire Analysis') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold pb-2 mb-4" style={{ borderBottom: '1px solid', borderColor: 'inherit' }}>AI Model Information</h2>
            <div className="text-lg space-y-2">
              <p><strong>Model:</strong> {data.model}</p>
              {data.latencyMs && <p><strong>Response Latency:</strong> {(data.latencyMs / 1000).toFixed(2)}s ({data.latencyMs} ms)</p>}
              <p><strong>Analysis Status:</strong> {data.status}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
