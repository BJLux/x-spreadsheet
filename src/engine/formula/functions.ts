type FormulaFn = (...args: unknown[]) => unknown;

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  if (typeof v === 'boolean') return v ? 1 : 0;
  return 0;
}

function flattenArgs(args: unknown[]): unknown[] {
  const result: unknown[] = [];
  for (const a of args) {
    if (Array.isArray(a)) {
      result.push(...flattenArgs(a));
    } else {
      result.push(a);
    }
  }
  return result;
}

function numericArgs(args: unknown[]): number[] {
  return flattenArgs(args)
    .filter((v) => v !== '' && v !== null && v !== undefined)
    .map(toNumber);
}

const SUM: FormulaFn = (...args) => {
  return numericArgs(args).reduce((a, b) => a + b, 0);
};

const AVERAGE: FormulaFn = (...args) => {
  const nums = numericArgs(args);
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
};

const MAX: FormulaFn = (...args) => {
  const nums = numericArgs(args);
  return nums.length === 0 ? 0 : Math.max(...nums);
};

const MIN: FormulaFn = (...args) => {
  const nums = numericArgs(args);
  return nums.length === 0 ? 0 : Math.min(...nums);
};

const COUNT: FormulaFn = (...args) => {
  return numericArgs(args).length;
};

const COUNTA: FormulaFn = (...args) => {
  return flattenArgs(args).filter((v) => v !== '' && v !== null && v !== undefined).length;
};

const ABS: FormulaFn = (v) => Math.abs(toNumber(v));

const ROUND: FormulaFn = (v, decimals) => {
  const d = toNumber(decimals);
  const factor = Math.pow(10, d);
  return Math.round(toNumber(v) * factor) / factor;
};

const ROUNDUP: FormulaFn = (v, decimals) => {
  const d = toNumber(decimals);
  const factor = Math.pow(10, d);
  return Math.ceil(toNumber(v) * factor) / factor;
};

const ROUNDDOWN: FormulaFn = (v, decimals) => {
  const d = toNumber(decimals);
  const factor = Math.pow(10, d);
  return Math.floor(toNumber(v) * factor) / factor;
};

const IF: FormulaFn = (condition, trueVal, falseVal) => {
  return condition ? trueVal : falseVal;
};

const IFERROR: FormulaFn = (value, fallback) => {
  if (value instanceof Error || value === '#ERROR!' || value === '#REF!' || value === '#DIV/0!') {
    return fallback;
  }
  return value;
};

const ISBLANK: FormulaFn = (v) => v === '' || v === null || v === undefined;

const ISERROR: FormulaFn = (v) => v instanceof Error || v === '#ERROR!' || v === '#REF!' || v === '#DIV/0!';

const AND: FormulaFn = (...args) => flattenArgs(args).every(Boolean);

const OR: FormulaFn = (...args) => flattenArgs(args).some(Boolean);

const NOT: FormulaFn = (v) => !v;

const CONCATENATE: FormulaFn = (...args) => flattenArgs(args).map(String).join('');

const LEFT: FormulaFn = (text, count) => String(text || '').slice(0, toNumber(count) || 1);

const RIGHT: FormulaFn = (text, count) => {
  const s = String(text || '');
  const n = toNumber(count) || 1;
  return s.slice(Math.max(0, s.length - n));
};

const MID: FormulaFn = (text, start, count) => {
  return String(text || '').substr(toNumber(start) - 1, toNumber(count));
};

const TEXT: FormulaFn = (value, format) => {
  const num = toNumber(value);
  const fmt = String(format || '');
  if (fmt.includes('#,##0')) {
    const decimals = (fmt.match(/0+$/) || [''])[0].length;
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return String(num);
};

const TODAY: FormulaFn = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const NOW: FormulaFn = () => new Date().toISOString();

const YEAR: FormulaFn = (v) => new Date(String(v)).getFullYear();
const MONTH: FormulaFn = (v) => new Date(String(v)).getMonth() + 1;
const DAY: FormulaFn = (v) => new Date(String(v)).getDate();

const SUMIF: FormulaFn = (range, criteria, sumRange) => {
  const r = Array.isArray(range) ? range : [range];
  const sr = Array.isArray(sumRange) ? sumRange : r;
  const crit = String(criteria);
  let total = 0;
  for (let i = 0; i < r.length; i++) {
    if (matchCriteria(r[i], crit)) {
      total += toNumber(sr[i] ?? 0);
    }
  }
  return total;
};

const COUNTIF: FormulaFn = (range, criteria) => {
  const r = Array.isArray(range) ? range : [range];
  const crit = String(criteria);
  let count = 0;
  for (const v of r) {
    if (matchCriteria(v, crit)) count++;
  }
  return count;
};

function matchCriteria(value: unknown, criteria: string): boolean {
  if (criteria.startsWith('>=')) return toNumber(value) >= toNumber(criteria.slice(2));
  if (criteria.startsWith('<=')) return toNumber(value) <= toNumber(criteria.slice(2));
  if (criteria.startsWith('<>')) return String(value) !== criteria.slice(2);
  if (criteria.startsWith('>')) return toNumber(value) > toNumber(criteria.slice(1));
  if (criteria.startsWith('<')) return toNumber(value) < toNumber(criteria.slice(1));
  if (criteria.startsWith('=')) return String(value) === criteria.slice(1);
  return String(value) === criteria;
}

export const FORMULA_REGISTRY: Record<string, FormulaFn> = {
  SUM, AVERAGE, MAX, MIN, COUNT, COUNTA,
  ABS, ROUND, ROUNDUP, ROUNDDOWN,
  IF, IFERROR, ISBLANK, ISERROR,
  AND, OR, NOT,
  CONCATENATE, LEFT, RIGHT, MID, TEXT,
  TODAY, NOW, YEAR, MONTH, DAY,
  SUMIF, COUNTIF,
};
