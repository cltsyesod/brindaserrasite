// Gerenciamento e Interatividade do BRINDA Serra

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initBrindaCardCalculator();
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

// 2. Calculadora Interativa e Personalização do BRINDA CARD
function initBrindaCardCalculator() {
  const cardNameInput = document.getElementById('cardHolderNameInput');
  const cardPreviewName = document.getElementById('cardHolderPreviewName');
  
  // Opções de Cervejaria
  const beerOptions = document.querySelectorAll('input[name="beer_plan"]');
  // Opções de Vinícola
  const wineOptions = document.querySelectorAll('input[name="wine_plan"]');
  // Forma de Pagamento
  const paymentInputs = document.querySelectorAll('input[name="payment_method"]');
  
  // Elementos de Valores
  const subtotalEl = document.getElementById('calcSubtotal');
  const totalEl = document.getElementById('calcTotal');
  const experiencesListEl = document.getElementById('calcExperiencesList');
  const checkoutBtn = document.getElementById('buyBrindaCardBtn');
  const termsCheckbox = document.getElementById('termsCheckbox');

  // Atualização do Nome do Titular no Cartão
  if (cardNameInput && cardPreviewName) {
    cardNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      cardPreviewName.textContent = val.length > 0 ? val.toUpperCase() : 'SEU NOME AQUI';
    });
  }

  // Função para recalcular valores
  function calculateTotal() {
    let basePrice = 10.00; // Obrigatório BRINDA Card
    let selectedBeerPrice = 0;
    let selectedBeerName = '';
    let selectedWinePrice = 0;
    let selectedWineName = '';

    // Cervejarias
    beerOptions.forEach(opt => {
      const parentCard = opt.closest('.plan-option-card');
      if (opt.checked) {
        parentCard?.classList.add('selected');
        const price = parseFloat(opt.dataset.price || 0);
        selectedBeerPrice = price;
        selectedBeerName = opt.dataset.name || '';
      } else {
        parentCard?.classList.remove('selected');
      }
    });

    // Vinícolas
    wineOptions.forEach(opt => {
      const parentCard = opt.closest('.plan-option-card');
      if (opt.checked) {
        parentCard?.classList.add('selected');
        const price = parseFloat(opt.dataset.price || 0);
        selectedWinePrice = price;
        selectedWineName = opt.dataset.name || '';
      } else {
        parentCard?.classList.remove('selected');
      }
    });

    const total = basePrice + selectedBeerPrice + selectedWinePrice;

    // Atualizar UI
    if (subtotalEl) {
      subtotalEl.textContent = formatCurrency(basePrice);
    }
    if (totalEl) {
      totalEl.textContent = formatCurrency(total);
    }

    // Atualizar lista de resumo
    if (experiencesListEl) {
      let itemsHtml = `
        <li class="flex justify-between items-center text-sm py-1 border-b border-stone-200">
          <span class="text-stone-700">BRINDA Card (Adesão Obrigatória / Validade 6 meses)</span>
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

    return {
      basePrice,
      selectedBeerName,
      selectedBeerPrice,
      selectedWineName,
      selectedWinePrice,
      total
    };
  }

  // Listeners de mudança nas opções
  beerOptions.forEach(opt => opt.addEventListener('change', calculateTotal));
  wineOptions.forEach(opt => opt.addEventListener('change', calculateTotal));
  paymentInputs.forEach(opt => opt.addEventListener('change', calculateTotal));

  // Inicializar cálculo na carga
  calculateTotal();

  // Ação de Compra / Finalização
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (!termsCheckbox.checked) {
        showToast('⚠️ Por favor, leia e aceite os Termos de Uso antes de continuar.');
        termsCheckbox.focus();
        return;
      }

      const clientName = cardNameInput.value.trim() || 'Amigo(a) da Serra';
      const order = calculateTotal();
      const selectedPayment = document.querySelector('input[name="payment_method"]:checked')?.value || 'PIX';

      // Monta mensagem amigável e profissional para o WhatsApp
      let msg = `*NOVO PEDIDO - BRINDA SERRA*\n\n`;
      msg += `👤 *Titular do Cartão:* ${clientName}\n`;
      msg += `💳 *BRINDA Card:* R$ 10,00 (Ativação e acesso à rota)\n`;
      
      if (order.selectedBeerPrice > 0) {
        msg += `🍺 *Cervejarias:* ${order.selectedBeerName} (${formatCurrency(order.selectedBeerPrice)})\n`;
      }
      if (order.selectedWinePrice > 0) {
        msg += `🍷 *Vinícolas:* ${order.selectedWineName} (${formatCurrency(order.selectedWinePrice)})\n`;
      }
      
      msg += `\n💰 *VALOR TOTAL:* ${formatCurrency(order.total)}\n`;
      msg += `🏷️ *Forma de Pagamento:* ${selectedPayment}\n`;
      msg += `✔️ *Termos aceitos:* Sim\n\n`;
      msg += `Gostaria de concluir a emissão do meu BRINDA CARD virtual!`;

      const whatsappNumber = '5554999999999'; // Substituível pelo WhatsApp comercial da empresa
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

      showToast('🎉 Pedido iniciado! Abrindo canal de atendimento...');
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 700);
    });
  }
}

// 3. Filtros de Cidades para Cervejarias
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
        b.style.borderColor = '#E3D9C9';
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

// 4. Modal de Termos de Uso
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

// 5. Efeito Parallax Suave para a Foto da Vinícola
function initWineryParallax() {
  const wrapper = document.querySelector('.parallax-winery-wrapper');
  const bg = document.querySelector('.parallax-winery-bg');

  if (!wrapper || !bg) return;

  function updateParallax() {
    const rect = wrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Se o elemento estiver visível na janela
    if (rect.top < windowHeight && rect.bottom > 0) {
      // Calcula o deslocamento relativo
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      const moveDistance = (progress - 0.5) * 80; // Suave deslocamento de até 80px
      bg.style.transform = `translate3d(0, ${moveDistance}px, 0) scale(1.08)`;
    }
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();
}

// 6. Formulário de Contato
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

// Utilitários
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
