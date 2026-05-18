export type LocalArchivePackageType = 'trip' | 'year' | 'capsule';

export interface LocalArchiveMetric {
  label: string;
  value: string;
  description?: string;
}

export interface LocalArchiveFileInput {
  path: string;
  content: string | Uint8Array;
  type?: string;
}

export interface LocalArchiveManifestInput {
  packageType: LocalArchivePackageType;
  sourceId: string;
  title: string;
  subtitle?: string;
  generatedAt?: string;
  sourceUpdatedAt?: string;
  metrics?: LocalArchiveMetric[];
  imageUrls?: string[];
}

export interface LocalArchiveManifest extends Required<Omit<LocalArchiveManifestInput, 'subtitle' | 'sourceUpdatedAt' | 'metrics' | 'imageUrls'>> {
  schemaVersion: 1;
  appName: 'personal_travel_daily';
  subtitle?: string;
  sourceUpdatedAt?: string;
  metrics: LocalArchiveMetric[];
  imageUrls: string[];
  files: string[];
  notes: string[];
}

const textEncoder = new TextEncoder();

const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function encodeText(value: string) {
  return textEncoder.encode(value);
}

function normalizeArchivePath(path: string) {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[<>:"|?*\u0000-\u001f]/g, '-').trim() || 'untitled')
    .join('/');
}

function calculateCrc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function createHeader(size: number) {
  const bytes = new Uint8Array(size);
  return { bytes, view: new DataView(bytes.buffer) };
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.byteLength;
  });
  return output;
}

function getDosDateParts(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

export function sanitizeArchiveFilename(value: string, fallback = 'travel-archive') {
  const safe = value
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
  return safe || fallback;
}

export function uniqueImageUrls(urls: Array<string | undefined | null>) {
  return Array.from(new Set(urls.filter((url): url is string => !!url?.trim()).map((url) => url.trim())));
}

export function buildLocalArchiveManifest(input: LocalArchiveManifestInput, files: LocalArchiveFileInput[]): LocalArchiveManifest {
  return {
    schemaVersion: 1,
    appName: 'personal_travel_daily',
    packageType: input.packageType,
    sourceId: input.sourceId,
    title: input.title,
    subtitle: input.subtitle,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceUpdatedAt: input.sourceUpdatedAt,
    metrics: input.metrics ?? [],
    imageUrls: uniqueImageUrls(input.imageUrls ?? []),
    files: files.map((file) => normalizeArchivePath(file.path)),
    notes: [
      'This browser package stores source data, SVG previews, Markdown summary, and remote image URLs only.',
      'Images are not base64-inlined or proxied; unavailable remote URLs may need manual backup.',
    ],
  };
}

export function buildImageUrlList(imageUrls: string[]) {
  const uniqueUrls = uniqueImageUrls(imageUrls);
  if (uniqueUrls.length === 0) {
    return '# Image URL List\n\nNo remote image URLs were found in this archive.\n';
  }
  return ['# Image URL List', '', ...uniqueUrls.map((url, index) => `${index + 1}. ${url}`), ''].join('\n');
}

export function buildMarkdownSummary(input: LocalArchiveManifestInput, sections: string[]) {
  const lines = [
    `# ${input.title}`,
    '',
    input.subtitle ? `> ${input.subtitle}` : undefined,
    input.subtitle ? '' : undefined,
    `- Package Type: ${input.packageType}`,
    `- Source ID: ${input.sourceId}`,
    `- Generated At: ${input.generatedAt ?? new Date().toISOString()}`,
    ...(input.metrics?.map((metric) => `- ${metric.label}: ${metric.value}${metric.description ? ` (${metric.description})` : ''}`) ?? []),
    '',
    ...sections,
    '',
  ];
  return lines.filter((line): line is string => line !== undefined).join('\n');
}

export function createStoredZipBlob(files: LocalArchiveFileInput[]) {
  const now = new Date();
  const { dosTime, dosDate } = getDosDateParts(now);
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const path = normalizeArchivePath(file.path);
    const filename = encodeText(path);
    const content = typeof file.content === 'string' ? encodeText(file.content) : file.content;
    const crc32 = calculateCrc32(content);

    const local = createHeader(30);
    writeUint32(local.view, 0, 0x04034b50);
    writeUint16(local.view, 4, 20);
    writeUint16(local.view, 6, 0x0800);
    writeUint16(local.view, 8, 0);
    writeUint16(local.view, 10, dosTime);
    writeUint16(local.view, 12, dosDate);
    writeUint32(local.view, 14, crc32);
    writeUint32(local.view, 18, content.byteLength);
    writeUint32(local.view, 22, content.byteLength);
    writeUint16(local.view, 26, filename.byteLength);
    writeUint16(local.view, 28, 0);
    localParts.push(local.bytes, filename, content);

    const central = createHeader(46);
    writeUint32(central.view, 0, 0x02014b50);
    writeUint16(central.view, 4, 20);
    writeUint16(central.view, 6, 20);
    writeUint16(central.view, 8, 0x0800);
    writeUint16(central.view, 10, 0);
    writeUint16(central.view, 12, dosTime);
    writeUint16(central.view, 14, dosDate);
    writeUint32(central.view, 16, crc32);
    writeUint32(central.view, 20, content.byteLength);
    writeUint32(central.view, 24, content.byteLength);
    writeUint16(central.view, 28, filename.byteLength);
    writeUint16(central.view, 30, 0);
    writeUint16(central.view, 32, 0);
    writeUint16(central.view, 34, 0);
    writeUint16(central.view, 36, 0);
    writeUint32(central.view, 38, 0);
    writeUint32(central.view, 42, offset);
    centralParts.push(central.bytes, filename);

    offset += local.bytes.byteLength + filename.byteLength + content.byteLength;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = createHeader(22);
  writeUint32(end.view, 0, 0x06054b50);
  writeUint16(end.view, 8, files.length);
  writeUint16(end.view, 10, files.length);
  writeUint32(end.view, 12, centralDirectory.byteLength);
  writeUint32(end.view, 16, offset);

  const zipBytes = concatBytes([...localParts, centralDirectory, end.bytes]);
  const zipBuffer = zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength);
  return new Blob([zipBuffer], { type: 'application/zip' });
}

export function triggerArchiveDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportLocalArchivePackage(input: LocalArchiveManifestInput, baseFiles: LocalArchiveFileInput[]) {
  const manifest = buildLocalArchiveManifest(input, baseFiles);
  const files = [
    { path: 'manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n`, type: 'application/json' },
    ...baseFiles,
  ];
  const blob = createStoredZipBlob(files);
  triggerArchiveDownload(blob, `${sanitizeArchiveFilename(input.title)}-archive.zip`);
  return blob;
}
