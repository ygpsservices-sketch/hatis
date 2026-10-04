import { Link } from '@/lib/router';
import { CATEGORIES } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse categories</h1>
        <p className="text-slate-500 mb-8">
          Find Haitian creators by what they do — from music and art to tech and education.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              to={`/discover?category=${encodeURIComponent(cat.value)}`}
              className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-200 hover:shadow-md transition-all"
            >
              <span className="w-14 h-14 rounded-xl bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors flex-shrink-0">
                <cat.icon className="w-7 h-7 text-slate-600 group-hover:text-rose-600 transition-colors" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {cat.label}
                </h3>
                <p className="text-sm text-slate-400">
                  Discover {cat.label.toLowerCase()} creators
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
