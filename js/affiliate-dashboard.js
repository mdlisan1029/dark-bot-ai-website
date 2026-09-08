/* Dark Bot AI — Affiliate Dashboard */
(function () {
  'use strict';

  function money(value) {
    var n = Number(value || 0);
    return '$' + n.toFixed(2);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setMessage(text, type) {
    var el = document.getElementById('dashboard-message');
    el.textContent = text || '';
    el.className = 'portal-message' + (type ? ' ' + type : '');
  }

  function paymentPill(status) {
    if (status === 'received') return '<span class="status-pill good">Received</span>';
    if (status === 'refunded' || status === 'failed') return '<span class="status-pill bad">' + escapeHtml(status) + '</span>';
    return '<span class="status-pill warn">Pending</span>';
  }

  function genericPill(status) {
    var good = ['active', 'paid', 'approved', 'completed'];
    var bad = ['refunded', 'cancelled', 'suspended'];
    var cls = good.indexOf(status) >= 0 ? 'good' : (bad.indexOf(status) >= 0 ? 'bad' : 'warn');
    return '<span class="status-pill ' + cls + '">' + escapeHtml(String(status || '').replace(/_/g, ' ')) + '</span>';
  }

  async function run() {
    try {
      var auth = window.DarkBotAffiliateAuth;
      var sb = auth.getClient();
      var sessionResult = await sb.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (!session) {
        window.location.href = 'affiliate-login.html';
        return;
      }

      document.getElementById('logout-btn').addEventListener('click', async function () {
        await sb.auth.signOut();
        window.location.href = 'affiliate-login.html';
      });

      var profileResult = await sb.from('profiles').select('full_name,role').eq('id', session.user.id).maybeSingle();
      if (profileResult.error) throw profileResult.error;
      if (!profileResult.data || profileResult.data.role !== 'affiliate') {
        throw new Error('This account is not configured as an affiliate account.');
      }

      var affiliateResult = await sb.from('affiliates')
        .select('id,affiliate_code,name,brand_name,email,commission_rate,status')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (affiliateResult.error) throw affiliateResult.error;
      var affiliate = affiliateResult.data;
      if (!affiliate) throw new Error('Affiliate profile not found. Ask the Dark Bot AI admin to finish account setup.');

      document.getElementById('affiliate-identity').textContent =
        affiliate.name + (affiliate.brand_name ? ' · ' + affiliate.brand_name : '') + ' · ' + affiliate.email;
      var baseUrl = window.location.origin;
      var referral = baseUrl + '/?ref=' + encodeURIComponent(affiliate.affiliate_code);
      document.getElementById('referral-link').textContent = referral;
      document.getElementById('affiliate-status').textContent = affiliate.status;
      document.getElementById('affiliate-status').className = 'status-pill ' + (affiliate.status === 'active' ? 'good' : 'warn');
      document.getElementById('affiliate-details').textContent =
        'Affiliate code: ' + affiliate.affiliate_code + ' · Commission rate: ' + Number(affiliate.commission_rate || 0).toFixed(2) + '%';

      document.getElementById('copy-link-btn').addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(referral);
          this.textContent = 'Copied';
          setTimeout(function () { document.getElementById('copy-link-btn').textContent = 'Copy'; }, 1200);
        } catch (_) {
          setMessage('Copy failed. Long-press the referral link and copy it manually.', 'error');
        }
      });

      var visitsQ = await sb.from('referral_events').select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliate.id).eq('event_type', 'visit');
      var telegramQ = await sb.from('referral_events').select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliate.id).eq('event_type', 'telegram_click');
      var customersQ = await sb.from('customers')
        .select('id,customer_code,telegram_username,plan_name,payment_status,status,revenue,created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });
      var commissionQ = await sb.from('commissions')
        .select('commission_amount,status')
        .eq('affiliate_id', affiliate.id);

      if (visitsQ.error) throw visitsQ.error;
      if (telegramQ.error) throw telegramQ.error;
      if (customersQ.error) throw customersQ.error;
      if (commissionQ.error) throw commissionQ.error;

      var customers = customersQ.data || [];
      var commissions = commissionQ.data || [];
      var paidCustomers = customers.filter(function (c) { return c.payment_status === 'received'; });
      var revenue = paidCustomers.reduce(function (sum, c) { return sum + Number(c.revenue || 0); }, 0);
      var earned = commissions.filter(function (c) { return c.status !== 'cancelled'; }).reduce(function (sum, c) { return sum + Number(c.commission_amount || 0); }, 0);
      var pending = commissions.filter(function (c) { return c.status === 'pending' || c.status === 'approved'; }).reduce(function (sum, c) { return sum + Number(c.commission_amount || 0); }, 0);
      var paidCommission = commissions.filter(function (c) { return c.status === 'paid'; }).reduce(function (sum, c) { return sum + Number(c.commission_amount || 0); }, 0);
      var visits = Number(visitsQ.count || 0);
      var conversion = visits ? ((paidCustomers.length / visits) * 100) : 0;

      document.getElementById('stat-visits').textContent = String(visits);
      document.getElementById('stat-telegram').textContent = String(Number(telegramQ.count || 0));
      document.getElementById('stat-paid').textContent = String(paidCustomers.length);
      document.getElementById('stat-revenue').textContent = money(revenue);
      document.getElementById('stat-earned').textContent = money(earned);
      document.getElementById('stat-pending').textContent = money(pending);
      document.getElementById('stat-paid-commission').textContent = money(paidCommission);
      document.getElementById('stat-conversion').textContent = conversion.toFixed(1) + '%';
      document.getElementById('customer-count').textContent = customers.length + ' customers';

      var body = document.getElementById('customers-body');
      if (!customers.length) {
        body.innerHTML = '<tr><td colspan="6">No attributed customers yet.</td></tr>';
      } else {
        body.innerHTML = customers.map(function (c) {
          return '<tr>' +
            '<td><strong>' + escapeHtml(c.customer_code) + '</strong></td>' +
            '<td>' + escapeHtml(c.telegram_username || '—') + '</td>' +
            '<td>' + escapeHtml(c.plan_name || '—') + '</td>' +
            '<td>' + paymentPill(c.payment_status) + '</td>' +
            '<td>' + genericPill(c.status) + '</td>' +
            '<td>' + money(c.revenue) + '</td>' +
            '</tr>';
        }).join('');
      }
      setMessage('Dashboard loaded.', 'ok');
    } catch (error) {
      setMessage(error.message || 'Unable to load affiliate dashboard.', 'error');
    }
  }

  run();
})();
