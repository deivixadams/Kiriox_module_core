import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { readPluginRegistry } from '@/core/plugin-engine/plugin-registry-store';
import ts from 'typescript';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registry = readPluginRegistry();
    const plugin = registry.find(p => p.id === id);

    if (!plugin || !plugin.entryFile || !existsSync(plugin.entryFile)) {
      return NextResponse.json({ error: 'Plugin o entrypoint no encontrado' }, { status: 404 });
    }

    const source = readFileSync(plugin.entryFile, 'utf8');
    
    // Transpilar para el navegador
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      }
    });

    // Envolver en un formato que el cliente pueda consumir
    // Inyectamos un pequeño cargador para manejar los 'exports' y 'require'
    const bundle = `
      (function(exports, React, Lucide) {
        const module = { exports };
        const require = function(name) {
          if (name === 'react') return React;
          if (name === 'lucide-react') return Lucide;
          throw new Error('Módulo no disponible en el sandbox: ' + name);
        };
        ${transpiled.outputText}
        return module.exports;
      })
    `;

    return new NextResponse(bundle, {
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  } catch (error) {
    console.error('[Plugin Runtime] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
