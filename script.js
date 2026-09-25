/* =========================================================
   OLUWAPEYIBOMI — application script v5
   Namespaced modules, single scroll scheduler, reduced-motion aware.
   ========================================================= */
(function(){
"use strict";

const MANIFEST = (typeof ARCHIVE_MANIFEST !== 'undefined') ? ARCHIVE_MANIFEST : [];
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

/* ---------------- Motion helpers ---------------- */
const Motion = {
  lerp(current, target, amount){ return current + (target - current) * amount; },
  clamp(value, min, max){ return Math.min(Math.max(value, min), max); },
  reveal(el){ el.classList.add('is-visible'); },
  hide(el){ el.classList.remove('is-visible'); },
  stagger(elements, fn, gap){
    elements.forEach((el, i) => setTimeout(()=>fn(el), i*(gap||90)));
  }
};

/* ---------------- Central scroll scheduler ---------------- */
const ScrollEngine = (()=>{
  let listeners = [];
  let ticking = false;
  let lastY = window.scrollY;
  let lastT = performance.now();
  let velocity = 0;

  function frame(){
    const y = window.scrollY;
    const t = performance.now();
    const dt = Math.max(t - lastT, 1);
    velocity = Motion.clamp((y - lastY) / dt, -4, 4);
    lastY = y; lastT = t;
    listeners.forEach(fn => fn({ y, velocity }));
    ticking = false;
  }
  window.addEventListener('scroll', ()=>{
    if(!ticking){ requestAnimationFrame(frame); ticking = true; }
  }, { passive:true });

  return {
    subscribe(fn){ listeners.push(fn); },
    getVelocity(){ return velocity; }
  };
})();

/* ---------------- Cursor ---------------- */
const Cursor = {
  init(){
    if(isTouch || prefersReduced) return;
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const label = document.createElement('div'); label.className = 'cursor-label';
    document.body.appendChild(dot); document.body.appendChild(label);
    let tx=0, ty=0, cx=0, cy=0;
    document.addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; });
    function loop(){
      cx = Motion.lerp(cx, tx, 0.35); cy = Motion.lerp(cy, ty, 0.35);
      dot.style.left = cx+'px'; dot.style.top = cy+'px';
      label.style.left = cx+'px'; label.style.top = (cy-34)+'px';
      requestAnimationFrame(loop);
    }
    loop();
    document.addEventListener('mouseover', e=>{
      const target = e.target.closest('[data-cursor]');
      if(target){ label.textContent = target.dataset.cursor; label.classList.add('show'); }
      else { label.classList.remove('show'); }
    });
  }
};

/* ---------------- Navigation ---------------- */
const Navigation = {
  init(){
    const nav = document.querySelector('.site-nav');
    if(!nav) return;
    const currentPage = document.body.dataset.page;
    document.querySelectorAll('[data-nav]').forEach(el=>{
      if(el.dataset.nav === currentPage) el.classList.add('active');
    });

    let lastY = window.scrollY;
    ScrollEngine.subscribe(({y})=>{
      nav.classList.toggle('compact', y > 60);
      if(y > lastY && y > 200) nav.classList.add('nav--hidden');
      else nav.classList.remove('nav--hidden');
      lastY = y;
    });

    // theme switching based on data-theme sections
    const themedSections = document.querySelectorAll('[data-theme]');
    if(themedSections.length){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            nav.classList.toggle('nav--dark', entry.target.dataset.theme === 'dark');
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      themedSections.forEach(s=>io.observe(s));
    }

    // mobile menu
    const mobileMenu = document.getElementById('mobileMenu');
    document.getElementById('menuOpen')?.addEventListener('click', ()=> mobileMenu.classList.add('open'));
    document.getElementById('menuClose')?.addEventListener('click', ()=> mobileMenu.classList.remove('open'));

    // sticky mobile CTA
    const stickyCta = document.getElementById('stickyCta');
    if(stickyCta) ScrollEngine.subscribe(({y})=> stickyCta.classList.toggle('show', y > 700));

    // scroll progress bar
    const bar = document.getElementById('scrollProgress');
    if(bar){
      ScrollEngine.subscribe(()=>{
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        bar.style.width = max > 0 ? (h.scrollTop/max*100)+'%' : '0%';
      });
    }
  }
};

/* ---------------- Page transitions ---------------- */
const Transitions = {
  init(){
    const el = document.getElementById('pageTransition');
    document.querySelectorAll('a[data-transition]').forEach(link=>{
      link.addEventListener('click', e=>{
        const href = link.getAttribute('href');
        if(!href || href.startsWith('#') || link.target === '_blank') return;
        e.preventDefault();
        if(el){
          el.classList.add('active');
          setTimeout(()=>{ window.location.href = href; }, prefersReduced ? 0 : 460);
        } else { window.location.href = href; }
      });
    });
    document.querySelectorAll('[data-scroll]').forEach(el=>{
      el.addEventListener('click', e=>{ e.preventDefault(); document.getElementById(el.dataset.scroll)?.scrollIntoView({behavior:'smooth'}); });
    });
  }
};

