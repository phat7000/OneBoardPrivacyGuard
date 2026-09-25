import {
  AnonymizationSession,
  createEngine,
  type DetectedEntity,
  type DocCloakEngine,
  type EntityType,
  type ProviderId,
  type RegexRegionId,
} from '@doccloak/core';
import { PreTrainedTokenizer } from '@huggingface/transformers';

const MODEL_CACHE = 'oneboard-models-v1';
const ALLOWED_MODEL_HOSTS = new Set(['huggingface.co', 'cdn-lfs.hf.co', 'cas-bridge.xethub.hf.co']);
const PREF_KEYS = new Set([
  'doccloak-active-provider', 'doccloak-custom-labels', 'doccloak-regex-enabled',
  'doccloak-regex-region', 'oneboard-language', 'oneboard-ignore-list',
]);

function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, window.location.href);
  if (url.protocol !== 'https:' || !ALLOWED_MODEL_HOSTS.has(url.hostname)) {
    return Promise.reject(new Error(`Blocked network destination: ${url.hostname || url.protocol}`));
  }
  if (init?.body) return Promise.reject(new Error('Model requests must not contain a request body.'));
  return fetch(input, { ...init, credentials: 'omit', referrerPolicy: 'no-referrer' });
}

const kv = {
  async get(key: string) { return PREF_KEYS.has(key) ? localStorage.getItem(key) : null; },
  async set(key: string, value: string) { if (PREF_KEYS.has(key)) localStorage.setItem(key, value); },
  async remove(key: string) { if (PREF_KEYS.has(key)) localStorage.removeItem(key); },
};

const modelCache = {
  async match(url: string) {
    const response = await (await caches.open(MODEL_CACHE)).match(url);
    return response?.blob();
  },
  async put(url: string, blob: Blob) {
    try {
      await (await caches.open(MODEL_CACHE)).put(url, new Response(blob));
      return true;
    } catch { return false; }
  },
  async delete(url: string) { await (await caches.open(MODEL_CACHE)).delete(url); },
};

export const providerDetails: Record<ProviderId, { label: string; size: string }> = {
  gliner: { label: 'GLiNER PII Small', size: '~83 MB' },
  'gliner-base': { label: 'GLiNER PII Base', size: '~197 MB' },
  bardsai: { label: 'BardS.ai EU PII', size: '~500 MB' },
};

let enginePromise: Promise<DocCloakEngine> | null = null;

export async function getEngine(): Promise<DocCloakEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const engine = createEngine({
        kv,
        modelCache,
        fetch: safeFetch,
        wasm: { paths: new URL('/ort/', window.location.href).href, numThreads: 1 },
        buildTokenizer: (json, config) => new PreTrainedTokenizer(json as never, config as never),
        hardware: { isMobile: false, deviceMemoryGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory },
        persistStorage: () => navigator.storage.persist(),
      }, { providerId: 'gliner' }, { autoLoad: false });
      await engine.ready;
      if (engine.getSettings().providerId !== 'gliner' && !localStorage.getItem('doccloak-active-provider')) {
        await engine.updateSettings({ providerId: 'gliner' });
      }
      return engine;
    })();
  }
  return enginePromise;
}

export function newSession(): AnonymizationSession {
  return new AnonymizationSession({ mode: 'labeled' });
}

export function customTermEntities(text: string, terms: string[]): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  for (const term of terms.map((x) => x.trim()).filter(Boolean)) {
    let from = 0;
    while (from < text.length) {
      const start = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase(), from);
      if (start < 0) break;
      entities.push({ type: 'OTHER', value: text.slice(start, start + term.length), start, end: start + term.length, confidence: 1, detector: 'custom' });
      from = start + term.length;
    }
  }
  return entities;
}

export function filterAndMergeEntities(text: string, detected: DetectedEntity[], customTerms: string[], ignored: string[]): DetectedEntity[] {
  const ignore = new Set(ignored.map((x) => x.trim().toLocaleLowerCase()).filter(Boolean));
  const all = [...detected, ...customTermEntities(text, customTerms)]
    .filter((entity) => !ignore.has(entity.value.toLocaleLowerCase()))
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: DetectedEntity[] = [];
  for (const entity of all) {
    if (!merged.some((other) => entity.start < other.end && entity.end > other.start)) merged.push(entity);
  }
  return merged;
}

export function maskedPreview(value: string): string {
  if (value.length <= 2) return '••';
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    return `${name.slice(0, 1)}•••@${domain}`;
  }
  return `${value.slice(0, 1)}${'•'.repeat(Math.min(8, value.length - 2))}${value.slice(-1)}`;
}

export type { DetectedEntity, DocCloakEngine, EntityType, ProviderId, RegexRegionId };
