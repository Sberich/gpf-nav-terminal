import './styles/variables.css';
import './styles/main.css';
import { renderHeader, setLatestDate } from './components/Header.js';
import navService, { fetchSummary, fetchChartData, fetchFullHistory } from './services/navService.js';
import { MetricCards, renderMetricCards, formatThaiDate } from './components/MetricCards.js';
import { PlanSelector, renderPlanSelector } from './components/PlanSelector.js';
import { ChartView, renderChartView } from './components/ChartView.js';
import { WhatIfModal, renderWhatIfModal } from './components/WhatIfModal.js';
import { PinModal, renderPinModal } from './components/PinModal.js';
import { ExportModal, renderExportModal } from './components/ExportModal.js';
import { DevModal, renderDevModal } from './components/DevModal.js';
import { TerminalStatusModal, renderTerminalStatusModal } from './components/TerminalStatusModal.js';

let metricCardsInstance = null;
let planSelectorInstance = null;
let chartViewInstance = null;
let whatIfModalInstance = null;
let pinModalInstance = null;
let exportModalInstance = null;
let devModalInstance = null;
let terminalStatusModalInstance = null;

/**
 * Initialize Application Theme from localStorage (defaults to dark)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Initialize Main DOM Layout Skeleton: Trading Terminal (Sidebar + Stage)
 */
function initLayout() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Root element #app not found');
    return;
  }

  // Clear existing children to prevent duplicate mounting
  app.innerHTML = '';

  // Create Header
  renderHeader(app);

  // Create Main Content Skeleton with required placeholders in Trading Terminal layout
  const mainContent = document.createElement('main');
  mainContent.className = 'main-content terminal-layout';
  mainContent.innerHTML = `
    <!-- Left Column: Watchlist Sidebar -->
    <aside id="plan-selector-container" class="terminal-sidebar"></aside>

    <!-- Right Column: Main Trading Stage -->
    <section class="terminal-stage">
      <!-- Top Financial Ticker HUD (The yellow box items) -->
      <section id="metric-cards-container" class="terminal-hud"></section>
      <!-- Large Chart Area -->
      <section id="chart-container" class="terminal-chart-area"></section>
    </section>
  `;
  app.appendChild(mainContent);

  // Create Native iOS Bottom Tab Bar (displayed on mobile & iOS)
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'ios-bottom-nav';
  bottomNav.id = 'ios-bottom-nav';
  bottomNav.setAttribute('aria-label', 'iOS App Navigation');
  bottomNav.innerHTML = `
    <button class="ios-tab-btn is-active" data-tab="stage" title="ดูกราฟและตัวชี้วัด">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
      <span class="ios-tab-text">กราฟ</span>
    </button>
    <button class="ios-tab-btn" data-tab="sidebar" title="เลือกแผนการลงทุน">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
      <span class="ios-tab-text">แผนลงทุน</span>
    </button>
    <button class="ios-tab-btn" data-tab="whatif" title="จำลองผลตอบแทน">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
        <line x1="8" y1="6" x2="16" y2="6"></line>
        <line x1="16" y1="14" x2="16" y2="18"></line>
        <path d="M16 10h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M8 10h.01"></path>
      </svg>
      <span class="ios-tab-text">จำลอง</span>
    </button>
    <button class="ios-tab-btn" data-tab="pins" title="ปักหมุดราคา">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
      </svg>
      <span class="ios-tab-text">ปักหมุด</span>
    </button>
  `;
  app.appendChild(bottomNav);

  // Tab switching behavior for mobile iOS
  bottomNav.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('.ios-tab-btn') : null;
    if (!btn) return;
    const tab = btn.dataset?.tab || btn.getAttribute?.('data-tab');
    const sidebar = document.getElementById('plan-selector-container');
    const stage = document.querySelector('.terminal-stage');

    if (tab === 'stage') {
      if (sidebar) sidebar.classList.remove('mobile-visible');
      if (stage) stage.classList.remove('mobile-hidden');
      updateActiveTab(btn);
    } else if (tab === 'sidebar') {
      if (sidebar) sidebar.classList.add('mobile-visible');
      if (stage) stage.classList.add('mobile-hidden');
      updateActiveTab(btn);
    } else if (tab === 'whatif') {
      const whatIfEvent = new CustomEvent('open-whatif-modal', { bubbles: true });
      document.dispatchEvent(whatIfEvent);
    } else if (tab === 'pins') {
      const pinEvent = new CustomEvent('open-pin-modal', { bubbles: true });
      document.dispatchEvent(pinEvent);
    }
  });

  function updateActiveTab(activeBtn) {
    const btns = bottomNav.querySelectorAll ? bottomNav.querySelectorAll('.ios-tab-btn') : [];
    if (btns && btns.length) {
      btns.forEach(b => {
        if (b === activeBtn) b.classList.add('is-active');
        else b.classList.remove('is-active');
      });
    }
  }

  // Modals Container for Export / Pin / What-If modals
  const modalsContainer = document.createElement('div');
  modalsContainer.id = 'modals-container';
  app.appendChild(modalsContainer);
}

/**
 * Register PWA Service Worker for offline resilience
 */
