/* Views B: Attendance, Bookings, Trainers, Payments, Invoices, Reports, Messages (+AI), Settings. */
(function () {
  const FT = window.FT, D = FT.D, U = FT.U, esc = U.esc, icon = U.icon;
  const V = FT.views, A = FT.A;
  const S = (k, d) => (FT.state[k] = FT.state[k] || Object.assign({}, d));
  const weekStart = (d) => D.addDays(d, -((D.parse(d).getDay() + 6) % 7));
  const first = (n) => (n || '').split(' ')[0];

  // ====================== ATTENDANCE ======================
  A.checkIn = (memberId) => {
    const m = D.get('members', memberId), T = D.today(), s = D.memberStatus(m);
    if (s !== 'active') return U.toast(m.name + "'s membership is " + s + '. ' + (s === 'expired' ? 'Renew it before checking in.' : 'Check-in is not allowed.'), 'err');
    if (D.db.attendance.some((a) => a.memberId === memberId && a.date === T && !a.checkOut)) return U.toast(m.name + ' is already checked in', 'err');
    D.db.attendance.push({ id: D.uid('at'), memberId, date: T, checkIn: D.nowTime(), checkOut: null });
    D.save(); U.toast(m.name + ' checked in at ' + U.time12(D.nowTime())); FT.render();
  };
  FT.acts.checkIn = (d) => A.checkIn(d.id);
  FT.acts.checkOut = (d) => {
    const a = D.get('attendance', d.id); if (!a) return;
    const t = D.nowTime(); a.checkOut = t < a.checkIn ? a.checkIn : t; D.save(); U.toast(D.get('members', a.memberId).name + ' checked out'); FT.render();
  };
  V.attendance = () => {
    const st = S('att', { find: '', range: 'today', from: D.today(), to: D.today(), page: 1 });
    const db = D.db, T = D.today();
    const inside = db.attendance.filter((a) => a.date === T && !a.checkOut);
    const wk = db.attendance.filter((a) => a.date >= D.addDays(T, -6)).length;
    const avg = (db.attendance.filter((a) => a.date >= D.addDays(T, -29)).length / 30).toFixed(1);
    const stat = (l, v, c, i) => '<div class="card stat"><div class="ico" style="background:' + c + '1a;color:' + c + '">' + icon(i) + '</div><div><div class="lbl">' + l + '</div><div class="val">' + v + '</div></div></div>';
    const stats = '<div class="grid g4 mb">' + stat("Today's Check-ins", db.attendance.filter((a) => a.date === T).length, '#4f46e5', 'login') + stat('Currently Inside', inside.length, '#16a34a', 'users') + stat('Weekly Attendance', wk, '#0ea5e9', 'calendar') + stat('Avg Daily Attendance', avg, '#7c3aed', 'chart') + '</div>';

    const q = st.find.trim().toLowerCase();
    const matches = q ? D.liveMembers().filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.code.toLowerCase().includes(q)).slice(0, 6) : [];
    const results = matches.map((m) => {
      const rec = inside.find((a) => a.memberId === m.id), s = D.memberStatus(m);
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-l)">' + U.person(m, m.code + ' · ' + m.phone) + '<div style="display:flex;gap:8px;align-items:center">' + U.badge(s) + (rec ? '<button class="btn sm" data-act="checkOut" data-id="' + rec.id + '">Check out</button>' : '<button class="btn sm primary" data-act="checkIn" data-id="' + m.id + '"' + (s !== 'active' ? ' disabled' : '') + '>CHECK IN</button>') + '</div></div>';
    }).join('');
    const panel = '<div class="card mb"><div class="card-head"><h3>Check in a member</h3></div><input class="in" placeholder="Search member by name, phone or ID…" value="' + esc(st.find) + '" data-on="filter" data-key="att" data-field="find" data-nopage="1">' + (q ? (results || U.empty('No member found', 'Check the spelling or try the phone number.')) : '') + '</div>';

    let from = T, to = T;
    if (st.range === 'week') from = weekStart(T); else if (st.range === 'month') from = T.slice(0, 7) + '-01'; else if (st.range === 'custom') { from = st.from; to = st.to; }
    const recs = db.attendance.filter((a) => a.date >= from && a.date <= to && D.get('members', a.memberId)).sort((a, b) => (b.date + b.checkIn).localeCompare(a.date + a.checkIn));
    const pg = U.paginate(recs, st.page, 10); st.page = pg.page;
    const rows = pg.rows.map((a) => { const m = D.get('members', a.memberId); return '<tr><td><a href="#/members/' + m.id + '" style="color:inherit">' + U.person(m, m.code) + '</a></td><td>' + U.date(a.date) + '</td><td>' + U.time12(a.checkIn) + '</td><td>' + (a.checkOut ? U.time12(a.checkOut) : '<span class="badge b-green">Inside</span>') + '</td><td>' + (a.checkOut ? D.toMin(a.checkOut) - D.toMin(a.checkIn) + ' min' : '—') + '</td><td class="r">' + (a.checkOut ? '' : '<button class="btn sm" data-act="checkOut" data-id="' + a.id + '">Check out</button>') + '</td></tr>'; }).join('');
    const rng = [['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['custom', 'Custom']];
    const list = '<div class="card"><div class="card-head"><h3>Attendance records</h3><div class="seg">' + rng.map(([k, l]) => '<button data-act="attRange" data-val="' + k + '" class="' + (st.range === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div>' +
      (st.range === 'custom' ? '<div class="toolbar"><input type="date" value="' + st.from + '" data-on="filter" data-key="att" data-field="from"><span class="muted">to</span><input type="date" value="' + st.to + '" data-on="filter" data-key="att" data-field="to"></div>' : '') +
      (pg.total ? '<div class="table-wrap"><table><thead><tr><th>Member</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' + U.pager(pg, 'att') : U.empty('No attendance in this period', 'Check-ins will show up here.')) + '</div>';
    return '<div class="page-head"><div><h1>Attendance</h1><p>Check members in and out and review visit history.</p></div></div>' + stats + panel + list;
  };
  FT.acts.attRange = (d) => { const s = S('att', {}); s.range = d.val; s.page = 1; FT.render(); };

  // ====================== BOOKINGS ======================
  const SESSIONS = ['Personal Training', 'Strength Training', 'Yoga', 'Cardio', 'HIIT', 'Other'];
  V.bookings = () => {
    const st = S('bk', { view: 'list', when: 'upcoming', status: '', trainer: '', week: weekStart(D.today()), page: 1 });
    const db = D.db, T = D.today(), nowT = D.nowTime();
    const ctl = '<div class="toolbar"><div class="seg"><button data-act="bkView" data-val="list" class="' + (st.view === 'list' ? 'on' : '') + '">List</button><button data-act="bkView" data-val="calendar" class="' + (st.view === 'calendar' ? 'on' : '') + '">Calendar</button></div>' +
      '<select data-on="filter" data-key="bk" data-field="trainer"><option value="">All trainers</option>' + U.optList(db.trainers, st.trainer) + '</select>' +
      (st.view === 'list' ? '<select data-on="filter" data-key="bk" data-field="when">' + [['upcoming', 'Upcoming'], ['today', 'Today'], ['past', 'Past'], ['all', 'All']].map(([v, l]) => '<option value="' + v + '"' + (st.when === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><select data-on="filter" data-key="bk" data-field="status"><option value="">All statuses</option>' + ['confirmed', 'completed', 'cancelled', 'no_show'].map((s) => '<option value="' + s + '"' + (st.status === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') + '</select>' : '') + '</div>';
    let all = db.bookings.filter((b) => (!st.trainer || b.trainerId === st.trainer) && D.get('members', b.memberId));
    let body;
    if (st.view === 'list') {
      let l = all.filter((b) => !st.status || b.status === st.status);
      if (st.when === 'today') l = l.filter((b) => b.date === T); else if (st.when === 'past') l = l.filter((b) => b.date < T); else if (st.when === 'upcoming') l = l.filter((b) => b.date >= T);
      l.sort((a, b) => (st.when === 'past' ? -1 : 1) * (a.date + a.start).localeCompare(b.date + b.start));
      const pg = U.paginate(l, st.page, 10); st.page = pg.page;
      body = pg.total ? '<div class="table-wrap"><table><thead><tr><th>Date & time</th><th>Member</th><th>Session</th><th>Trainer</th><th>Duration</th><th>Status</th><th></th></tr></thead><tbody>' + pg.rows.map((b) => {
        const m = D.get('members', b.memberId), t = D.get('trainers', b.trainerId);
        return '<tr><td><b>' + U.time12(b.start) + '</b><br><small class="muted">' + (b.date === T ? 'Today' : U.date(b.date)) + '</small></td><td>' + U.person(m) + '</td><td>' + esc(b.session) + (b.notes ? '<br><small class="muted">' + esc(b.notes) + '</small>' : '') + '</td><td>' + esc(t ? t.name : '—') + '</td><td>' + b.duration + ' min</td><td><select class="in" style="width:auto;padding:5px 8px" data-on="bkStatus" data-id="' + b.id + '">' + ['confirmed', 'completed', 'cancelled', 'no_show'].map((s) => '<option value="' + s + '"' + (b.status === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') + '</select></td><td class="r"><div class="row-actions"><button class="btn sm" data-act="editBooking" data-id="' + b.id + '">' + icon('edit') + '</button><button class="btn sm" data-act="delBooking" data-id="' + b.id + '">' + icon('trash') + '</button></div></td></tr>';
      }).join('') + '</tbody></table></div>' + U.pager(pg, 'bk') : U.empty('No bookings found', 'Schedule a session to get started.');
    } else {
      const days = [...Array(7)].map((_, i) => D.addDays(st.week, i));
      let cells = '<div class="h"></div>' + days.map((d) => '<div class="h ' + (d === T ? 'today' : '') + '">' + D.parse(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }) + '</div>').join('');
      for (let h = 6; h <= 21; h++) {
        cells += '<div class="t">' + U.time12(String(h).padStart(2, '0') + ':00') + '</div>';
        days.forEach((d) => {
          const evs = all.filter((b) => b.date === d && parseInt(b.start, 10) === h);
          cells += '<div class="c">' + evs.map((b) => { const m = D.get('members', b.memberId), t = D.get('trainers', b.trainerId); return '<div class="ev ' + b.status + '" data-act="editBooking" data-id="' + b.id + '" title="' + esc(b.session + ' · ' + m.name + ' · ' + (t ? t.name : '') + ' · ' + b.start + ' (' + b.duration + ' min) · ' + U.label(b.status)) + '">' + b.start + ' ' + esc(first(m.name)) + ' · ' + esc(b.session) + '</div>'; }).join('') + '</div>';
        });
      }
      const wkLabel = U.shortDate(days[0]) + ' – ' + U.date(days[6]);
      body = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap"><button class="btn sm" data-act="bkWeek" data-n="-7">←</button><button class="btn sm" data-act="bkWeek" data-n="0">This week</button><button class="btn sm" data-act="bkWeek" data-n="7">→</button><b style="margin-left:6px">' + wkLabel + '</b></div><div class="table-wrap"><div class="cal">' + cells + '</div></div>';
    }
    return '<div class="page-head"><div><h1>Bookings</h1><p>Schedule sessions and keep trainers free of clashes.</p></div><div class="actions"><button class="btn primary" data-act="addBooking">' + icon('plus') + 'New Booking</button></div></div><div class="card">' + ctl + body + '</div>';
  };
  FT.acts.bkView = (d) => { S('bk', {}).view = d.val; FT.render(); };
  FT.acts.bkWeek = (d) => { const s = S('bk', {}); s.week = Number(d.n) === 0 ? weekStart(D.today()) : D.addDays(s.week, Number(d.n)); FT.render(); };
  FT.acts.addBooking = () => A.bookModal({});
  FT.acts.editBooking = (d) => A.bookModal({ id: d.id });
  FT.acts.delBooking = (d) => U.confirm('Delete booking?', 'This booking will be permanently removed.', () => { D.db.bookings = D.db.bookings.filter((b) => b.id !== d.id); D.save(); U.toast('Booking deleted'); FT.render(); }, 'Delete');
  FT.ons.bkStatus = (el) => { const b = D.get('bookings', el.dataset.id); b.status = el.value; D.save(); U.toast('Booking marked ' + U.label(el.value).toLowerCase()); FT.render(); };

  A.bookModal = (o) => {
    const db = D.db, b = o.id ? D.get('bookings', o.id) : null, T = D.today();
    const body = '<div class="form-grid">' +
      U.field('Member', 'memberId', { type: 'select', options: '<option value="">Select member…</option>' + D.liveMembers().map((m) => '<option value="' + m.id + '"' + ((b ? b.memberId : o.memberId) === m.id ? ' selected' : '') + '>' + esc(m.name) + ' (' + m.code + ')</option>').join('') }) +
      U.field('Trainer', 'trainerId', { type: 'select', options: '<option value="">Select trainer…</option>' + db.trainers.filter((t) => t.status === 'active' || (b && b.trainerId === t.id)).map((t) => '<option value="' + t.id + '"' + ((b ? b.trainerId : o.trainerId) === t.id ? ' selected' : '') + '>' + esc(t.name) + ' – ' + esc(t.specialization) + '</option>').join('') }) +
      U.field('Session', 'session', { type: 'select', options: SESSIONS.map((s) => '<option' + (b && b.session === s ? ' selected' : '') + '>' + s + '</option>').join('') }) +
      U.field('Date', 'date', { type: 'date', value: b ? b.date : (o.date || T), req: 1 }) +
      U.field('Start time', 'start', { type: 'time', value: b ? b.start : '10:00', req: 1 }) +
      U.field('Duration', 'duration', { type: 'select', options: [30, 45, 60, 90, 120].map((n) => '<option value="' + n + '"' + ((b ? Number(b.duration) : 60) === n ? ' selected' : '') + '>' + n + ' minutes</option>').join('') }) +
      U.field('Status', 'status', { type: 'select', options: ['confirmed', 'completed', 'cancelled', 'no_show'].map((s) => '<option value="' + s + '"' + ((b ? b.status : 'confirmed') === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') }) +
      U.field('Notes', 'notes', { type: 'textarea', rows: 2, value: b && b.notes, full: 1 }) + '</div>';
    U.modal(b ? 'Edit booking' : 'New booking', body, { submit: b ? 'Save changes' : 'Book session', onSubmit: (v, form) => {
      if (!U.validate(form, v, { memberId: { req: 1 }, trainerId: { req: 1 }, date: { req: 1 }, start: { req: 1 } })) return;
      const rec = { memberId: v.memberId, trainerId: v.trainerId, session: v.session, date: v.date, start: v.start, duration: Number(v.duration), notes: v.notes.trim(), status: v.status };
      if (!b && v.date < T) return U.fieldError(form, 'date', 'Pick today or a future date');
      if (rec.status !== 'cancelled') {
        const c = D.bookingClash(rec, b && b.id);
        if (c) { const cm = D.get('members', c.memberId); return U.fieldError(form, 'start', D.get('trainers', rec.trainerId).name + ' is already booked ' + c.start + '–' + D.fromMin(D.toMin(c.start) + Number(c.duration)) + ' (' + (cm ? cm.name : 'another member') + ')'); }
      }
      if (b) Object.assign(b, rec); else db.bookings.push(Object.assign({ id: D.uid('bk') }, rec));
      D.save(); U.closeModal(); U.toast(b ? 'Booking updated' : 'Session booked'); FT.render();
    } });
  };

  // ====================== TRAINERS ======================
  V.trainers = () => {
    const db = D.db, T = D.today();
    const cards = db.trainers.map((t) => {
      const assigned = D.liveMembers().filter((m) => m.trainerId === t.id).length;
      const up = db.bookings.filter((b) => b.trainerId === t.id && b.status === 'confirmed' && b.date >= T).length;
      return '<div class="card"><div style="display:flex;gap:14px;align-items:center">' + U.avatar(t, 'md') + '<div style="flex:1;min-width:0"><b style="font-size:15px">' + esc(t.name) + '</b><div class="muted">' + esc(t.specialization) + '</div></div>' + U.badge(t.status) + '</div>' +
        '<dl class="kv" style="margin:14px 0;grid-template-columns:110px 1fr"><dt>Experience</dt><dd>' + t.experience + ' years</dd><dt>Availability</dt><dd>' + esc(t.availability) + '</dd><dt>Phone</dt><dd>' + esc(t.phone) + '</dd><dt>Email</dt><dd style="overflow-wrap:anywhere">' + esc(t.email) + '</dd></dl>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><span class="badge b-blue">' + assigned + ' member' + (assigned === 1 ? '' : 's') + '</span><span class="badge b-violet">' + up + ' upcoming</span></div>' +
        '<div class="row-actions" style="justify-content:flex-start"><button class="btn sm" data-act="trainerSchedule" data-id="' + t.id + '">' + icon('calendar') + 'Schedule</button><button class="btn sm" data-act="editTrainer" data-id="' + t.id + '">' + icon('edit') + 'Edit</button></div></div>';
    }).join('');
    return '<div class="page-head"><div><h1>Trainers</h1><p>Your coaching team, their availability and workload.</p></div><div class="actions"><button class="btn primary" data-act="addTrainer">' + icon('plus') + 'Add Trainer</button></div></div><div class="grid g4">' + cards + '</div>';
  };
  FT.acts.addTrainer = () => trainerModal();
  FT.acts.editTrainer = (d) => trainerModal(d.id);
  function trainerModal(id) {
    const t = id ? D.get('trainers', id) : null;
    const body = '<div class="form-grid">' + U.photoField('Photo', 'photo', t && t.photo) + U.field('Full name', 'name', { value: t && t.name, req: 1 }) + U.field('Phone', 'phone', { value: t && t.phone, req: 1 }) + U.field('Email', 'email', { value: t && t.email, type: 'email' }) + U.field('Specialization', 'specialization', { value: t && t.specialization, req: 1 }) + U.field('Experience (years)', 'experience', { type: 'number', value: t ? t.experience : 1, attrs: ' min="0" max="60"' }) + U.field('Status', 'status', { type: 'select', options: ['active', 'inactive'].map((s) => '<option value="' + s + '"' + ((t ? t.status : 'active') === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') }) + U.field('Availability', 'availability', { value: t && t.availability, placeholder: 'Mon–Fri, 09:00–17:00', full: 1 }) + '</div>';
    U.modal(t ? 'Edit trainer' : 'Add trainer', body, { onMount: U.bindPhotos, submit: t ? 'Save changes' : 'Add trainer', onSubmit: (v, form) => {
      if (!U.validate(form, v, { name: { req: 1 }, phone: { req: 1, phone: 1 }, email: { email: 1 }, specialization: { req: 1 } })) return;
      const rec = { name: v.name.trim(), phone: v.phone.trim(), email: v.email.trim(), specialization: v.specialization.trim(), experience: Number(v.experience) || 0, status: v.status, availability: v.availability.trim(), photo: v.photo };
      if (t) Object.assign(t, rec); else D.db.trainers.push(Object.assign({ id: D.uid('tr') }, rec));
      D.save(); U.closeModal(); U.toast(t ? 'Trainer updated' : 'Trainer added'); FT.render();
    } });
  }
  FT.acts.trainerSchedule = (d) => {
    const t = D.get('trainers', d.id), T = D.today();
    const bks = D.db.bookings.filter((b) => b.trainerId === t.id && b.date >= T && b.status !== 'cancelled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const mem = D.liveMembers().filter((m) => m.trainerId === t.id);
    const body = '<h4 style="margin-bottom:8px">Upcoming sessions</h4>' + (bks.length ? '<div class="table-wrap"><table><thead><tr><th>When</th><th>Member</th><th>Session</th><th>Status</th></tr></thead><tbody>' + bks.slice(0, 15).map((b) => '<tr><td>' + (b.date === T ? 'Today' : U.shortDate(b.date)) + ' · ' + U.time12(b.start) + '</td><td>' + esc(D.get('members', b.memberId).name) + '</td><td>' + esc(b.session) + ' (' + b.duration + 'm)</td><td>' + U.badge(b.status) + '</td></tr>').join('') + '</tbody></table></div>' : U.empty('No upcoming sessions', '')) +
      '<h4 style="margin:16px 0 8px">Assigned members (' + mem.length + ')</h4>' + (mem.length ? mem.map((m) => '<a class="chip" href="#/members/' + m.id + '" data-act="closeModal">' + esc(m.name) + '</a>').join('') : '<span class="muted">No members assigned.</span>');
    U.modal(t.name + ' – schedule', body, { wide: true, footer: false });
  };

  // ====================== PAYMENTS & INVOICES ======================
  A.paymentModal = (memberId) => {
    const db = D.db, T = D.today();
    const mem = memberId ? D.get('members', memberId) : null;
    const defPlan = mem ? mem.planId : db.plans[0].id;
    const body = '<div class="form-grid">' +
      U.field('Member', 'memberId', { type: 'select', options: '<option value="">Select member…</option>' + D.liveMembers().map((m) => '<option value="' + m.id + '"' + (memberId === m.id ? ' selected' : '') + '>' + esc(m.name) + ' (' + m.code + ')</option>').join('') }) +
      U.field('Membership plan', 'planId', { type: 'select', options: db.plans.map((p) => '<option value="' + p.id + '"' + (p.id === defPlan ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') }) +
      U.field('Amount (' + db.settings.currency + ')', 'amount', { type: 'number', value: D.get('plans', defPlan).price, req: 1, attrs: ' min="0"' }) +
      U.field('Payment method', 'method', { type: 'select', options: ['cash', 'bank_transfer', 'card', 'other'].map((x) => '<option value="' + x + '">' + U.label(x) + '</option>').join('') }) +
      U.field('Transaction / reference no.', 'ref') + U.field('Payment date', 'date', { type: 'date', value: T, req: 1 }) +
      U.field('Status', 'status', { type: 'select', options: '<option value="paid">Paid</option><option value="pending">Pending</option>' }) + U.field('Due date (if pending)', 'dueDate', { type: 'date', value: D.addDays(T, db.settings.invoiceDueDays || 7) }) +
      U.field('Notes', 'notes', { type: 'textarea', rows: 2, full: 1 }) + '</div>';
    U.modal('Add payment', body, { submit: 'Record payment', onMount: (form) => {
      const upd = () => { const p = D.get('plans', form.elements.planId.value); if (p) form.elements.amount.value = p.price; };
      form.elements.planId.addEventListener('change', upd);
      form.elements.memberId.addEventListener('change', () => { const m = D.get('members', form.elements.memberId.value); if (m) { form.elements.planId.value = m.planId; upd(); } });
    }, onSubmit: (v, form) => {
      if (!U.validate(form, v, { memberId: { req: 1 }, amount: { req: 1, positive: 1 }, date: { req: 1 } })) return;
      if (v.status === 'pending' && !v.dueDate) return U.fieldError(form, 'dueDate', 'Required for pending payments');
      const p = D.addPayment({ memberId: v.memberId, planId: v.planId, amount: Number(v.amount), method: v.method, ref: v.ref.trim(), date: v.date, dueDate: v.status === 'pending' ? v.dueDate : v.date, status: v.status, notes: v.notes.trim() });
      D.save(); U.closeModal(); U.toast('Payment recorded · ' + D.get('invoices', p.invoiceId).no + ' created'); FT.render();
    } });
  };
  A.renewModal = (memberId) => {
    const m = D.get('members', memberId), db = D.db, T = D.today();
    const base = () => (m.expiryDate > T ? m.expiryDate : T);
    const body = '<p class="muted" style="margin-top:0">' + esc(m.name) + ' · current expiry <b>' + U.date(m.expiryDate) + '</b></p><div class="form-grid">' +
      U.field('Plan', 'planId', { type: 'select', options: db.plans.filter((p) => p.active || p.id === m.planId).map((p) => '<option value="' + p.id + '"' + (p.id === m.planId ? ' selected' : '') + '>' + esc(p.name) + ' – ' + U.money(p.price) + '</option>').join('') }) +
      U.field('Payment method', 'method', { type: 'select', options: ['cash', 'bank_transfer', 'card', 'other'].map((x) => '<option value="' + x + '">' + U.label(x) + '</option>').join('') }) + '</div><div class="hint" data-preview>—</div>';
    U.modal('Renew membership', body, { submit: 'Renew & record payment', onMount: (form) => {
      const upd = () => { const p = D.get('plans', form.elements.planId.value); form.querySelector('[data-preview]').innerHTML = 'New expiry: <b>' + U.date(D.addMonths(base(), p.months)) + '</b> · Amount: <b>' + U.money(p.price) + '</b>'; };
      form.elements.planId.addEventListener('change', upd); upd();
    }, onSubmit: (v) => {
      const p = D.renew(memberId, v.planId, v.method); D.save(); U.closeModal();
      U.toast(m.name + ' renewed until ' + U.date(m.expiryDate) + ' · ' + D.get('invoices', p.invoiceId).no); FT.render();
    } });
  };
  A.invoiceModal = (memberId) => {
    const m = D.get('members', memberId), db = D.db, T = D.today();
    const body = '<p class="muted" style="margin-top:0">Creates an unpaid invoice for ' + esc(m.name) + '. Mark it as paid once the money is received.</p><div class="form-grid">' +
      U.field('Plan', 'planId', { type: 'select', options: db.plans.map((p) => '<option value="' + p.id + '"' + (p.id === m.planId ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') }) +
      U.field('Amount (' + db.settings.currency + ')', 'amount', { type: 'number', value: D.get('plans', m.planId).price, req: 1, attrs: ' min="0"' }) +
      U.field('Due date', 'dueDate', { type: 'date', value: D.addDays(T, db.settings.invoiceDueDays || 7), req: 1 }) + '</div>';
    U.modal('Generate invoice', body, { submit: 'Generate invoice', onMount: (form) => form.elements.planId.addEventListener('change', () => { form.elements.amount.value = D.get('plans', form.elements.planId.value).price; }), onSubmit: (v, form) => {
      if (!U.validate(form, v, { amount: { req: 1, positive: 1 }, dueDate: { req: 1 } })) return;
      const p = D.addPayment({ memberId, planId: v.planId, amount: Number(v.amount), method: 'other', date: T, dueDate: v.dueDate, status: 'pending', notes: 'Invoice generated' });
      D.save(); U.closeModal(); U.toast('Invoice created'); location.hash = '#/invoice/' + p.invoiceId;
    } });
  };

  V.payments = () => {
    const st = S('pay', { tab: 'payments', q: '', status: '', method: '', page: 1 });
    const db = D.db, T = D.today();
    const sum = (f) => db.payments.filter(f).reduce((a, p) => a + p.amount, 0);
    const ps = (p) => D.paymentStatus(p);
    const stat = (l, v, c, i) => '<div class="card stat"><div class="ico" style="background:' + c + '1a;color:' + c + '">' + icon(i) + '</div><div><div class="lbl">' + l + '</div><div class="val">' + v + '</div></div></div>';
    const stats = '<div class="grid g4 mb">' + stat('Total Revenue', U.money(sum((p) => p.status === 'paid')), '#4f46e5', 'card') + stat('Revenue This Month', U.money(sum((p) => p.status === 'paid' && p.date.startsWith(T.slice(0, 7)))), '#16a34a', 'chart') + stat('Pending Payments', U.money(sum((p) => ps(p) === 'pending')), '#d97706', 'calendar') + stat('Overdue Payments', U.money(sum((p) => ps(p) === 'overdue')), '#dc2626', 'bell') + '</div>';
    const q = st.q.trim().toLowerCase();
    const mname = (id) => (D.get('members', id) || {}).name || '';
    let body;
    if (st.tab === 'payments') {
      let l = db.payments.filter((p) => D.get('members', p.memberId));
      if (q) l = l.filter((p) => mname(p.memberId).toLowerCase().includes(q) || (p.ref || '').toLowerCase().includes(q));
      if (st.status) l = l.filter((p) => ps(p) === st.status);
      if (st.method) l = l.filter((p) => p.method === st.method);
      l.sort((a, b) => b.date.localeCompare(a.date));
      const pg = U.paginate(l, st.page, 10); st.page = pg.page;
      body = pg.total ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Member</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th></th></tr></thead><tbody>' + pg.rows.map((p) => {
        const m = D.get('members', p.memberId), s = ps(p), inv = D.get('invoices', p.invoiceId);
        return '<tr><td>' + U.date(p.date) + (s === 'pending' || s === 'overdue' ? '<br><small class="muted">Due ' + U.shortDate(p.dueDate) + '</small>' : '') + '</td><td><a href="#/members/' + m.id + '" style="color:inherit"><b>' + esc(m.name) + '</b></a></td><td>' + esc(U.planName(p.planId)) + '</td><td><b>' + U.money(p.amount) + '</b></td><td>' + U.label(p.method) + '</td><td>' + esc(p.ref || '—') + '</td><td>' + U.badge(s) + '</td><td class="r"><div class="row-actions">' +
          (s === 'pending' || s === 'overdue' ? '<button class="btn sm primary" data-act="markPaid" data-id="' + p.id + '">Mark paid</button>' : '') + (s === 'paid' ? '<button class="btn sm" data-act="refund" data-id="' + p.id + '">Refund</button>' : '') + (inv ? '<a class="btn sm" href="#/invoice/' + inv.id + '" title="Invoice">' + icon('print') + '</a>' : '') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>' + U.pager(pg, 'pay') : U.empty('No payments found', 'Try changing your search or filters.');
    } else {
      let l = db.invoices.filter((i) => D.get('members', i.memberId));
      if (q) l = l.filter((i) => i.no.toLowerCase().includes(q) || mname(i.memberId).toLowerCase().includes(q));
      if (st.status) l = l.filter((i) => { const p = D.get('payments', i.paymentId); return p && ps(p) === st.status; });
      l.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.no.localeCompare(a.no));
      const pg = U.paginate(l, st.page, 10); st.page = pg.page;
      body = pg.total ? '<div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Member</th><th>Plan</th><th>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>' + pg.rows.map((i) => { const p = D.get('payments', i.paymentId); return '<tr><td><b>' + esc(i.no) + '</b></td><td>' + esc(mname(i.memberId)) + '</td><td>' + esc(U.planName(i.planId)) + '</td><td><b>' + U.money(i.amount) + '</b></td><td>' + U.date(i.issueDate) + '</td><td>' + U.date(i.dueDate) + '</td><td>' + U.badge(p ? ps(p) : 'pending') + '</td><td class="r"><a class="btn sm" href="#/invoice/' + i.id + '">' + icon('eye') + 'View</a></td></tr>'; }).join('') + '</tbody></table></div>' + U.pager(pg, 'pay') : U.empty('No invoices found', '');
    }
    const tabs = '<div class="tabs"><button data-act="payTab" data-tab="payments" class="' + (st.tab === 'payments' ? 'on' : '') + '">Payments</button><button data-act="payTab" data-tab="invoices" class="' + (st.tab === 'invoices' ? 'on' : '') + '">Invoices</button></div>';
    return '<div class="page-head"><div><h1>Payments & Invoices</h1><p>Track revenue, outstanding balances and invoices.</p></div><div class="actions"><button class="btn primary" data-act="addPaymentGlobal">' + icon('plus') + 'Add Payment</button></div></div>' + stats +
      '<div class="card">' + tabs + '<div class="toolbar"><input class="grow" placeholder="' + (st.tab === 'payments' ? 'Search member or reference…' : 'Search invoice number or member…') + '" value="' + esc(st.q) + '" data-on="filter" data-key="pay" data-field="q"><select data-on="filter" data-key="pay" data-field="status"><option value="">All statuses</option>' + ['paid', 'pending', 'overdue', 'refunded'].map((s) => '<option value="' + s + '"' + (st.status === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') + '</select>' +
      (st.tab === 'payments' ? '<select data-on="filter" data-key="pay" data-field="method"><option value="">All methods</option>' + ['cash', 'bank_transfer', 'card', 'other'].map((s) => '<option value="' + s + '"' + (st.method === s ? ' selected' : '') + '>' + U.label(s) + '</option>').join('') + '</select>' : '') + '</div>' + body + '</div>';
  };
  FT.acts.payTab = (d) => { const s = S('pay', {}); s.tab = d.tab; s.page = 1; FT.render(); };
  FT.acts.addPaymentGlobal = () => A.paymentModal();
  FT.acts.markPaid = (d) => { const p = D.get('payments', d.id); U.confirm('Mark as paid?', 'Record ' + U.money(p.amount) + ' from ' + D.get('members', p.memberId).name + ' as received today.', () => { p.status = 'paid'; p.date = D.today(); D.save(); U.toast('Payment marked as paid'); FT.render(); }, 'Mark paid'); };
  FT.acts.refund = (d) => { const p = D.get('payments', d.id); U.confirm('Refund payment?', 'This marks ' + U.money(p.amount) + ' as refunded. It will no longer count toward revenue.', () => { p.status = 'refunded'; D.save(); U.toast('Payment refunded'); FT.render(); }, 'Refund'); };

  V.invoice = (id) => {
    const inv = D.get('invoices', id);
    if (!inv) return '<div class="card">' + U.empty('Invoice not found', '') + '<div style="text-align:center"><a class="btn" href="#/payments">Back to payments</a></div></div>';
    const g = D.db.settings, m = D.get('members', inv.memberId), p = D.get('payments', inv.paymentId), plan = D.get('plans', inv.planId);
    const s = p ? D.paymentStatus(p) : 'pending', paid = s === 'paid';
    return '<div class="no-print" style="display:flex;justify-content:space-between;gap:8px;margin-bottom:16px;flex-wrap:wrap"><a href="#/payments" class="btn">← Back</a><div class="actions">' + (!paid && s !== 'refunded' ? '<button class="btn" data-act="markPaid" data-id="' + p.id + '">Mark as paid</button>' : '') + '<button class="btn primary" data-act="printPage">' + icon('print') + 'Print / Save PDF</button></div></div>' +
      '<div class="invoice"><div class="top"><div class="gym"><div class="logo">' + (g.logo ? '<img src="' + esc(g.logo) + '" alt="">' : icon('zap')) + '</div><div><b style="font-size:19px">' + esc(g.gymName) + '</b><div class="muted">' + esc(g.address) + '<br>' + esc(g.phone) + ' · ' + esc(g.email) + '</div></div></div><div><h2>INVOICE</h2><div style="text-align:right;margin-top:6px"><b>' + esc(inv.no) + '</b></div></div></div>' +
      '<div class="meta"><div><h4>Billed to</h4><b>' + esc(m.name) + '</b><div class="muted">' + esc(m.code) + '<br>' + esc(m.phone) + (m.email ? '<br>' + esc(m.email) : '') + (m.address ? '<br>' + esc(m.address) : '') + '</div></div><div style="text-align:right"><h4>Details</h4>Issue date: <b>' + U.date(inv.issueDate) + '</b><br>Due date: <b>' + U.date(inv.dueDate) + '</b><br><br><span class="stamp ' + (paid ? 'paid' : 'unpaid') + '">' + (s === 'refunded' ? 'REFUNDED' : paid ? 'PAID' : s === 'overdue' ? 'OVERDUE' : 'UNPAID') + '</span></div></div>' +
      '<table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Amount</th></tr></thead><tbody><tr><td><b>' + esc(plan ? plan.name : 'Membership') + ' Membership</b><br><small class="muted">' + (plan ? plan.months + ' month' + (plan.months > 1 ? 's' : '') + ' access · ' : '') + esc((p && p.notes) || '') + '</small></td><td class="r">1</td><td class="r">' + U.money(inv.amount) + '</td></tr></tbody></table>' +
      '<div class="total"><div><div class="row"><span>Subtotal</span><span>' + U.money(inv.amount) + '</span></div><div class="row grand"><span>Total</span><span>' + U.money(inv.amount) + '</span></div></div></div>' +
      (p && paid ? '<p class="muted" style="margin-top:22px">Paid on ' + U.date(p.date) + ' via ' + U.label(p.method) + (p.ref ? ' · Ref: ' + esc(p.ref) : '') + '</p>' : '<p class="muted" style="margin-top:22px">Please pay by ' + U.date(inv.dueDate) + ' at the front desk or by bank transfer, quoting ' + esc(inv.no) + '.</p>') +
      '<div class="foot">Thank you for training with ' + esc(g.gymName) + '.</div></div>';
  };
  FT.acts.printPage = () => window.print();

  // ====================== REPORTS ======================
  V.reports = () => {
    const st = S('rep', { preset: '6m', from: '', to: '' });
    const T = D.today(), db = D.db;
    let from, to = T;
    if (st.preset === '30d') from = D.addDays(T, -29); else if (st.preset === '3m') from = D.addMonths(T, -3); else if (st.preset === '6m') from = D.addMonths(T, -6); else if (st.preset === '1y') from = D.addMonths(T, -12);
    else { from = st.from || D.addMonths(T, -6); to = st.to || T; }
    if (from > to) { const x = from; from = to; to = x; }
    // month buckets
    const months = []; let cur = from.slice(0, 7) + '-01';
    while (cur <= to && months.length < 24) { months.push(cur); cur = D.addMonths(cur, 1); }
    const mlabel = (d) => D.parse(d).toLocaleDateString('en-GB', { month: 'short', year: months.length > 12 ? '2-digit' : undefined });
    const inR = (d) => d >= from && d <= to;
    const paid = db.payments.filter((p) => p.status === 'paid' && inR(p.date));
    const revenue = paid.reduce((a, p) => a + p.amount, 0);
    const live = D.liveMembers();
    const newM = live.filter((m) => inR(m.joinDate));
    const expiredM = live.filter((m) => inR(m.expiryDate) && m.expiryDate < T && m.status === 'active');
    const att = db.attendance.filter((a) => inR(a.date));
    const kpi = (l, v, c) => '<div class="card" style="border-top:3px solid ' + c + '"><div class="muted">' + l + '</div><div style="font-size:24px;font-weight:700;margin-top:3px">' + v + '</div></div>';

    const revBars = months.map((mo) => ({ label: mlabel(mo), value: paid.filter((p) => p.date.startsWith(mo.slice(0, 7))).reduce((a, p) => a + p.amount, 0) }));
    const growth = months.map((mo, i) => { const end = i === months.length - 1 ? to : D.addDays(D.addMonths(mo, 1), -1); return { label: mlabel(mo), value: live.filter((m) => m.joinDate <= end).length }; });
    const newBars = months.map((mo) => ({ label: mlabel(mo), value: newM.filter((m) => m.joinDate.startsWith(mo.slice(0, 7))).length, color: '#7c3aed' }));
    const expBars = months.map((mo) => ({ label: mlabel(mo), value: live.filter((m) => m.expiryDate.startsWith(mo.slice(0, 7)) && m.expiryDate < T && inR(m.expiryDate)).length, color: '#dc2626' }));
    const days = D.diffDays(to, from) + 1; let attPts = [];
    if (days <= 45) for (let i = 0; i < days; i++) { const d = D.addDays(from, i); attPts.push({ label: U.shortDate(d), value: att.filter((a) => a.date === d).length }); }
    else for (let d = from; d <= to; d = D.addDays(d, 7)) { const e = D.addDays(d, 6); attPts.push({ label: U.shortDate(d), value: att.filter((a) => a.date >= d && a.date <= e).length }); }
    const planSales = db.plans.map((p, i) => ({ label: p.name, value: paid.filter((x) => x.planId === p.id).length, color: U.COLORS[i] }));
    const top = planSales.slice().sort((a, b) => b.value - a.value)[0];
    const tstats = db.trainers.map((t) => { const b = db.bookings.filter((x) => x.trainerId === t.id && inR(x.date)); const done = b.filter((x) => x.status === 'completed').length; return { t, total: b.length, done, bad: b.filter((x) => x.status === 'cancelled' || x.status === 'no_show').length }; });

    const presets = [['30d', '30 days'], ['3m', '3 months'], ['6m', '6 months'], ['1y', '1 year'], ['custom', 'Custom']];
    return '<div class="page-head"><div><h1>Reports & Analytics</h1><p>' + U.date(from) + ' – ' + U.date(to) + '</p></div><div class="actions"><button class="btn" data-act="printPage">' + icon('print') + 'Print</button></div></div>' +
      '<div class="card mb"><div class="toolbar" style="margin:0"><div class="seg">' + presets.map(([k, l]) => '<button data-act="repPreset" data-val="' + k + '" class="' + (st.preset === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>' + (st.preset === 'custom' ? '<input type="date" value="' + from + '" data-on="filter" data-key="rep" data-field="from" data-nopage="1"><span class="muted">to</span><input type="date" value="' + to + '" data-on="filter" data-key="rep" data-field="to" data-nopage="1">' : '') + '</div></div>' +
      '<div class="grid g4 mb">' + kpi('Revenue', U.money(revenue), '#4f46e5') + kpi('New members', newM.length, '#16a34a') + kpi('Expired memberships', expiredM.length, '#dc2626') + kpi('Total check-ins', att.length, '#0ea5e9') + '</div>' +
      '<div class="grid g2 mb"><div class="card"><div class="card-head"><h3>Monthly Revenue</h3></div>' + U.barChart(revBars, { fmtY: (v) => (v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v)), fmtTip: U.money }) + '</div>' +
      '<div class="card"><div class="card-head"><h3>Membership Growth</h3></div>' + U.lineChart(growth, { fmtTip: (v) => v + ' members' }) + '</div></div>' +
      '<div class="grid g2 mb"><div class="card"><div class="card-head"><h3>New Members</h3></div>' + U.barChart(newBars) + '</div><div class="card"><div class="card-head"><h3>Expired Memberships</h3></div>' + U.barChart(expBars) + '</div></div>' +
      '<div class="grid g2 mb"><div class="card"><div class="card-head"><h3>Attendance Trend</h3><span class="muted">' + (days <= 45 ? 'daily' : 'weekly') + '</span></div>' + U.lineChart(attPts, { color: '#0ea5e9', fmtTip: (v) => v + ' check-ins' }) + '</div>' +
      '<div class="card"><div class="card-head"><h3>Most Popular Plan</h3></div>' + (top && top.value ? '<div style="margin-bottom:10px"><span class="badge b-violet">' + esc(top.label) + '</span> <span class="muted">' + top.value + ' sales in this period</span></div>' : '') + U.donut(planSales, 'plan sales') + '</div></div>' +
      '<div class="card"><div class="card-head"><h3>Trainer Booking Statistics</h3></div>' + (tstats.some((x) => x.total) ? '<div class="grid g2"><div>' + U.barChart(tstats.map((x) => ({ label: first(x.t.name), value: x.total })), { color: '#4f46e5' }) + '</div><div class="table-wrap"><table><thead><tr><th>Trainer</th><th class="r">Bookings</th><th class="r">Completed</th><th class="r">Cancelled / no-show</th></tr></thead><tbody>' + tstats.map((x) => '<tr><td>' + esc(x.t.name) + '</td><td class="r">' + x.total + '</td><td class="r">' + x.done + '</td><td class="r">' + x.bad + '</td></tr>').join('') + '</tbody></table></div></div>' : U.empty('No bookings in this period', '')) + '</div>';
  };
  FT.acts.repPreset = (d) => { const s = S('rep', {}); s.preset = d.val; FT.render(); };

  // ====================== MESSAGES + AI ======================
  // Delivery channels. Add WhatsApp / email by registering another entry that returns a Promise.
  FT.channels = { 'in-app': { label: 'In-app', send: (msg, member) => Promise.resolve({ ok: true }) } };
  // AI providers. The demo provider writes template-based copy so the app works with no API key.
  FT.ai = {
    providers: {
      demo: (o) => {
        const m = o.member, g = D.db.settings.gymName, T = D.today(), n = m ? first(m.name) : 'there';
        const plan = m ? U.planName(m.planId) : 'membership';
        const tone = o.tone, pick = (p, f, s, mo) => ({ professional: p, friendly: f, short: s, motivational: mo }[tone]);
        if (o.kind === 'expiry') {
          const dl = m ? D.daysLeft(m) : 3, when = !m ? 'is about to expire' : dl < 0 ? 'expired on ' + U.date(m.expiryDate) : dl === 0 ? 'expires today' : 'expires on ' + U.date(m.expiryDate) + ' (' + dl + ' day' + (dl > 1 ? 's' : '') + ' left)';
          return pick(`Dear ${n}, your ${plan} membership at ${g} ${when}. Please renew at the front desk or via bank transfer to continue uninterrupted access. Thank you.`, `Hi ${n}! Quick heads-up: your ${plan} membership ${when}. We would love to keep seeing you at ${g}. Renew any time at the desk!`, `${n}, your membership ${when}. Renew at ${g} to stay active.`, `${n}, you have come too far to stop now! Your membership ${when}. Renew and keep crushing your goals at ${g}.`);
        }
        if (o.kind === 'payment') {
          const due = m ? D.db.payments.filter((p) => p.memberId === m.id && ['pending', 'overdue'].includes(D.paymentStatus(p))).reduce((a, p) => a + p.amount, 0) : 0;
          const amt = due ? U.money(due) : 'your outstanding balance';
          return pick(`Dear ${n}, this is a reminder that ${amt} is pending with ${g}. Kindly settle it at your earliest convenience. If you have already paid, please ignore this message.`, `Hi ${n}, just a friendly reminder about ${amt} at ${g}. You can pay at the desk or by bank transfer. Thanks!`, `${n}: ${amt} is due at ${g}. Please pay soon.`, `${n}, keep your momentum going. Please clear ${amt} so nothing slows your progress at ${g}!`);
        }
        if (o.kind === 'booking') {
          const b = m ? D.db.bookings.filter((x) => x.memberId === m.id && x.status === 'confirmed' && x.date >= T).sort((a, c) => (a.date + a.start).localeCompare(c.date + c.start))[0] : null;
          const tr = b && D.get('trainers', b.trainerId), what = b ? `${b.session} session${tr ? ' with ' + tr.name : ''} on ${U.date(b.date)} at ${U.time12(b.start)}` : 'upcoming session';
          return pick(`Dear ${n}, this is a reminder of your ${what} at ${g}. Please arrive 10 minutes early.`, `Hi ${n}! Don't forget your ${what}. See you at ${g}!`, `${n}, reminder: ${what}.`, `${n}, your ${what} is waiting. Show up and make it count!`);
        }
        if (o.kind === 'personal') {
          const v = m ? D.db.attendance.filter((a) => a.memberId === m.id && a.date >= D.addDays(T, -30)).length : 0;
          const line = v ? `you visited ${v} time${v > 1 ? 's' : ''} in the last 30 days` : 'we have not seen you at the gym lately';
          return pick(`Dear ${n}, ${line}. Our team at ${g} is happy to review your plan with you whenever suits you.`, `Hi ${n}! ${line.charAt(0).toUpperCase() + line.slice(1)}. ${v ? 'Great consistency!' : 'We miss you!'} Drop by and say hi at ${g}.`, `${n}, ${line}. ${v ? 'Keep it up!' : 'Come back soon!'}`, `${n}, ${line}. ${v ? 'Consistency builds champions. Keep going!' : 'Every comeback starts with one workout. We are ready when you are!'}`);
        }
        return pick(`Dear members, ${g} is introducing new group classes this week. Please ask at the front desk about schedules and current membership offers.`, `Hey ${m ? n : 'team'}! New group classes are starting at ${g}. Come try one and ask us about our latest membership offers!`, `New classes at ${g} this week. Ask at the desk!`, `New week, new goals! Join our new classes at ${g} and take your training up a level.`);
      },
    },
    generate(o) { const p = this.providers[D.db.settings.aiProvider || 'demo'] || this.providers.demo; return new Promise((res) => setTimeout(() => res(p(o)), 450)); },
  };
  const MSG_TYPES = [['expiry', 'Membership expiry reminder'], ['payment', 'Payment reminder'], ['booking', 'Booking reminder'], ['announcement', 'General announcement'], ['personal', 'Personalized message']];
  const typeLabel = (t) => (MSG_TYPES.find((x) => x[0] === t) || [0, t])[1];

  A.messageModal = (o) => {
    o = o || {};
    const msg = o.id ? D.get('messages', o.id) : null, db = D.db;
    const recip = msg ? msg.memberId : (o.memberId || '');
    const body = '<div class="form-grid">' + U.field('Message type', 'type', { type: 'select', options: MSG_TYPES.map(([k, l]) => '<option value="' + k + '"' + ((msg ? msg.type : o.type || 'expiry') === k ? ' selected' : '') + '>' + l + '</option>').join('') }) +
      U.field('Recipient', 'memberId', { type: 'select', options: '<option value="all">All active members</option>' + D.liveMembers().map((m) => '<option value="' + m.id + '"' + (recip === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>').join('') }) +
      U.field('Tone (for AI)', 'tone', { type: 'select', options: ['professional', 'friendly', 'short', 'motivational'].map((t) => '<option value="' + t + '">' + U.label(t) + '</option>').join('') }) +
      '<div class="field" style="align-self:end"><button type="button" class="btn" data-ai>' + icon('zap') + 'Generate with AI</button></div>' +
      U.field('Message', 'body', { type: 'textarea', rows: 6, value: msg && msg.body, full: 1, placeholder: 'Write a message or use the AI assistant…' }) +
      '<div class="field full"><label class="check"><input type="checkbox" name="sendNow"> Send now via in-app channel (otherwise saved as draft)</label></div></div>';
    U.modal(msg ? 'Edit message' : 'New message', body, { wide: true, submit: 'Save', onMount: (form) => {
      const btn = form.querySelector('[data-ai]');
      btn.addEventListener('click', async () => {
        const kindSel = form.elements.type.value, mem = D.get('members', form.elements.memberId.value);
        const kind = kindSel === 'announcement' ? 'promo' : kindSel;
        btn.disabled = true; btn.innerHTML = 'Generating…';
        try { form.elements.body.value = await FT.ai.generate({ kind, tone: form.elements.tone.value, member: mem }); U.toast('Draft generated — edit it before sending'); }
        catch (e) { U.toast('AI generation failed. Try again.', 'err'); }
        btn.disabled = false; btn.innerHTML = icon('zap') + 'Generate with AI';
      });
      if (!msg && o.autogen) btn.click();
    }, onSubmit: (v, form) => {
      if (!U.validate(form, v, { body: { req: 1 } })) return;
      const rec = { type: v.type, memberId: v.memberId, body: v.body.trim() };
      const send = !!v.sendNow;
      const target = msg || Object.assign({ id: D.uid('msg'), channel: 'in-app', createdAt: new Date().toISOString(), status: 'draft' }, rec);
      Object.assign(target, rec);
      if (!msg) db.messages.push(target);
      if (send) { target.status = 'sent'; target.channel = 'in-app'; FT.channels['in-app'].send(target, D.get('members', target.memberId)); }
      D.save(); U.closeModal(); U.toast(send ? 'Message sent' : 'Draft saved'); FT.render();
    } });
  };
  V.messages = () => {
    const st = S('msg', { type: '', page: 1 });
    const db = D.db, T = D.today();
    const expiring = D.liveMembers().filter((m) => D.memberStatus(m) === 'active' && D.daysLeft(m) >= 0 && D.daysLeft(m) <= db.settings.reminderDays);
    const overdue = [...new Set(db.payments.filter((p) => D.paymentStatus(p) === 'overdue').map((p) => p.memberId))].filter((id) => D.get('members', id));
    const quick = '<div class="grid g3 mb"><div class="card"><b>Expiry reminders</b><p class="muted">' + expiring.length + ' member' + (expiring.length === 1 ? '' : 's') + ' expiring within ' + db.settings.reminderDays + ' days.</p><button class="btn sm primary" data-act="bulkExpiry"' + (expiring.length ? '' : ' disabled') + '>Prepare drafts</button></div>' +
      '<div class="card"><b>Payment reminders</b><p class="muted">' + overdue.length + ' member' + (overdue.length === 1 ? '' : 's') + ' with overdue payments.</p><button class="btn sm primary" data-act="bulkPay"' + (overdue.length ? '' : ' disabled') + '>Prepare drafts</button></div>' +
      '<div class="card"><b>AI Assistant</b><p class="muted">Pick a member and tone; get an editable message.</p><button class="btn sm primary" data-act="aiMessage">' + icon('zap') + 'Open assistant</button></div></div>';
    let l = db.messages.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (st.type) l = l.filter((x) => x.type === st.type);
    const pg = U.paginate(l, st.page, 8); st.page = pg.page;
    const rows = pg.rows.map((x) => { const m = x.memberId === 'all' ? null : D.get('members', x.memberId); return '<tr><td>' + new Date(x.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + '</td><td>' + esc(x.memberId === 'all' ? 'All active members' : m ? m.name : 'Unknown') + '</td><td><span class="badge b-blue">' + esc(typeLabel(x.type)) + '</span></td><td style="max-width:360px">' + esc(x.body.length > 90 ? x.body.slice(0, 90) + '…' : x.body) + '</td><td>' + U.badge(x.status === 'sent' ? 'completed' : 'pending').replace('Completed', 'Sent').replace('Pending', 'Draft') + '</td><td class="r"><div class="row-actions">' + (x.status === 'draft' ? '<button class="btn sm primary" data-act="sendMsg" data-id="' + x.id + '" title="Send">' + icon('send') + '</button>' : '') + '<button class="btn sm" data-act="editMsg" data-id="' + x.id + '">' + icon('edit') + '</button><button class="btn sm" data-act="delMsg" data-id="' + x.id + '">' + icon('trash') + '</button></div></td></tr>'; }).join('');
    return '<div class="page-head"><div><h1>Messages</h1><p>Prepare reminders and announcements. Stored in-app for now; WhatsApp/email can plug in later.</p></div><div class="actions"><button class="btn primary" data-act="newMsg">' + icon('plus') + 'New Message</button></div></div>' + quick +
      '<div class="card"><div class="toolbar"><select data-on="filter" data-key="msg" data-field="type"><option value="">All types</option>' + MSG_TYPES.map(([k, lb]) => '<option value="' + k + '"' + (st.type === k ? ' selected' : '') + '>' + lb + '</option>').join('') + '</select></div>' +
      (pg.total ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>To</th><th>Type</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' + U.pager(pg, 'msg') : U.empty('No messages yet', 'Create one or let the AI assistant draft it.')) + '</div>';
  };
  FT.acts.newMsg = () => A.messageModal({});
  FT.acts.aiMessage = () => A.messageModal({ autogen: false, type: 'personal' });
  FT.acts.editMsg = (d) => A.messageModal({ id: d.id });
  FT.acts.delMsg = (d) => U.confirm('Delete message?', 'This message will be removed.', () => { D.db.messages = D.db.messages.filter((x) => x.id !== d.id); D.save(); U.toast('Message deleted'); FT.render(); }, 'Delete');
  FT.acts.sendMsg = (d) => { const x = D.get('messages', d.id); FT.channels['in-app'].send(x, D.get('members', x.memberId)); x.status = 'sent'; D.save(); U.toast('Message sent'); FT.render(); };
  async function bulk(kind, type, members) {
    for (const m of members) D.db.messages.push({ id: D.uid('msg'), type, memberId: m.id, body: await FT.ai.providers.demo({ kind, tone: 'friendly', member: m }), status: 'draft', channel: 'in-app', createdAt: new Date().toISOString() });
    D.save(); U.toast(members.length + ' draft' + (members.length === 1 ? '' : 's') + ' prepared. Review and send them below.'); FT.render();
  }
  FT.acts.bulkExpiry = () => bulk('expiry', 'expiry', D.liveMembers().filter((m) => D.memberStatus(m) === 'active' && D.daysLeft(m) >= 0 && D.daysLeft(m) <= D.db.settings.reminderDays));
  FT.acts.bulkPay = () => bulk('payment', 'payment', [...new Set(D.db.payments.filter((p) => D.paymentStatus(p) === 'overdue').map((p) => p.memberId))].map((id) => D.get('members', id)).filter(Boolean));

  // ====================== SETTINGS ======================
  const TZ = ['Asia/Karachi', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'UTC'];
  const CUR = ['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR', 'INR'];
  V.settings = () => {
    const st = S('set', { tab: 'gym' }), g = D.db.settings, ad = g.admin;
    const tabs = [['gym', 'Gym Information'], ['membership', 'Membership'], ['notify', 'Notifications'], ['profile', 'Admin Profile']];
    let form = '';
    if (st.tab === 'gym') form = '<form data-form="gym" novalidate><div class="form-grid">' + U.photoField('Gym logo (shown on invoices & sidebar)', 'logo', g.logo) + U.field('Gym name', 'gymName', { value: g.gymName, req: 1 }) + U.field('Phone', 'phone', { value: g.phone }) + U.field('Email', 'email', { value: g.email, type: 'email' }) + U.field('Currency', 'currency', { type: 'select', options: CUR.map((c) => '<option' + (g.currency === c ? ' selected' : '') + '>' + c + '</option>').join('') }) + U.field('Address', 'address', { value: g.address, full: 1 }) + U.field('Timezone', 'timezone', { type: 'select', options: TZ.map((c) => '<option' + (g.timezone === c ? ' selected' : '') + '>' + c + '</option>').join('') }) + '</div><button class="btn primary" type="submit">Save gym information</button></form>';
    else if (st.tab === 'membership') form = '<form data-form="membership" novalidate><div class="form-grid">' + U.field('Expiry reminder window (days)', 'reminderDays', { type: 'number', value: g.reminderDays, attrs: ' min="1" max="60"' }) + U.field('Grace period after expiry (days)', 'graceDays', { type: 'number', value: g.graceDays, attrs: ' min="0" max="30"' }) + U.field('Default invoice due (days)', 'invoiceDueDays', { type: 'number', value: g.invoiceDueDays, attrs: ' min="0" max="90"' }) + '</div><p class="muted">The grace period delays when a member is shown as expired. The reminder window controls expiry notifications and reminder drafts.</p><button class="btn primary" type="submit">Save membership settings</button></form>';
    else if (st.tab === 'notify') form = '<form data-form="notify" novalidate>' + [['expiring', 'Membership expiring'], ['expired', 'Membership expired'], ['overdue', 'Payment overdue'], ['booking', 'Upcoming trainer booking'], ['newMember', 'New member'], ['payment', 'Payment received']].map(([k, l]) => '<div class="field"><label class="check"><input type="checkbox" name="' + k + '"' + (g.notify[k] ? ' checked' : '') + '> ' + l + '</label></div>').join('') + '<button class="btn primary" type="submit">Save preferences</button></form>';
    else form = '<form data-form="profile" novalidate><div class="form-grid">' + U.photoField('Profile photo', 'photo', ad.photo) + U.field('Full name', 'name', { value: ad.name, req: 1 }) + U.field('Email (login)', 'email', { value: ad.email, type: 'email', req: 1 }) + U.field('Phone', 'phone', { value: ad.phone }) + U.field('New password', 'password', { type: 'password', placeholder: 'Leave blank to keep current', attrs: ' autocomplete="new-password"' }) + U.field('Confirm new password', 'password2', { type: 'password', attrs: ' autocomplete="new-password"' }) + '</div><button class="btn primary" type="submit">Update profile</button></form>';
    return '<div class="page-head"><div><h1>Settings</h1><p>Configure your gym, memberships and preferences.</p></div></div><div class="card"><div class="tabs">' + tabs.map(([k, l]) => '<button data-act="setTab" data-tab="' + k + '" class="' + (st.tab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div><div style="max-width:720px">' + form + '</div></div>' +
      '<div class="card" style="margin-top:18px"><div class="card-head"><h3>Demo data</h3></div><p class="muted" style="margin-top:0">All data is stored in this browser. Reset to restore the original demo data set.</p><button class="btn danger" data-act="resetDemo">Reset demo data</button></div>';
  };
  FT.acts.setTab = (d) => { S('set', {}).tab = d.tab; FT.render(); };
  FT.acts.resetDemo = () => U.confirm('Reset all data?', 'Every change you made will be replaced by the original demo data. This cannot be undone.', () => { D.reset(); FT.state = {}; U.toast('Demo data restored'); FT.render(); }, 'Reset');
  FT.forms = {
    gym: (v, f) => { if (!U.validate(f, v, { gymName: { req: 1 }, email: { email: 1 } })) return; const g = D.db.settings; Object.assign(g, { gymName: v.gymName.trim(), logo: v.logo, phone: v.phone.trim(), email: v.email.trim(), address: v.address.trim(), currency: v.currency, timezone: v.timezone }); D.save(); U.toast('Gym information saved'); FT.render(); },
    membership: (v, f) => { const g = D.db.settings; g.reminderDays = Math.max(1, parseInt(v.reminderDays, 10) || 7); g.graceDays = Math.max(0, parseInt(v.graceDays, 10) || 0); g.invoiceDueDays = Math.max(0, parseInt(v.invoiceDueDays, 10) || 0); D.save(); U.toast('Membership settings saved'); FT.render(); },
    notify: (v) => { const n = D.db.settings.notify; Object.keys(n).forEach((k) => { n[k] = v[k] === 'on'; }); D.save(); U.toast('Notification preferences saved'); FT.render(); },
    profile: (v, f) => {
      if (!U.validate(f, v, { name: { req: 1 }, email: { req: 1, email: 1 }, password: { custom: (x) => (x && x.length < 6 ? 'At least 6 characters' : '') }, password2: { custom: (x) => (x !== v.password ? 'Passwords do not match' : '') } })) return;
      const a = D.db.settings.admin; Object.assign(a, { name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim(), photo: v.photo }); if (v.password) a.password = v.password;
      D.save(); U.toast('Profile updated'); FT.render();
    },
  };
})();
