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
    expect(document.contentHtml).toContain('<h3>What to Expect</h3>');
    expect(document.contentHtml).toContain('<ul>');
    expect(document.blocks.some((block) => block.type === 'section-title')).toBe(true);
    expect(document.blocks.some((block) => block.type === 'bullet-list')).toBe(true);
  });

  it('filters noisy wiki-like layout and keeps richer article blocks', () => {
    const noisyHtml = `
      <!doctype html>
      <html>
        <body>
          <nav>导航菜单</nav>
          <div class="mw-parser-output">
            <div class="toc">目录</div>
            <h1>京都</h1>
            <p>京都适合第一次去日本自由行、又希望把文化体验和城市散步结合在一起的旅行者。</p>
            <h2>推荐停留时间</h2>
            <p>如果只去核心区域，2 到 3 天就能覆盖东山、岚山和市区经典路线。</p>
            <h2>经典节奏</h2>
            <ul>
              <li>东山寺社与老街</li>
              <li>哲学之道与冈崎公园</li>
              <li>岚山与嵯峨野</li>
            </ul>
            <h2>住宿建议</h2>
            <p>第一次去京都，住在四条河原町和京都站之间会更方便。</p>
            <div class="reference">参考资料</div>
          </div>
          <footer>页脚信息</footer>
        </body>
      </html>
    `;

    const document = buildGuideDocumentFromHtml(sampleEntry, noisyHtml);

    expect(document.blocks.length).toBeGreaterThanOrEqual(5);
    expect(document.blocks.some((block) => block.text === '目录')).toBe(false);
    expect(document.blocks.some((block) => block.text.includes('导航菜单'))).toBe(false);
    expect(document.blocks.some((block) => block.text === '推荐停留时间')).toBe(true);
    expect(document.blocks.some((block) => block.type === 'bullet-list')).toBe(true);
    expect(document.contentHtml).toContain('<h3>推荐停留时间</h3>');
    expect(document.contentHtml).not.toContain('导航菜单');
  });
});
