// Loads /data/theme.json and applies it as CSS custom properties,
// so edits made in /admin show up on the live site without touching style.css.
(function () {
  fetch('/data/theme.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (t) {
      var root = document.documentElement.style;
      if (t.color_cream) root.setProperty('--color-cream', t.color_cream);
      if (t.color_paper) root.setProperty('--color-paper', t.color_paper);
      if (t.color_cream_2) root.setProperty('--color-cream-2', t.color_cream_2);
      if (t.color_charcoal) root.setProperty('--color-charcoal', t.color_charcoal);
      if (t.color_charcoal_soft) root.setProperty('--color-charcoal-soft', t.color_charcoal_soft);
      if (t.color_taupe) root.setProperty('--color-taupe', t.color_taupe);
      if (t.color_taupe_light) root.setProperty('--color-taupe-light', t.color_taupe_light);
      if (t.color_accent) root.setProperty('--color-accent', t.color_accent);
      if (t.color_accent_soft) root.setProperty('--color-accent-soft', t.color_accent_soft);
      if (t.color_warn) root.setProperty('--color-warn', t.color_warn);
      if (t.font_display) root.setProperty('--font-display', t.font_display);
      if (t.font_body) root.setProperty('--font-body', t.font_body);
      if (t.font_mono) root.setProperty('--font-mono', t.font_mono);
    })
    .catch(function () { /* fall back to style.css defaults if theme.json is missing */ });
})();
