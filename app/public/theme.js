/* Runs before first paint in both the website and its journey frame. */
(() => {
  const key = 'snaperp-theme';
  const device = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['system', 'light', 'dark'].includes(value);
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch { /* Private browsing can disable storage. */ }
  function apply() {
    const theme = preference === 'system' ? (device.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    window.dispatchEvent(new Event('snaperp-theme-change'));
    document.querySelectorAll('iframe.journey-animation-frame').forEach(frame => {
      frame.contentWindow?.postMessage({type: 'snaperp-theme', preference}, location.origin);
    });
  }
  window.addEventListener('snaperp-theme-select', event => {
    if (!valid(event.detail)) return;
    preference = event.detail;
    try { localStorage.setItem(key, preference); } catch { /* Keep the selection for this visit. */ }
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    apply();
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin) return;
    if (window.parent !== window && event.source === window.parent && event.data?.type === 'snaperp-theme' && valid(event.data.preference)) {
      preference = event.data.preference;
      apply();
    } else if (event.data?.type === 'snaperp-theme-request') {
      document.querySelectorAll('iframe.journey-animation-frame').forEach(frame => {
        if (frame.contentWindow === event.source) frame.contentWindow.postMessage({type: 'snaperp-theme', preference}, location.origin);
      });
    }
  });
  device.addEventListener('change', apply);
  apply();
  if (window.parent !== window) window.parent.postMessage({type: 'snaperp-theme-request'}, location.origin);
})();
