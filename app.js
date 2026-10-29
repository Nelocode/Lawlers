/**
 * Essa, Janho & Associates, LLC — Modern SaaS Landing Page Interactions
 * Built following Modern Web Guidance standards & progressive enhancements.
 */

// 1. Top-Layer Discrete Display Transition Probe & Exit Helper (animate-to-from-top-layer)
let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

async function closeTopLayer(element) {
  if (!element) return;
  if (!supportsTopLayerExit()) {
    element.setAttribute('data-closing', '');
    const animations = element.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    }
    if (!element.hasAttribute('data-closing')) return;
    element.removeAttribute('data-closing');
  }
  if (typeof element.close === 'function' && element.open) {
    element.close();
  }
}

// 2. Declarative Invoker Commands Polyfill & Fallback (declarative-dialog-popover-control)
const hasNativeInvokerSupport = 'commandForElement' in HTMLButtonElement.prototype;

if (!hasNativeInvokerSupport) {
  if (!globalThis.CommandEvent) {
    globalThis.CommandEvent = class CommandEvent extends Event {
      constructor(type, { source, command, ...options } = {}) {
        super(type, options);
        this.source = source;
        this.command = command;
      }
    };
  }

  document.addEventListener('click', (event) => {
    const button = event.composedPath().find((el) => el.matches?.('button[commandfor]'));
    if (!button) return;

    const targetId = button.getAttribute('commandfor');
    const target = document.getElementById(targetId);
    const command = button.getAttribute('command');

    if (!target || !command) return;

    if (command === 'show-modal' && typeof target.showModal === 'function') {
      const prefillArea = button.getAttribute('data-prefill-area');
      if (prefillArea) {
        const modalSelect = target.querySelector('#modal-area');
        if (modalSelect) modalSelect.value = prefillArea;
      }
      target.showModal();
    } else if (command === 'close') {
      closeTopLayer(target);
    } else {
      target.dispatchEvent(new CommandEvent('command', { command, source: button }));
    }
  });
} else {
  // Even when native commandForElement is supported, allow prefilling the modal's practice area
  document.addEventListener('click', (event) => {
    const button = event.composedPath().find((el) => el.matches?.('button[commandfor][data-prefill-area]'));
    if (!button) return;
    const target = document.getElementById(button.getAttribute('commandfor'));
    const prefillArea = button.getAttribute('data-prefill-area');
    if (target && prefillArea) {
      const modalSelect = target.querySelector('#modal-area');
      if (modalSelect) modalSelect.value = prefillArea;
    }
  });
}

// 3. Light-Dismiss Fallback for <dialog closedby="any"> (light-dismiss-a-dialog)
document.querySelectorAll('dialog[closedby="any"]').forEach((dialog) => {
  // Route cancel (Esc) through closeTopLayer for smooth exit animation
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTopLayer(dialog);
  });

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) return;
      closeTopLayer(dialog);
    });
  }
});

// 4. Form Validation After Interaction & ARIA Synchronization
// (validate-input-after-interaction & style-parent-with-has)
const UserInvalidFallback = (() => {
  const dirtyState = new WeakMap();

  const updateState = (input) => {
    const isValid = input.checkValidity();
    input.classList.toggle('user-invalid-fallback', !isValid);
    input.classList.toggle('user-valid-fallback', isValid);
    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  };

  const handleEvent = (event) => {
    const input = event.target;
    if (event.type === 'reset') {
      const controls = input.elements || [];
      for (const control of controls) {
        dirtyState.delete(control);
        control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
        control.removeAttribute('aria-invalid');
      }
      return;
    }
    if (!input.checkValidity) return;

    if (event.type === 'input' || event.type === 'change') {
      const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
      state.hasInteracted = true;
      dirtyState.set(input, state);
      if (state.hasBlurred) updateState(input);
    } else if (event.type === 'blur') {
      const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
      state.hasBlurred = true;
      dirtyState.set(input, state);
      if (state.hasInteracted) updateState(input);
    }
  };

  const init = (root = document) => {
    if (CSS.supports('selector(:user-invalid)')) return;
    root.addEventListener('blur', handleEvent, true);
    root.addEventListener('input', handleEvent);
    root.addEventListener('change', handleEvent);
    root.addEventListener('reset', handleEvent, true);
  };

  return { init };
})();

UserInvalidFallback.init(document);

// Sync aria-invalid with native :user-invalid state (validate-input-after-interaction)
const syncAria = (el) => {
  if (!el || typeof el.matches !== 'function' || !el.matches('input, select, textarea')) return;
  if (CSS.supports('selector(:user-invalid)')) {
    el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false');
  }
};

document.addEventListener('blur', (e) => syncAria(e.target), true);
document.addEventListener('input', (e) => {
  if (e.target?.hasAttribute?.('aria-invalid')) syncAria(e.target);
});

// 5. Segmented Tabs for Practice Areas (Notion/SaaS Pattern + Keyboard Accessibility)
const tabButtons = Array.from(document.querySelectorAll('.tab-button[data-filter]'));
const practiceCards = Array.from(document.querySelectorAll('.practice-card[data-category]'));

