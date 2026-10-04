import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import type { Creator, SocialLink, SupportMethod } from '@/types';
import { CATEGORIES, LOCATIONS, LANGUAGES, PAYMENT_METHODS } from '@/lib/constants';
import { HATIS_DOMAIN, RESERVED_WORDS, USERNAME_REGEX } from '@/lib/auth-constants';
import { validateSupportMethod, formatDisplayValue } from '@/lib/validation';
import { STORY_CARD_VARIANTS, STORY_CARD_CAPTIONS, generateStoryCard, downloadStoryCard } from '@/lib/story-card';
import {
  User,
  Link2,
  Wallet,
  BarChart3,
  Share2,
  Plus,
  X,
  Check,
  Copy,
  Download,
  AlertTriangle,
  Heart,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  Camera,
} from 'lucide-react';

type Tab = 'profile' | 'links' | 'support' | 'analytics' | 'share';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [supportMethods, setSupportMethods] = useState<SupportMethod[]>([]);
  const [clicks, setClicks] = useState<{ method_type: string; clicked_at: string }[]>([]);
  const [tab, setTab] = useState<Tab>('profile');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'creator')) {
      navigate('/signup');
    }
  }, [user, profile, loading, navigate]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    const { data: creatorData } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!creatorData) {
      setLoadingData(false);
      navigate('/onboarding');
      return;
    }

    setCreator(creatorData);

    const [linksRes, methodsRes, clicksRes] = await Promise.all([
      supabase.from('social_links').select('*').eq('creator_id', creatorData.id).order('created_at', { ascending: true }),
      supabase.from('support_methods').select('*').eq('creator_id', creatorData.id).order('created_at', { ascending: true }),
      supabase.from('support_clicks').select('method_type, clicked_at').eq('creator_id', creatorData.id).order('clicked_at', { ascending: false }),
    ]);

    setSocialLinks(linksRes.data || []);
    setSupportMethods(methodsRes.data || []);
    setClicks(clicksRes.data || []);
    setLoadingData(false);
  }, [user, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'creator') loadData();
  }, [user, profile, loadData]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your Hatis page
            </p>
          </div>
          <Link
            to={`/creator/${creator.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View page
          </Link>
        </div>

        {/* Completeness meter */}
        <CompletenessMeter creator={creator} socialLinksCount={socialLinks.length} supportMethodsCount={supportMethods.length} />

        {/* Tabs */}
        <div className="flex gap-1 mt-6 mb-6 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={User}>
            Profile
          </TabButton>
          <TabButton active={tab === 'links'} onClick={() => setTab('links')} icon={Link2}>
            Links
          </TabButton>
          <TabButton active={tab === 'support'} onClick={() => setTab('support')} icon={Wallet}>
            Support
          </TabButton>
          <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')} icon={BarChart3}>
            Analytics
          </TabButton>
          <TabButton active={tab === 'share'} onClick={() => setTab('share')} icon={Share2}>
            Share
          </TabButton>
        </div>

        {tab === 'profile' && (
          <ProfileTab creator={creator} onUpdate={loadData} />
        )}
        {tab === 'links' && (
          <LinksTab creator={creator} socialLinks={socialLinks} onUpdate={loadData} />
        )}
        {tab === 'support' && (
          <SupportTab creator={creator} supportMethods={supportMethods} onUpdate={loadData} />
        )}
        {tab === 'analytics' && (
          <AnalyticsTab clicks={clicks} creator={creator} />
        )}
        {tab === 'share' && (
          <ShareTab creator={creator} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPLETENESS METER
// ============================================================
function CompletenessMeter({
  creator,
  socialLinksCount,
  supportMethodsCount,
}: {
  creator: Creator;
  socialLinksCount: number;
  supportMethodsCount: number;
}) {
  const checks = [
    { label: 'Profile photo', done: !!creator.avatar_url },
    { label: 'Bio', done: !!creator.bio },
    { label: 'At least one social link', done: socialLinksCount > 0 },
    { label: 'At least one support method', done: supportMethodsCount > 0 },
    { label: 'Cover image', done: !!creator.cover_url },
    { label: 'Location', done: !!creator.location },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const percentage = Math.round((doneCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.done);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-900">Page readiness</h2>
        <span className={`text-sm font-bold ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-slate-300'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage < 100 ? (
        <p className="text-sm text-slate-500">
          Your page is {percentage}% ready. {missing.map((m) => m.label).join(', ').toLowerCase()}.
        </p>
      ) : (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          Your page is complete!
        </p>
      )}
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================
function ProfileTab({ creator, onUpdate }: { creator: Creator; onUpdate: () => void }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(creator.display_name || creator.name);
  const [tagline, setTagline] = useState(creator.tagline || '');
  const [bio, setBio] = useState(creator.bio || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(creator.categories || [creator.category]);
  const [location, setLocation] = useState(creator.location || '');
  const [language, setLanguage] = useState(creator.language || 'Kreyòl');
  const [avatarUrl, setAvatarUrl] = useState(creator.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(creator.cover_url || '');
  const [slug, setSlug] = useState(creator.slug);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugWarning, setSlugWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const slugChanged = slug !== creator.slug;

  useEffect(() => {
    if (!slugChanged) {
      setSlugAvailable(null);
      return;
    }
    if (!USERNAME_REGEX.test(slug)) {
      setSlugAvailable(false);
      return;
    }
    if (RESERVED_WORDS.includes(slug)) {
      setSlugAvailable(false);
      return;
    }
    setSlugChecking(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('creators')
        .select('id')
        .eq('slug', slug)
        .neq('id', creator.id)
        .maybeSingle();
      setSlugAvailable(!data);
      setSlugChecking(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [slug, slugChanged, creator.id]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(urlData.publicUrl);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    if (slugChanged && !slugAvailable) {
      setError('Username is not available.');
      setSaving(false);
      return;
    }

    const primaryCategory = selectedCategories[0] || creator.category;
    const allCategories = selectedCategories.length > 0 ? selectedCategories : [primaryCategory];

    const { error: updateError } = await supabase
      .from('creators')
      .update({
        display_name: displayName,
        name: slug,
        slug,
        tagline: tagline || null,
        bio: bio || null,
        category: primaryCategory,
        categories: allCategories,
        location: location || null,
        language,
        avatar_url: avatarUrl || null,
        cover_url: coverUrl || null,
      })
      .eq('id', creator.id);

    if (updateError) {
      setError('Could not save your profile. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onUpdate();
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev;
      return [...prev, cat];
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {/* Avatar + Cover */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <label className="cursor-pointer text-xs text-slate-600 hover:text-slate-900 font-medium">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
            Change photo
          </label>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Cover image URL</label>
          <input
            type="text"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Username (your link)</label>
        <div className="flex items-center">
          <span className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm text-slate-500 whitespace-nowrap">
            {HATIS_DOMAIN}
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
              setSlugWarning(true);
            }}
            className="flex-1 px-3 py-3 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
          />
        </div>
        {slugChanged && slugWarning && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Changing your username means your old link will stop working. Make sure to update it everywhere you've shared it.
            </p>
          </div>
        )}
        {slugChanged && (
          <div className="mt-1.5 flex items-center gap-2 text-sm">
            {slugChecking && <span className="text-slate-400">Checking...</span>}
            {slugAvailable === true && <span className="text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Available</span>}
            {slugAvailable === false && <span className="text-red-500 flex items-center gap-1"><X className="w-4 h-4" /> Not available</span>}
          </div>
        )}
      </div>

      {/* Display name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Display name</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name or stage name" className={inputClass} />
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tagline (one line)</label>
        <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Kreyòl roots musician" className={inputClass} />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell your story..." className={`${inputClass} resize-none`} />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categories (up to 3, first is primary)</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.value);
            const disabled = !selected && selectedCategories.length >= 3;
            return (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selected ? 'border-rose-400 bg-rose-50 text-rose-700' : disabled ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {selected && <Check className="w-3.5 h-3.5" />}
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location + Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}>
            <option value="">Not set</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Saved!</span>}
      </div>
    </div>
  );
}

// ============================================================
// LINKS TAB
// ============================================================
const PLATFORM_OPTIONS = ['YouTube', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 'Website', 'Spotify', 'SoundCloud', 'GitHub'];

function LinksTab({ creator, socialLinks, onUpdate }: { creator: Creator; socialLinks: SocialLink[]; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newPlatform, setNewPlatform] = useState('YouTube');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');
    if (!newUrl.trim()) {
      setError('Please enter a URL.');
      return;
    }
    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }
    const { error: insertError } = await supabase.from('social_links').insert({
      creator_id: creator.id,
      platform: newPlatform,
      url,
      label: newPlatform,
    });
    if (insertError) {
      setError('Could not add the link. Please try again.');
      return;
    }
    setNewUrl('');
    setShowAdd(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('social_links').delete().eq('id', id);
    onUpdate();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Social links</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add link
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform</label>
            <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className={inputClass}>
              {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">URL</label>
            <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}

      {socialLinks.length === 0 && !showAdd ? (
        <p className="text-sm text-slate-400 text-center py-6">No social links yet. Add one so fans can follow your work.</p>
      ) : (
        <div className="space-y-2">
          {socialLinks.map((link) => (
            <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex-shrink-0">
                  {link.platform}
                </span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-slate-900 truncate">
                  {link.url}
                </a>
              </div>
              <button onClick={() => handleDelete(link.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUPPORT TAB
// ============================================================
function SupportTab({ creator, supportMethods, onUpdate }: { creator: Creator; supportMethods: SupportMethod[]; onUpdate: () => void }) {
  const [addingMethod, setAddingMethod] = useState<string | null>(null);
  const [newDisplayValue, setNewDisplayValue] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [validationError, setValidationError] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDisplayValue, setEditDisplayValue] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editError, setEditError] = useState('');

  const availableTypes = Object.values(PAYMENT_METHODS)
    .filter((m) => m.type !== 'Bank transfer')
    .filter((m) => !supportMethods.some((s) => s.method_type === m.type));

  const handleAdd = async () => {
    setValidationError('');
    setError('');

    const validation = validateSupportMethod(addingMethod!, newDisplayValue, newLinkUrl);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid value.');
      return;
    }

    const formattedValue = formatDisplayValue(addingMethod!, newDisplayValue);

    const { error: insertError } = await supabase.from('support_methods').insert({
      creator_id: creator.id,
      method_type: addingMethod!,
      display_value: formattedValue,
      link_url: newLinkUrl || null,
      instructions: newInstructions || null,
    });

    if (insertError) {
      setError('Could not add the support method. Please try again.');
      return;
    }

    setAddingMethod(null);
    setNewDisplayValue('');
    setNewLinkUrl('');
    setNewInstructions('');
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('support_methods').delete().eq('id', id);
    onUpdate();
  };

  const startEdit = (method: SupportMethod) => {
    setEditingId(method.id);
    setEditDisplayValue(method.display_value);
    setEditLinkUrl(method.link_url || '');
    setEditInstructions(method.instructions || '');
    setEditError('');
  };

  const handleSaveEdit = async (method: SupportMethod) => {
    setEditError('');
    const validation = validateSupportMethod(method.method_type, editDisplayValue, editLinkUrl);
    if (!validation.valid) {
      setEditError(validation.error || 'Invalid value.');
      return;
    }

    const formattedValue = formatDisplayValue(method.method_type, editDisplayValue);

    const { error: updateError } = await supabase
      .from('support_methods')
      .update({
        display_value: formattedValue,
        link_url: editLinkUrl || null,
        instructions: editInstructions || null,
      })
      .eq('id', method.id);

    if (updateError) {
      setEditError('Could not save. Please try again.');
      return;
    }

    setEditingId(null);
    onUpdate();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Support methods</h2>

      {/* Existing methods */}
      <div className="space-y-3 mb-4">
        {supportMethods.map((method) => {
          const info = PAYMENT_METHODS[method.method_type];
          const isEditing = editingId === method.id;
          return (
            <div key={method.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              {isEditing ? (
                <div className="space-y-3">
                  <p className="font-medium text-sm text-slate-900">{info?.label || method.method_type}</p>
                  <input type="text" value={editDisplayValue} onChange={(e) => setEditDisplayValue(e.target.value)} placeholder="Handle or number" className={inputClass} />
                  <input type="text" value={editLinkUrl} onChange={(e) => setEditLinkUrl(e.target.value)} placeholder="Payment link (optional)" className={inputClass} />
                  <input type="text" value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} placeholder="Instructions for fans (optional)" className={inputClass} />
                  {editError && <p className="text-sm text-red-600">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(method)} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900">{info?.label || method.method_type}</p>
                    <p className="text-sm text-slate-500 truncate">{method.display_value}</p>
                    {method.hidden && <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Hidden (under review)</span>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(method)} className="px-3 py-1.5 text-slate-600 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDelete(method.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new method */}
      {addingMethod ? (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <p className="font-medium text-sm text-slate-900">{PAYMENT_METHODS[addingMethod]?.label || addingMethod}</p>
          <input type="text" value={newDisplayValue} onChange={(e) => setNewDisplayValue(e.target.value)} placeholder={getPlaceholder(addingMethod)} className={inputClass} />
          <input type="text" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} placeholder="Payment link (optional)" className={inputClass} />
          <input type="text" value={newInstructions} onChange={(e) => setNewInstructions(e.target.value)} placeholder="Instructions for fans (optional)" className={inputClass} />
          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800">Add</button>
            <button onClick={() => { setAddingMethod(null); setValidationError(''); setNewDisplayValue(''); setNewLinkUrl(''); setNewInstructions(''); }} className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-700">Cancel</button>
          </div>
        </div>
      ) : availableTypes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {availableTypes.map((method) => (
            <button
              key={method.type}
              onClick={() => setAddingMethod(method.type)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {method.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">All support methods added.</p>
      )}
    </div>
  );
}

function getPlaceholder(methodType: string): string {
  if (methodType === 'MonCash' || methodType === 'NatCash') return '+509 3700-1234';
  if (methodType === 'PayPal') return 'paypal.me/yourname';
  if (methodType === 'Cash App') return '$yourcashtag';
  if (methodType === 'Zelle') return 'email or phone';
  if (methodType === 'Payoneer') return 'https://...';
  return 'Handle or number';
}

// ============================================================
// ANALYTICS TAB
// ============================================================
function AnalyticsTab({ clicks, creator }: { clicks: { method_type: string; clicked_at: string }[]; creator: Creator }) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentClicks = clicks.filter((c) => new Date(c.clicked_at) >= thirtyDaysAgo);
  const totalClicks = clicks.length;
  const recentCount = recentClicks.length;

  // Clicks by method
  const byMethod: Record<string, number> = {};
  for (const click of clicks) {
    byMethod[click.method_type] = (byMethod[click.method_type] || 0) + 1;
  }
  const methodEntries = Object.entries(byMethod).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(byMethod), 1);

  // Daily breakdown for last 30 days
  const dailyData: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().slice(0, 10);
    dailyData[dateKey] = 0;
  }
  for (const click of recentClicks) {
    const dateKey = new Date(click.clicked_at).toISOString().slice(0, 10);
    if (dateKey in dailyData) {
      dailyData[dateKey]++;
    }
  }
  const dailyValues = Object.values(dailyData);
  const maxDaily = Math.max(...dailyValues, 1);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-medium text-slate-500">Last 30 days</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{recentCount}</p>
          <p className="text-sm text-slate-400 mt-1">
            {recentCount === 1 ? '1 person clicked Support this month' : `${recentCount} people clicked Support this month`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
            <span className="text-sm font-medium text-slate-500">All time</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalClicks}</p>
          <p className="text-sm text-slate-400 mt-1">
            {totalClicks === 1 ? '1 total support click' : `${totalClicks} total support clicks`}
          </p>
        </div>
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Clicks over the last 30 days</h3>
        <div className="flex items-end gap-1 h-32">
          {dailyValues.map((val, i) => (
            <div
              key={i}
              className="flex-1 bg-rose-200 hover:bg-rose-400 rounded-t transition-colors"
              style={{ height: `${(val / maxDaily) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
              title={`${val} click${val !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* By method */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Clicks by support method</h3>
        {methodEntries.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No clicks yet.</p>
        ) : (
          <div className="space-y-3">
            {methodEntries.map(([method, count]) => {
              const info = PAYMENT_METHODS[method];
              return (
                <div key={method} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-slate-700 flex-shrink-0">
                    {info?.label || method}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-slate-500 text-right flex-shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          These are clicks on your support buttons, not actual payments. Hatis doesn't process payments, so we can't see whether a fan completed the transfer.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SHARE TAB
// ============================================================
function ShareTab({ creator }: { creator: Creator }) {
  const [variant, setVariant] = useState(STORY_CARD_VARIANTS[0].id);
  const [lang, setLang] = useState<'en' | 'fr' | 'kr'>('en');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [generating, setGenerating] = useState(false);
  const profileUrl = `${window.location.origin}/creator/${creator.slug}`;

  const caption = STORY_CARD_CAPTIONS[variant]?.[lang] || '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch { /* ignore */ }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(`${caption}\n\n${profileUrl}`);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch { /* ignore */ }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const dataUrl = generateStoryCard(creator, variant, lang, profileUrl);
      if (dataUrl) {
        downloadStoryCard(dataUrl, `hatis-${creator.slug}-${variant}.png`);
      }
    } catch {
      // ignore
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      {/* Copy link */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Your Hatis link</h3>
        <p className="text-sm text-slate-500 mb-4">Add this to your TikTok, Instagram, YouTube, or WhatsApp bio.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 truncate">
            {profileUrl}
          </code>
          <button
            onClick={handleCopyLink}
            className="px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            {copiedLink ? <><Check className="w-4 h-4 text-green-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>
      </div>

      {/* Story card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Story card</h3>
        <p className="text-sm text-slate-500 mb-4">Download a ready-to-post image for your stories.</p>

        {/* Variant selector */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Choose a message</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STORY_CARD_VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  variant === v.id ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {v[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Language</label>
          <div className="flex gap-2">
            {(['en', 'fr', 'kr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  lang === l ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {l === 'en' ? 'English' : l === 'fr' ? 'Français' : 'Kreyòl'}
              </button>
            ))}
          </div>
        </div>

        {/* Caption preview */}
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600 leading-relaxed">{caption}</p>
          <p className="text-sm text-slate-400 mt-2">{profileUrl}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Generating...' : 'Download story card'}
          </button>
          <button
            onClick={handleCopyCaption}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            {copiedCaption ? <><Check className="w-4 h-4 text-green-600" /> Copied</> : <><Copy className="w-4 h-4" /> Copy caption</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED UI
// ============================================================
const inputClass = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all';

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
