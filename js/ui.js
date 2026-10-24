/* FitTrack UI toolkit: formatting, icons, charts, modal/toast, forms, pagination. */
(function () {
  const FT = window.FT, D = FT.D;
  const U = {};

  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = U.esc;

  // ---------- formatting ----------
  U.money = (n) => D.db.settings.currency + ' ' + new Intl.NumberFormat('en-US').format(Math.round(n || 0));
  U.date = (s) => { if (!s) return '—'; return D.parse(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
  U.shortDate = (s) => D.parse(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  U.time12 = (t) => { if (!t) return '—'; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
  U.label = (k) => ({ bank_transfer: 'Bank Transfer', no_show: 'No Show', cash: 'Cash', card: 'Card', other: 'Other' }[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : ''));
  U.pct = (cur, prev) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));
  U.planName = (id) => (D.get('plans', id) || {}).name || '—';

  // ---------- icons ----------
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    check: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    print: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    up: '<polyline points="18 15 12 9 6 15"/>',
    down: '<polyline points="6 9 12 15 18 9"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  };
  U.icon = (n) => '<svg class="i" viewBox="0 0 24 24">' + (ICONS[n] || '') + '</svg>';
  const icon = U.icon;

  // ---------- small components ----------
  const BADGE = {
    active: 'green', paid: 'green', confirmed: 'blue', completed: 'green', expired: 'red', overdue: 'red', cancelled: 'red', no_show: 'red',
    pending: 'amber', suspended: 'gray', archived: 'gray', refunded: 'violet', inactive: 'gray',
  };
  U.badge = (s) => '<span class="badge b-' + (BADGE[s] || 'gray') + '">' + esc(U.label(s)) + '</span>';
  U.avatar = (o, cls) => {
    const name = o.name || '?';
    if (o.photo) return '<div class="avatar ' + (cls || '') + '" style="background-image:url(' + esc(o.photo) + ')"></div>';
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    const ini = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return '<div class="avatar ' + (cls || '') + '" style="background:hsl(' + h + ',42%,46%)">' + esc(ini) + '</div>';
  };
  U.person = (o, sub) => '<div class="person">' + U.avatar(o) + '<div><b>' + esc(o.name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>';
  U.empty = (title, text) => '<div class="empty-state"><b>' + esc(title) + '</b>' + esc(text || '') + '</div>';
  U.loading = () => '<div class="loading"><div class="spin"></div></div>';
  U.optList = (arr, sel, valKey, labKey) => arr.map((x) => '<option value="' + esc(x[valKey || 'id']) + '"' + (String(x[valKey || 'id']) === String(sel) ? ' selected' : '') + '>' + esc(x[labKey || 'name']) + '</option>').join('');

  U.paginate = (items, page, per) => {
    const pages = Math.max(1, Math.ceil(items.length / per));
    const p = Math.min(Math.max(1, page), pages);
    return { rows: items.slice((p - 1) * per, p * per), page: p, pages, total: items.length, from: items.length ? (p - 1) * per + 1 : 0, to: Math.min(p * per, items.length) };
  };
  U.pager = (pg, key) => {
    if (pg.total === 0) return '';
    let btns = '';
    const start = Math.max(1, Math.min(pg.page - 2, pg.pages - 4)), end = Math.min(pg.pages, start + 4);
    for (let i = start; i <= end; i++) btns += '<button data-act="page" data-key="' + key + '" data-page="' + i + '" class="' + (i === pg.page ? 'on' : '') + '">' + i + '</button>';
    return '<div class="pager"><span>Showing ' + pg.from + '–' + pg.to + ' of ' + pg.total + '</span><div class="pg"><button data-act="page" data-key="' + key + '" data-page="' + (pg.page - 1) + '"' + (pg.page === 1 ? ' disabled' : '') + '>Prev</button>' + btns + '<button data-act="page" data-key="' + key + '" data-page="' + (pg.page + 1) + '"' + (pg.page === pg.pages ? ' disabled' : '') + '>Next</button></div></div>';
  };

  // ---------- toast / modal / confirm ----------
  U.toast = (msg, type) => {
    const t = document.createElement('div');
    t.className = 'toast ' + (type === 'err' ? 'err' : 'ok');
    t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3200);
  };
  let modalCount = 0;
  U.closeModal = () => { const r = document.getElementById('modal-root'); r.lastElementChild && r.lastElementChild.remove(); modalCount = Math.max(0, modalCount - 1); };
  U.modal = (title, body, opts) => {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><header><h3>' + esc(title) + '</h3><button class="btn ghost sm" data-act="closeModal" aria-label="Close">' + icon('x') + '</button></header><form novalidate><div class="body">' + body + '</div>' +
      (opts.footer === false ? '' : '<footer><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">' + esc(opts.submit || 'Save') + '</button></footer>') + '</form></div>';
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) U.closeModal(); });
    document.getElementById('modal-root').appendChild(wrap);
    modalCount++;
    const form = wrap.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.querySelectorAll('.err').forEach((n) => n.remove());
      form.querySelectorAll('.invalid').forEach((n) => n.classList.remove('invalid'));
      if (opts.onSubmit) opts.onSubmit(Object.fromEntries(new FormData(form).entries()), form);
    });
    if (opts.onMount) opts.onMount(form);
    const first = form.querySelector('input:not([type=hidden]):not([type=file]),select,textarea'); if (first) first.focus();
    return form;
  };
  U.fieldError = (form, name, msg) => {
    const el = form.elements[name]; if (!el) return;
    el.classList.add('invalid');
    const e = document.createElement('div'); e.className = 'err'; e.textContent = msg;
    el.parentNode.appendChild(e);
  };
  U.confirm = (title, text, onYes, yesLabel) => {
    U.modal(title, '<p style="margin:0">' + esc(text) + '</p>', { submit: yesLabel || 'Confirm', onSubmit: () => { U.closeModal(); onYes(); } });
    const btn = document.querySelector('#modal-root .overlay:last-child footer .primary');
    if (btn) { btn.classList.remove('primary'); btn.classList.add('danger'); }
  };

  // ---------- form helpers ----------
  U.field = (label, name, o) => {
    o = o || {};
    const v = o.value == null ? '' : o.value;
    let input;
    if (o.type === 'select') input = '<select class="in" name="' + name + '"' + (o.attrs || '') + '>' + o.options + '</select>';
    else if (o.type === 'textarea') input = '<textarea class="in" name="' + name + '" rows="' + (o.rows || 3) + '"' + (o.attrs || '') + '>' + esc(v) + '</textarea>';
    else input = '<input class="in" type="' + (o.type || 'text') + '" name="' + name + '" value="' + esc(v) + '"' + (o.attrs || '') + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>';
    return '<div class="field ' + (o.full ? 'full' : '') + '"><label>' + esc(label) + (o.req ? ' *' : '') + '</label>' + input + '</div>';
  };
  U.validate = (form, data, rules) => {
    let ok = true;
    for (const [name, rule] of Object.entries(rules)) {
      const v = (data[name] || '').trim();
      let msg = '';
      if (rule.req && !v) msg = 'Required';
      else if (v && rule.phone && !/^[0-9+\-\s]{7,18}$/.test(v)) msg = 'Enter a valid phone number';
      else if (v && rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Enter a valid email';
      else if (v && rule.positive && !(Number(v) > 0)) msg = 'Must be greater than 0';
      else if (rule.custom) msg = rule.custom(v) || '';
      if (msg) { U.fieldError(form, name, msg); ok = false; }
    }
    return ok;
  };
  // Resize an image file to a small data URL (keeps localStorage small).
  U.readImage = (file, max, cb) => {
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => U.toast('Could not read that image', 'err');
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  };
  // photo input: <input type=file data-photo="hiddenFieldName">
  U.photoField = (label, name, value) => '<div class="field full"><label>' + esc(label) + '</label><div style="display:flex;gap:12px;align-items:center"><div class="avatar md" data-preview="' + name + '" style="' + (value ? 'background-image:url(' + esc(value) + ')' : 'background:#cbd5e1') + '"></div><input type="file" accept="image/*" data-photo="' + name + '"><input type="hidden" name="' + name + '" value="' + esc(value || '') + '"></div></div>';
  U.bindPhotos = (form) => form.querySelectorAll('input[data-photo]').forEach((inp) => inp.addEventListener('change', () => {
    const f = inp.files[0]; if (!f) return;
    U.readImage(f, 220, (url) => { form.elements[inp.dataset.photo].value = url; const pv = form.querySelector('[data-preview="' + inp.dataset.photo + '"]'); pv.style.backgroundImage = 'url(' + url + ')'; });
  }));

  // ---------- charts (dependency-free SVG) ----------
  const nice = (max) => { if (max <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(max))); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  U.lineChart = (pts, o) => {
    o = o || {};
    if (!pts.length) return U.empty('No data', 'Nothing to chart for this range.');
    const W = 640, H = 240, L = 44, R = 14, T = 12, B = 28;
    const color = o.color || '#4f46e5';
    const max = nice(Math.max.apply(null, pts.map((p) => p.value)));
    const min = o.min0 === false ? Math.min.apply(null, pts.map((p) => p.value)) * 0.9 : 0;
    const x = (i) => L + (pts.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (pts.length - 1));
    const y = (v) => T + (H - T - B) * (1 - (v - min) / ((max - min) || 1));
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = min + ((max - min) * i) / 4, yy = y(v); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="#e5e9f2"/><text x="' + (L - 8) + '" y="' + (yy + 4) + '" font-size="11" fill="#64748b" text-anchor="end">' + (o.fmtY ? o.fmtY(v) : Math.round(v)) + '</text>'; }
    const step = Math.ceil(pts.length / 8);
    let xl = '';
    pts.forEach((p, i) => { if (i % step === 0 || i === pts.length - 1) xl += '<text x="' + x(i) + '" y="' + (H - 8) + '" font-size="11" fill="#64748b" text-anchor="middle">' + esc(p.label) + '</text>'; });
    const line = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1)).join(' ');
    const area = line + ' L' + x(pts.length - 1).toFixed(1) + ' ' + (H - B) + ' L' + x(0).toFixed(1) + ' ' + (H - B) + ' Z';
    const id = 'lg' + Math.random().toString(36).slice(2, 7);
    const dots = pts.map((p, i) => '<circle class="pt" cx="' + x(i).toFixed(1) + '" cy="' + y(p.value).toFixed(1) + '" r="' + (pts.length > 40 ? 2.5 : 4) + '" fill="#fff" stroke="' + color + '" stroke-width="2"><title>' + esc(p.label + ': ' + (o.fmtTip ? o.fmtTip(p.value) : p.value)) + '</title></circle>').join('');
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".25"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' + g + xl + '<path d="' + area + '" fill="url(#' + id + ')"/><path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round"/>' + dots + '</svg></div>';
  };
  U.barChart = (items, o) => {
    o = o || {};
    if (!items.length) return U.empty('No data', 'Nothing to chart for this range.');
    const W = 640, H = 240, L = 50, R = 10, T = 12, B = 30;
    const color = o.color || '#4f46e5';
    const max = nice(Math.max.apply(null, items.map((p) => p.value)));
    const bw = (W - L - R) / items.length;
    const y = (v) => T + (H - T - B) * (1 - v / (max || 1));
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4, yy = y(v); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="#e5e9f2"/><text x="' + (L - 8) + '" y="' + (yy + 4) + '" font-size="11" fill="#64748b" text-anchor="end">' + (o.fmtY ? o.fmtY(v) : Math.round(v)) + '</text>'; }
    const bars = items.map((p, i) => {
      const h = H - B - y(p.value), bx = L + i * bw + bw * 0.18, w = bw * 0.64;
      return '<rect x="' + bx.toFixed(1) + '" y="' + y(p.value).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(h, 0).toFixed(1) + '" rx="5" fill="' + (p.color || color) + '"><title>' + esc(p.label + ': ' + (o.fmtTip ? o.fmtTip(p.value) : p.value)) + '</title></rect><text x="' + (bx + w / 2).toFixed(1) + '" y="' + (H - 10) + '" font-size="11" fill="#64748b" text-anchor="middle">' + esc(p.label) + '</text>';
    }).join('');
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '">' + g + bars + '</svg></div>';
  };
  U.donut = (segs, centerLabel) => {
    const total = segs.reduce((a, s) => a + s.value, 0);
    if (!total) return U.empty('No data', '');
    const r = 62, c = 2 * Math.PI * r; let off = 0, arcs = '';
    segs.forEach((s) => { const len = (s.value / total) * c; arcs += '<circle r="' + r + '" cx="85" cy="85" fill="none" stroke="' + s.color + '" stroke-width="26" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 85 85)"><title>' + esc(s.label + ': ' + s.value) + '</title></circle>'; off += len; });
    const legend = segs.map((s) => '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + ' <b>' + s.value + '</b> <span class="muted">(' + Math.round((s.value / total) * 100) + '%)</span></span>').join('');
    return '<div class="donut-wrap"><svg viewBox="0 0 170 170">' + arcs + '<text x="85" y="82" text-anchor="middle" font-size="26" font-weight="700" fill="#0f172a">' + total + '</text><text x="85" y="100" text-anchor="middle" font-size="11" fill="#64748b">' + esc(centerLabel || 'total') + '</text></svg><div class="legend" style="flex-direction:column;margin:0">' + legend + '</div></div>';
  };
  U.COLORS = ['#4f46e5', '#7c3aed', '#0ea5e9', '#16a34a', '#d97706', '#db2777'];

  FT.U = U;
  FT.acts = {};   // click actions registered by views: FT.acts.name = (dataset, el, event) => {}
  FT.ons = {};    // input/change handlers registered by views
  FT.state = {};  // per-view UI state (filters, pages) kept across re-renders
})();
