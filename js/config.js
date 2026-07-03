(() => {
  'use strict';

  const parts = window.location.pathname.split('/').filter(Boolean);
  const onGithub = window.location.hostname.endsWith('github.io');
  const repo = onGithub && parts[0] ? parts[0] : '';

  window.SEVDE_BASE = repo ? `/${repo}/` : './';

  window.assetUrl = function assetUrl(path) {
    return window.SEVDE_BASE + String(path).replace(/^\//, '');
  };

  const base = document.createElement('base');
  base.href = window.SEVDE_BASE;
  document.head.appendChild(base);
})();
