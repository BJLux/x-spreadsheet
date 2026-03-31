import { FORMULA_REGISTRY } from './functions';

export type CellGetter = (row: number, col: number) => string;

export function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColumn(index: number): string {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

interface CellRef {
  col: number;
  row: number;
}

function parseCellRef(ref: string): CellRef | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    col: columnToIndex(match[1]),
    row: parseInt(match[2], 10) - 1,
  };
}

function parseRange(range: string): { start: CellRef; end: CellRef } | null {
  const parts = range.split(':');
  if (parts.length !== 2) return null;
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return null;
  return { start, end };
}

function resolveRange(range: string, getCellValue: CellGetter): unknown[] {
  const parsed = parseRange(range);
  if (!parsed) return [];
  const values: unknown[] = [];
  for (let r = parsed.start.row; r <= parsed.end.row; r++) {
    for (let c = parsed.start.col; c <= parsed.end.col; c++) {
      const v = getCellValue(r, c);
      const num = parseFloat(v);
      values.push(isNaN(num) ? v : num);
    }
  }
  return values;
}

interface Token {
  type: 'function' | 'ref' | 'range' | 'number' | 'string' | 'operator' | 'paren' | 'comma' | 'boolean';
  value: string;
}

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];

    if (ch === ' ') {
      i++;
      continue;
    }

    if (ch === '"') {
      let str = '';
      i++;
      while (i < formula.length && formula[i] !== '"') {
        str += formula[i];
        i++;
      }
      i++;
      tokens.push({ type: 'string', value: str });
      continue;
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }

    if ('+-*/<>=&'.includes(ch)) {
      let op = ch;
      if (i + 1 < formula.length && (formula[i + 1] === '=' || (ch === '<' && formula[i + 1] === '>'))) {
        op += formula[i + 1];
        i++;
      }
      tokens.push({ type: 'operator', value: op });
      i++;
      continue;
    }

    if (/\d/.test(ch) || (ch === '.' && i + 1 < formula.length && /\d/.test(formula[i + 1]))) {
      let num = '';
      while (i < formula.length && /[\d.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    if (/[A-Z]/i.test(ch)) {
      let word = '';
      while (i < formula.length && /[A-Za-z0-9_$:]/.test(formula[i])) {
        word += formula[i];
        i++;
      }

      const upper = word.toUpperCase();

      if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'boolean', value: upper });
      } else if (word.includes(':')) {
        tokens.push({ type: 'range', value: upper });
      } else if (i < formula.length && formula[i] === '(') {
        tokens.push({ type: 'function', value: upper });
      } else if (/^[A-Z]+\d+$/.test(upper)) {
        tokens.push({ type: 'ref', value: upper });
      } else {
        tokens.push({ type: 'string', value: word });
      }
      continue;
    }

    i++;
  }

  return tokens;
}

function evaluateTokens(tokens: Token[], getCellValue: CellGetter): unknown {
  let pos = 0;

  function parseExpression(): unknown {
    let left = parseComparison();

    while (pos < tokens.length && tokens[pos]?.type === 'operator' && (tokens[pos].value === '+' || tokens[pos].value === '-' || tokens[pos].value === '&')) {
      const op = tokens[pos].value;
      pos++;
      const right = parseComparison();
      if (op === '+') left = (left as number) + (right as number);
      else if (op === '-') left = (left as number) - (right as number);
      else if (op === '&') left = String(left) + String(right);
    }

    return left;
  }

  function parseComparison(): unknown {
    let left = parseTerm();

    while (pos < tokens.length && tokens[pos]?.type === 'operator' && ['=', '<>', '<', '>', '<=', '>='].includes(tokens[pos].value)) {
      const op = tokens[pos].value;
      pos++;
      const right = parseTerm();
      const l = left as number;
      const r = right as number;
      if (op === '=') left = l === r;
      else if (op === '<>') left = l !== r;
      else if (op === '<') left = l < r;
      else if (op === '>') left = l > r;
      else if (op === '<=') left = l <= r;
      else if (op === '>=') left = l >= r;
    }

    return left;
  }

  function parseTerm(): unknown {
    let left = parseFactor();

    while (pos < tokens.length && tokens[pos]?.type === 'operator' && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
      const op = tokens[pos].value;
      pos++;
      const right = parseFactor();
      if (op === '*') left = (left as number) * (right as number);
      else if (op === '/') {
        const d = right as number;
        if (d === 0) return '#DIV/0!';
        left = (left as number) / d;
      }
    }

    return left;
  }

  function parseFactor(): unknown {
    if (pos >= tokens.length) return 0;
    const token = tokens[pos];

    if (token.type === 'number') {
      pos++;
      return parseFloat(token.value);
    }

    if (token.type === 'string') {
      pos++;
      return token.value;
    }

    if (token.type === 'boolean') {
      pos++;
      return token.value === 'TRUE';
    }

    if (token.type === 'operator' && token.value === '-') {
      pos++;
      return -(parseFactor() as number);
    }

    if (token.type === 'paren' && token.value === '(') {
      pos++;
      const result = parseExpression();
      if (pos < tokens.length && tokens[pos]?.value === ')') pos++;
      return result;
    }

    if (token.type === 'ref') {
      pos++;
      const ref = parseCellRef(token.value);
      if (!ref) return '#REF!';
      const val = getCellValue(ref.row, ref.col);
      const num = parseFloat(val);
      return isNaN(num) ? val : num;
    }

    if (token.type === 'range') {
      pos++;
      return resolveRange(token.value, getCellValue);
    }

    if (token.type === 'function') {
      const fnName = token.value;
      pos++;
      if (pos < tokens.length && tokens[pos]?.value === '(') pos++;

      const args: unknown[] = [];
      while (pos < tokens.length && tokens[pos]?.value !== ')') {
        if (tokens[pos]?.type === 'comma') {
          pos++;
          continue;
        }
        args.push(parseExpression());
      }
      if (pos < tokens.length && tokens[pos]?.value === ')') pos++;

      const fn = FORMULA_REGISTRY[fnName];
      if (!fn) return '#NAME?';

      try {
        return fn(...args);
      } catch {
        return '#ERROR!';
      }
    }

    pos++;
    return 0;
  }

  return parseExpression();
}

export function evaluateFormula(formula: string, getCellValue: CellGetter): string {
  if (!formula || !formula.startsWith('=')) return formula;

  try {
    const expression = formula.slice(1).trim();
    const tokens = tokenize(expression);
    const result = evaluateTokens(tokens, getCellValue);
    if (result === null || result === undefined) return '';
    return String(result);
  } catch {
    return '#ERROR!';
  }
}
