import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, Link } from '@/lib/router';
import { Heart, Check } from 'lucide-react';

interface AuthPageProps {
  mode: 'signup' | 'login';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { navigate } = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError('');
    if (isSignup && !accepted) {
      setError('Please accept the terms to continue.');
      return;
    }
    setLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50/30 to-orange-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Hatis</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            {isSignup ? 'Sign up — it\'s free!' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-500 text-center mb-6">
            {isSignup
              ? 'Join the Hatis community of Haitian creators and supporters.'
              : 'Log in to your Hatis account.'}
          </p>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={loading !== null || (isSignup && !accepted)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth('facebook')}
              disabled={loading !== null || (isSignup && !accepted)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'facebook' ? (
                <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <FacebookIcon />
              )}
              Continue with Facebook
            </button>
          </div>

          {isSignup && (
            <>
              {/* Terms checkbox */}
              <label className="flex items-start gap-2.5 mt-6 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setAccepted(!accepted)}
                  className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    accepted
                      ? 'bg-slate-900 border-slate-900'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {accepted && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <span className="text-sm text-slate-600 leading-relaxed">
                  I accept the{' '}
                  <Link to="/terms" className="text-slate-900 font-medium underline">
                    terms
                  </Link>{' '}
                  and have read the{' '}
                  <Link to="/privacy" className="text-slate-900 font-medium underline">
                    privacy policy
                  </Link>
                  .
                </span>
              </label>

              <p className="mt-4 text-xs text-slate-400 leading-relaxed text-center">
                Hatis is a safe, friendly place. You must be 18 or over to use Hatis.
                Pages that break our terms will be unpublished.
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}

          {/* Switch link */}
          <p className="mt-6 text-sm text-slate-500 text-center">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-slate-900 font-medium underline">
                  Log in here
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="text-slate-900 font-medium underline">
                  Sign up here
                </Link>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center">
          Hatis never holds your money. Support goes directly to creators.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.58 2.96-2.26 4.52-5.92 4.52-3.56 0-6.5-2.94-6.5-6.5s2.94-6.5 6.5-6.5c1.74 0 3.26.65 4.48 1.7l3.23-3.23C16.68 1.87 14.55 1 12 1 6.48 1 2 5.48 2 11s4.48 10 10 10c5.52 0 10-4.48 10-10 0-.25 0-.5-.02-.75z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}
