import AsyncStorage from 'expo-sqlite/kv-store';

export type StartupLevel = 'start' | 'ok' | 'warn' | 'error';

export interface StartupEvent {
  stage: string;
  level: StartupLevel;
  iso: string;
  ts: number;
  detail?: string;
}

const STARTUP_EVENTS_KEY = 'pitch_therapy_startup_events_v1';
const MAX_STARTUP_EVENTS = 80;

let hydrated = false;
let events: StartupEvent[] = [];
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function trimEvents(list: StartupEvent[]): StartupEvent[] {
  return list.slice(-MAX_STARTUP_EVENTS);
}

async function hydrateEvents(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STARTUP_EVENTS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StartupEvent[];
    if (Array.isArray(parsed)) {
      events = trimEvents(parsed);
    }
  } catch {
    events = [];
  }
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void AsyncStorage.setItem(STARTUP_EVENTS_KEY, JSON.stringify(events)).catch(() => {
      // Ignore diagnostics persistence failures.
    });
  }, 250);
}

function addEvent(event: StartupEvent) {
  events = trimEvents([...events, event]);
  schedulePersist();
}

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export function recordStartupEvent(stage: string, level: StartupLevel = 'ok', detail?: string): StartupEvent {
  const event: StartupEvent = {
    stage,
    level,
    detail,
    ts: Date.now(),
    iso: new Date().toISOString(),
  };

  const detailSuffix = detail ? ` :: ${detail}` : '';
  if (level === 'error') {
    console.error(`[startup][${level}] ${stage}${detailSuffix}`);
  } else if (level === 'warn') {
    console.warn(`[startup][${level}] ${stage}${detailSuffix}`);
  } else {
    console.log(`[startup][${level}] ${stage}${detailSuffix}`);
  }

  addEvent(event);
  return event;
}

export function recordStartupError(stage: string, error: unknown, extra?: string): StartupEvent {
  const normalized = normalizeError(error);
  const detail = extra ? `${extra}; ${normalized.message}` : normalized.message;
  if (normalized.stack) {
    console.error(`[startup][error] ${stage} :: ${detail}`, normalized.stack);
  } else {
    console.error(`[startup][error] ${stage} :: ${detail}`);
  }
  return recordStartupEvent(stage, 'error', detail);
}

export async function runStartupStep(
  stage: string,
  fn: () => Promise<void> | void,
  options?: { timeoutMs?: number },
): Promise<boolean> {
  recordStartupEvent(stage, 'start');
  const timeoutMs = options?.timeoutMs ?? 4500;

  try {
    await Promise.race([
      Promise.resolve(fn()),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    recordStartupEvent(stage, 'ok');
    return true;
  } catch (error) {
    recordStartupError(stage, error);
    return false;
  }
}

export function installGlobalStartupErrorHandler(): () => void {
  const errorUtils = (globalThis as { ErrorUtils?: any }).ErrorUtils;
  if (!errorUtils?.setGlobalHandler) {
    recordStartupEvent('global_error_handler_unavailable', 'warn');
    return () => {};
  }

  const previous = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    recordStartupError('js_global_uncaught', error, `fatal=${Boolean(isFatal)}`);
    if (typeof previous === 'function') {
      previous(error, isFatal);
    }
  });
  recordStartupEvent('global_error_handler_installed', 'ok');

  return () => {
    if (typeof previous === 'function') {
      errorUtils.setGlobalHandler(previous);
    }
  };
}

export async function getStartupEvents(): Promise<StartupEvent[]> {
  await hydrateEvents();
  return [...events].reverse();
}

export async function clearStartupEvents(): Promise<void> {
  events = [];
  hydrated = true;
  try {
    await AsyncStorage.removeItem(STARTUP_EVENTS_KEY);
  } catch {
    // Ignore clear failures in diagnostics helper.
  }
}

void hydrateEvents();
