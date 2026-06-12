import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RoofViewer, initHero3DRotator } from './3d-viewer.js';

// Import assets for Vite asset hashing
import heroCinematicUrl from './assets/hero-cinematic.png';
import roofBeforeUrl from './assets/roof-before.png';
import roofAfterUrl from './assets/roof-after.png';
import roofMaterialsUrl from './assets/roof-materials.png';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Lenis Smooth Scrolling
const initScroll = () => {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // Connect Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
};

// 2. Loading Screen Manager
const initLoader = () => {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loader-fill');
  const pct = document.getElementById('loader-pct');
  
  if (!loader) return;

  let width = 0;
  const interval = setInterval(() => {
    width += Math.floor(Math.random() * 8) + 4;
    if (width >= 100) {
      width = 100;
      clearInterval(interval);
      
      // Animate loader out
      gsap.to(loader, {
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        onComplete: () => {
          loader.style.visibility = 'hidden';
          // Trigger hero load sequence
          triggerHeroAnimation();
        }
      });
    }
    fill.style.width = `${width}%`;
    pct.innerText = `${width}%`;
  }, 50);
};

// 3. Hero Entry Animations (Restrained, Premium style)
const triggerHeroAnimation = () => {
  const tl = gsap.timeline();

  tl.fromTo('.hero-tag', 
    { opacity: 0, y: 15 }, 
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
  );

  tl.fromTo('.hero-title', 
    { opacity: 0, y: 30 }, 
    { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' },
    '-=0.6'
  );

  tl.fromTo('.hero-desc', 
    { opacity: 0, y: 20 }, 
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    '-=0.6'
  );

  tl.fromTo('.hero-ctas .btn', 
    { opacity: 0, y: 15 }, 
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15 },
    '-=0.5'
  );

  tl.fromTo('.hero-3d-container', 
    { opacity: 0, scale: 0.95 }, 
    { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
    '-=0.8'
  );

  // Set Background Image directly (to handle path resolution cleanly)
  const heroBg = document.getElementById('hero-bg-img');
  if (heroBg) {
    heroBg.style.backgroundImage = `url(${heroCinematicUrl})`;
    gsap.fromTo(heroBg, 
      { scale: 1.08, opacity: 0 }, 
      { scale: 1.0, opacity: 0.45, duration: 2.5, ease: 'power2.out' },
      0
    );
  }
};



// 5. Trust Numeric Counters (GSAP ScrollTrigger)
const initCounters = () => {
  const counters = document.querySelectorAll('.counter-num');
  
  counters.forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const decimals = parseInt(counter.getAttribute('data-decimals')) || 0;
    
    gsap.fromTo(counter, 
      { textContent: 0 },
      {
        textContent: target,
        duration: 2.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: counter,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        onUpdate: function() {
          // Format based on target
          const currentVal = parseFloat(this.targets()[0].textContent);
          let formattedVal = currentVal.toFixed(decimals);
          
          if (target === 15) {
            this.targets()[0].textContent = formattedVal + '+';
          } else if (target === 5000) {
            this.targets()[0].textContent = Math.floor(currentVal).toLocaleString() + '+';
          } else if (target === 4.9) {
            this.targets()[0].textContent = formattedVal + ' ★';
          } else if (target === 100) {
            this.targets()[0].textContent = Math.floor(currentVal) + '%';
          } else {
            this.targets()[0].textContent = formattedVal;
          }
        }
      }
    );
  });
};

