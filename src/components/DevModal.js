/**
 * Developer Credit Modal Component
 * Displays glowing GPF branding, version, and signature: KⓇU M00 ¥EO with rainbow animation.
 */

export class DevModal {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;
    this.options = options;
    this.version = options.version || 'v1.1271';
    this.author = options.author || 'KⓇU M00 ¥EO';
    this.isOpen = false;

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleOpenEvent = this._handleOpenEvent.bind(this);

    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;

    const modalHtml = `
      <div id="dev-modal" class="dev-modal-backdrop" aria-hidden="true" role="dialog">
        <div class="dev-box">
          <button class="dev-close" id="btn-close-dev" aria-label="ปิดหน้าต่าง">✕</button>
          
          <div class="dev-icon-wrap">
            <svg width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="gpfGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur1" />
                  <feGaussianBlur stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <text x="60" y="38" font-family="sans-serif" font-weight="900" font-size="38" letter-spacing="4" text-anchor="middle" fill="none" stroke="#00e5ff" stroke-width="2.5" filter="url(#gpfGlow)">GPF</text>
              <text x="60" y="38" font-family="sans-serif" font-weight="900" font-size="38" letter-spacing="4" text-anchor="middle" fill="#ffffff">GPF</text>
            </svg>
          </div>

          <div class="dev-version" id="dev-visit-count">${this.version}</div>
          <div class="dev-credit-label">DEVELOPED BY</div>
          <div class="dev-credit-name rainbow-anim">${this.author}</div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', modalHtml);
    this.modalEl = this.container.querySelector('#dev-modal');
  }

  bindEvents() {
    if (!this.modalEl) return;

    const closeBtn = this.modalEl.querySelector('#btn-close-dev');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('open-dev-modal', this._handleOpenEvent);
      document.addEventListener('keydown', this._handleKeyDown);
    }
  }

  _handleOpenEvent() {
    this.open();
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  open() {
    if (!this.modalEl) return;
    this.isOpen = true;
    this.modalEl.classList.add('open');
    this.modalEl.setAttribute('aria-hidden', 'false');
  }

  setVersion(verStr) {
    if (!verStr) return;
    this.version = verStr;
    const el = this.modalEl ? this.modalEl.querySelector('#dev-visit-count') : document.getElementById('dev-visit-count');
    if (el) el.textContent = verStr;
  }

  close() {
    if (!this.modalEl) return;
    this.isOpen = false;
    this.modalEl.classList.remove('open');
    this.modalEl.setAttribute('aria-hidden', 'true');
  }

  destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('open-dev-modal', this._handleOpenEvent);
      document.removeEventListener('keydown', this._handleKeyDown);
    }
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
  }
}

export function renderDevModal(container, options = {}) {
  const instance = new DevModal(container, options);
  return instance;
}

export default {
  DevModal,
  renderDevModal
};