/* ---------------- Generic scroll-reveal ---------------- */
const Reveal = {
  init(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }
};

/* ---------------- Magnetic buttons ---------------- */
const Magnetic = {
  init(){
    if(prefersReduced || isTouch) return;
    document.querySelectorAll('.magnetic').forEach(btn=>{
      btn.addEventListener('mousemove', e=>{
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX-r.left-r.width/2)*0.18}px, ${(e.clientY-r.top-r.height/2)*0.3}px)`;
      });
      btn.addEventListener('mouseleave', ()=> btn.style.transform = 'translate(0,0)');
    });
  }
};


/* ---------------- Shared small widgets ---------------- */
const Widgets = {
  init(){
    document.querySelectorAll('.chip-select').forEach(group=>{
      const hidden = group.closest('.form-block')?.querySelector('#cTopic');
      group.querySelectorAll('.chip-option').forEach(chip=> chip.addEventListener('click', ()=>{
        chip.classList.toggle('selected');
        if(hidden){
          const selected = [...group.querySelectorAll('.chip-option.selected')].map(c=>c.textContent);
          hidden.value = selected.join(', ');
        }
      }));
    });
  }
};

/* ---------------- Lightbox ---------------- */
const Lightbox = {
  el:null, img:null, cat:null, caption:null, counter:null,
  list:[], index:0, lastFocused:null,
  init(){
    this.el = document.getElementById('lightbox');
    if(!this.el) return;
    this.img = document.getElementById('lbImg');
    this.cat = document.getElementById('lbCat');
    this.caption = document.getElementById('lbCaption');
    this.counter = document.getElementById('lbCounter');
    document.getElementById('lbClose').addEventListener('click', ()=>this.close());
    document.getElementById('lbNext').addEventListener('click', ()=>this.next());
    document.getElementById('lbPrev').addEventListener('click', ()=>this.prev());
    this.el.addEventListener('click', e=>{ if(e.target===this.el) this.close(); });
    document.addEventListener('keydown', e=>{
      if(!this.el.classList.contains('open')) return;
      if(e.key==='Escape') this.close();
      if(e.key==='ArrowRight') this.next();
      if(e.key==='ArrowLeft') this.prev();
    });
    let touchStartX=0;
    this.el.addEventListener('touchstart', e=> touchStartX = e.changedTouches[0].clientX);
    this.el.addEventListener('touchend', e=>{
      const dx = e.changedTouches[0].clientX - touchStartX;
      if(dx>50) this.prev(); else if(dx<-50) this.next();
    });
    document.querySelectorAll('[data-lightbox-id]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const id = el.dataset.lightboxId;
        const item = MANIFEST.find(m=>m.id===id);
        if(!item) return;
        this.open(MANIFEST.filter(m=>m.category===item.category), id, el);
      });
    });
  },
  render(){
    const item = this.list[this.index];
    if(!item) return;
    this.img.classList.remove('loaded');
    this.img.src = 'images/full/' + item.file;
    this.img.alt = item.caption || item.categoryLabel;
    this.img.onload = ()=> this.img.classList.add('loaded');
    this.cat.textContent = item.categoryLabel;
    this.caption.textContent = item.caption || '';
    this.counter.textContent = (this.index+1) + ' / ' + this.list.length;
  },
  open(list, startId, triggerEl){
    this.list = list;
    this.index = Math.max(0, list.findIndex(i=>i.id===startId));
    this.lastFocused = triggerEl || document.activeElement;
    this.render();
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  },
  close(){
    this.el.classList.remove('open');
    document.body.style.overflow = '';
    this.lastFocused?.focus();
  },
  next(){ this.index = (this.index+1)%this.list.length; this.render(); },
  prev(){ this.index = (this.index-1+this.list.length)%this.list.length; this.render(); }
};

/* ---------------- Archive (a few curated selections, each opening onto its full moment) ---------------- */
const Archive = {
  // Hand-picked highlights. size: 'feature' (2x2), 'tall' (1x2), 'wide' (2x1), or omitted (1x1).
  curated: [
    { id:'cameraroll-01', size:'feature' },
    { id:'transition-02', size:'tall' },
    { id:'july-05' },
    { id:'life20s-02' },
    { id:'career-06', size:'wide' },
    { id:'softlife-02' },
    { id:'vlogs-03' },
    { id:'softlife-09' },
    { id:'cameraroll-09' }
  ],
  init(){
    const grid = document.getElementById('archiveGrid');
    if(!grid || !MANIFEST.length) return;
    this.curated.forEach((pick, i)=>{
      const item = MANIFEST.find(m=>m.id===pick.id);
      if(!item) return;
      const moment = MANIFEST.filter(m=>m.category===item.category);
      const div = document.createElement('div');
      div.className = 'curated-item' + (pick.size ? ' -'+pick.size : '');
      div.dataset.id = item.id;
      div.style.setProperty('--i', i % 8);
      div.tabIndex = 0;
      div.setAttribute('role', 'button');
      div.setAttribute('aria-label', `${item.caption || item.categoryLabel} — open ${item.categoryLabel}`);
      div.innerHTML = `<img src="images/thumb/${item.file}" loading="lazy" decoding="async" alt="${item.caption || item.categoryLabel}">
        <span class="masonry-tag"><span>${item.categoryLabel}</span>${moment.length>1 ? `<span class="masonry-count">${moment.length} photos</span>` : ''}</span>`;
      const img = div.querySelector('img');
      if(img.complete) img.classList.add('loaded');
      else img.addEventListener('load', ()=> img.classList.add('loaded'));
      const openMoment = ()=> Lightbox.open(moment, item.id, div);
      div.addEventListener('click', openMoment);
      div.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openMoment(); }
      });
      grid.appendChild(div);
    });

    // Staggered reveal as the grid scrolls into view
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      grid.querySelectorAll('.curated-item').forEach(el=> io.observe(el));
    } else {
      grid.querySelectorAll('.curated-item').forEach(el=> el.classList.add('in'));
    }
  }
};

/* ---------------- Forms ---------------- */
const Forms = {
  endpoint: 'https://formspree.io/f/xwlkoqnz',
  init(){
    this.wire('connectForm','connectConfirm','connectError');
    this.wire('askForm','askConfirm','askError');
    this.wire('waitlistForm','waitlistConfirm','waitlistError');
    // focused-room effect
    document.querySelectorAll('.form-block').forEach(form=>{
      const fields = form.querySelectorAll('.field');
      fields.forEach(field=>{
        const input = field.querySelector('input,textarea');
        input?.addEventListener('focus', ()=>{ form.classList.add('is-focused-mode'); field.classList.add('active'); });
        input?.addEventListener('blur', ()=>{ form.classList.remove('is-focused-mode'); field.classList.remove('active'); });
      });
    });
  },
  wire(formId, confirmId, errorId){
    const form = document.getElementById(formId);
    const confirm = document.getElementById(confirmId);
    const errorEl = errorId ? document.getElementById(errorId) : null;
    if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      let allValid = true;
      form.querySelectorAll('.field').forEach(field=>{
        const input = field.querySelector('input,textarea');
        if(input && input.hasAttribute('required')){
          const valid = input.checkValidity();
          field.classList.toggle('invalid', !valid);
          if(!valid) allValid = false;
        }
      });
      if(!allValid) return;

      errorEl?.classList.remove('show');
      const submitBtn = form.querySelector('.submit-btn');
      const originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if(submitBtn){ submitBtn.disabled = true; submitBtn.innerHTML = 'Sending&hellip;'; }

      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      }).then(res=>{
        if(res.ok){
          form.classList.add('hide');
          confirm.classList.add('show');
        } else {
          throw new Error('Submission failed');
        }
      }).catch(()=>{
        errorEl?.classList.add('show');
      }).finally(()=>{
        if(submitBtn){ submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
      });
    });
  }
};

/* ---------------- Secret + credits ---------------- */
const Secret = {
  init(){
    const mark = document.getElementById('secretMark');
    const msg = document.getElementById('secretMessage');
    if(mark && msg){
      mark.addEventListener('click', ()=> msg.classList.toggle('show'));
    }
    const creditLink = document.getElementById('creditLink');
    const overlay = document.getElementById('creditsOverlay');
    if(creditLink && overlay){
      creditLink.addEventListener('click', e=>{ e.preventDefault(); overlay.classList.add('open'); document.body.style.overflow='hidden'; overlay.querySelector('.credits-close').focus(); });
      overlay.querySelector('.credits-close')?.addEventListener('click', ()=>{ overlay.classList.remove('open'); document.body.style.overflow=''; creditLink.focus(); });
      overlay.addEventListener('click', e=>{ if(e.target===overlay){ overlay.classList.remove('open'); document.body.style.overflow=''; } });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape' && overlay.classList.contains('open')){ overlay.classList.remove('open'); document.body.style.overflow=''; } });
    }
  }
};

/* ---------------- App ---------------- */
const App = {
  init(){
    Navigation.init();
    Transitions.init();
    Reveal.init();
    Magnetic.init();
    Cursor.init();
    Widgets.init();
    Lightbox.init();
    Archive.init();
    Forms.init();
    Secret.init();
    const yearEl = document.getElementById('yearNow');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
  }
};

document.addEventListener('DOMContentLoaded', ()=> App.init());
})();
