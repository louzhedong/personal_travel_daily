import type { RefObject } from 'react';
import { renderHighlightedText } from '../lib/guides/guideDocumentView';
import type { GuideDocument, GuideSearchResult } from '../types';

/**
 * Evaluate whether the source URL points to an openable external page.
 * 判断来源 URL 是否可以作为外链直接打开。
 */
function canOpenOriginalSource(sourceUrl: string) {
  return /^https?:\/\//.test(sourceUrl) && !sourceUrl.includes('guide-api.local');
}

/**
 * Props for GuideDocumentDrawer.
 * GuideDocumentDrawer 的属性定义。
 */
interface GuideDocumentDrawerProps {
  /** Whether the layout lock is engaged. 是否启用布局锁定样式。 */
  layoutLocked: boolean;
  /** Heading text shown next to the drawer title. 抽屉标题右侧展示的目的地 / 标题文案。 */
  headingText: string;
  /** Currently selected guide summary from the result list. 当前选中的结果条目。 */
  selectedGuide: GuideSearchResult | null;
  /** Fully loaded guide document, if any. 已加载完成的攻略正文数据。 */
  guideDocument: GuideDocument | null;
  /** Whether the document is currently loading. 正文是否正在加载。 */
  documentLoading: boolean;
  /** Error message for document loading. 正文加载的错误信息。 */
  documentError: string;
  /** Active document tab view. 当前激活的正文视图。 */
  documentView: 'snippet' | 'original';
  /** Tokens used to highlight matched keywords. 用于高亮关键词的分词结果。 */
  highlightTokens: string[];
  /** Transformed original HTML view with outline sections. 处理后的原文视图（含目录）。 */
  originalDocumentView: { html: string; sections: Array<{ id: string; title: string }> };
  /** Whether any AI summary section contains items. 攻略速览是否包含至少一个要点。 */
  hasAiSummary: boolean;
  /** Ref attached to the drawer root element. 抽屉根节点的 ref。 */
  documentPanelRef: RefObject<HTMLElement | null>;
  /** Ref attached to the scrollable drawer body. 抽屉滚动容器的 ref。 */
  documentBodyRef: RefObject<HTMLDivElement | null>;
  /** Ref attached to the original content container. 原文内容容器的 ref。 */
  originalContentRef: RefObject<HTMLDivElement | null>;
  /** Switch document view tab. 切换正文视图。 */
  onDocumentViewChange: (view: 'snippet' | 'original') => void;
  /** Scroll to a specific original section. 跳转到原文指定目录项。 */
  onJumpToSection: (sectionId: string) => void;
}

/**
 * Right-side document drawer that renders snippet view, AI summary and original content.
 * 右侧正文抽屉，展示片段、AI 速览以及原文视图。
 */
export function GuideDocumentDrawer({
  layoutLocked,
  headingText,
  selectedGuide,
  guideDocument,
  documentLoading,
  documentError,
  documentView,
  highlightTokens,
  originalDocumentView,
  hasAiSummary,
  documentPanelRef,
  documentBodyRef,
  originalContentRef,
  onDocumentViewChange,
  onJumpToSection,
}: GuideDocumentDrawerProps) {
  return (
    <aside
      ref={documentPanelRef}
      className={layoutLocked ? 'guide-document-panel is-locked' : 'guide-document-panel'}
    >
      <div className="guide-section-heading">
        <strong>正文内容</strong>
        <span>{headingText}</span>
      </div>
      <div
        ref={documentBodyRef}
        className={layoutLocked ? 'guide-document-panel-body is-scrollable' : 'guide-document-panel-body'}
      >
        {!selectedGuide ? (
          <div className="empty-state">从左侧结果中打开一篇攻略，这里会展示正文片段，也支持切换到原文视图。</div>
        ) : null}

        {selectedGuide ? (
          <div className="guide-document-card">
            <div className="guide-document-top">
              <h4 className="guide-document-title">{selectedGuide.title}</h4>
              <p className="guide-document-summary">
                {renderHighlightedText(selectedGuide.summary, highlightTokens)}
              </p>
            </div>

            {guideDocument && (guideDocument.blocks.length > 0 || guideDocument.contentHtml) ? (
              <div className="guide-document-view-switch" role="tablist" aria-label="正文视图切换">
                <button
                  type="button"
                  className={
                    documentView === 'snippet'
                      ? 'guide-document-view-button active'
                      : 'guide-document-view-button'
                  }
                  onClick={() => onDocumentViewChange('snippet')}
                >
                  片段
                </button>
                <button
                  type="button"
                  className={
                    documentView === 'original'
                      ? 'guide-document-view-button active'
                      : 'guide-document-view-button'
                  }
                  onClick={() => onDocumentViewChange('original')}
                  disabled={!guideDocument.contentHtml}
                >
                  原文
                </button>
              </div>
            ) : null}

            {documentLoading ? <div className="empty-state">正在加载正文片段...</div> : null}
            {documentError ? <div className="empty-state">{documentError}</div> : null}

            {guideDocument && documentView === 'snippet' ? (
              <div className="guide-document-blocks">
                {hasAiSummary ? (
                  <section className="guide-ai-summary" aria-label="攻略速览">
                    <div className="guide-ai-summary-heading">攻略速览</div>
                    {guideDocument.aiSummary?.highlights.length ? (
                      <div>
                        <strong>亮点</strong>
                        <ul>
                          {guideDocument.aiSummary.highlights.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {guideDocument.aiSummary?.routeTips.length ? (
                      <div>
                        <strong>路线</strong>
                        <ul>
                          {guideDocument.aiSummary.routeTips.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {guideDocument.aiSummary?.transportTips.length ? (
                      <div>
                        <strong>交通</strong>
                        <ul>
                          {guideDocument.aiSummary.transportTips.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {guideDocument.aiSummary?.warnings.length ? (
                      <div>
                        <strong>注意</strong>
                        <ul>
                          {guideDocument.aiSummary.warnings.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                ) : null}
                {guideDocument.blocks.map((block) => (
                  <section key={block.id} className={`guide-document-block guide-document-block-${block.type}`}>
                    {block.type === 'section-title' ? (
                      <h5 className="guide-document-block-title">
                        {renderHighlightedText(block.text, highlightTokens)}
                      </h5>
                    ) : (
                      <p className="guide-document-block-text">
                        {renderHighlightedText(block.text, highlightTokens)}
                      </p>
                    )}
                  </section>
                ))}
              </div>
            ) : null}

            {guideDocument && documentView === 'original' ? (
              guideDocument.contentHtml ? (
                <div className="guide-document-original">
                  {originalDocumentView.sections.length > 0 ? (
                    <div className="guide-document-outline">
                      <div className="guide-document-outline-heading">
                        <strong>正文目录</strong>
                        <button
                          type="button"
                          className="ghost-button guide-document-top-button"
                          onClick={() => originalContentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })}
                        >
                          回到顶部
                        </button>
                      </div>
                      <div className="guide-document-outline-list">
                        {originalDocumentView.sections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            className="guide-document-outline-item"
                            onClick={() => onJumpToSection(section.id)}
                          >
                            {section.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div
                    ref={originalContentRef}
                    className="guide-document-original-content"
                    dangerouslySetInnerHTML={{ __html: originalDocumentView.html }}
                  />
                  {canOpenOriginalSource(guideDocument.sourceUrl) ? (
                    <a
                      href={guideDocument.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="guide-document-original-link"
                    >
                      在原网站查看完整页面
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="empty-state">当前来源暂时还没有可展示的原文视图。</div>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export default GuideDocumentDrawer;
