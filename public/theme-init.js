// Apply the saved appearance before the app stylesheet paints. No account/progress data is used.
(function () {
  var theme = 'dark';
  try { if (localStorage.getItem('cpp-theme') === 'light') theme = 'light'; } catch (_) {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', theme);
})();
