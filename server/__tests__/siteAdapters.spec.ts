import { describe, expect, it } from 'vitest';
import {
  buildKyotoTravelDocument,
  extractKyotoTravelContentHtml,
} from '../adapters/kyotoTravelCnAdapter.mjs';
import {
  buildQyerFallbackDocument,
  isQyerVerificationPage,
} from '../adapters/qyerForumAdapter.mjs';
import { createCatalogEntry } from '../adapters/types.mjs';

describe('site adapters', () => {
  it('focuses kyoto travel documents on the content region', () => {
    const entry = createCatalogEntry({
      id: 'kyoto-about',
      adapterId: 'kyoto-travel-cn',
      scope: 'international',
      title: '探寻京都 | 京都旅游',
      summary: '京都旅游中文官网的城市介绍页。',
      sourceName: '京都旅游',
      sourceUrl: 'https://kyoto.travel/cn/aboutkyoto.html',
      destinationLabel: '京都',
      tags: ['京都', '中文官网'],
    });
    const html = `
      <html>
        <body>
          <div id="cookie-banner"><p>Cookie 提示</p></div>
          <div id="content">
            <nav aria-label="面包屑"><a>首页</a></nav>
            <section>
              <h3>京都的文化气质</h3>
              <p>京都市的生活文化历经千年传承至今。</p>
            </section>
          </div>
          <footer>© 京都市・京都市观光协会</footer>
        </body>
      </html>
    `;

    const focusedHtml = extractKyotoTravelContentHtml(html);
    expect(focusedHtml).not.toContain('Cookie 提示');
    expect(focusedHtml).not.toContain('面包屑');
    expect(focusedHtml).not.toContain('© 京都市');

    const document = buildKyotoTravelDocument(entry, html);
    expect(document.blocks.some((block) => block.text === '京都的文化气质')).toBe(true);
    expect(document.contentHtml).toContain('京都市的生活文化历经千年传承至今');
  });

  it('filters kyoto navigation-like blocks from the final document', () => {
    const entry = createCatalogEntry({
      id: 'kyoto-about',
      adapterId: 'kyoto-travel-cn',
      scope: 'international',
      title: '探寻京都 | 京都旅游',
      summary: '京都旅游中文官网的城市介绍页。',
      sourceName: '京都旅游',
      sourceUrl: 'https://kyoto.travel/cn/aboutkyoto.html',
      destinationLabel: '京都',
      tags: ['京都', '中文官网'],
    });
    const html = `
      <html>
        <body>
          <div id="content">
            <section>
              <h3>京都 鲜活的传统</h3>
              <p>京都市的生活文化历经千年传承至今。</p>
            </section>
            <section>
              <h3>宣传视频</h3>
              <p>我们非常荣幸地向您推介视频。</p>
              <h3>查看所有视频</h3>
            </section>
            <section>
              <h3>京都的隐秘瑰宝</h3>
              <p>除举世闻名的地标性景点外，京都亦有诸多隐秘瑰宝待您发掘。</p>
              <h3>京北地区 |</h3>
              <h3>高雄地区 |</h3>
            </section>
            <section>
              <h3>相关网站</h3>
            </section>
          </div>
        </body>
      </html>
    `;

    const document = buildKyotoTravelDocument(entry, html);

    expect(document.contentHtml).toContain('京都 鲜活的传统');
    expect(document.contentHtml).toContain('京都的隐秘瑰宝');
    expect(document.contentHtml).not.toContain('宣传视频');
    expect(document.contentHtml).not.toContain('查看所有视频');
    expect(document.contentHtml).not.toContain('相关网站');
    expect(document.contentHtml).not.toContain('京北地区');
    expect(document.contentHtml).not.toContain('高雄地区');
  });

  it('detects qyer verification pages and returns a readable fallback document', () => {
    const entry = createCatalogEntry({
      id: 'qyer-demo',
      adapterId: 'qyer-forum',
      scope: 'domestic',
      title: '嘉兴 city walk：南湖到月河的半日路线',
      summary: '适合周末轻旅行，把南湖红船、子城遗址和月河历史街区串在一条步行线上。',
      sourceName: '穷游论坛',
      sourceUrl: 'https://bbs.qyer.com/thread-3701960-1.html',
      destinationLabel: '嘉兴',
      tags: ['中文攻略', '游记帖子', '穷游论坛'],
    });

    expect(isQyerVerificationPage('验证过程仅需几秒钟')).toBe(true);

    const document = buildQyerFallbackDocument(entry);
    expect(document.title).toBe(entry.title);
    expect(document.blocks.some((block) => block.text.includes('适合周末轻旅行'))).toBe(true);
    expect(document.contentHtml).toContain('当前状态');
    expect(document.contentHtml).toContain('点击下方原网站链接');
  });
});
