import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Creator } from '@/types';
import CreatorCard from '@/components/CreatorCard';
import { CATEGORIES } from '@/lib/constants';
import { ArrowRight, Heart, Shield, Globe, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [featured, setFeatured] = useState<Creator[]>([]);
  const [newest, setNewest] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: featuredData }, { data: newestData }] = await Promise.all([
        supabase
          .from('creators')
          .select('*')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setFeatured(featuredData || []);
      setNewest(newestData || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-rose-50/30 to-orange-50/20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 mb-6">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-slate-700">
                Built for Haitian creators, at home and in the diaspora
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Discover and support{' '}
              <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                Haitian creators
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
              Find artists, storytellers, educators, comedians, builders, and
              musicians shaping Haitian culture — at home and across the diaspora.
              Support them directly, using the payment methods they already trust.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg"
              >
                Explore creators
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Claim your creator page
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Direct support, no middleman
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Verified creator badges
              </span>
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-500" />
                Haiti + diaspora
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Browse by category</h2>
          <Link
            to="/categories"
            className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            All categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.slice(0, 10).map((cat) => (
            <Link
              key={cat.value}
              to={`/discover?category=${encodeURIComponent(cat.value)}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-200 hover:bg-rose-50/50 transition-all"
            >
              <span className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                <cat.icon className="w-6 h-6 text-slate-600 group-hover:text-rose-600 transition-colors" />
              </span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-rose-700">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured creators */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured creators</h2>
            <p className="text-sm text-slate-500 mt-1">
              Hand-picked Haitian creators making an impact
            </p>
          </div>
          <Link
            to="/discover"
            className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 whitespace-nowrap"
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((creator) => (
              <CreatorCardWithMethods key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-white mb-2">How Hatis works</h2>
          <p className="text-slate-400 mb-8">
            Three simple steps to discover and support Haitian creators
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HowItWorksStep
              number="01"
              title="Discover"
              description="Browse the directory by category, location, or language. Find creators you love."
            />
            <HowItWorksStep
              number="02"
              title="Follow their work"
              description="Visit their profile to see social links, featured content, and what they're building."
            />
            <HowItWorksStep
              number="03"
              title="Support directly"
              description="Choose a payment method — MonCash, PayPal, Cash App, and more. Your support goes straight to the creator."
            />
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Hatis never holds your money.</span>{' '}
              When you support a creator, you pay them directly through their own
              payment account. Hatis is a discovery platform, not a payment processor.
            </p>
          </div>
        </div>
      </section>

      {/* Newest creators */}
      {!loading && newest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">New on Hatis</h2>
            <Link
              to="/discover"
              className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 whitespace-nowrap"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newest.slice(0, 4).map((creator) => (
              <CreatorCardWithMethods key={creator.id} creator={creator} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Are you a Haitian creator?
          </h2>
          <p className="text-white/90 max-w-xl mx-auto mb-6">
            Claim your free Hatis page. Add your links, your work, and your support
            methods. Share it in your bio and let fans find and support you.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-all hover:shadow-lg"
          >
            Claim your creator page
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
      <span className="text-3xl font-bold text-white/20">{number}</span>
      <h3 className="text-lg font-semibold text-white mt-2 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function CreatorCardWithMethods({ creator }: { creator: Creator }) {
  const [methodTypes, setMethodTypes] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('support_methods')
        .select('method_type')
        .eq('creator_id', creator.id);
      setMethodTypes((data || []).map((d) => d.method_type));
    }
    load();
  }, [creator.id]);

  return (
    <CreatorCard
      creator={creator}
      supportMethodCount={methodTypes.length}
      supportMethodTypes={methodTypes}
    />
  );
}
