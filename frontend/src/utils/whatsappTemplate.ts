import type { WhatsAppSendTemplateComponent, WhatsAppTemplateComponent } from '@/services/ticketService';

export interface ParsedTemplateHeader {
  format: 'TEXT' | 'IMAGE';
  variableCount: number;
}

export interface ParsedTemplateBody {
  variableCount: number;
  placeholders: string[];
}

export interface ParsedTemplateButton {
  index: number;
  text: string;
  placeholder?: string;
}

export interface ParsedTemplate {
  header: ParsedTemplateHeader | null;
  body: ParsedTemplateBody | null;
  buttons: ParsedTemplateButton[];
}

function extractVariableCount(text: string): number {
  const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return matches.length ? Math.max(...matches) : 0;
}

export function parseTemplateComponents(components: WhatsAppTemplateComponent[]): ParsedTemplate {
  const headerComp = components.find((c) => c.type === 'HEADER');
  const bodyComp = components.find((c) => c.type === 'BODY');
  const buttonsComp = components.find((c) => c.type === 'BUTTONS');

  const header: ParsedTemplateHeader | null = headerComp
    ? headerComp.format === 'IMAGE'
      ? { format: 'IMAGE', variableCount: 0 }
      : { format: 'TEXT', variableCount: extractVariableCount(headerComp.text ?? '') }
    : null;

  const body: ParsedTemplateBody | null = bodyComp
    ? {
        variableCount: extractVariableCount(bodyComp.text ?? ''),
        placeholders: bodyComp.example?.body_text?.[0] ?? [],
      }
    : null;

  const buttons: ParsedTemplateButton[] = (buttonsComp?.buttons ?? [])
    .map((btn, index) => ({
      index,
      text: btn.text,
      hasVariable: btn.type === 'URL' && /\{\{\d+\}\}/.test(btn.url ?? ''),
      placeholder: btn.example?.[0],
    }))
    .filter((btn) => btn.hasVariable)
    .map(({ index, text, placeholder }) => ({ index, text, placeholder }));

  return { header, body, buttons };
}

export interface TemplateFormValues {
  headerImageUrl?: string;
  headerTextValues: string[];
  bodyValues: string[];
  buttonValues: Record<number, string>;
}

export function buildSendComponents(
  parsed: ParsedTemplate,
  values: TemplateFormValues,
): WhatsAppSendTemplateComponent[] {
  const out: WhatsAppSendTemplateComponent[] = [];

  if (parsed.header?.format === 'IMAGE' && values.headerImageUrl) {
    out.push({ type: 'header', parameters: [{ type: 'image', image: { link: values.headerImageUrl } }] });
  } else if (parsed.header?.format === 'TEXT' && parsed.header.variableCount > 0) {
    out.push({
      type: 'header',
      parameters: Array.from({ length: parsed.header.variableCount }, (_, i) => ({
        type: 'text' as const,
        text: values.headerTextValues[i] ?? '',
      })),
    });
  }

  if (parsed.body && parsed.body.variableCount > 0) {
    out.push({
      type: 'body',
      parameters: Array.from({ length: parsed.body.variableCount }, (_, i) => ({
        type: 'text' as const,
        text: values.bodyValues[i] ?? '',
      })),
    });
  }

  for (const btn of parsed.buttons) {
    out.push({
      type: 'button',
      sub_type: 'url',
      index: String(btn.index),
      parameters: [{ type: 'text', text: values.buttonValues[btn.index] ?? '' }],
    });
  }

  return out;
}

export function isTemplateFormComplete(parsed: ParsedTemplate, values: TemplateFormValues): boolean {
  if (parsed.header?.format === 'IMAGE' && !values.headerImageUrl) return false;
  if (parsed.header?.format === 'TEXT') {
    for (let i = 0; i < parsed.header.variableCount; i++) {
      if (!values.headerTextValues[i]?.trim()) return false;
    }
  }
  if (parsed.body) {
    for (let i = 0; i < parsed.body.variableCount; i++) {
      if (!values.bodyValues[i]?.trim()) return false;
    }
  }
  for (const btn of parsed.buttons) {
    if (!values.buttonValues[btn.index]?.trim()) return false;
  }
  return true;
}
