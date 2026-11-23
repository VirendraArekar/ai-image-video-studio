import React, { useState, useEffect } from 'react';
import { promptsApi } from '../api/prompts.api';
import { PromptTemplate } from '../types';
import { useDispatch } from 'react-redux';
import { setPromptData } from '../store/slices/generationSlice';
import { addToast } from '../store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Plus,
  Tag,
  Flame,
  X,
  BookmarkCheck,
} from 'lucide-react';

export const PromptLibraryPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New prompt modal
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Realistic portraits');
  const [newPromptText, setNewPromptText] = useState('');

  // Live debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    promptsApi.getCategories().then((cats) => {
      setCategories(['All', ...cats]);
    });
  }, []);

  const fetchPrompts = () => {
    setLoading(true);
    promptsApi
      .getPrompts({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: debouncedSearch.trim() || undefined,
      })
      .then((serverPrompts) => {
        // Merge with locally saved custom prompts if available
        try {
          const localCustom: PromptTemplate[] = JSON.parse(
            localStorage.getItem('custom_user_prompts') || '[]',
          );
          const filteredLocal = localCustom.filter((lp) => {
            const matchesCat =
              selectedCategory === 'All' || lp.category === selectedCategory;
            const matchesSearch =
              !debouncedSearch.trim() ||
              lp.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
              lp.prompt.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchesCat && matchesSearch;
          });
          setPrompts([...filteredLocal, ...serverPrompts]);
        } catch {
          setPrompts(serverPrompts);
        }
      })
      .catch(() => {
        try {
          const localCustom: PromptTemplate[] = JSON.parse(
            localStorage.getItem('custom_user_prompts') || '[]',
          );
          setPrompts(localCustom);
        } catch {
          setPrompts([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrompts();
  }, [selectedCategory, debouncedSearch]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    dispatch(addToast({ type: 'info', message: 'Prompt copied to clipboard' }));
  };

  const handleUsePrompt = (prompt: PromptTemplate) => {
    promptsApi.usePrompt(prompt.id).catch(() => {});
    dispatch(
      setPromptData({
        prompt: prompt.prompt,
        negativePrompt: prompt.negativePrompt,
      }),
    );
    dispatch(addToast({ type: 'success', message: 'Prompt loaded into Image Generator!' }));
    navigate('/generate/image');
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) return;

    const payload = {
      title: newTitle.trim(),
      category: newCategory,
      prompt: newPromptText.trim(),
    };

    try {
      await promptsApi.createPrompt(payload);
      setShowModal(false);
      setNewTitle('');
      setNewPromptText('');
      dispatch(addToast({ type: 'success', message: 'Custom prompt template saved to library!' }));
      fetchPrompts();
    } catch (_) {
      // Local fallback
      try {
        const localCustom = JSON.parse(localStorage.getItem('custom_user_prompts') || '[]');
        localCustom.unshift({
          id: 'custom-' + Date.now(),
          title: payload.title,
          category: payload.category,
          prompt: payload.prompt,
          usageCount: 0,
          isSystemDefault: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('custom_user_prompts', JSON.stringify(localCustom));
      } catch {}
      setShowModal(false);
      setNewTitle('');
      setNewPromptText('');
      dispatch(addToast({ type: 'success', message: 'Custom prompt template saved to library!' }));
      fetchPrompts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <span>Prompt Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Curated photographic, cinematic, and artistic prompts across 12 distinct categories ready for 1-click execution.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Save Custom Template</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPrompts()}
              placeholder="Search prompts by concept, keyword or lighting..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 text-xs text-slate-100 placeholder-slate-400 focus:border-purple-500 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={fetchPrompts}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-sm transition-all shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 border-purple-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/40 flex flex-col justify-between space-y-4 shadow-xl transition-all group hover:scale-[1.01]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {p.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{p.usageCount} uses</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 line-clamp-4 select-all">
                  {p.prompt}
                </p>

                {p.tags && Array.isArray(p.tags) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleCopy(p.id, p.prompt)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy Prompt"
                >
                  {copiedId === p.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleUsePrompt(p)}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use in Generator</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Custom Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-purple-400" />
                <span>Save Custom Prompt Template</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Template Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cinematic Obsidian Warrior"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Visual Prompt</label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  rows={4}
                  required
                  placeholder="Full descriptive visual prompt..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md transition-all"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Save Custom Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
