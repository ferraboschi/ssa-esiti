const loginPage = {
  render() {
    const html = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h1>SSA Esiti</h1>
            <p>Piattaforma di gestione esami</p>
          </div>

          <form id="loginForm" onsubmit="loginPage.handleSubmit(event)">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="name@example.com">
            </div>

            <div class="form-group" id="passwordGroup" style="display: none;">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Enter password">
            </div>

            <button type="submit" class="btn-primary btn-full">Accedi</button>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-card {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header h1 {
          margin: 0 0 8px 0;
          color: #333;
        }
        .login-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        .login-form .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .btn-primary {
          background: #667eea;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-primary:hover {
          background: #5568d3;
        }
        .btn-full {
          width: 100%;
        }
        .error-message {
          color: #d32f2f;
          margin-top: 15px;
          padding: 10px;
          background: #ffebee;
          border-radius: 4px;
          font-size: 14px;
        }
      </style>
    `;

    document.getElementById('app').innerHTML = html;

    const emailInput = document.getElementById('email');
    const passwordGroup = document.getElementById('passwordGroup');

    emailInput.addEventListener('blur', () => {
      passwordGroup.style.display = emailInput.value ? 'block' : 'none';
    });
  },

  async handleSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(app.api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Login failed');
      const { token, user } = await res.json();
      app.setAuth(token, user);
      window.location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('loginError').textContent = 'Email o password non validi';
      document.getElementById('loginError').style.display = 'block';
    }
  }
};
