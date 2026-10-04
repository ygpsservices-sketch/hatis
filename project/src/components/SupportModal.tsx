import { useState, useEffect } from 'react';
import type { Creator, SupportMethod } from '@/types';
import { PAYMENT_METHODS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import ReportModal from '@/components/ReportModal';
import { X, Copy, Check, ExternalLink, Heart, Smartphone, Wallet, Building2, Flag, AlertTriangle, EyeOff } from 'lucide-react';

interface SupportModalProps {
  creator: Creator;
  methods: SupportMethod[];
  onClose: () => void;
}

function getMethodIcon(type: string) {
  if (type === 'MonCash' || type === 'NatCash') return Smartphone;
  if (type === 'Bank transfer') return Building2;
  return Wallet;
}

export default function SupportModal({ creator, methods, onClose }: SupportModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<SupportMethod | null>(null);
  const [copied, setCopied] = useState(false);
  const [clickRecorded, setClickRecorded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [hiddenMethods, setHiddenMethods] = useState<Set<string>>(new Set());

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

  // Check which methods have 3+ open reports (should be hidden)
  useEffect(() => {
    async function checkHidden() {
      const hidden = new Set<string>();
      for (const method of methods) {
        if (method.hidden) {
          hidden.add(method.id);
          continue;
        }
        const { data } = await supabase
          .rpc('get_open_report_count', { p_support_method_id: method.id });
        if (data && data >= 3) {
          hidden.add(method.id);
        }
      }
      setHiddenMethods(hidden);
    }
    if (methods.length > 0) checkHidden();
  }, [methods]);

  const recordClick = async (method: SupportMethod) => {
    if (clickRecorded) return;
    setClickRecorded(true);
    await supabase.from('support_clicks').insert({
      creator_id: creator.id,
      method_type: method.method_type,
    });
  };

  const handleMethodSelect = (method: SupportMethod) => {
    setSelectedMethod(method);
    recordClick(method);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExternalLink = (method: SupportMethod) => {
    if (method.link_url) {
      window.open(method.link_url, '_blank', 'noopener,noreferrer');
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
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
            <h2 className="text-lg font-bold text-slate-900">
              {selectedMethod ? 'Send your support' : `Show love to ${creator.name.split(' ')[0]}`}
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {selectedMethod
              ? `You're supporting ${creator.name}`
              : 'Choose the way that works best for you.'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {!selectedMethod ? (
            <>
              {/* Unverified warning */}
              {!creator.verified && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-relaxed">
                    This page hasn't been verified yet. Make sure it's the right creator before sending support.
                  </p>
                </div>
              )}

              {methods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">
                    {creator.name} hasn't added support methods yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {methods.map((method) => {
                    const info = PAYMENT_METHODS[method.method_type];
                    const Icon = getMethodIcon(method.method_type);
                    const isHidden = hiddenMethods.has(method.id);
                    return (
                      <div key={method.id}>
                        {isHidden ? (
                          <div className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <span className={`w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                              <EyeOff className="w-5 h-5 text-slate-400" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-500">
                                {info?.label || method.method_type}
                              </p>
                              <p className="text-sm text-slate-400">
                                Under review — temporarily hidden
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMethodSelect(method)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                          >
                            <span
                              className={`w-11 h-11 rounded-xl ${info?.bgColor || 'bg-slate-50'} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className={`w-5 h-5 ${info?.color || 'text-slate-600'}`} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900">
                                {info?.label || method.method_type}
                              </p>
                              <p className="text-sm text-slate-500 truncate">
                                {info?.description || 'Support this creator'}
                              </p>
                            </div>
                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                              →
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Hatis never handles your payment. You support the creator directly
                  through their own account.
                </p>
              </div>

              {/* Report link */}
              <button
                onClick={() => setShowReport(true)}
                className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
              >
                <Flag className="w-3 h-3" />
                Report a problem with a number
              </button>
            </>
          ) : (
            <MethodDetail
              method={selectedMethod}
              creatorName={creator.name}
              copied={copied}
              onCopy={handleCopy}
              onOpenLink={handleExternalLink}
              onBack={() => setSelectedMethod(null)}
              onReport={() => setShowReport(true)}
            />
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal
          creator={creator}
          supportMethod={selectedMethod}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function MethodDetail({
  method,
  creatorName,
  copied,
  onCopy,
  onOpenLink,
  onBack,
  onReport,
}: {
  method: SupportMethod;
  creatorName: string;
  copied: boolean;
  onCopy: (value: string) => void;
  onOpenLink: (method: SupportMethod) => void;
  onBack: () => void;
  onReport: () => void;
}) {
  const info = PAYMENT_METHODS[method.method_type];
  const Icon = getMethodIcon(method.method_type);
  const hasLink = !!method.link_url;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
      >
        ← All methods
      </button>

      <div className={`p-4 rounded-xl ${info?.bgColor || 'bg-slate-50'}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${info?.color || 'text-slate-600'}`} />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{info?.label || method.method_type}</p>
            <p className="text-sm text-slate-500">{info?.description}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border border-slate-200 rounded-xl">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          {method.method_type} {method.method_type === 'Zelle' ? 'email/phone' : method.method_type === 'MonCash' || method.method_type === 'NatCash' ? 'number' : 'handle'}
        </p>
        <div className="flex items-center justify-between gap-3">
          <code className="text-lg font-semibold text-slate-900 break-all">
            {method.display_value}
          </code>
          <button
            onClick={() => onCopy(method.display_value)}
            className="flex-shrink-0 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
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

      {method.instructions && (
        <div className="p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800 leading-relaxed">
            {method.instructions}
          </p>
        </div>
      )}

      {hasLink && (
        <button
          onClick={() => onOpenLink(method)}
          className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open {info?.label || method.method_type}
        </button>
      )}

      {!hasLink && (method.method_type === 'MonCash' || method.method_type === 'NatCash') && (
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-600 leading-relaxed">
            Open your {info?.label} app, enter the number above, and send your
            support to {creatorName.split(' ')[0]}.
          </p>
        </div>
      )}

      {!hasLink && method.method_type === 'Zelle' && (
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-600 leading-relaxed">
            Zelle is sent through your bank's mobile app. Open your banking app,
            find Zelle, and send to the email or phone above.
          </p>
        </div>
      )}

      {copied && (
        <div className="p-3 bg-green-50 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            {method.method_type} {method.method_type === 'MonCash' || method.method_type === 'NatCash' ? 'number' : 'handle'} copied. Open your app, send your support, then come back to discover another creator.
          </p>
        </div>
      )}

      <button
        onClick={onReport}
        className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1 pt-2"
      >
        <Flag className="w-3 h-3" />
        Report a problem with this number
      </button>
    </div>
  );
}
