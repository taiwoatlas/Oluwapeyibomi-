// Loads this page's content from /data/content-<page>.json (edited via
// /admin) and fills in any element carrying a matching data-cms attribute.
// If the fetch fails or a field is empty, the text already written into
// the HTML is left alone, so the page never breaks.
(function () {
  var page = document.body.getAttribute('data-page');
  if (!page) return;

  fetch('data/content-' + page + '.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (data) {
      document.querySelectorAll('[data-cms]').forEach(function (el) {
        var key = el.getAttribute('data-cms');
        if (Object.prototype.hasOwnProperty.call(data, key) && data[key]) {
          el.textContent = data[key];
        }
      });
      document.querySelectorAll('[data-cms-img]').forEach(function (el) {
        var key = el.getAttribute('data-cms-img');
        if (data[key]) el.setAttribute('src', data[key]);
      });
    })
    .catch(function () { /* keep the fallback text already in the HTML */ });
})();
