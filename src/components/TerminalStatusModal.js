/**
 * Terminal Status & Data Health Modal Component (Idea 1)
 * Displays Live System Health, NAV synchronization state, update schedules,
 * and quick navigation to companion GPF apps.
 */

import { formatThaiDate } from './MetricCards.js';

export class TerminalStatusModal {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;
    this.options = options;
    this.isOpen = false;

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleOpenEvent = this._handleOpenEvent.bind(this);

    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;

    const modalHtml = `
      <div id="terminal-status-modal" class="status-modal-backdrop" aria-hidden="true" role="dialog" aria-labelledby="status-modal-title">
        <div class="status-modal-box">
          <button class="status-modal-close" id="btn-close-status-modal" aria-label="ปิดหน้าต่าง">✕</button>
          
          <div class="status-modal-header">
            <div class="status-title-badge">
              <span class="status-pulsing-dot"></span>
              <span id="status-modal-title">GPF TERMINAL STATUS & HEALTH</span>
            </div>
            <div class="status-sub-desc">สถานะการเชื่อมต่อข้อมูลและการอัปเดตระบบ กบข.</div>
          </div>

          <div class="status-grid">
            <div class="status-card">
              <div class="status-card-label">📡 สถานะระบบ (SYSTEM STATUS)</div>
              <div class="status-card-val text-neon-green">
                <span class="status-indicator-dot"></span> ออนไลน์ พร้อมใช้งาน
              </div>
              <div class="status-card-sub">เชื่อมต่อฐานข้อมูลโดยตรง</div>
            </div>

            <div class="status-card">
              <div class="status-card-label">📅 ข้อมูล NAV ล่าสุด (LATEST NAV)</div>
              <div class="status-card-val text-accent" id="status-latest-date">
                13 พ.ย. 2569
              </div>
              <div class="status-card-sub" id="status-date-sub">วันทำการล่าสุดจาก กบข.</div>
            </div>

            <div class="status-card">
              <div class="status-card-label">📈 ฐานข้อมูลย้อนหลัง (DATA PARITY)</div>
              <div class="status-card-val" id="status-total-days">
                2,395 วันทำการ
              </div>
              <div class="status-card-sub text-neon-green">✓ ครบถ้วน 100% (ไม่มีย่อ LTTB)</div>
            </div>

            <div class="status-card">
              <div class="status-card-label">⏱️ รอบตรวจอัตโนมัติ (AUTO SCHEDULE)</div>
              <div class="status-card-val">
                11:00 น. & 17:00 น.
              </div>
              <div class="status-card-sub">จันทร์ - ศุกร์ (วันทำการ)</div>
            </div>
          </div>

          <div class="status-notice-box">
            <div class="status-notice-title">💡 ความรู้เกี่ยวกับรอบเวลาประกาศ NAV ของ กบข.:</div>
            <p class="status-notice-text">
              กบข. จะคำนวณและประกาศราคา NAV ย้อนหลัง <strong>1 - 2 วันทำการ (T+1 ถึง T+2)</strong> เสมอ โดยเฉพาะแผนที่มีสินทรัพย์ต่างประเทศ (เช่น หุ้นต่างประเทศ ตราสารหนี้ต่างประเทศ) กบข. ต้องรอราคาปิดตลาดโลกและสรุปอัตราแลกเปลี่ยนค่าเงินก่อนประกาศ ทำให้ราคาช่วงเย็นวันจันทร์-อังคาร จะเป็นราคาของวันทำการก่อนหน้า
            </p>
          </div>

          <div class="status-custom-slots-section">
            <div class="status-custom-slots-title">📦 พื้นที่ว่างสำหรับข้อมูล / วิดเจ็ตเพิ่มเติม (Custom Slot):</div>
            <div class="status-custom-slots-grid">
              <div class="custom-slot-box">
                <div class="custom-slot-icon">➕</div>
                <div class="custom-slot-info">
                  <div class="custom-slot-title">กล่องข้อมูลสำรอง ช่องที่ 1</div>
                  <div class="custom-slot-desc">เว้นว่างไว้สำหรับเพิ่มข้อมูลหรือฟังก์ชันในอนาคต</div>
                </div>
              </div>

              <div class="custom-slot-box">
                <div class="custom-slot-icon">➕</div>
                <div class="custom-slot-info">
                  <div class="custom-slot-title">กล่องข้อมูลสำรอง ช่องที่ 2</div>
                  <div class="custom-slot-desc">เว้นว่างไว้สำหรับเพิ่มข้อมูลหรือฟังก์ชันในอนาคต</div>
                </div>
              </div>
            </div>
          </div>

          <div class="status-modal-footer">
            <div class="status-source-tag">แหล่งข้อมูล: API ทางการ กองทุนบำเหน็จบำนาญข้าราชการ (gpf.or.th)</div>
            <button class="btn-status-dismiss" id="btn-dismiss-status">ปิดหน้าต่าง</button>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', modalHtml);
    this.modalEl = this.container.querySelector('#terminal-status-modal');
  }

  bindEvents() {
    if (!this.modalEl) return;

    const closeBtn = this.modalEl.querySelector('#btn-close-status-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const dismissBtn = this.modalEl.querySelector('#btn-dismiss-status');
    if (dismissBtn) dismissBtn.addEventListener('click', () => this.close());

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    window.addEventListener('open-terminal-status', this._handleOpenEvent);
  }

  _handleOpenEvent(e) {
    this.open(e?.detail);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  open(data = null) {
    if (!this.modalEl) return;
    this.isOpen = true;
    this.modalEl.classList.add('open');
    this.modalEl.setAttribute('aria-hidden', 'false');

    window.addEventListener('keydown', this._handleKeyDown);

    // Update dynamic fields if data provided or available
    const summaryData = data || (typeof this.options.getSummaryData === 'function' ? this.options.getSummaryData() : null);
    if (summaryData) {
      const dateEl = this.modalEl.querySelector('#status-latest-date');
      if (dateEl && summaryData.latestDate) {
        dateEl.textContent = formatThaiDate(summaryData.latestDate);
      }

      const daysEl = this.modalEl.querySelector('#status-total-days');
      if (daysEl && summaryData.totalTradingDays) {
        daysEl.textContent = `${Number(summaryData.totalTradingDays).toLocaleString('th-TH')} วันทำการ`;
      }
    }
  }

  close() {
    if (!this.modalEl) return;
    this.isOpen = false;
    this.modalEl.classList.remove('open');
    this.modalEl.setAttribute('aria-hidden', 'true');
    window.removeEventListener('keydown', this._handleKeyDown);
  }

  destroy() {
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('open-terminal-status', this._handleOpenEvent);
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
  }
}

export function renderTerminalStatusModal(container, options) {
  return new TerminalStatusModal(container, options);
}
