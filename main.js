document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const dashboard = document.getElementById('dashboard');
  const passwordInput = document.getElementById('password-input');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const dealsContainer = document.getElementById('deals-container');

  // Simple Auth Logic (Password: nomad2026)
  const REQUIRED_PASS = 'nomad2026';

  const checkAuth = () => {
    if (localStorage.getItem('nomad_auth') === 'true') {
      showDashboard();
    }
  };

  const showDashboard = () => {
    loginScreen.style.opacity = '0';
    setTimeout(() => {
      loginScreen.style.visibility = 'hidden';
      dashboard.style.display = 'block';
      setTimeout(() => {
        dashboard.style.opacity = '1';
        renderDeals();
      }, 50);
    }, 500);
  };

  const handleLogin = () => {
    if (passwordInput.value === REQUIRED_PASS) {
      localStorage.setItem('nomad_auth', 'true');
      showDashboard();
    } else {
      loginError.style.display = 'block';
      passwordInput.classList.add('shake');
      setTimeout(() => passwordInput.classList.remove('shake'), 500);
    }
  };

  loginBtn.addEventListener('click', handleLogin);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('nomad_auth');
    location.reload();
  });

  const renderDeals = () => {
    dealsContainer.innerHTML = mockDeals.map(deal => `
      <div class="deal-card glass">
        <img src="${deal.image}" alt="${deal.destination}" class="deal-image">
        <div class="deal-content">
          <div class="deal-header">
            <h3>${deal.destination}</h3>
            <div style="display: flex; gap: 5px;">
              ${deal.tags.map(tag => `<span class="tag ${tag.toLowerCase().includes('hot') ? 'hot' : 'smart'}">${tag}</span>`).join('')}
            </div>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">From ${deal.origin}</p>
          <div style="margin-bottom: 1rem;">
            <p style="font-weight: 600;">${deal.hotel}</p>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">★ ${deal.rating} (${deal.reviews} reviews)</p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="text-decoration: line-through; color: var(--text-secondary); font-size: 0.8rem;">$${deal.originalPrice}</p>
              <p style="font-size: 1.5rem; font-weight: 700; color: var(--success);">$${deal.price}</p>
            </div>
            <div style="text-align: right;">
              <p style="color: var(--accent-color); font-weight: 600;">Save ${deal.savings}</p>
              <p style="font-size: 0.75rem; color: var(--text-secondary);">${deal.seasonality}</p>
            </div>
          </div>
          <div class="price-predict">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 7L13.5 15.5L8.5 10.5L2 17"></path><polyline points="16 7 22 7 22 13"></polyline></svg>
            <span>AI Predict: ${deal.prediction}</span>
          </div>
        </div>
      </div>
    `).join('');
  };

  checkAuth();
});
