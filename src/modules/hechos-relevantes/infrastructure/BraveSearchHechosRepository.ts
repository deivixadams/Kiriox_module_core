import { createHash } from 'crypto';
import type { IHechosRelevantesRepository } from "@/modules/hechos-relevantes/domain/contracts/IHechosRelevantesRepository";
import type {
  BuscarHechosInput,
  BuscarHechosResult,
  CategoriaEvento,
  HechoCapturado,
  Relevancia,
} from "@/modules/hechos-relevantes/domain/types/HechosRelevantesTypes";

const QUERIES_DEFAULT = [
  'hecho relevante sociedad administradora fondos inversión República Dominicana',
  'site:simv.gob.do fondos de inversión circular resolución',
  'site:bvrd.com.do hechos relevantes fondos',
  'calificación de riesgo fondo de inversión República Dominicana',
  'SAFI República Dominicana riesgo regulatorio 2025 2026',
  'Superintendencia Mercado Valores República Dominicana sanción advertencia',
];

type BraveWebResult = {
  title: string;
  url: string;
  description?: string;
  page_age?: string;
  meta_url?: { hostname?: string };
};

type BraveSearchResponse = {
  web?: { results?: BraveWebResult[] };
};

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return url.split('/')[2] ?? 'desconocido'; }
}

function detectTipoDocumento(url: string): 'PDF' | 'HTML' | 'otro' {
  return url.toLowerCase().includes('.pdf') ? 'PDF' : 'HTML';
}

function detectFecha(text: string, pageAge?: string): string | null {
  if (pageAge) {
    const d = new Date(pageAge);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const m =
    text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](202\d)/) ??
    text.match(/(202\d)[\/\-](\d{1,2})[\/\-](\d{1,2})/) ??
    text.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de?\s+202\d/i);
  return m ? m[0] : null;
}

function detectEntidad(text: string): string {
  const map: [string, string][] = [
    ['simv', 'SIMV'],
    ['superintendencia del mercado de valores', 'SIMV'],
    ['bvrd', 'BVRD'],
    ['bolsa de valores', 'BVRD'],
    ['adosafi', 'ADOSAFI'],
    ['banco central', 'Banco Central RD'],
    ['sipen', 'SIPEN'],
    ['fitch', 'Fitch Ratings'],
    ['moody', "Moody's"],
    ['standard & poor', 'S&P'],
    ['interval', 'Interval Capital SAFI'],
    ['reservas', 'Banco de Reservas'],
    ['popular', 'Banco Popular'],
  ];
  const tl = text.toLowerCase();
  for (const [key, label] of map) {
    if (tl.includes(key)) return label;
  }
  return 'No identificada';
}

function clasificarEvento(titulo: string, fragmento: string): CategoriaEvento {
  const t = (titulo + ' ' + fragmento).toLowerCase();
  if (t.includes('hecho relevante')) return 'hecho_relevante';
  if (t.includes('calificación') || t.includes('rating') || t.includes('fitch') || t.includes('moody')) return 'calificacion_riesgo';
  if (t.includes('safi') || t.includes('administradora de fondos')) return 'safi_administradora';
  if (t.includes('sanción') || t.includes('multa') || t.includes('advertencia')) return 'sancion_advertencia';
  if (t.includes('circular') || t.includes('normativa') || t.includes('regulación') || t.includes('resolución')) return 'regulacion_cumplimiento';
  if (t.includes('incumplimiento') || t.includes('deterioro') || t.includes('alerta') || t.includes('suspensión')) return 'deterioro_alerta';
  if (t.includes('prospecto') || t.includes('reglamento interno')) return 'cambio_reglamento';
  if (t.includes('emisión') || t.includes('colocación') || t.includes('oferta pública')) return 'emision_cuotas';
  if (t.includes('estado financiero') || t.includes('balance') || t.includes('informe anual')) return 'estados_financieros';
  if (t.includes('valor cuota') || t.includes('nav') || t.includes('rendimiento')) return 'valor_cuota';
  if (t.includes('fondo de inversión') || t.includes('fondo inmobiliario') || t.includes('fondo cerrado')) return 'fondo_inversion';
  return 'otro';
}

function evaluarRelevancia(categoria: CategoriaEvento, titulo: string, fragmento: string): Relevancia {
  const t = (titulo + ' ' + fragmento).toLowerCase();
  if (categoria === 'sancion_advertencia' || categoria === 'deterioro_alerta') return 'critico';
  if (categoria === 'hecho_relevante' || categoria === 'calificacion_riesgo') return 'alto';
  if (t.includes('riesgo') || t.includes('incumplimiento') || t.includes('suspensión')) return 'alto';
  if (categoria === 'regulacion_cumplimiento' || categoria === 'safi_administradora') return 'medio';
  return 'bajo';
}

function sugerirRiesgo(categoria: CategoriaEvento): string {
  const map: Record<CategoriaEvento, string> = {
    hecho_relevante:         'Riesgo reputacional / regulatorio',
    calificacion_riesgo:     'Riesgo de crédito / mercado',
    fondo_inversion:         'Riesgo de mercado / liquidez',
    safi_administradora:     'Riesgo operativo / contraparte',
    valor_cuota:             'Riesgo de mercado',
    estados_financieros:     'Riesgo financiero',
    regulacion_cumplimiento: 'Riesgo regulatorio / cumplimiento',
    sancion_advertencia:     'Riesgo regulatorio crítico',
    cambio_reglamento:       'Riesgo de cumplimiento / cambio normativo',
    emision_cuotas:          'Riesgo de liquidez / mercado',
    deterioro_alerta:        'Riesgo de crédito / reputacional',
    otro:                    'Riesgo sin clasificar',
  };
  return map[categoria];
}

