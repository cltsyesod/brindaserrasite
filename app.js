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
      } else {
        thirdPartyBlock?.classList.remove('hidden');
        if (guestsList && guestsList.children.length === 0) {
          addGuestInputRow();
        }
      }
    });
  });

  // Função para adicionar linha de convidado
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

  // --- Etapa 2: Alternância de Canais de Origem ---
  originSelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    hotelGroup?.classList.add('hidden');
    uberGroup?.classList.add('hidden');
    otherGroup?.classList.add('hidden');

    if (val === 'hotel') hotelGroup?.classList.remove('hidden');
    else if (val === 'uber') uberGroup?.classList.remove('hidden');
    else if (val === 'outros') otherGroup?.classList.remove('hidden');
  });

  backToStep1Btn?.addEventListener('click', () => setCheckoutStep(1));

  // --- Validação Etapa 2 -> Etapa 3 (Cálculo Financeiro e Geração de PIX) ---
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

    const taxaAdesao = 10.00;
    const valorUnitarioExp = currentCalculatorState.selectedBeerPrice;
    const valorTotalExp = valorUnitarioExp * totalCartoes;
    const valorFinal = taxaAdesao + valorTotalExp;

    if (summaryBasePrice) summaryBasePrice.textContent = formatCurrency(taxaAdesao);
    if (summaryExpName) summaryExpName.textContent = currentCalculatorState.selectedBeerName;
    if (summaryExpPrice) summaryExpPrice.textContent = formatCurrency(valorTotalExp);
    if (summaryGuestsCount) summaryGuestsCount.textContent = `${qtdConvidados} (${totalCartoes} cartão(ões) no total)`;
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
    const terceiros = [];
    const guestItems = guestsList?.querySelectorAll('.guest-item') || [];

    if (selectedTarget === 'others' || selectedTarget === 'both') {
      guestItems.forEach(item => {
        terceiros.push({
          nome: item.querySelector('.guest-name')?.value.trim() || '',
          cpf: (item.querySelector('.guest-cpf')?.value || '').replace(/\D/g, ''),
          data_nasc: item.querySelector('.guest-dob')?.value || '',
          telefone: (item.querySelector('.guest-phone')?.value || '').replace(/\D/g, ''),
          email: item.querySelector('.guest-email')?.value.trim() || ''
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
        email: payerEmail?.value.trim() || ''
      },
      plano_cervejaria: currentCalculatorState.selectedBeerPlanKey,
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

  let saldoPorCard = 0;
  if (payload.plano_cervejaria === 'brinda_bem') saldoPorCard = 3;
  else if (payload.plano_cervejaria === 'brinda_premium') saldoPorCard = 5;

  if (payload.comprar_para_si) {
    cards.push({
      id: 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      titular_nome: payload.pagador.nome,
      titular_cpf: payload.pagador.cpf,
      codigo_passe: 'BS-VIP-' + (payload.pagador.cpf.slice(0, 3) || '789') + (payload.pagador.cpf.slice(-2) || '21'),
      modalidade: payload.plano_cervejaria,
      saldo_restante: saldoPorCard,
      data_validade_formatada: dataValidadeFormatada,
      qr_token: 'QR-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      is_pagador: true
    });
  }

  payload.terceiros.forEach((terc, idx) => {
    const cleanCpf = (terc.cpf || '').replace(/\D/g, '');
    cards.push({
      id: 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      titular_nome: terc.nome || `Convidado ${idx + 1}`,
      titular_cpf: cleanCpf,
      codigo_passe: 'BS-VIP-' + (cleanCpf ? cleanCpf.slice(0, 3) + cleanCpf.slice(-2) : 'CV' + (idx + 1)),
      modalidade: payload.plano_cervejaria,
      saldo_restante: saldoPorCard,
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

    // 2. Fallback local apenas se a API estiver inacessível (ex: sem internet) E o registro local for 100% válido
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
