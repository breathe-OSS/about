function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}


function initLogoParallax(): void {
  const card = document.querySelector('.main-aqi-card') as HTMLElement;
  const logo = document.getElementById('logo3d') as HTMLImageElement;
  if (!card || !logo) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 15;

    logo.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  });

  card.addEventListener('mouseleave', () => {
    logo.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  });
}


function initNavigation(): void {
  const sidebarButtons = document.querySelectorAll('.nav-btn');
  const bottomNavItems = document.querySelectorAll('.nav-item');

  function setActive(id: string) {
    sidebarButtons.forEach(btn => {
      const target = (btn as HTMLButtonElement).getAttribute('onclick')?.match(/#(\w+)/)?.[1];
      btn.classList.toggle('active', target === id);
    });

    bottomNavItems.forEach(item => {
      const target = (item as HTMLButtonElement).getAttribute('onclick')?.match(/#(\w+)/)?.[1];
      item.classList.toggle('active', target === id);
    });
  }

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    if (id) setActive(id);
  });

  // Highlight based on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.card[id]').forEach(card => observer.observe(card));
}


document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLogoParallax();

  const initialId = window.location.hash.slice(1);
  if (initialId) {
    const el = document.getElementById(initialId);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
});

