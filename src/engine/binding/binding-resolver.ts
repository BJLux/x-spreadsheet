import type { BravaDocument, TableBlock } from '../../types/document';
import type { CellBinding } from '../../types/table';

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalance {
  id: string;
  entityId: string;
  financialYear: string;
  lines: TrialBalanceLine[];
}

export interface EntityInfo {
  id: string;
  name: string;
  legalForm: string;
  rcsNumber: string;
  address: string;
  incorporationDate: string;
  shareCapital: number;
  currency: string;
}

export interface PCNMapping {
  pcnCode: string;
  pcnLabel: string;
  accountCodes: string[];
}

export interface BindingContext {
  trialBalance: TrialBalance | null;
  entity: EntityInfo | null;
  pcnMappings: PCNMapping[];
}

function resolveTrialBalanceBinding(binding: CellBinding, tb: TrialBalance): string {
  if (binding.overridden) return binding.overrideValue;

  const { field, sourceId } = binding;

  if (field === 'balance') {
    const line = tb.lines.find(l => l.accountCode === sourceId);
    return line ? String(line.balance) : '0';
  }

  if (field === 'debit') {
    const line = tb.lines.find(l => l.accountCode === sourceId);
    return line ? String(line.debit) : '0';
  }

  if (field === 'credit') {
    const line = tb.lines.find(l => l.accountCode === sourceId);
    return line ? String(line.credit) : '0';
  }

  if (field === 'sum-balance') {
    const codes = sourceId.split(',').map(s => s.trim());
    const total = tb.lines
      .filter(l => codes.includes(l.accountCode))
      .reduce((sum, l) => sum + l.balance, 0);
    return String(total);
  }

  if (field === 'range-balance') {
    const [start, end] = sourceId.split('-').map(s => s.trim());
    const total = tb.lines
      .filter(l => l.accountCode >= start && l.accountCode <= end)
      .reduce((sum, l) => sum + l.balance, 0);
    return String(total);
  }

  return '0';
}

function resolvePCNBinding(binding: CellBinding, pcnMappings: PCNMapping[], tb: TrialBalance | null): string {
  if (binding.overridden) return binding.overrideValue;
  if (!tb) return '#NO_TB';

  const mapping = pcnMappings.find(m => m.pcnCode === binding.sourceId);
  if (!mapping) return '#NO_PCN';

  const total = tb.lines
    .filter(l => mapping.accountCodes.includes(l.accountCode))
    .reduce((sum, l) => sum + l.balance, 0);

  return String(total);
}

function resolveEntityBinding(binding: CellBinding, entity: EntityInfo | null): string {
  if (binding.overridden) return binding.overrideValue;
  if (!entity) return '#NO_ENTITY';

  const { field } = binding;
  switch (field) {
    case 'name': return entity.name;
    case 'legalForm': return entity.legalForm;
    case 'rcsNumber': return entity.rcsNumber;
    case 'address': return entity.address;
    case 'incorporationDate': return entity.incorporationDate;
    case 'shareCapital': return String(entity.shareCapital);
    case 'currency': return entity.currency;
    default: return '';
  }
}

export function resolveBindings(doc: BravaDocument, context: BindingContext): BravaDocument {
  for (const section of doc.sections) {
    for (const block of section.blocks) {
      if (block.type !== 'table') continue;
      const tableBlock = block as TableBlock;

      for (const row of tableBlock.table.rows) {
        for (const cell of row.cells) {
          if (!cell.binding) continue;

          switch (cell.binding.source) {
            case 'trial-balance':
              if (context.trialBalance) {
                cell.value = resolveTrialBalanceBinding(cell.binding, context.trialBalance);
                cell.computedValue = cell.value;
              }
              break;

            case 'pcn':
              cell.value = resolvePCNBinding(cell.binding, context.pcnMappings, context.trialBalance);
              cell.computedValue = cell.value;
              break;

            case 'entity':
              cell.value = resolveEntityBinding(cell.binding, context.entity);
              cell.computedValue = cell.value;
              break;

            case 'statement':
            case 'note':
            case 'other-table':
              break;
          }
        }
      }
    }
  }

  return doc;
}
