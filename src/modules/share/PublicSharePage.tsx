import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { accessPublicShareLink } from '../../lib/api/shareLinksApi';
import type { PublicShareAccessResponseDto, PublicShareResourceDto } from '../../lib/api/types';
import { buildPublicShareOgSvg, getPublicShareTemplate } from './publicSharePageModel';

interface PublicSharePageProps {
  token: string;
}

const RESOURCE_LABELS: Record<PublicShareResourceDto['kind'], string> = {
  trip_story: '行程故事',
  annual_review: '年度回顾',
  companion_memory: '旅伴回忆',
  memory_capsule: '旅行胶囊',
};

function getResourceIntro(resource: PublicShareResourceDto) {
  if (resource.memoryCapsule) {
    return resource.memoryCapsule.content.hero.subtitle ?? resource.memoryCapsule.capsule.subtitle ?? '一枚只读旅行胶囊。';
  }
  if (resource.tripStory) {
    return resource.tripStory.trip.note || '这是一页只读行程故事。';
  }
  if (resource.annualReview) {
    return `${resource.annualReview.year} 年共记录 ${resource.annualReview.summary.totalMarkers} 段旅行足迹。`;
  }
  if (resource.companionMemory) {
    return resource.companionMemory.summary.headline;
  }
  return '这是一份只读私密分享。';
}

function getMetrics(resource: PublicShareResourceDto) {
  if (resource.memoryCapsule) {
    return resource.memoryCapsule.content.metrics.slice(0, 4);
  }
  if (resource.tripStory) {
    return [
      { label: '记录', value: String(resource.tripStory.summary.markerCount) },
      { label: '城市', value: String(resource.tripStory.summary.cityCount) },
      { label: '照片', value: String(resource.tripStory.summary.photoCount) },
      { label: '攻略', value: String(resource.tripStory.summary.guideCount) },
    ];
  }
  if (resource.annualReview) {
    return [
      { label: '记录', value: String(resource.annualReview.summary.totalMarkers) },
      { label: '城市', value: String(resource.annualReview.summary.totalCities) },
      { label: '照片', value: String(resource.annualReview.summary.photoCount) },
      { label: '旅伴', value: String(resource.annualReview.summary.activeCompanions) },
    ];
  }
  if (resource.companionMemory) {
    return [
      { label: '记录', value: String(resource.companionMemory.summary.markerCount) },
      { label: '城市', value: String(resource.companionMemory.summary.cityCount) },
      { label: '照片', value: String(resource.companionMemory.summary.photoCount) },
      { label: '旅伴', value: resource.companionMemory.companion.name },
    ];
  }
  return [];
}

function getPhotos(resource: PublicShareResourceDto) {
  if (resource.memoryCapsule) {
    return resource.memoryCapsule.content.photos
      .slice(0, 6)
      .map((photo) => ({ imageId: photo.imageId, imageUrl: photo.imageUrl, title: photo.title, caption: photo.caption }));
  }
  if (resource.tripStory) {
    return resource.tripStory.photos
      .slice(0, 6)
      .map((photo) => ({ imageId: photo.imageId, imageUrl: photo.imageUrl, title: photo.markerTitle, caption: photo.caption }));
  }
  if (resource.annualReview) {
    return resource.annualReview.photos
      .slice(0, 6)
      .map((photo) => ({ imageId: photo.imageId, imageUrl: photo.imageUrl, title: photo.markerTitle, caption: photo.caption }));
  }
  if (resource.companionMemory) {
    return resource.companionMemory.photos
      .slice(0, 6)
      .map((photo) => ({ imageId: photo.imageId, imageUrl: photo.imageUrl, title: photo.markerTitle, caption: photo.caption }));
  }
  return [];
}

export default function PublicSharePage({ token }: PublicSharePageProps) {
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState<PublicShareAccessResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resource = response?.resource;
  const metrics = useMemo(() => (resource ? getMetrics(resource) : []), [resource]);
  const photos = useMemo(() => (resource ? getPhotos(resource) : []), [resource]);
  const template = useMemo(() => (resource ? getPublicShareTemplate(resource) : null), [resource]);
  const ogSvg = useMemo(() => (resource ? buildPublicShareOgSvg(resource) : ''), [resource]);

  const loadShare = async (nextPassword?: string) => {
    setErrorMessage('');
    const nextResponse = await accessPublicShareLink(token, nextPassword);
    setResponse(nextResponse);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadShare()
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : '分享链接无法打开');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await loadShare(password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '访问密码不正确');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="public-share-shell">
        <section className="public-share-state">正在打开私密分享...</section>
      </main>
    );
  }

  if (response?.passwordRequired && !resource) {
    return (
      <main className="public-share-shell">
        <section className="public-share-gate">
          <span className="hero-kicker">Private Share</span>
          <h1>{response.link?.title ?? '私密分享'}</h1>
          <p>此链接受访问密码保护。输入密码后仅可只读浏览，不会进入账号内导航或编辑模式。</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              placeholder="访问密码"
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="submit" className="primary-button" disabled={submitting || !password}>
              {submitting ? '验证中...' : '打开分享'}
            </button>
          </form>
          {errorMessage ? <p className="public-share-error">{errorMessage}</p> : null}
        </section>
      </main>
    );
  }

  if (!resource) {
    return (
      <main className="public-share-shell">
        <section className="public-share-state">
          <h1>分享链接暂时不可用</h1>
          <p>{errorMessage || '链接可能已过期、撤销或达到访问次数上限。'}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="public-share-shell">
      <article className={`public-share-page ${template?.className ?? ''}`}>
        <header className="public-share-hero">
          <span className="hero-kicker">{RESOURCE_LABELS[resource.kind]} · {template?.label}</span>
          <h1>{resource.title}</h1>
          <p>{getResourceIntro(resource)}</p>
          <div className="public-share-hero-meta">
            <small>{template?.rhythm}</small>
            <small>只读分享 · 生成于 {new Date(resource.generatedAt).toLocaleString('zh-CN')}</small>
            {ogSvg ? <a href={ogSvg} download={`${resource.kind}-og.svg`}>下载 OG 卡片</a> : null}
          </div>
        </header>

        {metrics.length > 0 ? (
          <section className="public-share-metrics" aria-label="分享摘要">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                {'description' in metric && metric.description ? <p>{metric.description}</p> : null}
              </div>
            ))}
          </section>
        ) : null}

        {photos.length > 0 ? (
          <section className="public-share-photos" aria-label="精选照片">
            {photos.map((photo) => (
              <figure key={photo.imageId}>
                <img src={photo.imageUrl} alt={photo.title ?? '旅行照片'} />
                <figcaption>{photo.title ?? photo.caption ?? '旅行照片'}</figcaption>
              </figure>
            ))}
          </section>
        ) : null}

        <section className="public-share-chapters" aria-label="分享章节">
          <article><span>01</span><strong>路线</strong><p>使用已公开的城市与真实坐标摘要，不暴露后台原始数据。</p></article>
          <article><span>02</span><strong>照片</strong><p>仅展示精选图片与说明，不包含上传凭证或管理入口。</p></article>
          <article><span>03</span><strong>回看</strong><p>读者看到的是已封装故事，而不是账号工作台。</p></article>
        </section>

        <section className="public-share-readonly-note">
          <strong>隐私边界</strong>
          <p>此页面不包含账号导航、编辑入口、后台信息或原始管理数据；链接可由分享者随时撤销。</p>
        </section>
      </article>
    </main>
  );
}
