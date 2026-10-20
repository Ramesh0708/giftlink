export default function ThemeDecor({ theme }: { theme: string }) {
  if (theme === 'diwali') {
    return (
      <svg className="motif" viewBox="0 0 120 36" aria-hidden="true">
        <circle cx="60" cy="18" r="5" fill="#c4551a" />
        <circle cx="42" cy="18" r="3" fill="#e39b2b" />
        <circle cx="78" cy="18" r="3" fill="#e39b2b" />
        <circle cx="28" cy="18" r="2" fill="#9b2226" />
        <circle cx="92" cy="18" r="2" fill="#9b2226" />
        <path d="M60 16 C60 10 64 8 60 3 C56 8 60 10 60 16 Z" fill="#e85d04" />
      </svg>
    )
  }
  if (theme === 'wedding') {
    return (
      <svg className="motif" viewBox="0 0 120 36" aria-hidden="true">
        <path d="M10 28 C20 10 36 8 46 20 C56 8 72 10 82 28" fill="none" stroke="#7a1f3d" strokeWidth="2" />
        <path d="M46 20 c6 6 14 6 20 0" fill="none" stroke="#b8860b" strokeWidth="2" />
        <circle cx="96" cy="16" r="4" fill="#b8860b" />
      </svg>
    )
  }
  if (theme === 'baby') {
    return (
      <svg className="motif" viewBox="0 0 120 36" aria-hidden="true">
        <circle cx="24" cy="18" r="6" fill="#f7c6d8" />
        <circle cx="48" cy="14" r="5" fill="#b7e0d4" />
        <circle cx="70" cy="20" r="7" fill="#c9d4f5" />
        <circle cx="96" cy="15" r="4" fill="#f6e3a1" />
      </svg>
    )
  }
  if (theme === 'birthday') {
    return (
      <svg className="motif" viewBox="0 0 120 40" aria-hidden="true">
        <ellipse cx="28" cy="16" rx="8" ry="10" fill="#e45b86" />
        <ellipse cx="58" cy="14" rx="8" ry="10" fill="#f2c14e" />
        <ellipse cx="88" cy="16" rx="8" ry="10" fill="#6aa8d6" />
        <path d="M28 26 v8 M58 24 v10 M88 26 v8" stroke="#5c4034" strokeWidth="1.4" />
      </svg>
    )
  }
  if (theme === 'housewarming') {
    return (
      <svg className="motif" viewBox="0 0 120 36" aria-hidden="true">
        <path d="M8 8 h104" stroke="#b85c38" strokeWidth="2" />
        <path d="M20 8 l6 14 h-12 z M44 8 l6 14 h-12 z M68 8 l6 14 h-12 z M92 8 l6 14 h-12 z" fill="#d4784a" />
      </svg>
    )
  }
  if (theme === 'santa') {
    return (
      <svg className="motif" viewBox="0 0 120 36" aria-hidden="true">
        <path d="M60 6 v24 M48 12 l24 12 M48 24 l24 -12" stroke="#1f6b45" strokeWidth="2" />
        <circle cx="60" cy="18" r="3" fill="#b4232a" />
      </svg>
    )
  }
  return null
}
