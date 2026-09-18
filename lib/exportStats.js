import { PLAYER_COUNTS, MAP_SIZES, mapSupportsSize } from '@/lib/stats';

// Layout: one row per map, then a column group for each size (16, 32, 64) side by side.
const FIELDS = ['Available', 'Wins', 'Losses', 'Difficulty (of 5)', 'Bots', 'Date played'];
const FIELD_WIDTHS = [10, 7, 7, 16, 7, 13];

// Cells for one map at one size. Unplayed sizes leave everything after "Available" blank;
// Date played is the most recent round (blank when the date is unknown).
function sizeCells(map, statsIndex, playerCount, size) {
  if (!mapSupportsSize(map, size)) return ['✗', '', '', '', '', ''];
  const s = statsIndex[map.id]?.[playerCount]?.[size];
  if (!s || s.count === 0) return ['✓', '', '', '', '', ''];
  return [
    '✓',
    s.wins,
    s.losses,
    s.avgDifficulty != null ? Math.round(s.avgDifficulty * 10) / 10 : '',
    s.lastBotCount ?? '',
    s.lastPlayedAt ?? '',
  ];
}

function mapRows(maps, statsIndex, playerCount) {
  return maps.map((map, i) => [i + 1, map.name, ...MAP_SIZES.flatMap((size) => sizeCells(map, statsIndex, playerCount, size))]);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const csvCell = (v) => (/[",\r\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

// A single CSV can't hold several sheets, so it has a Players column instead.
export function exportCsv(maps, statsIndex) {
  const header = [
    'Players',
    '#',
    'Map',
    ...MAP_SIZES.flatMap((size) => FIELDS.map((f) => `Size ${size} ${f}`)),
  ];
  const lines = [header];
  for (const count of PLAYER_COUNTS) {
    for (const row of mapRows(maps, statsIndex, count)) lines.push([count, ...row]);
  }
  const text = '\uFEFF' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n') + '\r\n';
  download(new Blob([text], { type: 'text/csv;charset=utf-8' }), `bf2-map-progress-${stamp()}.csv`);
}

// One sheet per player count.
export async function exportExcel(maps, statsIndex) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const perSize = FIELDS.length;
  const firstCol = (i) => 3 + i * perSize; // 1-based column of a size group's first field
  const thin = { style: 'thin', color: { argb: 'FF7A7F84' } };

  for (const count of PLAYER_COUNTS) {
    const sheet = workbook.addWorksheet(`${count} Players`);
    sheet.columns = [
      { width: 5 },
      { width: 28 },
      ...MAP_SIZES.flatMap(() => FIELD_WIDTHS.map((width) => ({ width }))),
    ];

    // header row 1: size group titles (merged); row 2: field names
    sheet.getRow(1).values = ['', '', ...MAP_SIZES.flatMap((size) => [`Size ${size}`, ...Array(perSize - 1).fill('')])];
    sheet.getRow(2).values = ['#', 'Map', ...MAP_SIZES.flatMap(() => FIELDS)];
    MAP_SIZES.forEach((_, i) => sheet.mergeCells(1, firstCol(i), 1, firstCol(i) + perSize - 1));
    for (const r of [1, 2]) {
      const row = sheet.getRow(r);
      row.font = { bold: true };
      row.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }];

    for (const row of mapRows(maps, statsIndex, count)) {
      const cells = [...row];
      MAP_SIZES.forEach((_, i) => {
        const dateAt = firstCol(i) + perSize - 1 - 1; // 0-based index of the date cell
        // real Excel dates (UTC midnight, so the day never shifts with the viewer's timezone)
        if (cells[dateAt]) cells[dateAt] = new Date(`${cells[dateAt]}T00:00:00Z`);
      });
      const added = sheet.addRow(cells);
      added.alignment = { horizontal: 'center' };
      added.getCell(2).alignment = { horizontal: 'left' };
      MAP_SIZES.forEach((_, i) => {
        const avail = added.getCell(firstCol(i));
        avail.font = { bold: true, color: { argb: avail.value === '✓' ? 'FF2E7D32' : 'FFC62828' } };
        added.getCell(firstCol(i) + perSize - 1).numFmt = 'yyyy-mm-dd';
      });
    }

    // a vertical rule at the start of each size group
    for (let r = 1; r <= sheet.rowCount; r++) {
      MAP_SIZES.forEach((_, i) => {
        const cell = sheet.getCell(r, firstCol(i));
        cell.border = { ...cell.border, left: thin };
      });
    }
  }
  const buffer = await workbook.xlsx.writeBuffer();
  download(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `bf2-map-progress-${stamp()}.xlsx`
  );
}
