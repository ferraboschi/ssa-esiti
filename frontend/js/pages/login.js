const loginPage = {
  render() {
    const html = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <span style="font-size: 48px;">&#127862;</span>
            <h1>SSA Esiti</h1>
            <p>Piattaforma di gestione esami</p>
          </div>

          <form id="loginForm">
            <div class="form-group">
              <label for="email">Username o Email</label>
              <input type="text" id="email" name="email" required placeholder="admin o email@esempio.com" autocomplete="username">
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Inserisci password" autocomplete="current-password">
            </div>

            <button type="submit" class="btn-primary btn-full" id="loginBtn">Accedi</button>
          </form>

          <div id="loginError" class="error-message" style="display: none;"></div>
        </div>
      </div>

      <style>
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #635BFF 0%, #4B45C6 100%);
        }
        .login-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 400px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header h1 {
          margin: 12px 0 8px 0;
          color: #1a1a2e;
          font-size: 28px;
        }
        .login-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          border-color: #635BFF;
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
        }
        .btn-primary {
          background: #635BFF;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #4B45C6; }
        .btn-primary:disabled { background: #aaa; cursor: not-allowed; }
        .btn-full { width: 100%; }
        .error-message {
          color: #d32f2f;
          margin-top: 15px;
          padding: 10px;
          background: #ffebee;
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
        }
      </style>
    `;

    document.getElementById('app').innerHTML = html;

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      loginPage.handleSubmit();
    });
  },

  async handleSubmit() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    if (!email) {
      errEl.textContent = 'Inserisci username o email';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Accesso in corso...';
    errEl.style.display = 'none';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login fallito');
      }

      app.setAuth(data.token, data.user);
    } catch (err) {
      errEl.textContent = err.message === 'Password required for professors'
        ? 'Password richiesta per gli amministratori'
        : err.message === 'Invalid credentials'
          ? 'Username o password non validi'
          : 'Errore di accesso. Riprova.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Accedi';
    }
  }
};
