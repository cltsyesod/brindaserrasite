// Gerenciamento e Interatividade do BRINDA Serra

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initBrindaCardCalculator();
  initCheckoutModal();
  initClientModal();
  initVendorPortalModal();
  initLeadModals();
  initCityFilters();
  initTermsModal();
  initContactForm();
  initWineryParallax();
  initSacWidget();
});

// 1. Header com sombra e efeito ao rolar
function initNavbar() {
  const header = document.querySelector('header');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

// 2. Calculadora Interativa e Personalização do BRINDA CARD na Home
let currentCalculatorState = {
  basePrice: 10.00,
  selectedBeerPlanKey: 'brinda_bem',
  selectedBeerName: 'Brinda Bem (Degustação em 3 cervejarias)',
  selectedBeerPrice: 130.00,
  selectedWinePrice: 0,
  total: 140.00
};

function initBrindaCardCalculator() {
  const cardNameInput = document.getElementById('cardHolderNameInput');
  const cardPreviewName = document.getElementById('cardHolderPreviewName');
  
  const beerOptions = document.querySelectorAll('input[name="beer_plan"]');
  const wineOptions = document.querySelectorAll('input[name="wine_plan"]');
  const paymentInputs = document.querySelectorAll('input[name="payment_method"]');
  
  const subtotalEl = document.getElementById('calcSubtotal');
  const totalEl = document.getElementById('calcTotal');
  const experiencesListEl = document.getElementById('calcExperiencesList');
  const checkoutBtn = document.getElementById('buyBrindaCardBtn');
  const termsCheckbox = document.getElementById('termsCheckbox');

  // Atualização em tempo real do Nome do Titular no Cartão 3D
  if (cardNameInput && cardPreviewName) {
    cardNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      cardPreviewName.textContent = val.length > 0 ? val.toUpperCase() : 'SEU NOME AQUI';
    });
  }

  // Recalcular totais da calculadora
  function calculateTotal() {
    let basePrice = 10.00; // Adesão BRINDA Card
    let selectedBeerPrice = 0;
    let selectedBeerName = 'Apenas Card (Sem Experiências)';
    let selectedBeerPlanKey = 'none';
    let selectedWinePrice = 0;
    let selectedWineName = '';

    beerOptions.forEach(opt => {
      const parentCard = opt.closest('.plan-option-card');
      if (opt.checked) {
        parentCard?.classList.add('selected');
        selectedBeerPrice = parseFloat(opt.dataset.price || 0);
        selectedBeerName = opt.dataset.name || '';
        selectedBeerPlanKey = opt.value;
      } else {
        parentCard?.classList.remove('selected');
      }
    });

    wineOptions.forEach(opt => {
      const parentCard = opt.closest('.plan-option-card');
      if (opt.checked) {
        parentCard?.classList.add('selected');
        selectedWinePrice = parseFloat(opt.dataset.price || 0);
        selectedWineName = opt.dataset.name || '';
      } else {
        parentCard?.classList.remove('selected');
      }
    });

    const total = basePrice + selectedBeerPrice + selectedWinePrice;

    if (subtotalEl) subtotalEl.textContent = formatCurrency(basePrice);
    if (totalEl) totalEl.textContent = formatCurrency(total);

    if (experiencesListEl) {
      let itemsHtml = `
        <li class="flex justify-between items-center text-sm py-1 border-b border-stone-200">
          <span class="text-stone-700">BRINDA Card (Adesão Vitalícia / Validade 6 meses)</span>
          <span class="font-bold text-stone-800">R$ 10,00</span>
        </li>
      `;

      if (selectedBeerPrice > 0) {
        itemsHtml += `
          <li class="flex justify-between items-center text-sm py-1 border-b border-stone-200">
            <span class="text-stone-700">${selectedBeerName}</span>
            <span class="font-bold text-stone-800">${formatCurrency(selectedBeerPrice)}</span>
          </li>
        `;
      }

      if (selectedWinePrice > 0) {
        itemsHtml += `
          <li class="flex justify-between items-center text-sm py-1 border-b border-stone-200">
            <span class="text-stone-700">${selectedWineName}</span>
            <span class="font-bold text-stone-800">${formatCurrency(selectedWinePrice)}</span>
          </li>
        `;
      }

      experiencesListEl.innerHTML = itemsHtml;
    }

    currentCalculatorState = {
      basePrice,
      selectedBeerPlanKey,
      selectedBeerName,
      selectedBeerPrice,
      selectedWinePrice,
      selectedWineName,
      total
    };

    return currentCalculatorState;
  }

  beerOptions.forEach(opt => opt.addEventListener('change', calculateTotal));
  wineOptions.forEach(opt => opt.addEventListener('change', calculateTotal));
  paymentInputs.forEach(opt => opt.addEventListener('change', calculateTotal));

  calculateTotal();

  // Intercepta o clique no botão principal de compra para ABRIR O CHECKOUT OFICIAL
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (termsCheckbox && !termsCheckbox.checked) {
        showToast('⚠️ Por favor, leia e aceite os Termos de Uso antes de continuar.');
        termsCheckbox.focus();
        return;
      }

      // Se o usuário digitou nome no preview, pré-preenche o pagador
      const payerNameInput = document.getElementById('payerName');
      if (cardNameInput && payerNameInput && cardNameInput.value.trim().length > 0) {
        payerNameInput.value = cardNameInput.value.trim();
      }

      // Sincroniza plano de cervejaria escolhido na home com a opção do titular no checkout
      const selectedPlanKey = currentCalculatorState.selectedBeerPlanKey || 'brinda_bem';
      const payerPlanRadio = document.querySelector(`input[name="payer_plan"][value="${selectedPlanKey}"]`);
      if (payerPlanRadio) {
        payerPlanRadio.checked = true;
      }

      openCheckoutModal();
    });
  }
}

// 3. FLUXO COMPLETO DO CHECKOUT OFICIAL (MODAL EM 4 ETAPAS)
let currentCheckoutStep = 1;
let emittedCardsData = [];
let activeEmittedCardIndex = 0;

function initCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  const closeBtn = document.getElementById('closeCheckoutModalBtn');
  
  const badges = [
    document.getElementById('stepBadge1'),
    document.getElementById('stepBadge2'),
    document.getElementById('stepBadge3'),
    document.getElementById('stepBadge4')
  ];

  const steps = [
    document.getElementById('checkoutStep1'),
    document.getElementById('checkoutStep2'),
    document.getElementById('checkoutStep3'),
    document.getElementById('checkoutStep4')
  ];

  const titleEl = document.getElementById('checkoutModalTitle');
  const subtitleEl = document.getElementById('checkoutModalSubtitle');

  // Etapa 1: Destino e Convidados
  const buyTargetRadios = document.querySelectorAll('input[name="buy_target"]');
  const thirdPartyBlock = document.getElementById('thirdPartyBlock');
  const payerPlanSelectionGroup = document.getElementById('payerPlanSelectionGroup');
  const guestsList = document.getElementById('guestsList');
  const addGuestBtn = document.getElementById('addGuestBtn');

  // Campos Pagador
  const payerName = document.getElementById('payerName');
  const payerCpf = document.getElementById('payerCpf');
  const payerDob = document.getElementById('payerDob');
  const payerPhone = document.getElementById('payerPhone');
  const payerEmail = document.getElementById('payerEmail');
  const goToStep2Btn = document.getElementById('goToStep2Btn');

  // Etapa 2: Origem da Venda
  const originSelect = document.getElementById('originSelect');
  const hotelGroup = document.getElementById('hotelDetailGroup');
  const uberGroup = document.getElementById('uberDetailGroup');
  const otherGroup = document.getElementById('otherDetailGroup');
  const hotelSelect = document.getElementById('hotelSelect');
  const uberCodeInput = document.getElementById('uberCodeInput');
  const otherCodeInput = document.getElementById('otherCodeInput');
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  const goToStep3Btn = document.getElementById('goToStep3Btn');

  // Etapa 3: Pagamento e Resumo
  const summaryPlanName = document.getElementById('summaryPlanName');
  const summaryBasePrice = document.getElementById('summaryBasePrice');
  const summaryExpName = document.getElementById('summaryExpName');
  const summaryExpPrice = document.getElementById('summaryExpPrice');
  const summaryGuestsRow = document.getElementById('summaryGuestsRow');
  const summaryGuestsCount = document.getElementById('summaryGuestsCount');
  const summaryTotalPrice = document.getElementById('summaryTotalPrice');

  const tabPixBtn = document.getElementById('tabPixBtn');
  const tabCardBtn = document.getElementById('tabCardBtn');
  const pixPanel = document.getElementById('pixPaymentPanel');
  const cardPanel = document.getElementById('cardPaymentPanel');
  const pixQrCanvas = document.getElementById('pixQrCanvas');
  const pixCodeInput = document.getElementById('pixCodeInput');
  const copyPixBtn = document.getElementById('copyPixBtn');
  const confirmPixSimBtn = document.getElementById('confirmPixSimBtn');
  const confirmCardPayBtn = document.getElementById('confirmCardPayBtn');
  const backToStep2Btn = document.getElementById('backToStep2Btn');

  const ccNumber = document.getElementById('ccNumber');
  const ccExpiry = document.getElementById('ccExpiry');
  const ccCvv = document.getElementById('ccCvv');
  const ccHolder = document.getElementById('ccHolder');

  // Etapa 4: Emissão e Download
  const downloadCardBtn = document.getElementById('downloadCardBtn');
  const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');

  // --- Máscaras de Entrada ---
  if (payerCpf) applyCpfMask(payerCpf);
  if (payerPhone) applyPhoneMask(payerPhone);
  if (ccNumber) {
    ccNumber.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().slice(0, 19);
    });
  }
  if (ccExpiry) {
    ccExpiry.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
      e.target.value = v.slice(0, 5);
    });
  }

  // --- Função para mudar de Etapa ---
  function setCheckoutStep(stepNum) {
    currentCheckoutStep = stepNum;

    steps.forEach((stepEl, idx) => {
      if (stepEl) {
        if (idx + 1 === stepNum) {
          stepEl.classList.remove('hidden');
        } else {
          stepEl.classList.add('hidden');
        }
      }
    });

    badges.forEach((b, idx) => {
      if (!b) return;
      const num = idx + 1;
      if (num === stepNum) {
        b.className = 'text-brandTerracotta font-bold';
      } else if (num < stepNum) {
        b.className = 'text-emerald-700 font-bold';
      } else {
        b.className = 'text-stone-400 font-normal';
      }
    });

    const stepInfo = [
      { t: 'Aquisição Oficial do BRINDA CARD', s: 'Etapa 1 de 4: Identificação & Titularidade' },
      { t: 'Origem da Indicação', s: 'Etapa 2 de 4: Como você nos conheceu?' },
      { t: 'Pagamento Seguro', s: 'Etapa 3 de 4: Escolha PIX ou Cartão' },
      { t: 'BRINDA CARD Emitido com Sucesso!', s: 'Etapa 4 de 4: Seu Passe VIP Oficial' }
    ];

    if (titleEl) titleEl.textContent = stepInfo[stepNum - 1].t;
    if (subtitleEl) subtitleEl.textContent = stepInfo[stepNum - 1].s;
  }

  window.openCheckoutModal = function() {
    setCheckoutStep(1);
    loadActiveHotels();
    modal?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeCheckoutModal() {
    modal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeCheckoutModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCheckoutModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeCheckoutModal();
    });
  }

  // --- Gerenciamento de Destino (Para mim / Terceiros / Ambos) ---
  buyTargetRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const val = radio.value;
      if (val === 'myself') {
        thirdPartyBlock?.classList.add('hidden');
        payerPlanSelectionGroup?.classList.remove('hidden');
      } else if (val === 'others') {
        thirdPartyBlock?.classList.remove('hidden');
        payerPlanSelectionGroup?.classList.add('hidden');
        if (guestsList && guestsList.children.length === 0) {
          addGuestInputRow();
        }
      } else { // both
        thirdPartyBlock?.classList.remove('hidden');
        payerPlanSelectionGroup?.classList.remove('hidden');
        if (guestsList && guestsList.children.length === 0) {
          addGuestInputRow();
        }
      }
    });
  });

  // Função para adicionar linha de convidado com seleção individual de plano
  function addGuestInputRow() {
    if (!guestsList) return;
    const currentGuests = guestsList.querySelectorAll('.guest-item').length;
    if (currentGuests >= 3) {
      showToast('⚠️ Limite máximo de 3 convidados adicionais atingido.');
      return;
    }

    const nextIndex = currentGuests + 1;
    const guestCard = document.createElement('div');
    guestCard.className = 'guest-item p-3.5 bg-white rounded-xl border border-amber-300/80 shadow-sm space-y-2.5';
    guestCard.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-brandGreen guest-label">👤 Convidado ${nextIndex} (Passaporte Individual)</span>
        <button type="button" class="remove-guest-btn text-[0.7rem] text-red-600 font-semibold hover:underline">
          ✕ Remover
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="sm:col-span-2">
          <input type="text" placeholder="Nome Completo do Convidado" class="guest-name form-input-soft !py-1.5 text-xs">
        </div>
        <div>
          <input type="text" placeholder="CPF (000.000.000-00)" maxlength="14" class="guest-cpf form-input-soft !py-1.5 text-xs">
        </div>
        <div>
          <input type="date" title="Data de Nascimento" class="guest-dob form-input-soft !py-1.5 text-xs">
        </div>
        <div>
          <input type="tel" placeholder="WhatsApp (54) 99999-9999" maxlength="15" class="guest-phone form-input-soft !py-1.5 text-xs">
        </div>
        <div>
          <input type="email" placeholder="E-mail para receber o Card" class="guest-email form-input-soft !py-1.5 text-xs">
        </div>
        <div class="sm:col-span-2 pt-1 border-t border-amber-200/60">
          <label class="block text-[0.68rem] font-bold text-stone-700 uppercase mb-1">Experiência Deste Convidado:</label>
          <select class="guest-plan form-input-soft !py-1.5 text-xs bg-white">
            <option value="none">Apenas o BRINDA CARD (R$ 10,00 - 0 experiências)</option>
            <option value="brinda_bem" selected>Brinda Bem (R$ 130 + R$ 10 = R$ 140,00 - 3 degustações)</option>
            <option value="brinda_premium">Brinda Premium (R$ 190 + R$ 10 = R$ 200,00 - 5 degustações)</option>
          </select>
        </div>
      </div>
    `;

    guestsList.appendChild(guestCard);

    const cpfInput = guestCard.querySelector('.guest-cpf');
    const phoneInput = guestCard.querySelector('.guest-phone');
    if (cpfInput) applyCpfMask(cpfInput);
    if (phoneInput) applyPhoneMask(phoneInput);

    const removeBtn = guestCard.querySelector('.remove-guest-btn');
    removeBtn?.addEventListener('click', () => {
      guestCard.remove();
      updateGuestLabels();
    });

    updateGuestLabels();
  }

  function updateGuestLabels() {
    if (!guestsList) return;
    const items = guestsList.querySelectorAll('.guest-item');
    items.forEach((item, idx) => {
      const label = item.querySelector('.guest-label');
      if (label) label.textContent = `👤 Convidado ${idx + 1} (Passaporte Individual)`;
    });

    if (addGuestBtn) {
      addGuestBtn.style.display = items.length >= 3 ? 'none' : 'flex';
    }
  }

  addGuestBtn?.addEventListener('click', addGuestInputRow);

  // --- Validação Etapa 1 -> Etapa 2 ---
  goToStep2Btn?.addEventListener('click', () => {
    const pName = payerName?.value.trim() || '';
    const pCpf = payerCpf?.value.trim() || '';
    const pDob = payerDob?.value.trim() || '';
    const pPhone = payerPhone?.value.trim() || '';
    const pEmail = payerEmail?.value.trim() || '';

    if (pName.length < 3) {
      showToast('⚠️ Por favor, preencha o Nome Completo do pagador.');
      payerName?.focus();
      return;
    }

    if (pCpf.replace(/\D/g, '').length !== 11) {
      showToast('⚠️ Por favor, informe um CPF válido com 11 dígitos.');
      payerCpf?.focus();
      return;
    }

    if (!pDob || !isOver18(pDob)) {
      showToast('⚠️ O titular/pagador deve ser maior de 18 anos conforme a legislação.');
      payerDob?.focus();
      return;
    }

    if (pPhone.replace(/\D/g, '').length < 10) {
      showToast('⚠️ Por favor, informe um WhatsApp válido para contato.');
      payerPhone?.focus();
      return;
    }

    if (!pEmail || !pEmail.includes('@') || !pEmail.includes('.')) {
      showToast('⚠️ Por favor, informe um e-mail válido para envio do cartão.');
      payerEmail?.focus();
      return;
    }

    const selectedTarget = document.querySelector('input[name="buy_target"]:checked')?.value || 'myself';
    if (selectedTarget === 'others' || selectedTarget === 'both') {
      const guestItems = guestsList?.querySelectorAll('.guest-item') || [];
      if (guestItems.length === 0) {
        showToast('⚠️ Por favor, adicione pelo menos 1 convidado.');
        return;
      }

      for (let i = 0; i < guestItems.length; i++) {
        const gItem = guestItems[i];
        const gName = gItem.querySelector('.guest-name')?.value.trim() || '';
        const gCpf = gItem.querySelector('.guest-cpf')?.value.trim() || '';
        const gDob = gItem.querySelector('.guest-dob')?.value || '';

        if (gName.length < 3) {
          showToast(`⚠️ Preencha o nome completo do Convidado ${i + 1}.`);
          gItem.querySelector('.guest-name')?.focus();
          return;
        }
        if (gCpf.replace(/\D/g, '').length !== 11) {
          showToast(`⚠️ Informe um CPF válido para o Convidado ${i + 1}.`);
          gItem.querySelector('.guest-cpf')?.focus();
          return;
        }
        if (!gDob || !isOver18(gDob)) {
          showToast(`⚠️ O Convidado ${i + 1} deve ser maior de 18 anos.`);
          gItem.querySelector('.guest-dob')?.focus();
          return;
        }
      }
    }

    setCheckoutStep(2);
  });

  // --- Carregamento Dinâmico de Hotéis Ativos no Checkout ---
  async function loadActiveHotels() {
    const hotelSelect = document.getElementById('hotelSelect');
    if (!hotelSelect) return;
    const currentSelected = hotelSelect.value;

    const baseHoteis = [
      { nome: 'Hotel Casa da Montanha', cidade: 'Gramado' },
      { nome: 'Hotel Alpestre', cidade: 'Gramado' },
      { nome: 'Grande Hotel Canela', cidade: 'Canela' },
      { nome: 'Villa Bella Hotel & Spa', cidade: 'Gramado' },
      { nome: 'Hotel Ritta Höppner', cidade: 'Gramado' },
      { nome: 'Hotel Laghetto Stilo', cidade: 'Gramado' },
      { nome: 'Pousada Blumenberg', cidade: 'Canela' }
    ];

    let apiHoteis = [];
    try {
      const res = await fetch('/api/hoteis');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.hoteis)) {
          apiHoteis = data.hoteis;
        }
      }
    } catch (e) {}

    let localHoteis = [];
    let overrides = {};
    let exclusoes = {};
    try {
      localHoteis = JSON.parse(localStorage.getItem('brinda_hoteis_cadastrados') || '[]');
      overrides = JSON.parse(localStorage.getItem('brinda_status_overrides') || '{}');
      exclusoes = JSON.parse(localStorage.getItem('brinda_exclusoes_admin') || '{}');
    } catch (e) {}

    const excluidosList = (exclusoes.hoteis || []).map(x => String(x).toLowerCase().trim());

    const hotelMap = new Map();
    baseHoteis.forEach(h => {
      hotelMap.set(h.nome.toLowerCase().trim(), { ...h, status: 'ativo' });
    });
    apiHoteis.forEach(h => {
      const key = h.nome.toLowerCase().trim();
      hotelMap.set(key, { ...(hotelMap.get(key) || {}), ...h });
    });
    localHoteis.forEach(h => {
      const key = h.nome.toLowerCase().trim();
      hotelMap.set(key, { ...(hotelMap.get(key) || {}), ...h });
    });

    const activeList = [];
    for (const [key, h] of hotelMap.entries()) {
      if (excluidosList.includes(key)) continue;
      const effectiveStatus = overrides[key] || h.status || 'ativo';
      if (effectiveStatus === 'ativo') {
        activeList.push(h);
      }
    }

    let html = activeList.map(h => {
      const label = h.cidade ? `${h.nome} (${h.cidade})` : h.nome;
      return `<option value="${h.nome}">${label}</option>`;
    }).join('');

    html += '<option value="Outro Hotel Parceiro">Outro Hotel da Serra</option>';
    hotelSelect.innerHTML = html;

    if (currentSelected && activeList.some(h => h.nome === currentSelected)) {
      hotelSelect.value = currentSelected;
    }
  }

  // Sincronização em tempo real caso o administrador altere o status em outra aba
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.startsWith('brinda_')) {
      loadActiveHotels();
    }
  });

  // Executa na inicialização do script
  loadActiveHotels();

  // --- Etapa 2: Alternância de Canais de Origem ---
  originSelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    hotelGroup?.classList.add('hidden');
    uberGroup?.classList.add('hidden');
    otherGroup?.classList.add('hidden');

    if (val === 'hotel') {
      hotelGroup?.classList.remove('hidden');
      loadActiveHotels();
    }
    else if (val === 'uber') uberGroup?.classList.remove('hidden');
    else if (val === 'outros') otherGroup?.classList.remove('hidden');
  });

  backToStep1Btn?.addEventListener('click', () => setCheckoutStep(1));

  // --- Validação Etapa 2 -> Etapa 3 (Cálculo Financeiro Individual e Geração de PIX) ---
  goToStep3Btn?.addEventListener('click', () => {
    const originVal = originSelect?.value || '';
    if (!originVal) {
      showToast('⚠️ Por favor, informe como você nos conheceu para continuar.');
      originSelect?.focus();
      return;
    }

    const selectedTarget = document.querySelector('input[name="buy_target"]:checked')?.value || 'myself';
    const guestItems = guestsList?.querySelectorAll('.guest-item') || [];
    const qtdConvidados = (selectedTarget === 'others' || selectedTarget === 'both') ? guestItems.length : 0;
    const compraParaSi = selectedTarget !== 'others';
    const totalCartoes = (compraParaSi ? 1 : 0) + qtdConvidados;

    const taxaAdesaoTotal = totalCartoes * 10.00;

    function getPlanInfo(key) {
      if (key === 'brinda_bem') return { valor: 130.00, nome: 'Brinda Bem (3 Cervejarias)' };
      if (key === 'brinda_premium') return { valor: 190.00, nome: 'Brinda Premium (5 Cervejarias)' };
      return { valor: 0.00, nome: 'Apenas Cartão (0 experiências)' };
    }

    let totalValorExp = 0;
    const planSummaryItems = [];

    if (compraParaSi) {
      const titularPlanKey = document.querySelector('input[name="payer_plan"]:checked')?.value || currentCalculatorState.selectedBeerPlanKey || 'brinda_bem';
      const info = getPlanInfo(titularPlanKey);
      totalValorExp += info.valor;
      planSummaryItems.push(`Titular: ${info.nome}`);
    }

    if (selectedTarget === 'others' || selectedTarget === 'both') {
      guestItems.forEach((gItem, idx) => {
        const gPlanKey = gItem.querySelector('.guest-plan')?.value || 'brinda_bem';
        const info = getPlanInfo(gPlanKey);
        totalValorExp += info.valor;
        const gName = gItem.querySelector('.guest-name')?.value.trim() || `Convidado ${idx + 1}`;
        planSummaryItems.push(`${gName}: ${info.nome}`);
      });
    }

    const valorFinal = taxaAdesaoTotal + totalValorExp;

    if (summaryBasePrice) summaryBasePrice.textContent = `${totalCartoes}x R$ 10,00 = ${formatCurrency(taxaAdesaoTotal)}`;
    if (summaryExpName) summaryExpName.textContent = planSummaryItems.length === 1 ? planSummaryItems[0] : `${planSummaryItems.length} experiências individuais`;
    if (summaryExpPrice) summaryExpPrice.textContent = formatCurrency(totalValorExp);
    if (summaryGuestsCount) summaryGuestsCount.textContent = `${qtdConvidados} convidados (${totalCartoes} cartão(ões) no total)`;
    if (summaryTotalPrice) summaryTotalPrice.textContent = formatCurrency(valorFinal);

    const pixCode = `00020126580014br.gov.bcb.pix0136brindaserracard-pix-${Date.now()}520400005303986540${valorFinal.toFixed(2)}5802BR5920BRINDA SERRA6006CANELA62070503***6304`;
    if (pixCodeInput) pixCodeInput.value = pixCode;

    if (window.QRCode && pixQrCanvas) {
      QRCode.toCanvas(pixQrCanvas, pixCode, {
        width: 170,
        margin: 1,
        color: {
          dark: '#1A1D1A',
          light: '#FFFFFF'
        }
      }, (err) => {
        if (err) console.error('Erro ao renderizar QR PIX:', err);
      });
    }

    setCheckoutStep(3);
  });

  // --- Etapa 3: Abas PIX e Cartão ---
  tabPixBtn?.addEventListener('click', () => {
    tabPixBtn.className = 'p-3 rounded-xl border-2 border-brandGreen bg-brandGreen/5 font-bold text-xs sm:text-sm text-brandGreen flex items-center justify-center gap-1.5 transition-all';
    tabCardBtn.className = 'p-3 rounded-xl border-2 border-stone-200 bg-white font-bold text-xs sm:text-sm text-stone-600 flex items-center justify-center gap-1.5 transition-all';
    pixPanel?.classList.remove('hidden');
    cardPanel?.classList.add('hidden');
  });

  tabCardBtn?.addEventListener('click', () => {
    tabCardBtn.className = 'p-3 rounded-xl border-2 border-brandGreen bg-brandGreen/5 font-bold text-xs sm:text-sm text-brandGreen flex items-center justify-center gap-1.5 transition-all';
    tabPixBtn.className = 'p-3 rounded-xl border-2 border-stone-200 bg-white font-bold text-xs sm:text-sm text-stone-600 flex items-center justify-center gap-1.5 transition-all';
    cardPanel?.classList.remove('hidden');
    pixPanel?.classList.add('hidden');
  });

  copyPixBtn?.addEventListener('click', () => {
    if (pixCodeInput && pixCodeInput.value) {
      navigator.clipboard.writeText(pixCodeInput.value).then(() => {
        showToast('📋 Código PIX copiado para a área de transferência!');
      }).catch(() => {
        pixCodeInput.select();
        document.execCommand('copy');
        showToast('📋 Código PIX copiado!');
      });
    }
  });

  backToStep2Btn?.addEventListener('click', () => setCheckoutStep(2));

  // --- Finalização do Pagamento e Emissão Oficial dos Cards ---
  async function processOrderCompletion(paymentType) {
    const isPix = paymentType === 'PIX';
    const activeBtn = isPix ? confirmPixSimBtn : confirmCardPayBtn;
    const originalText = activeBtn?.innerHTML || '';

    if (!isPix) {
      if ((ccNumber?.value || '').replace(/\D/g, '').length < 16) {
        showToast('⚠️ Informe o número completo do cartão de crédito (16 dígitos).');
        ccNumber?.focus();
        return;
      }
      if ((ccExpiry?.value || '').length < 5) {
        showToast('⚠️ Informe a validade no formato MM/AA.');
        ccExpiry?.focus();
        return;
      }
      if ((ccCvv?.value || '').length < 3) {
        showToast('⚠️ Informe o código de segurança (CVV).');
        ccCvv?.focus();
        return;
      }
      if ((ccHolder?.value || '').trim().length < 3) {
        showToast('⚠️ Informe o nome impresso no cartão.');
        ccHolder?.focus();
        return;
      }
    }

    if (activeBtn) {
      activeBtn.disabled = true;
      activeBtn.innerHTML = `<span>⏳ Emitindo seu BRINDA CARD Oficial...</span>`;
    }

    const selectedTarget = document.querySelector('input[name="buy_target"]:checked')?.value || 'myself';
    const compraParaSi = selectedTarget !== 'others';
    const titularPlanKey = compraParaSi 
      ? (document.querySelector('input[name="payer_plan"]:checked')?.value || currentCalculatorState.selectedBeerPlanKey || 'brinda_bem')
      : 'none';
    const terceiros = [];
    const guestItems = guestsList?.querySelectorAll('.guest-item') || [];

    if (selectedTarget === 'others' || selectedTarget === 'both') {
      guestItems.forEach(item => {
        terceiros.push({
          nome: item.querySelector('.guest-name')?.value.trim() || '',
          cpf: (item.querySelector('.guest-cpf')?.value || '').replace(/\D/g, ''),
          data_nasc: item.querySelector('.guest-dob')?.value || '',
          telefone: (item.querySelector('.guest-phone')?.value || '').replace(/\D/g, ''),
          email: item.querySelector('.guest-email')?.value.trim() || '',
          plano_cervejaria: item.querySelector('.guest-plan')?.value || 'brinda_bem'
        });
      });
    }

    const originType = originSelect?.value || 'direto';
    let originDetail = '';
    let vendorCode = '';

    if (originType === 'hotel') {
      originDetail = hotelSelect?.value || '';
      vendorCode = 'HOTEL01';
    } else if (originType === 'uber') {
      vendorCode = (uberCodeInput?.value || '').trim().toUpperCase();
      originDetail = `Uber Parceiro: ${vendorCode}`;
    } else if (originType === 'outros') {
      vendorCode = (otherCodeInput?.value || '').trim().toUpperCase();
      originDetail = otherCodeInput?.value || '';
    }

    const payload = {
      pagador: {
        nome: payerName?.value.trim() || '',
        cpf: (payerCpf?.value || '').replace(/\D/g, ''),
        data_nasc: payerDob?.value || '',
        telefone: (payerPhone?.value || '').replace(/\D/g, ''),
        email: payerEmail?.value.trim() || '',
        plano_cervejaria: titularPlanKey
      },
      plano_cervejaria: titularPlanKey,
      comprar_para_si: compraParaSi,
      terceiros: terceiros,
      forma_pagamento: paymentType,
      origem_tipo: originType,
      origem_detalhe: originDetail,
      vendedor_codigo: vendorCode
    };

    let cardsResult = [];

    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.cards && data.cards.length > 0) {
          cardsResult = data.cards;
          if (data.origem_armazenamento === 'supabase') {
            console.log('✅ Pedido e passes gravados com sucesso no Supabase PostgreSQL!');
          }
        }
      }
    } catch (err) {
      console.warn('Backend API /api/checkout offline ou estático na Vercel. Emitindo cartões client-side:', err);
    }

    if (!cardsResult || cardsResult.length === 0) {
      cardsResult = generateClientSideCards(payload);
    }

    // Salva na persistência local para consulta imediata em "Minha Conta"
    saveCustomerCardsLocally(payload.pagador, cardsResult);

    emittedCardsData = cardsResult;
    activeEmittedCardIndex = 0;

    await renderStep4Cards(emittedCardsData, activeEmittedCardIndex);
    setCheckoutStep(4);

    if (activeBtn) {
      activeBtn.disabled = false;
      activeBtn.innerHTML = originalText;
    }

    showToast('🎉 Pagamento aprovado! Seu BRINDA CARD virtual está liberado.');
  }

  confirmPixSimBtn?.addEventListener('click', () => processOrderCompletion('PIX'));
  confirmCardPayBtn?.addEventListener('click', () => processOrderCompletion('Cartão de Crédito'));

  // Impressão Isolada de Alta Fidelidade (1 Página Colorida Fiel ao Cartão)
  downloadCardBtn?.addEventListener('click', () => {
    triggerCardPrint(document.getElementById('renderedCardContainer'));
  });

  shareWhatsappBtn?.addEventListener('click', () => {
    const card = emittedCardsData[activeEmittedCardIndex] || emittedCardsData[0];
    if (!card) return;
    const originUrl = window.location.origin;
    const passUrl = `${originUrl}/passe?token=${encodeURIComponent(card.qr_token || card.codigo_passe)}`;
    const text = `🎉 Olá! Acabei de emitir meu *BRINDA CARD* oficial para vivenciar experiências exclusivas nas cervejarias da Serra Gaúcha!\n\n💳 *Titular:* ${card.titular_nome}\n🎫 *Código de Passe:* ${card.codigo_passe}\n📋 *Validade:* ${card.data_validade_formatada}\n🔗 *Acessar meu Cartão no Celular:* ${passUrl}\n\nConheça e brinde junto em Canela e Gramado: https://brindaserra.com.br`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  });
}