function setTab(selectedBtn) {
  if (!selectedBtn) return;
  const filter = selectedBtn.getAttribute('data-filter');

  tabButtons.forEach((btn) => {
    const isSelected = btn === selectedBtn;
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    btn.tabIndex = isSelected ? 0 : -1;
  });

  practiceCards.forEach((card) => {
    const category = card.getAttribute('data-category');
    if (filter === 'all' || category === filter) {
      card.style.display = 'flex';
      card.removeAttribute('hidden');
    } else {
      card.style.display = 'none';
      card.setAttribute('hidden', '');
    }
  });
}

tabButtons.forEach((btn, index) => {
  btn.addEventListener('click', () => setTab(btn));

  // Keyboard navigation for WAI-ARIA tablist pattern
  btn.addEventListener('keydown', (e) => {
    let targetIndex = null;
    if (e.key === 'ArrowRight') {
      targetIndex = (index + 1) % tabButtons.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (index - 1 + tabButtons.length) % tabButtons.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = tabButtons.length - 1;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      tabButtons[targetIndex].focus();
      setTab(tabButtons[targetIndex]);
    }
  });
});

// Initialize first tab focus index
tabButtons.forEach((btn, i) => {
  btn.tabIndex = i === 0 ? 0 : -1;
});

// 6. Form Submission Handlers with Polite Live Feedback
function bindFormSubmission(formId, feedbackId) {
  const form = document.getElementById(formId);
  const feedback = document.getElementById(feedbackId);
  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) {
        firstInvalid.focus();
        syncAria(firstInvalid);
      }
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const data = new FormData(form);
    const nombre = data.get('name') || 'Cliente';
    const idioma = data.get('lang') || 'Español';
    const area = data.get('area') || 'Consulta General';

    // Route attorney based on area
    const isEssa = ['Accidentes de auto', 'Accidentes catastróficos', 'Accidentes de camiones', 'Accidentes de trabajo', 'Lesiones personales'].includes(area);
    const abogadaAsignada = isEssa ? 'Julie M. Essa' : 'Noor E. Kennedy';
    const telefonoRecomendado = idioma === 'Inglés' ? '(770) 955-8322' : '(770) 771-3658';

    feedback.removeAttribute('hidden');
    feedback.innerHTML = `
      <div style="padding: 1.25rem; border-radius: var(--radius-md); background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; margin-block-start: 1rem;">
        <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #059669;">
          ✓ Expediente Registrado Exitosamente
        </div>
        <p style="margin-block-start: 0.4rem; font-size: 0.875rem; line-height: 1.5; color: #064E3B;">
          Estimado/a <strong>${nombre.replace(/[<>]/g, '')}</strong>, su caso de <em>${area}</em> ha sido derivado a la abogada titular <strong>${abogadaAsignada}</strong>.
        </p>
        <p style="margin-block-start: 0.5rem; font-size: 0.8125rem; color: #065F46;">
          Para contactar inmediatamente en <strong>${idioma}</strong>:
          <a href="tel:+1${telefonoRecomendado.replace(/\D/g, '')}" style="color: #047857; font-weight: 700; text-decoration: underline;">
            Llamar al ${telefonoRecomendado}
          </a>
        </p>
      </div>
    `;
  });
}

bindFormSubmission('intake-form', 'intake-feedback');
bindFormSubmission('modal-form', 'modal-feedback');

// 7. Auto-close mobile navigation drawer upon clicking any link
document.querySelectorAll('#mobile-nav-dialog a').forEach((link) => {
  link.addEventListener('click', () => {
    const dialog = document.getElementById('mobile-nav-dialog');
    if (dialog) closeTopLayer(dialog);
  });
});

// 8. Pure Subtle Parallax & 3D Interactive Depth on Hero Photography (No text, no clutter)
const heroPhotoWrapper = document.querySelector('.hero-photo-wrapper');
const heroPhotoFrame = document.querySelector('.hero-photo-frame');

if (heroPhotoWrapper && heroPhotoFrame && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let isHovering = false;
  let rafId = null;

  heroPhotoWrapper.addEventListener('mouseenter', () => {
    isHovering = true;
  });

  heroPhotoWrapper.addEventListener('mousemove', (e) => {
    if (!isHovering) return;
    const rect = heroPhotoWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -4.5;
    const tiltY = ((x - centerX) / centerX) * 4.5;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      heroPhotoFrame.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-3px)`;
      heroPhotoFrame.style.setProperty('--mouse-x', `${((x / rect.width) * 100).toFixed(1)}%`);
      heroPhotoFrame.style.setProperty('--mouse-y', `${((y / rect.height) * 100).toFixed(1)}%`);
    });
  });

  heroPhotoWrapper.addEventListener('mouseleave', () => {
    isHovering = false;
    if (rafId) cancelAnimationFrame(rafId);
    heroPhotoFrame.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    heroPhotoFrame.style.setProperty('--mouse-x', '50%');
    heroPhotoFrame.style.setProperty('--mouse-y', '50%');
  });

  // Soft scroll-depth effect
  window.addEventListener('scroll', () => {
    if (isHovering) return;
    const scrollPos = window.scrollY;
    if (scrollPos < 900) {
      heroPhotoFrame.style.transform = `translateY(${(scrollPos * 0.05).toFixed(1)}px)`;
    }
  }, { passive: true });
}


