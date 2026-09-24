import { useEffect } from 'react';
import { Footer, Header } from './Site.jsx';
import { Markdown } from '../lib/Markdown.jsx';

const TITLES = { terms: 'Terms & Conditions', privacy: 'Privacy Policy' };

export function LegalPage({ kind, content }) {
  const title = TITLES[kind];
  const body = content.legal?.[kind] || '';

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = `${title} · ${content.site.companyName}`;
    return () => {
      document.title = prev;
    };
  }, [title, content.site.companyName]);

  return (
    <>
      <Header content={content} solid />
      <main className="legal-page">
        <div className="legal-hero">
          <div className="container narrow">
            <h1>{title}</h1>
            {content.legal?.updatedAt && <p className="muted">Last updated: {content.legal.updatedAt}</p>}
          </div>
        </div>
        <article className="container narrow prose">
          {body ? <Markdown source={body} /> : <p>This page has not been published yet.</p>}
        </article>
      </main>
      <Footer content={content} />
    </>
  );
}