// 6. Interactive 3D Roof Viewer Interface
const initRoofViewerInterface = () => {
  const specData = {
    shingles: {
      title: 'Slate Shingles',
      desc: 'Natural European Slate or luxury architectural GAF Camelot shingles. Unmatched textural elegance that reflects warm light.',
      class: 'Class A Fire Rated (Highest)',
      life: '50 - 100 Years',
      wind: 'Up to 240 km/h (Category 5 hurricane)',
      warranty: '50-Year Non-Prorated Warranty'
    },
    metal: {
      title: 'Standing Seam Metal',
      desc: 'Architectural heavy-gauge steel or copper panels with concealed fasteners. Creates a sleek, modern, low-maintenance design.',
      class: 'Class A Fire / Class 4 Hail (Max Impact)',
      life: '75+ Years',
      wind: 'Up to 290 km/h (Tornado-grade)',
      warranty: 'Lifetime Material & Labor Warranty'
    },
    flashing: {
      title: 'Custom Copper Flashing',
      desc: 'Heavy-weight metal trims guarding high-stress seams, valleys, and walls against severe rain, wind, and freeze-thaw cycles.',
      class: 'Commercial Grade Waterproofing',
      life: '50+ Years',
      wind: 'Fully Interlocked Wind-resistant Joints',
      warranty: 'Direct Workmanship Lifetime Coverage'
    },
    gutters: {
      title: 'Seamless Steel Gutters',
      desc: 'High-capacity, custom-formed gutter troughs and downspouts styled in matte black or copper accents for maximum curb appeal.',
      class: 'High-volume Flow Rate Capacity',
      life: '30+ Years',
      wind: 'Reinforced Heavy-duty Hanging Brackets',
      warranty: '20-Year Manufacturer Integrity Guarantee'
    }
  };

  const box = document.getElementById('part-details-box');
  const title = document.getElementById('part-title');
  const desc = document.getElementById('part-desc');
  const specs = document.getElementById('part-specs');
  const specClass = document.getElementById('spec-class');
  const specLife = document.getElementById('spec-life');
  const specWind = document.getElementById('spec-wind');
  const specWarranty = document.getElementById('spec-warranty');
  const cta = document.getElementById('part-cta');

  const onSelectPart = (partId) => {
    const data = specData[partId];
    if (!data) return;

    // Fade out details box slightly and update content
    gsap.to(box, {
      opacity: 0.6,
      scale: 0.98,
      duration: 0.15,
      onComplete: () => {
        title.innerText = data.title;
        desc.innerText = data.desc;
        specClass.innerText = data.class;
        specLife.innerText = data.life;
        specWind.innerText = data.wind;
        specWarranty.innerText = data.warranty;

        specs.style.display = 'block';
        cta.style.display = 'inline-flex';
        box.classList.add('active');

        // Set form field pre-fill matching selected material
        const inputMatType = document.getElementById('input-material-type');
        if (inputMatType) {
          inputMatType.value = partId;
          const options = document.querySelectorAll('[data-step="2"] .option-card');
          options.forEach(opt => {
            if (opt.getAttribute('data-value') === partId) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
        }

        gsap.to(box, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'back.out(1.2)'
        });
      }
    });
  };

  // Instantiate Three.js viewer
  new RoofViewer('roof-viewer-canvas', onSelectPart);
};

// 7. Interactive Before-After Slider
const initBeforeAfterSlider = () => {
  const container = document.getElementById('before-after-slider');
  const imgBefore = document.getElementById('img-before');
  const imgAfter = document.getElementById('img-after');
  const handle = document.getElementById('slider-handle');

  if (!container || !imgAfter || !handle) return;

  // Set assets dynamically using Vite resolved URLs
  imgBefore.style.backgroundImage = `url(${roofBeforeUrl})`;
  imgAfter.style.backgroundImage = `url(${roofAfterUrl})`;

  const setSliderPosition = (xPos) => {
    const rect = container.getBoundingClientRect();
    let positionPct = ((xPos - rect.left) / rect.width) * 100;
    
    // Constraints
    if (positionPct < 0) positionPct = 0;
    if (positionPct > 100) positionPct = 100;

    imgBefore.style.clipPath = `polygon(0 0, ${positionPct}% 0, ${positionPct}% 100%, 0 100%)`;
    handle.style.left = `${positionPct}%`;
  };

  let isDragging = false;

  const startDrag = () => { isDragging = true; };
  const stopDrag = () => { isDragging = false; };
  
  const handleMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX) setSliderPosition(clientX);
  };

  // Mouse Events
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
  });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mousemove', handleMove);

  // Touch Events
  container.addEventListener('touchstart', startDrag);
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('touchmove', handleMove);
};

