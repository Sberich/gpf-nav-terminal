/**
 * Export Modal Component
 * Displays download choices for NAV historical datasets:
 * 1. Microsoft Excel (.xlsx) - Recommended: 2 worksheets, freeze panes, 4 decimal places
 * 2. CSV format (.csv) - UTF-8 with BOM, complete 15 plans, newest date first
 */

export class ExportModal {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;
    this.options = options;
    this.isOpen = false;

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleOpenModal = this._handleOpenModal.bind(this);

    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;

    const html = `
      <div id="export-modal" class="modal-backdrop" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-badge-icon">📊</span>
              <div>
                <h3 id="export-modal-title" class="modal-title">ดาวน์โหลดตารางข้อมูล NAV</h3>
                <p class="modal-subtitle">ดาวน์โหลดไฟล์ประวัติมูลค่าหน่วยลงทุน (NAV) กองทุน กบข. ทั้ง 15 แผน สำหรับนำไปวิเคราะห์ต่อ</p>
              </div>
            </div>
            <button class="modal-close" id="btn-close-export-modal" aria-label="ปิดหน้าต่าง">&times;</button>
          </div>

          <div class="modal-body">
            <div class="export-options-grid">
              <!-- Option 1: Microsoft Excel (.xlsx) [Recommended] -->
              <div class="export-card is-recommended">
                <div class="export-card-header">
                  <div class="export-format-badge excel-badge">XLSX</div>
                  <div class="export-title-group">
                    <div class="export-title-row">
                      <h4 class="export-title">Microsoft Excel (.xlsx)</h4>
                      <span class="recommend-pill">แนะนำ (Recommended)</span>
                    </div>
                    <span class="export-desc">ไฟล์สเปรดชีตสมบูรณ์แบบ จัดรูปแบบพร้อมใช้งานทันที</span>
                  </div>
                </div>

                <div class="export-features">
                  <ul class="export-features-list">
                    <li><span class="feature-icon">✨</span><div class="feature-text"><strong>2 แผ่นงาน:</strong> สรุปผลตอบแทน & สถิติ + ประวัติย้อนหลัง</div></li>
                    <li><span class="feature-icon">📌</span><div class="feature-text"><strong>ตรึงหัวตาราง:</strong> ตรึงหัวตารางและคอลัมน์วันที่ เลื่อนดูได้สะดวก</div></li>
                    <li><span class="feature-icon">🔢</span><div class="feature-text"><strong>4 ตำแหน่ง:</strong> ตัวเลขทศนิยม 4 ตำแหน่ง ชัดเจนตามมาตรฐาน กบข.</div></li>
                    <li><span class="feature-icon">📅</span><div class="feature-text"><strong>เรียงจากล่าสุด:</strong> วันทำการล่าสุดอยู่บนสุด สะดวกต่อการติดตาม</div></li>
                  </ul>
                </div>

                <div class="export-action">
                  <a href="/export/gpf_nav_history.xlsx" download="gpf_nav_history.xlsx" class="btn-primary-action btn-download-excel" id="btn-download-xlsx">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>ดาวน์โหลดไฟล์ Excel (.xlsx)</span>
                  </a>
                </div>
              </div>

              <!-- Option 2: CSV Format (.csv) -->
              <div class="export-card">
                <div class="export-card-header">
                  <div class="export-format-badge csv-badge">CSV</div>
                  <div class="export-title-group">
                    <div class="export-title-row">
                      <h4 class="export-title">CSV Format (.csv)</h4>
                    </div>
                    <span class="export-desc">ไฟล์ข้อความมาตรฐานสากล รองรับโปรแกรมวิเคราะห์ข้อมูลทุกประเภท</span>
                  </div>
                </div>

                <div class="export-features">
                  <ul class="export-features-list">
                    <li><span class="feature-icon">🇹🇭</span><div class="feature-text"><strong>UTF-8 with BOM:</strong> เปิดใน Excel ภาษาไทยไม่เพี้ยน ไม่ต้องแปลง</div></li>
                    <li><span class="feature-icon">📊</span><div class="feature-text"><strong>15 แผนครบถ้วน:</strong> รวมประวัติ NAV ทุกกองทุนตั้งแต่เริ่มต้น</div></li>
                    <li><span class="feature-icon">📅</span><div class="feature-text"><strong>เรียงจากล่าสุด:</strong> วันทำการล่าสุดอยู่บนสุด นำเข้าฐานข้อมูลสะดวก</div></li>
                    <li><span class="feature-icon">💻</span><div class="feature-text"><strong>Data Tools:</strong> รองรับ Python, R, Power BI และ Tableau ทันที</div></li>
                  </ul>
                </div>

                <div class="export-action">
                  <a href="/export/gpf_nav_history.csv" download="gpf_nav_history.csv" class="btn-secondary-action btn-download-csv" id="btn-download-csv">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>ดาวน์โหลดไฟล์ CSV (.csv)</span>
                  </a>
                </div>
              </div>
            </div>

            <div class="export-note">
              <span class="export-note-icon">💡</span>
              <p>ข้อมูลอัปเดตอัตโนมัติทุกวันทำการ หลัง กบข. ประกาศมูลค่าหน่วยลงทุน (NAV) ช่วงเวลาประมาณ 10:00 - 11:00 น.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', html);
  }

  bindEvents() {
    const modalEl = this.container.querySelector('#export-modal');
    if (!modalEl) return;

    // Close button click
    const closeBtn = modalEl.querySelector('#btn-close-export-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        this.close();
      }
    });

    // Global listeners for open-export-modal
    if (typeof document !== 'undefined') {
      document.addEventListener('open-export-modal', this._handleOpenModal);
    }
  }

  _handleOpenModal() {
    this.open();
  }

  open() {
    const modalEl = this.container?.querySelector('#export-modal');
    if (modalEl) {
      modalEl.style.display = 'flex';
      this.isOpen = true;
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', this._handleKeyDown);
      }
    }
  }

  close() {
    const modalEl = this.container?.querySelector('#export-modal');
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
      document.removeEventListener('open-export-modal', this._handleOpenModal);
      document.removeEventListener('keydown', this._handleKeyDown);
    }
  }
}

export function renderExportModal(container, options = {}) {
  const instance = new ExportModal(container, options);
  return instance;
}

export default {
  ExportModal,
  renderExportModal
};
