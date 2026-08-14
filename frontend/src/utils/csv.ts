function escapeCsvValue(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv<T extends object>(filename: string, rows: T[]) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]) as (keyof T)[];
  const lines = [
    headers.join(';'),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(';')),
  ];

  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
