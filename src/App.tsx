import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { DetectedEntity, ProviderId, RegexRegionId } from './lib/engine';
import { filterAndMergeEntities, getEngine, maskedPreview, newSession, providerDetails } from './lib/engine';
import { type Language, type MessageKey, translate } from './lib/i18n';
import {
  analyzeOfficeFile,
  isImageFile,
  loadImageToCanvas,
  redactOfficeFile,
  renderRedactedImage,
  UnsupportedDocumentError,
  isStaleAnalysisError,
  type OfficeAnalysis,
  type OcrCanvas,
  type OcrExtraction,
} from '@doccloak/core/dom';
import { ModelNotLoadedError, REGEX_REGIONS } from '@doccloak/core';
import { recognizeLocal } from './lib/ocr';

type Tab = 'protect' | 'files' | 'restore' | 'settings' | 'about';
type ReviewEntity = DetectedEntity & { id: string; enabled: boolean };
type FileState = {
  file: File;
  kind: 'office' | 'image';
  analysis?: OfficeAnalysis;
  ocr?: OcrExtraction;
  canvas?: OcrCanvas;
  entities: ReviewEntity[];
};

const sessionRef = { current: newSession() };
const nav: { id: Tab; key: MessageKey; icon: string }[] = [
  { id: 'protect', key: 'protect', icon: '◆' }, { id: 'files', key: 'files', icon: '▤' },
  { id: 'restore', key: 'restore', icon: '↺' }, { id: 'settings', key: 'settings', icon: '⚙' },
  { id: 'about', key: 'about', icon: '○' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function friendlyError(error: unknown): string {
  if (error instanceof ModelNotLoadedError) return 'The local model is not downloaded yet.';
  if (error instanceof UnsupportedDocumentError) return `${error.message}${error.details.length ? `: ${error.details.join(', ')}` : ''}`;
  if (isStaleAnalysisError(error)) return 'The file changed after analysis. Analyze it again before export.';
  return error instanceof Error ? error.message : 'An unexpected local processing error occurred.';
}

export default function App() {
  const [tab, setTab] = useState<Tab>('protect');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('oneboard-language') as Language) || 'en');
  const t = (key: MessageKey) => translate(language, key);
  const [theme, setTheme] = useState(() => localStorage.getItem('oneboard-theme') || 'light');
  const [input, setInput] = useState('');
  const [entities, setEntities] = useState<ReviewEntity[]>([]);
  const [output, setOutput] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreOutput, setRestoreOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modelReady, setModelReady] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [provider, setProvider] = useState<ProviderId>('gliner');
  const [region, setRegion] = useState<RegexRegionId>('all');
  const [customTerms, setCustomTerms] = useState(() => localStorage.getItem('oneboard-custom-terms') || 'Project Falcon');
  const [ignoreList, setIgnoreList] = useState(() => localStorage.getItem('oneboard-ignore-list') || '');
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [allowUnredactable, setAllowUnredactable] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const custom = useMemo(() => customTerms.split('\n'), [customTerms]);
  const ignored = useMemo(() => ignoreList.split('\n'), [ignoreList]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    getEngine().then((engine) => {
      const settings = engine.getSettings();
      setProvider(settings.providerId);
      setRegion(settings.regexRegion);
    }).catch((err) => setError(friendlyError(err)));
  }, [theme]);

  async function detect(text: string): Promise<DetectedEntity[]> {
    const engine = await getEngine();
    try {
      return filterAndMergeEntities(text, await engine.detect(text), custom, ignored);
    } catch (err) {
      if (err instanceof ModelNotLoadedError) setShowConsent(true);
      throw err;
    }
  }

  async function analyzeText() {
    if (!input.trim()) return;
    setBusy(true); setError(''); setNotice(''); setOutput('');
    try {
      const found = await detect(input);
      setEntities(found.map((entity, index) => ({ ...entity, id: `${entity.start}-${entity.end}-${index}`, enabled: true })));
      setNotice(found.length ? `${found.length} local detection${found.length === 1 ? '' : 's'} ready for review.` : 'No sensitive entities were detected. Review before sharing.');
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  function protectSelected() {
    const selected = entities.filter((entity) => entity.enabled);
    setOutput(sessionRef.current.anonymizeText(input, selected));
    setNotice(`${selected.length} selected ${selected.length === 1 ? 'value' : 'values'} protected locally.`);
  }

  function clearSession() {
    sessionRef.current.clear(); sessionRef.current = newSession();
    setInput(''); setEntities([]); setOutput(''); setRestoreInput(''); setRestoreOutput('');
    setFileState(null); setError(''); setNotice('Current local session cleared.');
  }

  async function downloadModel() {
    setBusy(true); setError('');
    try {
      const engine = await getEngine();
      const unsubscribe = engine.onDownloadProgress(({ loaded, total }) => setDownloadProgress(total ? loaded / total : 0));
      try { await engine.preload(); } finally { unsubscribe(); }
      setModelReady(true); setShowConsent(false); setNotice('Verified local model is ready.');
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  async function chooseFile(file: File) {
    setError(''); setNotice(''); setAllowUnredactable(false);
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf')) { setError('PDF protection is not included in OneBoard Privacy Guard v1.0.0. Use OneBoard PDF OCR Batch for PDF OCR workflows.'); return; }
    if (lower.endsWith('.doc')) { setError('Legacy .doc requires a separate safety path and is not advertised in this release. Save it as .docx first.'); return; }
    if (lower.endsWith('.docx') || lower.endsWith('.xlsx')) setFileState({ file, kind: 'office', entities: [] });
    else if (isImageFile(file.name)) setFileState({ file, kind: 'image', entities: [] });
    else setError('Supported formats: DOCX, XLSX, PNG, JPEG, WebP, BMP, GIF, TIFF.');
  }

  async function analyzeFile() {
    if (!fileState) return;
    setBusy(true); setError('');
    try {
      if (fileState.kind === 'office') {
        const analysis = await analyzeOfficeFile(fileState.file, detect);
        const review = filterAndMergeEntities(analysis.plainText, analysis.entities, custom, ignored)
          .map((entity, index) => ({ ...entity, id: `${entity.start}-${entity.end}-${index}`, enabled: true }));
        setFileState({ ...fileState, analysis: { ...analysis, entities: review }, entities: review });
        setNotice(`${review.length} detections ready. ${analysis.unredactable.length ? 'Export is blocked until you review unredactable parts.' : 'The file can be exported safely after review.'}`);
      } else {
        const canvas = await loadImageToCanvas(fileState.file);
        const base = new URL('/tesseract/', window.location.href).href;
        const ocr = await recognizeLocal(canvas, language, {
          workerPath: `${base}worker.min.js`, corePath: `${base}tesseract-core.wasm.js`, langPath: `${base}lang`,
        });
        const found = await detect(ocr.text);
        const review = found.map((entity, index) => ({ ...entity, id: `${entity.start}-${entity.end}-${index}`, enabled: true }));
        setFileState({ ...fileState, canvas, ocr, entities: review });
        setNotice(`${review.length} OCR detections ready for review.`);
      }
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  async function exportFile() {
    if (!fileState) return;
    setBusy(true); setError('');
    try {
      const selected = fileState.entities.filter((entity) => entity.enabled);
      if (fileState.kind === 'office' && fileState.analysis) {
        const result = await redactOfficeFile(fileState.file, {
          session: sessionRef.current, entities: selected, onMismatch: 'throw', allowUnredactable,
        });
        downloadBlob(result.blob, result.suggestedName);
        setNotice(`Protected copy exported locally${result.warnings.length ? ` with ${result.warnings.length} warning(s)` : ''}.`);
      } else if (fileState.kind === 'image' && fileState.canvas && fileState.ocr) {
        const blob = await renderRedactedImage(fileState.canvas, fileState.ocr.words, selected.map(({ start, end }) => ({ start, end })));
        downloadBlob(blob, fileState.file.name.replace(/\.[^.]+$/, '.redacted.png'));
        setNotice('Redacted pixels were rendered into the exported PNG.');
      }
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  async function updateProvider(next: ProviderId) {
    const engine = await getEngine();
    if (next !== provider) { await engine.updateSettings({ providerId: next }); setProvider(next); setModelReady(false); setShowConsent(true); }
  }

  async function savePreferences() {
    const engine = await getEngine();
    await engine.updateSettings({ regexRegion: region, customLabels: custom.filter(Boolean) });
    localStorage.setItem('oneboard-language', language); localStorage.setItem('oneboard-theme', theme);
    localStorage.setItem('oneboard-custom-terms', customTerms); localStorage.setItem('oneboard-ignore-list', ignoreList);
    setNotice('Non-sensitive preferences saved locally.');
  }

  const renderReview = (items: ReviewEntity[], update: (next: ReviewEntity[]) => void) => (
    <div className="entity-list">
      {!items.length && <div className="empty-state">{t('empty')}</div>}
      {items.map((entity) => <label className="entity-row" key={entity.id}>
        <input type="checkbox" checked={entity.enabled} onChange={() => update(items.map((item) => item.id === entity.id ? { ...item, enabled: !item.enabled } : item))} />
        <span className={`entity-type type-${entity.type.toLowerCase()}`}>{entity.type.replace('_', ' ')}</span>
        <span className="entity-value">{maskedPreview(entity.value)}</span>
        <span className="confidence">{entity.detector === 'custom' ? 'Custom' : `${Math.round(entity.confidence * 100)}%`}</span>
      </label>)}
    </div>
  );

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="/icons/64x64.png" alt="" /><div><strong>OneBoard</strong><span>Privacy Guard</span></div></div>
      <nav>{nav.map((item) => <button className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} key={item.id}><span>{item.icon}</span>{t(item.key)}</button>)}</nav>
      <div className="privacy-badge"><span className="pulse" /><strong>{t('local')}</strong><small>{t('network')}</small></div>
      <button className="clear-button" onClick={clearSession}>{t('clear')}</button>
      <div className="version">v1.0.0</div>
    </aside>
    <main>
      <header><div><div className="eyebrow">ONEBOARD PRIVACY GUARD</div><h1>{tab === 'protect' ? t('title') : t(nav.find((n) => n.id === tab)!.key)}</h1></div><div className="header-status"><span className={modelReady ? 'ready-dot' : 'idle-dot'} />{providerDetails[provider].label}</div></header>
      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      {tab === 'protect' && <section className="workspace">
        <p className="lead">{t('subtitle')}</p>
        <div className="two-column">
          <div className="panel"><div className="panel-title"><span>{t('input')}</span><small>{input.length.toLocaleString()} chars</small></div>
            <textarea value={input} onChange={(e) => { setInput(e.target.value); setEntities([]); setOutput(''); }} placeholder={t('placeholder')} />
            <button className="primary" disabled={busy || !input.trim()} onClick={analyzeText}>{busy ? 'Working locally…' : t('analyze')}</button>
          </div>
          <div className="panel"><div className="panel-title"><span>{t('detected')}</span><small>{entities.filter((e) => e.enabled).length} selected</small></div>
            {renderReview(entities, setEntities)}
            <button className="primary" disabled={!entities.length || busy} onClick={protectSelected}>{t('protectAction')}</button>
          </div>
        </div>
        <div className="panel output-panel"><div className="panel-title"><span>{t('output')}</span><span className="safe-label">LOCAL OUTPUT</span></div>
          <textarea readOnly value={output} placeholder="Protected text will appear here after review." />
          <button className="secondary" disabled={!output} onClick={() => navigator.clipboard.writeText(output)}>{t('copy')}</button>
        </div>
      </section>}

      {tab === 'restore' && <section className="workspace"><p className="lead">{t('restoreHint')}</p><div className="two-column">
        <div className="panel"><div className="panel-title">{t('restoreTitle')}</div><textarea value={restoreInput} onChange={(e) => setRestoreInput(e.target.value)} placeholder="[PERSON_1] said…" /><button className="primary" onClick={() => setRestoreOutput(sessionRef.current.deanonymize(restoreInput))}>{t('restoreAction')}</button></div>
        <div className="panel"><div className="panel-title">{t('restored')}</div><textarea readOnly value={restoreOutput} /><p className="fine-print">Restoration uses only the current in-memory mapping. No mapping is uploaded or automatically saved.</p></div>
      </div></section>}

      {tab === 'files' && <section className="workspace"><p className="lead">{t('filesHint')}</p>
        <div className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) void chooseFile(file); }} onClick={() => fileInput.current?.click()}>
          <input ref={fileInput} type="file" accept=".docx,.xlsx,image/png,image/jpeg,image/webp,image/bmp,image/gif,image/tiff,.pdf,.doc" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) void chooseFile(file); }} />
          <span className="drop-icon">＋</span><strong>{fileState?.file.name || t('open')}</strong><small>DOCX · XLSX · PNG · JPEG · WebP · BMP · GIF · TIFF</small>
        </div>
        {fileState && <div className="panel file-panel"><div className="panel-title"><span>{fileState.file.name}</span><small>{(fileState.file.size / 1024).toFixed(1)} KB</small></div>
          {fileState.kind === 'image' && !fileState.ocr && <div className="info-card">OCR runs locally. English and Vietnamese language data are bundled; no image or OCR text is uploaded.</div>}
          {fileState.analysis?.warnings.map((warning) => <div className="warning" key={warning}>{warning}</div>)}
          {!!fileState.analysis?.unredactable.length && <div className="danger-card"><strong>Unredactable content found</strong>{fileState.analysis.unredactable.map((part) => <span key={part.part}>{part.label}: {part.part}</span>)}<label><input type="checkbox" checked={allowUnredactable} onChange={(e) => setAllowUnredactable(e.target.checked)} /> I understand these listed parts will be copied unchanged.</label></div>}
          {(fileState.analysis || fileState.ocr) && renderReview(fileState.entities, (next) => setFileState({ ...fileState, entities: next }))}
          <div className="actions"><button className="primary" disabled={busy} onClick={analyzeFile}>{t('processFile')}</button><button className="secondary" disabled={busy || !(fileState.analysis || fileState.ocr) || (!!fileState.analysis?.unredactable.length && !allowUnredactable)} onClick={exportFile}>{t('exportFile')}</button></div>
        </div>}
      </section>}

      {tab === 'settings' && <section className="workspace settings-grid">
        <div className="panel"><div className="panel-title">{t('model')}</div><select value={provider} onChange={(e) => void updateProvider(e.target.value as ProviderId)}><option value="gliner">GLiNER PII Small (~83 MB) — default</option><option value="gliner-base">GLiNER PII Base (~197 MB)</option><option value="bardsai">BardS.ai EU PII (~500 MB)</option></select><p className="fine-print">Models are downloaded only after explicit consent and verified against hashes pinned by DocCloak.Core.</p></div>
        <div className="panel"><div className="panel-title">{t('language')}</div><select value={language} onChange={(e) => setLanguage(e.target.value as Language)}><option value="en">English</option><option value="vi">Tiếng Việt</option></select><div className="panel-title spaced">{t('region')}</div><select value={region} onChange={(e) => setRegion(e.target.value as RegexRegionId)}>{REGEX_REGIONS.map((item) => <option key={item} value={item}>{item === 'all' ? 'Universal / Automatic' : item.toUpperCase()}</option>)}</select></div>
        <div className="panel"><div className="panel-title">{t('customTerms')}</div><textarea className="short" value={customTerms} onChange={(e) => setCustomTerms(e.target.value)} /><p className="fine-print">One term per line. Stored locally on this device.</p></div>
        <div className="panel"><div className="panel-title">{t('ignoreList')}</div><textarea className="short" value={ignoreList} onChange={(e) => setIgnoreList(e.target.value)} /><p className="fine-print">Exact values, one per line. Stored locally on this device.</p></div>
        <div className="panel"><div className="panel-title">Appearance</div><select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select><button className="primary top-gap" onClick={() => void savePreferences()}>{t('savePrefs')}</button></div>
        <div className="info-card wide">{t('privacy')}</div>
      </section>}

      {tab === 'about' && <section className="workspace about-page"><img className="about-icon" src="/icons/128x128.png" alt="OneBoard Privacy Guard" /><h2>OneBoard Privacy Guard</h2><p className="about-version">Version 1.0.0</p><p>Designed for local-first privacy workflows.</p><div className="about-links"><a href="https://oneboard.io.vn" target="_blank" rel="noreferrer">oneboard.io.vn</a><a href="https://github.com/phat7000/OneBoardPrivacyGuard" target="_blank" rel="noreferrer">GitHub</a></div><div className="attribution"><strong>Detection engine based on DocCloak.Core</strong><span>Copyright its respective author(s)</span><span>Apache License 2.0</span></div><p className="fine-print">OneBoard Privacy Guard does not promise perfect detection. Always review results before sharing protected content.</p></section>}
    </main>

    {showConsent && <div className="modal-backdrop"><div className="modal"><div className="shield">◇</div><h2>{t('modelRequired')}</h2><p>{providerDetails[provider].label} ({providerDetails[provider].size})</p><p>{t('modelBody')}</p>{downloadProgress > 0 && <div className="progress"><span style={{ width: `${downloadProgress * 100}%` }} /></div>}<div className="modal-actions"><button className="secondary" disabled={busy} onClick={() => setShowConsent(false)}>{t('notNow')}</button><button className="primary" disabled={busy} onClick={() => void downloadModel()}>{busy ? `${Math.round(downloadProgress * 100)}%` : t('download')}</button></div></div></div>}
  </div>;
}
