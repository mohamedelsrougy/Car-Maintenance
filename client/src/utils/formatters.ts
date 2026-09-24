const ARABIC_LETTER_MAP: Record<string, string> = {
  A: 'أ', B: 'ب', C: 'س', D: 'د', E: 'ي', F: 'ف', G: 'ج', H: 'ه', I: 'إ', J: 'ي', K: 'ك', L: 'ل', M: 'م', N: 'ن', O: 'ع', P: 'ب', Q: 'ق', R: 'ر', S: 'س', T: 'ت', U: 'و', V: 'ف', W: 'و', X: 'ك', Y: 'ي', Z: 'ز',
};

export function formatPlateNumber(value?: string) {
  if (!value) return '—';

  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!cleaned) return '—';

  const digits = cleaned.replace(/[^0-9]/g, '');
  const letters = cleaned.replace(/[^A-Za-z]/g, '');

  const arabicLetters = letters
    .split('')
    .map((letter) => ARABIC_LETTER_MAP[letter] ?? letter)
    .filter(Boolean);

  if (!arabicLetters.length && !digits) return '—';

  const letterText = arabicLetters.length ? arabicLetters.join(' ') : '';
  return digits && letterText ? `${digits} ${letterText}` : digits || letterText;
}

export function formatEGP(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
