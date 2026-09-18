document.getElementById('year').textContent = new Date().getFullYear();

const $ = id => document.getElementById(id);

async function readJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function capeCard(cape) {
  const article = document.createElement('article');
  article.className = 'cape-card';

  const preview = document.createElement('div');
  preview.className = 'cape-preview';

  if (cape.previewUrl) {
    const img = document.createElement('img');
    img.src = cape.previewUrl;
    img.alt = `${cape.name} cape preview`;
    img.loading = 'lazy';
    img.style.maxHeight = '88%';
    img.style.maxWidth = '72%';
    img.style.imageRendering = 'pixelated';
    preview.appendChild(img);
  } else {
    const shape = document.createElement('div');
    shape.className = 'cape-shape';
    shape.style.setProperty('--cape-a', cape.colors?.[0] || '#8e63ff');
    shape.style.setProperty('--cape-b', cape.colors?.[1] || '#39286e');
    preview.appendChild(shape);
  }

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = (cape.source || 'N3X').toUpperCase();

  const title = document.createElement('h3');
  title.textContent = cape.name || cape.id;

  const meta = document.createElement('p');
  meta.textContent = cape.textureUrl ? 'Network texture ready' : 'Bundled preview · texture mirror pending';

  article.append(preview, tag, title, meta);
  return article;
}

function profileCard(profile) {
  const article = document.createElement('article');
  article.className = 'profile-card';
  const name = document.createElement('strong');
  name.textContent = profile.name || 'Minecraft Player';
  const cape = document.createElement('span');
  cape.textContent = profile.cape ? `N3X Cape: ${profile.cape}` : 'Kein öffentliches N3X-Cape';
  const id = document.createElement('span');
  id.textContent = profile.uuid ? `UUID: ${profile.uuid}` : 'UUID nicht veröffentlicht';
  article.append(name, cape, id);
  return article;
}

async function bootNetwork() {
  try {
    const [config, catalog, users] = await Promise.all([
      readJson('network/config.json'),
      readJson('network/capes/catalog.json'),
      readJson('network/users/index.json')
    ]);

    const capes = Array.isArray(catalog.capes) ? catalog.capes : [];
    const profiles = Array.isArray(users.users) ? users.users : [];

    $('cape-count').textContent = capes.length;
    $('profile-count').textContent = profiles.length;
    $('network-state').textContent = 'ONLINE';
    $('network-message').textContent = `${config.name || 'N3X Network'} · schema ${config.schemaVersion || 1} · read-only public layer`;

    const gallery = $('cape-gallery');
    gallery.replaceChildren();
    if (capes.length) capes.forEach(cape => gallery.appendChild(capeCard(cape)));
    else gallery.innerHTML = '<div class="empty">Noch keine Network-Capes registriert.</div>';

    const profileList = $('profile-list');
    profileList.replaceChildren();
    if (profiles.length) profiles.forEach(profile => profileList.appendChild(profileCard(profile)));
    else profileList.innerHTML = '<div class="empty">Network ist bereit. Öffentliche Nutzerprofile kommen als nächster Schritt.</div>';
  } catch (error) {
    console.error(error);
    $('network-state').textContent = 'OFFLINE';
    $('network-message').textContent = 'Network-Dateien konnten nicht geladen werden.';
  }
}

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const relative = button.dataset.copy;
    const url = new URL(relative, location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      const before = button.textContent;
      button.textContent = 'Kopiert';
      setTimeout(() => button.textContent = before, 1200);
    } catch {
      prompt('URL kopieren:', url);
    }
  });
});

bootNetwork();
