/**
 * California Childcare Financial Assistance Eligibility Widget
 * Embed on any website to help families check eligibility for CA programs
 *
 * Usage:
 * <div id="ca-eligibility-widget"></div>
 * <script src="https://beta.familychildcaresf.com/ca-eligibility-widget.js"></script>
 *
 * Or with custom options:
 * <div id="ca-eligibility-widget"
 *      data-theme="light"
 *      data-lang="en"
 *      data-rr-phone="1-800-543-7793"
 *      data-rr-website="mychildcareplan.org">
 * </div>
 */

(function() {
  'use strict';

  // ============================================
  // Income Threshold Data (California 2025-26)
  // ============================================

  // Federal Poverty Level 2026 - for Head Start (200% FPL)
  const FPL_2026 = {
    base: 15960,      // 1 person
    perPerson: 5680,  // additional per person
  };

  // California State Median Income 2025-26 (100% SMI values)
  const SMI_2025 = {
    1: 96854,
    2: 96854,
    3: 109904,
    4: 127338,
    5: 147712,
    6: 168086,
    7: 171906,
    8: 175726,
    9: 179547,
    10: 183367,
    11: 187187,
    12: 191007,
  };

  // ============================================
  // Translations
  // ============================================

  const translations = {
    en: {
      title: "Check Your Eligibility for Free or Reduced-Cost Childcare",
      subtitle: "Answer 2 quick questions • No personal info saved",
      householdSize: "Household Size",
      selectSize: "Select...",
      person: "person",
      people: "people",
      householdHint: "Include all people living in your home",
      yourIncome: "Your Household Income",
      monthly: "Monthly",
      annual: "Annual",
      incomeHint: "Before taxes (gross income)",
      checkButton: "Check Eligibility",
      disclaimer: "This is an estimate only. Actual eligibility is determined by your local R&R agency.",
      startOver: "Start Over",

      // Results
      eligible: "Great news! You may qualify for FREE or subsidized childcare",
      eligibleDesc: "Based on your household size and income, you may be eligible for:",
      overIncome: "Based on income alone, you may not qualify for subsidized childcare",
      overIncomeDesc: "However, eligibility can depend on other factors. We recommend contacting your local Resource & Referral agency.",

      // Programs
      headStartTitle: "Head Start / Early Head Start",
      headStartDesc: "Comprehensive early learning program for children ages 0-5",
      subsidyTitle: "State Childcare Subsidies",
      subsidyDesc: "CalWORKs, Alternative Payment, General Child Care programs",
      csppTitle: "CA State Preschool Program (CSPP)",
      csppDesc: "Free part-day or full-day preschool for 3-4 year olds",

      // Next steps
      nextStep: "Next Step: Contact Your Local R&R Agency",
      nextStepDesc: "Resource & Referral agencies help families find and apply for childcare assistance.",
      rrPhone: "California R&R Network",
      findLocal: "Find your local R&R agency",

      // Other options
      otherOptionsTitle: "Other options to explore:",
      sliding: "Sliding scale fees at some childcare providers",
      employer: "Employer-sponsored childcare benefits",
      fsa: "Dependent Care FSA (save on taxes)",

      poweredBy: "Powered by",
    },
    es: {
      title: "Verifique su elegibilidad para cuidado infantil gratuito o de bajo costo",
      subtitle: "Responda 2 preguntas rápidas • No se guarda información personal",
      householdSize: "Tamaño del hogar",
      selectSize: "Seleccionar...",
      person: "persona",
      people: "personas",
      householdHint: "Incluya a todas las personas que viven en su hogar",
      yourIncome: "Ingreso de su hogar",
      monthly: "Mensual",
      annual: "Anual",
      incomeHint: "Antes de impuestos (ingreso bruto)",
      checkButton: "Verificar elegibilidad",
      disclaimer: "Esto es solo una estimación. La elegibilidad real la determina su agencia local de R&R.",
      startOver: "Comenzar de nuevo",

      eligible: "¡Buenas noticias! Puede calificar para cuidado infantil GRATUITO o subsidiado",
      eligibleDesc: "Según el tamaño de su hogar e ingresos, puede ser elegible para:",
      overIncome: "Solo según los ingresos, es posible que no califique para cuidado infantil subsidiado",
      overIncomeDesc: "Sin embargo, la elegibilidad puede depender de otros factores. Le recomendamos contactar a su agencia local de Recursos y Referencias.",

      headStartTitle: "Head Start / Early Head Start",
      headStartDesc: "Programa integral de aprendizaje temprano para niños de 0-5 años",
      subsidyTitle: "Subsidios estatales para cuidado infantil",
      subsidyDesc: "CalWORKs, Pago Alternativo, programas de Cuidado Infantil General",
      csppTitle: "Programa Preescolar del Estado de CA (CSPP)",
      csppDesc: "Preescolar gratuito de medio día o día completo para niños de 3-4 años",

      nextStep: "Siguiente paso: Contacte a su agencia local de R&R",
      nextStepDesc: "Las agencias de Recursos y Referencias ayudan a las familias a encontrar y solicitar asistencia de cuidado infantil.",
      rrPhone: "Red de R&R de California",
      findLocal: "Encuentre su agencia local de R&R",

      otherOptionsTitle: "Otras opciones para explorar:",
      sliding: "Tarifas de escala móvil en algunos proveedores",
      employer: "Beneficios de cuidado infantil patrocinados por el empleador",
      fsa: "FSA de Cuidado de Dependientes (ahorre en impuestos)",

      poweredBy: "Desarrollado por",
    },
    zh: {
      title: "查看您是否符合免費或減價托兒服務資格",
      subtitle: "回答 2 個簡單問題 • 不保存任何個人資訊",
      householdSize: "家庭人數",
      selectSize: "選擇...",
      person: "人",
      people: "人",
      householdHint: "包括您家中所有人",
      yourIncome: "家庭收入",
      monthly: "每月",
      annual: "每年",
      incomeHint: "稅前收入（總收入）",
      checkButton: "查看資格",
      disclaimer: "這只是估算。實際資格由當地 R&R 機構確定。",
      startOver: "重新開始",

      eligible: "好消息！您可能符合免費或補助托兒服務資格",
      eligibleDesc: "根據您的家庭人數和收入，您可能有資格申請：",
      overIncome: "僅根據收入，您可能不符合補助托兒服務資格",
      overIncomeDesc: "但是，資格可能取決於其他因素。我們建議聯繫當地的資源與轉介機構。",

      headStartTitle: "Head Start / Early Head Start",
      headStartDesc: "為 0-5 歲兒童提供的綜合早期學習計劃",
      subsidyTitle: "州立托兒補助",
      subsidyDesc: "CalWORKs、替代支付、一般托兒計劃",
      csppTitle: "加州州立學前班計劃 (CSPP)",
      csppDesc: "為 3-4 歲兒童提供免費半日或全日學前班",

      nextStep: "下一步：聯繫當地 R&R 機構",
      nextStepDesc: "資源與轉介機構幫助家庭尋找和申請托兒援助。",
      rrPhone: "加州 R&R 網絡",
      findLocal: "查找當地 R&R 機構",

      otherOptionsTitle: "其他可探索的選項：",
      sliding: "部分托兒服務提供者提供浮動收費",
      employer: "雇主贊助的托兒福利",
      fsa: "受扶養人照護 FSA（節省稅款）",

      poweredBy: "技術支援",
    }
  };

  // ============================================
  // Eligibility Calculation
  // ============================================

  function getThresholds(householdSize) {
    const clampedSize = Math.max(1, Math.min(householdSize, 12));
    const fpl100 = FPL_2026.base + (clampedSize - 1) * FPL_2026.perPerson;
    const smi100 = SMI_2025[clampedSize] || SMI_2025[12];

    return {
      fpl200: fpl100 * 2,
      smi85: Math.round(smi100 * 0.85),
      smi100: smi100,
    };
  }

  function checkEligibility(householdSize, annualIncome) {
    const thresholds = getThresholds(householdSize);

    return {
      headStart: annualIncome <= thresholds.fpl200,
      subsidy: annualIncome <= thresholds.smi85,
      cspp: annualIncome <= thresholds.smi100,
      anyProgram: annualIncome <= thresholds.smi100,
    };
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // ============================================
  // Widget Styles
  // ============================================

  const styles = `
    .ca-elig-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
      border-radius: 12px;
      border: 1px solid #86efac;
      overflow: hidden;
      line-height: 1.5;
      color: #1f2937;
    }
    .ca-elig-widget * {
      box-sizing: border-box;
    }
    .ca-elig-header {
      padding: 16px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background 0.2s;
    }
    .ca-elig-header:hover {
      background: rgba(255,255,255,0.3);
    }
    .ca-elig-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ca-elig-icon {
      font-size: 28px;
    }
    .ca-elig-title {
      font-weight: 600;
      color: #1f2937;
      font-size: 16px;
      margin: 0;
    }
    .ca-elig-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 2px 0 0 0;
    }
    .ca-elig-chevron {
      width: 20px;
      height: 20px;
      color: #6b7280;
      transition: transform 0.2s;
    }
    .ca-elig-chevron.open {
      transform: rotate(180deg);
    }
    .ca-elig-body {
      padding: 0 20px 20px;
      border-top: 1px solid #86efac;
      display: none;
    }
    .ca-elig-body.open {
      display: block;
    }
    .ca-elig-form {
      padding-top: 16px;
    }
    .ca-elig-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (max-width: 500px) {
      .ca-elig-row {
        grid-template-columns: 1fr;
      }
    }
    .ca-elig-field label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    }
    .ca-elig-field select,
    .ca-elig-field input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 15px;
      background: white;
    }
    .ca-elig-field select:focus,
    .ca-elig-field input:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }
    .ca-elig-hint {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .ca-elig-income-input {
      position: relative;
    }
    .ca-elig-income-input span {
      position: absolute;
      left: 12px;
      top: 10px;
      color: #6b7280;
    }
    .ca-elig-income-input input {
      padding-left: 24px;
    }
    .ca-elig-toggle {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }
    .ca-elig-toggle label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      cursor: pointer;
    }
    .ca-elig-toggle input {
      width: auto;
    }
    .ca-elig-btn {
      width: 100%;
      padding: 12px 24px;
      background: #16a34a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .ca-elig-btn:hover {
      background: #15803d;
    }
    .ca-elig-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }
    .ca-elig-btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .ca-elig-btn-secondary:hover {
      background: #f9fafb;
    }
    .ca-elig-disclaimer {
      font-size: 12px;
      color: #6b7280;
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ca-elig-results {
      padding-top: 16px;
    }
    .ca-elig-banner {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .ca-elig-banner.success {
      background: #dcfce7;
      border: 1px solid #86efac;
    }
    .ca-elig-banner.warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
    }
    .ca-elig-banner h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ca-elig-banner.success h3 { color: #166534; }
    .ca-elig-banner.warning h3 { color: #92400e; }
    .ca-elig-banner p {
      font-size: 14px;
      margin: 0;
    }
    .ca-elig-banner.success p { color: #15803d; }
    .ca-elig-banner.warning p { color: #a16207; }
    .ca-elig-programs {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .ca-elig-program {
      padding: 12px;
      border-radius: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .ca-elig-program-title {
      font-weight: 500;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ca-elig-program-desc {
      font-size: 13px;
      color: #6b7280;
      margin-top: 2px;
    }
    .ca-elig-contact {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .ca-elig-contact h4 {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ca-elig-contact p {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
    }
    .ca-elig-contact-info {
      background: #f9fafb;
      border-radius: 6px;
      padding: 12px;
    }
    .ca-elig-contact-info a {
      color: #2563eb;
      text-decoration: none;
    }
    .ca-elig-contact-info a:hover {
      text-decoration: underline;
    }
    .ca-elig-other {
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .ca-elig-other h4 {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 8px 0;
    }
    .ca-elig-other ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #6b7280;
    }
    .ca-elig-other li {
      margin-bottom: 4px;
    }
    .ca-elig-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .ca-elig-actions .ca-elig-btn {
      flex: 1;
      min-width: 120px;
    }
    .ca-elig-footer {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .ca-elig-footer a {
      color: #6b7280;
      text-decoration: none;
    }
    .ca-elig-footer a:hover {
      text-decoration: underline;
    }
  `;

  // ============================================
  // Widget Initialization
  // ============================================

  function init() {
    const container = document.getElementById('ca-eligibility-widget');
    if (!container) {
      console.error('CA Eligibility Widget: Container #ca-eligibility-widget not found');
      return;
    }

    // Get options from data attributes
    const lang = container.dataset.lang || 'en';
    const rrPhone = container.dataset.rrPhone || '1-800-543-7793';
    const rrWebsite = container.dataset.rrWebsite || 'mychildcareplan.org';
    const t = translations[lang] || translations.en;

    // Inject styles
    if (!document.getElementById('ca-elig-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'ca-elig-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }

    // State
    let isExpanded = false;
    let householdSize = 0;
    let income = '';
    let incomeType = 'annual';
    let result = null;

    // Render function
    function render() {
      const chevronClass = isExpanded ? 'ca-elig-chevron open' : 'ca-elig-chevron';
      const bodyClass = isExpanded ? 'ca-elig-body open' : 'ca-elig-body';

      let bodyContent = '';

      if (!result) {
        // Form
        bodyContent = `
          <div class="ca-elig-form">
            <div class="ca-elig-row">
              <div class="ca-elig-field">
                <label>${t.householdSize}</label>
                <select id="ca-elig-size">
                  <option value="0">${t.selectSize}</option>
                  ${[1,2,3,4,5,6,7,8,9,10].map(n =>
                    `<option value="${n}" ${householdSize === n ? 'selected' : ''}>${n} ${n === 1 ? t.person : t.people}</option>`
                  ).join('')}
                </select>
                <div class="ca-elig-hint">${t.householdHint}</div>
              </div>
              <div class="ca-elig-field">
                <label>${t.yourIncome}</label>
                <div class="ca-elig-income-input">
                  <span>$</span>
                  <input type="text" id="ca-elig-income" value="${income}" placeholder="0">
                </div>
                <div class="ca-elig-toggle">
                  <label>
                    <input type="radio" name="ca-elig-type" value="monthly" ${incomeType === 'monthly' ? 'checked' : ''}>
                    ${t.monthly}
                  </label>
                  <label>
                    <input type="radio" name="ca-elig-type" value="annual" ${incomeType === 'annual' ? 'checked' : ''}>
                    ${t.annual}
                  </label>
                </div>
                <div class="ca-elig-hint">${t.incomeHint}</div>
              </div>
            </div>
            <button class="ca-elig-btn" id="ca-elig-check" ${!householdSize || !income ? 'disabled' : ''}>
              ${t.checkButton}
            </button>
            <div class="ca-elig-disclaimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
              ${t.disclaimer}
            </div>
          </div>
        `;
      } else {
        // Results
        const hasPrograms = result.anyProgram;
        const bannerClass = hasPrograms ? 'success' : 'warning';
        const bannerIcon = hasPrograms ? '✅' : '⚠️';
        const bannerTitle = hasPrograms ? t.eligible : t.overIncome;
        const bannerDesc = hasPrograms ? t.eligibleDesc : t.overIncomeDesc;

        let programsHtml = '';
        if (hasPrograms) {
          programsHtml = '<div class="ca-elig-programs">';
          if (result.headStart) {
            programsHtml += `
              <div class="ca-elig-program">
                <div class="ca-elig-program-title">🌈 ${t.headStartTitle}</div>
                <div class="ca-elig-program-desc">${t.headStartDesc}</div>
              </div>
            `;
          }
          if (result.subsidy) {
            programsHtml += `
              <div class="ca-elig-program">
                <div class="ca-elig-program-title">🎯 ${t.subsidyTitle}</div>
                <div class="ca-elig-program-desc">${t.subsidyDesc}</div>
              </div>
            `;
          }
          if (result.cspp) {
            programsHtml += `
              <div class="ca-elig-program">
                <div class="ca-elig-program-title">📚 ${t.csppTitle}</div>
                <div class="ca-elig-program-desc">${t.csppDesc}</div>
              </div>
            `;
          }
          programsHtml += '</div>';
        }

        bodyContent = `
          <div class="ca-elig-results">
            <div class="ca-elig-banner ${bannerClass}">
              <h3>${bannerIcon} ${bannerTitle}</h3>
              <p>${bannerDesc}</p>
            </div>

            ${programsHtml}

            <div class="ca-elig-contact">
              <h4>📞 ${t.nextStep}</h4>
              <p>${t.nextStepDesc}</p>
              <div class="ca-elig-contact-info">
                <div><strong>${t.rrPhone}:</strong> <a href="tel:${rrPhone.replace(/[^0-9]/g, '')}">${rrPhone}</a></div>
                <div><a href="https://${rrWebsite}" target="_blank" rel="noopener">${t.findLocal} →</a></div>
              </div>
            </div>

            ${!hasPrograms ? `
              <div class="ca-elig-other">
                <h4>${t.otherOptionsTitle}</h4>
                <ul>
                  <li>${t.sliding}</li>
                  <li>${t.employer}</li>
                  <li>${t.fsa}</li>
                </ul>
              </div>
            ` : ''}

            <div class="ca-elig-actions">
              <button class="ca-elig-btn ca-elig-btn-secondary" id="ca-elig-reset">${t.startOver}</button>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="ca-elig-widget">
          <div class="ca-elig-header" id="ca-elig-toggle">
            <div class="ca-elig-header-content">
              <span class="ca-elig-icon">💰</span>
              <div>
                <p class="ca-elig-title">${t.title}</p>
                <p class="ca-elig-subtitle">${t.subtitle}</p>
              </div>
            </div>
            <svg class="${chevronClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
          <div class="${bodyClass}">
            ${bodyContent}
          </div>
          <div class="ca-elig-footer">
            ${t.poweredBy} <a href="https://mychildcareplan.org" target="_blank" rel="noopener">MyChildCarePlan.org</a>
          </div>
        </div>
      `;

      // Attach event listeners
      attachListeners();
    }

    function attachListeners() {
      // Toggle expand/collapse
      const toggle = document.getElementById('ca-elig-toggle');
      if (toggle) {
        toggle.onclick = () => {
          isExpanded = !isExpanded;
          render();
        };
      }

      // Household size
      const sizeSelect = document.getElementById('ca-elig-size');
      if (sizeSelect) {
        sizeSelect.onchange = (e) => {
          householdSize = parseInt(e.target.value) || 0;
          render();
        };
      }

      // Income input
      const incomeInput = document.getElementById('ca-elig-income');
      if (incomeInput) {
        incomeInput.oninput = (e) => {
          const numericValue = e.target.value.replace(/[^0-9]/g, '');
          if (numericValue) {
            income = parseInt(numericValue).toLocaleString();
          } else {
            income = '';
          }
          render();
        };
      }

      // Income type toggle
      const typeRadios = document.querySelectorAll('input[name="ca-elig-type"]');
      typeRadios.forEach(radio => {
        radio.onchange = (e) => {
          incomeType = e.target.value;
        };
      });

      // Check button
      const checkBtn = document.getElementById('ca-elig-check');
      if (checkBtn) {
        checkBtn.onclick = () => {
          const incomeNum = parseFloat(income.replace(/,/g, ''));
          if (isNaN(incomeNum)) return;
          const annualIncome = incomeType === 'monthly' ? incomeNum * 12 : incomeNum;
          result = checkEligibility(householdSize, annualIncome);
          render();
        };
      }

      // Reset button
      const resetBtn = document.getElementById('ca-elig-reset');
      if (resetBtn) {
        resetBtn.onclick = () => {
          householdSize = 0;
          income = '';
          result = null;
          render();
        };
      }
    }

    // Initial render
    render();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