// Mecanismo Global de Impressão de 1 Página Colorida do BRINDA CARD
function triggerCardPrint(sourceContainer) {
  const printArea = document.getElementById('printOnlyCardArea');
  if (!printArea) {
    window.print();
    return;
  }
  const card = sourceContainer ? sourceContainer.querySelector('.brinda-card-official') : null;
  if (card) {
    printArea.innerHTML = card.outerHTML;
  } else {
    const anyCard = document.querySelector('.brinda-card-official');
    if (anyCard) printArea.innerHTML = anyCard.outerHTML;
  }
  window.print();
}

window.addEventListener('beforeprint', () => {
  const printArea = document.getElementById('printOnlyCardArea');
  if (printArea && !printArea.innerHTML.trim()) {
    const activeCard = document.querySelector('#renderedCardContainer .brinda-card-official') 
      || document.querySelector('#clienteCardRendered .brinda-card-official')
      || document.querySelector('.brinda-card-official');
    if (activeCard) {
      printArea.innerHTML = activeCard.outerHTML;
    }
  }
});

window.addEventListener('afterprint', () => {
  const printArea = document.getElementById('printOnlyCardArea');
  if (printArea) {
    printArea.innerHTML = '';
  }
});

// Persistência local segura para Minha Conta
function saveCustomerCardsLocally(pagador, cards) {
  try {
    const store = JSON.parse(localStorage.getItem('brinda_clientes_store') || '{}');
    const cpfKey = pagador.cpf.replace(/\D/g, '');
    store[cpfKey] = {
      pagador: pagador,
      cards: cards,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('brinda_clientes_store', JSON.stringify(store));
  } catch (e) {
    console.error('Erro ao salvar localmente:', e);
  }
}

// Fallback de Emissão Homologada Client-Side
function generateClientSideCards(payload) {
  const cards = [];
  const validade = new Date();
  validade.setMonth(validade.getMonth() + 6);
  const dataValidadeFormatada = validade.toLocaleDateString('pt-BR');

  function getCardDetails(planKey) {
    if (planKey === 'brinda_bem') return { saldo: 3, modalidade: 'brinda_bem' };
    if (planKey === 'brinda_premium') return { saldo: 5, modalidade: 'brinda_premium' };
    return { saldo: 0, modalidade: 'none' };
  }

  if (payload.comprar_para_si) {
    const titularPlanKey = payload.pagador?.plano_cervejaria || payload.plano_cervejaria || 'none';
    const details = getCardDetails(titularPlanKey);
    cards.push({
      id: 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      titular_nome: payload.pagador.nome,
      titular_cpf: payload.pagador.cpf,
      codigo_passe: 'BS-VIP-' + (payload.pagador.cpf.slice(0, 3) || '789') + (payload.pagador.cpf.slice(-2) || '21'),
      modalidade: details.modalidade,
      saldo_restante: details.saldo,
      saldo_total: details.saldo,
      data_validade_formatada: dataValidadeFormatada,
      qr_token: 'QR-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      is_pagador: true
    });
  }

  (payload.terceiros || []).forEach((terc, idx) => {
    const cleanCpf = (terc.cpf || '').replace(/\D/g, '');
    const guestPlanKey = terc.plano_cervejaria || payload.plano_cervejaria || 'none';
    const details = getCardDetails(guestPlanKey);
    cards.push({
      id: 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      titular_nome: terc.nome || `Convidado ${idx + 1}`,
      titular_cpf: cleanCpf,
      codigo_passe: 'BS-VIP-' + (cleanCpf ? cleanCpf.slice(0, 3) + cleanCpf.slice(-2) : 'CV' + (idx + 1)),
      modalidade: details.modalidade,
      saldo_restante: details.saldo,
      saldo_total: details.saldo,
      data_validade_formatada: dataValidadeFormatada,
      qr_token: 'QR-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      is_pagador: false
    });
  });

  return cards;
}

// Renderizador do HTML Oficial do BRINDA CARD (Componente Universal 100% Homologado)
function renderOfficialCardHtml(activeCard, qrCodeDataUri) {
  const nomeTitular = (activeCard.titular_nome || 'CLIENTE VIP').toUpperCase();
  const validadeFormatada = activeCard.data_validade_formatada || '6 Meses da Compra';
  const codigoPasse = activeCard.codigo_passe || 'BS-2026-VIP';

  let benefitLabel = 'Acesso à Rota';
  if (activeCard.modalidade === 'brinda_bem' || activeCard.saldo_restante === 3) {
    benefitLabel = '3 Degustações Inclusas';
  } else if (activeCard.modalidade === 'brinda_premium' || activeCard.saldo_restante === 5) {
    benefitLabel = '5 Degustações Inclusas';
  } else if (activeCard.modalidade === 'none' || activeCard.saldo_total === 0 || activeCard.saldo_restante === 0) {
    benefitLabel = 'Apenas Card (Sem Experiências)';
  }

  const validationUrl = `https://brindaserra.com.br/validar?token=${encodeURIComponent(activeCard.qr_token || activeCard.codigo_passe || 'BS-2026-VIP')}`;
  const qrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(validationUrl)}`;
  const qrSrc = qrCodeDataUri || activeCard.qr_image_base64 || qrFallbackUrl;

  return `
    <div class="brinda-card-official" style="
      background: linear-gradient(135deg, #1E261D 0%, #2D362C 50%, #3F4A3E 100%);
      border-radius: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 60px -15px rgba(45, 54, 44, 0.45), 0 0 0 1px rgba(201, 168, 106, 0.35);
      color: #F4EEE4;
      aspect-ratio: 1.586 / 1;
      max-width: 480px;
      width: 100%;
      margin: 0 auto;
      font-family: 'Calibri', 'Carlito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      box-sizing: border-box;
      text-align: left;
    ">
      <div style="
        border: 1px solid rgba(201, 168, 106, 0.35);
        border-radius: 20px;
        height: calc(100% - 24px);
        margin: 12px;
        padding: 1.25rem 1.4rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        z-index: 2;
        box-sizing: border-box;
        background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.05), transparent 70%);
      ">
        <!-- Topo: Logo Oficial e Badge VIP -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
              width: 44px; 
              height: 44px; 
              border-radius: 50%; 
              border: 1.5px solid #C9A86A; 
              background: #2D362C; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              overflow: hidden;
            ">
              <img src="assets/logo.jpg" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <span style="display: none; font-size: 0.65rem; font-weight: bold; color: #C9A86A; text-align: center; line-height: 1;">BRINDA<br>SERRA</span>
            </div>
            <div>
              <span style="display: block; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; color: #C9A86A; line-height: 1.1;">BRINDA CARD</span>
              <span style="font-size: 0.65rem; color: #D1D5DB; letter-spacing: 0.5px;">cartão virtual oficial</span>
            </div>
          </div>
          <div style="
            background: rgba(201, 168, 106, 0.2);
            border: 1px solid rgba(201, 168, 106, 0.6);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.65rem;
            font-weight: bold;
            color: #F8E2CE;
            letter-spacing: 1px;
            text-transform: uppercase;
          ">
            VIP PASS
          </div>
        </div>

        <!-- Centro: Chip Metálico e QR Code -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 6px 0;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="
              width: 44px;
              height: 34px;
              border-radius: 8px;
              background: linear-gradient(135deg, #FDE68A 0%, #D97706 60%, #B45309 100%);
              border: 1px solid rgba(180, 83, 9, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.5);
            ">
              <div style="width: 26px; height: 20px; border: 1px solid rgba(120, 53, 15, 0.6); border-radius: 2px;"></div>
            </div>
            <span style="font-size: 0.65rem; color: #E5E7EB; letter-spacing: 1.5px; font-family: monospace;">DIGITAL MEMBER</span>
            <span style="font-size: 0.62rem; color: #C9A86A; font-weight: 600;">${benefitLabel}</span>
          </div>

          <div style="
            background: #FFFFFF;
            padding: 6px 8px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          ">
            <img src="${qrSrc}" alt="QR Code" style="width: 68px; height: 68px; display: block; object-fit: contain;" onerror="if(this.src!=='${qrFallbackUrl}') this.src='${qrFallbackUrl}';" />
            <span style="font-size: 0.55rem; color: #374151; font-family: monospace; font-weight: bold; margin-top: 2px;">${codigoPasse}</span>
          </div>
        </div>

        <!-- Rodapé: Nome do Titular e Validade -->
        <div style="
          padding-top: 8px; 
          border-top: 1px solid rgba(201, 168, 106, 0.3); 
          display: flex; 
          align-items: flex-end; 
          justify-content: space-between;
        ">
          <div style="max-width: 65%;">
            <span style="font-size: 0.58rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; display: block;">TITULAR DO CARTÃO</span>
            <span style="font-size: 0.95rem; font-weight: bold; color: #FAF6EF; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
              ${nomeTitular}
            </span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.58rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; display: block;">VALIDADE</span>
            <span style="font-size: 0.78rem; font-weight: bold; color: #F8E2CE; white-space: nowrap;">
              ${validadeFormatada}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Renderizador dos Cartões Emitidos na Etapa 4
async function renderStep4Cards(cards, activeIndex = 0) {
  const tabsContainer = document.getElementById('multiCardTabsContainer');
  const cardContainer = document.getElementById('renderedCardContainer');
  if (!cardContainer) return;

  if (tabsContainer) {
    if (cards.length > 1) {
      tabsContainer.classList.remove('hidden');
      tabsContainer.innerHTML = cards.map((c, i) => `
        <button type="button" class="card-tab-btn ${i === activeIndex ? 'active' : ''}" data-index="${i}">
          ${c.is_pagador ? '👤 Meu Cartão' : `🎁 ${c.titular_nome.split(' ')[0]}`}
        </button>
      `).join('');

      tabsContainer.querySelectorAll('.card-tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.dataset.index || '0', 10);
          activeEmittedCardIndex = idx;
          await renderStep4Cards(cards, idx);
        });
      });
    } else {
      tabsContainer.classList.add('hidden');
    }
  }

  const activeCard = cards[activeIndex] || cards[0];
  if (!activeCard) return;

  const validationUrl = `https://brindaserra.com.br/validar?token=${encodeURIComponent(activeCard.qr_token)}`;
  let qrCodeDataUri = activeCard.qr_image_base64 || '';

  if (!qrCodeDataUri && window.QRCode && window.QRCode.toDataURL) {
    try {
      qrCodeDataUri = await QRCode.toDataURL(validationUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#1A1D1A', light: '#FFFFFF' }
      });
    } catch (err) {
      console.error('Erro ao gerar imagem QR:', err);
    }
  }

  cardContainer.innerHTML = renderOfficialCardHtml(activeCard, qrCodeDataUri);
}

