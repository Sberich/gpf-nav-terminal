(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=e(a);fetch(a.href,i)}})();const Pt=`
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
`,At=`
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
</svg>
`,Yt=`
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
  <polyline points="7 10 12 15 17 10"></polyline>
  <line x1="12" y1="15" x2="12" y2="3"></line>
</svg>
`,jt=`
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
`,Rt=`
<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="17" x2="12" y2="22"></line>
  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
</svg>
`;function zt(s){const t=document.getElementById("header-update-text");t&&s&&(t.textContent=s.startsWith("อัปเดต")?s:`อัปเดต: ${s}`)}function Ut(s){var h,p;if(!s)return;const t=document.documentElement.getAttribute("data-theme")||"dark",e=`
    <header class="app-header">
      <div class="header-container">
        <div class="header-brand">
          <div class="logo-badge" title="กองทุนบำเหน็จบำนาญข้าราชการ">GPF</div>
          <div class="title-group">
            <h1 class="logo-title">GPF NAV Terminal</h1>
            <div class="logo-sub-row">
              <span class="logo-sub">กระดานเทรดกองทุน กบข.</span>
              <span class="live-badge">
                <span class="live-dot"></span>
                <span>TERMINAL</span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-center-info">
          <div class="header-update-badge" id="header-update-badge" title="วันทำการล่าสุดที่มีการสรุปข้อมูล NAV">
            <span class="update-pulse-dot"></span>
            <span id="header-update-text">อัปเดต: วันทำการล่าสุด</span>
          </div>
        </div>

        <div class="header-actions">
          <button id="btn-open-whatif" class="btn-action" title="จำลองผลตอบแทนเปรียบเทียบ (What-If)">
            ${jt}
            <span class="btn-text">จำลองผลตอบแทน</span>
          </button>

          <button id="btn-open-pins" class="btn-action" title="ปักหมุดระดับราคาเป้าหมาย">
            ${Rt}
            <span class="btn-text">ปักหมุดราคา</span>
          </button>

          <button id="btn-export-modal" class="btn-action secret-export-btn" style="display: none;" title="ดาวน์โหลดข้อมูล Excel / CSV">
            ${Yt}
            <span class="btn-text">ดาวน์โหลดข้อมูล</span>
          </button>

          <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme" title="สลับโหมดหน้าจอ (มืด/สว่าง)">
            ${t==="dark"?Pt:At}
          </button>
        </div>
      </div>
    </header>
  `;s.insertAdjacentHTML("afterbegin",e);let n=0,a=null;const i=s.querySelector?s.querySelector(".logo-badge"):document.querySelector(".logo-badge");i&&(i.style.cursor="pointer",i.title="ข้อมูลผู้พัฒนา (คลิก) / ประตูทางลับดาวน์โหลด (คลิก 3 ครั้ง)",i.addEventListener("click",()=>{if(n++,clearTimeout(a),a=setTimeout(()=>{if(n===1){const u=new CustomEvent("open-dev-modal",{bubbles:!0});document.dispatchEvent(u),typeof window<"u"&&window.dispatchEvent&&window.dispatchEvent(u)}n=0},350),n>=3){n=0;const u=document.getElementById("btn-export-modal");if(u)u.click();else{const f=new CustomEvent("open-export-modal",{bubbles:!0});document.dispatchEvent(f)}}}));const o=s.querySelector?s.querySelector(".logo-title"):document.querySelector(".logo-title");o&&(o.style.cursor="pointer",o.title="ข้อมูลผู้พัฒนา",o.addEventListener("click",()=>{const u=new CustomEvent("open-dev-modal",{bubbles:!0});document.dispatchEvent(u),typeof window<"u"&&window.dispatchEvent&&window.dispatchEvent(u)})),typeof document<"u"&&typeof document.addEventListener=="function"&&document.addEventListener("keydown",u=>{if((u.ctrlKey||u.metaKey)&&u.shiftKey&&(u.key==="E"||u.key==="e")){u.preventDefault();const f=document.getElementById("btn-export-modal");if(f)f.click();else{const y=new CustomEvent("open-export-modal",{bubbles:!0});document.dispatchEvent(y)}}});const r=document.getElementById("btn-open-whatif")||((h=s.querySelector)==null?void 0:h.call(s,"#btn-open-whatif"));r&&r.addEventListener("click",()=>{const u=new CustomEvent("open-whatif-modal",{bubbles:!0});document.dispatchEvent(u),window.dispatchEvent(u)});const l=document.getElementById("btn-open-pins")||((p=s.querySelector)==null?void 0:p.call(s,"#btn-open-pins"));l&&l.addEventListener("click",()=>{const u=new CustomEvent("open-pin-modal",{bubbles:!0});document.dispatchEvent(u),window.dispatchEvent(u)});const c=document.getElementById("btn-export-modal");c&&c.addEventListener("click",()=>{const u=new CustomEvent("open-export-modal",{bubbles:!0});document.dispatchEvent(u),window.dispatchEvent(u)});const d=document.getElementById("theme-toggle");d&&d.addEventListener("click",()=>{const f=(document.documentElement.getAttribute("data-theme")||"dark")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",f),localStorage.setItem("theme",f),d.innerHTML=f==="dark"?Pt:At})}let R=null,z=null,U=null;async function nt(s,t){if(typeof window<"u"&&typeof window.document<"u"&&window.location&&!!window.location.origin&&typeof window.fetch=="function"){const n=[`./${s.replace(/^\.?\//,"")}`,s,`./${t.replace(/^\.?\//,"")}`,t];for(const a of n)try{const i=await window.fetch(`${a}?t=${Date.now()}`);if(i&&i.ok)return await i.json()}catch{}}try{const n="node:fs",a="node:path",i=await import(n),r=(await import(a)).resolve(t);if(i.existsSync(r)){const l=i.readFileSync(r,"utf8");return JSON.parse(l)}}catch{}if(typeof globalThis.fetch=="function"&&s.startsWith("http"))try{const n=await globalThis.fetch(s);if(n.ok)return await n.json()}catch{}throw new Error(`Failed to load JSON data from ${s} or ${t}`)}async function J(s={}){return R&&!s.forceReload||(R=await nt("/data/nav_summary.json","public/data/nav_summary.json")),R}async function qt(s={}){return z&&!s.forceReload||(z=await nt("/data/nav_chart.json","public/data/nav_chart.json")),z}async function at(s={}){return U&&!s.forceReload||(U=await nt("/data/nav_history.json","public/data/nav_history.json")),U}const Wt=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];function tt(s){if(!s||typeof s!="string")return"-";const t=s.split("-");if(t.length<3)return s;const e=parseInt(t[0],10),n=parseInt(t[1],10)-1,a=parseInt(t[2],10),i=e>2400?e:e+543;return`${a} ${Wt[n]||""} ${i}`}function I(s){return s==null||isNaN(s)?"-":Number(s).toFixed(4)}function W(s,t=!0){if(s==null||isNaN(s))return"-";const e=Number(s);return`${e>0&&t?"+":""}${e.toFixed(2)}%`}function Kt(s){if(s==null||isNaN(s))return"-";const t=Number(s);return`${t>0?"+":""}${t.toFixed(4)} ฿`}class Gt{constructor(t,e={}){this.container=typeof t=="string"?document.querySelector(t):t,this.summaryData=e.summaryData||null,this.historyData=e.historyData||null,this.activePlanKey=e.activePlanKey||"แผนเชิงรุก 35",this.render()}setPlan(t){var e,n;if(!((n=(e=this.summaryData)==null?void 0:e.plans)!=null&&n[t])){console.warn(`[MetricCards] Plan not found: ${t}`);return}this.activePlanKey=t,this.render()}setData(t,e,n){this.summaryData=t,n&&(this.historyData=n),e&&(this.activePlanKey=e),this.render()}render(){var rt,lt,ct,dt,ut,ht,pt,ft,mt,vt,yt,gt,bt,wt,xt,St,Et;if(!this.container)return;const t=(lt=(rt=this.summaryData)==null?void 0:rt.plans)==null?void 0:lt[this.activePlanKey];if(!t){this.container.innerHTML=`
        <div class="metric-cards-empty">
          <p>กำลังโหลดข้อมูลสถิติหรือไม่มีข้อมูลแผน ${this.activePlanKey}</p>
        </div>
      `;return}const e=this.summaryData.latestDate||"",n=tt(e),a=t.change!=null&&!isNaN(t.change),i=a&&Number(t.change)>=0,o=a?i?"▲":"▼":"",r=a?i?"trend-up":"trend-down":"trend-neutral";let l=null,c=null;if((ct=this.summaryData)!=null&&ct.plans)for(const[C,E]of Object.entries(this.summaryData.plans)){const S=E.changePct;S!=null&&!isNaN(S)&&((!l||S>l.changePct)&&(l={name:C,changePct:S}),(!c||S<c.changePct)&&(c={name:C,changePct:S}))}const d=(dt=t.returns)==null?void 0:dt.YTD,h=d!=null&&!isNaN(d),p=h&&Number(d)>=0,u=h?p?"trend-up":"trend-down":"trend-neutral",f=h?u:"badge-neutral",y=h?p?"▲ กำไร":"▼ ขาดทุน":"-";let b=null,P=0;if((ut=this.summaryData)!=null&&ut.plans){const C=Object.entries(this.summaryData.plans).map(([S,M])=>{var D;return{key:S,ytd:(D=M.returns)==null?void 0:D.YTD}}).filter(S=>S.ytd!=null&&!isNaN(S.ytd)).sort((S,M)=>M.ytd-S.ytd);P=C.length;const E=C.findIndex(S=>S.key===this.activePlanKey);E!==-1&&(b=E+1)}let w=null;if(this.historyData&&Array.isArray(this.historyData)){const C=this.historyData.map(E=>{var S;return{date:E.date,val:(S=E.plans)==null?void 0:S[this.activePlanKey]}}).filter(E=>E.val!=null&&!isNaN(E.val));if(C.length>=20){const E=C.slice(-20),M=E.reduce((It,Vt)=>It+Vt.val,0)/20,D=E[E.length-1].val,F=(D-M)/M*100,Ht=D>=M;w={sma:M,lastVal:D,diffPct:F,above:Ht}}}let m=((ht=t.ath)==null?void 0:ht.nav)||t.latestNav,v=((pt=t.atl)==null?void 0:pt.nav)||t.latestNav,g=null,x=null;if(this.historyData&&Array.isArray(this.historyData)){const C=this.historyData.map(E=>{var S;return{date:E.date,val:(S=E.plans)==null?void 0:S[this.activePlanKey]}}).filter(E=>E.val!=null&&!isNaN(E.val));if(C.length>0){const E=C[C.length-1].date,S=new Date(new Date(E).getTime()-365*864e5).toISOString().split("T")[0],D=C.filter(F=>F.date>=S).map(F=>F.val);if(D.length>0){m=Math.max(...D),v=Math.min(...D);const F=D[D.length-1];m>0&&(g=(F-m)/m*100),m>v?x=(F-v)/(m-v)*100:x=50}}}else((ft=t.ath)==null?void 0:ft.nav)!=null&&t.latestNav!=null&&(m=t.ath.nav,v=((mt=t.atl)==null?void 0:mt.nav)??t.latestNav,g=(t.latestNav-m)/m*100,x=m>v?(t.latestNav-v)/(m-v)*100:50);let $="badge-neutral",A="เทียบ High รอบปี";g!=null&&(g>-1?($="badge-danger",A="🚨 ระวังการย่อตัว"):g>-5?($="badge-neutral",A="รอย่อตัวเพิ่ม"):($="badge-success",A="🛒 ย่อตัวลึก ทยอยสะสม"));let N="badge-neutral",k="ตำแหน่งในกรอบปี";x!=null&&(x>=80?(N="badge-danger",k="🚨 โซนแพง ระวังจุดสูงสุด"):x>=40?(N="badge-neutral",k="โซนกลางๆ"):(N="badge-success",k="🛒 โซนถูก น่าสะสม"));let T="—",j="ข้อมูลไม่พอ",X="badge-neutral";w&&(Math.abs(w.diffPct)<.05?(T="➖ ไซด์เวย์",j=`ไม่มีเทรนด์ชัด (${w.diffPct>=0?"+":""}${w.diffPct.toFixed(2)}%)`,X="badge-neutral"):(T=w.above?"📈 ขาขึ้น":"📉 ขาลง",j=`NAV ${w.above?">":"<"} SMA20 (${w.diffPct>=0?"+":""}${w.diffPct.toFixed(2)}%)`,X=w.above?"badge-success":"badge-danger")),(vt=t.returns)==null||vt["1Y"];const it=(yt=t.returns)==null?void 0:yt["3Y_annualized"],ot=(gt=t.returns)==null?void 0:gt["5Y_annualized"];(bt=t.returns)==null||bt["3Y_cumulative"],(wt=t.returns)==null||wt["5Y_cumulative"];const Ot=I((xt=t.ath)==null?void 0:xt.nav);tt((St=t.ath)==null?void 0:St.date),I((Et=t.atl)==null?void 0:Et.nav),this.container.innerHTML=`
      <div class="metric-cards-grid terminal-ticker-bar animate-fade-in">
        <!-- 1. ข้อมูลล่าสุด -->
        <div class="metric-card ticker-card card-date">
          <div class="stat-label">ข้อมูลล่าสุด</div>
          <div class="stat-val date-val">${n}</div>
          <div class="stat-sub">วันทำการล่าสุด</div>
        </div>

        <!-- 2. แผนอ้างอิง + NAV ล่าสุด -->
        <div class="metric-card ticker-card card-latest-nav">
          <div class="stat-label">
            <span class="plan-color-dot" style="background-color: ${t.color}"></span>
            <span class="plan-key-text">${t.key} (อ้างอิง)</span>
          </div>
          <div class="stat-val nav-value ${r}">
            <span class="nav-number">${I(t.latestNav)}</span>
            <span class="nav-unit">฿</span>
          </div>
          <div class="stat-sub ${r}">
            ${o} ${Kt(t.change)} (${W(t.changePct)})
          </div>
        </div>

        <!-- 3. ดีสุดวันนี้ -->
        <div class="metric-card ticker-card card-best">
          <div class="stat-label">ดีสุดวันนี้</div>
          <div class="stat-val text-truncate" title="${(l==null?void 0:l.name)||"-"}">
            ${(l==null?void 0:l.name)||"-"}
          </div>
          <div class="stat-sub trend-up">
            ${(l==null?void 0:l.changePct)!=null?`+${Number(l.changePct).toFixed(2)}%`:"-"}
          </div>
        </div>

        <!-- 4. แย่สุดวันนี้ -->
        <div class="metric-card ticker-card card-worst">
          <div class="stat-label">แย่สุดวันนี้</div>
          <div class="stat-val text-truncate" title="${(c==null?void 0:c.name)||"-"}">
            ${(c==null?void 0:c.name)||"-"}
          </div>
          <div class="stat-sub trend-down">
            ${(c==null?void 0:c.changePct)!=null?`${Number(c.changePct).toFixed(2)}%`:"-"}
          </div>
        </div>

        <!-- 5. YTD (ต้นปี) & อันดับ -->
        <div class="metric-card ticker-card card-ytd">
          <div class="stat-label">YTD (ผลตอบแทนปีนี้)</div>
          <div class="stat-val ${u}">
            ${W(d)}
          </div>
          <div class="stat-sub ${f}">
            ${b?`อันดับ ${b}/${P} ใน 15 แผน`:h?y:"-"}
          </div>
        </div>

        <!-- 6. High / Low ช่วงปี -->
        <div class="metric-card ticker-card card-range">
          <div class="stat-label">High / Low (ช่วงปี)</div>
          <div class="stat-val stat-val-dual">
            <span class="range-high">▲ ${I(m)}</span>
            <span class="range-low">▼ ${I(v)}</span>
          </div>
          <div class="stat-sub">สถิติ 1 ปีย้อนหลัง</div>
        </div>

        <!-- 7. 📉 ย่อตัวจากจุดสูงสุด -->
        <div class="metric-card ticker-card card-drawdown">
          <div class="stat-label">📉 ย่อตัวจากจุดสูงสุด</div>
          <div class="stat-val ${g!=null&&g>=0?"trend-up":"trend-down"}">
            ${g!=null?`${g.toFixed(2)}%`:"-"}
          </div>
          <div class="stat-sub ${$}">
            ${A}
          </div>
        </div>

        <!-- 8. 🎯 ตำแหน่งราคา -->
        <div class="metric-card ticker-card card-zone">
          <div class="stat-label">🎯 ตำแหน่งราคา</div>
          <div class="stat-val">
            ${x!=null?`${x.toFixed(0)}%`:"-"}
          </div>
          <div class="stat-sub ${N}">
            ${k}
          </div>
        </div>

        <!-- 9. 🚀 แนวโน้มระยะสั้น (SMA20) -->
        <div class="metric-card ticker-card card-trend">
          <div class="stat-label">🚀 แนวโน้มระยะสั้น</div>
          <div class="stat-val">
            ${T}
          </div>
          <div class="stat-sub ${X}">
            ${j}
          </div>
        </div>

        <!-- 10. ผลตอบแทนเฉลี่ยต่อปี (CAGR) & ATH -->
        <div class="metric-card ticker-card card-cagr-ath">
          <div class="stat-label">เฉลี่ยต่อปี (CAGR) & ATH</div>
          <div class="stat-val stat-val-dual">
            <span title="CAGR 3 ปี">3Y: ${it!=null?W(it):"-"}</span>
            <span title="CAGR 5 ปี">5Y: ${ot!=null?W(ot):"-"}</span>
          </div>
          <div class="stat-sub">
            ATH สูงสุด: ${Ot} ฿
          </div>
        </div>
      </div>
    `}}function Jt(s,t){return new Gt(s,t)}const $t=[{id:"active",title:"แผนเชิงรุก",subtitle:"Active Allocation (4 แผน)",plans:["แผนเชิงรุก 20","แผนเชิงรุก 35","แผนเชิงรุก 65","แผนเชิงรุก 75"]},{id:"fixed_income",title:"ตลาดเงินและตราสารหนี้",subtitle:"Fixed Income (3 แผน)",plans:["แผนเงินฝากและตราสารหนี้ระยะสั้น","แผนตราสารหนี้","แผนตราสารหนี้ต่างประเทศ"]},{id:"equity",title:"หุ้นและอสังหาริมทรัพย์",subtitle:"Equities & Real Estate (3 แผน)",plans:["แผนหุ้นไทย","แผนหุ้นต่างประเทศ","แผนกองทุนอสังหาริมทรัพย์ไทย"]},{id:"special",title:"แผนพิเศษและทางเลือก",subtitle:"Specialized Plans (5 แผน)",plans:["แผนทองคำ","แผนกองทุนรวมวายุภักษ์","แผนการลงทุนตามหลักชะรีอะฮ์","แผนลงทุนพื้นฐานทั่วไป","แผนเกษียณสบายใจ 2569"]}];class Xt{constructor(t,e={}){var i,o,r;this.container=typeof t=="string"?document.querySelector(t):t,this.summaryData=e.summaryData||null;const n=typeof localStorage<"u"&&((i=e.summaryData)!=null&&i.plans)?localStorage.getItem("gpf_primary_plan"):null;this.primaryPlan=n&&((r=(o=e.summaryData)==null?void 0:o.plans)!=null&&r[n])?n:e.defaultPlan||e.primaryPlan||"แผนเชิงรุก 35";const a=e.activePlans||[this.primaryPlan];this.activePlans=new Set(a),this.activePlans.add(this.primaryPlan),this.collapsedCategories=new Set,this.render()}setData(t){this.summaryData=t,this.render()}selectPlan(t){if(t){this.primaryPlan=t,this.activePlans.add(t);try{typeof localStorage<"u"&&localStorage.setItem("gpf_primary_plan",t)}catch{}this.dispatchChange(),this.updateActiveStyles()}}togglePlanSelection(t){t&&(this.activePlans.has(t)?this.activePlans.size>1&&(this.activePlans.delete(t),this.primaryPlan===t&&(this.primaryPlan=Array.from(this.activePlans)[0])):(this.activePlans.add(t),this.primaryPlan=t),this.dispatchChange(),this.updateActiveStyles())}selectAll(){$t.forEach(t=>{t.plans.forEach(e=>this.activePlans.add(e))}),this.dispatchChange(),this.updateActiveStyles()}deselectAll(){this.activePlans=new Set([this.primaryPlan]),this.dispatchChange(),this.updateActiveStyles()}selectOnly(t){t&&(this.activePlans=new Set([t]),this.primaryPlan=t,this.dispatchChange(),this.updateActiveStyles())}toggleCategory(t){this.collapsedCategories.has(t)?this.collapsedCategories.delete(t):this.collapsedCategories.add(t),this.render()}dispatchChange(){const t={activePlans:Array.from(this.activePlans),primaryPlan:this.primaryPlan},e=new CustomEvent("plan-change",{detail:t,bubbles:!0});this.container&&typeof this.container.dispatchEvent=="function"&&this.container.dispatchEvent(e)}updateActiveStyles(){var e;const t=(e=this.container)!=null&&e.querySelectorAll?this.container.querySelectorAll(".plan-pill"):[];if(t&&t.length>0){t.forEach(a=>{var h,p,u,f,y;const i=((h=a.dataset)==null?void 0:h.plan)||((p=a.getAttribute)==null?void 0:p.call(a,"data-plan"));if(!i)return;const o=this.activePlans.has(i),r=this.primaryPlan===i;o?a.classList.add("is-selected"):a.classList.remove("is-selected"),r?a.classList.add("is-primary"):a.classList.remove("is-primary");const l=a.querySelector?a.querySelector(".plan-checkbox"):null;l&&(l.checked=o);const c=a.querySelector?a.querySelector(".primary-tag"):null;c&&c.style&&(c.style.display=r?"inline-block":"none");const d=a.querySelector?a.querySelector(".custom-check"):null;if(d&&d.style){const b=((f=(u=a.style)==null?void 0:u.getPropertyValue)==null?void 0:f.call(u,"--plan-color"))||((y=a.style)==null?void 0:y["--plan-color"]);d.style.backgroundColor=o?b||"var(--plan-color)":"transparent"}});const n=this.container.querySelector?this.container.querySelector(".selected-count-badge"):null;n&&(n.textContent=`${this.activePlans.size}/15 แผน`)}else this.render()}render(){var n;if(!this.container)return;const t=((n=this.summaryData)==null?void 0:n.plans)||{};let e="";for(const a of $t){const i=this.collapsedCategories.has(a.id),o=i?"▶":"▼";let r="";for(const l of a.plans){const c=t[l]||{},d=c.color||"#2196F3",h=this.activePlans.has(l),p=this.primaryPlan===l,u=c.latestNav!=null?Number(c.latestNav).toFixed(4):"-",f=c.changePct,y=f!=null&&!isNaN(f),b=y&&f>=0,P=y?`${b?"+":""}${Number(f).toFixed(2)}%`:"-";r+=`
          <div class="plan-pill ${h?"is-selected":""} ${p?"is-primary":""}"
               data-plan="${l}"
               style="--plan-color: ${d}">
            <label class="plan-checkbox-wrapper" title="เปิด/ปิดการเปรียบเทียบในกราฟ">
              <input type="checkbox" class="plan-checkbox" data-plan="${l}" ${h?"checked":""} />
              <span class="custom-check" style="background-color: ${h?d:"transparent"}; border-color: ${d}"></span>
            </label>
            <div class="plan-info" title="คลิกเพื่อเลือกแผนนี้เป็นแผนอ้างอิง">
              <span class="plan-swatch" style="background-color: ${d}"></span>
              <div class="plan-name-wrap">
                <span class="plan-name">${l}</span>
                <span class="primary-tag" style="display: ${p?"inline-block":"none"}">หลัก</span>
              </div>
            </div>
            <div class="plan-price-col">
              <span class="plan-nav-val">${u}</span>
              <span class="plan-chg-pill ${y?b?"up":"down":"neutral"}">${P}</span>
            </div>
            <button class="btn-only-this" data-only="${l}" title="เลือกดูเฉพาะแผนนี้">เฉพาะ</button>
          </div>
        `}e+=`
        <div class="plan-category-group ${i?"collapsed":""}" data-cat="${a.id}">
          <div class="plan-category-header" data-toggle-cat="${a.id}">
            <div class="cat-title-wrap">
              <span class="cat-chevron">${o}</span>
              <span class="cat-title">${a.title}</span>
            </div>
            <span class="cat-count-badge">${a.plans.length}</span>
          </div>
          <div class="plan-pills-container ${i?"hidden":""}">
            <div class="plan-pills">
              ${r}
            </div>
          </div>
        </div>
      `}this.container.innerHTML=`
      <div class="plan-selector watchlist-sidebar-card animate-fade-in">
        <div class="watchlist-header">
          <div class="watchlist-title-row">
            <span class="watchlist-title">กระดานราคา (Watchlist)</span>
            <span class="selected-count-badge">${this.activePlans.size}/15 แผน</span>
          </div>
          <div class="watchlist-hint">คลิกชื่อเพื่อเปลี่ยนแผนหลัก หรือติ๊กถูกเพื่อเทียบกราฟ</div>
        </div>

        <div class="plan-categories-list watchlist-scroll-area">
          ${e}
        </div>

        <div class="watchlist-footer">
          <div class="selector-quick-actions">
            <button id="btn-select-all" class="btn-quick-action" title="เลือกแสดงผลทุกแผน">เลือกทั้งหมด</button>
            <button id="btn-select-default" class="btn-quick-action" title="ซ่อนแผนอื่น เหลือเฉพาะแผนหลัก">ซ่อนทั้งหมด</button>
          </div>
        </div>
      </div>
    `,this.bindEvents()}bindEvents(){if(!this.container||!this.container.querySelectorAll)return;const t=this.container.querySelector?this.container.querySelector("#btn-select-all"):null;t&&typeof t.addEventListener=="function"&&t.addEventListener("click",()=>this.selectAll());const e=this.container.querySelector?this.container.querySelector("#btn-select-default"):null;e&&typeof e.addEventListener=="function"&&e.addEventListener("click",()=>this.deselectAll());const n=this.container.querySelectorAll(".plan-category-header");n&&n.length&&n.forEach(i=>{typeof i.addEventListener=="function"&&i.addEventListener("click",o=>{var l;const r=((l=i.dataset)==null?void 0:l.toggleCat)||i.getAttribute("data-toggle-cat");r&&this.toggleCategory(r)})});const a=this.container.querySelectorAll(".plan-pill");a&&a.length&&a.forEach(i=>{var h;const o=((h=i.dataset)==null?void 0:h.plan)||i.getAttribute("data-plan"),r=i.querySelector?i.querySelector(".plan-info"):null;r&&typeof r.addEventListener=="function"&&r.addEventListener("click",p=>{p.stopPropagation(),this.selectPlan(o)});const l=i.querySelector?i.querySelector(".plan-price-col"):null;l&&typeof l.addEventListener=="function"&&l.addEventListener("click",p=>{p.stopPropagation(),this.selectPlan(o)});const c=i.querySelector?i.querySelector(".plan-checkbox"):null;c&&typeof c.addEventListener=="function"&&c.addEventListener("click",p=>{p.stopPropagation(),this.togglePlanSelection(o)});const d=i.querySelector?i.querySelector(".btn-only-this"):null;d&&typeof d.addEventListener=="function"&&d.addEventListener("click",p=>{p.stopPropagation(),this.selectOnly(o)})})}}function Zt(s,t){return new Xt(s,t)}const Qt="modulepreload",te=function(s,t){return new URL(s,t).href},Ct={},ee=function(t,e,n){let a=Promise.resolve();if(e&&e.length>0){const o=document.getElementsByTagName("link"),r=document.querySelector("meta[property=csp-nonce]"),l=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));a=Promise.allSettled(e.map(c=>{if(c=te(c,n),c in Ct)return;Ct[c]=!0;const d=c.endsWith(".css"),h=d?'[rel="stylesheet"]':"";if(!!n)for(let f=o.length-1;f>=0;f--){const y=o[f];if(y.href===c&&(!d||y.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${h}`))return;const u=document.createElement("link");if(u.rel=d?"stylesheet":Qt,d||(u.as="script"),u.crossOrigin="",u.href=c,l&&u.setAttribute("nonce",l),document.head.appendChild(u),d)return new Promise((f,y)=>{u.addEventListener("load",f),u.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${c}`)))})}))}function i(o){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=o,window.dispatchEvent(r),!r.defaultPrevented)throw o}return a.then(o=>{for(const r of o||[])r.status==="rejected"&&i(r.reason);return t().catch(i)})},st="gpf_pinned_levels_v1";let _t={};function Bt(){return typeof globalThis<"u"&&globalThis.localStorage?globalThis.localStorage:typeof window<"u"&&window.localStorage?window.localStorage:null}function K(s={}){const t=typeof CustomEvent<"u"?new CustomEvent("pins-changed",{bubbles:!0,detail:s}):{type:"pins-changed",detail:s,bubbles:!0};if(typeof document<"u"&&typeof document.dispatchEvent=="function")try{document.dispatchEvent(t)}catch{}if(typeof window<"u"&&window!==document&&typeof window.dispatchEvent=="function")try{window.dispatchEvent(t)}catch{}}function Y(){const s=Bt();if(s){try{const t=s.getItem(st);if(t){const e=JSON.parse(t);if(e&&typeof e=="object")return e}}catch(t){console.warn("[pinService] Failed to parse pins from storage:",t)}return{}}return _t}function G(s){const t=Bt();if(t)try{t.setItem(st,JSON.stringify(s))}catch(e){console.error("[pinService] Failed to save pins to storage:",e)}else _t=s}function ne(s){if(!s)return[];const t=Y();return Array.isArray(t[s])?t[s]:[]}function ae(s,t,e=""){if(!s)throw new Error("Plan key is required to add pin");const n=parseFloat(t);if(isNaN(n)||n<=0)throw new Error("Pin value must be a positive number");const a=Y();Array.isArray(a[s])||(a[s]=[]);const i={id:`pin_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,value:Number(n.toFixed(4)),note:String(e||"").trim(),createdAt:new Date().toISOString()};return a[s].push(i),G(a),K({action:"add",planKey:s,pin:i,pins:a[s]}),i}function se(s,t){if(!s||!t)return!1;const e=Y();if(!Array.isArray(e[s]))return!1;const n=e[s].length;return e[s]=e[s].filter(a=>a.id!==t),e[s].length!==n?(e[s].length===0&&delete e[s],G(e),K({action:"remove",planKey:s,pinId:t,pins:e[s]||[]}),!0):!1}function ie(s=null){const t=Y();s?(delete t[s],G(t),K({action:"clear",planKey:s,pins:[]})):(G({}),K({action:"clearAll",pins:{}}))}const O={STORAGE_KEY:st,getPins:Y,getPinsForPlan:ne,addPin:ae,removePin:se,clearPins:ie};function V(s,t=2800){if(typeof document>"u")return;let e=document.getElementById("gpf-toast-container");e||(e=document.createElement("div"),e.id="gpf-toast-container",e.className="gpf-toast-container",document.body.appendChild(e));const n=document.createElement("div");n.className="gpf-toast",n.innerHTML=`<span>${s}</span>`,e.appendChild(n),setTimeout(()=>{n.classList.add("fade-out"),setTimeout(()=>{n.parentNode&&n.parentNode.removeChild(n)},300)},t)}const Z=["1M","3M","6M","YTD","1Y","3Y","5Y","ALL"],oe={"1M":30,"3M":91,"6M":182,"1Y":365,"3Y":1095,"5Y":1826},kt=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."],B={"แผนเชิงรุก 20":"#00BCD4","แผนเชิงรุก 35":"#2196F3","แผนเชิงรุก 65":"#E91E63","แผนเชิงรุก 75":"#8BC34A",แผนเงินฝากและตราสารหนี้ระยะสั้น:"#607D8B",แผนตราสารหนี้:"#FF9800",แผนตราสารหนี้ต่างประเทศ:"#009688",แผนหุ้นไทย:"#F44336",แผนหุ้นต่างประเทศ:"#9C27B0",แผนกองทุนอสังหาริมทรัพย์ไทย:"#FF5722",แผนทองคำ:"#FFC107",แผนกองทุนรวมวายุภักษ์:"#3F51B5",แผนการลงทุนตามหลักชะรีอะฮ์:"#FF6F00",แผนลงทุนพื้นฐานทั่วไป:"#4CAF50","แผนเกษียณสบายใจ 2569":"#FF6F00"};function H(s){if(s instanceof Date)return s;if(typeof s=="string"){const t=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);if(t)return new Date(Date.UTC(Number(t[1]),Number(t[2])-1,Number(t[3])))}return new Date(s)}function re(s){const t=s.getUTCFullYear(),e=String(s.getUTCMonth()+1).padStart(2,"0"),n=String(s.getUTCDate()).padStart(2,"0");return`${t}-${e}-${n}`}function le(s,t){if(s==="ALL")return null;const e=H(t);if(isNaN(e.getTime()))return null;if(s==="YTD")return new Date(Date.UTC(e.getUTCFullYear(),0,1));const n=oe[s];return n!=null?new Date(e.getTime()-n*864e5):null}function et(s,t=null){var e,n;return(n=(e=t==null?void 0:t.plans)==null?void 0:e[s])!=null&&n.color?t.plans[s].color:B[s]||"#388bfd"}function Dt({timeframe:s="1Y",activePlans:t=["แผนเชิงรุก 35"],historyData:e=null,chartData:n=null,summaryData:a=null,referenceDate:i=null,mode:o="nav"}){const r=Array.isArray(t)?t:Array.from(t||["แผนเชิงรุก 35"]),l=r.length>0?r:["แผนเชิงรุก 35"];let c=i?H(i):null;(!c||isNaN(c.getTime()))&&(e&&e.length>0?c=H(e[e.length-1].date):n!=null&&n.dates&&n.dates.length>0?c=H(n.dates[n.dates.length-1]):c=new Date);const d=le(s,c),h=d?re(d):null,u=["1M","3M","6M","YTD","1Y"].includes(s)&&!!(e&&e.length>0);let f=null;if(u){const y=h?e.filter(w=>w.date>=h):e,b=l.map(w=>{const m=y.map(v=>{const g=H(v.date).getTime(),x=v.plans?v.plans[w]??null:null;return[g,x]});return{name:w,data:m}}),P=b.map(w=>et(w.name,a));f={source:"history",timeframe:s,series:b,colors:P}}else if(n&&n.dates){const y=h?n.dates.findIndex(g=>g>=h):0,b=y===-1?0:y,w=n.dates.slice(b).map(g=>H(g).getTime()),m=l.map(g=>{var N;const x=(N=n.series)==null?void 0:N.find(k=>k.name===g),$=x?x.data.slice(b):[],A=w.map((k,T)=>[k,$[T]??null]);return{name:g,data:A}}),v=m.map(g=>et(g.name,a));f={source:"chart",timeframe:s,series:m,colors:v}}else f={source:"empty",timeframe:s,series:[],colors:[]};if(o==="pct"&&f.series.length>0){const y=f.series.map(b=>{let P=null;for(const m of b.data){const v=m[1];if(v!=null&&!isNaN(v)&&v>0){P=v;break}}const w=b.data.map(([m,v])=>{if(v==null||isNaN(v)||!P)return[m,null];const g=(v-P)/P*100;return[m,Number(g.toFixed(2))]});return{name:b.name,data:w}});return{...f,mode:"pct",series:y}}return f}let q=null;async function ce(s=null){if(s)return q=s,q;if(q)return q;if(typeof window<"u"&&window.ApexCharts)return q=window.ApexCharts,q;try{const t=await ee(()=>import("./vendor-BLG5NfbQ.js").then(e=>e.a),[],import.meta.url);return q=t.default||t,q}catch{return null}}function Nt({series:s=[],colors:t=[],themeMode:e="dark",annotations:n=null,mode:a="nav"}){const i=e==="dark",o=i?"#8b949e":"#57606a",r=i?"#1f293d":"#d0d7de",l=a==="pct",c=n?{...n}:{yaxis:[]};return c.yaxis||(c.yaxis=[]),l&&(c.yaxis.some(h=>h.y===0)||c.yaxis.push({y:0,borderColor:"#8b949e",strokeDashArray:4,label:{text:"0.00% (จุดอ้างอิง)",borderColor:"#8b949e",style:{color:"#ffffff",background:"#8b949e",fontSize:"11px",fontFamily:"Sarabun, sans-serif"}}})),{chart:{type:"line",height:450,animations:{enabled:!0,easing:"easeinout",speed:500,dynamicAnimation:{enabled:!0,speed:300}},toolbar:{show:!1},fontFamily:"Sarabun, sans-serif",background:"transparent"},series:s,colors:t,annotations:c,stroke:{curve:"smooth",width:2.5},xaxis:{type:"datetime",labels:{style:{colors:o,fontFamily:"Sarabun, sans-serif",fontSize:"11px"},formatter:(d,h)=>{const p=h||d;if(!p)return"";const u=new Date(p);if(isNaN(u.getTime()))return String(d);const f=u.getUTCDate(),y=kt[u.getUTCMonth()],b=(u.getUTCFullYear()+543)%100;return`${f} ${y} ${b}`}},axisBorder:{color:r},axisTicks:{color:r}},yaxis:{labels:{style:{colors:o,fontFamily:"Sarabun, sans-serif",fontSize:"11px"},formatter:d=>d==null||isNaN(d)?"":l?`${d>0?"+":""}${Number(d).toFixed(2)}%`:Number(d).toFixed(2)},tooltip:{enabled:!0}},tooltip:{shared:!0,intersect:!1,theme:i?"dark":"light",custom:function({series:d,seriesIndex:h,dataPointIndex:p,w:u}){var m,v,g;if(!u||!u.globals)return"";const f=((v=(m=u.globals.seriesX)==null?void 0:m[0])==null?void 0:v[p])||((g=u.globals.categoryLabels)==null?void 0:g[p]);let y="ข้อมูล NAV";if(f){const x=new Date(f);if(!isNaN(x.getTime())){const $=x.getUTCDate(),A=kt[x.getUTCMonth()],N=x.getUTCFullYear()+543;y=`${$} ${A} ${N}`}}let b="";const P=u.globals.seriesNames||[],w=u.globals.colors||[];return P.forEach((x,$)=>{var T;const A=(T=d==null?void 0:d[$])==null?void 0:T[p],N=w[$]||"#388bfd";let k="-";A!=null&&!isNaN(A)&&(l?k=`${A>0?"+":""}${Number(A).toFixed(2)}%`:k=`${Number(A).toFixed(4)} ฿`),b+=`
            <div class="chart-tooltip-row">
              <span class="chart-tooltip-dot" style="background-color: ${N}"></span>
              <span class="chart-tooltip-name">${x}:</span>
              <span class="chart-tooltip-val ${l&&A>0?"up":l&&A<0?"down":""}">${k}</span>
            </div>
          `}),`
          <div class="chart-custom-tooltip">
            <div class="chart-tooltip-header">${y}</div>
            <div class="chart-tooltip-body">${b}</div>
          </div>
        `}},legend:{show:!1},grid:{borderColor:r,strokeDashArray:3,xaxis:{lines:{show:!1}},yaxis:{lines:{show:!0}}},theme:{mode:i?"dark":"light"}}}class de{constructor(t,e={}){var n;this.container=typeof t=="string"?typeof document<"u"?document.querySelector(t):null:t,this.options=e,this.chartData=e.chartData||null,this.historyData=e.historyData||null,this.summaryData=e.summaryData||null,this.activePlans=new Set(e.activePlans||["แผนเชิงรุก 35"]),this.primaryPlan=e.primaryPlan||e.activePlans&&e.activePlans[0]||"แผนเชิงรุก 35",this.currentTimeframe=e.defaultTimeframe||"1Y",this.currentMode=e.defaultMode||"nav",this.currentTheme=e.theme||typeof document<"u"&&((n=document.documentElement)==null?void 0:n.getAttribute("data-theme"))||"dark",this.isAutoFit=typeof localStorage<"u"&&localStorage.getItem("gpf_chart_autofit")==="true",this.chartHeight=450,this.chart=null,this.ApexCharts=e.ApexCharts||null,this._handleClick=this._handleClick.bind(this),this._handlePinsChanged=this._handlePinsChanged.bind(this),this._handleChartDblClick=this._handleChartDblClick.bind(this)}setPrimaryPlan(t){t&&(this.primaryPlan=t)}async init(){if(this.container){try{this.chartData||(this.chartData=await qt()),this.historyData||(this.historyData=await at()),this.summaryData||(this.summaryData=await J())}catch(t){console.warn("[ChartView] Failed to fetch one or more datasets:",t)}this.renderSkeleton(),await this.mountChart()}}renderSkeleton(){if(!this.container)return;const t=Z.map(i=>`<button class="timeframe-btn ${i===this.currentTimeframe?"is-active":""}" data-timeframe="${i}">${i}</button>`).join("");this.container.innerHTML=`
      <div class="chart-wrapper trading-chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h3 class="chart-title">เปรียบเทียบมูลค่าหน่วยลงทุน (NAV)</h3>
            <span class="chart-subtitle">แสดงข้อมูลย้อนหลังตามช่วงเวลาและเปรียบเทียบผลตอบแทน · ดับเบิลคลิกบนกราฟเพื่อปักหมุด</span>
          </div>
          <div class="chart-toolbar">
            <!-- Mode Toggle: NAV จริง vs % เปลี่ยนแปลง -->
            <div class="chart-mode-group" role="group" aria-label="โหมดการแสดงผล">
              <button class="mode-btn ${this.currentMode==="nav"?"is-active":""}" data-mode="nav" title="แสดงมูลค่าหน่วยลงทุนจริง (บาท)">NAV จริง</button>
              <button class="mode-btn ${this.currentMode==="pct"?"is-active":""}" data-mode="pct" title="เปรียบเทียบผลตอบแทนแบบ % (Base 0% จากวันแรกของช่วงที่เลือก)">% เปลี่ยนแปลง</button>
            </div>

            <!-- Timeframe Group -->
            <div class="timeframe-group" role="group" aria-label="ช่วงเวลาแสดงผล">
              ${t}
            </div>

            <!-- Chart Auto-Fit Height Toggle -->
            <button class="chart-action-btn ${this.isAutoFit?"is-active":""}" id="btn-chart-autofit" title="ขยายกราฟให้พอดีความสูงหน้าจอ (Auto-Fit) หรือคืนค่าขนาดเดิม">
              <span>${this.isAutoFit?"↕ ขนาดมาตรฐาน":"⛶ พอดีหน้าจอ"}</span>
            </button>
          </div>
        </div>

        <div class="normalize-banner" id="normalize-banner" style="display: ${this.currentMode==="pct"?"flex":"none"};">
          <span class="banner-icon">📊</span>
          <span class="banner-text">โหมด % เปลี่ยนแปลง — ทุกแผนเริ่มต้นที่ 0% จากวันแรกในช่วงที่เลือก เพื่อเปรียบเทียบผลตอบแทนได้อย่างเท่าเทียม</span>
        </div>

        <div class="chart-render-area" id="apexcharts-area"></div>

        <!-- Draggable Resizer Bar -->
        <div class="chart-resizer" id="chart-resizer" title="คลิกลากขึ้นลงเพื่อปรับความสูงกราฟ">
          <div class="resizer-handle"></div>
        </div>
      </div>
    `;const e=this.container.querySelectorAll?this.container.querySelectorAll(".timeframe-btn"):[];e&&e.length>0&&e.forEach(i=>i.addEventListener("click",this._handleClick));const n=this.container.querySelectorAll?this.container.querySelectorAll(".mode-btn"):[];n&&n.length>0&&n.forEach(i=>i.addEventListener("click",this._handleClick));const a=this.container.querySelector?this.container.querySelector("#btn-chart-autofit"):null;a&&a.addEventListener("click",this._handleClick)}_handleClick(t){var o,r,l,c;const e=t.target||t,n=e.closest?e.closest(".timeframe-btn, .mode-btn, #btn-chart-autofit"):e;if(!n)return;if(n.id==="btn-chart-autofit"||n.closest&&n.closest("#btn-chart-autofit")){this.toggleAutoFit();return}const a=((o=n.dataset)==null?void 0:o.timeframe)||((r=n.getAttribute)==null?void 0:r.call(n,"data-timeframe"));if(a&&Z.includes(a)){this.setTimeframe(a);return}const i=((l=n.dataset)==null?void 0:l.mode)||((c=n.getAttribute)==null?void 0:c.call(n,"data-mode"));i&&(i==="nav"||i==="pct")&&this.setMode(i)}setMode(t){if(t!=="nav"&&t!=="pct"||this.currentMode===t)return;this.currentMode=t;const e=this.container.querySelectorAll?this.container.querySelectorAll(".mode-btn"):[];e&&e.length>0&&e.forEach(a=>{var o,r;(((o=a.dataset)==null?void 0:o.mode)||((r=a.getAttribute)==null?void 0:r.call(a,"data-mode")))===t?a.classList.add("is-active"):a.classList.remove("is-active")});const n=this.container.querySelector?this.container.querySelector("#normalize-banner"):null;n&&n.style&&(n.style.display=t==="pct"?"flex":"none"),this.updateChartData(!0)}getAnnotations(){const t=[];if(this.currentMode==="nav"){const e=Array.from(this.activePlans);for(const n of e){const a=O.getPinsForPlan(n),i=et(n,this.summaryData);for(const o of a){const r=o.note?` (${o.note})`:"";t.push({y:o.value,borderColor:i,strokeDashArray:4,label:{text:`📌 ${n} ${o.value.toFixed(4)}${r}`,borderColor:i,position:"left",textAnchor:"start",offsetX:8,offsetY:0,style:{color:"#ffffff",background:i,fontSize:"11px",fontWeight:600,fontFamily:"Sarabun, sans-serif"}}})}}}return{yaxis:t}}async mountChart(){if(this.ApexCharts||(this.ApexCharts=await ce(this.options.ApexCharts)),!this.ApexCharts){console.warn("[ChartView] ApexCharts library not available");return}const t=this.container.querySelector?this.container.querySelector("#apexcharts-area"):null;if(!t)return;const e=Dt({timeframe:this.currentTimeframe,activePlans:this.activePlans,historyData:this.historyData,chartData:this.chartData,summaryData:this.summaryData,referenceDate:this.options.referenceDate,mode:this.currentMode}),n=Nt({series:e.series,colors:e.colors,themeMode:this.currentTheme,annotations:this.getAnnotations(),mode:this.currentMode});if(this.isAutoFit){const a=this.calculateChartHeight();a&&a!==450&&(n.chart.height=a)}this.chart=new this.ApexCharts(t,n),typeof this.chart.render=="function"&&await this.chart.render(),t&&typeof t.addEventListener=="function"&&t.addEventListener("dblclick",this._handleChartDblClick),this._bindResizer(),typeof document<"u"&&document.addEventListener("pins-changed",this._handlePinsChanged)}_handleChartDblClick(t){var f,y,b,P,w;if(this.currentMode!=="nav"){V('⚠️ การปักหมุดราคาใช้ได้เฉพาะในโหมด "NAV จริง"');return}const e=this.primaryPlan||(this.activePlans&&this.activePlans.size>0?Array.from(this.activePlans)[0]:"แผนเชิงรุก 35");if(!e)return;const n=(f=this.container)!=null&&f.querySelector?this.container.querySelector("#apexcharts-area"):null;if(!n)return;const a=n.querySelector(".apexcharts-grid")||n.querySelector(".apexcharts-inner")||n,i=a.getBoundingClientRect?a.getBoundingClientRect():null;if(!i||i.height<=0||t.clientY<i.top-15||t.clientY>i.bottom+15)return;const r=1-(Math.max(i.top,Math.min(i.bottom,t.clientY))-i.top)/i.height;let l=null;const c=(b=(y=this.chart)==null?void 0:y.w)==null?void 0:b.globals,d=Array.isArray(c==null?void 0:c.minYArr)?c.minYArr[0]:(c==null?void 0:c.minY)??null,h=Array.isArray(c==null?void 0:c.maxYArr)?c.maxYArr[0]:(c==null?void 0:c.maxY)??null;if(d!=null&&h!=null&&!isNaN(d)&&!isNaN(h)&&h>d){const m=d+r*(h-d);l=Number(m.toFixed(4))}else{const m=(w=(P=this.summaryData)==null?void 0:P.plans)==null?void 0:w[e];l=(m==null?void 0:m.current_nav)||30}if(!l||isNaN(l)||l<=0)return;const u=O.getPinsForPlan(e).find(m=>Math.abs(m.value-l)/m.value<.008);u?(O.removePin(e,u.id),V(`🗑️ ลบหมุดราคา ${u.value.toFixed(4)} (${e}) แล้ว`)):(O.addPin(e,l,"ดับเบิลคลิกจากกราฟ"),V(`📌 ปักหมุด ${e} ที่ราคา ${l.toFixed(4)} เรียบร้อย`))}toggleAutoFit(){var n;this.isAutoFit=!this.isAutoFit,typeof localStorage<"u"&&localStorage.setItem("gpf_chart_autofit",this.isAutoFit?"true":"false");const t=(n=this.container)!=null&&n.querySelector?this.container.querySelector("#btn-chart-autofit"):null;t&&(this.isAutoFit?(t.classList.add("is-active"),t.innerHTML="<span>↕ ขนาดมาตรฐาน</span>"):(t.classList.remove("is-active"),t.innerHTML="<span>⛶ พอดีหน้าจอ</span>"));const e=this.calculateChartHeight();this.chart&&typeof this.chart.updateOptions=="function"&&this.chart.updateOptions({chart:{height:e}},!1,!0),this.isAutoFit?V("⛶ ขยายกราฟเต็มพื้นที่หน้าจอเรียบร้อย"):V("↕ ปรับความสูงกราฟเป็นขนาดมาตรฐาน (450px)")}calculateChartHeight(){if(this.isAutoFit&&typeof window<"u"&&window.innerHeight&&window.innerWidth>1024){const t=window.innerHeight-230;return Math.max(500,t)}return this.chartHeight||450}_bindResizer(){var o;const t=(o=this.container)!=null&&o.querySelector?this.container.querySelector("#chart-resizer"):null;if(!t||typeof document>"u")return;let e=0,n=0;const a=r=>{var h;const l=r.clientY-e,c=Math.max(360,Math.min(1400,n+l));this.chartHeight=c,this.isAutoFit=!1;const d=(h=this.container)!=null&&h.querySelector?this.container.querySelector("#btn-chart-autofit"):null;d&&(d.classList.remove("is-active"),d.innerHTML="<span>⛶ พอดีหน้าจอ</span>"),this.chart&&typeof this.chart.updateOptions=="function"&&this.chart.updateOptions({chart:{height:c}},!1,!1)},i=()=>{document.removeEventListener("mousemove",a),document.removeEventListener("mouseup",i),typeof localStorage<"u"&&localStorage.setItem("gpf_chart_height",String(this.chartHeight))};t.addEventListener("mousedown",r=>{e=r.clientY,n=this.chartHeight||450,document.addEventListener("mousemove",a),document.addEventListener("mouseup",i)})}_handlePinsChanged(){this.updateAnnotations()}updateAnnotations(){if(!this.chart||typeof this.chart.updateOptions!="function")return;const t=this.getAnnotations();this.chart.updateOptions({annotations:t},!1,!0)}setTimeframe(t){if(!Z.includes(t)||this.currentTimeframe===t)return;this.currentTimeframe=t;const e=this.container.querySelectorAll?this.container.querySelectorAll(".timeframe-btn"):[];e&&e.length>0&&e.forEach(n=>{var i,o;(((i=n.dataset)==null?void 0:i.timeframe)||((o=n.getAttribute)==null?void 0:o.call(n,"data-timeframe")))===t?n.classList.add("is-active"):n.classList.remove("is-active")}),this.updateChartData()}updateActivePlans(t){if(!t)return;const e=Array.isArray(t)?t:Array.from(t);this.activePlans=new Set(e.length>0?e:["แผนเชิงรุก 35"]),this.updateChartData()}updateChartData(t=!1){if(!this.chart)return;const e=Dt({timeframe:this.currentTimeframe,activePlans:this.activePlans,historyData:this.historyData,chartData:this.chartData,summaryData:this.summaryData,referenceDate:this.options.referenceDate,mode:this.currentMode});if(t&&typeof this.chart.updateOptions=="function"){const n=Nt({series:e.series,colors:e.colors,themeMode:this.currentTheme,annotations:this.getAnnotations(),mode:this.currentMode});this.chart.updateOptions(n,!0,!0)}else typeof this.chart.updateOptions=="function"&&this.chart.updateOptions({colors:e.colors,annotations:this.getAnnotations()},!1,!0),typeof this.chart.updateSeries=="function"&&this.chart.updateSeries(e.series,!0)}setTheme(t){if(!t||this.currentTheme===t||(this.currentTheme=t,!this.chart||typeof this.chart.updateOptions!="function"))return;const e=t==="dark",n=e?"#8b949e":"#57606a",a=e?"#1f293d":"#d0d7de";this.chart.updateOptions({theme:{mode:e?"dark":"light"},grid:{borderColor:a},xaxis:{labels:{style:{colors:n}},axisBorder:{color:a},axisTicks:{color:a}},yaxis:{labels:{style:{colors:n}}},tooltip:{theme:e?"dark":"light"}},!1,!0)}destroy(){if(this.container&&this.container.querySelectorAll){const t=this.container.querySelectorAll(".timeframe-btn");t&&t.length>0&&t.forEach(n=>{n.removeEventListener("click",this._handleClick)});const e=this.container.querySelectorAll(".mode-btn");e&&e.length>0&&e.forEach(n=>{n.removeEventListener("click",this._handleClick)})}this.chart&&typeof this.chart.destroy=="function"&&this.chart.destroy(),this.chart=null,typeof document<"u"&&this._handlePinsChanged&&document.removeEventListener("pins-changed",this._handlePinsChanged)}}function ue(s,t={}){const e=new de(s,t);return e.init(),e}function _(s){return s==null||isNaN(s)?"฿0.00":"฿"+Number(s).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2})}function Lt(s){return s==null||isNaN(s)?"0.00%":`${s>0?"+":""}${Number(s).toFixed(2)}%`}function Mt({historyData:s=[],planKey:t,startDate:e,initialCapital:n=1e5,monthlyContribution:a=5e3,dcaDay:i=25}){const o=Math.max(0,Number(n)||0),r=Math.max(0,Number(a)||0);if(!Array.isArray(s)||s.length===0||!t)return{planKey:t,startDate:e,endDate:null,initialNav:0,latestNav:0,totalUnits:0,totalCost:0,finalValue:0,totalProfit:0,profitPct:0,transactionsCount:0,transactions:[]};const l=s.filter(m=>{if(!m||!m.date||e&&m.date<e)return!1;const v=m.plans?m.plans[t]:null;return typeof v=="number"&&!isNaN(v)&&v>0});if(l.length===0)return{planKey:t,startDate:e,endDate:null,initialNav:0,latestNav:0,totalUnits:0,totalCost:0,finalValue:0,totalProfit:0,profitPct:0,transactionsCount:0,transactions:[]};const c=[];let d=0,h=0;const p=l[0],u=p.plans[t];if(o>0){const m=o/u;d+=m,h+=o,c.push({date:p.date,type:"initial",amount:o,nav:u,units:m})}if(r>0){const m=new Map;for(const v of l){const g=v.date.slice(0,7);m.has(g)||m.set(g,[]),m.get(g).push(v)}for(const[v,g]of m){let x=g.find($=>parseInt($.date.slice(8,10),10)>=i);if(x&&x.date>p.date){const $=x.plans[t];if(typeof $=="number"&&$>0){const A=r/$;d+=A,h+=r,c.push({date:x.date,type:"dca",amount:r,nav:$,units:A})}}}}const f=l[l.length-1],y=f.plans[t],b=d*y,P=b-h,w=h>0?P/h*100:0;return{planKey:t,startDate:p.date,endDate:f.date,initialNav:Number(u.toFixed(4)),latestNav:Number(y.toFixed(4)),totalUnits:Number(d.toFixed(4)),totalCost:Number(h.toFixed(2)),finalValue:Number(b.toFixed(2)),totalProfit:Number(P.toFixed(2)),profitPct:Number(w.toFixed(2)),transactionsCount:c.length,transactions:c}}function he({historyData:s=[],planA:t,planB:e,startDate:n,initialCapital:a=1e5,monthlyContribution:i=5e3,dcaDay:o=25}){const r=Mt({historyData:s,planKey:t,startDate:n,initialCapital:a,monthlyContribution:i,dcaDay:o}),l=Mt({historyData:s,planKey:e,startDate:n,initialCapital:a,monthlyContribution:i,dcaDay:o}),c=Number((l.finalValue-r.finalValue).toFixed(2)),d=Number((l.totalProfit-r.totalProfit).toFixed(2)),h=Number((l.profitPct-r.profitPct).toFixed(2));let p="equal";return r.finalValue>l.finalValue?p=t:l.finalValue>r.finalValue&&(p=e),{startDate:n,planA:r,planB:l,difference:{valueDiff:c,profitDiff:d,profitPctDiff:h,betterPlan:p}}}class pe{constructor(t,e={}){this.container=typeof t=="string"?typeof document<"u"?document.querySelector(t):null:t,this.options=e,this.historyData=e.historyData||null,this.summaryData=e.summaryData||null,this.defaultPlanA=e.defaultPlanA||"แผนเชิงรุก 35",this.defaultPlanB=e.defaultPlanB||"แผนหุ้นต่างประเทศ",this.isOpen=!1,this._handleKeyDown=this._handleKeyDown.bind(this),this.render(),this.bindEvents(),(!this.historyData||!this.summaryData)&&this.loadMissingData()}async init(){return(!this.historyData||!this.summaryData)&&await this.loadMissingData(),this}async loadMissingData(){try{this.historyData||(this.historyData=await at()),this.summaryData||(this.summaryData=await J()),this.updatePlanSelects()}catch(t){console.warn("[WhatIfModal] Failed to fetch data:",t)}}updatePlanSelects(){var a;if(!this.container)return;const t=(a=this.summaryData)!=null&&a.plans?Object.keys(this.summaryData.plans):Object.keys(B),e=this.container.querySelector("#whatif-plan-a"),n=this.container.querySelector("#whatif-plan-b");if(e){const i=e.value||this.defaultPlanA;e.innerHTML=t.map(o=>`
        <option value="${o}" ${o===i?"selected":""}>${o}</option>
      `).join("")}if(n){const i=n.value||this.defaultPlanB;n.innerHTML=t.map(o=>`
        <option value="${o}" ${o===i?"selected":""}>${o}</option>
      `).join("")}}getDefaultStartDate(t=3){if(this.historyData&&this.historyData.length>0){const a=this.historyData[this.historyData.length-1].date.split("-");return`${parseInt(a[0],10)-t}-${a[1]}-${a[2]}`}const e=new Date;return e.setFullYear(e.getFullYear()-t),e.toISOString().slice(0,10)}render(){var o;if(!this.container)return;const t=(o=this.summaryData)!=null&&o.plans?Object.keys(this.summaryData.plans):Object.keys(B),e=this.getDefaultStartDate(3),n=t.map(r=>`
      <option value="${r}" ${r===this.defaultPlanA?"selected":""}>${r}</option>
    `).join(""),a=t.map(r=>`
      <option value="${r}" ${r===this.defaultPlanB?"selected":""}>${r}</option>
    `).join(""),i=`
      <div id="whatif-modal" class="modal-backdrop" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="whatif-title">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-badge-icon">🔮</span>
              <div>
                <h3 id="whatif-title" class="modal-title">จำลองผลตอบแทนเปรียบเทียบ (What-If)</h3>
                <p class="modal-subtitle">เปรียบเทียบย้อนหลังจริงด้วยเงินก้อน (Lump-sum) และออมรายเดือน (DCA)</p>
              </div>
            </div>
            <button class="modal-close" id="btn-close-whatif" aria-label="ปิดหน้าต่าง">&times;</button>
          </div>

          <div class="modal-body">
            <div class="whatif-form-grid">
              <!-- Quick Timeframe & Date -->
              <div class="form-group full-width">
                <label class="form-label">ช่วงเวลาเริ่มต้นการลงทุน</label>
                <div class="timeframe-presets">
                  <button type="button" class="btn-preset" data-years="1">ย้อนหลัง 1 ปี</button>
                  <button type="button" class="btn-preset is-active" data-years="3">ย้อนหลัง 3 ปี</button>
                  <button type="button" class="btn-preset" data-years="5">ย้อนหลัง 5 ปี</button>
                </div>
                <input type="date" id="whatif-start-date" class="form-input" value="${e}">
              </div>

              <!-- Capital & Monthly -->
              <div class="form-group">
                <label class="form-label" for="whatif-capital">เงินลงทุนเริ่มต้น (฿)</label>
                <input type="number" id="whatif-capital" class="form-input" value="100000" min="0" step="10000">
                <span class="form-hint">ใส่ 0 หากต้องการออมรายเดือนอย่างเดียว</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="whatif-monthly">เงินออมเพิ่มรายเดือน DCA (฿)</label>
                <input type="number" id="whatif-monthly" class="form-input" value="5000" min="0" step="1000">
                <span class="form-hint">ตัดเงินลงทุนทุกวันที่ 25 ของเดือน</span>
              </div>

              <!-- Plan A & Plan B -->
              <div class="form-group">
                <label class="form-label" for="whatif-plan-a">แผนการลงทุน A (แผนหลัก)</label>
                <select id="whatif-plan-a" class="form-select">
                  ${n}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="whatif-plan-b">แผนการลงทุน B (แผนเปรียบเทียบ)</label>
                <select id="whatif-plan-b" class="form-select">
                  ${a}
                </select>
              </div>
            </div>

            <div class="whatif-action-row">
              <button id="btn-run-whatif" class="btn-primary-action">
                <span>🚀</span> คำนวณผลตอบแทนเปรียบเทียบ
              </button>
            </div>

            <!-- Simulation Results Section -->
            <div id="whatif-results" class="whatif-results-area"></div>
          </div>
        </div>
      </div>
    `;this.container.insertAdjacentHTML("beforeend",i)}bindEvents(){const t=this.container.querySelector("#whatif-modal");if(!t)return;const e=t.querySelector("#btn-close-whatif");e&&e.addEventListener("click",()=>this.close()),t.addEventListener("click",i=>{i.target===t&&this.close()});const n=t.querySelectorAll(".btn-preset");n.forEach(i=>{i.addEventListener("click",()=>{n.forEach(l=>l.classList.remove("is-active")),i.classList.add("is-active");const o=parseInt(i.dataset.years||i.getAttribute("data-years"),10)||3,r=t.querySelector("#whatif-start-date");r&&(r.value=this.getDefaultStartDate(o))})});const a=t.querySelector("#btn-run-whatif");a&&a.addEventListener("click",()=>this.runCalculation()),typeof document<"u"&&document.addEventListener("open-whatif-modal",()=>this.open())}open(){const t=this.container.querySelector("#whatif-modal");t&&(t.style.display="flex",this.isOpen=!0,typeof document<"u"&&document.addEventListener("keydown",this._handleKeyDown),this.runCalculation())}close(){const t=this.container.querySelector("#whatif-modal");t&&(t.style.display="none",this.isOpen=!1,typeof document<"u"&&document.removeEventListener("keydown",this._handleKeyDown))}_handleKeyDown(t){t.key==="Escape"&&this.isOpen&&this.close()}runCalculation(){var l,c,d,h,p;const t=this.container.querySelector("#whatif-modal");if(!t)return;const e=((l=t.querySelector("#whatif-start-date"))==null?void 0:l.value)||this.getDefaultStartDate(3),n=parseFloat((c=t.querySelector("#whatif-capital"))==null?void 0:c.value)||0,a=parseFloat((d=t.querySelector("#whatif-monthly"))==null?void 0:d.value)||0,i=((h=t.querySelector("#whatif-plan-a"))==null?void 0:h.value)||this.defaultPlanA,o=((p=t.querySelector("#whatif-plan-b"))==null?void 0:p.value)||this.defaultPlanB,r=he({historyData:this.historyData,planA:i,planB:o,startDate:e,initialCapital:n,monthlyContribution:a});this.renderResults(r)}renderResults(t){const e=this.container.querySelector("#whatif-results");if(!e)return;const{planA:n,planB:a,difference:i}=t,o=i.betterPlan===a.planKey,r=i.betterPlan===n.planKey,l=Math.abs(i.valueDiff),c=r?`🎉 <strong>${n.planKey}</strong> ให้ผลตอบแทนดีกว่า <strong>${a.planKey}</strong> อยู่ <strong>${_(l)}</strong>`:o?`🎉 <strong>${a.planKey}</strong> ให้ผลตอบแทนดีกว่า <strong>${n.planKey}</strong> อยู่ <strong>${_(l)}</strong>`:"ทั้งสองแผนให้ผลตอบแทนใกล้เคียงกัน";e.innerHTML=`
      <div class="whatif-summary-banner">
        <span class="banner-icon">${r||o?"🏆":"⚖️"}</span>
        <div class="banner-text">${c}</div>
      </div>

      <div class="whatif-cards-grid">
        <!-- Card Plan A -->
        <div class="whatif-card ${r?"is-winner":""}">
          <div class="whatif-card-header">
            <span class="plan-color-dot" style="background-color: ${B[n.planKey]||"#2196F3"}"></span>
            <h4 class="card-plan-name">${n.planKey}</h4>
            ${r?'<span class="winner-badge">ผลงานดีกว่า</span>':""}
          </div>
          <div class="card-metric-row">
            <span class="metric-label">เงินลงทุนรวม:</span>
            <span class="metric-val">${_(n.totalCost)}</span>
          </div>
          <div class="card-metric-row highlight">
            <span class="metric-label">มูลค่าสิ้นสุด:</span>
            <span class="metric-val primary">${_(n.finalValue)}</span>
          </div>
          <div class="card-metric-row">
            <span class="metric-label">กำไร / ขาดทุนสุทธิ:</span>
            <span class="metric-val ${n.totalProfit>=0?"text-up":"text-down"}">
              ${_(n.totalProfit)} (${Lt(n.profitPct)})
            </span>
          </div>
          <div class="card-sub-info">
            <span>NAV: ${n.initialNav.toFixed(4)} ➔ ${n.latestNav.toFixed(4)}</span>
            <span>หน่วยสะสม: ${n.totalUnits.toLocaleString("th-TH")} หน่วย (${n.transactionsCount} รายการ)</span>
          </div>
        </div>

        <!-- Card Plan B -->
        <div class="whatif-card ${o?"is-winner":""}">
          <div class="whatif-card-header">
            <span class="plan-color-dot" style="background-color: ${B[a.planKey]||"#9C27B0"}"></span>
            <h4 class="card-plan-name">${a.planKey}</h4>
            ${o?'<span class="winner-badge">ผลงานดีกว่า</span>':""}
          </div>
          <div class="card-metric-row">
            <span class="metric-label">เงินลงทุนรวม:</span>
            <span class="metric-val">${_(a.totalCost)}</span>
          </div>
          <div class="card-metric-row highlight">
            <span class="metric-label">มูลค่าสิ้นสุด:</span>
            <span class="metric-val primary">${_(a.finalValue)}</span>
          </div>
          <div class="card-metric-row">
            <span class="metric-label">กำไร / ขาดทุนสุทธิ:</span>
            <span class="metric-val ${a.totalProfit>=0?"text-up":"text-down"}">
              ${_(a.totalProfit)} (${Lt(a.profitPct)})
            </span>
          </div>
          <div class="card-sub-info">
            <span>NAV: ${a.initialNav.toFixed(4)} ➔ ${a.latestNav.toFixed(4)}</span>
            <span>หน่วยสะสม: ${a.totalUnits.toLocaleString("th-TH")} หน่วย (${a.transactionsCount} รายการ)</span>
          </div>
        </div>
      </div>
    `}}function fe(s,t={}){const e=new pe(s,t);return e.init(),e}function me(s){return s==null?"":String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}class ve{constructor(t,e={}){this.container=typeof t=="string"?typeof document<"u"?document.querySelector(t):null:t,this.options=e,this.summaryData=e.summaryData||null,this.defaultPlan=e.defaultPlan||"แผนเชิงรุก 35",this.isOpen=!1,this._handleKeyDown=this._handleKeyDown.bind(this),this._handlePinsChanged=this._handlePinsChanged.bind(this),this.render(),this.bindEvents(),this.renderPinList(),this.summaryData||this.loadSummary()}async init(){return this.summaryData||await this.loadSummary(),this}async loadSummary(){try{this.summaryData=await J(),this.updatePlanSelect(),this.renderPinList()}catch(t){console.warn("[PinModal] Failed to fetch summaryData:",t)}}updatePlanSelect(){var n;if(!this.container)return;const t=(n=this.summaryData)!=null&&n.plans?Object.keys(this.summaryData.plans):Object.keys(B),e=this.container.querySelector("#pin-plan-select");if(e){const a=e.value||this.defaultPlan;e.innerHTML=t.map(i=>{const o=i===a,r=this.getCurrentNav(i),l=r?` (NAV: ${r.toFixed(4)})`:"";return`<option value="${i}" ${o?"selected":""}>${i}${l}</option>`}).join("")}}getCurrentNav(t){var e,n,a;return((a=(n=(e=this.summaryData)==null?void 0:e.plans)==null?void 0:n[t])==null?void 0:a.latestNav)!=null?this.summaryData.plans[t].latestNav:null}calculateDistance(t,e){if(!e||e<=0||!t)return"";const a=(t-e)/e*100;return`${a>=0?"+":""}${a.toFixed(2)}% จากราคาปัจจุบัน (${e.toFixed(4)})`}render(){var o;if(!this.container)return;const e=((o=this.summaryData)!=null&&o.plans?Object.keys(this.summaryData.plans):Object.keys(B)).map(r=>{const l=r===this.defaultPlan,c=this.getCurrentNav(r),d=c?` (NAV: ${c.toFixed(4)})`:"";return`<option value="${r}" ${l?"selected":""}>${r}${d}</option>`}).join(""),n=this.getCurrentNav(this.defaultPlan),a=n?n.toFixed(4):"",i=`
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
                  ${e}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="pin-nav-input">ระดับราคา NAV เป้าหมาย</label>
                  <input type="number" id="pin-nav-input" class="form-input" placeholder="เช่น 36.5000" step="0.0001" min="0" value="${a}">
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
    `;this.container.insertAdjacentHTML("beforeend",i)}bindEvents(){const t=this.container.querySelector("#pin-modal");if(!t)return;const e=t.querySelector("#btn-close-pin-modal");e&&e.addEventListener("click",()=>this.close()),t.addEventListener("click",o=>{o.target===t&&this.close()});const n=t.querySelector("#pin-plan-select");n&&n.addEventListener("change",o=>{const r=o.target.value,l=this.getCurrentNav(r),c=t.querySelector("#pin-nav-input");c&&l&&(c.placeholder=l.toFixed(4))});const a=t.querySelector("#btn-add-pin");a&&a.addEventListener("click",()=>this.handleAddPin());const i=t.querySelector("#pin-form");i&&i.addEventListener("submit",o=>{o.preventDefault(),this.handleAddPin()}),typeof document<"u"&&(document.addEventListener("pins-changed",this._handlePinsChanged),document.addEventListener("open-pin-modal",()=>this.open()))}_handlePinsChanged(){this.renderPinList()}handleAddPin(){const t=this.container.querySelector("#pin-modal");if(!t)return;const e=t.querySelector("#pin-plan-select"),n=t.querySelector("#pin-nav-input"),a=t.querySelector("#pin-note-input"),i=e==null?void 0:e.value,o=parseFloat(n==null?void 0:n.value),r=(a==null?void 0:a.value)||"";!i||isNaN(o)||o<=0||(O.addPin(i,o,r),a&&(a.value=""),this.renderPinList())}handleRemovePin(t,e){O.removePin(t,e),this.renderPinList()}renderPinList(){const t=this.container.querySelector("#pinned-items-list");if(!t)return;const e=O.getPins(),n=Object.keys(e).filter(o=>Array.isArray(e[o])&&e[o].length>0);if(n.length===0){t.innerHTML=`
        <div class="empty-pins-notice">
          <p>ยังไม่มีการปักหมุดราคาเป้าหมาย</p>
          <span class="empty-hint">กรอกราคาด้านบนแล้วกด "บันทึกหมุดราคา" เส้นจะแสดงบนกราฟทันที</span>
        </div>
      `;return}let a="";for(const o of n){const r=e[o],l=B[o]||"#2196F3",c=this.getCurrentNav(o),d=r.map(h=>{const p=c?this.calculateDistance(h.value,c):"",f=c&&h.value>c?"dist-up":"dist-down";return`
          <div class="pin-item" data-pin-id="${h.id}" data-plan="${o}">
            <div class="pin-item-main">
              <div class="pin-value-row">
                <span class="pin-badge">📌 ${h.value.toFixed(4)}</span>
                ${h.note?`<span class="pin-note">${me(h.note)}</span>`:""}
              </div>
              ${p?`<div class="pin-distance ${f}">${p}</div>`:""}
            </div>
            <button class="btn-delete-pin" data-plan="${o}" data-pin-id="${h.id}" title="ลบหมุดนี้">&times;</button>
          </div>
        `}).join("");a+=`
        <div class="plan-pins-group">
          <div class="plan-pins-header">
            <span class="plan-color-dot" style="background-color: ${l}"></span>
            <span class="plan-pins-title">${o}</span>
            <span class="pins-count">(${r.length} หมุด)</span>
          </div>
          <div class="plan-pins-items">
            ${d}
          </div>
        </div>
      `}t.innerHTML=a,t.querySelectorAll(".btn-delete-pin").forEach(o=>{o.addEventListener("click",r=>{var h,p;const l=r.target.closest(".btn-delete-pin")||r.target,c=((h=l.dataset)==null?void 0:h.plan)||l.getAttribute("data-plan"),d=((p=l.dataset)==null?void 0:p.pinId)||l.getAttribute("data-pin-id");c&&d&&this.handleRemovePin(c,d)})})}open(t=null){const e=this.container.querySelector("#pin-modal");if(e){if(t){const n=e.querySelector("#pin-plan-select");if(n){n.value=t;const a=this.getCurrentNav(t),i=e.querySelector("#pin-nav-input");i&&a&&(i.value=a.toFixed(4))}}e.style.display="flex",this.isOpen=!0,typeof document<"u"&&document.addEventListener("keydown",this._handleKeyDown),this.renderPinList()}}close(){const t=this.container.querySelector("#pin-modal");t&&(t.style.display="none",this.isOpen=!1,typeof document<"u"&&document.removeEventListener("keydown",this._handleKeyDown))}_handleKeyDown(t){t.key==="Escape"&&this.isOpen&&this.close()}destroy(){typeof document<"u"&&(document.removeEventListener("pins-changed",this._handlePinsChanged),document.removeEventListener("keydown",this._handleKeyDown))}}function ye(s,t={}){const e=new ve(s,t);return e.init(),e}class ge{constructor(t,e={}){this.container=typeof t=="string"?typeof document<"u"?document.querySelector(t):null:t,this.options=e,this.isOpen=!1,this._handleKeyDown=this._handleKeyDown.bind(this),this._handleOpenModal=this._handleOpenModal.bind(this),this.render(),this.bindEvents()}render(){if(!this.container)return;this.container.insertAdjacentHTML("beforeend",`
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
                    <li><span class="feature-icon">✨</span> <strong>มี 2 แผ่นงาน:</strong> แผ่นสรุปผลตอบแทน & สถิติ + แผ่นข้อมูลประวัติย้อนหลัง</li>
                    <li><span class="feature-icon">📌</span> <strong>ตรึงหัวตาราง:</strong> ตรึงหัวตารางและคอลัมน์วันที่เพื่อความสะดวกเวลาเลื่อนดู</li>
                    <li><span class="feature-icon">🔢</span> <strong>ฟอร์แมตตัวเลข:</strong> ตัวเลขทศนิยม 4 ตำแหน่งชัดเจนตามมาตรฐาน กบข.</li>
                    <li><span class="feature-icon">📅</span> <strong>เรียงลำดับเวลา:</strong> เรียงวันล่าสุดอยู่บนสุด สะดวกต่อการติดตาม</li>
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
                    <li><span class="feature-icon">🇹🇭</span> <strong>UTF-8 with BOM:</strong> เปิดใน Excel ภาษาไทยไม่เพี้ยน ไม่ต้องแปลง encoding</li>
                    <li><span class="feature-icon">📊</span> <strong>ตาราง 15 แผนครบถ้วน:</strong> รวมประวัติ NAV ทุกแผนการลงทุนตั้งแต่เริ่มต้น</li>
                    <li><span class="feature-icon">📅</span> <strong>เรียงลำดับเวลา:</strong> เรียงวันล่าสุดอยู่บนสุด สะดวกต่อการนำเข้าฐานข้อมูล</li>
                    <li><span class="feature-icon">💻</span> <strong>รองรับ Data Tools:</strong> นำเข้า Python, R, Power BI, หรือ Tableau ได้ทันที</li>
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
              <p>ข้อมูลอัปเดตอัตโนมัติทุกวันทำการหลัง กบข. ประกาศมูลค่าหน่วยลงทุน (NAV) เวลาประมาณ 20:30 น.</p>
            </div>
          </div>
        </div>
      </div>
    `)}bindEvents(){const t=this.container.querySelector("#export-modal");if(!t)return;const e=t.querySelector("#btn-close-export-modal");e&&e.addEventListener("click",()=>this.close()),t.addEventListener("click",n=>{n.target===t&&this.close()}),typeof document<"u"&&document.addEventListener("open-export-modal",this._handleOpenModal)}_handleOpenModal(){this.open()}open(){var e;const t=(e=this.container)==null?void 0:e.querySelector("#export-modal");t&&(t.style.display="flex",this.isOpen=!0,typeof document<"u"&&document.addEventListener("keydown",this._handleKeyDown))}close(){var e;const t=(e=this.container)==null?void 0:e.querySelector("#export-modal");t&&(t.style.display="none",this.isOpen=!1,typeof document<"u"&&document.removeEventListener("keydown",this._handleKeyDown))}_handleKeyDown(t){t.key==="Escape"&&this.isOpen&&this.close()}destroy(){typeof document<"u"&&(document.removeEventListener("open-export-modal",this._handleOpenModal),document.removeEventListener("keydown",this._handleKeyDown))}}function be(s,t={}){return new ge(s,t)}class we{constructor(t,e={}){this.container=typeof t=="string"?typeof document<"u"?document.querySelector(t):null:t,this.options=e,this.version=e.version||"v1.1271",this.author=e.author||"KⓇU M00 ¥EO",this.isOpen=!1,this._handleKeyDown=this._handleKeyDown.bind(this),this._handleOpenEvent=this._handleOpenEvent.bind(this),this.render(),this.bindEvents()}render(){if(!this.container)return;const t=`
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
    `;this.container.insertAdjacentHTML("beforeend",t),this.modalEl=this.container.querySelector("#dev-modal")}bindEvents(){if(!this.modalEl)return;const t=this.modalEl.querySelector("#btn-close-dev");t&&t.addEventListener("click",()=>this.close()),this.modalEl.addEventListener("click",e=>{e.target===this.modalEl&&this.close()}),typeof document<"u"&&(document.addEventListener("open-dev-modal",this._handleOpenEvent),document.addEventListener("keydown",this._handleKeyDown))}_handleOpenEvent(){this.open()}_handleKeyDown(t){t.key==="Escape"&&this.isOpen&&this.close()}open(){this.modalEl&&(this.isOpen=!0,this.modalEl.classList.add("open"),this.modalEl.setAttribute("aria-hidden","false"))}close(){this.modalEl&&(this.isOpen=!1,this.modalEl.classList.remove("open"),this.modalEl.setAttribute("aria-hidden","true"))}destroy(){typeof document<"u"&&(document.removeEventListener("open-dev-modal",this._handleOpenEvent),document.removeEventListener("keydown",this._handleKeyDown)),this.modalEl&&this.modalEl.parentNode&&this.modalEl.parentNode.removeChild(this.modalEl)}}function xe(s,t={}){return new we(s,t)}let Q=null,Se=null,L=null,Ee=null,Pe=null,Ae=null,$e=null;function Ce(){const s=localStorage.getItem("theme")||"dark";document.documentElement.setAttribute("data-theme",s)}function ke(){const s=document.getElementById("app");if(!s){console.error("Root element #app not found");return}s.innerHTML="",Ut(s);const t=document.createElement("main");t.className="main-content terminal-layout",t.innerHTML=`
    <!-- Left Column: Watchlist Sidebar -->
    <aside id="plan-selector-container" class="terminal-sidebar"></aside>

    <!-- Right Column: Main Trading Stage -->
    <section class="terminal-stage">
      <!-- Top Financial Ticker HUD (The yellow box items) -->
      <section id="metric-cards-container" class="terminal-hud"></section>
      <!-- Large Chart Area -->
      <section id="chart-container" class="terminal-chart-area"></section>
    </section>
  `,s.appendChild(t);const e=document.createElement("nav");e.className="ios-bottom-nav",e.id="ios-bottom-nav",e.setAttribute("aria-label","iOS App Navigation"),e.innerHTML=`
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
  `,s.appendChild(e),e.addEventListener("click",i=>{var d,h;const o=i.target.closest?i.target.closest(".ios-tab-btn"):null;if(!o)return;const r=((d=o.dataset)==null?void 0:d.tab)||((h=o.getAttribute)==null?void 0:h.call(o,"data-tab")),l=document.getElementById("plan-selector-container"),c=document.querySelector(".terminal-stage");if(r==="stage")l&&l.classList.remove("mobile-visible"),c&&c.classList.remove("mobile-hidden"),n(o);else if(r==="sidebar")l&&l.classList.add("mobile-visible"),c&&c.classList.add("mobile-hidden"),n(o);else if(r==="whatif"){const p=new CustomEvent("open-whatif-modal",{bubbles:!0});document.dispatchEvent(p)}else if(r==="pins"){const p=new CustomEvent("open-pin-modal",{bubbles:!0});document.dispatchEvent(p)}});function n(i){const o=e.querySelectorAll?e.querySelectorAll(".ios-tab-btn"):[];o&&o.length&&o.forEach(r=>{r===i?r.classList.add("is-active"):r.classList.remove("is-active")})}const a=document.createElement("div");a.id="modals-container",s.appendChild(a)}function De(){typeof window<"u"&&"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(s=>{console.log("[GPF PWA] Service Worker registered with scope:",s.scope)}).catch(s=>{console.warn("[GPF PWA] Service Worker registration failed:",s)})})}async function Ne(){var n;const s=document.getElementById("metric-cards-container"),t=document.getElementById("plan-selector-container"),e=document.getElementById("chart-container");try{const[a,i,o]=await Promise.all([J(),qt(),at()]),r=typeof localStorage<"u"&&(a!=null&&a.plans)?localStorage.getItem("gpf_primary_plan"):null,l=r&&((n=a==null?void 0:a.plans)!=null&&n[r])?r:"แผนเชิงรุก 35";a!=null&&a.latestDate&&zt(tt(a.latestDate)),s&&(Q=Jt(s,{summaryData:a,historyData:o,activePlanKey:l})),t&&(Se=Zt(t,{summaryData:a,defaultPlan:l,activePlans:[l]})),e&&(L=ue(e,{chartData:i,historyData:o,summaryData:a,primaryPlan:l,activePlans:[l],defaultTimeframe:"1Y"}));const c=document.getElementById("modals-container");c&&(Ee=fe(c,{historyData:o,summaryData:a,defaultPlanA:l,defaultPlanB:"แผนหุ้นต่างประเทศ"}),Pe=ye(c,{summaryData:a,defaultPlan:l}),Ae=be(c),$e=xe(c,{version:"v1.1271",author:"KⓇU M00 ¥EO"})),document.addEventListener("plan-change",h=>{const{primaryPlan:p,activePlans:u}=h.detail||{};if(p&&Q&&Q.setPlan(p),p&&L&&typeof L.setPrimaryPlan=="function"&&L.setPrimaryPlan(p),u&&L&&L.updateActivePlans(u),typeof window<"u"&&window.innerWidth<=1024){const f=document.querySelector('.ios-tab-btn[data-tab="stage"]');f&&!f.classList.contains("is-active")&&f.click()}});const d=document.getElementById("theme-toggle");d&&d.addEventListener("click",()=>{const h=document.documentElement.getAttribute("data-theme")||"dark";L&&L.setTheme(h)}),typeof MutationObserver<"u"&&new MutationObserver(p=>{for(const u of p)if(u.type==="attributes"&&u.attributeName==="data-theme"){const f=document.documentElement.getAttribute("data-theme")||"dark";L&&L.setTheme(f)}}).observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]})}catch(a){console.error("[GPF Dashboard] Failed to load data:",a),s&&(s.innerHTML=`
        <div class="metric-cards-empty">
          <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ${a.message}</p>
        </div>
      `)}}let Tt=!1;async function Ft(){Tt||(Tt=!0,Ce(),ke(),De(),await Ne())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ft):Ft();