function registerServiceWorker() {
  if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[GPF PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[GPF PWA] Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Fetch NAV data and mount interactive MetricCards, PlanSelector, ChartView, and Modals
 */
async function initComponents() {
  const metricCardsContainer = document.getElementById('metric-cards-container');
  const planSelectorContainer = document.getElementById('plan-selector-container');
  const chartContainer = document.getElementById('chart-container');

  try {
    const [summaryData, chartData, historyData] = await Promise.all([
      fetchSummary(),
      fetchChartData(),
      fetchFullHistory()
    ]);

    const savedPlan = (typeof localStorage !== 'undefined' && summaryData?.plans)
      ? localStorage.getItem('gpf_primary_plan')
      : null;
    const defaultPlan = (savedPlan && summaryData?.plans?.[savedPlan]) ? savedPlan : 'แผนเชิงรุก 35';

    if (summaryData?.latestDate) {
      setLatestDate(formatThaiDate(summaryData.latestDate));
    }

    if (metricCardsContainer) {
      metricCardsInstance = renderMetricCards(metricCardsContainer, {
        summaryData,
        historyData,
        activePlanKey: defaultPlan
      });
    }

    if (planSelectorContainer) {
      planSelectorInstance = renderPlanSelector(planSelectorContainer, {
        summaryData,
        defaultPlan,
        activePlans: [defaultPlan]
      });
    }

    if (chartContainer) {
      chartViewInstance = renderChartView(chartContainer, {
        chartData,
        historyData,
        summaryData,
        primaryPlan: defaultPlan,
        activePlans: [defaultPlan],
        defaultTimeframe: '1Y'
      });
    }

    const modalsContainer = document.getElementById('modals-container');
    if (modalsContainer) {
      whatIfModalInstance = renderWhatIfModal(modalsContainer, {
        historyData,
        summaryData,
        defaultPlanA: defaultPlan,
        defaultPlanB: 'แผนหุ้นต่างประเทศ'
      });

      pinModalInstance = renderPinModal(modalsContainer, {
        summaryData,
        defaultPlan
      });

      exportModalInstance = renderExportModal(modalsContainer);

      terminalStatusModalInstance = renderTerminalStatusModal(modalsContainer, {
        getSummaryData: () => summaryData
      });

      const cachedVisitVersion = (typeof localStorage !== 'undefined' && localStorage.getItem('gpf_visit_version')) || 'v1.1278';

      devModalInstance = renderDevModal(modalsContainer, {
        version: cachedVisitVersion,
        author: 'KⓇU M00 ¥EO'
      });

      // Background non-blocking sync: increment & fetch live visit counter from GAS
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const gasUrl = 'https://script.google.com/macros/s/AKfycbzlJ-0h4z96CmQx2Ii3yN3RYdO-V8uh2PpLc9VEnfPfYHZN__oV-Rzy7uWseLT52Whw/exec?action=history';
        window.fetch(gasUrl)
          .then(res => res.json())
          .then(data => {
            if (data && data.visitCount) {
              const v = Math.floor(data.visitCount / 10000) + 1;
              const rem = (data.visitCount % 10000).toString().padStart(4, '0');
              const verStr = `v${v}.${rem}`;
              if (devModalInstance && typeof devModalInstance.setVersion === 'function') {
                devModalInstance.setVersion(verStr);
              }
              localStorage.setItem('gpf_visit_version', verStr);
            }
          })
          .catch(err => {
            console.log('[Visit Counter] Offline or background sync note:', err.message);
          });
      }
    }

    // Connect plan-change event listener to update MetricCards and ChartView
    document.addEventListener('plan-change', (event) => {
      const { primaryPlan, activePlans } = event.detail || {};
      if (primaryPlan && metricCardsInstance) {
        metricCardsInstance.setPlan(primaryPlan);
      }
      if (primaryPlan && chartViewInstance && typeof chartViewInstance.setPrimaryPlan === 'function') {
        chartViewInstance.setPrimaryPlan(primaryPlan);
      }
      if (activePlans && chartViewInstance) {
        chartViewInstance.updateActivePlans(activePlans);
      }

      // On mobile / iOS, ONLY switch back to chart tab if user explicitly tapped to change the primary plan
      if (event.detail?.isPrimaryChange && typeof window !== 'undefined' && window.innerWidth <= 1024) {
        const stageBtn = document.querySelector('.ios-tab-btn[data-tab="stage"]');
        if (stageBtn && !stageBtn.classList.contains('is-active')) {
          stageBtn.click();
        }
      }
    });

    // Connect select-primary-plan (e.g. from Momentum Leaderboard)
    document.addEventListener('select-primary-plan', (event) => {
      const targetPlan = event.detail?.plan;
      if (targetPlan && planSelectorInstance) {
        planSelectorInstance.setPrimaryPlan(targetPlan);
      } else if (targetPlan) {
        if (metricCardsInstance) metricCardsInstance.setPlan(targetPlan);
        if (chartViewInstance) chartViewInstance.setPrimaryPlan(targetPlan);
      }
    });

    // Theme reactivity for ChartView
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        // Theme toggle updates document attribute; get target theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        if (chartViewInstance) {
          chartViewInstance.setTheme(currentTheme);
        }
      });
    }

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'data-theme') {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            if (chartViewInstance) {
              chartViewInstance.setTheme(currentTheme);
            }
          }
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }
  } catch (err) {
    console.error('[GPF Dashboard] Failed to load data:', err);
    if (metricCardsContainer) {
      metricCardsContainer.innerHTML = `
        <div class="metric-cards-empty">
          <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}</p>
        </div>
      `;
    }
  }
}

let initialized = false;
async function bootstrap() {
  if (initialized) return;
  initialized = true;
  initTheme();
  initLayout();
  registerServiceWorker();
  await initComponents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

export {
  bootstrap,
  metricCardsInstance,
  planSelectorInstance,
  chartViewInstance,
  whatIfModalInstance,
  pinModalInstance,
  exportModalInstance,
  devModalInstance,
  registerServiceWorker,
};
