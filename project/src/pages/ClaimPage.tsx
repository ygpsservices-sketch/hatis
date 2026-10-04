import { useEffect } from 'react';
import { useRouter } from '@/lib/router';

export default function ClaimPage() {
  const { navigate } = useRouter();

  useEffect(() => {
    navigate('/signup');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );
}
