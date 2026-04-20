import { describe, expect, it } from 'vitest';
import { buildGuideDocumentFromHtml } from '../adapters/htmlGuideUtils.mjs';

const sampleEntry = {
  id: 'sample-kyoto',
  title: 'Discover Kyoto | Kyoto Travel',
  summary: 'Kyoto summary',
  sourceName: 'Kyoto Travel',
  sourceUrl: 'https://kyoto.travel/en/aboutkyoto/',
  destinationLabel: '京都',
  tags: ['京都', '官方旅游'],
};

const sampleHtml = `
<!doctype html>
<html>
  <head>
    <title>Discover Kyoto | Kyoto Travel</title>
    <meta name="description" content="Learn how Kyoto blends temples, food culture, and seasonal scenery." />
    <meta property="og:image" content="https://cdn.example.com/kyoto.jpg" />
  </head>
  <body>
    <main>
      <h1>Discover Kyoto</h1>
      <p>Kyoto offers a dense mix of shrines, gardens, and compact neighborhoods.</p>
      <h2>What to Expect</h2>
      <p>Plan for early starts if you want to enjoy iconic places before crowds build up.</p>
      <ul>
        <li>Fushimi Inari Taisha</li>
        <li>Kiyomizu-dera</li>
      </ul>
    </main>
  </body>
</html>
`;

describe('htmlGuideUtils', () => {
  it('builds a structured document from raw html', () => {
    const document = buildGuideDocumentFromHtml(sampleEntry, sampleHtml);

    expect(document.title).toBe('Discover Kyoto | Kyoto Travel');
    expect(document.summary).toBe('Learn how Kyoto blends temples, food culture, and seasonal scenery.');
    expect(document.coverImageUrl).toBe('https://cdn.example.com/kyoto.jpg');
    expect(document.blocks.some((block) => block.type === 'section-title')).toBe(true);
    expect(document.blocks.some((block) => block.type === 'bullet-list')).toBe(true);
  });
});