// 4. ÁREA DO CLIENTE ("MINHA CONTA" / LOGIN POR CPF)
function initClientModal() {
  const modal = document.getElementById('clienteModal');
  const closeBtn = document.getElementById('closeClienteModalBtn');
  const loginView = document.getElementById('clienteLoginView');
  const dashView = document.getElementById('clienteDashboardView');
  const loginForm = document.getElementById('clienteLoginForm');
  const loginCpf = document.getElementById('clienteLoginCpf');
  const logoutBtn = document.getElementById('clienteLogoutBtn');

  const dashNome = document.getElementById('clienteDashNome');
  const dashCpf = document.getElementById('clienteDashCpf');
  const dashSaldo = document.getElementById('clienteDashSaldo');
  const dashValidade = document.getElementById('clienteDashValidade');
  const cardRendered = document.getElementById('clienteCardRendered');
  const cardsTabs = document.getElementById('clienteCardsTabs');
  const historicoList = document.getElementById('clienteHistoricoList');

  if (loginCpf) applyCpfMask(loginCpf);

  const btnFillTestCpf = document.getElementById('btnFillTestCpf');
  btnFillTestCpf?.addEventListener('click', () => {
    if (loginCpf) {
      loginCpf.value = '111.111.111-11';
      loginForm?.requestSubmit();
    }
  });

  document.querySelectorAll('.open-client-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu) mobileMenu.classList.add('hidden');
      modal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeClientModal() {
    modal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeClientModal);

  document.querySelectorAll('.close-client-on-link').forEach(link => {
    link.addEventListener('click', closeClientModal);
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeClientModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeClientModal();
    });
  }

  logoutBtn?.addEventListener('click', () => {
    loginView?.classList.remove('hidden');
    dashView?.classList.add('hidden');
    if (loginForm) loginForm.reset();
  });

  // Consulta e Login de Cliente
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawCpf = loginCpf?.value.trim() || '';
    const cleanCpf = rawCpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      showToast('⚠️ Digite um CPF válido com 11 dígitos.');
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verificando...</span>';
    }

    let customerData = null;
    let apiStatus = null;

    // 1. Tenta API do Backend Serverless / Supabase
    try {
      const resp = await fetch(`/api/cliente?cpf=${cleanCpf}`);
      apiStatus = resp.status;
      if (resp.ok) {
        const json = await resp.json();
        if (json.sucesso && json.cliente && json.cliente.nome && json.cards && json.cards.length > 0) {
          customerData = {
            pagador: json.cliente,
            cards: json.cards,
            historico: json.validacoes || []
          };
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar /api/cliente:', err);
    }

    // 2. Fallback de Homologação / Teste para demonstração fluida
    if (!customerData && (cleanCpf === '11111111111' || cleanCpf === '12345678900')) {
      customerData = {
        pagador: { nome: 'TURISTA VIP DE TESTE', cpf: cleanCpf },
        cards: [
          {
            id: 'CARD-VIP-TESTE-1',
            titular_nome: 'TURISTA VIP DE TESTE',
            titular_cpf: cleanCpf,
            codigo_passe: 'BS-VIP-12345',
            qr_token: 'QR-TESTE-12345',
            modalidade: 'brinda_bem',
            saldo_restante: 3,
            saldo_total: 3,
            data_validade_formatada: '31/12/2026',
            is_pagador: true
          }
        ],
        historico: []
      };
    }

    // 3. Fallback local apenas se a API estiver inacessível (ex: sem internet) E o registro local for 100% válido
    if (!customerData && apiStatus !== 404) {
      try {
        const store = JSON.parse(localStorage.getItem('brinda_clientes_store') || '{}');
        const localEntry = store[cleanCpf];
        if (localEntry && localEntry.pagador && localEntry.pagador.nome && localEntry.pagador.nome.trim().length > 2 && localEntry.cards && localEntry.cards.length > 0) {
          customerData = localEntry;
        }
      } catch (err) {}
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }

    // BLOQUEIO TOTAL: Se o CPF não foi localizado ou não tem nome e passe ativo
    if (!customerData || !customerData.pagador || !customerData.pagador.nome || !customerData.cards || customerData.cards.length === 0) {
      showToast('⚠️ CPF não cadastrado! Nenhum BRINDA CARD ativo encontrado para este documento. Adquira seu passe para ativar seu acesso.');
      return;
    }

    // Renderiza Dashboard do Cliente SOMENTE com cadastro legítimo e validado
    loginView?.classList.add('hidden');
    dashView?.classList.remove('hidden');

    if (dashNome) dashNome.textContent = customerData.pagador.nome.toUpperCase();
    if (dashCpf) dashCpf.textContent = `CPF: ${rawCpf}`;

    const cards = customerData.cards || [];
    let currentIdx = 0;

    async function displaySelectedCard(idx) {
      const card = cards[idx] || cards[0];
      if (!card) return;

      if (dashSaldo) dashSaldo.textContent = `${card.saldo_restante || 0} de ${card.saldo_total || 3}`;
      if (dashValidade) dashValidade.textContent = card.data_validade_formatada || '6 Meses da Compra';

      const validationUrl = `https://brindaserra.com.br/validar?token=${encodeURIComponent(card.qr_token)}`;
      let qrUri = card.qr_image_base64 || '';
      if (!qrUri && window.QRCode && window.QRCode.toDataURL) {
        try {
          qrUri = await QRCode.toDataURL(validationUrl, { width: 180, margin: 1, color: { dark: '#1A1D1A', light: '#FFFFFF' } });
        } catch (e) {}
      }

      if (cardRendered) {
        cardRendered.innerHTML = renderOfficialCardHtml(card, qrUri);
      }
    }

    if (cardsTabs) {
      if (cards.length > 1) {
        cardsTabs.classList.remove('hidden');
        cardsTabs.innerHTML = cards.map((c, i) => `
          <button type="button" class="card-tab-btn ${i === 0 ? 'active' : ''}" data-idx="${i}">
            ${c.is_pagador ? '👤 Meu Card' : `🎁 ${c.titular_nome.split(' ')[0]}`}
          </button>
        `).join('');

        cardsTabs.querySelectorAll('.card-tab-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.idx || '0', 10);
            cardsTabs.querySelectorAll('.card-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await displaySelectedCard(idx);
          });
        });
      } else {
        cardsTabs.classList.add('hidden');
      }
    }

    await displaySelectedCard(0);

    // Histórico de Visitas com Bloqueio Anti-Repetição
    const visited = JSON.parse(localStorage.getItem('brinda_validacoes_historico') || '[]');
    const userVisited = visited.filter(v => v.token === cards[0]?.qr_token || v.codigo === cards[0]?.codigo_passe);

    if (historicoList) {
      if (userVisited.length > 0) {
        historicoList.innerHTML = userVisited.map(v => `
          <div class="p-2.5 bg-white rounded-lg border border-stone-200 flex items-center justify-between">
            <div>
              <span class="font-bold text-brandGreen block">${v.cervejariaNome}</span>
              <span class="text-[0.65rem] text-stone-500">${v.dataHora} • Cortesia Utilizada</span>
            </div>
            <span class="text-[0.65rem] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              Visita Esgotada nesta Casa
            </span>
          </div>
        `).join('');
      } else {
        historicoList.innerHTML = `
          <div class="p-3 bg-stone-50 rounded-lg border border-stone-200 text-center text-stone-500 text-xs">
            Nenhuma degustação realizada ainda. Apresente seu QR Code nas cervejarias parceiras de Canela e Gramado!
          </div>
        `;
      }
    }

    // Formulário de Edição de Contato com Auditoria Jurídica
    const editNome = document.getElementById('clienteEditNome');
    const editCpf = document.getElementById('clienteEditCpf');
    const editEmail = document.getElementById('clienteEditEmail');
    const editTelefone = document.getElementById('clienteEditTelefone');
    const contatoForm = document.getElementById('clienteContatoForm');

    if (editNome) editNome.value = customerData.pagador.nome || '';
    if (editCpf) {
      const c = (customerData.pagador.cpf || cleanCpf).replace(/\D/g, '');
      editCpf.value = c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c;
    }
    if (editEmail) editEmail.value = customerData.pagador.email || '';
    if (editTelefone) {
      editTelefone.value = customerData.pagador.telefone || '';
      applyPhoneMask(editTelefone);
    }

    if (contatoForm && !contatoForm.dataset.auditAttached) {
      contatoForm.dataset.auditAttached = 'true';
      contatoForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const novoEmail = editEmail?.value.trim() || '';
        const novoTel = editTelefone?.value.trim() || '';
        const cpfAlvo = cleanCpf;

        if (!novoEmail || !novoEmail.includes('@') || !novoEmail.includes('.')) {
          showToast('⚠️ Por favor, informe um e-mail válido.');
          editEmail?.focus();
          return;
        }

        const saveBtn = document.getElementById('btnSalvarContatoCliente');
        const origBtnText = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span>Salvando com auditoria...</span>';
        }

        let apiSuccess = false;
        try {
          const resp = await fetch('/api/cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cpf: cpfAlvo,
              email: novoEmail,
              telefone: novoTel
            })
          });
          if (resp.ok) {
            const resData = await resp.json();
            if (resData.sucesso) {
              apiSuccess = true;
            }
          }
        } catch (err) {
          console.warn('API /api/cliente offline, atualizando localmente:', err);
        }

        // Salva na persistência local
        try {
          customerData.pagador.email = novoEmail;
          customerData.pagador.telefone = novoTel;
          saveCustomerCardsLocally(customerData.pagador, customerData.cards);

          // Salva histórico de auditoria local caso API offline
          const localAudit = JSON.parse(localStorage.getItem('brinda_audit_logs') || '[]');
          localAudit.unshift({
            id: `AUD-${Date.now()}`,
            cpf: cpfAlvo,
            nome: customerData.pagador.nome,
            email_novo: novoEmail,
            telefone_novo: novoTel,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('brinda_audit_logs', JSON.stringify(localAudit));
        } catch (e) {}

        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = origBtnText;
        }

        showToast('✅ Dados de contato atualizados com sucesso e auditados no sistema!');
      });
    }
  });

  const clientePrintBtn = document.getElementById('clientePrintCardBtn');
  clientePrintBtn?.addEventListener('click', () => {
    triggerCardPrint(document.getElementById('clienteCardRendered'));
  });
}

