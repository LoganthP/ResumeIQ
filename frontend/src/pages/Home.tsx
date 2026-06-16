import { useState, useEffect, useRef } from 'react';
import { analyzeResume } from '../api/resumeApi';
import type { AnalysisResult } from '../types';
import ResumeCharts, { RadarChartWrapper } from '../components/ResumeCharts';
import { Header } from '../components/Header';
import { addHistoryEntry } from '../utils/history';
import type { HistoryEntry } from '../utils/history';
import { ExportModal } from '../components/ExportModal';
import { useLocation, useNavigate } from 'react-router-dom';

interface LogEntry {
  time: string;
  text: string;
}

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  // Input states
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>(location.state?.duplicateJd || '');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // App phase state: 'upload' | 'analyzing' | 'results'
  const [phase, setPhase] = useState<'upload' | 'analyzing' | 'results'>('upload');

  // Terminal log animation state
  const [terminalLogs, setTerminalLogs] = useState<LogEntry[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // API Call and Result states
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [appliedSuggestions, setAppliedSuggestions] = useState<number[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(
    localStorage.getItem('resume_iq_selected_model') || 'google/gemini-2.5-flash'
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('resume_iq_selected_model', selectedModel);
  }, [selectedModel]);

  // Track if API call has resolved and log animation has finished
  const apiPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
  const apiResolvedRef = useRef<boolean>(false);
  const logsFinishedRef = useRef<boolean>(false);
  const pendingDataRef = useRef<AnalysisResult | null>(null);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
        setErrorMsg('');
      } else {
        setErrorMsg('Only PDF files are supported.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(selectedFile);
        setErrorMsg('');
      } else {
        setErrorMsg('Only PDF files are supported.');
      }
    }
  };

  // Start analysis
  const handleStartAnalysis = () => {
    if (!file) {
      setErrorMsg('Please select or drop a resume PDF first.');
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg('Please enter a target job description.');
      return;
    }

    setErrorMsg('');
    setPhase('analyzing');
    setTerminalLogs([]);
    setAppliedSuggestions([]);
    apiResolvedRef.current = false;
    logsFinishedRef.current = false;
    pendingDataRef.current = null;
    const startTime = Date.now();

    // Trigger API call
    const apiCall = analyzeResume(file, jobDescription, selectedModel)
      .then((data) => {
        apiResolvedRef.current = true;
        pendingDataRef.current = data;
        const latencyMs = Date.now() - startTime;
        addHistoryEntry({
          title: `Resume Match: ${file?.name?.replace('.pdf','') || 'Untitled'}`,
          model: selectedModel,
          latencyMs,
          status: 'success',
          queryType: 'Resume Analysis',
          resumeName: file?.name,
          jobDescriptionText: jobDescription,
          jobDescriptionSnippet: jobDescription.substring(0, 100) + (jobDescription.length > 100 ? '...' : ''),
          matchScore: data.match_score,
          summarySnippet: data.strengths.slice(0, 2).join('. ') + '.',
          fullAnalysis: data
        });
        checkTransitionToResults();
        return data;
      })
      .catch((err) => {
        const latencyMs = Date.now() - startTime;
        addHistoryEntry({
          title: `Failed Analysis: ${file?.name?.replace('.pdf','') || 'Untitled'}`,
          model: selectedModel,
          latencyMs,
          status: 'error',
          queryType: 'Resume Analysis',
          resumeName: file?.name,
          jobDescriptionText: jobDescription,
          jobDescriptionSnippet: jobDescription.substring(0, 100) + (jobDescription.length > 100 ? '...' : '')
        });
        setErrorMsg(err.message || 'Analysis failed. Please check your OpenRouter API Key or configuration.');
        setPhase('upload');
        throw err;
      });

    apiPromiseRef.current = apiCall;

    // Trigger terminal animation log sequence
    const logsSequence = [
      "[BOOT] Initializing Neural Mapping Core...",
      "[INFO] PDF Buffer loaded. Integrity Check: PASSED",
      "[SCAN] Extracting character entities and document metadata...",
      "[NLP] Normalizing professional narrative structure...",
      "[MATCH] Cross-referencing job description requirements...",
      "[ANALYSIS] Identifying skill clusters and experience mapping...",
      "[OPT] Analyzing keyword densities and keyword alignment...",
      "[OPT] Generating high-impact semantic replacements...",
      "[DONE] Analysis sequence complete. Mapping results..."
    ];

    logsSequence.forEach((logText, index) => {
      setTimeout(() => {
        const time = new Date().toLocaleTimeString();
        setTerminalLogs((prev) => [...prev, { time, text: logText }]);

        if (index === logsSequence.length - 1) {
          logsFinishedRef.current = true;
          checkTransitionToResults();
        }
      }, index * 350);
    });
  };

  const checkTransitionToResults = () => {
    if (logsFinishedRef.current && apiResolvedRef.current && pendingDataRef.current) {
      setAnalysisResult(pendingDataRef.current);
      setPhase('results');
    }
  };

  // Auto scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const resetFlow = () => {
    setFile(null);
    setJobDescription('');
    setPhase('upload');
    setAnalysisResult(null);
    setTerminalLogs([]);
    setAppliedSuggestions([]);
    setErrorMsg('');
  };

  const toggleSuggestion = (index: number) => {
    if (appliedSuggestions.includes(index)) {
      setAppliedSuggestions((prev) => prev.filter((i) => i !== index));
    } else {
      setAppliedSuggestions((prev) => [...prev, index]);
    }
  };

  // Apply highlight replacements to improved resume dynamically if suggestions are "applied"
  const renderImprovedResume = () => {
    if (!analysisResult) return null;
    let resumeText = analysisResult.improved_resume;
    
    const appliedSectionNames = appliedSuggestions.map(idx => analysisResult.suggestions[idx].section.toUpperCase());
    
    return (
      <div className="flex flex-col gap-1">
        {resumeText.split('\n').map((line, i) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return <div key={i} className="min-h-[1em]" />;
          
          // Simplistic check for section header: line is all uppercase, not just a few chars
          const isHeader = trimmedLine.length > 3 && trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.includes('  ');
          
          // Check if any applied section name is in this line
          const isAppliedHeader = isHeader && appliedSectionNames.some(section => trimmedLine.includes(section));
          
          if (isAppliedHeader) {
             return <div key={i} className="bg-emerald-100 text-emerald-900 px-2 py-1 mt-2 rounded font-bold border-l-2 border-emerald-500">{line}</div>;
          }
          if (isHeader) {
             return <div key={i} className="font-bold text-crimson mt-2">{line}</div>;
          }
          return <div key={i} className="text-on-surface leading-relaxed">{line}</div>;
        })}
      </div>
    );
  };

  // Generate dynamic executive summary based on findings
  const getExecutiveSummary = () => {
    if (!analysisResult) return '';
    const score = analysisResult.match_score;
    const keyStrength = analysisResult.strengths[0] || 'technical background';
    const keyGap = analysisResult.gaps[0] || 'areas needing quantitative indicators';
    
    if (score >= 80) {
      return `Outstanding alignment. Your strong expertise in ${keyStrength.toLowerCase()} aligns highly with key role requirements. Focus optimization on addressing: ${keyGap.toLowerCase()}.`;
    } else if (score >= 60) {
      return `Solid match profile. Notable technical coverage with ${keyStrength.toLowerCase()}. However, there are notable coverage gaps like ${keyGap.toLowerCase()} which can be easily resolved.`;
    } else {
      return `Moderate alignment. Technical and role qualifications are present but dispersed. Requires heavy reinforcement of missing keywords and structure. Address suggestions to boost profile match.`;
    }
  };

  return (
    <div className="h-screen flex flex-col m-0 p-0 text-on-surface select-none">
      {/* TopAppBar */}
      <Header 
        selectedModel={selectedModel} 
        onModelSelect={setSelectedModel} 
        onHomeClick={() => navigate('/')}
        phase={phase}
        onNavClick={(targetPhase) => {
          if (targetPhase === 'upload') {
            resetFlow();
          } else if (targetPhase === 'history') {
            navigate('/history');
          }
        }}
        hasResult={!!analysisResult}
      />

      {/* Main Content Area */}
      <main className="mt-[56px] flex-1 relative flex overflow-hidden">
        
        {/* PHASE 1: UPLOAD */}
        {phase === 'upload' && (
          <section className="w-full flex h-full absolute inset-0 z-30 transition-transform duration-700 ease-in-out">
            {/* Left Crimson Panel */}
            <div className="w-[38vw] bg-crimson flex flex-col justify-center px-16 text-white shrink-0">
              <h1 className="font-display text-[120px] leading-[0.9] tracking-tighter">
                YOUR<br/>RESUME.<br/>ANALYZED.
              </h1>
              <p className="font-data text-sm mt-8 opacity-70 max-w-sm uppercase tracking-widest leading-relaxed">
                Neural Cartography Engine v4.0.21. Feed the system with your professional narrative.
              </p>
              <div className="mt-12 flex gap-4">
                <div className="w-12 h-[1px] bg-white self-center"></div>
                <span className="font-data text-xs uppercase tracking-wider">Awaiting Data Input</span>
              </div>
            </div>

            {/* Right Input Panel */}
            <div className="flex-1 bg-background flex flex-col p-16 justify-between overflow-y-auto custom-scrollbar">
              <div className="flex-1 flex flex-col gap-8">
                
                {/* File Upload Zone */}
                <div 
                  className={`flex-1 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors relative min-h-[220px] group ${
                    dragActive ? "border-crimson bg-surface" : "border-crimson/30 hover:bg-surface"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="absolute top-4 left-4 font-data text-[10px] text-crimson/50">INPUT_BUFFER_01</div>
                  
                  {file ? (
                    <div className="text-center p-4">
                      <span className="material-symbols-outlined text-crimson text-6xl">description</span>
                      <p className="font-display text-2xl text-crimson mt-2 uppercase tracking-wide">
                        {file.name}
                      </p>
                      <p className="font-data text-[10px] text-on-surface-variant mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • CLICK TO CHANGE
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-4 flex flex-col items-center">
                      <span className="material-symbols-outlined text-crimson text-6xl group-hover:scale-110 transition-transform duration-300">
                        upload_file
                      </span>
                      <p className="font-display text-3xl text-crimson mt-4">DROP RESUME PDF OR CLICK TO LOAD</p>
                      <p className="font-data text-[10px] text-on-surface-variant mt-2 uppercase">
                        Supported: PDF | Max File Size: 5MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Job Description Textarea */}
                <div className="h-60 flex flex-col">
                  <label className="font-data text-[10px] text-crimson uppercase mb-2 tracking-wider">
                    Target Job Description / Context
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      setErrorMsg('');
                    }}
                    className="flex-1 bg-transparent border-b-2 border-crimson/20 border-t-0 border-x-0 focus:ring-0 focus:border-crimson text-on-surface font-ui text-base p-2 placeholder:text-on-surface-variant/30 resize-none outline-none"
                    placeholder="Paste the target job description requirements here to initiate cross-referencing..."
                  />
                </div>

                {/* Error message display */}
                {errorMsg && (
                  <div className="bg-crimson/10 border border-crimson/20 rounded p-4 flex items-center text-crimson text-sm font-ui">
                    <span className="material-symbols-outlined mr-2">error</span>
                    <p>{errorMsg}</p>
                  </div>
                )}

                <button 
                  onClick={handleStartAnalysis}
                  disabled={!file || !jobDescription.trim()}
                  className="shimmer bg-crimson text-white font-display text-2xl py-4 hover:bg-deep-burgundy transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
                >
                  Initiate Neural Mapping
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PHASE 2: ANALYZING */}
        {phase === 'analyzing' && (
          <section className="w-full h-full absolute inset-0 z-40 bg-background/95 backdrop-blur-md flex items-center justify-center p-20">
            <div className="w-full max-w-4xl h-full border border-crimson/20 bg-surface p-8 font-data text-sm flex flex-col overflow-hidden shadow-2xl">
              <div className="flex justify-between border-b border-crimson/20 pb-4 mb-4">
                <span className="text-crimson font-bold">TERMINAL ACCESS: SESSION_{Math.floor(1000 + Math.random() * 9000)}</span>
                <span className="text-on-surface-variant">SECURE_TUNNEL: ESTABLISHED</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {terminalLogs.map((log, index) => (
                  <div key={index} className="teletype-line text-on-surface-variant">
                    <span className="text-crimson">[{log.time}]</span> {log.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
              <div className="mt-4 pt-4 border-t border-crimson/20 flex items-center">
                <span className="text-crimson">SYSTEM_PROMPT: </span>
                <span className="terminal-cursor text-on-surface ml-2">PROCESSING_NEURAL_CARTOGRAPHY</span>
              </div>
            </div>
          </section>
        )}

        {/* PHASE 3: RESULTS */}
        {phase === 'results' && analysisResult && (
          <section className="w-full h-full flex no-print">
            
            {/* Column 1: Core Metrics */}
            <div className="w-[24%] border-r border-outline-variant/40 bg-surface flex flex-col overflow-y-auto custom-scrollbar p-6 shrink-0">
              <div className="mb-8 border-b border-outline-variant/30 pb-6">
                <p className="font-data text-[10px] text-crimson mb-1 uppercase tracking-wider">Match Probability</p>
                <h2 className="font-display text-[96px] leading-none text-crimson font-bold">
                  {analysisResult.match_score}%
                </h2>
                <p className="font-data text-xs text-on-surface-variant mt-2">
                  Correlation Index: {(analysisResult.match_score * 0.0113).toFixed(4)}
                </p>
              </div>

              {/* Radar Chart */}
              <div className="mb-8">
                <p className="font-data text-[10px] text-crimson mb-4 uppercase tracking-wider">Skill Radar Analysis</p>
                <div className="h-[220px] w-full bg-surface/30 p-2 border border-outline-variant/30">
                  <RadarChartWrapper 
                    matchScore={analysisResult.match_score}
                    keywordsFound={analysisResult.keywords_found}
                    keywordsMissing={analysisResult.keywords_missing}
                  />
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-6">
                <div className="p-4 border border-crimson/10 bg-background/50">
                  <p className="font-data text-[10px] text-crimson uppercase tracking-wider">Executive Summary</p>
                  <p className="font-ui text-xs mt-2 leading-relaxed text-on-surface-variant">
                    {getExecutiveSummary()}
                  </p>
                </div>

                <div className="p-4 border border-outline-variant/30 bg-background/30">
                  <p className="font-data text-[10px] text-on-surface-variant uppercase tracking-wider">Keywords Found ({analysisResult.keywords_found.length})</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {analysisResult.keywords_found.slice(0, 8).map((kw, i) => (
                      <span key={i} className="text-[10px] font-data px-1.5 py-0.5 bg-crimson/10 text-crimson rounded-sm">
                        {kw}
                      </span>
                    ))}
                    {analysisResult.keywords_found.length > 8 && (
                      <span className="text-[10px] font-data px-1.5 py-0.5 text-on-surface-variant italic">
                        +{analysisResult.keywords_found.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Visual Analytics */}
            <div className="flex-1 border-r border-outline-variant/40 flex flex-col overflow-y-auto custom-scrollbar p-6 bg-background">
              <ResumeCharts 
                matchScore={analysisResult.match_score}
                keywordsFound={analysisResult.keywords_found}
                keywordsMissing={analysisResult.keywords_missing}
              />
            </div>

            {/* Column 3: Improvement & Draft */}
            <div className="w-[36%] flex flex-col bg-surface overflow-hidden shrink-0">
              <div className="p-6 border-b border-outline-variant/40">
                <h3 className="font-display text-3xl text-crimson tracking-tight">IMPROVEMENT LOG</h3>
                <p className="font-data text-[10px] text-on-surface-variant uppercase mt-1 tracking-wider">
                  {analysisResult.suggestions.length} Optimizations Recommended
                </p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Suggestions List */}
                <div className="space-y-4">
                  {analysisResult.suggestions.map((sug, idx) => {
                    const isApplied = appliedSuggestions.includes(idx);
                    return (
                      <div 
                        key={idx} 
                        className={`space-y-2 border-l-2 pl-4 py-2 transition-all ${
                          isApplied ? 'border-emerald-600 bg-emerald-50/20' : 'border-crimson hover:bg-background/40'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-data text-[10px] px-2 py-0.5 ${
                            isApplied ? 'bg-emerald-600 text-white' : 'bg-crimson text-white'
                          }`}>
                            {sug.section.toUpperCase()}
                          </span>
                          <button 
                            onClick={() => toggleSuggestion(idx)}
                            className="font-data text-[9px] uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer hover:bg-crimson hover:text-white border-crimson text-crimson"
                          >
                            {isApplied ? 'Undo Optimization' : 'Apply Optimization'}
                          </button>
                        </div>
                        <p className="font-ui font-semibold text-xs text-on-surface">
                          {sug.issue}
                        </p>
                        <p className="font-ui text-[11px] text-on-surface-variant italic">
                          <span className="font-bold not-italic">Fix: </span>{sug.fix}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Print/Download Resume Draft */}
                <div className="mt-8 bg-white p-6 shadow-sm border border-light-tan rounded-sm">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
                    <span className="font-display text-xl text-on-surface tracking-wide">IMPROVED DRAFT</span>
                    <div className="flex gap-2">
                      <button 
                        title="Download Report"
                        onClick={() => {
                          if (!analysisResult) return;
                          setIsExportModalOpen(true);
                        }}
                        className="material-symbols-outlined text-crimson cursor-pointer text-xl hover:opacity-85"
                      >
                        download
                      </button>
                      <button 
                        title="Copy to Clipboard"
                        onClick={() => {
                          if (!analysisResult) return;
                          navigator.clipboard.writeText(analysisResult.improved_resume);
                          alert("Improved resume draft copied to clipboard!");
                        }}
                        className="material-symbols-outlined text-crimson cursor-pointer text-xl hover:opacity-85"
                      >
                        content_copy
                      </button>
                      <button 
                        title="Print Resume"
                        onClick={() => window.print()}
                        className="material-symbols-outlined text-crimson cursor-pointer text-xl hover:opacity-85"
                      >
                        print
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 bg-background/20 rounded">
                    <pre className="font-data text-[10px] leading-relaxed text-on-surface-variant whitespace-pre-wrap select-text selection:bg-crimson/20">
                      {renderImprovedResume()}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-2 px-8 flex justify-between items-center bg-surface border-t border-outline-variant/20 no-print">
        <p className="font-data text-[10px] text-on-surface-variant uppercase">
          © 2026 ResumeIQ • Neural Cartography Engine v4.0
        </p>
        <div className="flex gap-6">
          <span className="font-data text-[10px] text-on-surface-variant hover:text-crimson transition-colors uppercase cursor-pointer">
            Privacy Protocol
          </span>
          <span className="font-data text-[10px] text-on-surface-variant hover:text-crimson transition-colors uppercase cursor-pointer">
            System Status: Nominal
          </span>
          <span className="font-data text-[10px] text-on-surface-variant hover:text-crimson transition-colors uppercase cursor-pointer">
            API Version: v1
          </span>
        </div>
      </footer>

      {/* PRINT-ONLY RESUME TEMPLATE */}
      {analysisResult && (
        <div className="hidden print-only p-8 max-w-4xl mx-auto bg-white text-black font-ui text-[12px] leading-relaxed">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">IMPROVED RESUME DRAFT</h1>
            <p className="text-[10px] italic text-gray-500">Optimized with ResumeIQ Neural Engine</p>
          </div>
          <pre className="whitespace-pre-wrap font-ui text-[11px] leading-relaxed font-normal">
            {renderImprovedResume()}
          </pre>
        </div>
      )}

      {analysisResult && (
        <ExportModal 
          isOpen={isExportModalOpen} 
          onClose={() => setIsExportModalOpen(false)} 
          data={{
            id: 'current-session',
            timestamp: new Date().toISOString(),
            title: `Resume Match: ${file?.name?.replace('.pdf', '') || 'Untitled'}`,
            model: selectedModel,
            latencyMs: 0,
            status: 'success',
            queryType: 'Resume Analysis',
            resumeName: file?.name,
            jobDescriptionText: jobDescription,
            jobDescriptionSnippet: jobDescription.substring(0, 100),
            matchScore: analysisResult.match_score,
            summarySnippet: analysisResult.strengths.slice(0, 2).join('. ') + '.',
            fullAnalysis: analysisResult
          } as HistoryEntry} 
        />
      )}
    </div>
  );
}
