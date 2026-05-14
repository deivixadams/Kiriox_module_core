import type { AiRunInput } from './AiFieldContract';

const TONE_INSTRUCTIONS: Record<string, string> = {
  juridico: 'Usa lenguaje jurídico preciso, formal y sin ambigüedades. Evita términos coloquiales.',
  tecnico: 'Usa terminología técnica especializada. Sé preciso, directo y orientado a hechos.',
  ejecutivo: 'Usa lenguaje ejecutivo: claro, conciso, orientado a decisiones y alto impacto.',
  formal: 'Usa lenguaje formal y profesional. Sin abreviaciones informales.',
};

const INTENT_INSTRUCTIONS: Record<string, string> = {
  complete: 'Completa el siguiente texto de forma coherente y profesional.',
  summarize: 'Resume el siguiente texto de forma concisa, conservando los puntos clave.',
  classify: 'Clasifica el siguiente contenido según las categorías disponibles en el contexto.',
  extract: 'Extrae la información clave del siguiente texto de forma estructurada.',
};

export function buildPromptFromContract(contract: AiRunInput): string {
  const lines: string[] = [];

  const intentLine = INTENT_INSTRUCTIONS[contract.intent] ?? 'Procesa el siguiente texto.';
  lines.push(intentLine);

  if (contract.tone && TONE_INSTRUCTIONS[contract.tone]) {
    lines.push(TONE_INSTRUCTIONS[contract.tone]);
  }

  if (contract.minWords !== undefined || contract.maxWords !== undefined) {
    const min = contract.minWords;
    const max = contract.maxWords;
    if (min !== undefined && max !== undefined) {
      lines.push(`Responde con entre ${min} y ${max} palabras.`);
    } else if (max !== undefined) {
      lines.push(`Responde con un máximo de ${max} palabras.`);
    } else if (min !== undefined) {
      lines.push(`Responde con un mínimo de ${min} palabras.`);
    }
  }

  if (contract.forbidden && contract.forbidden.length > 0) {
    lines.push(`Evita los siguientes términos o conceptos: ${contract.forbidden.join(', ')}.`);
  }

  if (contract.requiredMeaning && contract.requiredMeaning.length > 0) {
    lines.push(`La respuesta debe incorporar estos conceptos clave: ${contract.requiredMeaning.join(', ')}.`);
  }

  if (contract.output === 'json') {
    lines.push('Responde únicamente con JSON válido, sin explicaciones adicionales.');
  }

  lines.push('');
  lines.push(`Campo: ${contract.field}`);
  lines.push(`Módulo: ${contract.module}`);
  lines.push('');
  lines.push(`Texto de entrada:\n${contract.input}`);

  return lines.join('\n');
}

export function buildSystemPrompt(contract: AiRunInput): string {
  return [
    'Eres un asistente especializado en gestión de riesgos institucionales para Kiriox GRI.',
    'Tu función es ayudar a completar campos de formularios con precisión técnica y contextual.',
    'Responde ÚNICAMENTE con el contenido del campo solicitado, sin introducción ni explicación.',
    'No uses comillas alrededor de tu respuesta.',
    'No incluyas el nombre del campo en tu respuesta.',
  ].join(' ');
}
