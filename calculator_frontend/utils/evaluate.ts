export type Operator = '+' | '-' | '×' | '÷';

/**
 * PUBLIC_INTERFACE
 * evaluate
 * Safely evaluates a two-operand expression or normalizes a single value string.
 * - Limits precision to avoid floating-point artifacts.
 * - Trims trailing zeros and stray decimal points.
 * - Throws error on divide-by-zero.
 */
export function evaluate(a: string, b: string | null, op: Operator | null): string {
  const toNum = (s: string) => {
    if (s === '' || s === '.') return 0;
    return Number(s);
  };

  const trim = (s: string) => {
    if (!isFinite(Number(s))) return 'Error';
    if (s.includes('e') || s.includes('E')) return s; // scientific notation, display as is
    // limit to 12-14 significant digits, then trim trailing zeros
    const n = Number(s);
    const fixed = Math.round(n * 1e12) / 1e12;
    let out = fixed.toString();
    if (out.includes('.')) {
      out = out.replace(/\.?0+$/, '');
    }
    return out;
  };

  if (b == null || op == null) {
    // normalization of single value
    return trim(a);
  }

  const an = toNum(a);
  const bn = toNum(b);

  let result: number;
  switch (op) {
    case '+':
      result = an + bn;
      break;
    case '-':
      result = an - bn;
      break;
    case '×':
      result = an * bn;
      break;
    case '÷':
      if (bn === 0) {
        throw new Error('Divide by zero');
      }
      result = an / bn;
      break;
    default:
      result = bn;
      break;
  }

  // constrain magnitude and precision
  const capped = Math.abs(result) > 1e12 ? Number(result.toExponential(6)) : Math.round(result * 1e12) / 1e12;

  return trim(String(capped));
}
