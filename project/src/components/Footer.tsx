import { Link } from '@/lib/router';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold text-white">Hatis</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              A discovery and support home for Haitian creators. Find artists,
              storytellers, educators, comedians, builders, and musicians shaping
              Haitian culture — at home and across the diaspora.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/discover" className="hover:text-white transition-colors">
                  Discover creators
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Browse categories
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Claim your page
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">About</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-400">Our mission</li>
              <li className="text-slate-400">How support works</li>
              <li className="text-slate-400">Verification</li>
              <li className="text-slate-400">Contact</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Hatis. Built for the Haitian community.
          </p>
          <p className="text-xs text-slate-500">
            Hatis never holds your money. Support goes directly to creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
