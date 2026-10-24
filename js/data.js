/* FitTrack data layer: localStorage-backed store, derived statuses, demo seed. */
(function () {
  const KEY = 'fittrack_v1';
  const SESSION = 'fittrack_session';
  const DAY = 864e5;

  // ---------- date helpers ----------
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => { const x = new Date(d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
  const today = () => iso(new Date());
  const nowTime = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const parse = (s) => new Date(s + 'T00:00:00');
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const addMonths = (s, n) => { const d = parse(s); const day = d.getDate(); d.setMonth(d.getMonth() + n); if (d.getDate() !== day) d.setDate(0); return iso(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY);
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = (n) => pad(Math.floor(n / 60) % 24) + ':' + pad(n % 60);
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);

  // ---------- seeded rng so the demo data is stable in shape ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function seed() {
    const r = rng(20261024);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const rand = (a, b) => a + Math.floor(r() * (b - a + 1));
    const T = today();

    const plans = [
      { id: 'pl1', name: 'Monthly', price: 4500, months: 1, description: 'Flexible month-to-month access to the gym floor.', features: ['Full gym access', 'Locker room', 'Free fitness assessment'], active: true },
      { id: 'pl2', name: '3 Months', price: 12000, months: 3, description: 'Quarterly plan with a saving over monthly.', features: ['Full gym access', 'Group classes', '1 free PT session'], active: true },
      { id: 'pl3', name: '6 Months', price: 22000, months: 6, description: 'Half-year commitment with classes included.', features: ['Full gym access', 'Unlimited group classes', '3 free PT sessions', 'Diet plan'], active: true },
      { id: 'pl4', name: 'Yearly', price: 40000, months: 12, description: 'Best value. Everything included for a full year.', features: ['Full gym access', 'Unlimited group classes', '6 free PT sessions', 'Diet plan', 'Guest passes (4)'], active: true },
    ];

    const trainers = [
      { id: 'tr1', name: 'Hamza Qureshi', phone: '0300-4412870', email: 'hamza@fittrack.pk', specialization: 'Strength & Conditioning', experience: 8, availability: 'Mon–Sat, 06:00–14:00', status: 'active', photo: '' },
      { id: 'tr2', name: 'Ayesha Malik', phone: '0321-8870145', email: 'ayesha@fittrack.pk', specialization: 'Yoga & Pilates', experience: 6, availability: 'Mon–Fri, 07:00–15:00', status: 'active', photo: '' },
      { id: 'tr3', name: 'Bilal Ahmed', phone: '0333-2201934', email: 'bilal@fittrack.pk', specialization: 'HIIT & Cardio', experience: 5, availability: 'Mon–Sat, 14:00–22:00', status: 'active', photo: '' },
      { id: 'tr4', name: 'Sana Tariq', phone: '0345-6619027', email: 'sana@fittrack.pk', specialization: 'Personal Training & Nutrition', experience: 7, availability: 'Mon–Sat, 10:00–20:00', status: 'active', photo: '' },
    ];

    const names = [
      ['Ali Raza', 'M'], ['Fatima Noor', 'F'], ['Usman Sheikh', 'M'], ['Zainab Hussain', 'F'], ['Hassan Mahmood', 'M'],
      ['Maryam Siddiqui', 'F'], ['Ahmed Khan', 'M'], ['Hira Javed', 'F'], ['Bilal Chaudhry', 'M'], ['Sadia Anwar', 'F'],
      ['Imran Butt', 'M'], ['Amna Farooq', 'F'], ['Faisal Iqbal', 'M'], ['Rabia Aslam', 'F'], ['Talha Mirza', 'M'],
      ['Nimra Akhtar', 'F'], ['Daniyal Rauf', 'M'], ['Komal Shah', 'F'], ['Saad Latif', 'M'], ['Iqra Rehman', 'F'],
      ['Waqas Abbasi', 'M'], ['Mehwish Gul', 'F'], ['Haris Nadeem', 'M'], ['Laiba Zafar', 'F'], ['Owais Dar', 'M'],
    ];
    const areas = ['DHA Phase 5', 'Gulberg III', 'Johar Town', 'Model Town', 'Bahria Town', 'Wapda Town', 'Iqbal Town', 'Cantt'];
    // expiry offsets (days from today). Mix of expiring soon, expired and healthy.
    const expiryOffsets = [1, 2, 5, 6, 12, 20, 28, -3, -10, -18, 45, 60, 90, 120, 150, 200, 260, 330, 40, 75, 18, 9, 55, 0, 100];
    const planByOffset = (i) => plans[[0, 1, 2, 3, 0, 1, 0, 2, 0, 1, 3, 2, 1, 3, 0, 2, 3, 3, 1, 0, 2, 0, 3, 0, 2][i]];
    const methods = ['cash', 'bank_transfer', 'card', 'cash', 'bank_transfer'];

    const members = [];
    const payments = [];
    const invoices = [];
    let invCount = 0;
    const addInvoice = (p) => {
      invCount++;
      const inv = { id: uid('inv'), no: 'INV-' + p.date.slice(0, 4) + '-' + String(invCount).padStart(4, '0'), paymentId: p.id, memberId: p.memberId, planId: p.planId, amount: p.amount, issueDate: p.date, dueDate: p.dueDate };
      p.invoiceId = inv.id; invoices.push(inv); return inv;
    };

    names.forEach(([name, g], i) => {
      const plan = planByOffset(i);
      const expiry = addDays(T, expiryOffsets[i]);
      let start = addMonths(expiry, -plan.months);
      let status = 'active';
      if (i === 3 || i === 15) status = 'suspended';
      if (i === 22 || i === 24) { status = 'pending'; start = T; }
      const exp = status === 'pending' ? addMonths(start, plan.months) : expiry;
      const join = status === 'pending' ? addDays(T, -rand(0, 2)) : addDays(start, -rand(0, i < 10 ? 120 : 40));
      const first = name.split(' ')[0].toLowerCase();
      members.push({
        id: 'm' + (i + 1), code: 'FT-' + String(i + 1).padStart(4, '0'), name, gender: g,
        phone: '03' + pick(['00', '01', '12', '21', '33', '45', '46']) + '-' + String(rand(1000000, 9999999)),
        email: first + (i + 11) + '@gmail.com',
        dob: (1980 + rand(0, 25)) + '-' + pad(rand(1, 12)) + '-' + pad(rand(1, 28)),
        emergency: pick(['Father', 'Brother', 'Spouse', 'Mother', 'Sister']) + ' – 03' + rand(0, 4) + rand(0, 9) + '-' + rand(1000000, 9999999),
        address: 'House ' + rand(1, 220) + ', ' + pick(areas) + ', Lahore',
        joinDate: join, planId: plan.id, startDate: start, expiryDate: exp,
        trainerId: pick(['tr1', 'tr2', 'tr3', 'tr4', '']), status, notes: pick(['', '', 'Prefers morning sessions.', 'Training for weight loss.', 'Mild lower-back sensitivity — avoid heavy deadlifts.', 'Wants muscle-gain program.']),
        photo: '', archived: false, noteList: [], measurements: [],
      });
      if (status !== 'pending') {
        const p = { id: uid('pay'), memberId: 'm' + (i + 1), planId: plan.id, amount: plan.price, method: methods[i % 5], ref: methods[i % 5] === 'cash' ? '' : 'TXN' + rand(100000, 999999), date: start, dueDate: start, status: 'paid', notes: 'Membership payment', invoiceId: '' };
        payments.push(p); addInvoice(p);
      }
    });

    // measurements and notes for a few members
    members.slice(0, 8).forEach((m, i) => {
      const w = 60 + rand(0, 30);
      for (let k = 3; k >= 0; k--) m.measurements.push({ id: uid('ms'), date: addDays(T, -k * 30), weight: +(w - (3 - k) * 0.8).toFixed(1), height: 160 + rand(0, 25), chest: 92 + rand(0, 8), waist: 80 - (3 - k), hips: 94 + rand(0, 6), bodyFat: +(24 - (3 - k) * 0.7).toFixed(1) });
      m.noteList.push({ id: uid('n'), date: addDays(T, -rand(5, 40)), text: 'Initial assessment done. Goals discussed with trainer.' });
    });

    // extra payments: pending, overdue, refunded
    const extra = [
      { m: 'm1', status: 'pending', due: addDays(T, 3), note: 'Personal training package' },
      { m: 'm5', status: 'pending', due: addDays(T, 6), note: 'Locker rental' },
      { m: 'm8', status: 'pending', due: addDays(T, -6), note: 'Membership renewal' },
      { m: 'm9', status: 'pending', due: addDays(T, -12), note: 'Membership renewal' },
      { m: 'm10', status: 'pending', due: addDays(T, -4), note: 'Membership renewal' },
      { m: 'm13', status: 'refunded', due: addDays(T, -20), note: 'Refund – plan downgrade' },
    ];
    extra.forEach((e) => {
      const mem = members.find((x) => x.id === e.m); const plan = plans.find((p) => p.id === mem.planId);
      const issue = addDays(e.due, -7);
      const p = { id: uid('pay'), memberId: mem.id, planId: plan.id, amount: e.status === 'pending' ? plan.price : Math.round(plan.price / 2), method: 'bank_transfer', ref: e.status === 'refunded' ? 'RFD' + rand(1000, 9999) : '', date: issue, dueDate: e.due, status: e.status, notes: e.note, invoiceId: '' };
      payments.push(p); addInvoice(p);
    });

    // some historic paid payments across past months so revenue charts have shape
    for (let k = 0; k <= 11; k++) {
      const n = k === 0 ? 7 : rand(5, 9);
      for (let j = 0; j < n; j++) {
        const mem = pick(members); const plan = k === 0 ? plans[1 + rand(0, 3) % 3] : pick(plans);
        const d = k === 0 ? addDays(T, -rand(0, new Date().getDate() - 1)) : addDays(T, -k * 30 - rand(0, 25));
        const p = { id: uid('pay'), memberId: mem.id, planId: plan.id, amount: plan.price, method: pick(['cash', 'bank_transfer', 'card']), ref: 'TXN' + rand(100000, 999999), date: d, dueDate: d, status: 'paid', notes: 'Membership payment', invoiceId: '' };
        payments.push(p); addInvoice(p);
      }
    }
    // fix invoice numbering to be chronological
    invoices.sort((a, b) => a.issueDate.localeCompare(b.issueDate));
    invoices.forEach((inv, i) => { inv.no = 'INV-' + inv.issueDate.slice(0, 4) + '-' + String(i + 1).padStart(4, '0'); });

    // attendance
    const attendance = [];
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    members.forEach((m) => {
      if (m.status !== 'active') return;
      const freq = 0.25 + r() * 0.45;
      const habit = rand(6, 20) * 60;
      for (let d = 40; d >= 0; d--) {
        const date = addDays(T, -d);
        if (date < m.startDate || date > m.expiryDate) continue;
        if (r() > (d === 0 ? 0.75 : freq)) continue;
        let ci = Math.max(5 * 60, Math.min(21 * 60, habit + rand(-60, 60)));
        if (d === 0) { const latest = nowMin - 20; if (latest < 5 * 60 + 30) continue; ci = rand(5 * 60, latest); }
        const dur = rand(45, 110);
        const inside = d === 0 && ci + dur > nowMin;
        attendance.push({ id: uid('at'), memberId: m.id, date, checkIn: fromMin(ci), checkOut: inside ? null : fromMin(ci + dur) });
      }
    });

    // bookings
    const sessions = ['Personal Training', 'Strength Training', 'Yoga', 'Cardio', 'HIIT', 'Other'];
    const trainerSession = { tr1: ['Strength Training', 'Personal Training'], tr2: ['Yoga', 'Other'], tr3: ['HIIT', 'Cardio'], tr4: ['Personal Training', 'Strength Training'] };
    const bookings = [];
    const activeMembers = members.filter((m) => m.status === 'active');
    const clash = (b) => bookings.some((o) => o.trainerId === b.trainerId && o.date === b.date && o.status !== 'cancelled' && toMin(o.start) < toMin(b.start) + b.duration && toMin(b.start) < toMin(o.start) + o.duration);
    for (let d = -10; d <= 8; d++) {
      const date = addDays(T, d);
      const count = d === 0 ? 7 : rand(2, 4);
      for (let k = 0; k < count; k++) {
        const tr = pick(trainers);
        const b = { id: uid('bk'), memberId: pick(activeMembers).id, trainerId: tr.id, session: pick(trainerSession[tr.id]), date, start: fromMin(rand(7, 20) * 60 + pick([0, 30])), duration: pick([45, 60, 60, 90]), notes: '', status: 'confirmed' };
        if (clash(b)) continue;
        if (d < 0) b.status = r() < 0.7 ? 'completed' : r() < 0.5 ? 'no_show' : 'cancelled';
        if (d === 0 && toMin(b.start) + b.duration < nowMin) b.status = 'completed';
        bookings.push(b);
      }
    }

    const messages = [
      { id: uid('msg'), type: 'expiry', memberId: 'm1', body: 'Assalam o Alaikum Ali, your FitTrack membership expires soon. Renew today to keep your streak going!', status: 'sent', channel: 'in-app', createdAt: new Date(Date.now() - 2 * DAY).toISOString() },
      { id: uid('msg'), type: 'payment', memberId: 'm8', body: 'Hi Hira, a gentle reminder that your payment is overdue. Please clear it at the front desk or via bank transfer.', status: 'sent', channel: 'in-app', createdAt: new Date(Date.now() - 1 * DAY).toISOString() },
    ];

    return {
      version: 1,
      settings: {
        gymName: 'FitTrack Fitness Club', logo: '', phone: '042-35761200', email: 'info@fittrack.pk', address: '12-B, Main Boulevard, Gulberg III, Lahore', currency: 'PKR', timezone: 'Asia/Karachi',
        reminderDays: 7, graceDays: 0, invoiceDueDays: 7,
        notify: { expiring: true, expired: true, overdue: true, booking: true, newMember: true, payment: true },
        admin: { name: 'Usman Raza', email: 'admin@fittrack.pk', phone: '0300-1234567', password: 'admin123', photo: '' },
      },
      plans, trainers, members, attendance, bookings, payments, invoices, messages, notifRead: {},
    };
  }

  // ---------- store ----------
  let db;
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { db = JSON.parse(raw); return; } } catch (e) { /* fall through */ }
    db = seed(); save();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('Could not save data', e); } }
  function reset() { db = seed(); save(); }

  // ---------- derived data ----------
  const D = {
    get db() { return db; },
    load, save, reset, iso, today, nowTime, addDays, addMonths, diffDays, toMin, fromMin, uid, parse,
    SESSION,
    get(coll, id) { return db[coll].find((x) => x.id === id); },
    memberStatus(m) {
      if (m.archived) return 'archived';
      if (m.status === 'suspended' || m.status === 'pending') return m.status;
      return D.addDays(m.expiryDate, db.settings.graceDays || 0) < today() ? 'expired' : 'active';
    },
    daysLeft(m) { return diffDays(m.expiryDate, today()); },
    paymentStatus(p) { return p.status === 'pending' && p.dueDate < today() ? 'overdue' : p.status; },
    liveMembers() { return db.members.filter((m) => !m.archived); },
    nextMemberCode() { const n = db.members.reduce((a, m) => Math.max(a, parseInt(m.code.slice(3), 10) || 0), 0) + 1; return 'FT-' + String(n).padStart(4, '0'); },
    createInvoice(p) {
      const year = p.date.slice(0, 4);
      const n = db.invoices.filter((i) => i.no.startsWith('INV-' + year)).length + 1;
      const inv = { id: uid('inv'), no: 'INV-' + year + '-' + String(n).padStart(4, '0'), paymentId: p.id, memberId: p.memberId, planId: p.planId, amount: p.amount, issueDate: p.date, dueDate: p.dueDate || p.date };
      p.invoiceId = inv.id; db.invoices.push(inv); return inv;
    },
    addPayment(data) {
      const p = Object.assign({ id: uid('pay'), ref: '', notes: '', invoiceId: '' }, data);
      p.dueDate = p.dueDate || p.date;
      db.payments.push(p); D.createInvoice(p); return p;
    },
    renew(memberId, planId, method) {
      const m = D.get('members', memberId), plan = D.get('plans', planId);
      const base = m.expiryDate > today() ? m.expiryDate : today();
      m.planId = plan.id; m.startDate = base; m.expiryDate = D.addMonths(base, plan.months);
      if (m.status !== 'suspended') m.status = 'active';
      return D.addPayment({ memberId, planId, amount: plan.price, method, ref: method === 'cash' ? '' : 'TXN' + Math.floor(100000 + Math.random() * 899999), date: today(), status: 'paid', notes: 'Membership renewal' });
    },
    bookingClash(b, ignoreId) {
      return db.bookings.find((o) => o.id !== ignoreId && o.trainerId === b.trainerId && o.date === b.date && o.status !== 'cancelled' && toMin(o.start) < toMin(b.start) + Number(b.duration) && toMin(b.start) < toMin(o.start) + Number(o.duration));
    },
    notifications() {
      const s = db.settings, n = s.notify, T = today(), out = [];
      const mem = (id) => D.get('members', id);
      D.liveMembers().forEach((m) => {
        const st = D.memberStatus(m), dl = D.daysLeft(m);
        if (n.expiring && st === 'active' && dl >= 0 && dl <= s.reminderDays) out.push({ id: 'exp-' + m.id + m.expiryDate, kind: 'expiring', text: m.name + "'s membership expires " + (dl === 0 ? 'today' : 'in ' + dl + ' day' + (dl > 1 ? 's' : '')), link: '#/members/' + m.id, sort: 90 - dl });
        if (n.expired && st === 'expired' && -dl <= 14) out.push({ id: 'xpd-' + m.id + m.expiryDate, kind: 'expired', text: m.name + "'s membership expired " + (-dl) + ' day' + (-dl === 1 ? '' : 's') + ' ago', link: '#/members/' + m.id, sort: 80 });
        if (n.newMember && diffDays(T, m.joinDate) <= 7) out.push({ id: 'new-' + m.id, kind: 'new', text: 'New member joined: ' + m.name, link: '#/members/' + m.id, sort: 30 });
      });
      db.payments.forEach((p) => {
        const m = mem(p.memberId); if (!m) return;
        const st = D.paymentStatus(p);
        if (n.overdue && st === 'overdue') out.push({ id: 'ovd-' + p.id, kind: 'overdue', text: 'Payment overdue: ' + m.name + ' (' + diffDays(T, p.dueDate) + ' days)', link: '#/payments', sort: 85 });
        if (n.payment && st === 'paid' && diffDays(T, p.date) <= 3 && diffDays(T, p.date) >= 0) out.push({ id: 'pay-' + p.id, kind: 'payment', text: 'Payment received from ' + m.name, link: '#/payments', sort: 40 });
      });
      if (n.booking) db.bookings.forEach((b) => {
        if (b.status !== 'confirmed') return;
        const m = mem(b.memberId), t = D.get('trainers', b.trainerId); if (!m || !t) return;
        const minsAway = (diffDays(b.date, T)) * 1440 + toMin(b.start) - toMin(nowTime());
        if (minsAway >= 0 && minsAway <= 1440) out.push({ id: 'bk-' + b.id, kind: 'booking', text: b.session + ' with ' + t.name + ' at ' + b.start + ' (' + m.name + ')', link: '#/bookings', sort: 70 });
      });
      return out.sort((a, b) => b.sort - a.sort).slice(0, 40).map((x) => Object.assign(x, { unread: !db.notifRead[x.id] }));
    },
  };
  window.FT = window.FT || {};
  window.FT.D = D;
  load();
})();
