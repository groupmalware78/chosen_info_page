import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { usePath } from './lib/router.js';
import { applyTheme } from './lib/theme.js';
import { api } from './lib/api.js';
import { Site } from './site/Site.jsx';
import { LegalPage } from './site/LegalPage.jsx';
import './styles/site.css';

const Admin = lazy(() => import('./admin/Admin.jsx'));

function readInitialContent() {
  try {
    const el = document.getElementById('__INITIAL_CONTENT__');
    return el ? JSON.parse(el.textContent) : null;
  } catch {
    return null;
  }
}

function PublicApp({ path }) {
  const [content, setContent] = useState(readInitialContent);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (content) {
      applyTheme(content.theme);
      return;
    }
    api
      .get('/api/content')
      .then((c) => {
        applyTheme(c.theme);
        setContent(c);
      })
      .catch(() => setError('We could not load the page. Please refresh to try again.'));
  }, [content]);

  if (error) return <div className="page-state">{error}</div>;
  if (!content) return <div className="page-state" aria-busy="true"><span className="spinner" /></div>;

  if (path === '/terms' || path === '/privacy') return <LegalPage kind={path.slice(1)} content={content} />;
  return <Site content={content} notFound={path !== '/'} />;
}

function App() {
  const path = usePath();
  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <Suspense fallback={<div className="page-state"><span className="spinner" /></div>}>
        <Admin />
      </Suspense>
    );
  }
  return <PublicApp path={path} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
