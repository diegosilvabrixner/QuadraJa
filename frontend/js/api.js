// frontend/js/api.js — QuadraJá
// Camada central de comunicação com o backend

(function () {

  // ── URL da API ─────────────────────────────────────────────
  // Sempre aponta para localhost:3001 em desenvolvimento.
  // Em produção (via Nginx) muda para /api.
  const isLocal = window.location.hostname === 'localhost'
               || window.location.hostname === '127.0.0.1'
               || /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)
               || window.location.protocol === 'file:';

  const API_URL = isLocal
    ? 'http://localhost:3001/api'   // ← ajuste o IP se precisar
    : '/api';

  // ── Token JWT ──────────────────────────────────────────────
  function getToken()   { return localStorage.getItem('qj_token'); }
  function setToken(t)  { localStorage.setItem('qj_token', t); }
  function clearToken() {
    ['qj_token','qj_user_nome','qj_user_email',
     'qj_user_id','qj_user_perfil','qj_arena_id'].forEach(k => localStorage.removeItem(k));
  }

  function getUser() {
    const t = getToken();
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) { clearToken(); return null; }
      return payload;
    } catch { return null; }
  }

  // ── Fetch principal ─────────────────────────────────────────
  async function apiFetch(path, options = {}) {
    const token = getToken();

    const config = {
      method:  options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    };

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }

    let res;
    try {
      res = await fetch(`${API_URL}${path}`, config);
    } catch (e) {
      throw new Error('Sem conexão com o servidor. Verifique se o backend está rodando na porta 3001.');
    }

    if (res.status === 401) {
      clearToken();
      const path = window.location.pathname;
      if (!path.includes('login') && !path.includes('cadastro')) {
        window.location.href = 'login.html';
      }
      return null;
    }

    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err  = new Error(data.error || `Erro ${res.status}`);
      err.status = res.status;
      err.data   = data;
      throw err;
    }

    return data;
  }

  // ── Atalhos ─────────────────────────────────────────────────
  const api = {
    get:    (path)       => apiFetch(path),
    post:   (path, body) => apiFetch(path, { method: 'POST',   body }),
    put:    (path, body) => apiFetch(path, { method: 'PUT',    body }),
    patch:  (path, body) => apiFetch(path, { method: 'PATCH',  body }),
    delete: (path)       => apiFetch(path, { method: 'DELETE' }),
  };

  // ── Guards ──────────────────────────────────────────────────
  function requireAuth(redirectTo = 'login.html') {
    const user = getUser();
    if (!user) { window.location.href = redirectTo; return null; }
    return user;
  }

  function requireAdmin(redirectTo = 'login.html') {
    const user = getUser();
    // usa `perfil` — campo salvo no JWT pelo backend
    if (!user || !['ADMIN_ARENA','SUPER_ADMIN'].includes(user.perfil)) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }

  // ── Toast ───────────────────────────────────────────────────
  function showToast(msg, type = '') {
    let el = document.getElementById('qj-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'qj-toast';
      el.style.cssText = [
        'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px)',
        'background:#151E2D;border:1px solid #1E2D42;border-radius:14px',
        'padding:12px 20px;color:#F0F4FF;font-size:14px;font-weight:600',
        'box-shadow:0 8px 32px rgba(0,0,0,.4);opacity:0;transition:all .3s',
        'z-index:9999;white-space:nowrap;max-width:90vw;font-family:Outfit,sans-serif',
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.borderColor = type === 'success' ? '#00E5A0'
                         : type === 'error'   ? '#FF6B6B'
                         : '#1E2D42';
    setTimeout(() => { el.style.opacity='1'; el.style.transform='translateX(-50%) translateY(0)'; }, 10);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(-50%) translateY(20px)'; }, 3400);
  }

  // ── Expõe globalmente ────────────────────────────────────────
  window.api          = api;
  window.getToken     = getToken;
  window.setToken     = setToken;
  window.clearToken   = clearToken;
  window.getUser      = getUser;
  window.requireAuth  = requireAuth;
  window.requireAdmin = requireAdmin;
  window.showToast    = showToast;
  window.API_URL      = API_URL;

  console.log('[QuadraJá] API URL:', API_URL);

})();
