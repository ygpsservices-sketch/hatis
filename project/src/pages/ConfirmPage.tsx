import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, Link } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { Heart, Check } from 'lucide-react';

export default function ConfirmPage() {
  const { user, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    (async () => {
      // Wait for auth to settle
      await new Promise((r) => setTimeout(r, 500));
      if (user) {
        const providerEmail = user.email;
        if (providerEmail) {
          setEmail(providerEmail);
        } else {
          setNeedsEmail(true);
        }
        setLoading(false);
      } else {
        // Still loading — give it more time
        setTimeout(() => setLoading(false), 2000);
      }
    })();
  }, [user]);

  const handleConfirm = async () => {
    setConfirming(true);

    // Upsert profile
    if (user) {
      const profileEmail = email || user.email || '';
      await supabase.from('profiles').upsert({
        id: user.id,
        email: profileEmail,
      }, { onConflict: 'id' });

      await refreshProfile();
    }

    // Check if they have a creator row — if so go to their page, else go to onboarding
    if (user) {
      const { data: creator } = await supabase
        .from('creators')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creator) {
        navigate(`/creator/${creator.slug}`);
      } else {
        navigate('/onboarding');
      }
    }
    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50/30 to-orange-50/20 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50/30 to-orange-50/20 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Something went wrong with the authentication.</p>
          <Link to="/signup" className="text-slate-900 font-medium underline">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50/30 to-orange-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Hatis</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Connected!</h1>
          <p className="text-slate-500 mb-6">
            Your Hatis account will be associated with this email address:
          </p>

          {needsEmail ? (
            <div className="mb-6 text-left">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Enter your email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
            </div>
          ) : (
            <p className="font-semibold text-slate-900 mb-6 break-all">{email}</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={confirming || (needsEmail && !email)}
            className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {confirming ? 'Setting up your account...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
