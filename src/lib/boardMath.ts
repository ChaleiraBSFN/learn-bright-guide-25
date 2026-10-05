/** Make older AI notation readable without evaluating or changing the mathematics. */
export function readableBoardMath(value: string): string {
  let text = value.replace(/\$\$?/g, '').replace(/\\[()[\]]/g, '');
  text = text.replace(/\\(?:left|right)\b/g, '');
  text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) ÷ ($2)');
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  text = text.replace(/\\(?:cdot|times)\b/g, ' × ').replace(/\\div\b/g, ' ÷ ');
  text = text.replace(/\\(?:leq|le)\b/g, ' ≤ ').replace(/\\(?:geq|ge)\b/g, ' ≥ ');
  text = text.replace(/\\(?:pi|theta|alpha|beta|Delta)\b/g, (_, symbol: string) => ({ pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', Delta: 'Δ' })[symbol] ?? symbol);
  text = text.replace(/\^\{?([0-9n+-]+)\}?/g, (_, power: string) => [...power].map(c => ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', n: 'ⁿ', '+': '⁺', '-': '⁻' })[c] ?? c).join(''));
  text = text.replace(/\\(?:text|mathrm)\{([^{}]+)\}/g, '$1');
  return text.replace(/\*\*/g, '').replace(/[ \t]{2,}/g, ' ').trim();
}

export function isBoardEquation(line: string): boolean {
  const trimmed = line.trim();
  return /[=≈≤≥]/.test(trimmed) && /[\d+×÷√²³ⁿ()+−-]|[a-zA-Z]\s*=/.test(trimmed) && trimmed.length < 180;
}