import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { studioApi } from '../api/studio.api';
import { galleryApi } from '../api/gallery.api';
import { GeneratedMedia } from '../types';
import { useDispatch } from 'react-redux';
import { addToast, openMediaViewer } from '../store/slices/uiSlice';
import { updateBalance } from '../store/slices/authSlice';
import {
  Palette,
  Sparkles,
  Download,
  Heart,
  RotateCcw,
  Sliders,
  Copy,
  Layers,
  Check,
  Maximize2,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export const CreativeStudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mediaIdParam = searchParams.get('mediaId');

  const [currentAsset, setCurrentAsset] = useState<GeneratedMedia | null>(null);
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [loading, setLoading] = useState(false);

  // Studio Variation Controls
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mediaIdParam) {
      loadAsset(mediaIdParam);
    } else {
      // Load most recent creation
      galleryApi.getMyGallery({ limit: 1 }).then((res) => {
        if (res.items && res.items.length > 0) {
          loadAsset(res.items[0].id);
        }
      });
    }
  }, [mediaIdParam]);

  const loadAsset = (id: string) => {
    setLoading(true);
    studioApi
      .getAsset(id)
      .then((res) => {
        setCurrentAsset(res.asset);
        setHistory(res.history);
        setRevisedPrompt(res.asset.job?.prompt || '');
      })
      .catch(() => {
        dispatch(addToast({ type: 'error', message: 'Could not load asset into Creative Studio' }));
      })
      .finally(() => setLoading(false));
  };

  const handleCreateVariation = async () => {
    if (!currentAsset) return;
    setIsGeneratingVariation(true);
    try {
      const res = await studioApi.createVariation({
        mediaId: currentAsset.id,
        revisedPrompt,
      });

      dispatch(updateBalance(res.remainingCredits));
      dispatch(addToast({ type: 'success', message: 'New variation created!' }));
      // Reload asset with variation as current
      loadAsset(res.media.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Variation failed';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsGeneratingVariation(false);
    }
  };

  const handleCopyPrompt = () => {
    if (revisedPrompt) {
      navigator.clipboard.writeText(revisedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      dispatch(addToast({ type: 'info', message: 'Prompt copied' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-purple-400" />
            <span>Creative Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Unified workspace to remix, iterate, revise prompts, create variations, and compare versions.
          </p>
        </div>

        {currentAsset && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(openMediaViewer(currentAsset.id))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Full Preview"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <a
              href={currentAsset.publicUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Canvas / Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="min-h-[320px] sm:h-[460px] lg:h-[520px] rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center relative p-4 shadow-2xl">
            {loading ? (
              <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
            ) : currentAsset?.mediaType === 'VIDEO' ? (
              <video
                src={currentAsset.publicUrl}
                controls
                autoPlay
                loop
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : currentAsset ? (
              <img
                src={currentAsset.publicUrl}
                alt={currentAsset.job?.prompt}
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Palette className="w-12 h-12 mx-auto text-slate-700 mb-2" />
                <div className="text-sm font-semibold text-slate-400">Select an asset to begin remixing</div>
              </div>
            )}
          </div>

          {/* Asset Version Lineage History */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Session Lineage & Variations</span>
              </span>
              <span className="text-[11px] text-slate-500 normal-case">{history.length} variations</span>
            </div>

            {history.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Create variations to build your creative branch history.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => loadAsset(h.id)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-700 hover:border-purple-500 transition-all hover:scale-105"
                  >
                    <img src={h.publicUrl} alt="History thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Editing & Variation Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Revise & Remix
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Revised Prompt
              </label>
              <textarea
                value={revisedPrompt}
                onChange={(e) => setRevisedPrompt(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 outline-none resize-none"
              />
            </div>

            {/* Parameter Inspector */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block">
                Metadata Inspector
              </span>
              <div className="flex justify-between text-slate-400">
                <span>Model:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {currentAsset?.job?.modelId || 'qwen-2.5-image-turbo'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aspect:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {currentAsset?.job?.parameters?.aspectRatio || '1:1'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Views:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {currentAsset?.viewsCount || 0}
                </span>
              </div>
            </div>

            {/* Submit Variation */}
            <button
              onClick={handleCreateVariation}
              disabled={isGeneratingVariation || !currentAsset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {isGeneratingVariation ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Variation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Variation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