// 8. Storm Rain & Lightning canvas particle engine
const initStormCanvas = () => {
  const canvas = document.getElementById('storm-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  const rainCount = 120;
  const rainDrops = [];

  class RainDrop {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // Distribute initial drops
    }

    reset() {
      this.x = Math.random() * width;
      this.y = -20;
      this.length = Math.random() * 20 + 15;
      this.speed = Math.random() * 12 + 15;
      this.opacity = Math.random() * 0.15 + 0.1;
      this.angle = -0.15; // Slanted rain
    }

    update() {
      this.y += this.speed;
      this.x += this.angle * this.speed;
      
      if (this.y > height + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.strokeStyle = `rgba(156, 163, 175, ${this.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.angle * this.length, this.y + this.length);
      ctx.stroke();
    }
  }

  // Populate drops
  for (let i = 0; i < rainCount; i++) {
    rainDrops.push(new RainDrop());
  }

  // Lightning controls
  let flashOpacity = 0;
  let nextFlashTime = Date.now() + Math.random() * 8000 + 4000;

  const triggerLightning = () => {
    flashOpacity = Math.random() * 0.35 + 0.15;
    
    // Double flash effect
    setTimeout(() => {
      flashOpacity = 0;
      setTimeout(() => {
        flashOpacity = Math.random() * 0.45 + 0.25;
        setTimeout(() => {
          flashOpacity = 0;
        }, Math.random() * 200 + 100);
      }, Math.random() * 150 + 50);
    }, Math.random() * 150 + 80);
    
    nextFlashTime = Date.now() + Math.random() * 10000 + 6000;
  };

  const animateStorm = () => {
    requestAnimationFrame(animateStorm);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw lightning flash
    if (Date.now() > nextFlashTime) {
      triggerLightning();
    }
    
    if (flashOpacity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, width, height);
      flashOpacity -= 0.012; // gradual fade
    }

    // Render Rain
    rainDrops.forEach(drop => {
      drop.update();
      drop.draw();
    });
  };

  animateStorm();

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  });
};

// 9. Multi-Step Quote Wizard
const initQuoteWizard = () => {
  const form = document.getElementById('quote-wizard-form');
  if (!form) return;

  const steps = document.querySelectorAll('.wizard-step-panel');
  const progressFill = document.getElementById('wizard-progress');
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');
  const btnSubmit = document.getElementById('btn-submit');
  
  let currentStep = 1;
  const totalSteps = steps.length;

  const updateProgress = () => {
    const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = `${progressPct}%`;
  };

  const showStep = (stepNum) => {
    steps.forEach(panel => {
      const pStep = parseInt(panel.getAttribute('data-step'));
      if (pStep === stepNum) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Toggle nav buttons
    if (stepNum === 1) {
      btnBack.style.display = 'none';
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    } else if (stepNum === totalSteps) {
      btnBack.style.display = 'inline-flex';
      btnNext.style.display = 'none';
      btnSubmit.style.display = 'inline-flex';
    } else {
      btnBack.style.display = 'inline-flex';
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    }

    updateProgress();
  };

  // Step Option selector event (e.g. Card select)
  const optionCards = document.querySelectorAll('.option-card');
  optionCards.forEach(card => {
    card.addEventListener('click', () => {
      // Find parent step panel
      const stepPanel = card.closest('.wizard-step-panel');
      const stepVal = card.getAttribute('data-value');

      // Unselect siblings
      stepPanel.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      // Pre-fill hidden fields
      const stepNum = parseInt(stepPanel.getAttribute('data-step'));
      if (stepNum === 1) {
        document.getElementById('input-service-type').value = stepVal;
      } else if (stepNum === 2) {
        document.getElementById('input-material-type').value = stepVal;
      }
    });
  });

  // Next/Back Clicks
  btnNext.addEventListener('click', () => {
    // Basic validation check on current step inputs
    const currentPanel = document.querySelector(`.wizard-step-panel[data-step="${currentStep}"]`);
    const inputs = currentPanel.querySelectorAll('input[required], select[required]');
    
    let isValid = true;
    inputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.style.borderColor = '#e53e3e';
      } else {
        input.style.borderColor = 'var(--border-color)';
      }
    });

    if (isValid) {
      currentStep++;
      showStep(currentStep);
    }
  });

  btnBack.addEventListener('click', () => {
    currentStep--;
    showStep(currentStep);
  });

  // Form Submit Handler (simulate conversion)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Success feedback
    const container = form.parentElement;
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 0; animation: fadeIn 0.8s ease;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" stroke-width="1.5" style="margin-bottom: 24px;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <h3 style="font-family: 'Cinzel', serif; font-size: 24px; color: var(--text-primary); margin-bottom: 12px;">Proposal Request Submitted</h3>
        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 32px auto; font-size: 14px;">Thank you for choosing Skyline. Our premium diagnostic consultant will call you within the next 2 hours to confirm your project details.</p>
        <a href="#" class="btn btn-secondary" onclick="window.location.reload();">Back to Home</a>
      </div>
    `;
  });
};

// 10. Exit-Intent Manager
const initExitIntent = () => {
  const modal = document.getElementById('exit-intent-modal');
  const close = document.getElementById('modal-close');
  const form = document.getElementById('exit-intent-form');

  if (!modal) return;

  let hasTriggered = false;

  const triggerModal = () => {
    if (hasTriggered) return;
    hasTriggered = true;
    modal.classList.add('active');
  };

  // Trigger when cursor leaves window top bounds
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 20) {
      triggerModal();
    }
  });

  // Close modal
  const closeModal = () => {
    modal.classList.remove('active');
  };

  close.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simulate capture success
    const box = modal.querySelector('.modal-box');
    box.innerHTML = `
      <button type="button" class="modal-close" id="modal-close-new" style="position: absolute; top:24px; right:24px; background:none; border:none; color:var(--text-secondary); font-size:24px; cursor:pointer;">&times;</button>
      <div style="text-align: center; padding: 16px 0;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" stroke-width="1.5" style="margin-bottom: 16px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h4 style="font-family: 'Cinzel', serif; font-size: 20px; margin-bottom: 8px;">Voucher Locked!</h4>
        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">Check your inbox. Your custom PDF Guide and $500 project credit coupon have been sent.</p>
      </div>
    `;
    
    document.getElementById('modal-close-new').addEventListener('click', closeModal);
  });
};

