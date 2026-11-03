'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  ArrowRight,
  Receipt,
  ShoppingCart,
  Landmark,
  Upload,
} from 'lucide-react';
import { useLedger } from '@/lib/store/ledger-context';
import { processAICommand, approveWorkflowAction, rejectWorkflowAction, getPendingWorkflowAction } from '@/lib/actions/ai-actions';

interface AICommandCenterProps {
  embedded?: boolean;
  initialQuery?: string;
}

const PRESETS = [
  { label: 'Who owes me money?',                    query: 'Who owes me money and why?',                                                           tag: 'Receivables' },
  { label: 'Sold 5 Laptops to Acme Corp',            query: 'Sold 5 Apple MacBooks to Acme Corp for 4,50,000 with 18% GST',                          tag: 'Sales Invoice' },
  { label: 'Why did profit margin change?',          query: 'Why did gross margin decline this month?',                                              tag: 'Profit Analysis' },
  { label: 'Reconcile bank transactions',            query: "Reconcile yesterday's bank transactions and explain all exceptions",                   tag: 'Bank Feed' },
  { label: 'Paid office rent ₹45,000',               query: 'Paid office rent ₹45,000 from HDFC bank',                                              tag: 'Payment' },
];

export const AICommandCenter: React.FC<AICommandCenterProps> = ({
  embedded = false,
  initialQuery = '',
}) => {
  const { refreshData } = useLedger();

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (embedded) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
    if (initialQuery) setInputQuery(initialQuery);

    getPendingWorkflowAction()
      .then((pending) => {
        if (pending && !result) {
          setResult(pending);
        }
      })
      .catch(() => {});
  }, [embedded, initialQuery]);

  const handleExecute = async (commandToRun?: string) => {
    const cmd = commandToRun ?? inputQuery;
    if (!cmd.trim()) return;

    setIsProcessing(true);
    setResult(null);
    if (!commandToRun) setInputQuery(cmd);

    try {
      const execResult = await processAICommand(cmd, documentText);
      setResult(execResult);
    } catch (err: any) {
      console.error(err);
      setResult({
        run: {
          id: 'err-' + Date.now(),
          agentType: 'Assistant',
          model: 'LedgerAI Engine',
          latencyMs: 0,
          tokenUsage: { prompt: 0, completion: 0, totalCostUsd: 0 },
          findings: [`Execution failed: ${err?.message || 'Server error'}`],
          timestamp: new Date().toISOString(),
          status: 'FAILED',
          error: err?.message,
        },
        speechSummary: `Execution failed: ${err?.message || 'Server error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostProposed = async (action: any) => {
    if (!result?.run?.id) return;
    try {
      setIsProcessing(true);
      const postRes = await approveWorkflowAction(result.run.id, action);
      alert('Successfully recorded: ' + postRes.message);
      setResult(null);
      await refreshData();
    } catch (err: any) {
      alert('Error approving action: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProposed = async () => {
    if (!result?.run?.id) return;
    try {
      setIsProcessing(true);
      await rejectWorkflowAction(result.run.id, 'Dismissed by user');
      setResult(null);
    } catch (err: any) {
      alert('Error dismissing: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setDocumentText(text || '');
      setInputQuery(`Parse vendor invoice: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const commandBox = (
    <div className="space-y-3">
      {/* Input Field */}
      <div className="saas-card p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            placeholder="Type any financial instruction or ask a question..."
            className="flex-1 px-4 py-2.5 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="relative overflow-hidden inline-block shrink-0 mx-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
              <Upload className="h-3.5 w-3.5" /> {fileName ? 'Document Added' : 'Attach File'}
            </button>
            <input type="file" className="absolute left-0 top-0 opacity-0 cursor-pointer h-full" onChange={handleFileUpload} />
          </div>
          <button
            onClick={() => handleExecute()}
            disabled={isProcessing || !inputQuery.trim()}
            className="m-1 btn-primary text-xs py-2 px-4 disabled:opacity-50 shrink-0"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <span>Ask AI</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputQuery(p.query);
              handleExecute(p.query);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 transition shadow-2xs group"
          >
            <span>{p.label}</span>
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 text-[10px] rounded-md font-medium group-hover:bg-blue-50 group-hover:text-blue-600">
              {p.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${embedded ? 'p-2 overflow-y-auto' : 'p-6 max-w-5xl mx-auto'}`}>
      {commandBox}

      {/* Result Display */}
      {result && (
        <div className="space-y-4 pb-6 mt-4">
          {/* Executive Summary Banner */}
          <div className="saas-card p-5 flex items-start gap-4">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Ledger AI Assistant</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {result.run?.timestamp ? new Date(result.run.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.speechSummary}
              </p>
            </div>
          </div>

          {/* Proposed Executable Action (Approval Card) */}
          {result.proposedAction && !result.proposedAction.executed && (
            <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Proposed Transaction Ready for Approval
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Double-Entry Verified
                </span>
              </div>

              <p className="text-xs text-slate-700">{result.proposedAction.description}</p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handlePostProposed(result.proposedAction!)}
                  className="btn-primary text-xs py-2 px-4"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve & Post to Ledger</span>
                </button>
                <button
                  onClick={handleRejectProposed}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Reject & Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Interactive UI Widgets */}
          {result.uiWidgets && (
            <div className="grid grid-cols-1 gap-3">
              {result.uiWidgets.map((widget: any, i: number) => (
                <div key={i} className="saas-card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>{widget.title}</span>
                  </h4>

                  {/* Widget Type 1: Metric Card */}
                  {widget.type === 'METRIC_CARD' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(widget.data).map(([key, val]: [string, any]) => (
                        <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">{String(val)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Widget Type 2: Proposed Transaction Details */}
                  {widget.type === 'PROPOSED_TRANSACTION' && (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        {Object.entries(widget.data).map(([k, v]: [string, any]) => (
                          <div key={k} className="flex justify-between py-1 border-b border-slate-200/60 last:border-0">
                            <span className="text-slate-500 capitalize">{k}:</span>
                            <span className="font-semibold text-slate-900">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Widget Type 3: Collection List */}
                  {widget.type === 'COLLECTION_LIST' && Array.isArray(widget.data) && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                            <th className="pb-2 font-semibold">Customer</th>
                            <th className="pb-2 text-right font-semibold">Outstanding</th>
                            <th className="pb-2 text-center font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {widget.data.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 font-semibold text-slate-900">{row.customer}</td>
                              <td className="py-2.5 font-bold text-slate-900 text-right">{row.amount}</td>
                              <td className="py-2.5 text-center text-emerald-600 font-medium">{row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
