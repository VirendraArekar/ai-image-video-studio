import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { creditsApi, UserCreditsResponse } from '../api/credits.api';
import { galleryApi } from '../api/gallery.api';
import { openMediaViewer } from '../store/slices/uiSlice';
import { GeneratedMedia } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Video,
  Zap,
  Images,
  TrendingUp,
  Crown,
  Heart,
  ArrowRight,
  PlusCircle,
  Palette,
  Play,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [creditsData, setCreditsData] = useState<UserCreditsResponse | null>(null);
  const [recentCreations, setRecentCreations] = useState<GeneratedMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      creditsApi.getUserCredits().catch(() => null),
      galleryApi.getMyGallery({ limit: 8, sortBy: 'newest' }).catch(() => ({ items: [] })),
    ]).then(([creditsRes, galleryRes]) => {
      if (creditsRes) setCreditsData(creditsRes);
      if (galleryRes) setRecentCreations(galleryRes.items);
      setLoading(false);
    });
  }, []);

  const totalImages = creditsData?.stats?.totalImages ?? 0;
  const totalVideos = creditsData?.stats?.totalVideos ?? 0;
  const remainingCredits = user?.wallet?.balance ?? creditsData?.balance ?? 50;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-950 to-slate-900 border border-purple-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-64 h-64 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Next-Gen Visual AI Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">AI Image & Video Studio</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Synthesize cinematic imagery and responsive video with Alibaba Qwen 2.5 & Wan 2.1. Expressive, photorealistic, and unrestricted visual creation.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => navigate('/generate/image')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/40 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Image</span>
            </button>
            <button
              onClick={() => navigate('/generate/video')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-sm border border-slate-700/80 hover:scale-[1.02] transition-all"
            >
              <Video className="w-4 h-4 text-purple-400" />
              <span>New Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Credits</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{remainingCredits}</span>
            <span className="text-xs text-slate-400">credits</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 font-medium">
            <button onClick={() => navigate('/credits')} className="hover:underline flex items-center gap-1">
              Refill credits <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Images Generated</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Images className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalImages}</span>
            <span className="text-xs text-slate-400">creations</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Powered by Qwen 2.5 Image Turbo
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Videos Generated</span>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalVideos}</span>
            <span className="text-xs text-slate-400">clips</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Up to 4K resolution • 15s clips
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscription Tier</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {user?.subscription?.planTier || creditsData?.subscription?.planTier || 'FREE'}
            </span>
          </div>
          <div className="mt-3 text-xs text-emerald-400 font-medium">
            Active Status • Auto-renews
          </div>
        </div>
      </div>

      {/* Quick Action Portals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/generate/image')}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all group hover:scale-[1.01]"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
            <span>AI Image Generator</span>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate photorealistic and conceptual visuals, conversational edits, background replacements, and style presets.
          </p>
        </div>

        <div
          onClick={() => navigate('/generate/video')}
          className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 cursor-pointer transition-all group hover:scale-[1.01]"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
            <span>AI Video Generator</span>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Text-to-video, image-to-video, keyframe transitions, and camera movement with Qwen Wan 2.1.
          </p>
        </div>

        <div
          onClick={() => navigate('/studio')}
          className="p-6 rounded-2xl bg-gradient-to-br from-pink-950/40 to-slate-900 border border-pink-500/20 hover:border-pink-500/50 cursor-pointer transition-all group hover:scale-[1.01]"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:bg-pink-600 group-hover:text-white transition-all">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
            <span>Creative Studio</span>
            <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unified workspace to compare variations, revise prompts, regenerate, and inspect technical metadata.
          </p>
        </div>
      </div>

      {/* Recent Generations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Creations</h2>
            <p className="text-xs text-slate-400">Your latest generated images and videos</p>
          </div>
          <button
            onClick={() => navigate('/gallery')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>View All Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : recentCreations.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No creations yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Ready to create your first masterpiece? Start with an image prompt or explore the prompt library.
            </p>
            <button
              onClick={() => navigate('/generate/image')}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow"
            >
              Start Generating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recentCreations.map((item) => (
              <div
                key={item.id}
                onClick={() => dispatch(openMediaViewer(item.id))}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer hover:border-purple-500/50 transition-all shadow-md"
              >
                {item.mediaType === 'VIDEO' ? (
                  <video src={item.publicUrl} className="w-full h-full object-cover object-top" muted />
                ) : (
                  <img
                    src={item.publicUrl}
                    alt={item.job?.prompt || 'Creation'}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}

                {/* Overlay Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                  {item.mediaType}
                </div>

                {/* Hover Details Panel */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-xs text-white line-clamp-2 font-medium">
                    {item.job?.prompt || 'Artwork'}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-purple-300">
                    <span>{item.job?.modelId}</span>
                    <span>View details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
