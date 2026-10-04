import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import type { ClaimRequest, Report, Creator, SupportMethod } from '@/types';
import {
  ShieldCheck,
  Flag,
  Check,
  X,
  BadgeCheck,
  Star,
  EyeOff,
  ExternalLink,
  Clock,
} from 'lucide-react';

type Tab = 'claims' | 'verification' | 'reports';

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('claims');
  const [claims, setClaims] = useState<(ClaimRequest & { creator?: Creator })[]>([]);
  const [reports, setReports] = useState<(Report & { creator?: Creator; support_method?: SupportMethod })[]>([]);
  const [unverifiedCreators, setUnverifiedCreators] = useState<Creator[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !profile?.is_admin)) {
      navigate('/');
    }
  }, [user, profile, loading, navigate]);

  const loadData = useCallback(async () => {
    setLoadingData(true);

    if (tab === 'claims') {
      const { data } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (data) {
        const creatorIds = [...new Set(data.map((c) => c.creator_id))];
        const { data: creators } = await supabase
          .from('creators')
          .select('*')
          .in('id', creatorIds);
        const creatorMap = new Map((creators || []).map((c) => [c.id, c]));
        setClaims(data.map((c) => ({ ...c, creator: creatorMap.get(c.creator_id) })));
      }
    } else if (tab === 'verification') {
      const { data } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setUnverifiedCreators((data || []).filter((c) => !c.verified));
    } else if (tab === 'reports') {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (data) {
        const creatorIds = [...new Set(data.map((r) => r.creator_id))];
        const methodIds = [...new Set(data.filter((r) => r.support_method_id).map((r) => r.support_method_id!))];
        const [creatorRes, methodRes] = await Promise.all([
          creatorIds.length
            ? supabase.from('creators').select('*').in('id', creatorIds)
            : Promise.resolve({ data: [] }),
          methodIds.length
            ? supabase.from('support_methods').select('*').in('id', methodIds)
            : Promise.resolve({ data: [] }),
        ]);
        const creatorMap = new Map((creatorRes.data || []).map((c) => [c.id, c]));
        const methodMap = new Map((methodRes.data || []).map((m) => [m.id, m]));
        setReports(data.map((r) => ({
          ...r,
          creator: creatorMap.get(r.creator_id),
          support_method: r.support_method_id ? methodMap.get(r.support_method_id) : undefined,
        })));
      }
    }

    setLoadingData(false);
  }, [tab]);

  useEffect(() => {
    if (user && profile?.is_admin) loadData();
  }, [user, profile, loadData]);

  if (loading || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck className="w-7 h-7 text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1">
          <TabButton active={tab === 'claims'} onClick={() => setTab('claims')}>
            Claim Requests
          </TabButton>
          <TabButton active={tab === 'verification'} onClick={() => setTab('verification')}>
            Awaiting Verification
          </TabButton>
          <TabButton active={tab === 'reports'} onClick={() => setTab('reports')}>
            Reports
          </TabButton>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-6 h-6 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Claims tab */}
            {tab === 'claims' && (
              <div className="space-y-3">
                {claims.length === 0 ? (
                  <EmptyState text="No pending claim requests." />
                ) : (
                  claims.map((claim) => (
                    <ClaimCard
                      key={claim.id}
                      claim={claim}
                      onApprove={async () => {
                        await supabase.rpc('approve_claim', { p_request_id: claim.id });
                        loadData();
                      }}
                      onReject={async () => {
                        await supabase.rpc('reject_claim', {
                          p_request_id: claim.id,
                          p_note: 'Rejected by admin',
                        });
                        loadData();
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Verification tab */}
            {tab === 'verification' && (
              <div className="space-y-3">
                {unverifiedCreators.length === 0 ? (
                  <EmptyState text="All creators are verified." />
                ) : (
                  unverifiedCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                        {creator.avatar_url && (
                          <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{creator.name}</p>
                        <p className="text-sm text-slate-400 truncate">
                          {creator.category} · {creator.location || 'No location'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await supabase.rpc('toggle_creator_verified', { p_creator_id: creator.id });
                            loadData();
                          }}
                          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        >
                          <BadgeCheck className="w-4 h-4" />
                          Verify
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.rpc('toggle_creator_featured', { p_creator_id: creator.id });
                            loadData();
                          }}
                          className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <Star className="w-4 h-4" />
                          Feature
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reports tab */}
            {tab === 'reports' && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <EmptyState text="No open reports." />
                ) : (
                  reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onResolve={async () => {
                        await supabase.rpc('resolve_report', { p_report_id: report.id });
                        loadData();
                      }}
                      onHideMethod={async () => {
                        if (report.support_method_id) {
                          await supabase.rpc('hide_support_method', { p_method_id: report.support_method_id });
                        }
                        loadData();
                      }}
                      onUnverify={async () => {
                        await supabase.rpc('unverify_creator', { p_creator_id: report.creator_id });
                        loadData();
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <p>{text}</p>
    </div>
  );
}

function ClaimCard({
  claim,
  onApprove,
  onReject,
}: {
  claim: ClaimRequest & { creator?: Creator };
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900">
            {claim.creator?.name || 'Unknown creator'}
          </p>
          <p className="text-sm text-slate-400">
            Claim code: <code className="font-mono font-semibold text-slate-600">{claim.claim_code}</code>
          </p>
        </div>
        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      </div>

      {claim.proof_url && (
        <a
          href={claim.proof_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-3"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View proof link
        </a>
      )}

      {claim.message && (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 mb-3">
          {claim.message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  onResolve,
  onHideMethod,
  onUnverify,
}: {
  report: Report & { creator?: Creator; support_method?: SupportMethod };
  onResolve: () => void;
  onHideMethod: () => void;
  onUnverify: () => void;
}) {
  const reasonLabels: Record<string, string> = {
    wrong_number: 'Wrong number or handle',
    impersonation: 'Impersonation',
    scam: 'Scam or fraud',
    other: 'Other problem',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900">
            {report.creator?.name || 'Unknown creator'}
          </p>
          {report.support_method && (
            <p className="text-sm text-slate-400">
              Method: {report.support_method.method_type} — {report.support_method.display_value}
            </p>
          )}
          <p className="text-sm text-red-600 font-medium mt-1">
            {reasonLabels[report.reason] || report.reason}
          </p>
        </div>
        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
          <Flag className="w-3 h-3" />
          Open
        </span>
      </div>

      {report.details && (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 mb-3">
          {report.details}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {report.support_method_id && (
          <button
            onClick={onHideMethod}
            className="px-3 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1.5"
          >
            <EyeOff className="w-4 h-4" />
            Hide method
          </button>
        )}
        <button
          onClick={onUnverify}
          className="px-3 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Unverify creator
        </button>
        <button
          onClick={onResolve}
          className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          Resolve
        </button>
      </div>
    </div>
  );
}
