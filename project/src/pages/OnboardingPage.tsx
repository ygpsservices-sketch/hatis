import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { HATIS_DOMAIN, RESERVED_WORDS, USERNAME_REGEX } from '@/lib/auth-constants';
import {
  Heart,
  Check,
  ChevronRight,
  ChevronDown,
  Camera,
  Search,
  X,
  Plus,
  Sparkles,
  Info,
} from 'lucide-react';

type Step = 'role' | 'username' | 'avatar' | 'interests' | 'about' | 'support';

interface SupportEntry {
  method_type: string;
  display_value: string;
  link_url: string;
  instructions: string;
}

export default function OnboardingPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('Kreyòl');
  const [supportMethods, setSupportMethods] = useState<SupportEntry[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Prefill display name from OAuth
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    } else if (user?.user_metadata?.name) {
      setDisplayName(user.user_metadata.name);
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/signup');
  }, [user, navigate]);

  // Username availability check (debounced)
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameAvailable(false);
      return;
    }
    if (RESERVED_WORDS.includes(username)) {
      setUsernameAvailable(false);
      return;
    }
    setUsernameChecking(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('creators')
        .select('id')
        .eq('slug', username)
        .maybeSingle();
      setUsernameAvailable(!data);
      setUsernameChecking(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [username]);

  if (!user) return null;

  const email = user.email || profile?.email || '';
  const steps: Step[] = ['role', 'username', 'avatar', 'interests', 'about', 'support'];
  const currentStepIndex = steps.indexOf(step);

  const handleRoleSelect = async (role: 'creator' | 'supporter') => {
    setSubmitting(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      email,
      role,
    }, { onConflict: 'id' });
    await refreshProfile();
    setSubmitting(false);

    if (role === 'supporter') {
      navigate('/discover');
    } else {
      setStep('username');
    }
  };

  const handleStartOver = async () => {
    await signOut();
    navigate('/signup');
  };

  const handleAvatarUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      setAvatarUrl(urlData.publicUrl);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev;
      return [...prev, cat];
    });
  };

  const addSupportMethod = (methodType: string) => {
    setSupportMethods((prev) => {
      if (prev.some((m) => m.method_type === methodType)) return prev;
      return [...prev, { method_type: methodType, display_value: '', link_url: '', instructions: '' }];
    });
  };

  const updateSupportMethod = (methodType: string, field: keyof SupportEntry, value: string) => {
    setSupportMethods((prev) =>
      prev.map((m) => (m.method_type === methodType ? { ...m, [field]: value } : m))
    );
  };

  const removeSupportMethod = (methodType: string) => {
    setSupportMethods((prev) => prev.filter((m) => m.method_type !== methodType));
  };

  const handlePublish = async () => {
    setSubmitting(true);

    const primaryCategory = selectedCategories[0] || 'Other';
    const allCategories = selectedCategories.length > 0 ? selectedCategories : [primaryCategory];

    const profileComplete = Math.min(
      100,
      20 + (bio ? 20 : 0) + (avatarUrl ? 15 : 0) + (location ? 10 : 0) +
      (selectedCategories.length > 0 ? 10 : 0) + (supportMethods.length > 0 ? 15 : 0) +
      (displayName ? 10 : 0)
    );

    const { data: creatorData, error } = await supabase
      .from('creators')
      .insert({
        slug: username,
        name: username,
        display_name: displayName || username,
        tagline: bio ? bio.slice(0, 120) : null,
        bio: bio || null,
        category: primaryCategory,
        categories: allCategories,
        location: location || null,
        language,
        avatar_url: avatarUrl || null,
        profile_complete: profileComplete,
        onboarding_complete: true,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      setSubmitting(false);
      return;
    }

    // Insert support methods
    const validMethods = supportMethods.filter((m) => m.display_value.trim());
    if (validMethods.length > 0) {
      await supabase.from('support_methods').insert(
        validMethods.map((m) => ({
          creator_id: creatorData.id,
          method_type: m.method_type,
          display_value: m.display_value,
          link_url: m.link_url || null,
          instructions: m.instructions || null,
        }))
      );
    }

    setSubmitting(false);
    navigate(`/creator/${creatorData.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50/30 to-orange-50/20">
      {/* Progress bar */}
      {step !== 'role' && (
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="flex items-center gap-1.5">
            {steps.slice(1).map((s, i) => {
              const stepIndex = i + 1;
              const isActive = stepIndex <= currentStepIndex;
              return (
                <div key={s} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      isActive ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Step {currentStepIndex} of {steps.length - 1}
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Step: Role */}
        {step === 'role' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">I'm a...</h1>
            <p className="text-slate-500 mb-6">Tell us what brings you to Hatis.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect('creator')}
                disabled={submitting}
                className="p-6 text-left border-2 border-slate-200 rounded-2xl hover:border-rose-300 hover:bg-rose-50/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                  <Heart className="w-6 h-6 text-rose-600" fill="currentColor" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Creator</h3>
                <p className="text-sm text-slate-500">
                  I want people to discover and support my work.
                </p>
              </button>

              <button
                onClick={() => handleRoleSelect('supporter')}
                disabled={submitting}
                className="p-6 text-left border-2 border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Supporter</h3>
                <p className="text-sm text-slate-500">
                  I'm here to discover and support Haitian creators.
                </p>
              </button>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Everyone can give support! You can be a creator and still support others.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
              <span>Signing up as {email}</span>
              <button onClick={handleStartOver} className="text-slate-500 hover:text-slate-700 underline">
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Step: Username */}
        {step === 'username' && (
          <OnboardingCard title="Pick a username" subtitle="What would you like your link to be?">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your Hatis link
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm text-slate-500 whitespace-nowrap">
                    {HATIS_DOMAIN}
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_name"
                    className="flex-1 px-3 py-3 bg-slate-50 border border-slate-200 rounded-r-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                  />
                </div>
              </div>

              {/* Availability indicator */}
              {username && (
                <div className="flex items-center gap-2 text-sm">
                  {usernameChecking ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      <span className="text-slate-400">Checking availability...</span>
                    </>
                  ) : usernameAvailable === true ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Available!</span>
                    </>
                  ) : usernameAvailable === false ? (
                    <>
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">
                        {RESERVED_WORDS.includes(username) ? 'This word is reserved' : 'Not available'}
                      </span>
                    </>
                  ) : null}
                </div>
              )}

              <p className="text-xs text-slate-400">
                3–30 lowercase letters, numbers, and underscores. You can change it anytime!
              </p>
            </div>

            <OnboardingNav
              onBack={() => setStep('role')}
              onNext={() => setStep('avatar')}
              nextDisabled={!usernameAvailable}
              nextLabel="Continue"
            />
          </OnboardingCard>
        )}

        {/* Step: Avatar */}
        {step === 'avatar' && (
          <OnboardingCard title="Choose your profile picture" subtitle="This is how people will recognize you.">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-slate-300" />
                )}
              </div>

              <label className="cursor-pointer px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                Choose image
              </label>

              <p className="text-xs text-slate-400">You can change this anytime!</p>
            </div>

            <OnboardingNav
              onBack={() => setStep('username')}
              onNext={() => setStep('interests')}
              nextLabel="Continue"
            />
          </OnboardingCard>
        )}

        {/* Step: Interests */}
        {step === 'interests' && (
          <OnboardingCard title="Choose your interests" subtitle="Pick up to 3 categories. Your first pick becomes your main category.">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat.value);
                const disabled = !selected && selectedCategories.length >= 3;
                return (
                  <button
                    key={cat.value}
                    onClick={() => toggleCategory(cat.value)}
                    disabled={disabled}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      selected
                        ? 'border-rose-400 bg-rose-50 text-rose-700'
                        : disabled
                        ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {selected && <Check className="w-4 h-4" />}
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {selectedCategories.length > 0 && (
              <p className="mt-4 text-xs text-slate-400">
                {selectedCategories.length} of 3 selected. Main: {CATEGORIES.find(c => c.value === selectedCategories[0])?.label}
              </p>
            )}

            <OnboardingNav
              onBack={() => setStep('avatar')}
              onNext={() => setStep('about')}
              nextDisabled={selectedCategories.length === 0}
              nextLabel="Continue"
            />
          </OnboardingCard>
        )}

        {/* Step: About */}
        {step === 'about' && (
          <OnboardingCard title="About you" subtitle="Tell fans who you are and what you do.">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or stage name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell your story. What do you create? What inspires you?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Port-au-Prince, Haiti"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Language (optional)
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all cursor-pointer"
                  >
                    <option value="Kreyòl">Kreyòl</option>
                    <option value="French">French</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>
              </div>
            </div>

            <OnboardingNav
              onBack={() => setStep('interests')}
              onNext={() => setStep('support')}
              nextDisabled={!displayName.trim()}
              nextLabel="Continue"
            />
          </OnboardingCard>
        )}

        {/* Step: Support methods */}
        {step === 'support' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ready to get support?</h1>
            <p className="text-slate-500 mb-6">
              Add a way for fans to support you. You can add more later.
            </p>

            {/* Method cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {Object.values(PAYMENT_METHODS)
                .filter((m) => m.type !== 'Bank transfer')
                .map((method) => {
                  const added = supportMethods.some((s) => s.method_type === method.type);
                  return (
                    <button
                      key={method.type}
                      onClick={() => !added && addSupportMethod(method.type)}
                      disabled={added}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        added
                          ? 'border-green-200 bg-green-50/50 cursor-default'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-900">{method.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {added ? 'Added' : 'Add'}
                      </p>
                    </button>
                  );
                })}
            </div>

            {/* Added method forms */}
            {supportMethods.map((method) => {
              const info = PAYMENT_METHODS[method.method_type];
              return (
                <div key={method.method_type} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-slate-900">{info?.label || method.method_type}</span>
                    <button
                      onClick={() => removeSupportMethod(method.method_type)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={method.display_value}
                    onChange={(e) => updateSupportMethod(method.method_type, 'display_value', e.target.value)}
                    placeholder={
                      method.method_type === 'MonCash' || method.method_type === 'NatCash'
                        ? 'Phone number'
                        : method.method_type === 'PayPal'
                        ? 'PayPal.me username'
                        : 'Handle or number'
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all mb-2"
                  />
                  <input
                    type="text"
                    value={method.link_url}
                    onChange={(e) => updateSupportMethod(method.method_type, 'link_url', e.target.value)}
                    placeholder="Payment link (optional)"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                  />
                </div>
              );
            })}

            {/* FAQ */}
            <div className="space-y-2 mt-6">
              <FaqItem
                id="why"
                openFaq={openFaq}
                setOpenFaq={setOpenFaq}
                question="Why do I add a support method?"
                answer="So fans know where to send support. Hatis never holds or touches the money — support goes directly to your account."
              />
              <FaqItem
                id="change"
                openFaq={openFaq}
                setOpenFaq={setOpenFaq}
                question="Can I change it later?"
                answer="Yes, anytime. You can add, edit, or remove support methods from your page at any time."
              />
              <FaqItem
                id="none"
                openFaq={openFaq}
                setOpenFaq={setOpenFaq}
                question="I don't have any of these"
                answer="That's fine! You can still publish your page and add a support method later. Fans can still discover and follow your work."
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep('about')}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePublish}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Skip for now
                </button>
                <button
                  onClick={handlePublish}
                  disabled={submitting}
                  className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish my page'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500 mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

function OnboardingNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700">
        Back
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-1 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLabel}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function FaqItem({
  id,
  openFaq,
  setOpenFaq,
  question,
  answer,
}: {
  id: string;
  openFaq: string | null;
  setOpenFaq: (v: string | null) => void;
  question: string;
  answer: string;
}) {
  const isOpen = openFaq === id;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpenFaq(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">{question}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-sm text-slate-500 leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}
