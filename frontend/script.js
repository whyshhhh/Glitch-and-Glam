/**
 * StyleSense – Frontend JavaScript
 * Handles authentication, API calls, and UI state management
 */

// ── Configuration ────────────────────────────────────────────────
const API_BASE = '';  // Same origin since FastAPI serves the frontend

// ── Utility Helpers ──────────────────────────────────────────────

/** Get stored auth token */
function getToken() {
  return localStorage.getItem('stylesense_token');
}

/** Store auth token and user info */
function setAuth(token, user) {
  localStorage.setItem('stylesense_token', token);
  localStorage.setItem('stylesense_user', JSON.stringify(user));
}

/** Clear auth data */
function clearAuth() {
  localStorage.removeItem('stylesense_token');
  localStorage.removeItem('stylesense_user');
}

/** Get stored user object */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('stylesense_user') || '{}');
  } catch { return {}; }
}

/** Make authenticated API request */
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
}

/** Show/hide element */
function showEl(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideEl(id) { document.getElementById(id)?.classList.add('hidden'); }

// ═══════════════════════════════════════════════════════════════
//   AUTH PAGE (index.html)
// ═══════════════════════════════════════════════════════════════

/** Switch between login/register tabs */
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  if (!loginForm) return; // Not on auth page

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }

  // Clear errors on switch
  hideEl('loginError');
  hideEl('registerError');
}

/** Handle login form submission */
async function handleLogin(event) {
  event.preventDefault();

  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  // UI: loading state
  btn.disabled = true;
  btn.querySelector('.btn-text').classList.add('hidden');
  btn.querySelector('.btn-loader').classList.remove('hidden');
  hideEl('loginError');

  try {
    const data = await apiCall('/api/auth/login', 'POST', { username, password });
    setAuth(data.access_token, data.user);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.btn-loader').classList.add('hidden');
  }
}

