import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { closeMediaViewer, addToast } from '../../store/slices/uiSlice';
import { galleryApi } from '../../api/gallery.api';
import { GeneratedMedia } from '../../types';
import {
  X,
  Download,
  Heart,
  Share2,
  Sparkles,
  Layers,
  Calendar,
  Maximize2,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MediaViewerModal: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeMediaId = useSelector((state: RootState) => state.ui.activeViewerMediaId);
  const [media, setMedia] = useState<GeneratedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    if (activeMediaId) {
      setLoading(true);
      galleryApi
        .getById(activeMediaId)
        .then((res) => {
          setMedia(res);
          setIsFav(res.isFavourite);
        })
        .catch((err) => {
          dispatch(addToast({ type: 'error', message: 'Failed to load media details' }));
        })
        .finally(() => setLoading(false));
    } else {
      setMedia(null);
    }
  }, [activeMediaId]);

  if (!activeMediaId) return null;

  const handleToggleFav = async () => {
    if (!media) return;
    try {
      const res = await galleryApi.toggleFavourite(media.id);
      setIsFav(res.isFavourite);
      dispatch(
        addToast({
          type: 'success',
          message: res.isFavourite ? 'Added to Favourites' : 'Removed from Favourites',
        }),
      );
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!media) return;
    if (!window.confirm('Are you sure you want to delete this creation?')) return;
    try {
      await galleryApi.delete(media.id);
      dispatch(closeMediaViewer());
      dispatch(addToast({ type: 'success', message: 'Media deleted successfully' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete media' }));
    }
  };

  const handleCopyPrompt = () => {
    if (media?.job?.prompt) {
      navigator.clipboard.writeText(media.job.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
      dispatch(addToast({ type: 'info', message: 'Prompt copied to clipboard' }));
    }
  };

  const handleOpenInStudio = () => {
    if (!media) return;
    dispatch(closeMediaViewer());
    navigate(`/studio?mediaId=${media.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => dispatch(closeMediaViewer())}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Preview Column */}
        <div className="flex-1 min-h-[260px] max-h-[48vh] lg:max-h-none bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative">
          {loading ? (
            <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
          ) : media?.mediaType === 'VIDEO' ? (
            <video
              src={media.publicUrl}
              controls
              autoPlay
              loop
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          ) : (
            <img
              src={media?.publicUrl}
              alt={media?.job?.prompt || 'Generated creation'}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}
        </div>

        {/* Metadata & Controls Sidebar */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {media?.mediaType} • {media?.job?.modelId}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  title="Delete Creation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleFav}
                  className={`p-2 rounded-lg border transition-all ${
                    isFav
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Favourite"
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
                <a
                  href={media?.publicUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => media && galleryApi.recordDownload(media.id)}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Prompt details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider">
                <span>Prompt</span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 normal-case"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 select-all">
                {media?.job?.prompt || 'No prompt specified'}
              </p>
            </div>

            {/* Generation Parameters */}
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Parameters</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80">
                  <div className="text-slate-500">Aspect Ratio</div>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {media?.job?.parameters?.aspectRatio || '1:1'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80">
                  <div className="text-slate-500">Resolution</div>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {media?.width && media?.height ? `${media.width}x${media.height}` : 'Native 1080p'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80">
                  <div className="text-slate-500">Duration</div>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {media?.durationSeconds ? `${media.durationSeconds}s` : 'Static Image'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80">
                  <div className="text-slate-500">Credits Used</div>
                  <div className="font-medium text-purple-400 mt-0.5">
                    {media?.job?.creditCost || 1} Credits
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps & Creator */}
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {media?.createdAt ? new Date(media.createdAt).toLocaleDateString() : 'Recent'}
              </span>
              <span>{media?.downloadsCount || 0} downloads</span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-6">
            <button
              onClick={handleOpenInStudio}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold text-white shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Remix in Creative Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