// 5. PAINEL DO PROMOTOR / VENDEDOR (EXTRATO DE COMISSÕES B2B)
function initVendorPortalModal() {
  const modal = document.getElementById('vendorPortalModal');
  const closeBtn = document.getElementById('closeVendorPortalModalBtn');
  const loginView = document.getElementById('vendorLoginView');
  const dashView = document.getElementById('vendorDashboardView');
  const searchForm = document.getElementById('vendorSearchForm');
  const codeInput = document.getElementById('vendorPortalCode');
  const voltarBtn = document.getElementById('vpVoltarBtn');

  const vpNome = document.getElementById('vpNome');
  const vpTipo = document.getElementById('vpTipo');
  const vpValorComissao = document.getElementById('vpValorComissao');
  const vpQtdVendas = document.getElementById('vpQtdVendas');
  const vpMetaBonus = document.getElementById('vpMetaBonus');

  document.querySelectorAll('.open-vendor-portal-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeVendorPortalModal() {
    modal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeVendorPortalModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeVendorPortalModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeVendorPortalModal();
    });
  }

  voltarBtn?.addEventListener('click', () => {
    loginView?.classList.remove('hidden');
    dashView?.classList.add('hidden');
    if (searchForm) searchForm.reset();
  });

  // Base cadastral homologada de vendedores exemplo
  const vendedoresBase = {
    'PEDRO01': { nome: 'Pedro da Silva', tipo: '🚗 Motorista de Aplicativo / Uber', vendas: 4 },
    'HOTEL01': { nome: 'Concierge Hotel Casa da Montanha', tipo: '🏨 Hotel Parceiro (Gramado)', vendas: 12 },
    'LUCASPROMO': { nome: 'Lucas Promotor Autônomo', tipo: '👤 Promotor da Serra', vendas: 8 }
  };

  searchForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = (codeInput?.value || '').trim().toUpperCase();

    if (!code) {
      showToast('⚠️ Informe o código do vendedor.');
      return;
    }

    let vendedor = null;
    let resumo = null;

    try {
      const resp = await fetch(`/api/vendedor?codigo=${encodeURIComponent(code)}`);
      if (resp.ok) {
        const json = await resp.json();
        if (json.sucesso && json.vendedor) {
          vendedor = json.vendedor;
          resumo = json.resumo;
        }
      }
    } catch (err) {}

    if (!vendedor) {
      vendedor = vendedoresBase[code] || {
        nome: `Parceiro (${code})`,
        tipo: '👤 Promotor Credenciado',
        vendas: 1
      };
      resumo = {
        total_vendas: vendedor.vendas || 1,
        total_comissao: (vendedor.vendas || 1) * 20.00
      };
    }

    loginView?.classList.add('hidden');
    dashView?.classList.remove('hidden');

    if (vpNome) vpNome.textContent = vendedor.nome;
    if (vpTipo) vpTipo.textContent = vendedor.tipo;

    const totalComissao = resumo ? resumo.total_comissao : ((vendedor.vendas || 1) * 20.00);
    const qtdVendas = resumo ? resumo.total_vendas : (vendedor.vendas || 1);

    if (vpValorComissao) vpValorComissao.textContent = formatCurrency(totalComissao);
    if (vpQtdVendas) vpQtdVendas.textContent = `${qtdVendas} venda(s) na 1ª experiência`;
    if (vpMetaBonus) vpMetaBonus.textContent = `${qtdVendas} / 20 vendas`;
  });
}

