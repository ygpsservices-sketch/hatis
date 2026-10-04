import { Link } from '@/lib/router';
import type { Creator } from '@/types';
import { getSupportMethodSummary } from '@/lib/utils';
import { BadgeCheck, MapPin } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

interface CreatorCardProps {
  creator: Creator;
  supportMethodCount?: number;
  supportMethodTypes?: string[];
}

export default function CreatorCard({
  creator,
  supportMethodCount = 0,
  supportMethodTypes = [],
}: CreatorCardProps) {
  const categoryInfo = CATEGORIES.find((c) => c.value === creator.category);
  const Icon = categoryInfo?.icon;

  return (
    <Link
      to={`/creator/${creator.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-4xl font-bold text-slate-400">
              {creator.name.charAt(0)}
            </span>
          </div>
        )}
        {creator.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-rose-500 text-white text-xs font-semibold rounded-full shadow-sm">
            Featured
          </span>
        )}
        {creator.verified && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold rounded-full shadow-sm">
            <BadgeCheck className="w-3.5 h-3.5" />
            Verified
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
            {creator.name}
          </h3>
          {Icon && (
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Icon className="w-4 h-4" />
            </span>
          )}
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
          {creator.tagline || 'Haitian creator'}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          {creator.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {creator.location}
            </span>
          )}
          {supportMethodCount > 0 && supportMethodTypes.length > 0 && (
            <span className="text-slate-400">
              {getSupportMethodSummary(supportMethodTypes.map((t) => ({ method_type: t })))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
