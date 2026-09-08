/* Dark Bot AI — Supabase Auth helper for the affiliate portal. */
(function () {
  'use strict';

  var state = { client: null };

  function config() {
    var c = window.DARK_BOT_SUPABASE || {};
    if (!c.url || !c.anonKey || c.url.indexOf('YOUR-PROJECT-REF') !== -1 || c.anonKey.indexOf('YOUR_') !== -1) {
      throw new Error('Supabase public configuration is not set. Edit config/supabase-config.js.');
    }
    return c;
  }

  function getClient() {
    if (state.client) return state.client;
    var c = config();
    if (!window.supabase || !window.supabase.createClient) throw new Error('Supabase client library failed to load.');
    state.client = window.supabase.createClient(c.url, c.anonKey);
    return state.client;
  }

  function setMessage(id, text, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'portal-message' + (type ? ' ' + type : '');
  }

  function baseRedirect(path) {
    return new URL(path, window.location.href).toString();
  }

  async function initLoginPage(opts) {
    try {
      var sb = getClient();
      var sessionResult = await sb.auth.getSession();
      if (sessionResult.data && sessionResult.data.session) {
        window.location.href = opts.redirectPath;
        return;
      }

      document.getElementById(opts.formId).addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage(opts.messageId, 'Signing in…');
        var email = document.getElementById(opts.emailId).value.trim();
        var password = document.getElementById(opts.passwordId).value;
        if (!email || !password) {
          setMessage(opts.messageId, 'Enter your email and password.', 'error');
          return;
        }

        var result = await sb.auth.signInWithPassword({ email: email, password: password });
        if (result.error) {
          setMessage(opts.messageId, result.error.message, 'error');
          return;
        }
        window.location.href = opts.redirectPath;
      });

      document.getElementById(opts.resetButtonId).addEventListener('click', async function () {
        var email = document.getElementById(opts.emailId).value.trim();
        if (!email) {
          setMessage(opts.messageId, 'Enter your affiliate email first.', 'error');
          return;
        }
        setMessage(opts.messageId, 'Sending password setup/reset email…');
        var result = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: baseRedirect('affiliate-reset-password.html')
        });
        if (result.error) {
          setMessage(opts.messageId, result.error.message, 'error');
          return;
        }
        setMessage(opts.messageId, 'Check your email for the password setup/reset link.', 'ok');
      });
    } catch (error) {
      setMessage(opts.messageId, error.message || 'Unable to initialize login.', 'error');
    }
  }

  async function initResetPage(opts) {
    try {
      var sb = getClient();
      var sessionResult = await sb.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (!session) {
        setMessage(opts.messageId, 'This password link is missing or has expired. Start a new password reset from the affiliate login page.', 'error');
        return;
      }

      document.getElementById(opts.formId).addEventListener('submit', async function (event) {
        event.preventDefault();
        var password = document.getElementById(opts.passwordId).value;
        var confirm = document.getElementById(opts.confirmPasswordId).value;
        if (password.length < 8) {
          setMessage(opts.messageId, 'Password must be at least 8 characters.', 'error');
          return;
        }
        if (password !== confirm) {
          setMessage(opts.messageId, 'Passwords do not match.', 'error');
          return;
        }
        var result = await sb.auth.updateUser({ password: password });
        if (result.error) {
          setMessage(opts.messageId, result.error.message, 'error');
          return;
        }
        setMessage(opts.messageId, 'Password saved. Redirecting to your dashboard…', 'ok');
        setTimeout(function () { window.location.href = opts.redirectPath; }, 700);
      });
    } catch (error) {
      setMessage(opts.messageId, error.message || 'Unable to initialize password setup.', 'error');
    }
  }



  async function initRoleLoginPage(opts) {
    try {
      var sb = getClient();
      var sessionResult = await sb.auth.getSession();
      var existing = sessionResult.data && sessionResult.data.session;
      if (existing) {
        var pr = await sb.from('profiles').select('role').eq('id', existing.user.id).maybeSingle();
        if (!pr.error && pr.data && pr.data.role === opts.role) {
          window.location.href = opts.redirectPath;
          return;
        }
      }
      document.getElementById(opts.formId).addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage(opts.messageId, 'Signing in…');
        var email = document.getElementById(opts.emailId).value.trim();
        var password = document.getElementById(opts.passwordId).value;
        if (!email || !password) { setMessage(opts.messageId, 'Enter your email and password.', 'error'); return; }
        var result = await sb.auth.signInWithPassword({ email: email, password: password });
        if (result.error) { setMessage(opts.messageId, result.error.message, 'error'); return; }
        var pr = await sb.from('profiles').select('role').eq('id', result.data.user.id).maybeSingle();
        if (pr.error || !pr.data || pr.data.role !== opts.role) {
          await sb.auth.signOut();
          setMessage(opts.messageId, 'This account is not authorized for the admin portal.', 'error');
          return;
        }
        window.location.href = opts.redirectPath;
      });
      document.getElementById(opts.resetButtonId).addEventListener('click', async function () {
        var email = document.getElementById(opts.emailId).value.trim();
        if (!email) { setMessage(opts.messageId, 'Enter your email first.', 'error'); return; }
        setMessage(opts.messageId, 'Sending password reset email…');
        var result = await sb.auth.resetPasswordForEmail(email, { redirectTo: baseRedirect('affiliate-reset-password.html') });
        if (result.error) { setMessage(opts.messageId, result.error.message, 'error'); return; }
        setMessage(opts.messageId, 'Check your email for the password reset link.', 'ok');
      });
    } catch (error) { setMessage(opts.messageId, error.message || 'Unable to initialize login.', 'error'); }
  }

  window.DarkBotAffiliateAuth = {
    getClient: getClient,
    initLoginPage: initLoginPage,
    initResetPage: initResetPage,
    initRoleLoginPage: initRoleLoginPage
  };
})();
