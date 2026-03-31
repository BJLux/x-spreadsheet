import type { BravaDocument } from '../types/document';
import type { CellStyle, TableCell, TableRow, TableCol } from '../types/table';

let idCounter = 0;
function id(): string {
  return `id-${++idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStyle(overrides: Partial<CellStyle> = {}): CellStyle {
  return {
    fontFamily: '',
    fontSize: 11,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    color: '#1a1a1a',
    backgroundColor: '',
    align: 'left',
    valign: 'middle',
    textWrap: false,
    numberFormat: '',
    borderTop: null,
    borderRight: null,
    borderBottom: null,
    borderLeft: null,
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
    ...overrides,
  };
}

function cell(value: string, styleOverrides: Partial<CellStyle> = {}, formula = ''): TableCell {
  return {
    id: id(),
    value,
    formula,
    computedValue: '',
    style: defaultStyle(styleOverrides),
    merge: null,
    binding: null,
    locked: false,
  };
}

function headerCell(value: string, width?: number): TableCell {
  return cell(value, {
    bold: true,
    backgroundColor: '#1e3a5f',
    color: '#ffffff',
    align: 'center',
    fontSize: 10,
    borderBottom: { style: 'medium', color: '#0f2b46' },
  });
}

function numCell(value: string, format = '#,##0'): TableCell {
  return cell(value, {
    align: 'right',
    numberFormat: format,
    borderBottom: { style: 'thin', color: '#e2e5e9' },
  });
}

function labelCell(value: string, bold = false, indent = 0): TableCell {
  return cell(value, {
    bold,
    paddingLeft: 4 + indent * 16,
    borderBottom: { style: 'thin', color: '#e2e5e9' },
  });
}

function totalCell(value: string, format = '#,##0'): TableCell {
  return cell(value, {
    bold: true,
    align: 'right',
    numberFormat: format,
    borderTop: { style: 'medium', color: '#1e3a5f' },
    borderBottom: { style: 'thick', color: '#1e3a5f' },
    backgroundColor: '#f0f4f8',
  });
}

function totalLabelCell(value: string): TableCell {
  return cell(value, {
    bold: true,
    borderTop: { style: 'medium', color: '#1e3a5f' },
    borderBottom: { style: 'thick', color: '#1e3a5f' },
    backgroundColor: '#f0f4f8',
  });
}

function makeRow(cells: TableCell[], height = 28, isHeader = false): TableRow {
  return { id: id(), height, hidden: false, isHeader, cells };
}

function makeCols(widths: number[]): TableCol[] {
  return widths.map(w => ({ id: id(), width: w, hidden: false }));
}

export function createSampleDocument(): BravaDocument {
  const balanceSheetCols = makeCols([240, 100, 120, 120]);

  const balanceSheetRows: TableRow[] = [
    makeRow([
      headerCell(''),
      headerCell('Note'),
      headerCell('31/12/2025'),
      headerCell('31/12/2024'),
    ], 32, true),
    makeRow([
      labelCell('ASSETS', true),
      cell(''),
      cell(''),
      cell(''),
    ], 30),
    makeRow([
      labelCell('Fixed assets', true),
      cell(''),
      cell(''),
      cell(''),
    ]),
    makeRow([
      labelCell('Intangible assets', false, 1),
      cell('3', { align: 'center' }),
      numCell('125000'),
      numCell('98000'),
    ]),
    makeRow([
      labelCell('Tangible assets', false, 1),
      cell('4', { align: 'center' }),
      numCell('2450000'),
      numCell('2680000'),
    ]),
    makeRow([
      labelCell('Financial assets', false, 1),
      cell('5', { align: 'center' }),
      numCell('890000'),
      numCell('750000'),
    ]),
    makeRow([
      totalLabelCell('Total fixed assets'),
      cell('', { borderTop: { style: 'medium', color: '#1e3a5f' }, borderBottom: { style: 'thick', color: '#1e3a5f' }, backgroundColor: '#f0f4f8' }),
      totalCell('3465000'),
      totalCell('3528000'),
    ]),
    makeRow([cell(''), cell(''), cell(''), cell('')], 12),
    makeRow([
      labelCell('Current assets', true),
      cell(''),
      cell(''),
      cell(''),
    ]),
    makeRow([
      labelCell('Inventories', false, 1),
      cell('6', { align: 'center' }),
      numCell('340000'),
      numCell('295000'),
    ]),
    makeRow([
      labelCell('Trade receivables', false, 1),
      cell('7', { align: 'center' }),
      numCell('1250000'),
      numCell('1180000'),
    ]),
    makeRow([
      labelCell('Cash at bank and in hand', false, 1),
      cell('8', { align: 'center' }),
      numCell('890000'),
      numCell('720000'),
    ]),
    makeRow([
      totalLabelCell('Total current assets'),
      cell('', { borderTop: { style: 'medium', color: '#1e3a5f' }, borderBottom: { style: 'thick', color: '#1e3a5f' }, backgroundColor: '#f0f4f8' }),
      totalCell('2480000'),
      totalCell('2195000'),
    ]),
    makeRow([cell(''), cell(''), cell(''), cell('')], 16),
    makeRow([
      totalLabelCell('TOTAL ASSETS'),
      cell('', { borderTop: { style: 'medium', color: '#1e3a5f' }, borderBottom: { style: 'thick', color: '#1e3a5f' }, backgroundColor: '#f0f4f8', bold: true }),
      totalCell('5945000'),
      totalCell('5723000'),
    ]),
  ];

  const plCols = makeCols([260, 100, 120, 120]);

  const plRows: TableRow[] = [
    makeRow([
      headerCell(''),
      headerCell('Note'),
      headerCell('31/12/2025'),
      headerCell('31/12/2024'),
    ], 32, true),
    makeRow([
      labelCell('Net turnover', true),
      cell('12', { align: 'center' }),
      numCell('8500000'),
      numCell('7800000'),
    ]),
    makeRow([
      labelCell('Other operating income', false),
      cell('13', { align: 'center' }),
      numCell('150000'),
      numCell('120000'),
    ]),
    makeRow([
      labelCell('Raw materials and consumables', false),
      cell('', { align: 'center' }),
      numCell('-3200000'),
      numCell('-2900000'),
    ]),
    makeRow([
      labelCell('Staff costs', false),
      cell('14', { align: 'center' }),
      numCell('-2800000'),
      numCell('-2600000'),
    ]),
    makeRow([
      labelCell('Depreciation and amortisation', false),
      cell('15', { align: 'center' }),
      numCell('-450000'),
      numCell('-420000'),
    ]),
    makeRow([
      labelCell('Other operating expenses', false),
      cell('', { align: 'center' }),
      numCell('-680000'),
      numCell('-620000'),
    ]),
    makeRow([
      totalLabelCell('Operating profit'),
      cell('', { borderTop: { style: 'medium', color: '#1e3a5f' }, borderBottom: { style: 'thick', color: '#1e3a5f' }, backgroundColor: '#f0f4f8' }),
      totalCell('1520000'),
      totalCell('1380000'),
    ]),
    makeRow([cell(''), cell(''), cell(''), cell('')], 12),
    makeRow([
      labelCell('Financial income', false),
      cell('16', { align: 'center' }),
      numCell('35000'),
      numCell('28000'),
    ]),
    makeRow([
      labelCell('Financial expenses', false),
      cell('16', { align: 'center' }),
      numCell('-120000'),
      numCell('-95000'),
    ]),
    makeRow([
      totalLabelCell('Profit before tax'),
      cell('', { borderTop: { style: 'medium', color: '#1e3a5f' }, borderBottom: { style: 'thick', color: '#1e3a5f' }, backgroundColor: '#f0f4f8' }),
      totalCell('1435000'),
      totalCell('1313000'),
    ]),
    makeRow([
      labelCell('Income tax expense', false),
      cell('17', { align: 'center' }),
      numCell('-358750'),
      numCell('-328250'),
    ]),
    makeRow([cell(''), cell(''), cell(''), cell('')], 8),
    makeRow([
      totalLabelCell('PROFIT FOR THE FINANCIAL YEAR'),
      cell('', { borderTop: { style: 'medium', color: '#1e3a5f' }, borderBottom: { style: 'thick', color: '#1e3a5f' }, backgroundColor: '#f0f4f8', bold: true }),
      totalCell('1076250'),
      totalCell('984750'),
    ]),
  ];

  return {
    id: id(),
    title: 'Annual Accounts 2025',
    entityId: 'acme-luxembourg-sarl',
    financialYear: '2025',
    currency: 'EUR',
    language: 'en',
    sections: [
      {
        id: id(),
        title: 'Balance Sheet',
        collapsed: false,
        orientation: 'portrait',
        margins: { top: 25, right: 20, bottom: 25, left: 20 },
        numberingStyle: 'arabic',
        numberingStart: 1,
        headerFooter: {
          header: { left: 'ACME Luxembourg S.a r.l.', center: '', right: 'Annual Accounts 2025' },
          footer: { left: '', center: 'Balance Sheet', right: '' },
          showOnFirstPage: true,
        },
        blocks: [
          {
            id: id(),
            type: 'text',
            pageBreakBefore: false,
            keepWithNext: true,
            spacingBefore: 0,
            spacingAfter: 16,
            content: [{
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 4,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: 'BALANCE SHEET',
                bold: true,
                italic: false,
                underline: false,
                strikethrough: false,
                fontSize: 16,
                fontFamily: '',
                color: '#1e3a5f',
                superscript: false,
                subscript: false,
              }],
            }, {
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 0,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: 'as at 31 December 2025',
                bold: false,
                italic: true,
                underline: false,
                strikethrough: false,
                fontSize: 11,
                fontFamily: '',
                color: '#4b5563',
                superscript: false,
                subscript: false,
              }],
            }, {
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 0,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: '(expressed in EUR)',
                bold: false,
                italic: true,
                underline: false,
                strikethrough: false,
                fontSize: 10,
                fontFamily: '',
                color: '#6b7280',
                superscript: false,
                subscript: false,
              }],
            }],
          },
          {
            id: id(),
            type: 'table',
            pageBreakBefore: false,
            keepWithNext: false,
            spacingBefore: 8,
            spacingAfter: 8,
            table: {
              id: id(),
              rows: balanceSheetRows,
              cols: balanceSheetCols,
              merges: [],
              repeatHeaderRows: 1,
              showBanding: false,
              bandingColor: '#f8fafc',
            },
          },
        ],
      },
      {
        id: id(),
        title: 'Profit and Loss Account',
        collapsed: false,
        orientation: 'portrait',
        margins: { top: 25, right: 20, bottom: 25, left: 20 },
        numberingStyle: 'arabic',
        numberingStart: 1,
        headerFooter: {
          header: { left: 'ACME Luxembourg S.a r.l.', center: '', right: 'Annual Accounts 2025' },
          footer: { left: '', center: 'Profit and Loss Account', right: '' },
          showOnFirstPage: true,
        },
        blocks: [
          {
            id: id(),
            type: 'text',
            pageBreakBefore: false,
            keepWithNext: true,
            spacingBefore: 0,
            spacingAfter: 16,
            content: [{
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 4,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: 'PROFIT AND LOSS ACCOUNT',
                bold: true,
                italic: false,
                underline: false,
                strikethrough: false,
                fontSize: 16,
                fontFamily: '',
                color: '#1e3a5f',
                superscript: false,
                subscript: false,
              }],
            }, {
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 0,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: 'for the year ended 31 December 2025',
                bold: false,
                italic: true,
                underline: false,
                strikethrough: false,
                fontSize: 11,
                fontFamily: '',
                color: '#4b5563',
                superscript: false,
                subscript: false,
              }],
            }, {
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 0,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: '(expressed in EUR)',
                bold: false,
                italic: true,
                underline: false,
                strikethrough: false,
                fontSize: 10,
                fontFamily: '',
                color: '#6b7280',
                superscript: false,
                subscript: false,
              }],
            }],
          },
          {
            id: id(),
            type: 'table',
            pageBreakBefore: false,
            keepWithNext: false,
            spacingBefore: 8,
            spacingAfter: 8,
            table: {
              id: id(),
              rows: plRows,
              cols: plCols,
              merges: [],
              repeatHeaderRows: 1,
              showBanding: false,
              bandingColor: '#f8fafc',
            },
          },
        ],
      },
      {
        id: id(),
        title: 'Notes to the Accounts',
        collapsed: false,
        orientation: 'portrait',
        margins: { top: 25, right: 20, bottom: 25, left: 20 },
        numberingStyle: 'arabic',
        numberingStart: 1,
        headerFooter: {
          header: { left: 'ACME Luxembourg S.a r.l.', center: '', right: 'Annual Accounts 2025' },
          footer: { left: '', center: 'Notes to the Accounts', right: '' },
          showOnFirstPage: true,
        },
        blocks: [
          {
            id: id(),
            type: 'text',
            pageBreakBefore: false,
            keepWithNext: true,
            spacingBefore: 0,
            spacingAfter: 16,
            content: [{
              id: id(),
              alignment: 'center',
              lineSpacing: 1.4,
              spacingBefore: 0,
              spacingAfter: 8,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: 'NOTES TO THE ANNUAL ACCOUNTS',
                bold: true,
                italic: false,
                underline: false,
                strikethrough: false,
                fontSize: 16,
                fontFamily: '',
                color: '#1e3a5f',
                superscript: false,
                subscript: false,
              }],
            }],
          },
          {
            id: id(),
            type: 'text',
            pageBreakBefore: false,
            keepWithNext: false,
            spacingBefore: 8,
            spacingAfter: 12,
            content: [
              {
                id: id(),
                alignment: 'left',
                lineSpacing: 1.5,
                spacingBefore: 0,
                spacingAfter: 8,
                indentLeft: 0,
                listType: 'none',
                listLevel: 0,
                runs: [{
                  text: '1. General Information',
                  bold: true,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  fontSize: 13,
                  fontFamily: '',
                  color: '#1e3a5f',
                  superscript: false,
                  subscript: false,
                }],
              },
              {
                id: id(),
                alignment: 'left',
                lineSpacing: 1.5,
                spacingBefore: 0,
                spacingAfter: 4,
                indentLeft: 0,
                listType: 'none',
                listLevel: 0,
                runs: [{
                  text: 'ACME Luxembourg S.a r.l. (the "Company") was incorporated on 15 March 2010 under the laws of the Grand Duchy of Luxembourg as a private limited liability company (societe a responsabilite limitee) for an unlimited period of time. The registered office is established at 12, Rue du Fort Bourbon, L-1249 Luxembourg.',
                  bold: false,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  fontSize: 11,
                  fontFamily: '',
                  color: '#1a1a1a',
                  superscript: false,
                  subscript: false,
                }],
              },
            ],
          },
          {
            id: id(),
            type: 'text',
            pageBreakBefore: false,
            keepWithNext: false,
            spacingBefore: 8,
            spacingAfter: 12,
            content: [
              {
                id: id(),
                alignment: 'left',
                lineSpacing: 1.5,
                spacingBefore: 0,
                spacingAfter: 8,
                indentLeft: 0,
                listType: 'none',
                listLevel: 0,
                runs: [{
                  text: '2. Summary of Significant Accounting Policies',
                  bold: true,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  fontSize: 13,
                  fontFamily: '',
                  color: '#1e3a5f',
                  superscript: false,
                  subscript: false,
                }],
              },
              {
                id: id(),
                alignment: 'left',
                lineSpacing: 1.5,
                spacingBefore: 0,
                spacingAfter: 4,
                indentLeft: 0,
                listType: 'none',
                listLevel: 0,
                runs: [{
                  text: 'The annual accounts have been prepared in accordance with Luxembourg legal and regulatory requirements under the historical cost convention. Accounting policies and valuation rules are, besides the cases laid down by law, determined and applied by the Board of Managers.',
                  bold: false,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  fontSize: 11,
                  fontFamily: '',
                  color: '#1a1a1a',
                  superscript: false,
                  subscript: false,
                }],
              },
            ],
          },
          {
            id: id(),
            type: 'divider',
            pageBreakBefore: false,
            keepWithNext: false,
            spacingBefore: 16,
            spacingAfter: 16,
            style: 'solid',
            thickness: 1,
            color: '#d1d5db',
          },
          {
            id: id(),
            type: 'text',
            pageBreakBefore: false,
            keepWithNext: false,
            spacingBefore: 8,
            spacingAfter: 12,
            content: [{
              id: id(),
              alignment: 'center',
              lineSpacing: 1.5,
              spacingBefore: 0,
              spacingAfter: 0,
              indentLeft: 0,
              listType: 'none',
              listLevel: 0,
              runs: [{
                text: 'The notes on pages 3 to 12 form an integral part of these annual accounts.',
                bold: false,
                italic: true,
                underline: false,
                strikethrough: false,
                fontSize: 10,
                fontFamily: '',
                color: '#6b7280',
                superscript: false,
                subscript: false,
              }],
            }],
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
