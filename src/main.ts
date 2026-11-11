const API_BASE = 'https://api.breatheoss.app';
const APP_BASE = 'https://breatheoss.app';

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

interface ZoneReading {
  zone_id: string;
  us_aqi?: number;
  aqi: number;
}

interface LiveEntry {
  zone: ZoneItem;
  aqi: number;
}

const FEATURED_ZONES = ['srinagar', 'jammu_city', 'leh'];

let liveEntries: LiveEntry[] = [];

function initThemeToggle(): void {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) {
    return;
  }

  toggleBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    root.classList.add('theme-changing');
    window.setTimeout(() => root.classList.remove('theme-changing'), 550);

    root.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      return;
    }
    renderLive();
  });
}

function initTopbar(): void {
  const bar = document.getElementById('topbar');
  if (!bar) {
    return;
  }
  const update = () => {
    bar.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initSectionHighlight(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.topnav a'));
  const sections = links
    .map((link) => document.querySelector<HTMLElement>(link.getAttribute('href') || ''))
    .filter((el): el is HTMLElement => el !== null);
  if (sections.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const id = `#${entry.target.id}`;
        links.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((section) => observer.observe(section));
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function usBand(aqi: number): { label: string; token: string; darkText: boolean } {
  if (aqi <= 50) {
    return { label: 'Good', token: '--us-aqi-good', darkText: true };
  }
  if (aqi <= 100) {
    return { label: 'Moderate', token: '--us-aqi-moderate', darkText: true };
  }
  if (aqi <= 150) {
    return { label: 'Unhealthy for sensitive groups', token: '--us-aqi-sensitive', darkText: true };
  }
  if (aqi <= 200) {
    return { label: 'Unhealthy', token: '--us-aqi-unhealthy', darkText: false };
  }
  if (aqi <= 300) {
    return { label: 'Very unhealthy', token: '--us-aqi-very-unhealthy', darkText: false };
  }
  return { label: 'Hazardous', token: '--us-aqi-hazardous', darkText: false };
}

function renderLive(): void {
  const list = document.getElementById('live-list');
  if (!list || liveEntries.length === 0) {
    return;
  }

  const rows = liveEntries.map((entry) => {
    const band = usBand(entry.aqi);
    const color = cssVar(band.token);
    const source = entry.zone.provider === 'airgradient' ? 'Ground sensors' : 'Satellite model';
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'live-row';
    link.href = `${APP_BASE}/zone/${encodeURIComponent(entry.zone.id)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `${entry.zone.name}, US AQI ${entry.aqi}, ${band.label}`);

    const zone = document.createElement('div');
    zone.className = 'live-zone';
    const name = document.createElement('div');
    name.className = 'live-name';
    name.textContent = entry.zone.name;
    const meta = document.createElement('div');
    meta.className = 'live-meta';
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.style.color = color;
    tag.textContent = band.label;
    meta.append(tag, document.createTextNode(` · ${source}`));
    zone.append(name, meta);

    const pill = document.createElement('div');
    pill.className = 'live-aqi';
    pill.style.background = color;
    pill.style.color = band.darkText ? '#1a1c22' : '#ffffff';
    pill.textContent = String(entry.aqi);

    link.append(zone, pill);
    item.append(link);
    return item;
  });

  list.replaceChildren(...rows);
}

function pickLiveEntries(zones: ZoneItem[], readings: ZoneReading[]): LiveEntry[] {
  const byId: { [id: string]: number } = {};
  readings.forEach((reading) => {
    const value = reading.us_aqi || reading.aqi;
    if (typeof value === 'number' && value > 0) {
      byId[reading.zone_id] = value;
    }
  });

  const entries: LiveEntry[] = [];
  FEATURED_ZONES.forEach((id) => {
    const zone = zones.find((z) => z.id === id);
    if (zone && byId[id] !== undefined) {
      entries.push({ zone, aqi: byId[id] });
    }
  });

  let worst: LiveEntry | null = null;
  zones.forEach((zone) => {
    const value = byId[zone.id];
    if (value === undefined || FEATURED_ZONES.includes(zone.id)) {
      return;
    }
    if (!worst || value > worst.aqi) {
      worst = { zone, aqi: value };
    }
  });
  if (worst) {
    entries.push(worst);
  }
  return entries;
}

async function loadLiveReadings(zones: ZoneItem[]): Promise<void> {
  const foot = document.getElementById('live-foot');
  try {
    const ids = zones.map((z) => encodeURIComponent(z.id)).join(',');
    const res = await fetch(`${API_BASE}/aqi/zones?ids=${ids}`);
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    const data = (await res.json()) as { zones: ZoneReading[] };
    liveEntries = pickLiveEntries(zones, data.zones || []);
    if (liveEntries.length === 0) {
      throw new Error('empty');
    }
    renderLive();
  } catch {
    const list = document.getElementById('live-list');
    list?.replaceChildren();
    if (foot) {
      foot.textContent = "Couldn't load live readings right now. Open the app to see them.";
    }
  }
}

function renderNetwork(zones: ZoneItem[]): void {
  const total = zones.length;
  const ground = zones.filter((z) => z.provider === 'airgradient').length;
  const satellite = total - ground;

  const setText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  };

  if (total > 0) {
    setText('stat-zones', String(total));
    setText('cov-zones-count', `${total} zones`);
  }
  if (ground > 0) {
    setText('stat-cities', String(ground));
    setText('cov-cities-count', `${ground} cities`);
  }
  setText('cov-sat-count', String(satellite));

  const grid = document.getElementById('coverage-grid');
  if (!grid || total === 0) {
    return;
  }
  const sorted = [...zones].sort((a, b) => {
    const aGround = a.provider === 'airgradient' ? 0 : 1;
    const bGround = b.provider === 'airgradient' ? 0 : 1;
    if (aGround !== bGround) {
      return aGround - bGround;
    }
    return a.name.localeCompare(b.name);
  });
  const pills = sorted.map((zone) => {
    const pill = document.createElement('div');
    pill.className = `zone-pill ${zone.provider === 'airgradient' ? 'ground' : 'satellite'}`;
    const dot = document.createElement('span');
    dot.className = 'zone-dot';
    pill.append(dot, document.createTextNode(zone.name));
    return pill;
  });
  grid.replaceChildren(...pills);
}

async function loadNetwork(): Promise<void> {
  const [zonesRes, sensorsRes] = await Promise.all([
    fetch(`${API_BASE}/zones`).catch(() => null),
    fetch(`${API_BASE}/sensor-info`).catch(() => null),
  ]);

  let zones: ZoneItem[] = [];
  if (zonesRes && zonesRes.ok) {
    const data = (await zonesRes.json()) as ZonesResponse;
    if (data && Array.isArray(data.zones)) {
      zones = data.zones;
    }
  }

  if (sensorsRes && sensorsRes.ok) {
    const data = (await sensorsRes.json()) as SensorInfoResponse;
    if (data && Array.isArray(data.sensors) && data.sensors.length > 0) {
      const el = document.getElementById('stat-sensors');
      if (el) {
        el.textContent = String(data.sensors.length);
      }
    }
  }

  if (zones.length === 0) {
    const foot = document.getElementById('live-foot');
    document.getElementById('live-list')?.replaceChildren();
    if (foot) {
      foot.textContent = "Couldn't load live readings right now. Open the app to see them.";
    }
    return;
  }

  renderNetwork(zones);
  await loadLiveReadings(zones);
}

function initCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('.upi-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        btn.classList.add('copied');
      } catch {
        btn.textContent = 'Select it';
      }
      window.setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1800);
    });
  });
}

function initMemberPopups(): void {
  const members = document.querySelectorAll<HTMLElement>(
    '.member-circle.redacted, .member-circle.anonymous-contributor'
  );

  const toggle = (btn: HTMLElement) => {
    const wasActive = btn.classList.contains('active');
    members.forEach((el) => el.classList.remove('active'));
    if (!wasActive) {
      btn.classList.add('active');
    }
  };

  members.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(btn);
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(btn);
      } else if (e.key === 'Escape') {
        btn.classList.remove('active');
      }
    });
  });

  document.addEventListener('click', () => {
    members.forEach((btn) => btn.classList.remove('active'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initTopbar();
  initSectionHighlight();
  initCopyButtons();
  initMemberPopups();
  loadNetwork();
});
