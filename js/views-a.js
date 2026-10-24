/* Views A: Dashboard, Members, Member profile, Membership plans. */
(function () {
  const FT = window.FT, D = FT.D, U = FT.U, esc = U.esc, icon = U.icon;
  const V = (FT.views = FT.views || {});
  FT.A = FT.A || {};
  const S = (k, d) => (FT.state[k] = FT.state[k] || Object.assign({}, d));

  // ====================== DASHBOARD ======================
  function growthPoints(range) {
    const T = D.today(), live = D.liveMembers(), pts = [];
    if (range === '7d' || range === '30d') {
      const n = range === '7d' ? 7 : 30;
      for (let i = n - 1; i >= 0; i--) { const d = D.addDays(T, -i); pts.push({ label: U.shortDate(d), value: live.filter((m) => m.joinDate <= d).length }); }
    } else {
      const n = range === '6m' ? 6 : 12;
      for (let i = n - 1; i >= 0; i--) { const d = i === 0 ? T : D.addMonths(T, -i); pts.push({ label: D.parse(d).toLocaleDateString('en-GB', { month: 'short' }), value: live.filter((m) => m.joinDate <= d).length }); }
    }
    return pts;
  }
  function statCard(label, value, cur, prev, color, ico, cmp) {
    const ch = U.pct(cur, prev), up = ch >= 0;
    return '<div class="card stat"><div class="ico" style="background:' + color + '1a;color:' + color + '">' + icon(ico) + '</div><div><div class="lbl">' + label + '</div><div class="val">' + value + '</div><div class="delta ' + (up ? 'up' : 'down') + '">' + icon(up ? 'up' : 'down') + Math.abs(ch) + '% <span>' + cmp + '</span></div></div></div>';
  }

  V.dashboard = () => {
    const st = S('dash', { range: '30d', win: 7 });
    const T = D.today(), db = D.db, live = D.liveMembers();
    const d30 = D.addDays(T, -30), y = D.addDays(T, -1);
    const isAct = (m) => D.memberStatus(m) === 'active';
    const monthKey = T.slice(0, 7), prevKey = D.addMonths(T, -1).slice(0, 7);
    const rev = (k) => db.payments.filter((p) => p.status === 'paid' && p.date.startsWith(k)).reduce((a, p) => a + p.amount, 0);
    const active = live.filter(isAct).length;
    const activePrev = live.filter((m) => m.joinDate <= d30 && m.expiryDate >= d30 && m.status === 'active').length;
    const ci = db.attendance.filter((a) => a.date === T).length, ciPrev = db.attendance.filter((a) => a.date === y).length;

    const stats = '<div class="grid g4 mb">' +
      statCard('Total Members', live.length, live.length, live.filter((m) => m.joinDate <= d30).length, '#4f46e5', 'users', 'vs last 30 days') +
      statCard('Active Memberships', active, active, activePrev, '#16a34a', 'check', 'vs last 30 days') +
      statCard("Today's Check-ins", ci, ci, ciPrev, '#0ea5e9', 'login', 'vs yesterday') +
      statCard('Monthly Revenue', U.money(rev(monthKey)), rev(monthKey), rev(prevKey), '#7c3aed', 'card', 'vs last month') + '</div>';

    const seg = (opts, cur, key) => '<div class="seg">' + opts.map(([v, l]) => '<button data-act="dashSet" data-key="' + key + '" data-val="' + v + '" class="' + (String(cur) === String(v) ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';

    const growth = '<div class="card"><div class="card-head"><h3>Membership Growth</h3>' + seg([['7d', '7 days'], ['30d', '30 days'], ['6m', '6 months'], ['1y', '1 year']], st.range, 'range') + '</div>' + U.lineChart(growthPoints(st.range), { fmtTip: (v) => v + ' members' }) + '</div>';

    const planSegs = db.plans.map((p, i) => ({ label: p.name, value: live.filter((m) => m.planId === p.id).length, color: U.COLORS[i] }));
    const donut = '<div class="card"><div class="card-head"><h3>Membership Plans</h3></div>' + U.donut(planSegs, 'members') + '</div>';

    // expiring soon
    const exp = live.filter((m) => isAct(m) && D.daysLeft(m) >= 0 && D.daysLeft(m) <= st.win).sort((a, b) => D.daysLeft(a) - D.daysLeft(b));
    const expiredCount = live.filter((m) => D.memberStatus(m) === 'expired').length;
    const expRows = exp.map((m) => {
      const dl = D.daysLeft(m), cls = dl <= 3 ? 'red' : dl <= 7 ? 'amber' : 'blue';
      return '<tr><td>' + U.person(m, m.code) + '</td><td>' + esc(m.phone) + '</td><td>' + esc(U.planName(m.planId)) + '</td><td>' + U.date(m.expiryDate) + '</td><td><span class="badge b-' + cls + '">' + (dl === 0 ? 'Today' : dl + ' day' + (dl > 1 ? 's' : '')) + '</span></td><td class="r"><div class="row-actions"><button class="btn sm primary" data-act="renew" data-id="' + m.id + '">' + icon('refresh') + 'Renew</button></div></td></tr>';
    }).join('');
    const expiring = '<div class="card mb"><div class="card-head"><h3>Memberships Expiring Soon</h3><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' + (expiredCount ? '<a href="#/members" data-act="filterExpired" class="badge b-red">' + expiredCount + ' already expired</a>' : '') + seg([[3, '3 days'], [7, '7 days'], [30, '30 days']], st.win, 'win') + '</div></div>' +
      (exp.length ? '<div class="table-wrap"><table><thead><tr><th>Member</th><th>Phone</th><th>Plan</th><th>Expiry date</th><th>Days remaining</th><th></th></tr></thead><tbody>' + expRows + '</tbody></table></div>' : U.empty('Nothing expiring in the next ' + st.win + ' days', 'Great — all active memberships are in good standing.')) + '</div>';

    const recentMembers = live.slice().sort((a, b) => b.joinDate.localeCompare(a.joinDate)).slice(0, 6);
    const rm = '<div class="card"><div class="card-head"><h3>Recent Members</h3><a href="#/members" class="btn sm">View all</a></div><div class="table-wrap"><table><thead><tr><th>Member</th><th>Plan</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>' +
      recentMembers.map((m) => '<tr><td>' + U.person(m, m.code) + '</td><td>' + esc(U.planName(m.planId)) + '</td><td>' + U.date(m.joinDate) + '</td><td>' + U.badge(D.memberStatus(m)) + '</td><td class="r"><a class="btn sm" href="#/members/' + m.id + '">' + icon('eye') + 'View</a></td></tr>').join('') + '</tbody></table></div></div>';

    const pays = db.payments.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const rp = '<div class="card"><div class="card-head"><h3>Recent Payments</h3><a href="#/payments" class="btn sm">View all</a></div><div class="table-wrap"><table><thead><tr><th>Member</th><th>Plan</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead><tbody>' +
      pays.map((p) => { const m = D.get('members', p.memberId); return '<tr><td>' + esc(m ? m.name : '—') + '</td><td>' + esc(U.planName(p.planId)) + '</td><td><b>' + U.money(p.amount) + '</b></td><td>' + U.label(p.method) + '</td><td>' + U.shortDate(p.date) + '</td><td>' + U.badge(D.paymentStatus(p)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';

    const nowM = D.toMin(D.nowTime());
    const up = db.bookings.filter((b) => b.status === 'confirmed' && (b.date > T || (b.date === T && D.toMin(b.start) + Number(b.duration) >= nowM))).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 6);
    const ub = '<div class="card"><div class="card-head"><h3>Upcoming Bookings</h3><a href="#/bookings" class="btn sm">View all</a></div>' + (up.length ? '<div class="table-wrap"><table><thead><tr><th>When</th><th>Member</th><th>Session</th><th>Trainer</th><th>Status</th></tr></thead><tbody>' +
      up.map((b) => { const m = D.get('members', b.memberId), t = D.get('trainers', b.trainerId); return '<tr><td><b>' + U.time12(b.start) + '</b><br><small class="muted">' + (b.date === T ? 'Today' : U.shortDate(b.date)) + '</small></td><td>' + esc(m ? m.name : '—') + '</td><td>' + esc(b.session) + '</td><td>' + esc(t ? t.name : '—') + '</td><td>' + U.badge(b.status) + '</td></tr>'; }).join('') + '</tbody></table></div>' : U.empty('No upcoming bookings', 'Schedule a session from the Bookings page.')) + '</div>';

    return '<div class="page-head"><div><h1>Dashboard</h1><p>Welcome back, ' + esc(db.settings.admin.name.split(' ')[0]) + '. Here is what is happening at ' + esc(db.settings.gymName) + '.</p></div><div class="actions"><button class="btn" data-act="addMember">' + icon('plus') + 'Add Member</button><a class="btn primary" href="#/attendance">' + icon('check') + 'Check-in</a></div></div>' +
      stats + '<div class="grid g-2-1 mb">' + growth + donut + '</div>' + expiring + '<div class="grid g2 mb">' + rm + rp + '</div>' + ub;
  };
  FT.acts.dashSet = (d) => { const st = S('dash', {}); st[d.key] = d.key === 'win' ? Number(d.val) : d.val; FT.render(); };
  FT.acts.filterExpired = () => { const s = S('members', { q: '', plan: '', status: '', page: 1 }); s.status = 'expired'; s.page = 1; };

  // ====================== MEMBERS ======================
  const MEMBER_PER = 8;
  V.members = () => {
    const st = S('members', { q: '', plan: '', status: '', page: 1 });
    const db = D.db, q = st.q.trim().toLowerCase();
    let list = db.members.filter((m) => (st.status === 'archived' ? m.archived : !m.archived));
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§') || m.phone.includes(q) || m.code.toLowerCase().includes(q));
    if (st.plan) list = list.filter((m) => m.planId === st.plan);
    if (st.status && st.status !== 'archived') list = list.filter((m) => D.memberStatus(m) === st.status);
    list.sort((a, b) => b.joinDate.localeCompare(a.joinDate));
    const pg = U.paginate(list, st.page, MEMBER_PER); st.page = pg.page;

    const rows = pg.rows.map((m) => {
      const tr = D.get('trainers', m.trainerId), dl = D.daysLeft(m), s = D.memberStatus(m);
      return '<tr><td>' + '<a href="#/members/' + m.id + '" style="color:inherit">' + U.person(m, m.code) + '</a></td><td>' + esc(m.phone) + '</td><td>' + esc(U.planName(m.planId)) + '</td><td>' + U.date(m.expiryDate) + (s === 'active' && dl <= 7 ? '<br><small style="color:var(--amber)">' + dl + ' days left</small>' : '') + '</td><td>' + esc(tr ? tr.name : '—') + '</td><td>' + U.badge(s) + '</td><td class="r"><div class="row-actions">' +
        '<a class="btn sm" href="#/members/' + m.id + '" title="View profile">' + icon('eye') + '</a>' +
        '<button class="btn sm" data-act="editMember" data-id="' + m.id + '" title="Edit">' + icon('edit') + '</button>' +
        (m.archived ? '<button class="btn sm" data-act="restoreMember" data-id="' + m.id + '" title="Restore">' + icon('refresh') + '</button>' : '<button class="btn sm" data-act="archiveMember" data-id="' + m.id + '" title="Archive">' + icon('archive') + '</button>') + '</div></td></tr>';
    }).join('');

    return '<div class="page-head"><div><h1>Members</h1><p>' + D.liveMembers().length + ' members in total</p></div><div class="actions"><button class="btn primary" data-act="addMember">' + icon('plus') + 'Add Member</button></div></div>' +
      '<div class="card"><div class="toolbar"><input class="grow" placeholder="Search by name, phone or ID…" value="' + esc(st.q) + '" data-on="filter" data-key="members" data-field="q">' +
      '<select data-on="filter" data-key="members" data-field="plan"><option value="">All plans</option>' + U.optList(db.plans, st.plan) + '</select>' +
      '<select data-on="filter" data-key="members" data-field="status"><option value="">All statuses</option>' + ['active', 'expired', 'suspended', 'pending', 'archived'].map((s) => '<option value="' + s + '"' + (st.status === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') + '</select></div>' +
      (pg.total ? '<div class="table-wrap"><table><thead><tr><th>Member</th><th>Phone</th><th>Plan</th><th>Expiry</th><th>Trainer</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' + U.pager(pg, 'members') : U.empty('No members found', 'Try changing your search or filters.')) + '</div>';
  };
  FT.acts.addMember = () => FT.A.memberModal();
  FT.acts.editMember = (d) => FT.A.memberModal(d.id);
  FT.acts.archiveMember = (d) => {
    const m = D.get('members', d.id);
    U.confirm('Archive member?', m.name + ' will be hidden from the member list and reports. You can restore them later from the Archived filter.', () => { m.archived = true; D.save(); U.toast(m.name + ' archived'); if (location.hash.startsWith('#/members/')) location.hash = '#/members'; else FT.render(); }, 'Archive');
  };
  FT.acts.restoreMember = (d) => { const m = D.get('members', d.id); m.archived = false; D.save(); U.toast(m.name + ' restored'); FT.render(); };

  FT.A.memberModal = (id) => {
    const db = D.db, m = id ? D.get('members', id) : null, T = D.today();
    const defPlan = m ? m.planId : (db.plans.find((p) => p.active) || db.plans[0]).id;
    const body = '<div class="form-grid">' + U.photoField('Profile photo', 'photo', m && m.photo) +
      U.field('Full name', 'name', { value: m && m.name, req: 1 }) + U.field('Phone', 'phone', { value: m && m.phone, req: 1, placeholder: '03xx-xxxxxxx' }) +
      U.field('Email', 'email', { value: m && m.email, type: 'email' }) +
      U.field('Gender', 'gender', { type: 'select', options: ['M', 'F', 'O'].map((g) => '<option value="' + g + '"' + (m && m.gender === g ? ' selected' : '') + '>' + { M: 'Male', F: 'Female', O: 'Other' }[g] + '</option>').join('') }) +
      U.field('Date of birth', 'dob', { type: 'date', value: m && m.dob }) + U.field('Emergency contact', 'emergency', { value: m && m.emergency, placeholder: 'Name – phone' }) +
      U.field('Address', 'address', { value: m && m.address, full: 1 }) +
      U.field('Join date', 'joinDate', { type: 'date', value: m ? m.joinDate : T }) +
      U.field('Membership plan', 'planId', { type: 'select', options: db.plans.filter((p) => p.active || (m && m.planId === p.id)).map((p) => '<option value="' + p.id + '"' + (p.id === defPlan ? ' selected' : '') + '>' + esc(p.name) + ' – ' + U.money(p.price) + '</option>').join('') }) +
      U.field('Membership start', 'startDate', { type: 'date', value: m ? m.startDate : T }) + U.field('Membership expiry', 'expiryDate', { type: 'date', value: m ? m.expiryDate : '' }) +
      U.field('Assigned trainer', 'trainerId', { type: 'select', options: '<option value="">— None —</option>' + U.optList(db.trainers.filter((t) => t.status === 'active' || (m && m.trainerId === t.id)), m && m.trainerId) }) +
      U.field('Status', 'status', { type: 'select', options: ['active', 'pending', 'suspended'].map((s) => '<option value="' + s + '"' + ((m ? m.status : 'active') === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') }) +
      U.field('Notes', 'notes', { type: 'textarea', value: m && m.notes, full: 1 }) +
      (m ? '' : '<div class="field full"><label class="check"><input type="checkbox" name="collect" checked> Collect first payment now</label></div>' +
        U.field('Payment method', 'method', { type: 'select', options: ['cash', 'bank_transfer', 'card', 'other'].map((x) => '<option value="' + x + '">' + U.label(x) + '</option>').join('') })) + '</div>';
    U.modal(m ? 'Edit member' : 'Add member', body, {
      wide: true, submit: m ? 'Save changes' : 'Add member',
      onMount: (form) => {
        U.bindPhotos(form);
        const recalc = () => { const p = D.get('plans', form.elements.planId.value); if (p && form.elements.startDate.value) form.elements.expiryDate.value = D.addMonths(form.elements.startDate.value, p.months); };
        if (!m) recalc();
        form.elements.planId.addEventListener('change', recalc); form.elements.startDate.addEventListener('change', recalc);
      },
      onSubmit: (d, form) => {
        if (!U.validate(form, d, {
          name: { req: 1 }, phone: { req: 1, phone: 1 }, email: { email: 1 }, startDate: { req: 1 },
          expiryDate: { req: 1, custom: (v) => (v && d.startDate && v < d.startDate ? 'Expiry must be after the start date' : '') },
        })) return;
        const dupe = db.members.find((x) => x.id !== (m && m.id) && x.phone.replace(/\D/g, '') === d.phone.replace(/\D/g, '') && !x.archived);
        if (dupe) return U.fieldError(form, 'phone', 'Already used by ' + dupe.name);
        const rec = { name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), gender: d.gender, dob: d.dob, emergency: d.emergency.trim(), address: d.address.trim(), joinDate: d.joinDate || T, planId: d.planId, startDate: d.startDate, expiryDate: d.expiryDate, trainerId: d.trainerId, status: d.status, notes: d.notes.trim(), photo: d.photo };
        if (m) { Object.assign(m, rec); U.toast('Member updated'); }
        else {
          const nm = Object.assign({ id: D.uid('m'), code: D.nextMemberCode(), archived: false, noteList: [], measurements: [] }, rec);
          db.members.push(nm);
          if (d.collect) { const plan = D.get('plans', nm.planId); D.addPayment({ memberId: nm.id, planId: plan.id, amount: plan.price, method: d.method, ref: d.method === 'cash' ? '' : 'TXN' + Math.floor(100000 + Math.random() * 899999), date: T, status: 'paid', notes: 'Membership payment' }); }
          U.toast(nm.name + ' added' + (d.collect ? ' and first payment recorded' : ''));
        }
        D.save(); U.closeModal(); FT.render();
      },
    });
  };

  // ====================== MEMBER PROFILE ======================
  V.member = (id) => {
    const m = D.get('members', id);
    if (!m) return '<div class="card">' + U.empty('Member not found', 'They may have been removed.') + '<div style="text-align:center"><a class="btn" href="#/members">Back to members</a></div></div>';
    const st = S('mp', { tab: 'overview', id: '' });
    if (st.id !== id) { st.id = id; st.tab = 'overview'; }
    const db = D.db, T = D.today(), s = D.memberStatus(m);
    const att = db.attendance.filter((a) => a.memberId === id).sort((a, b) => (b.date + b.checkIn).localeCompare(a.date + a.checkIn));
    const pays = db.payments.filter((p) => p.memberId === id).sort((a, b) => b.date.localeCompare(a.date));
    const bks = db.bookings.filter((b) => b.memberId === id).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
    const tr = D.get('trainers', m.trainerId);

    const head = '<div class="card mb"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' + U.avatar(m, 'lg') + '<div style="flex:1;min-width:220px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h1 style="font-size:22px">' + esc(m.name) + '</h1>' + U.badge(s) + '</div><div class="muted" style="margin-top:4px">' + esc(m.code) + ' · ' + esc(m.phone) + (m.email ? ' · ' + esc(m.email) : '') + '</div></div></div>' +
      '<div class="actions" style="margin-top:16px"><button class="btn primary" data-act="recordAtt" data-id="' + id + '">' + icon('check') + 'Record Attendance</button><button class="btn" data-act="addPayment" data-id="' + id + '">' + icon('card') + 'Add Payment</button><button class="btn" data-act="bookSession" data-id="' + id + '">' + icon('calendar') + 'Book Session</button><button class="btn" data-act="genInvoice" data-id="' + id + '">' + icon('print') + 'Generate Invoice</button><button class="btn" data-act="msgMember" data-id="' + id + '">' + icon('mail') + 'Send Message</button><button class="btn" data-act="renew" data-id="' + id + '">' + icon('refresh') + 'Renew</button><button class="btn" data-act="editMember" data-id="' + id + '">' + icon('edit') + 'Edit</button></div></div>';

    const tabs = [['overview', 'Overview'], ['attendance', 'Attendance'], ['payments', 'Payments'], ['bookings', 'Bookings'], ['measurements', 'Measurements'], ['notes', 'Notes']];
    const tabBar = '<div class="tabs">' + tabs.map(([k, l]) => '<button data-act="mpTab" data-tab="' + k + '" class="' + (st.tab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';

    let body = '';
    if (st.tab === 'overview') {
      const d30 = D.addDays(T, -30), visits30 = att.filter((a) => a.date >= d30).length;
      const paid = pays.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
      const due = pays.filter((p) => ['pending', 'overdue'].includes(D.paymentStatus(p))).reduce((a, p) => a + p.amount, 0);
      const dl = D.daysLeft(m);
      const mini = (l, v) => '<div class="card" style="padding:16px"><div class="muted">' + l + '</div><div style="font-size:22px;font-weight:700;margin-top:2px">' + v + '</div></div>';
      body = '<div class="grid g4 mb">' + mini('Total visits', att.length) + mini('Visits (30 days)', visits30) + mini('Total paid', U.money(paid)) + mini('Outstanding', '<span style="color:' + (due ? 'var(--red)' : 'inherit') + '">' + U.money(due) + '</span>') + '</div>' +
        '<div class="grid g2"><div class="card"><div class="card-head"><h3>Membership</h3></div><dl class="kv"><dt>Plan</dt><dd>' + esc(U.planName(m.planId)) + '</dd><dt>Start date</dt><dd>' + U.date(m.startDate) + '</dd><dt>Expiry date</dt><dd>' + U.date(m.expiryDate) + '</dd><dt>Time left</dt><dd>' + (dl < 0 ? '<span style="color:var(--red)">Expired ' + (-dl) + ' days ago</span>' : dl + ' days') + '</dd><dt>Assigned trainer</dt><dd>' + esc(tr ? tr.name : '—') + '</dd><dt>Last visit</dt><dd>' + (att[0] ? U.date(att[0].date) : '—') + '</dd></dl></div>' +
        '<div class="card"><div class="card-head"><h3>Personal details</h3></div><dl class="kv"><dt>Gender</dt><dd>' + ({ M: 'Male', F: 'Female', O: 'Other' }[m.gender] || '—') + '</dd><dt>Date of birth</dt><dd>' + U.date(m.dob) + '</dd><dt>Joined</dt><dd>' + U.date(m.joinDate) + '</dd><dt>Emergency contact</dt><dd>' + esc(m.emergency || '—') + '</dd><dt>Address</dt><dd>' + esc(m.address || '—') + '</dd><dt>Notes</dt><dd>' + esc(m.notes || '—') + '</dd></dl></div></div>';
    } else if (st.tab === 'attendance') {
      body = '<div class="card">' + (att.length ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Duration</th></tr></thead><tbody>' + att.slice(0, 40).map((a) => '<tr><td>' + U.date(a.date) + '</td><td>' + U.time12(a.checkIn) + '</td><td>' + (a.checkOut ? U.time12(a.checkOut) : '<span class="badge b-green">Inside</span>') + '</td><td>' + (a.checkOut ? (D.toMin(a.checkOut) - D.toMin(a.checkIn)) + ' min' : '—') + '</td></tr>').join('') + '</tbody></table></div>' : U.empty('No attendance yet', 'Record the first visit using the button above.')) + '</div>';
    } else if (st.tab === 'payments') {
      body = '<div class="card">' + (pays.length ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th></th></tr></thead><tbody>' + pays.map((p) => { const inv = D.get('invoices', p.invoiceId); return '<tr><td>' + U.date(p.date) + '</td><td>' + esc(U.planName(p.planId)) + '</td><td><b>' + U.money(p.amount) + '</b></td><td>' + U.label(p.method) + '</td><td>' + esc(p.ref || '—') + '</td><td>' + U.badge(D.paymentStatus(p)) + '</td><td class="r">' + (inv ? '<a class="btn sm" href="#/invoice/' + inv.id + '">' + icon('print') + esc(inv.no) + '</a>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : U.empty('No payments yet', '')) + '</div>';
    } else if (st.tab === 'bookings') {
      body = '<div class="card">' + (bks.length ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Session</th><th>Trainer</th><th>Status</th></tr></thead><tbody>' + bks.map((b) => { const t = D.get('trainers', b.trainerId); return '<tr><td>' + U.date(b.date) + '</td><td>' + U.time12(b.start) + ' · ' + b.duration + ' min</td><td>' + esc(b.session) + '</td><td>' + esc(t ? t.name : '—') + '</td><td>' + U.badge(b.status) + '</td></tr>'; }).join('') + '</tbody></table></div>' : U.empty('No bookings yet', 'Use “Book Session” to schedule one.')) + '</div>';
    } else if (st.tab === 'measurements') {
      const ms = (m.measurements || []).slice().sort((a, b) => a.date.localeCompare(b.date));
      body = '<div class="card"><div class="card-head"><h3>Body measurements</h3><button class="btn sm primary" data-act="addMeasure" data-id="' + id + '">' + icon('plus') + 'Add measurement</button></div>' +
        (ms.length ? (ms.length > 1 ? '<div style="margin-bottom:14px"><div class="muted" style="margin-bottom:6px">Weight (kg)</div>' + U.lineChart(ms.map((x) => ({ label: U.shortDate(x.date), value: x.weight })), { min0: false, fmtTip: (v) => v + ' kg', fmtY: (v) => v.toFixed(0) }) + '</div>' : '') + '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Weight</th><th>Height</th><th>Chest</th><th>Waist</th><th>Hips</th><th>Body fat</th></tr></thead><tbody>' + ms.slice().reverse().map((x) => '<tr><td>' + U.date(x.date) + '</td><td>' + x.weight + ' kg</td><td>' + (x.height || '—') + ' cm</td><td>' + (x.chest || '—') + ' cm</td><td>' + (x.waist || '—') + ' cm</td><td>' + (x.hips || '—') + ' cm</td><td>' + (x.bodyFat != null && x.bodyFat !== '' ? x.bodyFat + '%' : '—') + '</td></tr>').join('') + '</tbody></table></div>' : U.empty('No measurements recorded', 'Track weight and body stats over time.')) + '</div>';
    } else {
      const nl = (m.noteList || []).slice().sort((a, b) => b.date.localeCompare(a.date));
      body = '<div class="card"><div class="card-head"><h3>Notes</h3><button class="btn sm primary" data-act="addNote" data-id="' + id + '">' + icon('plus') + 'Add note</button></div>' +
        (nl.length ? nl.map((n) => '<div style="padding:12px 0;border-bottom:1px solid var(--gray-l);display:flex;justify-content:space-between;gap:12px"><div><div class="muted" style="font-size:12px">' + U.date(n.date) + '</div>' + esc(n.text) + '</div><button class="btn sm ghost" data-act="delNote" data-id="' + id + '" data-note="' + n.id + '" title="Delete note">' + icon('trash') + '</button></div>').join('') : U.empty('No notes yet', 'Add coaching notes, injuries, preferences…')) + '</div>';
    }
    return '<div style="margin-bottom:12px"><a href="#/members" class="muted">← Back to members</a></div>' + head + tabBar + body;
  };
  FT.acts.mpTab = (d) => { S('mp', {}).tab = d.tab; FT.render(); };
  FT.acts.recordAtt = (d) => FT.A.checkIn(d.id);
  FT.acts.addPayment = (d) => FT.A.paymentModal(d.id);
  FT.acts.bookSession = (d) => FT.A.bookModal({ memberId: d.id });
  FT.acts.genInvoice = (d) => FT.A.invoiceModal(d.id);
  FT.acts.msgMember = (d) => FT.A.messageModal({ memberId: d.id });
  FT.acts.renew = (d) => FT.A.renewModal(d.id);
  FT.acts.addMeasure = (d) => {
    const m = D.get('members', d.id), last = (m.measurements || []).slice(-1)[0] || {};
    const body = '<div class="form-grid">' + U.field('Date', 'date', { type: 'date', value: D.today(), req: 1 }) + U.field('Weight (kg)', 'weight', { type: 'number', value: last.weight, req: 1, attrs: ' step="0.1" min="0"' }) + U.field('Height (cm)', 'height', { type: 'number', value: last.height, attrs: ' min="0"' }) + U.field('Chest (cm)', 'chest', { type: 'number', attrs: ' step="0.1"' }) + U.field('Waist (cm)', 'waist', { type: 'number', attrs: ' step="0.1"' }) + U.field('Hips (cm)', 'hips', { type: 'number', attrs: ' step="0.1"' }) + U.field('Body fat (%)', 'bodyFat', { type: 'number', attrs: ' step="0.1"' }) + '</div>';
    U.modal('Add measurement', body, { onSubmit: (v, form) => {
      if (!U.validate(form, v, { date: { req: 1 }, weight: { req: 1, positive: 1 } })) return;
      m.measurements.push({ id: D.uid('ms'), date: v.date, weight: +v.weight, height: v.height ? +v.height : '', chest: v.chest ? +v.chest : '', waist: v.waist ? +v.waist : '', hips: v.hips ? +v.hips : '', bodyFat: v.bodyFat ? +v.bodyFat : '' });
      D.save(); U.closeModal(); U.toast('Measurement saved'); FT.render();
    } });
  };
  FT.acts.addNote = (d) => {
    const m = D.get('members', d.id);
    U.modal('Add note', U.field('Note', 'text', { type: 'textarea', rows: 4, req: 1 }), { onSubmit: (v, form) => {
      if (!U.validate(form, v, { text: { req: 1 } })) return;
      m.noteList.push({ id: D.uid('n'), date: D.today(), text: v.text.trim() }); D.save(); U.closeModal(); U.toast('Note added'); FT.render();
    } });
  };
  FT.acts.delNote = (d) => { const m = D.get('members', d.id); U.confirm('Delete note?', 'This note will be permanently removed.', () => { m.noteList = m.noteList.filter((n) => n.id !== d.note); D.save(); U.toast('Note deleted'); FT.render(); }, 'Delete'); };

  // ====================== PLANS ======================
  V.plans = () => {
    const db = D.db;
    const cards = db.plans.map((p) => {
      const n = D.liveMembers().filter((m) => m.planId === p.id).length;
      return '<div class="card plan-card ' + (p.active ? '' : 'off') + '"><div class="card-head"><h3>' + esc(p.name) + '</h3>' + U.badge(p.active ? 'active' : 'inactive') + '</div><div class="price">' + U.money(p.price) + '</div><div class="muted">' + p.months + ' month' + (p.months > 1 ? 's' : '') + ' · ' + U.money(p.price / p.months) + '/month</div><p class="muted">' + esc(p.description) + '</p><ul>' + p.features.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:8px"><span class="badge b-blue">' + n + ' member' + (n === 1 ? '' : 's') + '</span><div class="row-actions"><button class="btn sm" data-act="editPlan" data-id="' + p.id + '">' + icon('edit') + 'Edit</button><button class="btn sm" data-act="togglePlan" data-id="' + p.id + '">' + (p.active ? 'Deactivate' : 'Activate') + '</button></div></div></div>';
    }).join('');
    return '<div class="page-head"><div><h1>Membership Plans</h1><p>Manage pricing and what each plan includes.</p></div><div class="actions"><button class="btn primary" data-act="addPlan">' + icon('plus') + 'Create Plan</button></div></div><div class="grid g4">' + cards + '</div>';
  };
  function planModal(id) {
    const p = id ? D.get('plans', id) : null;
    const body = '<div class="form-grid">' + U.field('Plan name', 'name', { value: p && p.name, req: 1 }) + U.field('Price (' + D.db.settings.currency + ')', 'price', { type: 'number', value: p && p.price, req: 1, attrs: ' min="0"' }) + U.field('Duration (months)', 'months', { type: 'number', value: p ? p.months : 1, req: 1, attrs: ' min="1" max="60"' }) +
      U.field('Status', 'active', { type: 'select', options: '<option value="1"' + (!p || p.active ? ' selected' : '') + '>Active</option><option value="0"' + (p && !p.active ? ' selected' : '') + '>Inactive</option>' }) +
      U.field('Description', 'description', { type: 'textarea', value: p && p.description, full: 1 }) + U.field('Features (one per line)', 'features', { type: 'textarea', rows: 5, value: p && p.features.join('\n'), full: 1 }) + '</div>';
    U.modal(p ? 'Edit plan' : 'Create plan', body, { onSubmit: (v, form) => {
      if (!U.validate(form, v, { name: { req: 1 }, price: { req: 1, positive: 1 }, months: { req: 1, custom: (x) => (!(parseInt(x, 10) >= 1) ? 'Enter at least 1 month' : '') } })) return;
      const rec = { name: v.name.trim(), price: Number(v.price), months: parseInt(v.months, 10), active: v.active === '1', description: v.description.trim(), features: v.features.split('\n').map((x) => x.trim()).filter(Boolean) };
      if (p) Object.assign(p, rec); else D.db.plans.push(Object.assign({ id: D.uid('pl') }, rec));
      D.save(); U.closeModal(); U.toast(p ? 'Plan updated' : 'Plan created'); FT.render();
    } });
  }
  FT.acts.addPlan = () => planModal();
  FT.acts.editPlan = (d) => planModal(d.id);
  FT.acts.togglePlan = (d) => {
    const p = D.get('plans', d.id);
    const go = () => { p.active = !p.active; D.save(); U.toast('Plan ' + (p.active ? 'activated' : 'deactivated')); FT.render(); };
    if (p.active) U.confirm('Deactivate plan?', '“' + p.name + '” will no longer be offered for new members. Existing members keep their plan.', go, 'Deactivate'); else go();
  };
})();
