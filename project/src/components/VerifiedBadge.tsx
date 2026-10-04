import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-blue-600 font-medium"
      title="Hatis verified creator"
    >
      <BadgeCheck style={{ width: size, height: size }} />
      <span className="text-sm">Verified</span>
    </span>
  );
}