/** Handle register form submission */
async function handleRegister(event) {
  event.preventDefault();

  const btn = document.getElementById('registerBtn');
  const errEl = document.getElementById('registerError');
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').classList.add('hidden');
  btn.querySelector('.btn-loader').classList.remove('hidden');
  hideEl('registerError');

  try {
    const data = await apiCall('/api/auth/register', 'POST', { username, email, password });
    setAuth(data.access_token, data.user);
    window.location.href = '/dashboard';
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.btn-loader').classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════════
//   DASHBOARD PAGE (dashboard.html)
// ═══════════════════════════════════════════════════════════════

/** Initialize dashboard */
async function initDashboard() {
  // Check auth
  if (!getToken()) {
    window.location.href = '/';
    return;
  }

  // Set username in nav
  const user = getUser();
  const navUser = document.getElementById('navUsername');
  if (navUser && user.username) navUser.textContent = user.username;

  // Load recommendation history
  loadHistory();
}

/** Logout user */
function logout() {
  try {
    apiCall('/api/auth/logout', 'POST'); // Fire and forget
  } catch {}
  clearAuth();
  window.location.href = '/';
}

/** Generate outfit recommendation */
async function generateOutfit(event) {
  event.preventDefault();

  const btn = document.getElementById('generateBtn');
  const btnText = document.getElementById('generateBtnText');
  const btnLoader = document.getElementById('generateBtnLoader');

  // Collect form values
  const payload = {
    body_type: document.getElementById('bodyType').value,
    occasion: document.getElementById('occasion').value,
    weather: document.getElementById('weather').value,
    budget: document.getElementById('budget').value,
    style_preference: document.getElementById('stylePreference').value,
    color_preference: document.getElementById('colorPreference').value || null
  };

  // UI: Show loading
  btn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  showLoadingState();

  try {
    const data = await apiCall('/api/recommend', 'POST', payload);
    displayRecommendation(data.recommendation, data.pinterest_links);
    // Refresh history
    loadHistory();
  } catch (err) {
    showErrorState(err.message || 'Failed to generate recommendation. Please try again.');
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

/** Show loading state with animated steps */
function showLoadingState() {
  hideEl('welcomeState');
  hideEl('resultsState');
  hideEl('errorState');
  showEl('loadingState');

  // Animate loading steps
  const steps = ['step1', 'step2', 'step3'];
  let currentStep = 0;

  // Reset all steps
  steps.forEach(s => document.getElementById(s)?.classList.remove('active'));
  document.getElementById('step1')?.classList.add('active');

  const stepInterval = setInterval(() => {
    currentStep = (currentStep + 1) % steps.length;
    steps.forEach(s => document.getElementById(s)?.classList.remove('active'));
    document.getElementById(steps[currentStep])?.classList.add('active');
  }, 1800);

  // Store interval to clear later
  window._stepInterval = stepInterval;
}

/** Display the AI recommendation */
function displayRecommendation(rec, pinterestLinks) {
  // Clear loading animation
  if (window._stepInterval) clearInterval(window._stepInterval);

  hideEl('loadingState');
  hideEl('welcomeState');
  hideEl('errorState');
  showEl('resultsState');

  // ─ Color of the Day ─
  const cotdName = document.getElementById('cotdName');
  const cotdSwatch = document.getElementById('cotdSwatch');
  if (cotdName) cotdName.textContent = rec.color_of_the_day || '—';
  if (cotdSwatch) {
    const color = cssColorFromName(rec.color_of_the_day);
    cotdSwatch.style.backgroundColor = color;
    cotdSwatch.title = rec.color_of_the_day;
  }

  // ─ Outfit Info ─
  setText('outfitTitle', rec.outfit_title);
  setText('outfitDesc', rec.outfit_description);

  // ─ Color Palette ─
  const paletteRow = document.getElementById('paletteRow');
  if (paletteRow && rec.color_palette) {
    paletteRow.innerHTML = rec.color_palette.map(color => `
      <div class="palette-chip">
        <div class="palette-dot" style="background:${cssColorFromName(color)};"></div>
        ${escapeHtml(color)}
      </div>
    `).join('');
  }

  // ─ Accessories ─
  const accList = document.getElementById('accessoriesList');
  if (accList && rec.accessories) {
    accList.innerHTML = rec.accessories.map(a =>
      `<li>${escapeHtml(a)}</li>`
    ).join('');
  }

  // ─ Hairstyle ─
  setText('hairstyleText', rec.hairstyle);

  // ─ Explanation & Budget ─
  setText('stylingExplanation', rec.styling_explanation);
  setText('budgetNote', rec.budget_note);

  // ─ Pinterest Links ─
  const grid = document.getElementById('pinterestGrid');
  if (grid && pinterestLinks) {
    const labels = {
    full_outfit: { icon: "👗", label: "Full Outfit Inspiration" },
    accessories: { icon: "💍", label: "Accessories Inspiration" },
    hairstyle: { icon: "💇", label: "Hairstyle Inspiration" },
    color_palette: { icon: "🎨", label: "Color Palette Ideas" }
  };

  grid.innerHTML = Object.entries(pinterestLinks).map(([key, link]) => {
    const meta = labels[key] || { icon: "✨", label: "Explore" };

    return `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="pinterest-card">
        <span class="pc-icon">${meta.icon}</span>
        <div class="pc-info">
          <div class="pc-label">${meta.label}</div>
          <div class="pc-sub">Tap to explore on Pinterest</div>
        </div>
        <span class="pc-arrow">→</span>
      </a>
    `;
  }).join('');
}

  // ─ Demo badge ─
  if (rec.__demo) {
    const badge = document.querySelector('.card-badge');
    if (badge) badge.textContent = 'DEMO – Add Gemini API Key for real AI';
  }

  // Scroll results panel to top
  const resultsPanel = document.querySelector('.results-panel');
  if (resultsPanel) resultsPanel.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Show error state */
function showErrorState(message) {
  if (window._stepInterval) clearInterval(window._stepInterval);
  hideEl('loadingState');
  hideEl('welcomeState');
  hideEl('resultsState');
  showEl('errorState');
  setText('errorMessage', message);
}

/** Hide error state */
function hideError() {
  hideEl('errorState');
  showEl('welcomeState');
}

/** Load and display recommendation history */
async function loadHistory() {
  try {
    const data = await apiCall('/api/history?limit=5');
    const listEl = document.getElementById('historyList');
    if (!listEl) return;

    if (!data.history || data.history.length === 0) {
      listEl.innerHTML = '<p class="history-empty">No history yet. Generate your first look!</p>';
      return;
    }

    listEl.innerHTML = data.history.map(item => `
      <div class="history-item">
        <div class="h-title">${escapeHtml(item.outfit_title || 'Unnamed Look')}</div>
        <div class="h-meta">${escapeHtml(item.occasion)} · ${escapeHtml(item.style_preference)}</div>
        ${item.color_of_the_day ? `<div class="history-cotd">✦ ${escapeHtml(item.color_of_the_day)}</div>` : ''}
      </div>
    `).join('');
  } catch {}
}

/** Scroll to the form for regeneration */
function scrollToForm() {
  document.getElementById('styleForm')?.scrollIntoView({ behavior: 'smooth' });
}

// ── Helper Functions ─────────────────────────────────────────────

/** Set text content safely */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '—';
}

/** Escape HTML to prevent XSS */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Map color names to approximate CSS colors.
 * Falls back to a seeded pastel if unknown.
 */
function cssColorFromName(colorName) {
  if (!colorName) return '#c9a96e';

  const colorMap = {
    'red': '#e74c3c', 'crimson': '#dc143c', 'scarlet': '#ff2400',
    'orange': '#e67e22', 'coral': '#ff7f50', 'peach': '#ffcba4',
    'yellow': '#f1c40f', 'gold': '#ffd700', 'amber': '#ffbf00',
    'green': '#27ae60', 'olive': '#808000', 'sage': '#b2ac88',
    'teal': '#1abc9c', 'cyan': '#00bcd4', 'mint': '#98ff98',
    'blue': '#3498db', 'cobalt': '#0047ab', 'navy': '#001f3f',
    'purple': '#9b59b6', 'lavender': '#e6e6fa', 'violet': '#ee82ee',
    'pink': '#e91e8c', 'rose': '#ff007f', 'blush': '#ffb6c1',
    'brown': '#795548', 'terracotta': '#c0704a', 'caramel': '#c68642',
    'beige': '#f5f0dc', 'cream': '#fffdd0', 'ivory': '#fffff0',
    'white': '#f8f8f8', 'black': '#222222', 'gray': '#95a5a6',
    'grey': '#95a5a6', 'charcoal': '#36454f', 'silver': '#c0c0c0',
    'dusty rose': '#dcae96', 'dusty pink': '#d8a9a9',
    'earthy': '#c4905a', 'earth': '#c4905a', 'nude': '#e3bc9a',
    'camel': '#c19a6b', 'khaki': '#c3b091',
  };

  const lower = colorName.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (lower.includes(key)) return value;
  }

  // Generate a deterministic pastel from the name string
  let hash = 0;
  for (let i = 0; i < colorName.length; i++) {
    hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 65%)`;
}

// ── Page Initialization ──────────────────────────────────────────

(function init() {
  const path = window.location.pathname;

  if (path === '/dashboard') {
    // Dashboard page init
    initDashboard();
  } else {
    // Auth page: redirect if already logged in
    if (getToken()) {
      window.location.href = '/dashboard';
    }
  }
})();
