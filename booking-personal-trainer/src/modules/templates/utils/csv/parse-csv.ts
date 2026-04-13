export interface ParsedCsvRow {
  readonly rowNumber: number;
  readonly valuesByHeader: Record<string, string>;
}

const normalizeHeader = (header: string): string => header.trim();

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let isInQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (isInQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }
      isInQuotes = !isInQuotes;
      continue;
    }
    if (char === ',' && !isInQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((c) => c.trim());
};

export const parseCsv = (text: string): ParsedCsvRow[] => {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) {
    return [];
  }
  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const valuesByHeader: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      valuesByHeader[header] = values[headerIndex] ?? '';
    });
    rows.push({
      rowNumber: i + 1,
      valuesByHeader,
    });
  }
  return rows;
};
