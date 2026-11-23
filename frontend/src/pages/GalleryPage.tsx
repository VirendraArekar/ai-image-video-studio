import React, { useState, useEffect } from 'react';
import { galleryApi } from '../api/gallery.api';
import { GeneratedMedia } from '../types';
import { useDispatch } from 'react-redux';
import { openMediaViewer, addToast } from '../store/slices/uiSlice';
import {
  Images,
  Video,
  Heart,
  Search,
  Grid3X3,
  List,
  Download,
  Trash2,
  Filter,
  Sparkles,
  X,
} from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const dispatch = useDispatch();

  const [items, setItems] = useState<GeneratedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'downloads'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Live debounced search effect (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchGallery = () => {
    setLoading(true);
    galleryApi
      .getGallery({
        mediaType,
        isFavourite: onlyFavourites ? true : undefined,
        search: debouncedSearch.trim() || undefined,
        sortBy,
        page,
        limit: 16,
      })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(() => {
        dispatch(addToast({ type: 'error', message: 'Failed to fetch gallery creations' }));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGallery();
  }, [mediaType, onlyFavourites, sortBy, page, debouncedSearch]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleToggleFavourite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await galleryApi.toggleFavourite(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isFavourite: res.isFavourite } : item)),
      );
      dispatch(
        addToast({
          type: 'success',
          message: res.isFavourite ? 'Added to Favourites' : 'Removed from Favourites',
        }),
      );
    } catch (_) {}
  };

  const handleDeleteMedia = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this creation?')) return;
    try {
      await galleryApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      dispatch(addToast({ type: 'success', message: 'Media creation deleted successfully' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Could not delete media creation' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Images className="w-6 h-6 text-purple-400" />
            <span>Generation Gallery</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, inspect, filter, and download all generated visual creations across your studio.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'ALL', label: 'All Media', icon: Sparkles },
            { id: 'IMAGE', label: 'Images', icon: Images },
            { id: 'VIDEO', label: 'Videos', icon: Video },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMediaType(tab.id as any);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mediaType === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            onClick={() => {
              setOnlyFavourites(!onlyFavourites);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              onlyFavourites
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavourites ? 'fill-current' : ''}`} />
            <span>Favourites</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images & videos by prompt..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 text-xs text-slate-100 placeholder-slate-400 focus:border-purple-500 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 rounded-xl bg-slate-950 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 text-xs text-slate-300 outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="views">Most Viewed</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>
      </div>

      {/* Active Search Indicator */}
      {debouncedSearch && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Filtering gallery by: <strong className="text-white">"{debouncedSearch}"</strong></span>
          </div>
          <button
            onClick={handleClearSearch}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-200 text-xs font-medium"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear search filter</span>
          </button>
        </div>
      )}

      {/* Gallery Grid or List */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed">
          <Images className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-white">No creations found</h4>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or create new images and videos.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => dispatch(openMediaViewer(item.id))}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-purple-500/50 transition-all shadow-md"
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

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                  {item.mediaType}
                </span>
              </div>

              {/* Actions (Delete & Favourite) */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={(e) => handleDeleteMedia(e, item.id)}
                  className="p-2 rounded-full bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-black/80 transition-all backdrop-blur-md"
                  title="Delete Creation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleToggleFavourite(e, item.id)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${
                    item.isFavourite
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-400'
                  }`}
                  title={item.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                >
                  <Heart className={`w-3.5 h-3.5 ${item.isFavourite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Hover Footer */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                <p className="text-xs text-white line-clamp-2 font-medium">
                  {item.job?.prompt || 'Artwork'}
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-purple-300">
                  <span>{item.job?.modelId}</span>
                  <span>Inspect details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => dispatch(openMediaViewer(item.id))}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 cursor-pointer flex items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800">
                  <img src={item.publicUrl} alt="Thumbnail" className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {item.mediaType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{item.job?.modelId}</span>
                  </div>
                  <p className="text-xs text-white line-clamp-1 max-w-lg font-medium">
                    {item.job?.prompt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDeleteMedia(e, item.id)}
                  className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  title="Delete Creation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleToggleFavourite(e, item.id)}
                  className={`p-2 rounded-lg border transition-colors ${
                    item.isFavourite
                      ? 'border-rose-500 text-rose-400'
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={item.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                >
                  <Heart className={`w-4 h-4 ${item.isFavourite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
