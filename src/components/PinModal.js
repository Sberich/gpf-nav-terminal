/**
 * Pin Modal Component
 * Allows users to set, view, and delete target price pins for any of the 15 GPF plans.
 * Displays real-time percentage distance from current NAV and syncs with localStorage via pinService.
 */

import pinService from '../services/pinService.js';
import { fetchSummary } from '../services/navService.js';
import { DEFAULT_PLAN_COLORS } from './ChartView.js';

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class PinModal {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;
    this.options = options;
    this.summaryData = options.summaryData || null;
    this.defaultPlan = options.defaultPlan || 'แผนเชิงรุก 35';
    this.isOpen = false;

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handlePinsChanged = this._handlePinsChanged.bind(this);

    this.render();
    this.bindEvents();
    this.renderPinList();

    if (!this.summaryData) {
      this.loadSummary();
    }
  }

  async init() {
    if (!this.summaryData) {
      await this.loadSummary();
    }
    return this;
  }

  async loadSummary() {
    try {
      this.summaryData = await fetchSummary();
      this.updatePlanSelect();
      this.renderPinList();
    } catch (e) {
      console.warn('[PinModal] Failed to fetch summaryData:', e);
    }
  }

  updatePlanSelect() {
    if (!this.container) return;
    const planKeys = this.summaryData?.plans
      ? Object.keys(this.summaryData.plans)
      : Object.keys(DEFAULT_PLAN_COLORS);

    const planSelect = this.container.querySelector('#pin-plan-select');
    if (planSelect) {
      const cur = planSelect.value || this.defaultPlan;
      planSelect.innerHTML = planKeys.map(k => {
        const isSelected = k === cur;
        const nav = this.getCurrentNav(k);
        const navLabel = nav ? ` (NAV: ${nav.toFixed(4)})` : '';
        return `<option value="${k}" ${isSelected ? 'selected' : ''}>${k}${navLabel}</option>`;
      }).join('');
    }
  }

  getCurrentNav(planKey) {
    if (this.summaryData?.plans?.[planKey]?.latestNav != null) {
      return this.summaryData.plans[planKey].latestNav;
    }
    return null;
  }

  calculateDistance(targetValue, currentNav) {
    if (!currentNav || currentNav <= 0 || !targetValue) {
      return '';
    }
    const diff = targetValue - currentNav;
    const pct = (diff / currentNav) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}% จากราคาปัจจุบัน (${currentNav.toFixed(4)})`;
  }

  render() {
    if (!this.container) return;

    const planKeys = this.summaryData?.plans
      ? Object.keys(this.summaryData.plans)
      : Object.keys(DEFAULT_PLAN_COLORS);

    const planOptions = planKeys.map(k => {
      const isSelected = k === this.defaultPlan;
      const nav = this.getCurrentNav(k);
      const navLabel = nav ? ` (NAV: ${nav.toFixed(4)})` : '';
      return `<option value="${k}" ${isSelected ? 'selected' : ''}>${k}${navLabel}</option>`;
    }).join('');

    const initialCurrentNav = this.getCurrentNav(this.defaultPlan);
    const initialNavVal = initialCurrentNav ? initialCurrentNav.toFixed(4) : '';

    const html = `
      <div id="pin-modal" class="modal-backdrop" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="pin-modal-title">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-badge-icon">📌</span>
              <div>
                <h3 id="pin-modal-title" class="modal-title">ปักหมุดระดับราคาเป้าหมาย (Price Pinning)</h3>
                <p class="modal-subtitle">ตั้งเส้นระดับราคาแจ้งเตือนบนกราฟ NAV และคำนวณระยะห่างจากราคาปัจจุบัน</p>
              </div>
            </div>
            <button class="modal-close" id="btn-close-pin-modal" aria-label="ปิดหน้าต่าง">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Add Pin Form -->
            <form id="pin-form" class="pin-form" onsubmit="return false;">
              <div class="form-group">
                <label class="form-label" for="pin-plan-select">เลือกแผนการลงทุน</label>
                <select id="pin-plan-select" class="form-select">
                  ${planOptions}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="pin-nav-input">ระดับราคา NAV เป้าหมาย</label>
                  <input type="number" id="pin-nav-input" class="form-input" placeholder="เช่น 36.5000" step="0.0001" min="0" value="${initialNavVal}">
                </div>
                <div class="form-group flex-2">
                  <label class="form-label" for="pin-note-input">บันทึกช่วยจำ (Note)</label>
                  <input type="text" id="pin-note-input" class="form-input" placeholder="เช่น แนวรับสำคัญ, จุดเข้าซื้อ">
                </div>
              </div>

              <div class="pin-form-action">
                <button type="button" id="btn-add-pin" class="btn-primary-action">
                  <span>📌</span> บันทึกหมุดราคา
                </button>
              </div>
            </form>

            <!-- Pinned Levels List -->
            <div class="pinned-list-container">
              <h4 class="pinned-section-title">หมุดราคาที่บันทึกไว้ในเครื่อง</h4>
              <div id="pinned-items-list" class="pinned-items-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', html);
  }

  bindEvents() {
    const modalEl = this.container.querySelector('#pin-modal');
    if (!modalEl) return;

    // Close button
    const closeBtn = modalEl.querySelector('#btn-close-pin-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        this.close();
      }
    });

    // Plan selection change updates NAV input suggestion if empty or matches old nav
    const planSelect = modalEl.querySelector('#pin-plan-select');
    if (planSelect) {
      planSelect.addEventListener('change', (e) => {
        const selectedPlan = e.target.value;
        const nav = this.getCurrentNav(selectedPlan);
        const navInput = modalEl.querySelector('#pin-nav-input');
        if (navInput && nav) {
          navInput.placeholder = nav.toFixed(4);
        }
      });
    }

    // Add Pin button
    const addBtn = modalEl.querySelector('#btn-add-pin');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleAddPin());
    }

    // Form submit listener (Enter key)
    const form = modalEl.querySelector('#pin-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddPin();
      });
    }

    // Global listener for pins-changed to auto refresh UI
    if (typeof document !== 'undefined') {
      document.addEventListener('pins-changed', this._handlePinsChanged);
      document.addEventListener('open-pin-modal', () => this.open());
    }
  }

  _handlePinsChanged() {
    this.renderPinList();
  }

  handleAddPin() {
    const modalEl = this.container.querySelector('#pin-modal');
    if (!modalEl) return;

    const planSelect = modalEl.querySelector('#pin-plan-select');
    const navInput = modalEl.querySelector('#pin-nav-input');
    const noteInput = modalEl.querySelector('#pin-note-input');

    const planKey = planSelect?.value;
    const value = parseFloat(navInput?.value);
    const note = noteInput?.value || '';

    if (!planKey || isNaN(value) || value <= 0) {
      return;
    }

    pinService.addPin(planKey, value, note);

    // Clear note and optionally refocus
    if (noteInput) {
      noteInput.value = '';
    }
    this.renderPinList();
  }

  handleRemovePin(planKey, pinId) {
    pinService.removePin(planKey, pinId);
    this.renderPinList();
  }

  renderPinList() {
    const listEl = this.container.querySelector('#pinned-items-list');
    if (!listEl) return;

    const allPins = pinService.getPins();
    const planKeys = Object.keys(allPins).filter(k => Array.isArray(allPins[k]) && allPins[k].length > 0);

    if (planKeys.length === 0) {
      listEl.innerHTML = `
        <div class="empty-pins-notice">
          <p>ยังไม่มีการปักหมุดราคาเป้าหมาย</p>
          <span class="empty-hint">กรอกราคาด้านบนแล้วกด "บันทึกหมุดราคา" เส้นจะแสดงบนกราฟทันที</span>
        </div>
      `;
      return;
    }

    let html = '';
    for (const planKey of planKeys) {
      const pins = allPins[planKey];
      const color = DEFAULT_PLAN_COLORS[planKey] || '#2196F3';
      const currentNav = this.getCurrentNav(planKey);

      const itemsHtml = pins.map(pin => {
        const distanceStr = currentNav ? this.calculateDistance(pin.value, currentNav) : '';
        const isAbove = currentNav && pin.value > currentNav;
        const distClass = isAbove ? 'dist-up' : 'dist-down';

        return `
          <div class="pin-item" data-pin-id="${pin.id}" data-plan="${planKey}">
            <div class="pin-item-main">
              <div class="pin-value-row">
                <span class="pin-badge">📌 ${pin.value.toFixed(4)}</span>
                ${pin.note ? `<span class="pin-note">${escapeHtml(pin.note)}</span>` : ''}
              </div>
              ${distanceStr ? `<div class="pin-distance ${distClass}">${distanceStr}</div>` : ''}
            </div>
            <button class="btn-delete-pin" data-plan="${planKey}" data-pin-id="${pin.id}" title="ลบหมุดนี้">&times;</button>
          </div>
        `;
      }).join('');

      html += `
        <div class="plan-pins-group">
          <div class="plan-pins-header">
            <span class="plan-color-dot" style="background-color: ${color}"></span>
            <span class="plan-pins-title">${planKey}</span>
            <span class="pins-count">(${pins.length} หมุด)</span>
          </div>
          <div class="plan-pins-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;

    // Attach click listeners to delete buttons
    const delBtns = listEl.querySelectorAll('.btn-delete-pin');
    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-delete-pin') || e.target;
        const plan = targetBtn.dataset?.plan || targetBtn.getAttribute('data-plan');
        const id = targetBtn.dataset?.pinId || targetBtn.getAttribute('data-pin-id');
        if (plan && id) {
          this.handleRemovePin(plan, id);
        }
      });
    });
  }

  open(preselectedPlan = null) {
    const modalEl = this.container.querySelector('#pin-modal');
    if (modalEl) {
      if (preselectedPlan) {
        const select = modalEl.querySelector('#pin-plan-select');
        if (select) {
          select.value = preselectedPlan;
          const nav = this.getCurrentNav(preselectedPlan);
          const navInput = modalEl.querySelector('#pin-nav-input');
          if (navInput && nav) {
            navInput.value = nav.toFixed(4);
          }
        }
      }
      modalEl.style.display = 'flex';
      this.isOpen = true;
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', this._handleKeyDown);
      }
      this.renderPinList();
    }
  }

  close() {
    const modalEl = this.container.querySelector('#pin-modal');
    if (modalEl) {
      modalEl.style.display = 'none';
      this.isOpen = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', this._handleKeyDown);
      }
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pins-changed', this._handlePinsChanged);
      document.removeEventListener('keydown', this._handleKeyDown);
    }
  }
}

export function renderPinModal(container, options = {}) {
  const instance = new PinModal(container, options);
  instance.init();
  return instance;
}

export default {
  PinModal,
  renderPinModal
};