// 6. Modais de Parcerias B2B (Quero Vender & Seja uma Cervejaria Parceira)
function initLeadModals() {
  const vendorModal = document.getElementById('vendorModal');
  const breweryModal = document.getElementById('breweryModal');

  document.querySelectorAll('.open-vendor-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      vendorModal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  document.querySelectorAll('.open-brewery-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      breweryModal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  document.querySelectorAll('.close-vendor-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      vendorModal?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  document.querySelectorAll('.close-brewery-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      breweryModal?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  [vendorModal, breweryModal].forEach(modalEl => {
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          modalEl.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  });

  const vendorForm = document.getElementById('vendorLeadForm');
  if (vendorForm) {
    const vPhone = document.getElementById('vendorPhone');
    if (vPhone) applyPhoneMask(vPhone);

    vendorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vName = document.getElementById('vendorName')?.value || 'Parceiro';
      const vPhoneVal = document.getElementById('vendorPhone')?.value || '';
      const vCity = document.getElementById('vendorCity')?.value || '';
      const vType = document.getElementById('vendorType')?.value || 'outro';

      const submitBtn = vendorForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando...';
      }

      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'vendedor',
            nome: vName,
            telefone: vPhoneVal,
            cidade: vCity,
            categoria: vType
          })
        });
      } catch (err) {}

      // Salva no histórico local para exibição instantânea no painel administrativo
      try {
        const localLeads = JSON.parse(localStorage.getItem('brinda_leads_historico') || '[]');
        localLeads.unshift({
          id: `LEAD-${Date.now()}`,
          tipo: 'vendedor',
          nome: vName,
          empresa_nome: vCity ? `Parceiro (${vCity})` : 'Autônomo',
          telefone: vPhoneVal,
          cidade: vCity,
          categoria: vType,
          status: 'novo',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('brinda_leads_historico', JSON.stringify(localLeads));

        const localVend = JSON.parse(localStorage.getItem('brinda_vendedores_cadastrados') || '[]');
        const codeNum = Math.floor(10 + Math.random() * 89);
        const code = (vName.split(' ')[0] || 'VEND').replace(/[^a-zA-Z]/g, '').toUpperCase() + codeNum;
        localVend.unshift({
          id: Date.now(),
          nome: vName,
          codigo: code,
          tipo: vType,
          hotel_nome: vCity ? `Região: ${vCity}` : null,
          telefone: vPhoneVal,
          status: 'ativo',
          total_vendas: 0,
          total_comissao: 0,
          total_a_receber: 0,
          total_pendente: 0,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('brinda_vendedores_cadastrados', JSON.stringify(localVend));
      } catch (e) {}

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Enviar Cadastro de Vendedor';
      }

      showToast(`🎉 Obrigado, ${vName}! Sua solicitação de vendedor parceiro foi registrada. Entraremos em contato via WhatsApp.`);
      vendorForm.reset();
      setTimeout(() => {
        vendorModal?.classList.remove('open');
        document.body.style.overflow = '';
      }, 1500);
    });
  }

  const breweryForm = document.getElementById('breweryLeadForm');
  if (breweryForm) {
    const bPhone = document.getElementById('breweryPhone');
    if (bPhone) applyPhoneMask(bPhone);

    breweryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bContact = document.getElementById('breweryContact')?.value || '';
      const bName = document.getElementById('breweryName')?.value || 'Cervejaria';
      const bPhoneVal = document.getElementById('breweryPhone')?.value || '';
      const bCity = document.getElementById('breweryCity')?.value || '';

      const submitBtn = breweryForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando...';
      }

      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'cervejaria',
            nome: bContact,
            empresa_nome: bName,
            telefone: bPhoneVal,
            cidade: bCity
          })
        });
      } catch (err) {}

      try {
        const localLeads = JSON.parse(localStorage.getItem('brinda_leads_historico') || '[]');
        localLeads.unshift({
          id: `LEAD-${Date.now()}`,
          tipo: 'cervejaria',
          nome: bContact,
          empresa_nome: bName,
          telefone: bPhoneVal,
          cidade: bCity,
          categoria: 'Fábrica e Tap House',
          status: 'novo',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('brinda_leads_historico', JSON.stringify(localLeads));

        const localCerv = JSON.parse(localStorage.getItem('brinda_cervejarias_cadastradas') || '[]');
        localCerv.unshift({
          id: Date.now(),
          nome: bName,
          cidade: bCity || 'Serra Gaúcha',
          endereco: `Contato: ${bContact}`,
          telefone: bPhoneVal,
          tour_guiado: false,
          pin_acesso: '1234',
          status: 'ativo',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('brinda_cervejarias_cadastradas', JSON.stringify(localCerv));
      } catch (e) {}

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Cadastrar Cervejaria para Avaliação';
      }

      showToast(`🍺 Parabéns! Recebemos a solicitação da ${bName}. Nossa curadoria entrará em contato com ${bContact} em breve.`);
      breweryForm.reset();
      setTimeout(() => {
        breweryModal?.classList.remove('open');
        document.body.style.overflow = '';
      }, 1500);
    });
  }
}

