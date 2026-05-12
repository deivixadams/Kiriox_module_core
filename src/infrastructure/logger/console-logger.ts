import type { KirioxLogger, LogContext, LogLevel } from './logger.contract';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LEVEL_ORDER) return env;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function formatEntry(level: LogLevel, message: string, context?: LogContext, error?: unknown): string {
  const ts = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  const err = error ? ` | ${error instanceof Error ? error.message : String(error)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${ctx}${err}`;
}

export class ConsoleLogger implements KirioxLogger {
  private readonly minLevel: LogLevel;

  constructor(minLevel?: LogLevel) {
    this.minLevel = minLevel ?? getMinLevel();
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) console.debug(formatEntry('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) console.info(formatEntry('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) console.warn(formatEntry('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) console.error(formatEntry('error', message, context, error));
  }
}

export const logger: KirioxLogger = new ConsoleLogger();
