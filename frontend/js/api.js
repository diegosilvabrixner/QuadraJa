// frontend/js/api.js
// Camada central de comunicação com o backend
// Incluir em TODAS as páginas: <script src="../js/api.js"></script>

(function () {
  // ── Detecta URL da API automaticamente ──────────────────────
  const host = window.location.hostname;
  const API_URL = (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host))
    ? `http://${host}:3001/api`
    : '/api'; // produção via Nginx

  // ── Token JWT ──────────────────────────────────────────────
  function getToken()   { return localStorage.getItem('qj_token'); }
  function setToken(t)  { localStorage.setItem('qj_token', t); }
  function clearToken() {
    localStorage.removeItem('qj_token');
    localStorage.removeItem('qj_user_name');
    localStorage.removeItem('qj_user_email');
    localStorage.removeItem('qj_arena_id');
  }

  function getUser() {
    const t = getToken();
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      // Verifica expiração
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearToken();
        return null;
      }
      return payload;
    } catch { return null; }
  }

  // ── Fetch com JWT automático ────────────────────────────────
  async function apiFetch(path, options = {}) {
    const token = getToken();

    const config = {
      method: options.method || 'GET',
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
    } catch (networkErr) {
      throw new Error('Sem conexão com o servidor. Verifique sua internet.');
    }

    // Token expirado ou inválido
    if (res.status === 401) {
      clearToken();
      if (!window.location.pathname.includes('login') && !window.location.pathname.includes('cadastro')) {
        window.location.href = 'login.html';
      }
      return null;
    }

    // Sem conteúdo (DELETE, etc.)
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err    = new Error(data.error || `Erro ${res.status}`);
      err.status   = res.status;
      err.data     = data;
      throw err;
    }

    return data;
  }

  // ── Atalhos ─────────────────────────────────────────────────
  const api = {
    get:    (path)          => apiFetch(path),
    post:   (path, body)    => apiFetch(path, { method: 'POST',   body }),
    put:    (path, body)    => apiFetch(path, { method: 'PUT',    body }),
    patch:  (path, body)    => apiFetch(path, { method: 'PATCH',  body }),
    delete: (path)          => apiFetch(path, { method: 'DELETE' }),
  };

  // ── Guard de autenticação (chamar no início de páginas protegidas)
  function requireAuth(redirectTo = 'login.html') {
    const user = getUser();
    if (!user) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }

  // ── Guard admin ──────────────────────────────────────────────
  function requireAdmin(redirectTo = 'login.html') {
    const user = getUser();
    if (!user || !['ARENA_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  }

  // ── Toast global ─────────────────────────────────────────────
  function showToast(msg, type = '') {
    let toast = document.getElementById('qj-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'qj-toast';
      toast.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(20px);
        background:var(--card,#151E2D); border:1px solid var(--border,#1E2D42);
        border-radius:14px; padding:12px 20px; color:var(--text,#F0F4FF);
        font-size:14px; font-weight:600; box-shadow:0 8px 32px rgba(0,0,0,0.4);
        opacity:0; transition:all 0.3s; z-index:9999; white-space:nowrap;
        max-width:90vw; font-family:'Outfit',sans-serif;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    if (type === 'success') toast.style.borderColor = 'var(--accent,#00E5A0)';
    else if (type === 'error') toast.style.borderColor = 'var(--red,#FF6B6B)';
    else toast.style.borderColor = 'var(--border,#1E2D42)';

    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(20px)'; }, 3200);
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

})();