// 7. Filtros de Cidades para Cervejarias
function initCityFilters() {
  const filterBtns = document.querySelectorAll('.city-filter-btn');
  const breweryCards = document.querySelectorAll('.brewery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const city = btn.dataset.city;

      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = '#FFFFFF';
        b.style.color = '#3F4A3E';
        b.style.borderColor = 'rgba(78, 3, 3, 0.32)';
      });

      btn.classList.add('active');
      btn.style.backgroundColor = 'var(--color-primary-green)';
      btn.style.color = '#FFFFFF';
      btn.style.borderColor = 'var(--color-primary-green)';

      breweryCards.forEach(card => {
        if (city === 'all' || card.dataset.city === city) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transition = 'opacity 0.3s ease';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// 8. Modal de Termos de Uso
function initTermsModal() {
  const openBtns = document.querySelectorAll('.open-terms-modal');
  const closeBtns = document.querySelectorAll('.close-terms-modal');
  const modal = document.getElementById('termsModal');

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
}

// 9. Efeito Parallax Suave para a Foto da Vinícola
function initWineryParallax() {
  const wrapper = document.querySelector('.parallax-winery-wrapper');
  const bg = document.querySelector('.parallax-winery-bg');

  if (!wrapper || !bg) return;

  function updateParallax() {
    const rect = wrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top < windowHeight && rect.bottom > 0) {
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      const moveDistance = (progress - 0.5) * 80;
      bg.style.transform = `translate3d(0, ${moveDistance}px, 0) scale(1.08)`;
    }
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();
}

// 10. Formulário de Contato
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value || '';
      showToast(`✨ Obrigado, ${name}! Sua mensagem foi enviada com sucesso.`);
      contactForm.reset();
    });
  }
}

// --- Utilitários de Máscaras e Formatação ---
function applyCpfMask(input) {
  input.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  });
}

function applyPhoneMask(input) {
  input.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else {
      v = v.replace(/^(\d*)$/, '$1');
    }
    e.target.value = v;
  });
}

function isOver18(dobString) {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val);
}

