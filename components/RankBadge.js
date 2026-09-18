import Image from 'next/image';
import { rankBadgeSrc } from '@/lib/ranks';

export default function RankBadge({ rank, size = 34 }) {
  return (
    <Image
      className="rank-badge"
      src={rankBadgeSrc(rank)}
      alt={rank.name}
      title={rank.name}
      width={size}
      height={size}
    />
  );
}
