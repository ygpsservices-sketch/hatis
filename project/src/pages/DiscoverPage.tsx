import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Creator } from '@/types';
import CreatorCard from '@/components/CreatorCard';
import { CATEGORIES, LOCATIONS, LANGUAGES } from '@/lib/constants';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export default function DiscoverPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [methodTypesMap, setMethodTypesMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('category') || '';

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('creators').select('*');

    if (category) query = query.eq('category', category);
    if (location) query = query.ilike('location', `%${location}%`);
    if (language) query = query.eq('language', language);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,tagline.ilike.%${search}%,bio.ilike.%${search}%`
      );
    }

    query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

    const { data } = await query;
    setCreators(data || []);
    setLoading(false);
  }, [search, category, location, language]);

  useEffect(() => {
    const timeout = setTimeout(() => loadCreators(), 300);
    return () => clearTimeout(timeout);
  }, [loadCreators]);

  useEffect(() => {
    if (creators.length === 0) return;
    async function loadMethods() {
      const ids = creators.map((c) => c.id);
      const { data } = await supabase
        .from('support_methods')
        .select('creator_id, method_type')
        .in('creator_id', ids);

      const map: Record<string, string[]> = {};
      (data || []).forEach((item) => {
        if (!map[item.creator_id]) map[item.creator_id] = [];
        map[item.creator_id].push(item.method_type);
      });
      setMethodTypesMap(map);
    }
    loadMethods();
  }, [creators]);

  const hasFilters = category || location || language || search;

  const clearFilters = () => {
    setCategory('');
    setLocation('');
    setLanguage('');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover creators</h1>
          <p className="text-slate-500 mb-6">
            Find Haitian creators across music, art, comedy, education, food, tech, and more.
          </p>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, tagline, or bio..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border font-medium text-sm transition-all flex items-center gap-2 ${
                showFilters || hasFilters
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                  {[category, location, language, search].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FilterSelect
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                />
                <FilterSelect
                  label="Location"
                  value={location}
                  onChange={setLocation}
                  options={LOCATIONS.map((l) => ({ value: l, label: l }))}
                />
                <FilterSelect
                  label="Language"
                  value={language}
                  onChange={setLanguage}
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            {loading
              ? 'Loading...'
              : `${creators.length} creator${creators.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-500 mb-2">No creators found</p>
            <p className="text-sm text-slate-400">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                supportMethodCount={(methodTypesMap[creator.id] || []).length}
                supportMethodTypes={methodTypesMap[creator.id] || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all cursor-pointer"
        >
          <option value="">All {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
