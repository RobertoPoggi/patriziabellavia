/* ============================================================
   PATRIZIA BELLAVIA — Frontend Script
   ============================================================ */

/* === ACCORDION TOGGLE (Servizi + Case History) ============= */
function toggleAccordion(btn) {
  const item = btn.closest('.accordion-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');

  // Chiudi tutti i fratelli (accordeon nello stesso contenitore)
  const parent = item.parentElement;
  if (parent) {
    parent.querySelectorAll('.accordion-item.open').forEach(function(i) {
      if (i !== item) {
        i.classList.remove('open');
        const icon = i.querySelector('.toggle-icon');
        if (icon) icon.style.transform = '';
      }
    });
  }

  if (isOpen) {
    item.classList.remove('open');
    const icon = btn.querySelector('.toggle-icon');
    if (icon) icon.style.transform = '';
  } else {
    item.classList.add('open');
    const icon = btn.querySelector('.toggle-icon');
    if (icon) icon.style.transform = 'rotate(180deg)';
  }
}

/* === FORM SUBMIT (Contatti) ================================ */
function submitForm(event) {
  event.preventDefault();
  var form = event.target || document.getElementById('contact-form');
  if (!form) return;

  var btn = form.querySelector('button[type="submit"]');
  var successBox = document.getElementById('form-success');

  // Validazione anti-bot quiz
  var quizInput = form.querySelector('input[name="quiz"]');
  if (quizInput) {
    var answer = quizInput.value.trim();
    if (answer !== '5') {
      alert('Risposta errata al quiz anti-robot. Il numero più grande è 5.');
      quizInput.focus();
      return;
    }
  }

  // Validazione acceptance checkbox
  var acceptance = form.querySelector('input[name="acceptance"]');
  if (acceptance && !acceptance.checked) {
    alert('Devi accettare i termini e condizioni per procedere.');
    return;
  }

  // Raccolta dati
  var data = {
    nome: (form.querySelector('input[name="nome"]') || {}).value || '',
    email: (form.querySelector('input[name="email"]') || {}).value || '',
    telefono: (form.querySelector('input[name="telefono"]') || {}).value || '',
    messaggio: (form.querySelector('textarea[name="messaggio"]') || {}).value || ''
  };

  if (!data.nome.trim() || !data.email.trim() || !data.messaggio.trim()) {
    alert('Compila i campi obbligatori: Nome, Email e Messaggio.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Invio in corso…';
  }

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    if (json.success) {
      form.reset();
      if (successBox) {
        successBox.style.display = 'block';
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      alert(json.error || 'Si è verificato un errore. Riprova.');
    }
  })
  .catch(function() {
    alert('Errore di rete. Controlla la connessione e riprova.');
  })
  .finally(function() {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Invia';
    }
  });
}

/* === INIT al caricamento DOM =============================== */
document.addEventListener('DOMContentLoaded', function() {

  /* --- HAMBURGER / MOBILE MENU --- */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  var mobileClose = document.getElementById('mobile-close');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', function() {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Chiudi menu su click su un link
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* --- STICKY HEADER --- */
  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        header.classList.add('stuck');
      } else {
        header.classList.remove('stuck');
      }
    }, { passive: true });
  }

  /* --- BACK-TO-TOP BUTTON --- */
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- SCROLL ANIMATIONS (animate-on-scroll) --- */
  var animEls = document.querySelectorAll('.animate-on-scroll');
  if (animEls.length > 0) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var animation = el.getAttribute('data-animation') || 'fadeInUp';
            el.classList.add('animated', animation);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      animEls.forEach(function(el) {
        observer.observe(el);
      });
    } else {
      // Fallback per browser senza IntersectionObserver
      animEls.forEach(function(el) {
        el.classList.add('animated', 'fadeInUp');
      });
    }
  }

  /* --- ACTIVE NAV LINK --- */
  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.header-nav a, .mobile-nav-list a').forEach(function(a) {
    var href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
    if (href === currentPath) {
      a.parentElement.classList.add('current');
      a.classList.add('current');
    }
  });

  /* --- SMOOTH SCROLL PER ANCHOR INTERNI --- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var targetId = a.getAttribute('href').substring(1);
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        var offset = 90;
        var top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* --- CONTATORI ANIMATI (stats chi-sono) --- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var isFloat = String(target).includes('.');
        var duration = 1600;
        var startTime = performance.now();

        function animateCounter(now) {
          var progress = Math.min((now - startTime) / duration, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          var val = target * ease;
          el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
          if (progress < 1) requestAnimationFrame(animateCounter);
        }

        requestAnimationFrame(animateCounter);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function(c) { cio.observe(c); });
  }

  /* --- VIDEO HERO: fallback se non supportato --- */
  var video = document.querySelector('.hero-video-bg');
  if (video) {
    video.addEventListener('error', function() {
      video.style.display = 'none';
      var fallback = document.querySelector('.hero-bg-image');
      if (fallback) fallback.style.opacity = '1';
    });
  }

  /* --- APERTURA ACCORDEON SE URL HA HASH --- */
  if (window.location.hash) {
    var hashEl = document.querySelector(window.location.hash);
    if (hashEl) {
      setTimeout(function() {
        // Apri il primo accordion nella sezione
        var firstBtn = hashEl.querySelector('.accordion-trigger');
        if (firstBtn) toggleAccordion(firstBtn);
        // Scroll alla sezione
        var offsetTop = hashEl.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }, 400);
    }
  }

});
