// Text wordmark in the display font; the "7" carries the brand accent.
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      Kuja<span className="text-brand">7</span>
      <span className="font-normal opacity-70">.lk</span>
    </span>
  )
}
