import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { videosApi } from '../api/videos.api';
import { imagesApi } from '../api/images.api';
import { galleryApi } from '../api/gallery.api';
import { promptsApi } from '../api/prompts.api';
import { updateBalance } from '../store/slices/authSlice';
import { addToast, openMediaViewer } from '../store/slices/uiSlice';
import { addVideoJob, updateVideoJob } from '../store/slices/generationSlice';
import { ModelMetadata, GeneratedMedia } from '../types';
import {
  Video,
  Wand2,
  Sparkles,
  Upload,
  Download,
  Play,
  RotateCcw,
  Zap,
  Clock,
  Tv,
  Music,
  Trash2,
  RefreshCw,
  Film,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookmarkPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VideoGeneratorPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const activeJobs = useSelector((state: RootState) => state.generation.activeVideoJobs);

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen-wan2.1-video-turbo');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<number>(10);
  const [resolution, setResolution] = useState<'360p' | '720p' | '1080p' | '4k'>('720p');
  const [includeAudio, setIncludeAudio] = useState(true);

  // Multimodal Frames
  const [mode, setMode] = useState<'text' | 'image-to-video' | 'keyframes'>('text');
  const [firstFrame, setFirstFrame] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);

  const [estimatedCost, setEstimatedCost] = useState<number>(10);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track latest completed video
  const [latestVideo, setLatestVideo] = useState<GeneratedMedia | null>(null);

  // Load latest completed video on page load if none active
  useEffect(() => {
    galleryApi
      .getMyGallery({ mediaType: 'VIDEO', limit: 1 })
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setLatestVideo(res.items[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic cost calculation
  useEffect(() => {
    videosApi
      .estimateCost({ modelId: selectedModel, duration, resolution })
      .then((res) => setEstimatedCost(res.estimatedCredits))
      .catch(() => setEstimatedCost(10));
  }, [selectedModel, duration, resolution]);

  // Active polling for any running video jobs
  useEffect(() => {
    const pendingJobs = activeJobs.filter(
      (j) => j.status === 'PENDING' || j.status === 'PROCESSING',
    );
    if (pendingJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of pendingJobs) {
        try {
          const res = await videosApi.getJobStatus(job.jobId);
          dispatch(
            updateVideoJob({
              jobId: job.jobId,
              status: res.status,
              progress: res.progress,
              media: res.media,
            }),
          );

          if (res.status === 'COMPLETED' && res.media) {
            setLatestVideo(res.media);
            dispatch(
              addToast({
                type: 'success',
                title: 'Video Complete!',
                message: `"${job.prompt.slice(0, 40)}..." is ready to view.`,
              }),
            );
          } else if (res.status === 'FAILED') {
            dispatch(
              addToast({
                type: 'error',
                title: 'Video Failed',
                message: res.errorMessage || 'Generation failed',
              }),
            );
          }
        } catch (_) {}
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await imagesApi.enhancePrompt({ prompt, targetType: 'VIDEO' });
      setPrompt(res.enhancedPrompt);
      dispatch(addToast({ type: 'success', message: 'Video prompt enhanced with cinematic details!' }));
    } catch (_) {
      dispatch(addToast({ type: 'error', message: 'Could not enhance prompt' }));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveCustomPrompt = async () => {
    if (!prompt.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Enter a video prompt first before saving as custom template.' }));
      return;
    }
    const cleanPrompt = prompt.trim();
    const title = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 37) + '...' : cleanPrompt;
    try {
      await promptsApi.createPrompt({
        title,
        category: 'Video storytelling',
        prompt: cleanPrompt,
      });
      dispatch(addToast({ type: 'success', message: 'Custom video prompt saved to library!' }));
    } catch (_) {
      try {
        const local = JSON.parse(localStorage.getItem('custom_user_prompts') || '[]');
        local.unshift({
          id: 'custom-video-' + Date.now(),
          title,
          category: 'Video storytelling',
          prompt: cleanPrompt,
          usageCount: 0,
          isSystemDefault: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('custom_user_prompts', JSON.stringify(local));
      } catch {}
      dispatch(addToast({ type: 'success', message: 'Custom video prompt saved to library!' }));
    }
  };

  const handleFrameUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'first' | 'last',
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (type === 'first') setFirstFrame(base64);
        if (type === 'last') setLastFrame(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (isSubmitting) return;
    if (!prompt.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please describe the video scene or camera action.' }));
      return;
    }

    const currentBalance = user?.wallet?.balance ?? 50;
    if (currentBalance < estimatedCost) {
      dispatch(addToast({ type: 'error', message: 'Insufficient credits for this video duration/resolution.' }));
      navigate('/credits');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await videosApi.generate({
        prompt,
        modelId: selectedModel,
        aspectRatio,
        duration,
        resolution,
        includeAudio,
        firstFrameBase64: firstFrame || undefined,
        lastFrameBase64: lastFrame || undefined,
      });

      // Optimistically update wallet
      dispatch(updateBalance(currentBalance - estimatedCost));

      // Add to Redux active jobs queue
      dispatch(
        addVideoJob({
          jobId: res.jobId,
          prompt,
          status: 'PENDING',
          progress: 5,
          creditCost: res.creditCost,
          startedAt: new Date().toISOString(),
        }),
      );

      dispatch(addToast({ type: 'info', title: 'Video Queued', message: 'Generating with Qwen Wan 2.1 Video...' }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Video generation failed';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Video className="w-6 h-6 text-pink-400" />
            <span>AI Video Generator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Produce smooth cinematic video, first/last frame transitions, and multi-second narrative clips powered by Qwen Wan 2.1 & WanX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Estimated Cost: <strong className="text-white">{estimatedCost} Credits</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Generation Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('text');
                setFirstFrame(null);
                setLastFrame(null);
              }}
              className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center ${
                mode === 'text' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Text to Video
            </button>
            <button
              type="button"
              onClick={() => setMode('image-to-video')}
              className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center ${
                mode === 'image-to-video' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Image to Video
            </button>
            <button
              type="button"
              onClick={() => setMode('keyframes')}
              className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center ${
                mode === 'keyframes' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Start & End Keyframes
            </button>
          </div>

          {/* Prompt Input */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Video Motion & Action Prompt
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveCustomPrompt}
                  disabled={!prompt.trim()}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all disabled:opacity-50 shrink-0"
                  title="Save video prompt to your Prompt Library as custom template"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Save Custom</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-500/60 disabled:opacity-50 shrink-0"
                >
                  <Wand2 className={`w-3.5 h-3.5 shrink-0 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? 'Enhancing...' : 'Enhance Video Prompt'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the action, camera trajectory, lighting and environment (e.g. Dynamic drone fly-through over an ancient citadel surrounded by cascading waterfalls, golden hour anamorphic flare, smooth 60fps tracking motion...)"
              rows={5}
              className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-purple-500/80 text-slate-100 text-sm placeholder-slate-500 outline-none resize-none"
            />
          </div>

          {/* Multimodal Frame Uploads if mode is image-to-video or keyframes */}
          {mode !== 'text' && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  First Frame (Starting Image)
                </label>
                {firstFrame ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img
                      src={`data:image/png;base64,${firstFrame}`}
                      alt="First Frame"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setFirstFrame(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-rose-400 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/50 cursor-pointer">
                    <Upload className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">Upload Starting Frame</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFrameUpload(e, 'first')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {mode === 'keyframes' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Last Frame (Ending Image)
                  </label>
                  {lastFrame ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                      <img
                        src={`data:image/png;base64,${lastFrame}`}
                        alt="Last Frame"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setLastFrame(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-rose-400 hover:text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/50 cursor-pointer">
                      <Upload className="w-5 h-5 text-slate-500 mb-1" />
                      <span className="text-xs text-slate-300 font-medium">Upload Ending Frame</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFrameUpload(e, 'last')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video Parameters Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            {/* Model Selector */}
            <div className="space-y-1.5 pb-3 border-b border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Qwen Video Model Engine
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full h-11 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:border-purple-500 outline-none"
              >
                <option value="qwen-wan2.1-video-turbo">Qwen Wan 2.1 Video Turbo (Fast Cinematic)</option>
                <option value="qwen-wan2.1-video-plus">Qwen Wan 2.1 Video Plus (Ultra Physics & Motion)</option>
                <option value="qwen-omni-motion">Qwen Omni Motion 2.5 (Real-time Synthesis)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Duration Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Duration</span>
                  </span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                    {duration}s
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>3s</span>
                  <span>10s</span>
                  <span>15s</span>
                </div>
              </div>

              {/* Resolution */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-xs block flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Resolution</span>
                </span>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full h-11 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium outline-none focus:border-purple-500"
                >
                  <option value="360p">360p (Fastest)</option>
                  <option value="720p">720p HD (Balanced)</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-xs block">
                  Aspect Ratio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`h-11 px-2 rounded-xl text-xs font-semibold border inline-flex items-center justify-center transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`h-11 px-2 rounded-xl text-xs font-semibold border inline-flex items-center justify-center transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    9:16 Story
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Toggle */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-medium text-slate-300">
                  Generate Synchronized Spatial Audio
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeAudio}
                onChange={(e) => setIncludeAudio(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-pink-900/30 hover:scale-[1.01] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2.5"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                <span>Submitting Generation Task...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5 shrink-0" />
                <span>Queue Video Generation ({estimatedCost} Credits)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Preview & Active Tasks (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Video Player */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col min-h-[360px] sm:h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Video Player
              </span>
              {latestVideo && (
                <a
                  href={latestVideo.publicUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              )}
            </div>

            <div className="flex-1 bg-black/70 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center my-3 relative">
              {latestVideo ? (
                <video
                  src={latestVideo.publicUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 space-y-2">
                  <Film className="w-12 h-12 mx-auto text-slate-700" />
                  <div className="text-xs font-semibold text-slate-400">No active video</div>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Start a generation or select a completed task below to stream the video.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Generation Queue Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Active Generation Tasks
              </span>
              <span className="text-[10px] text-slate-500">Live Polling • BullMQ Engine</span>
            </div>

            {activeJobs.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">No pending video tasks</div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {activeJobs.slice(0, 4).map((job) => (
                  <div
                    key={job.jobId}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white truncate max-w-[200px]">
                        {job.prompt}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : job.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-purple-500/20 text-purple-400 animate-pulse'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : job.status === 'FAILED'
                            ? 'bg-rose-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>

                    {job.media && (
                      <button
                        onClick={() => setLatestVideo(job.media!)}
                        className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <span>Load in player</span>
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
