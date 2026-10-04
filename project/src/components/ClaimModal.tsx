import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import type { Creator } from '@/types';
import { X, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';

interface ClaimModalProps {
  creator: Creator;
  onClose: () => void;
}

function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HATIS-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function ClaimModal({ creator, onClose }: ClaimModalProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [step, setStep] = useState<'login' | 'form' | 'submitted'>('login');
  const [claimCode, setClaimCode] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setStep('form');
      setClaimCode(generateClaimCode());
    }
  }, [user]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(claimCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!user || !proofUrl.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('claim_requests').insert({
      creator_id: creator.id,
      user_id: user.id,
      message: message || null,
      proof_url: proofUrl,
      claim_code: claimCode,
      status: 'pending',
    });

    setSubmitting(false);
    if (!error) {
      setStep('submitted');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Claim this page</h2>
          </div>
          <p className="text-sm text-slate-500">
            {creator.name}'s page
          </p>
        </div>

        <div className="p-6">
          {step === 'login' && (
            <div className="text-center py-4">
              <p className="text-slate-600 mb-6">
                You need to be logged in to claim a creator page.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Sign up or log in
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">How to prove this is your page</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">
                  Copy this code and add it to the bio of one of your official social
                  accounts (Instagram, TikTok, YouTube, etc.), or send us a message
                  from that account.
                </p>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <code className="flex-1 text-lg font-bold text-slate-900 tracking-wider">
                    {claimCode}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Link to your social account
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://instagram.com/youraccount"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Paste the link to the account where you added the code or messaged us from.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Anything else we should know?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !proofUrl.trim()}
                className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit claim request'}
              </button>
            </div>
          )}

          {step === 'submitted' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Claim submitted!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Our team will review your claim and verify the code in your social
                account. You'll be notified when it's approved.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
