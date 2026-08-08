export default function Skeleton({ className, bg = 'bg-gray-200/80' }) {
  return <div className={`animate-pulse rounded-md ${bg} ${className || ''}`} />;
}
