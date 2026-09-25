import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { AnonymizationSession, type DetectedEntity } from '@doccloak/core';
import { analyzeOfficeFile, redactOfficeFile, UnsupportedDocumentError } from '@doccloak/core/dom';

const syntheticText = 'Alice Example alice@example.com +1 202-555-0100 Example Company';

function detector(text: string): Promise<DetectedEntity[]> {
  const specs: Array<[string, DetectedEntity['type']]> = [
    ['Alice Example', 'PERSON'], ['alice@example.com', 'EMAIL'], ['+1 202-555-0100', 'PHONE'], ['Example Company', 'COMPANY'],
  ];
  return Promise.resolve(specs.flatMap(([value, type]) => {
    const start = text.indexOf(value);
    return start < 0 ? [] : [{ type, value, start, end: start + value.length, confidence: 1, detector: 'synthetic-test' }];
  }));
}

async function makeDocx(unredactable = false): Promise<File> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${syntheticText}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`);
  zip.file('docProps/core.xml', `<?xml version="1.0"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:creator>Alice Example</dc:creator><cp:lastModifiedBy>Alice Example</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2026-09-24T00:00:00Z</dcterms:created></cp:coreProperties>`);
  if (unredactable) zip.file('word/embeddings/oleObject1.bin', new Uint8Array([1, 2, 3]));
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return { name: 'synthetic.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: bytes.byteLength, arrayBuffer: async () => bytes } as unknown as File;
}

async function makeXlsx(): Promise<File> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file('xl/workbook.xml', `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>${syntheticText}</t></is></c></row></sheetData></worksheet>`);
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return { name: 'synthetic.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: bytes.byteLength, arrayBuffer: async () => bytes } as unknown as File;
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
  return new Uint8Array(buffer);
}

async function zipText(blob: Blob): Promise<string> {
  const zip = await JSZip.loadAsync(await blobBytes(blob));
  const values: string[] = [];
  for (const [name, entry] of Object.entries(zip.files)) if (!entry.dir && /\.(xml|rels)$/i.test(name)) values.push(await entry.async('string'));
  return values.join('\n');
}

describe('Office fail-closed protection', () => {
  it('protects DOCX content, scrubs metadata, and stays openable', async () => {
    const file = await makeDocx();
    const analysis = await analyzeOfficeFile(file, detector);
    expect(analysis.entities).toHaveLength(4);
    const result = await redactOfficeFile(file, { session: new AnonymizationSession(), entities: analysis.entities });
    const text = await zipText(result.blob);
    expect(text).not.toContain('Alice Example');
    expect(text).not.toContain('alice@example.com');
    expect(text).toContain('[PERSON_1]');
    expect((await JSZip.loadAsync(await blobBytes(result.blob))).file('word/document.xml')).not.toBeNull();
  });

  it('protects XLSX string cells and preserves a valid workbook package', async () => {
    const file = await makeXlsx();
    const analysis = await analyzeOfficeFile(file, detector);
    const result = await redactOfficeFile(file, { session: new AnonymizationSession(), entities: analysis.entities });
    const text = await zipText(result.blob);
    expect(text).not.toContain('Alice Example');
    expect(text).not.toContain('alice@example.com');
    expect(text).toContain('[PERSON_1]');
    expect((await JSZip.loadAsync(await blobBytes(result.blob))).file('xl/workbook.xml')).not.toBeNull();
  });

  it('refuses unredactable embedded Office content by default', async () => {
    const file = await makeDocx(true);
    const analysis = await analyzeOfficeFile(file, detector);
    expect(analysis.unredactable.length).toBeGreaterThan(0);
    await expect(redactOfficeFile(file, { session: new AnonymizationSession(), entities: analysis.entities })).rejects.toBeInstanceOf(UnsupportedDocumentError);
  });

  it('rejects stale analysis instead of silently exporting', async () => {
    const file = await makeDocx();
    const analysis = await analyzeOfficeFile(file, detector);
    const stale = analysis.entities.map((item, index) => index === 0 ? { ...item, value: 'Wrong Value' } : item);
    await expect(redactOfficeFile(file, { session: new AnonymizationSession(), entities: stale })).rejects.toMatchObject({ name: 'StaleAnalysisError' });
  });
});