// 11. Interactive FAQs
const initFAQs = () => {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      // Toggle active state
      const isActive = item.classList.contains('active');
      
      // Close all items
      faqItems.forEach(i => i.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
};

// 12. Instant Callback Form Widget
const initCallbackForm = () => {
  const form = document.getElementById('callback-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('callback-phone').value;
    
    if (phone.trim()) {
      form.innerHTML = `
        <div style="color: var(--accent-gold); font-size: 13px; font-weight: 600; padding: 12px 0; animation: fadeIn 0.4s ease;">
          Connecting call to ${phone} now...
        </div>
      `;
    }
  });
};

// 14. Mobile Navigation Menu Toggle
const initMobileMenu = () => {
  const toggle = document.getElementById('mobile-menu-toggle');
  const overlay = document.getElementById('mobile-menu-overlay');
  const links = document.querySelectorAll('.mobile-nav-links a');

  if (!toggle || !overlay) return;

  const toggleMenu = () => {
    const isActive = toggle.classList.contains('active');
    if (isActive) {
      toggle.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      toggle.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  toggle.addEventListener('click', toggleMenu);

  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
};

// 13. GSAP Scroll Reveals
const initScrollReveals = () => {
  // Reveal glass cards smoothly
  gsap.from('.services-grid .service-card', {
    y: 35,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.services-grid',
      start: 'top 98%'
    }
  });

  // Timeline process steps reveal
  const steps = document.querySelectorAll('.process-step');
  steps.forEach((step, index) => {
    const isEven = index % 2 === 0;
    gsap.from(step, {
      x: isEven ? -40 : 40,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 95%'
      }
    });
  });

  // Section Header animations
  gsap.utils.toArray('.section-header').forEach(header => {
    gsap.from(header, {
      y: 30,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: header,
        start: 'top 98%'
      }
    });
  });
};

// Initialize All Features
document.addEventListener('DOMContentLoaded', () => {
  initScroll();
  initLoader();
  initCounters();
  initRoofViewerInterface();
  initBeforeAfterSlider();
  initStormCanvas();
  initQuoteWizard();
  initExitIntent();
  initFAQs();
  initCallbackForm();
  initMobileMenu();
  initScrollReveals();
  
  // Set services intro visual background image
  const servicesImg = document.getElementById('services-intro-img');
  if (servicesImg) {
    servicesImg.style.backgroundImage = `url(${roofMaterialsUrl})`;
  }
  
  // Launch minimal background wireframe rotator
  initHero3DRotator('hero-3d-canvas');
});
