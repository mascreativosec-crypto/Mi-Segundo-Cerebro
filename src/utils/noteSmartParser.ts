export type SmartSegment =
  | { type: 'text'; text: string }
  | {
      type: 'date';
      text: string;
      isoDate: string;
      lineContext: string;
    }
  | {
      type: 'finance';
      text: string;
      amount: number;
      financeType: 'expense' | 'income' | 'investment';
      lineContext: string;
      suggestedDate?: string;
    };

const SPANISH_MONTHS: Record<string, number> = {
  ene: 1,
  enero: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  ago: 8,
  agosto: 8,
  sep: 9,
  sept: 9,
  septiembre: 9,
  setiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dic: 12,
  diciembre: 12,
};

const SPANISH_WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseLocalizedNumber(raw: string): number {
  const cleaned = raw.replace(/\s+/g, '');
  // Handle 1,250.50 vs 1.250,50 vs 1,200 vs 250
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts[1] && parts[1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.'));
    }
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  return parseFloat(cleaned.replace(/,/g, ''));
}

function resolveDateMatch(matched: string, referenceDate = new Date()): string | null {
  const lower = matched.toLowerCase().trim();

  if (lower === 'hoy') {
    return formatDateISO(referenceDate);
  }
  if (lower === 'mañana' || lower === 'manana') {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  }
  if (lower === 'pasado mañana' || lower === 'pasado manana') {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 2);
    return formatDateISO(d);
  }

  // "próximo lunes" / "proximo viernes" / "este viernes"
  const nextWeekdayMatch = lower.match(
    /^(?:(?:el\s+)?pr[oó]ximo|este)\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)$/
  );
  if (nextWeekdayMatch) {
    const targetDay = SPANISH_WEEKDAYS[nextWeekdayMatch[1]];
    if (targetDay !== undefined) {
      const d = new Date(referenceDate);
      const diff = (targetDay - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return formatDateISO(d);
    }
  }

  // ISO YYYY-MM-DD
  const isoMatch = lower.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD/MM
  const slashMatch = lower.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    let year = slashMatch[3] ? Number(slashMatch[3]) : referenceDate.getFullYear();
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  // Spanish natural: "15 de enero de 2027" or "15 de enero" or "15 ene 2027"
  const esMatch = lower.match(
    /^(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)(?:\s+(?:de\s+|del\s+)?(\d{4}))?$/
  );
  if (esMatch) {
    const day = Number(esMatch[1]);
    const month = SPANISH_MONTHS[esMatch[2]];
    const year = esMatch[3] ? Number(esMatch[3]) : referenceDate.getFullYear();
    if (month && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return null;
}

function inferFinanceType(matchedText: string, fullLine: string): 'expense' | 'income' | 'investment' {
  const combined = `${matchedText} ${fullLine}`.toLowerCase();
  if (
    /\b(ingreso|ingresos|cobrar|cobr[eé]|cobro|facturar|facturaci[oó]n|venta|ventas|ganancia|salario|sueldo|bono|recibir|entrada)\b/.test(
      combined
    )
  ) {
    return 'income';
  }
  if (/\b(invertir|inversi[oó]n|inversion|ahorrar|ahorro|fondo|etf|acciones)\b/.test(combined)) {
    return 'investment';
  }
  return 'expense';
}

interface RawMatch {
  start: number;
  end: number;
  segment: SmartSegment;
}

const DATE_REGEX =
  /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)(?:\s+(?:de\s+|del\s+)?\d{4})?|(?:(?:el\s+)?pr[oó]ximo|este)\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)|pasado\s+ma[ñn]ana|ma[ñn]ana)\b/gi;

const FINANCE_REGEX =
  /(?:\b(?:gasto|gastar|gast[eé]|gastos|pago|pagar|pagu[eé]|pagos|ingreso|ingresos|cobrar|cobr[eé]|cobro|facturar|presupuesto|ahorrar|ahorro|invertir|inversi[oó]n|bono|cuota|abono|comprar|compra|costo|precio)\s+(?:de\s+|mensual\s+de\s+|aprox\.?\s+)?(?:(?:USD|US\$|\$)\s*\d[\d,.]*|\d[\d,.]*(?:\s*(?:d[oó]lares|usd))?)|(?:USD|US\$|\$)\s*\d[\d,.]*|\b\d[\d,.]*\s*(?:d[oó]lares|usd)\b)/gi;

export function parseNoteLineSegments(line: string, referenceDate = new Date()): SmartSegment[] {
  if (!line) return [{ type: 'text', text: '' }];

  const matches: RawMatch[] = [];
  let firstLineIsoDate: string | undefined;

  // 1. Collect date matches
  DATE_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DATE_REGEX.exec(line)) !== null) {
    const rawText = m[0];
    const iso = resolveDateMatch(rawText, referenceDate);
    if (!iso) continue;
    if (!firstLineIsoDate) firstLineIsoDate = iso;
    matches.push({
      start: m.index,
      end: m.index + rawText.length,
      segment: {
        type: 'date',
        text: rawText,
        isoDate: iso,
        lineContext: line.trim(),
      },
    });
  }

  // 2. Collect finance (expense / income / investment) matches
  FINANCE_REGEX.lastIndex = 0;
  while ((m = FINANCE_REGEX.exec(line)) !== null) {
    const rawText = m[0];
    const numMatch = rawText.match(/\d[\d,.]*/);
    if (!numMatch) continue;
    const amount = parseLocalizedNumber(numMatch[0]);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    matches.push({
      start: m.index,
      end: m.index + rawText.length,
      segment: {
        type: 'finance',
        text: rawText,
        amount,
        financeType: inferFinanceType(rawText, line),
        lineContext: line.trim(),
        suggestedDate: firstLineIsoDate,
      },
    });
  }

  if (matches.length === 0) {
    return [{ type: 'text', text: line }];
  }

  // Sort by start position (prefer longer match if overlapping at same start)
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlapping: RawMatch[] = [];
  let lastEnd = 0;
  for (const item of matches) {
    if (item.start >= lastEnd) {
      nonOverlapping.push(item);
      lastEnd = item.end;
    }
  }

  const result: SmartSegment[] = [];
  let cursor = 0;
  for (const item of nonOverlapping) {
    if (item.start > cursor) {
      result.push({ type: 'text', text: line.slice(cursor, item.start) });
    }
    result.push(item.segment);
    cursor = item.end;
  }
  if (cursor < line.length) {
    result.push({ type: 'text', text: line.slice(cursor) });
  }

  return result;
}

export function extractSmartItemsFromNote(content: string): {
  dates: Extract<SmartSegment, { type: 'date' }>[];
  finances: Extract<SmartSegment, { type: 'finance' }>[];
} {
  const dates: Extract<SmartSegment, { type: 'date' }>[] = [];
  const finances: Extract<SmartSegment, { type: 'finance' }>[] = [];

  for (const line of content.split('\n')) {
    const segments = parseNoteLineSegments(line);
    for (const seg of segments) {
      if (seg.type === 'date') dates.push(seg);
      else if (seg.type === 'finance') finances.push(seg);
    }
  }

  return { dates, finances };
}