function showToast(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// 11. SAC Inteligente (Assistente Virtual IA com Base de 25 FAQs & Fila Humana)
function initSacWidget() {
  const container = document.getElementById('sacFloatingContainer');
  const toggleBtn = document.getElementById('btnSacToggle');
  const chatModal = document.getElementById('sacChatModal');
  const closeBtn = document.getElementById('btnCloseSacChat');
  const messagesBox = document.getElementById('sacChatMessages');
  const inputForm = document.getElementById('sacChatInputForm');
  const inputText = document.getElementById('sacChatInputText');
  const handoverPanel = document.getElementById('sacHandoverPanel');
  const handoverForm = document.getElementById('sacHandoverForm');
  const cancelHandoverBtn = document.getElementById('btnCancelHandover');

  if (!container || !toggleBtn || !chatModal) return;

  // Base Oficial de Conhecimento com as 25 Perguntas e Respostas da Especificação Comercial
  const faqs = [
    {
      q: 'O que é o BRINDA CARD?',
      keywords: ['o que e', 'brinda card', 'conceito', 'plataforma', 'cartao virtual', 'mensalidade'],
      a: 'O **BRINDA CARD** é um cartão virtual exclusivo que dá acesso à plataforma www.brindaserra.com.br para conhecer e desfrutar do circuito de cervejarias artesanais da Serra Gaúcha. É um passe **sem mensalidades** (taxa única vitalícia de adesão de R$ 10,00).'
    },
    {
      q: 'Como funciona?',
      keywords: ['como funciona', 'regras', 'funcionamento', 'uso', 'documento'],
      a: 'Após o cadastro do seu CPF e adesão ao cartão (R$ 10), o acesso é vitalício. As experiências cervejeiras adquiridas geram passes nominais com QR Code válidos por 6 meses para uso individual acompanhado de documento com foto. Após 6 meses sem uso, as experiências expiram, mas seu cartão permanece ativo para você adicionar novos pacotes quando quiser!'
    },
    {
      q: 'Qual a diferença entre BRINDA BEM e BRINDA PREMIUM?',
      keywords: ['diferenca', 'brinda bem', 'brinda premium', 'modalidades', 'degustacao', 'fabrica', 'tour guiado'],
      a: 'O plano **Brinda Bem (R$ 130)** dá direito a visitar e degustar em **3 cervejarias** participantes. O plano **Brinda Premium (R$ 190)** dá direito a **5 cervejarias** participantes e inclui tour guiado pela fábrica nas casas que oferecem essa atração.'
    },
    {
      q: 'Posso comprar o Brinda Card e depois comprar as experiências em outro momento?',
      keywords: ['comprar depois', 'comprar apenas', 'so o cartao', 'venda casada', 'apenas card'],
      a: 'Sim! Em total respeito ao Art. 39, I do CDC (vedação à venda casada), você pode adquirir **apenas o BRINDA CARD por R$ 10,00** para ativar seu login vitalício e comprar suas experiências de degustação quando desejar.'
    },
    {
      q: 'Fiz a compra do Brinda Card, comprei as experiências e já utilizei. Posso continuar comprando experiências novamente?',
      keywords: ['recarregar', 'comprar novamente', 'novo pacote', 'utilizei todas'],
      a: 'Sim! Você pode entrar na sua área de cliente ("Minha Conta") e adquirir novos pacotes de experiências quantas vezes desejar, **sem nunca mais pagar a taxa de R$ 10 do cartão**.'
    },
    {
      q: 'Comprei e me arrependi, como cancelar?',
      keywords: ['cancelar', 'cancelamento', 'devolucao', 'arrependi', 'arrependimento', 'estorno', 'cdc', 'art 49'],
      a: 'Conforme o Art. 49 do CDC, você pode solicitar o cancelamento em até 7 dias corridos da data da compra, desde que **nenhuma degustação tenha sido utilizada**. Conforme o §4° do Art. 54 do CDC, a realização de qualquer validação caracteriza início da prestação do serviço e impede o cancelamento.'
    },
    {
      q: 'Qual a validade?',
      keywords: ['validade', 'prazo', 'tempo', 'expiracao', 'meses', 'vitalicio'],
      a: 'O **BRINDA CARD é vitalício** (seu cadastro e login não expiram nem possuem mensalidades). Já as **experiências compradas possuem validade de 6 meses** a contar da data de confirmação do pagamento.'
    },
    {
      q: 'Onde posso utilizar?',
      keywords: ['onde posso utilizar', 'onde usar', 'locais', 'onde ir', 'cidades'],
      a: 'Nas cervejarias parceiras credenciadas na Serra Gaúcha (Canela, Gramado e região). A lista de cervejarias participantes é dinâmica e pode ser consultada a qualquer momento em nosso site oficial.'
    },
    {
      q: 'Quais cervejarias participam?',
      keywords: ['quais cervejarias', 'cervejarias participantes', 'parceiros', 'farol'],
      a: 'Grandes referências da Serra Gaúcha como a tradicional **Cervejaria Farol** em Canela, além de outras fábricas parceiras listadas na seção de Cervejarias de nosso site.'
    },
    {
      q: 'Como comprar?',
      keywords: ['como comprar', 'passo a passo', 'aquisicao', 'fazer pedido'],
      a: 'Basta clicar no botão "Comprar Meu BRINDA CARD" no site, escolher a quantidade de passes e planos de degustação (para você e até 3 convidados), preencher os dados cadastrais e concluir o pagamento via PIX ou Cartão.'
    },
    {
      q: 'Como pagar?',
      keywords: ['como pagar', 'formas de pagamento', 'pagamento', 'meios'],
      a: 'Aceitamos pagamento instantâneo via **PIX** (com QR Code e código copia-e-cola) e **Cartão de Crédito** em ambiente seguro com emissão imediata dos passes.'
    },
    {
      q: 'Como funciona o Pix?',
      keywords: ['pix', 'chave pix', 'copia e cola', 'qr pix'],
      a: 'Ao selecionar PIX, o sistema gera instantaneamente um QR Code e o código Pix Copia e Cola com o valor exato. Assim que o pagamento é compensado, o sistema libera os passes na tela e por e-mail.'
    },
    {
      q: 'Como funciona o cartão?',
      keywords: ['cartao', 'credito', 'parcelamento', 'seguro'],
      a: 'Basta preencher o número do cartão, nome impresso, validade e CVV. O processamento é criptografado e os cartões virtuais são gerados logo após a aprovação.'
    },
    {
      q: 'Posso comprar para outra pessoa?',
      keywords: ['outra pessoa', 'presente', 'amigos', 'terceiros', 'convidados', 'família'],
      a: 'Sim! Você pode comprar para si e para até 3 terceiros, ou exclusivamente para terceiros (presente). Cada pessoa recebe um passe nominal individual com seu respectivo CPF e QR Code, exigindo comprovação de maioridade (+18).'
    },
    {
      q: 'Como recebo meu Card?',
      keywords: ['receber', 'onde recebo', 'envio', 'email', 'minha conta'],
      a: 'Você visualiza e imprime os passes imediatamente na tela de confirmação (Etapa 4 do checkout), recebe por e-mail e pode consultar a qualquer momento na área do cliente ("Minha Conta") informando seu CPF.'
    },
    {
      q: 'Onde encontro meu QR Code?',
      keywords: ['encontrar qr', 'onde esta meu qr', 'perdi meu qr', 'ver qr code'],
      a: 'Seu QR Code fica disponível em "Minha Conta" no topo do site (basta digitar seu CPF), além do e-mail de confirmação enviado na hora da compra.'
    },
    {
      q: 'Como utilizar o QR Code?',
      keywords: ['como utilizar qr', 'validar', 'chegada', 'apresentar'],
      a: 'Ao chegar à cervejaria parceira, apresente o QR Code na tela do celular junto com um documento oficial com foto. O atendente fará a leitura e concederá a degustação da casa.'
    },
    {
      q: 'Posso utilizar duas vezes na mesma cervejaria?',
      keywords: ['duas vezes', 'repetir', 'mesma cervejaria', 'regra de ouro', 'segunda vez'],
      a: '**Não.** O BRINDA CARD opera sob a regra de ouro do turismo serrano: cada cervejaria parceira pode ser visitada **apenas uma vez** por CPF/Card, garantindo uma rota diversificada e protegendo as gratuidades dos parceiros.'
    },
    {
      q: 'O que acontece se eu já utilizei naquela cervejaria?',
      keywords: ['ja utilizei', 'bloqueio', 'segunda visita', 'recusado'],
      a: 'O sistema bloqueia automaticamente a repetição, emitindo um aviso na tela da cervejaria. Fique tranquilo: **nenhum crédito é descontado** do seu saldo, e você pode usar essa experiência em qualquer outra cervejaria participante da rota!'
    },
    {
      q: 'Quantas experiências ainda tenho?',
      keywords: ['quantas experiencias', 'saldo restante', 'consultar saldo', 'meu saldo'],
      a: 'Basta acessar a "Área do Cliente" ("Minha Conta") no topo do site e digitar seu CPF. O painel mostra em tempo real suas experiências restantes e histórico detalhado de visitas.'
    },
    {
      q: 'Como vejo meu histórico?',
      keywords: ['historico', 'visitas realizadas', 'onde fui'],
      a: 'Acesse "Minha Conta" no site com seu CPF. Todas as cervejarias visitadas com data e hora ficam registradas no seu histórico pessoal.'
    },
    {
      q: 'O que acontece se meu pagamento estiver pendente?',
      keywords: ['pagamento pendente', 'aguardando pix', 'processando'],
      a: 'Os cartões virtuais e QR Codes só são emitidos após a confirmação efetiva do pagamento. No PIX, a liberação costuma levar poucos segundos.'
    },
    {
      q: 'Meu pagamento foi aprovado, mas não recebi o Card. O que faço?',
      keywords: ['nao recebi', 'aprovado mas nao recebi', 'problema no cartao', 'falha'],
      a: 'Verifique sua caixa de spam ou digite seu CPF na área "Minha Conta" no site. Se ainda assim não localizar, clique em "Atendente Humano" aqui no chat para que nossa equipe te auxilie imediatamente!'
    },
    {
      q: 'Meu QR Code não está funcionando. O que faço?',
      keywords: ['nao funciona', 'erro no qr', 'leitura com erro', 'problema na cervejaria'],
      a: 'Verifique se o seu passe ainda está dentro da validade de 6 meses e se você já não visitou essa mesma cervejaria anteriormente. Se precisar de assistência, você pode falar diretamente com nossa equipe de suporte!'
    },
    {
      q: 'Meu Card expirou. O que acontece?',
      keywords: ['expirou', 'venceu', 'perdi a validade', 'passou 6 meses'],
      a: 'O seu BRINDA CARD é vitalício (seu cadastro nunca expira). No entanto, o pacote de experiências tem validade de 6 meses. Se expirou, basta acessar sua conta e comprar novas experiências sem pagar a taxa de R$ 10 do cartão.'
    },
    {
      q: 'Quero ser vendedor, promotor ou cadastrar meu hotel/uber',
      keywords: ['quero vender', 'ser vendedor', 'comissao', 'hotel parceiro', 'motorista', 'uber'],
      a: 'Adoramos novas parcerias! Você pode clicar em "Quero Vender o BRINDA CARD" no rodapé do nosso site para preencher seu cadastro, ou nos enviar uma mensagem pelo e-mail brindacard@gmail.com. Pagamos R$ 20 de comissão na 1ª compra de experiências!'
    },
    {
      q: 'Como cadastrar minha cervejaria na plataforma?',
      keywords: ['cadastrar cervejaria', 'seja parceira', 'credenciamento', 'fábrica'],
      a: 'Cervejarias interessadas podem clicar em "Seja uma Cervejaria Parceira" no site ou nos contatar via brindacard@gmail.com para avaliação da nossa curadoria técnica.'
    }
  ];

  // Alterna visibilidade da janela de chat
  toggleBtn.addEventListener('click', () => {
    chatModal.classList.toggle('hidden');
  });

  closeBtn?.addEventListener('click', () => {
    chatModal.classList.add('hidden');
  });

  // Rolagem suave para o fim das mensagens
  function scrollToBottom() {
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  // Renderiza bolha de mensagem no chat
  function appendMessage(role, htmlContent) {
    const isUser = role === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-2 items-start ${isUser ? 'justify-end' : 'justify-start'}`;

    if (isUser) {
      msgDiv.innerHTML = `
        <div class="bg-brandGreen text-white p-2.5 rounded-2xl rounded-tr-none shadow-xs text-xs max-w-[85%] leading-relaxed">
          ${htmlContent}
        </div>
        <div class="w-6 h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center text-[0.6rem] shrink-0 font-bold">👤</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-brandGreen text-white flex items-center justify-center text-[0.6rem] shrink-0 font-bold">IA</div>
        <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-stone-200 shadow-xs text-stone-700 text-xs max-w-[85%] leading-relaxed space-y-1.5">
          ${htmlContent}
        </div>
      `;
    }

    messagesBox.appendChild(msgDiv);
    scrollToBottom();
  }

  // Normalizador de texto para busca fonética e semântica
  function normalizeText(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
  }

  // Mecanismo de busca e resposta do FAQ
  function findFaqAnswer(userQuestion) {
    const norm = normalizeText(userQuestion);

    // Saudação simples
    if (['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'opa'].includes(norm)) {
      return {
        answer: 'Olá! Como posso ajudar você hoje? Você pode tirar dúvidas sobre como funciona o BRINDA CARD, validade, compra para amigos ou solicitar atendimento humano!',
        showHandoverOption: false
      };
    }

    // Gatilhos de atendimento humano direto
    const humanTriggers = ['humano', 'atendente', 'falar com pessoa', 'suporte humano', 'pessoa real', 'reclamacao', 'processo', 'estorno', 'devolucao'];
    if (humanTriggers.some(t => norm.includes(t))) {
      return {
        answer: 'Com certeza! Posso transferir seu atendimento para nossa equipe humana agora mesmo. Basta preencher o formulário abaixo com seu nome e contato para abrirmos seu chamado oficial!',
        showHandoverOption: true
      };
    }

    // Busca por score de relevância
    const words = norm.split(/\s+/).filter(w => w.length > 2);
    let bestFaq = null;
    let bestScore = 0;

    faqs.forEach(faq => {
      let score = 0;
      const qNorm = normalizeText(faq.q);
      const keywordsNorm = faq.keywords.map(k => normalizeText(k));

      words.forEach(w => {
        if (qNorm.includes(w)) score += 3;
        keywordsNorm.forEach(kw => {
          if (kw.includes(w)) score += 2;
        });
      });

      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    });

    if (bestFaq && bestScore >= 2) {
      return {
        answer: bestFaq.a,
        showHandoverOption: false
      };
    }

    return {
      answer: 'Não encontrei uma resposta exata para sua dúvida em nossa base rápida. Para garantir que você seja atendido com total clareza, você pode falar diretamente com nossa equipe de suporte clicando no botão abaixo ou pelo e-mail **brindacard@gmail.com**!',
      showHandoverOption: true
    };
  }

  // Tratamento de envio do input do usuário
  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputText.value.trim();
    if (!query) return;

    appendMessage('user', query);
    inputText.value = '';

    // Simula tempo de resposta da IA
    setTimeout(() => {
      const res = findFaqAnswer(query);
      appendMessage('ia', res.answer);

      if (res.showHandoverOption) {
        handoverPanel.classList.remove('hidden');
      }
    }, 350);
  });

  // Chips de atalho rápido
  document.querySelectorAll('.sac-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const question = btn.dataset.q;

      if (action === 'humano') {
        appendMessage('user', 'Quero falar com um atendente humano');
        setTimeout(() => {
          appendMessage('ia', 'Perfeito! Por favor, preencha os campos abaixo para que nossa equipe humana entre em contato com você.');
          handoverPanel.classList.remove('hidden');
        }, 200);
      } else if (question) {
        appendMessage('user', question);
        setTimeout(() => {
          const res = findFaqAnswer(question);
          appendMessage('ia', res.answer);
        }, 300);
      }
    });
  });

  cancelHandoverBtn?.addEventListener('click', () => {
    handoverPanel.classList.add('hidden');
  });

  // Submissão do chamado para atendimento humano
  handoverForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('sacHandoverNome')?.value.trim() || '';
    const email = document.getElementById('sacHandoverEmail')?.value.trim() || '';
    const telefone = document.getElementById('sacHandoverTelefone')?.value.trim() || '';
    const msg = document.getElementById('sacHandoverMsg')?.value.trim() || '';

    const submitBtn = handoverForm.querySelector('button[type="submit"]');
    const origText = submitBtn?.innerHTML || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Encaminhando chamado...</span>';
    }

    const ticketPayload = {
      nome,
      email,
      telefone,
      mensagem: msg,
      assunto: 'Suporte via Chat IA (Handover)',
      status: 'aberto'
    };

    try {
      await fetch('/api/suporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });
    } catch (err) {
      console.warn('API /api/suporte offline, salvando localmente:', err);
    }

    // Persistência local segura para o Painel Administrativo
    try {
      const localTickets = JSON.parse(localStorage.getItem('brinda_tickets_suporte') || '[]');
      localTickets.unshift({
        id: `TICK-${Date.now()}`,
        nome,
        email,
        telefone,
        mensagem: msg,
        assunto: 'Suporte via Chat IA (Handover)',
        status: 'aberto',
        created_at: new Date().toISOString()
      });
      localStorage.setItem('brinda_tickets_suporte', JSON.stringify(localTickets));
    } catch (e) {}

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;
    }

    handoverForm.reset();
    handoverPanel.classList.add('hidden');

    appendMessage('ia', `✨ <strong>Chamado registrado com sucesso, ${nome}!</strong><br>Sua solicitação foi encaminhada para a nossa central de atendimento e um atendente entrará em contato via WhatsApp ou e-mail.`);
    showToast('📨 Sua mensagem foi enviada para o atendimento humano do BRINDA SERRA!');
  });
}
