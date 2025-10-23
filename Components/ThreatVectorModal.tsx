import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './Button.tsx';
import { useSessionContext } from '../contexts/SessionContext.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { ImportIcon, PaperclipIcon } from './Icons.tsx';
import { BoltIcon, ReportIcon, SkullIcon, TargetIcon } from './Icons.tsx';
import { AccordionItem } from './AccordionItem.tsx';
import { Part } from '../types.ts';

// FIX: Renamed props interface to match component and usage in App.tsx.
interface ThreatVectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchRecon: (url: string) => void;
  onStageExploit: (endpoint: string) => void;
  onDraftReport: (report: string) => void;
}

interface ActionableTargets {
    endpoints: string[];
    recon: string[];
}

const analysisMessages = [
    "CONSOLIDATING INTEL...",
    "CROSS-REFERENCING CVE DATABASES...",
    "IDENTIFYING HIGH-VALUE TARGETS...",
    "FORMULATING ATTACK VECTORS...",
    "PRIORITIZING ENTRY POINTS...",
];

const fileToPart = (file: File): Promise<Part> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (file.type.startsWith('image/')) {
                resolve({ inlineData: { mimeType: file.type, data: result.split(',')[1] } });
            } else {
                // For text-based files, wrap content in a formatted block
                const textContent = `\n\n--- START OF FILE: ${file.name} ---\n${result}\n--- END OF FILE: ${file.name} ---\n`;
                resolve({ text: textContent });
            }
        };
        reader.onerror = (error) => reject(error);
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
};