function sugerirControl(categoria: CategoriaEvento): string {
  const map: Record<CategoriaEvento, string> = {
    hecho_relevante:         'Monitoreo de medios y fuentes regulatorias',
    calificacion_riesgo:     'Límites de exposición por calificación',
    fondo_inversion:         'Control de valoración y liquidez',
    safi_administradora:     'Due diligence de contrapartes',
    valor_cuota:             'Alertas de variación de NAV',
    estados_financieros:     'Revisión periódica de estados financieros',
    regulacion_cumplimiento: 'Seguimiento normativo y GAP regulatorio',
    sancion_advertencia:     'Plan de remediación inmediata',
    cambio_reglamento:       'Control de cambios en prospectos',
    emision_cuotas:          'Control de colocaciones y compromisos',
    deterioro_alerta:        'Alerta temprana y escalamiento',
    otro:                    'Por determinar',
  };
  return map[categoria];
}

async function buscarEnBrave(
  query: string,
  apiKey: string,
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<HechoCapturado[]> {
  const endpoint = new URL('https://api.search.brave.com/res/v1/web/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('count', '10');
  endpoint.searchParams.set('search_lang', 'es');
  endpoint.searchParams.set('country', 'DO');
  endpoint.searchParams.set('text_decorations', '0');
  endpoint.searchParams.set('spellcheck', '0');

  if (fechaDesde && fechaHasta) {
    endpoint.searchParams.set('freshness', `${fechaDesde}to${fechaHasta}`);
  }

  let data: BraveSearchResponse;
  try {
    const res = await fetch(endpoint.toString(), {
      headers: {
        'Accept':               'application/json',
        'Accept-Encoding':      'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    data = await res.json() as BraveSearchResponse;
  } catch {
    return [];
  }

  const webResults = data.web?.results ?? [];
  const fechaCaptura = new Date().toISOString();
  const prioMap: Record<Relevancia, string> = {
    critico: '1 – Inmediata',
    alto:    '2 – Urgente',
    medio:   '3 – Normal',
    bajo:    '4 – Seguimiento',
  };

  return webResults.map((r) => {
    const titulo          = r.title ?? '';
    const fragmento       = r.description ?? '';
    const url             = r.url ?? '';
    const dominio         = r.meta_url?.hostname ?? extractDomain(url);
    const tipo_documento  = detectTipoDocumento(url);
    const fecha_detectada = detectFecha(titulo + ' ' + fragmento, r.page_age);
    const categoria       = clasificarEvento(titulo, fragmento);
    const entidad         = detectEntidad(titulo + ' ' + fragmento);
    const relevancia      = evaluarRelevancia(categoria, titulo, fragmento);
    const hashVal         = sha256(url + titulo);

    return {
      id:               `HC-${hashVal.slice(0, 8).toUpperCase()}`,
      titulo,
      url,
      dominio,
      tipo_documento,
      fecha_detectada,
      fuente:           dominio,
      fragmento,
      hash:             hashVal,
      fecha_captura:    fechaCaptura,
      categoria,
      entidad,
      riesgo_sugerido:  sugerirRiesgo(categoria),
      control_afectado: sugerirControl(categoria),
      relevancia,
      estado:           'capturado' as const,
      query_origen:     query,
      riesgo_lineal: {
        impacto:      relevancia === 'critico' ? 'Muy alto' : relevancia === 'alto' ? 'Alto' : 'Medio',
        probabilidad: 'Por evaluar',
        prioridad:    prioMap[relevancia],
      },
      riesgo_estructural: {
        descripcion: categoria === 'safi_administradora'
          ? 'Posible nodo crítico: administradora con concentración de fondos'
          : categoria === 'fondo_inversion'
          ? 'Posible cascada: fondo con exposición sistémica'
          : categoria === 'deterioro_alerta'
          ? 'Posible fragilidad: evento de deterioro con efecto cascada'
          : 'Análisis estructural pendiente',
      },
    };
  });
}

export class BraveSearchHechosRepository implements IHechosRelevantesRepository {
  constructor(private readonly apiKey: string) {}

  async buscar(input: BuscarHechosInput): Promise<BuscarHechosResult> {
    const queries = Array.isArray(input.queries) && input.queries.length > 0
      ? input.queries.slice(0, 6)
      : QUERIES_DEFAULT;

    const settled = await Promise.allSettled(
      queries.map((q) => buscarEnBrave(q, this.apiKey, input.fechaDesde, input.fechaHasta)),
    );

    const all: HechoCapturado[] = [];
    const seen = new Set<string>();
    for (const s of settled) {
      if (s.status !== 'fulfilled') continue;
      for (const r of s.value) {
        if (r.url && !seen.has(r.url)) { seen.add(r.url); all.push(r); }
      }
    }

    const order: Record<Relevancia, number> = { critico: 0, alto: 1, medio: 2, bajo: 3 };
    all.sort((a, b) => order[a.relevancia] - order[b.relevancia]);

    return { results: all, total: all.length };
  }
}
