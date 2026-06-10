// Small client-side interactions for the static site
document.getElementById('year').textContent = new Date().getFullYear();

(function(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.site-header');

  if(toggle){
    toggle.addEventListener('click', ()=>{
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      // when opening the mobile nav ensure header is visible
      if(!expanded){
        header.classList.remove('hidden');
      }
    });
  }

  // Utility: set form status
  function setFormStatus(type, message){
    const node = document.getElementById('formStatus');
    if(!node) return;
    node.className = 'form-status show ' + (type === 'success' ? 'success' : 'error');
    node.textContent = message;
  }

  function clearFormStatus(){
    const node = document.getElementById('formStatus');
    if(!node) return;
    node.className = 'form-status';
    node.textContent = '';
  }

  // Show/hide loading on button
  function setLoading(isLoading){
    const btn = document.getElementById('sendBtn');
    if(!btn) return;
    if(isLoading){
      btn.classList.add('loading');
      btn.setAttribute('aria-disabled','true');
      btn.querySelector('.btn-text').textContent = 'Sending...';
    } else {
      btn.classList.remove('loading');
      btn.removeAttribute('aria-disabled');
      btn.querySelector('.btn-text').textContent = 'Send';
    }
  }

  // mailto fallback construction
  function openMailtoFallback({name,email,message}){
    const to = 'bijumatprof@gmail.com';
    const subject = `Website contact from ${name || 'website visitor'}`;
    const body = `Name: ${name || ''}%0D%0AEmail: ${email || ''}%0D%0A%0D%0A${encodeURIComponent(message || '')}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
  }

  // Form handler: POST to serverless endpoint to send email without using the user's mail client
  const form = document.getElementById('contactForm');
  if(form){
    let inProgress = false;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      if(inProgress) return; // prevent double submit

      clearFormStatus();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      // Basic client-side validation
      if(!email || !message){
        setFormStatus('error','Please enter your email and a message.');
        return;
      }

      inProgress = true;
      setLoading(true);

      const payload = { name, email, message };

      try {
        const resp = await fetch('/api/sendEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // If endpoint doesn't exist or returns 404/502/etc, fallback to mailto
        if(!resp.ok){
          // try to parse a helpful error message
          let details = '';
          try{
            const json = await resp.json();
            if(json && json.error) details = ` — ${json.error}`;
          }catch(_){
            // ignore parse errors
          }

          // if 404 or 502 or 500, guide to fallback
          if([404,500,502].includes(resp.status)){
            setFormStatus('error', `Server not available; opening your email client as a fallback${details}.`);
            // short delay so user sees message before mailto opens
            setTimeout(()=> openMailtoFallback({name,email,message}), 700);
          } else {
            setFormStatus('error', `Could not send message (${resp.status})${details}. Please try again later.`);
          }

        } else {
          setFormStatus('success','Thanks — your message was sent. We will respond shortly.');
          form.reset();
        }

      } catch (ex){
        // network or CORS error — fallback to mailto
        console.error('sendEmail network error', ex);
        setFormStatus('error','Network error or server not reachable; opening your email client as a fallback.');
        setTimeout(()=> openMailtoFallback({name,email,message}), 700);
      } finally {
        inProgress = false;
        setLoading(false);
      }

    });
  }

  // Hide-on-scroll / reveal-on-scroll header behavior
  // Respect prefers-reduced-motion: do not animate/hide if user prefers reduced motion
  if(!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    let lastScrollY = window.scrollY || 0;
    let ticking = false;
    const SCROLL_DELTA = 10; // minimal delta to trigger
    const MINIMUM_SHOW_AT_TOP = 80; // always show when near top

    function onScroll(){
      const currentY = window.scrollY || 0;
      // if mobile nav is open, keep header visible
      const navOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';

      if(Math.abs(currentY - lastScrollY) < SCROLL_DELTA){
        ticking = false;
        return;
      }

      if(navOpen){
        header.classList.remove('hidden');
      } else if(currentY > lastScrollY && currentY > MINIMUM_SHOW_AT_TOP){
        // scrolling down
        header.classList.add('hidden');
      } else {
        // scrolling up or near top
        header.classList.remove('hidden');
      }

      lastScrollY = currentY;
      ticking = false;
    }

    window.addEventListener('scroll', ()=>{
      if(!ticking){
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, {passive: true});

    // Ensure header is visible if focus moves into header (keyboard navigation)
    window.addEventListener('focusin', (e)=>{
      if(header && header.contains(e.target)){
        header.classList.remove('hidden');
      }
    });

    // When resizing, reset header class and lastScrollY
    window.addEventListener('resize', ()=>{
      lastScrollY = window.scrollY || 0;
      header.classList.remove('hidden');
    });
  }

})();
