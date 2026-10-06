type Props = {
  value: number
}

export default function AnimatedCounter({ value }: Props) {
  const formatted = Math.max(0, Math.round(value)).toLocaleString('en-IN')
  const chars = formatted.split('')

  return (
    <span className="counter" aria-label={formatted}>
      {chars.map((char, index) => {
        if (!/\d/.test(char)) {
          return (
            <span className="counter-sep" key={`sep-${index}`}>
              {char}
            </span>
          )
        }
        return (
          <span className="counter-digit" key={`d-${chars.length - index}`} aria-hidden="true">
            <span style={{ transform: `translateY(-${Number(char)}em)` }}>
              {'0123456789'.split('').map((digit) => (
                <span key={digit}>{digit}</span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}