// FIX: Renamed component to ThreatVectorModal to match usage in App.tsx.
export const ThreatVectorModal: React.FC<ThreatVectorModalProps> = ({ 
    isOpen, onClose, onLaunchRecon, onStageExploit, onDraftReport 
}) => {
  // FIX: Renamed context properties to match SessionContextType.
  const { 
    isGeneratingThreatVector, 
    threatVectorReport, 
    handleThreatVectorAnalysis,
    setThreatVectorReport 
  } = useSessionContext();
  const [targetUrl, setTargetUrl] = useState('');
  const [reconFiles, setReconFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysisMessage, setCurrentAnalysisMessage] = useState(analysisMessages[0]);
  const [actionableTargets, setActionableTargets] = useState<ActionableTargets>({ endpoints: [], recon: [] });
  
  useEffect(() => {
      let interval: number;
      // FIX: Use correct loading state variable.
      if (isGeneratingThreatVector && !threatVectorReport) {
          let i = 0;
          interval = window.setInterval(() => {
              i = (i + 1) % analysisMessages.length;
              setCurrentAnalysisMessage(analysisMessages[i]);
          }, 2000);
      }
      return () => clearInterval(interval);
  }, [isGeneratingThreatVector, threatVectorReport]);

  useEffect(() => {
    // FIX: Use correct report state variable.
    if (threatVectorReport && !isGeneratingThreatVector) {
        const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```$/;
        // FIX: Use correct report state variable.
        const match = threatVectorReport.match(jsonBlockRegex);
        if (match && match[1]) {
            try {
                const parsed = JSON.parse(match[1]);
                setActionableTargets({
                    endpoints: parsed.suggestedEndpointsForExploitation || [],
                    recon: parsed.suggestedTargetsForLiveRecon || [],
                });
            } catch (e) {
                console.error("Failed to parse actionable targets JSON from report:", e);
                setActionableTargets({ endpoints: [], recon: [] });
            }
        }
    } else {
        setActionableTargets({ endpoints: [], recon: [] });
    }
  }, [threatVectorReport, isGeneratingThreatVector]);


  const handleFiles = (files: FileList) => {
    setError(null);
    const newFiles = Array.from(files);
    setReconFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
  };
  
  const handleAnalysis = async () => {
    setError(null);
    if (!targetUrl.trim()) {
        setError('A Target URL is required for context.');
        return;
    }

    if (reconFiles.length > 0) {
        try {
            const parts: Part[] = await Promise.all(reconFiles.map(fileToPart));
            // FIX: Use correct handler function.
            handleThreatVectorAnalysis({ targetUrl, parts });
        } catch (err) {
            setError('Failed to read one or more files.');
            console.error(err);
        }
    } else {
        // FIX: Use correct handler function.
        handleThreatVectorAnalysis({ targetUrl });
    }
  };
  
  const handleGenerateRelated = () => {
    // FIX: Use correct report state variable.
    if (!threatVectorReport) return;
    // FIX: Use correct handler function.
    handleThreatVectorAnalysis({ targetUrl, context: threatVectorReport });
  };

  const handleClose = () => {
    // FIX: Use correct state setter.
    setThreatVectorReport(null);
    setTargetUrl('');
    setReconFiles([]);
    setError(null);
    onClose();
  }

  const handleExport = () => {
    // FIX: Use correct report state variable.
    if (!threatVectorReport) return;
    let filename = 'threat_vector_report.md';
    try {
      const hostname = new URL(targetUrl).hostname;
      filename = `threat_vector_${hostname.replace(/[^a-z0-9.-]/gi, '_')}.md`;
    } catch (e) {
      console.warn("Could not parse target URL for filename, using default.");
    }

    // FIX: Use correct report state variable.
    const blob = new Blob([threatVectorReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const canScan = !!targetUrl;
  const scanButtonText = reconFiles.length > 0 ? "Analyze Data" : "Scan URL";

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      // FIX: Update aria-labelledby to match new ID.
      aria-labelledby="threat-vector-modal-title"
    >
      <div
        className="hud-container w-full max-w-3xl h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        
        <div className="flex justify-between items-center flex-shrink-0 relative">
            {/* FIX: Update title and ID. */}
            <h2 id="threat-vector-modal-title" className="text-xl">Threat Vector Analysis</h2>
            <button
                onClick={handleClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                // FIX: Update aria-label.
                aria-label="Close Threat Vector Analysis"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-grow mt-4 flex flex-col min-h-0 space-y-4">
          {/* FIX: Use correct report and loading state variables. */}
          {!threatVectorReport && !isGeneratingThreatVector ? (
             <div className="flex flex-col space-y-4 animate-fade-in">
                <h3 className="text-lg font-heading text-center text-gradient-cyan">Intelligence Ingestion</h3>
                <div>
                    <label htmlFor="target-url-threat" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">Target URL (Required)</label>
                    <input
                        id="target-url-threat" type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                        className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                        placeholder="https://example.com" disabled={isGeneratingThreatVector}
                    />
                </div>

                <div
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                  className={`w-full p-8 border-2 border-dashed ${dragOver ? 'border-[var(--hud-color)] bg-[var(--hud-color)]/10' : 'border-[var(--hud-color-darkest)]'} flex flex-col items-center justify-center text-center transition-colors cursor-pointer`}
                  onClick={() => document.getElementById('recon-file-upload')?.click()}
                >
                    <input type="file" id="recon-file-upload" className="hidden" multiple onChange={handleFileInput} />
                    <PaperclipIcon className="w-8 h-8 text-[var(--hud-color-darker)] mb-2" />
                    <p className="text-lg text-[var(--hud-color-darker)]">Drop intelligence files (JSON, TXT, images)</p>
                    <p className="text-sm text-[var(--hud-color-darker)]">or click to browse</p>
                </div>

                {reconFiles.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs text-[var(--hud-color-darker)] uppercase">Staged Files:</p>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                            {reconFiles.map((file, i) => (
                                <p key={i} className="text-sm font-mono bg-black/50 p-1 border border-[var(--hud-color-darkest)] truncate">{file.name}</p>
                            ))}
                        </div>
                    </div>
                )}
                
                {error && <p className="text-red-400 font-mono text-sm animate-fade-in text-center">{error}</p>}

                <Button onClick={handleAnalysis} disabled={!canScan || isGeneratingThreatVector} isLoading={isGeneratingThreatVector} className="mt-auto">
                  {scanButtonText}
                </Button>
             </div>
          ) : (
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow overflow-y-auto pr-2 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                    {/* FIX: Use correct report and loading state variables. */}
                    {isGeneratingThreatVector && !threatVectorReport ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <LoadingSpinner size="w-10 h-10" />
                            <p className="mt-4 text-sm uppercase tracking-wider animate-cyan-pulse">{currentAnalysisMessage}</p>
                        </div>
                    ) : (
                        // FIX: Use correct report state variable.
                        <MarkdownRenderer markdown={threatVectorReport || ''} />
                    )}
                </div>
                {/* FIX: Use correct report and loading state variables. */}
                {!isGeneratingThreatVector && threatVectorReport && (
                    <div className="flex-shrink-0 mt-4 flex flex-col space-y-3 animate-fade-in">
                         <div>
                            <p className="text-xs text-center text-[var(--hud-color-darker)] uppercase tracking-wider mb-2">Actionable Intelligence Panel</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {/* FIX: Use renamed prop. */}
                                <Button onClick={() => onLaunchRecon(actionableTargets.recon[0] || targetUrl)} variant="secondary" className="post-review-button" disabled={actionableTargets.recon.length === 0 && !targetUrl} title={actionableTargets.recon[0] || 'No specific recon target identified'}>
                                    <TargetIcon className="w-4 h-4 mr-2" /> Launch Live Telemetry
                                </Button>
                                {/* FIX: Use renamed prop. */}
                                <Button onClick={() => onStageExploit(actionableTargets.endpoints[0])} variant="secondary" className="post-review-button" disabled={actionableTargets.endpoints.length === 0} title={actionableTargets.endpoints[0] || 'No exploit endpoint identified'}>
                                    <SkullIcon className="w-4 h-4 mr-2" /> Stage Delivery
                                </Button>
                                {/* FIX: Use correct report state variable. */}
                                <Button onClick={() => onDraftReport(threatVectorReport)} variant="secondary" className="post-review-button">
                                    <ReportIcon className="w-4 h-4 mr-2" /> Draft Engagement Report
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-center gap-3 pt-3 border-t border-[var(--hud-color-darkest)]">
                             <Button onClick={handleGenerateRelated} variant="primary" className="text-xs">
                                <BoltIcon className="w-4 h-4 mr-2" /> Generate Related Analysis
                            </Button>
                            <Button onClick={handleExport} variant="primary" className="text-xs">
                                <ImportIcon className="w-4 h-4 mr-2" /> Export Report
                            </Button>
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};