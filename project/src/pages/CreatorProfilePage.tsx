import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Creator, SocialLink, SupportMethod } from '@/types';
import SupportModal from '@/components/SupportModal';
import ClaimModal from '@/components/ClaimModal';
import ReportModal from '@/components/ReportModal';
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { formatClickCount } from '@/lib/utils';
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Globe,
  Heart,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Smartphone,
  Wallet,
  Building2,
  ShieldCheck,
  Flag,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  slug: string;
}

function getMethodIcon(type: string) {
  if (type === 'MonCash' || type === 'NatCash') return Smartphone;
  if (type === 'Bank transfer') return Building2;
  return Wallet;
}

export default function CreatorProfilePage({ slug }: Props) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [supportMethods, setSupportMethods] = useState<SupportMethod[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSupport, setShowSupport] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: creatorData } = await supabase
        .from('creators')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!creatorData) {
        setLoading(false);
        return;
      }

      setCreator(creatorData);

      const [socialRes, methodsRes, clicksRes] = await Promise.all([
        supabase
          .from('social_links')
          .select('*')
          .eq('creator_id', creatorData.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('support_methods')
          .select('*')
          .eq('creator_id', creatorData.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('support_clicks')
          .select('id', { count: 'exact' })
          .eq('creator_id', creatorData.id),
      ]);

      setSocialLinks(socialRes.data || []);
      setSupportMethods(methodsRes.data || []);
      setClickCount(clicksRes.count || 0);
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-64 bg-slate-100 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-24 h-24 rounded-full bg-slate-100 animate-pulse -mt-12" />
          <div className="mt-4 h-8 bg-slate-100 rounded w-1/3 animate-pulse" />
          <div className="mt-2 h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
          <div className="mt-6 h-32 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Creator not found</h1>
          <p className="text-slate-500 mb-6">
            This creator's page doesn't exist or may have been removed.
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Browse creators
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find((c) => c.value === creator.category);
  const CategoryIcon = categoryInfo?.icon;
  const canClaim = !creator.user_id && !user;

  return (
    <div className="min-h-screen bg-white">
      {/* Cover */}
      <div className="relative h-56 sm:h-72 bg-slate-200 overflow-hidden">
        {creator.cover_url && (
          <img
            src={creator.cover_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button
          onClick={() => navigate('/discover')}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-medium rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-sm text-slate-700 text-sm font-medium rounded-lg hover:bg-white transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Link copied
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </button>
      </div>

      {/* Profile header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-12">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white bg-slate-100 overflow-hidden shadow-lg flex-shrink-0">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400">
                {creator.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 sm:pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {creator.display_name || creator.name}
              </h1>
              {creator.verified ? (
                <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                  <BadgeCheck className="w-5 h-5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                  Not yet verified
                </span>
              )}
            </div>
            {creator.tagline && (
              <p className="text-slate-600 mt-1">{creator.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
              {CategoryIcon && (
                <span className="flex items-center gap-1.5">
                  <CategoryIcon className="w-4 h-4" />
                  {creator.category}
                </span>
              )}
              {creator.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {creator.location}
                </span>
              )}
              {creator.language && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  {creator.language}
                </span>
              )}
            </div>
          </div>

          <div className="sm:pb-2">
            <button
              onClick={() => setShowSupport(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <Heart className="w-5 h-5" fill="currentColor" />
              Support {(creator.display_name || creator.name).split(' ')[0]}
            </button>
          </div>
        </div>

        {/* Unverified notice for non-creators viewing */}
        {!creator.verified && (
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This page hasn't been verified by Hatis yet. Make sure it's the right creator before sending support.
            </p>
          </div>
        )}

        {/* Bio */}
        {creator.bio && (
          <div className="mt-8">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {creator.bio}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400" />
            {formatClickCount(clickCount)}
          </span>
        </div>

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
              Follow their work
            </h2>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all"
                >
                  {link.label || link.platform}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Support methods preview */}
        {supportMethods.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
              Support {(creator.display_name || creator.name).split(' ')[0]} with
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {supportMethods.map((method) => {
                const info = PAYMENT_METHODS[method.method_type];
                const Icon = getMethodIcon(method.method_type);
                return (
                  <button
                    key={method.id}
                    onClick={() => setShowSupport(true)}
                    className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-rose-200 hover:bg-rose-50/30 transition-all text-left group"
                  >
                    <span
                      className={`w-10 h-10 rounded-lg ${info?.bgColor || 'bg-slate-50'} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${info?.color || 'text-slate-600'}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm">
                        {info?.label || method.method_type}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {method.display_value}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile completeness (for the creator themselves) */}
        {creator.profile_complete < 100 && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              This profile is {creator.profile_complete}% complete.
            </p>
          </div>
        )}

        {/* Share section */}
        <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-1">Share this page</h3>
          <p className="text-sm text-slate-500 mb-4">
            Share {creator.display_name || creator.name}'s Hatis page with your community.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Link copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy profile link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Claim + Report */}
        <div className="mt-6 pb-12 space-y-3">
          {/* Claim this page */}
          {!creator.user_id && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Is this your page?
                  </p>
                  <p className="text-sm text-blue-700 mb-3">
                    Claim this page to verify it's really you and manage your profile.
                  </p>
                  <button
                    onClick={() => setShowClaim(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Claim this page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Report */}
          <p className="text-xs text-slate-400">
            Found a broken link or impersonation?{' '}
            <button
              onClick={() => setShowReport(true)}
              className="text-rose-600 hover:underline"
            >
              Report this page
            </button>
          </p>
        </div>
      </div>

      {/* Modals */}
      {showSupport && (
        <SupportModal
          creator={creator}
          methods={supportMethods}
          onClose={() => setShowSupport(false)}
        />
      )}
      {showClaim && (
        <ClaimModal
          creator={creator}
          onClose={() => setShowClaim(false)}
        />
      )}
      {showReport && (
        <ReportModal
          creator={creator}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
