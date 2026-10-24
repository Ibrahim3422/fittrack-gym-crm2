/* App shell: router, auth, layout, global search, notifications, event delegation. */
(function () {
  const FT = window.FT, D = FT.D, U = FT.U, esc = U.esc, icon = U.icon, V = FT.views;
  FT.ui = { notifOpen: false };

  // ---------- auth (client-side demo auth: see README) ----------
  const isAuthed = () => { try { return localStorage.getItem(D.SESSION) === D.db.settings.admin.email.toLowerCase(); } catch (e) { return false; } };
  const NAV = [['dashboard', 'Dashboard', 'dashboard'], ['members', 'Members', 'users'], ['plans', 'Membership Plans', 'tag'], ['attendance', 'Attendance', 'check'], ['bookings', 'Bookings', 'calendar'], ['trainers', 'Trainers', 'award'], ['payments', 'Payments & Invoices', 'card'], ['reports', 'Reports', 'chart'], ['messages', 'Messages', 'mail'], ['settings', 'Settings', 'settings']];
  const TITLES = { dashboard: 'Dashboard', members: 'Members', member: 'Member profile', plans: 'Membership Plans', attendance: 'Attendance', bookings: 'Bookings', trainers: 'Trainers', payments: 'Payments & Invoices', invoice: 'Invoice', reports: 'Reports', messages: 'Messages', settings: 'Settings' };
  const NAV_OF = { member: 'members', invoice: 'payments' };

  function route() {
    const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const [name, arg] = h.split('/');
    return { name: name || 'dashboard', arg: arg ? decodeURIComponent(arg) : '' };
  }

  // ---------- public pages ----------
  function loginPage() {
    return '<div class="login"><div class="art"><div class="brand" style="padding:0"><div class="logo">' + icon('zap') + '</div>FitTrack</div><div><h2>Run your gym like a modern business.</h2><p>Members, memberships, attendance, bookings and payments — connected in one place.</p><ul><li>' + icon('check') + ' &nbsp;Automatic membership expiry tracking</li><li>' + icon('check') + ' &nbsp;Trainer scheduling without double-bookings</li><li>' + icon('check') + ' &nbsp;Printable invoices in seconds</li></ul></div><small style="color:#a5b4fc">© ' + new Date().getFullYear() + ' FitTrack</small></div>' +
      '<div class="form"><form class="box" data-form="login" novalidate><h1>Welcome back</h1><p class="muted" style="margin:0 0 18px">Sign in to your admin account</p>' +
      U.field('Email', 'email', { type: 'email', value: '', attrs: ' autocomplete="username"' }) + U.field('Password', 'password', { type: 'password', attrs: ' autocomplete="current-password"' }) +
      '<div style="text-align:right;margin:-4px 0 14px"><a href="#/forgot">Forgot password?</a></div><button class="btn primary" style="width:100%;justify-content:center;padding:12px" type="submit">Sign in</button>' +
      '<div class="hint"><b>Demo login</b><br>Email: <code>admin@fittrack.pk</code><br>Password: <code>admin123</code></div></form></div></div>';
  }
  function forgotPage(sent) {
    return '<div class="login" style="grid-template-columns:1fr"><div class="form"><form class="box" data-form="forgot" novalidate><div class="brand" style="padding:0 0 22px;color:var(--navy)"><div class="logo" style="color:#fff">' + icon('zap') + '</div>FitTrack</div>' +
      (sent ? '<h1>Check your email</h1><p class="muted">If an account exists for that address, a password reset link is on its way. (Demo UI — no email is actually sent.)</p><a class="btn primary" href="#/login" style="width:100%;justify-content:center">Back to sign in</a>'
        : '<h1>Reset your password</h1><p class="muted" style="margin:0 0 18px">Enter your email and we will send you a reset link.</p>' + U.field('Email', 'email', { type: 'email' }) + '<button class="btn primary" style="width:100%;justify-content:center;padding:12px" type="submit">Send reset link</button><div style="text-align:center;margin-top:14px"><a href="#/login">← Back to sign in</a></div>') + '</form></div></div>';
  }

  // ---------- shell ----------
  function shell(r, content) {
    const g = D.db.settings, ad = g.admin, active = NAV_OF[r.name] || r.name;
    const nav = NAV.map(([k, l, i]) => '<a href="#/' + k + '" class="' + (active === k ? 'active' : '') + '">' + icon(i) + l + '</a>').join('');
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    return '<div class="shell"><aside class="sidebar" id="sidebar"><div class="brand"><div class="logo">' + (g.logo ? '<img src="' + esc(g.logo) + '" alt="">' : icon('zap')) + '</div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(g.gymName.split(' ')[0] || 'FitTrack') + '</span></div><nav class="nav">' + nav + '</nav>' +
      '<div class="side-user">' + U.avatar(ad) + '<div style="min-width:0"><div class="nm">' + esc(ad.name) + '</div><div class="rl">Administrator</div></div><button data-act="logout" title="Sign out" aria-label="Sign out">' + icon('logout') + '</button></div></aside><div class="scrim" id="scrim" data-act="toggleSidebar"></div>' +
      '<div class="main"><header class="topbar"><button class="hamburger" data-act="toggleSidebar" aria-label="Menu">' + icon('menu') + '</button>' +
      '<div class="search">' + icon('search') + '<input id="gsearch" type="search" placeholder="Search members, phone, trainers, invoices…" autocomplete="off"><div id="searchDrop"></div></div>' +
      '<div class="top-right"><span class="date-chip">' + today + '</span><div style="position:relative" id="notifWrap"></div><div class="profile-chip">' + U.avatar(ad) + '<span class="pn" style="font-weight:600">' + esc(ad.name.split(' ')[0]) + '</span></div></div></header>' +
      '<main class="content" id="content">' + content + '</main></div></div>';
  }
  function drawNotif() {
    const w = document.getElementById('notifWrap'); if (!w) return;
    const list = D.notifications(), unread = list.filter((n) => n.unread).length;
    const ico = { expiring: '⏳', expired: '⛔', overdue: '💸', booking: '📅', new: '🆕', payment: '✅' };
    w.innerHTML = '<button class="icon-btn" data-act="toggleNotif" aria-label="Notifications">' + icon('bell') + (unread ? '<span class="badge-dot">' + (unread > 99 ? '99+' : unread) + '</span>' : '') + '</button>' +
      (FT.ui.notifOpen ? '<div class="notif"><header><span>Notifications' + (unread ? ' (' + unread + ' new)' : '') + '</span><button class="btn sm" data-act="readAll"' + (unread ? '' : ' disabled') + '>Mark all read</button></header><div class="list">' +
        (list.length ? list.map((n) => '<a class="it ' + (n.unread ? 'unread' : '') + '" href="' + n.link + '" data-act="openNotif" data-id="' + esc(n.id) + '"><span class="dot"></span><div>' + (ico[n.kind] || '') + ' ' + esc(n.text) + '</div></a>').join('') : U.empty('All caught up', 'No notifications right now.')) + '</div></div>' : '');
  }

  // ---------- render ----------
  let lastKey = '';
  FT.render = function () {
    const app = document.getElementById('app'), r = route();
    if (r.name === 'forgot') { app.innerHTML = forgotPage(FT.state.forgotSent); document.title = 'Reset password – FitTrack'; return; }
    if (r.name === 'login' || !isAuthed()) {
      if (r.name !== 'login') { location.replace('#/login'); return; }
      if (isAuthed()) { location.replace('#/dashboard'); return; }
      app.innerHTML = loginPage(); document.title = 'Sign in – FitTrack'; return;
    }
    const view = V[r.name];
    const key = r.name + '/' + r.arg;
    const scrollY = key === lastKey ? window.scrollY : 0; lastKey = key;
    const ae = document.activeElement;
    const restore = ae && ae.dataset && ae.dataset.on === 'filter' && ae.tagName === 'INPUT' ? { k: ae.dataset.key, f: ae.dataset.field, s: ae.selectionStart, e: ae.selectionEnd } : null;
    let html;
    try { html = view ? view(r.arg) : '<div class="card">' + U.empty('Page not found', 'That page does not exist.') + '<div style="text-align:center"><a class="btn" href="#/dashboard">Go to dashboard</a></div></div>'; }
    catch (err) { console.error(err); html = '<div class="card">' + U.empty('Something went wrong', 'This page failed to load. ' + err.message) + '<div style="text-align:center"><button class="btn" data-act="reload">Reload</button></div></div>'; }
    const sidebarOpen = (document.getElementById('sidebar') || {}).classList && document.getElementById('sidebar').classList.contains('open');
    const searchVal = (document.getElementById('gsearch') || {}).value || '';
    app.innerHTML = shell(r, html);
    drawNotif();
    if (sidebarOpen) { document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.add('show'); }
    if (searchVal && key === lastKey) { /* search box is transient; leave cleared after navigation */ }
    app.querySelectorAll('form[data-form]').forEach((f) => U.bindPhotos(f));
    document.title = (TITLES[r.name] || 'FitTrack') + ' – FitTrack';
    if (restore) {
      const el = document.querySelector('[data-on="filter"][data-key="' + restore.k + '"][data-field="' + restore.f + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(restore.s, restore.e); } catch (e) { /* date inputs */ } }
    }
    window.scrollTo(0, scrollY);
  };

  // ---------- global search ----------
  function doSearch(q) {
    const dd = document.getElementById('searchDrop'); if (!dd) return;
    q = q.trim().toLowerCase();
    if (q.length < 2) { dd.innerHTML = ''; return; }
    const digits = q.replace(/\D/g, '');
    const members = D.liveMembers().filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || (digits.length >= 3 && m.phone.replace(/\D/g, '').includes(digits))).slice(0, 5);
    const trainers = D.db.trainers.filter((t) => t.name.toLowerCase().includes(q) || (digits.length >= 3 && t.phone.replace(/\D/g, '').includes(digits))).slice(0, 3);
    const invoices = D.db.invoices.filter((i) => { const m = D.get('members', i.memberId); return i.no.toLowerCase().includes(q) || (m && m.name.toLowerCase().includes(q)); }).slice(0, 4);
    let h = '';
    if (members.length) h += '<div class="grp">Members</div>' + members.map((m) => '<a href="#/members/' + m.id + '" data-act="clearSearch">' + U.avatar(m) + '<div><b>' + esc(m.name) + '</b><br><small class="muted">' + esc(m.code) + ' · ' + esc(m.phone) + '</small></div></a>').join('');
    if (trainers.length) h += '<div class="grp">Trainers</div>' + trainers.map((t) => '<a href="#/trainers" data-act="clearSearch">' + U.avatar(t) + '<div><b>' + esc(t.name) + '</b><br><small class="muted">' + esc(t.specialization) + '</small></div></a>').join('');
    if (invoices.length) h += '<div class="grp">Invoices</div>' + invoices.map((i) => '<a href="#/invoice/' + i.id + '" data-act="clearSearch">' + icon('print') + '<div><b>' + esc(i.no) + '</b><br><small class="muted">' + esc((D.get('members', i.memberId) || {}).name || '') + ' · ' + U.money(i.amount) + '</small></div></a>').join('');
    dd.innerHTML = '<div class="dropdown">' + (h || '<div class="empty">No results for “' + esc(q) + '”</div>') + '</div>';
  }

  // ---------- generic actions ----------
  Object.assign(FT.acts, {
    closeModal: () => U.closeModal(),
    page: (d) => { FT.state[d.key].page = Number(d.page); FT.render(); },
    reload: () => location.reload(),
    logout: () => { try { localStorage.removeItem(D.SESSION); } catch (e) { /* ignore */ } FT.ui.notifOpen = false; location.hash = '#/login'; U.toast('Signed out'); },
    toggleSidebar: () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('scrim').classList.toggle('show'); },
    toggleNotif: () => { FT.ui.notifOpen = !FT.ui.notifOpen; drawNotif(); },
    readAll: () => { D.notifications().forEach((n) => { D.db.notifRead[n.id] = 1; }); D.save(); drawNotif(); },
    openNotif: (d) => { D.db.notifRead[d.id] = 1; D.save(); FT.ui.notifOpen = false; drawNotif(); },
    clearSearch: () => { const i = document.getElementById('gsearch'); if (i) i.value = ''; const dd = document.getElementById('searchDrop'); if (dd) dd.innerHTML = ''; },
  });
  FT.ons.filter = (el) => { const st = FT.state[el.dataset.key]; st[el.dataset.field] = el.value; if (!el.dataset.nopage) st.page = 1; FT.render(); };
  FT.forms = FT.forms || {};
  FT.forms.login = (v, f) => {
    const a = D.db.settings.admin;
    if (!U.validate(f, v, { email: { req: 1, email: 1 }, password: { req: 1 } })) return;
    if (v.email.trim().toLowerCase() !== a.email.toLowerCase() || v.password !== a.password) { U.fieldError(f, 'password', 'Incorrect email or password'); return; }
    try { localStorage.setItem(D.SESSION, a.email.toLowerCase()); } catch (e) { return U.toast('Browser storage is blocked, cannot sign in', 'err'); }
    location.hash = '#/dashboard'; U.toast('Welcome back, ' + a.name.split(' ')[0]);
  };
  FT.forms.forgot = (v, f) => { if (!U.validate(f, v, { email: { req: 1, email: 1 } })) return; FT.state.forgotSent = true; FT.render(); };

  // ---------- event delegation ----------
  const isText = (el) => el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text', 'search', 'email', 'tel'].includes(el.type));
  document.addEventListener('click', (e) => {
    if (FT.ui.notifOpen && !e.target.closest('#notifWrap')) { FT.ui.notifOpen = false; drawNotif(); }
    if (!e.target.closest('.search')) { const dd = document.getElementById('searchDrop'); if (dd) dd.innerHTML = ''; }
    const t = e.target.closest('[data-act]'); if (!t) return;
    const fn = FT.acts[t.dataset.act]; if (!fn) return;
    if (t.tagName !== 'A') e.preventDefault();
    if (t.disabled) return;
    fn(t.dataset, t, e);
    if (t.closest('#sidebar') === null && t.dataset.act === 'toggleSidebar') return;
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.id === 'gsearch') return doSearch(el.value);
    if (el.dataset && el.dataset.on && isText(el) && FT.ons[el.dataset.on]) FT.ons[el.dataset.on](el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.on && !isText(el) && FT.ons[el.dataset.on]) FT.ons[el.dataset.on](el);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target; if (!f.dataset || !f.dataset.form || !FT.forms[f.dataset.form]) return;
    e.preventDefault();
    f.querySelectorAll('.err').forEach((n) => n.remove()); f.querySelectorAll('.invalid').forEach((n) => n.classList.remove('invalid'));
    FT.forms[f.dataset.form](Object.fromEntries(new FormData(f).entries()), f);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (document.getElementById('modal-root').children.length) U.closeModal(); else if (FT.ui.notifOpen) { FT.ui.notifOpen = false; drawNotif(); } } });
  window.addEventListener('hashchange', () => { document.getElementById('modal-root').innerHTML = ''; FT.ui.notifOpen = false; FT.render(); });

  // initial notification / expiry data refreshes when tab regains focus (dates roll over)
  window.addEventListener('focus', () => { if (document.getElementById('notifWrap')) drawNotif(); });

  FT.render();
})();
