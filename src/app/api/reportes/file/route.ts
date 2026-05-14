import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const FILES_DIR = 'C:\\_CRE\\_ROPORTES_SiMV';

// Allowlist: only these exact filenames may be served
const ALLOWED_FILES = new Set([
  'Porcentaje-Liquidez.xls',
  'Instructivo-de-Liquidez.xlsx',
  'Portafolio-de-Inversiones-en-Instrumentos-de-Rf.xls',
  'Portafolio-inversiones-RV.xls',
  'Portafolio-inversiones-otras.xls',
  'Suscripcion-y-rescates-fondos.xls',
  'Limites-de-participacion-de-aportante.xls',
  'Colocacion-de-los-valores.xls',
  'Valoracion-de-los-valores-Fondos-Abiertos.xls',
  'Informacion-diaria-a-publicar.xls',
]);

const MIME: Record<string, string> = {
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf':  'application/pdf',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file') ?? '';

  if (!ALLOWED_FILES.has(fileName)) {
    return NextResponse.json({ error: 'Archivo no autorizado' }, { status: 403 });
  }

  // Extra safety: reject any path traversal attempt
  const base = path.basename(fileName);
  if (base !== fileName) {
    return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
  }

  const filePath = path.join(FILES_DIR, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME[ext] ?? 'application/octet-stream';

  try {
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 });
  }
}
