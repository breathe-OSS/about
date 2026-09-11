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

function initThemeToggle(): void {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    root.classList.add('theme-changing');
    window.setTimeout(() => root.classList.remove('theme-changing'), 260);

    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

interface ZoneItem {
  id: string;
  name: string;
  provider?: string;
}

interface ZonesResponse {
  zones: ZoneItem[];
}

interface SensorInfoResponse {
  sensors: unknown[];
}

async function fetchLiveNetworkStats(): Promise<void> {
  const API_BASE = 'https://api.breatheoss.app';

  try {
    const [zonesRes, sensorsRes] = await Promise.all([
      fetch(`${API_BASE}/zones`).catch(() => null),
      fetch(`${API_BASE}/sensor-info`).catch(() => null),
    ]);

    if (zonesRes && zonesRes.ok) {
      const zonesData = (await zonesRes.json()) as ZonesResponse;
      if (zonesData && Array.isArray(zonesData.zones)) {
        const totalZones = zonesData.zones.length;
        const groundCities = zonesData.zones.filter(z => z.provider === 'airgradient').length;
        const satCities = totalZones - groundCities;

        const statZones = document.getElementById('stat-zones');
        if (statZones && totalZones > 0) {
          statZones.textContent = totalZones.toString();
        }

        const statCities = document.getElementById('stat-cities');
        if (statCities && groundCities > 0) {
          statCities.textContent = groundCities.toString();
        }

        const covZones = document.getElementById('cov-zones-count');
        if (covZones && totalZones > 0) {
          covZones.textContent = `${totalZones} zones`;
        }
        const covCities = document.getElementById('cov-cities-count');
        if (covCities && groundCities > 0) {
          covCities.textContent = `${groundCities} cities`;
        }
        const covSat = document.getElementById('cov-sat-count');
        if (covSat && satCities >= 0) {
          covSat.textContent = satCities.toString();
        }
      }
    }

    if (sensorsRes && sensorsRes.ok) {
      const sensorsData = (await sensorsRes.json()) as SensorInfoResponse;
      if (sensorsData && Array.isArray(sensorsData.sensors)) {
        const sensorCount = sensorsData.sensors.length;
        const statSensors = document.getElementById('stat-sensors');
        if (statSensors && sensorCount > 0) {
          statSensors.textContent = sensorCount.toString();
        }
      }
    }
  } catch {
  }
}

function initMemberPopups(): void {
  const interactiveMembers = document.querySelectorAll<HTMLElement>(
    '.member-circle.redacted, .member-circle.anonymous-contributor'
  );

  function ensureTooltipWithinBounds(circle: HTMLElement): void {
    const tooltip = circle.querySelector<HTMLElement>('.member-tooltip, .anonymous-tooltip');
    if (!tooltip) return;

    const rect = tooltip.getBoundingClientRect();
    const pad = 12;
    const vw = document.documentElement.clientWidth || window.innerWidth;

    if (rect.right > vw - pad) {
      const overflow = rect.right - (vw - pad);
      const currentRight = parseFloat(getComputedStyle(tooltip).right) || 0;
      tooltip.style.right = `${currentRight + overflow}px`;
    }
  }

  interactiveMembers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = btn.classList.contains('active');
      interactiveMembers.forEach((el) => el.classList.remove('active'));
      if (!wasActive) {
        btn.classList.add('active');
        ensureTooltipWithinBounds(btn);
      }
    });

    btn.addEventListener('mouseenter', () => {
      ensureTooltipWithinBounds(btn);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const wasActive = btn.classList.contains('active');
        interactiveMembers.forEach((el) => el.classList.remove('active'));
        if (!wasActive) {
          btn.classList.add('active');
          ensureTooltipWithinBounds(btn);
        }
      } else if (e.key === 'Escape') {
        btn.classList.remove('active');
      }
    });
  });

  document.addEventListener('click', (e) => {
    interactiveMembers.forEach((btn) => {
      if (!btn.contains(e.target as Node)) {
        btn.classList.remove('active');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initNavigation();
  initLogoParallax();
  initMemberPopups();
  fetchLiveNetworkStats();

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

