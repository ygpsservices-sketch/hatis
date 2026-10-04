import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Creator, SupportMethod } from '@/types';
import { REPORT_REASONS } from '@/lib/auth-constants';
import { X, Flag, Check } from 'lucide-react';

interface ReportModalProps {
  creator: Creator;
  supportMethod?: SupportMethod | null;
  onClose: () => void;
}

export default function ReportModal({ creator, supportMethod, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  useEffect(() => {
    // Check if this browser already reported this method today
    const key = supportMethod
      ? `hatis_report_${supportMethod.id}`
      : `hatis_report_creator_${creator.id}`;
    const lastReport = localStorage.getItem(key);
    if (lastReport) {
      const reportDate = new Date(lastReport);
      const now = new Date();
      const hoursDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        setAlreadyReported(true);
      }
    }
  }, [creator.id, supportMethod]);

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

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);

    const { error } = await supabase.from('reports').insert({
      creator_id: creator.id,
      support_method_id: supportMethod?.id || null,
      reason,
      details: details || null,
      reporter_contact: reporterContact || null,
      status: 'open',
    });

    setSubmitting(false);

    if (!error) {
      const key = supportMethod
        ? `hatis_report_${supportMethod.id}`
        : `hatis_report_creator_${creator.id}`;
      localStorage.setItem(key, new Date().toISOString());
      setSubmitted(true);
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
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900">
              {supportMethod ? 'Report a problem with this number' : 'Report this page'}
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {creator.name}'s page
            {supportMethod ? ` — ${supportMethod.method_type}` : ''}
          </p>
        </div>

        <div className="p-6">
          {alreadyReported ? (
            <div className="text-center py-6">
              <p className="text-slate-600 mb-2">
                You've already reported this {supportMethod ? 'number' : 'page'} recently.
              </p>
              <p className="text-sm text-slate-400">
                You can submit one report per item per day. Thank you for helping keep Hatis safe.
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Thank you!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Your report has been submitted. Our team will review it and take
                appropriate action if needed.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What's the problem?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                        reason === r.value
                          ? 'border-rose-400 bg-rose-50 text-rose-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        reason === r.value ? 'border-rose-500 bg-rose-500' : 'border-slate-300'
                      }`} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Tell us more about what happened..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your contact (optional)
                </label>
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="Email or social handle — only if you want a reply"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
