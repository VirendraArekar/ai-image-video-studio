import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { imagesApi } from '../api/images.api';
import { promptsApi } from '../api/prompts.api';
import { updateBalance } from '../store/slices/authSlice';
import { addToast, openMediaViewer } from '../store/slices/uiSlice';
import { setLastGenerated } from '../store/slices/generationSlice';
import { ModelMetadata, GeneratedMedia } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Upload,
  Download,
  Heart,
  Maximize2,
  Trash2,
  Layers,
  Settings2,
  Zap,
  Info,
  RefreshCw,
  Palette,
  Check,
  BookmarkPlus,
} from 'lucide-react';

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', dims: 'w-4.5 h-4.5' },
  { id: '4:5', label: '4:5 Social', dims: 'w-4 h-5' },
  { id: '3:2', label: '3:2 Classic', dims: 'w-5 h-3.5' },
  { id: '16:9', label: '16:9 Cinema', dims: 'w-6 h-3.5' },
  { id: '9:16', label: '9:16 Story', dims: 'w-3.5 h-6' },
];

export const ImageGeneratorPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const globalPrompt = useSelector((state: RootState) => state.generation.currentPrompt);

  const [prompt, setPrompt] = useState(globalPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen-2.5-image-turbo');
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '4:5' | '3:2' | '16:9' | '9:16'>('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceMime, setReferenceMime] = useState<string>('image/png');

  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedia, setGeneratedMediaState] = useState<GeneratedMedia | null>(null);

  useEffect(() => {
    imagesApi.getModels().then(setModels).catch(() => {});
  }, []);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Enter a basic prompt idea first to enhance it.' }));
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await imagesApi.enhancePrompt({
        prompt,
        targetType: 'IMAGE',
      });
      setPrompt(res.enhancedPrompt);
      if (res.negativePrompt && !negativePrompt) {
        setNegativePrompt(res.negativePrompt);
      }
      dispatch(addToast({ type: 'success', message: 'Prompt enhanced with Qwen 2.5!' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Could not enhance prompt right now.' }));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveCustomPrompt = async () => {
    if (!prompt.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Enter a prompt first before saving as custom template.' }));
      return;
    }
    const cleanPrompt = prompt.trim();
    const title = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 37) + '...' : cleanPrompt;
    try {
      await promptsApi.createPrompt({
        title,
        category: 'Realistic portraits',
        prompt: cleanPrompt,
        negativePrompt: negativePrompt.trim() || undefined,
      });
      dispatch(addToast({ type: 'success', message: 'Custom prompt saved to library!' }));
    } catch (_) {
      try {
        const local = JSON.parse(localStorage.getItem('custom_user_prompts') || '[]');
        local.unshift({
          id: 'custom-' + Date.now(),
          title,
          category: 'Realistic portraits',
          prompt: cleanPrompt,
          negativePrompt: negativePrompt.trim() || undefined,
          usageCount: 0,
          isSystemDefault: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('custom_user_prompts', JSON.stringify(local));
      } catch {}
      dispatch(addToast({ type: 'success', message: 'Custom prompt saved to library!' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        dispatch(addToast({ type: 'error', message: 'Image file too large. Max 10MB.' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip data:image/...;base64,
        const base64Content = result.split(',')[1];
        setReferenceImage(base64Content);
        setReferenceMime(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please provide a visual description or prompt.' }));
      return;
    }

    const currentBalance = user?.wallet?.balance ?? 50;
    const requiredCredits = selectedModel.includes('pro') ? 2 : 1;
    if (currentBalance < requiredCredits) {
      dispatch(addToast({ type: 'error', message: 'Insufficient credits. Please upgrade or add credits.' }));
      navigate('/credits');
      return;
    }

    setIsGenerating(true);
    const dynamicSeed = Math.floor(Math.random() * 10000000);
    try {
      const res = await imagesApi.generate({
        prompt,
        negativePrompt: negativePrompt || undefined,
        modelId: selectedModel,
        aspectRatio: selectedRatio,
        referenceImageBase64: referenceImage || undefined,
        referenceImageMime: referenceImage ? referenceMime : undefined,
        editAction: referenceImage ? 'EDIT' : undefined,
        seed: dynamicSeed,
      });

      setGeneratedMediaState(res.media);
      dispatch(setLastGenerated(res.media));
      dispatch(updateBalance(res.remainingCredits));
      dispatch(addToast({ type: 'success', message: 'Image generated successfully!' }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Generation failed';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatedCost = selectedModel.includes('pro') ? 2 : 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span>AI Image Generator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Produce photorealistic imagery, creative concept art, and conversational edits powered by Qwen 2.5 & WanX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Cost: <strong className="text-white">{estimatedCost} Credit</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Prompt Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Prompt</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveCustomPrompt}
                  disabled={!prompt.trim()}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all disabled:opacity-50 shrink-0"
                  title="Save prompt to your Prompt Library as custom template"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Save Custom</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 text-purple-300 border border-purple-500/30 transition-all disabled:opacity-50 shrink-0"
                >
                  <Wand2 className={`w-3.5 h-3.5 shrink-0 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? 'Enhancing...' : 'Enhance with Qwen 2.5'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision in full detail (e.g. A gorgeous woman in an evening dress walking on a sunset beach, cinematic lighting, ultra-realistic photography, 8k resolution...)"
              rows={5}
              className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 text-slate-100 text-sm placeholder-slate-500 outline-none transition-all resize-none"
            />

            {/* Negative prompt */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Negative Prompt (Optional)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude (e.g. blurry, low quality, distorted anatomy, text, watermark)"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-purple-500/80 text-slate-200 text-xs placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Model & Aspect Ratio Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full h-12 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:border-purple-500 outline-none"
              >
                <option value="qwen-2.5-image-turbo">Qwen 2.5 Image Turbo (WanX 2.1 • Fast, High Quality)</option>
                <option value="qwen-2.5-max-image">Qwen 2.5 Max Image Ultra (Flagship • Ultra Fidelity)</option>
                <option value="wanx-2.1-t2i-plus">Alibaba WanX 2.1 Plus (Photorealistic Synthesis)</option>
                <option value="qwen-2.5-vl-ultra">Qwen 2.5 VL Ultra (Vision & Multimodal Concepting)</option>
              </select>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio.id as any)}
                    className={`h-12 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 text-[11px] font-semibold border transition-all ${
                      selectedRatio === ratio.id
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`border border-current rounded-sm ${ratio.dims}`} />
                    <span>{ratio.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reference Image (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Reference Image (Optional)</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Leave empty for standard text-to-image, or upload an image to combine with your prompt.
              </p>
            </div>

            {referenceImage ? (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={`data:${referenceMime};base64,${referenceImage}`}
                    alt="Reference uploaded"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-700 shadow-md shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">Reference Photo Attached</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Will be synthesized and combined with your custom prompt.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer">
                    Change
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setReferenceImage(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-700 hover:border-purple-500/70 bg-slate-950/50 cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-slate-500 mb-1" />
                <span className="text-xs font-medium text-slate-300">Click to upload reference image (Optional)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white font-bold text-base shadow-xl shadow-purple-900/40 hover:scale-[1.01] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2.5"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                <span>Synthesizing with Qwen 2.5...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>Generate Image ({estimatedCost} Credit)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Viewport (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 flex flex-col min-h-[380px] lg:h-[640px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Output Viewport
              </span>
              {generatedMedia && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch(openMediaViewer(generatedMedia.id))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Fullscreen Preview"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <a
                    href={generatedMedia.publicUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Main Canvas */}
            <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
              {isGenerating ? (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                  <div className="text-sm font-semibold text-white">Rendering with Qwen 2.5 AI</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Model is synthesizing high-frequency details, lighting interactions, and textures...
                  </p>
                </div>
              ) : generatedMedia ? (
                <img
                  src={generatedMedia.publicUrl}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-700" />
                  <div className="text-xs font-semibold text-slate-400">Ready for creation</div>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Configure your prompt and click Generate to see the masterpiece render here.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions if media exists */}
            {generatedMedia && (
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => navigate(`/studio?mediaId=${generatedMedia.id}`)}
                  className="w-full sm:flex-1 min-h-[42px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Edit in Creative Studio</span>
                </button>
                <button
                  onClick={() => {
                    setReferenceImage(generatedMedia.publicUrl);
                    dispatch(addToast({ type: 'info', message: 'Set as reference photo' }));
                  }}
                  className="w-full sm:w-auto min-h-[42px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors inline-flex items-center justify-center"
                >
                  Use as Reference
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
