/**
 * Header Component
 * Renders logo badge, title, subtitle, live indicator, export button, and theme toggle.
 */

const SUN_ICON = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"></circle>
  <line x1="12" y1="1" x2="12" y2="3"></line>
  <line x1="12" y1="21" x2="12" y2="23"></line>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
  <line x1="1" y1="12" x2="3" y2="12"></line>
  <line x1="21" y1="12" x2="23" y2="12"></line>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
</svg>
`;

const MOON_ICON = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
</svg>
`;

const DOWNLOAD_ICON = `
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
  <polyline points="7 10 12 15 17 10"></polyline>
  <line x1="12" y1="15" x2="12" y2="3"></line>
</svg>
`;

const WHATIF_ICON = `
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
  <line x1="8" y1="6" x2="16" y2="6"></line>
  <line x1="16" y1="14" x2="16" y2="18"></line>
  <path d="M16 10h.01"></path>
  <path d="M12 10h.01"></path>
  <path d="M8 10h.01"></path>
  <path d="M12 14h.01"></path>
  <path d="M8 14h.01"></path>
  <path d="M12 18h.01"></path>
  <path d="M8 18h.01"></path>
</svg>
`;

const PIN_ICON = `
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="17" x2="12" y2="22"></line>
  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
</svg>
`;

export function setLatestDate(dateText) {
  const el = document.getElementById('header-update-text');
  if (el && dateText) {
    el.textContent = dateText.startsWith('อัปเดต') ? dateText : `อัปเดต: ${dateText}`;
  }
}

export function renderHeader(container) {
  if (!container) return;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  const headerHtml = `
    <header class="app-header">
      <div class="header-container">
        <div class="header-brand">
          <img src="/GPFLogo.png" class="brand-logo-img logo-badge" id="brand-logo-img" alt="GPF Logo" title="กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)" />
          <h1 class="logo-title" title="GPF NAV Terminal">NAV</h1>
          <span class="live-badge" id="btn-open-terminal-status" title="คลิกเพื่อดูสถานะระบบและข้อมูล NAV ล่าสุด">
            <span class="live-dot"></span>
            <span>TERMINAL</span>
          </span>
          <div class="header-update-badge" id="header-update-badge" title="วันทำการล่าสุดที่มีการสรุปข้อมูล NAV">
            <span class="update-pulse-dot"></span>
            <span id="header-update-text">อัปเดต: วันทำการล่าสุด</span>
          </div>
        </div>

        <div class="header-actions">
          <button id="btn-export-modal" class="btn-action secret-export-btn" style="display: none;" title="ดาวน์โหลดข้อมูล Excel / CSV">
            ${DOWNLOAD_ICON}
            <span class="btn-text">ดาวน์โหลดข้อมูล</span>
          </button>

          <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme" title="สลับโหมดหน้าจอ (มืด/สว่าง)">
            ${currentTheme === 'dark' ? SUN_ICON : MOON_ICON}
          </button>
        </div>
      </div>
    </header>
  `;

  container.insertAdjacentHTML('afterbegin', headerHtml);

  // Setup Logo Badge: Single click opens Developer Credit modal; 7 clicks opens secret export modal
  let logoClickCount = 0;
  let logoClickTimer = null;
  const logoBadge = container.querySelector ? container.querySelector('.logo-badge') : document.querySelector('.logo-badge');
  if (logoBadge) {
    logoBadge.style.cursor = 'pointer';
    logoBadge.title = 'กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)';
    logoBadge.addEventListener('click', () => {
      logoClickCount++;
      clearTimeout(logoClickTimer);

      if (logoClickCount >= 7) {
        logoClickCount = 0;
        const exportBtn = document.getElementById('btn-export-modal');
        if (exportBtn) {
          exportBtn.click();
        } else {
          const exportEvent = new CustomEvent('open-export-modal', { bubbles: true });
          document.dispatchEvent(exportEvent);
        }
        return;
      }

      logoClickTimer = setTimeout(() => {
        if (logoClickCount === 1) {
          const devEvent = new CustomEvent('open-dev-modal', { bubbles: true });
          document.dispatchEvent(devEvent);
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(devEvent);
          }
        }
        logoClickCount = 0;
      }, 400);
    });
  }

  // Also clicking on logo title opens Developer Credit modal
  const logoTitle = container.querySelector ? container.querySelector('.logo-title') : document.querySelector('.logo-title');
  if (logoTitle) {
    logoTitle.style.cursor = 'pointer';
    logoTitle.title = 'GPF NAV Terminal';
    logoTitle.addEventListener('click', () => {
      const devEvent = new CustomEvent('open-dev-modal', { bubbles: true });
      document.dispatchEvent(devEvent);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(devEvent);
      }
    });
  }

  // Setup Secret Doorway Keyboard Shortcut: Ctrl + Shift + E
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        const exportBtn = document.getElementById('btn-export-modal');
        if (exportBtn) {
          exportBtn.click();
        } else {
          const exportEvent = new CustomEvent('open-export-modal', { bubbles: true });
          document.dispatchEvent(exportEvent);
        }
      }
    });
  }

  // Setup Export Modal Button Listener
  const exportBtn = document.getElementById('btn-export-modal');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const exportEvent = new CustomEvent('open-export-modal', { bubbles: true });
      document.dispatchEvent(exportEvent);
      window.dispatchEvent(exportEvent);
    });
  }

  // Setup Terminal Status Modal Listener (Idea 1)
  const terminalStatusBtn = document.getElementById('btn-open-terminal-status') || container.querySelector?.('#btn-open-terminal-status');
  if (terminalStatusBtn) {
    terminalStatusBtn.addEventListener('click', () => {
      const statusEvent = new CustomEvent('open-terminal-status', { bubbles: true });
      document.dispatchEvent(statusEvent);
      window.dispatchEvent(statusEvent);
    });
  }

  // Setup Theme Toggle Listener
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const targetTheme = activeTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);

      // In dark theme, show sun to switch to light; in light theme, show moon
      themeBtn.innerHTML = targetTheme === 'dark' ? SUN_ICON : MOON_ICON;
    });
  }
}

export default {
  renderHeader,
};
