/**
 * Server Form - Form Fields Module
 * Handles dynamic form field generation and manipulation.
 */

export function makeRow(container, html) {
  const div = document.createElement('div');
  div.className = 'row';
  div.innerHTML = html;
  div.querySelector('button').onclick = () => div.remove();
  container.appendChild(div);
  return div;
}

export function addGenericArg(container, value) {
  makeRow(container, `
    <input type="text" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

export function addGenericEnv(container, key, value) {
  makeRow(container, `
    <input class="env-key" type="text" placeholder="KEY" value="${key}">
    <input class="env-val" type="text" placeholder="VALUE" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

export function addNpxArg(container, value) {
  makeRow(container, `
    <input type="text" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

export function addNpxEnv(container, key, value) {
  makeRow(container, `
    <input class="env-key" type="text" placeholder="KEY" value="${key}">
    <input class="env-val" type="text" placeholder="VALUE" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

export function addDockerPort(container, value) {
  makeRow(container, `
    <input type="text" placeholder="host:container" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

export function addDockerVolume(container, value) {
  makeRow(container, `
    <input type="text" placeholder="src:dst" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

export function addDockerEnv(container, key, value) {
  makeRow(container, `
    <input class="env-key" type="text" placeholder="KEY" value="${key}">
    <input class="env-val" type="text" placeholder="VALUE" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Initialize the type selector
 * @param {NodeList} typeRadios - Type radio buttons
 */
export function initTypeSelector(typeRadios) {
  typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`section-${radio.value}`).classList.add('active');
    });
  });
}

/**
 * Set up the generic form with configuration
 * @param {object} config - Server configuration
 * @param {HTMLElement} cmdInput - Command input element
 * @param {HTMLElement} genericArgs - Generic arguments container
 * @param {HTMLElement} genericEnv - Generic environment variables container
 * @param {HTMLElement} genericDis - Generic disabled checkbox
 */
export function setupGenericForm(config, cmdInput, genericArgs, genericEnv, genericDis) {
  cmdInput.value = config.command;
  genericDis.checked = !!config.disabled;
  
  genericArgs.innerHTML = '';
  (config.args || []).forEach(a => addGenericArg(genericArgs, a));
  if (!(config.args || []).length) addGenericArg(genericArgs, '');
  
  genericEnv.innerHTML = '';
  Object.entries(config.env || {}).forEach(([k, v]) => addGenericEnv(genericEnv, k, v));
  if (!config.env) addGenericEnv(genericEnv, '', '');
}

/**
 * Set up the NPX form with configuration
 * @param {object} config - Server configuration
 * @param {HTMLElement} npxRepo - NPX repository input element
 * @param {NodeList} npxFlags - NPX flags checkboxes
 * @param {HTMLElement} npxArgs - NPX arguments container
 * @param {HTMLElement} npxEnv - NPX environment variables container
 * @param {HTMLElement} npxDis - NPX disabled checkbox
 */
export function setupNpxForm(config, npxRepo, npxFlags, npxArgs, npxEnv, npxDis) {
  npxDis.checked = !!config.disabled;
  
  const flags = (config.args || []).filter(a => a.startsWith('-'));
  const rest = (config.args || []).filter(a => !a.startsWith('-'));
  
  npxFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
  npxRepo.value = rest[0] || '';
  
  npxArgs.innerHTML = '';
  rest.slice(1).forEach(a => addNpxArg(npxArgs, a));
  if (rest.length <= 1) addNpxArg(npxArgs, '');
  
  npxEnv.innerHTML = '';
  Object.entries(config.env || {}).forEach(([k, v]) => addNpxEnv(npxEnv, k, v));
  if (!config.env) addNpxEnv(npxEnv, '', '');
}

/**
 * Set up the Docker form with configuration
 * @param {object} config - Server configuration
 * @param {HTMLElement} dockerImage - Docker image input element
 * @param {NodeList} dockerFlags - Docker flags checkboxes
 * @param {HTMLElement} dockerPorts - Docker ports container
 * @param {HTMLElement} dockerVolumes - Docker volumes container
 * @param {HTMLElement} dockerEnv - Docker environment variables container
 * @param {HTMLElement} dockerDis - Docker disabled checkbox
 */
export function setupDockerForm(config, dockerImage, dockerFlags, dockerPorts, dockerVolumes, dockerEnv, dockerDis) {
  dockerDis.checked = !!config.disabled;
  
  const flags = (config.args || []).filter(a => a.startsWith('-'));
  const rest = (config.args || []).filter(a => !a.startsWith('-'));
  
  dockerFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
  dockerImage.value = rest[0] || '';
  
  dockerEnv.innerHTML = '';
  Object.entries(config.env || {}).forEach(([k, v]) => addDockerEnv(dockerEnv, k, v));
  if (!config.env) addDockerEnv(dockerEnv, '', '');
}

/**
 * Handle advanced form submission
 * @param {string} type - Server type
 * @param {object} config - Server configuration
 * @param {HTMLElement} cmdInput - Command input element
 * @param {HTMLElement} genericArgs - Generic arguments container
 * @param {HTMLElement} genericEnv - Generic environment variables container
 * @param {HTMLElement} genericDis - Generic disabled checkbox
 * @param {HTMLElement} npxRepo - NPX repository input element
 * @param {NodeList} npxFlags - NPX flags checkboxes
 * @param {HTMLElement} npxArgs - NPX arguments container
 * @param {HTMLElement} npxEnv - NPX environment variables container
 * @param {HTMLElement} npxDis - NPX disabled checkbox
 * @param {HTMLElement} dockerImage - Docker image input element
 * @param {NodeList} dockerFlags - Docker flags checkboxes
 * @param {HTMLElement} dockerPorts - Docker ports container
 * @param {HTMLElement} dockerVolumes - Docker volumes container
 * @param {HTMLElement} dockerEnv - Docker environment variables container
 * @param {HTMLElement} dockerDis - Docker disabled checkbox
 * @returns {object} - Updated server configuration
 */
export function handleAdvancedSubmit(
  type, config,
  cmdInput, genericArgs, genericEnv, genericDis,
  npxRepo, npxFlags, npxArgs, npxEnv, npxDis,
  dockerImage, dockerFlags, dockerPorts, dockerVolumes, dockerEnv, dockerDis
) {
  if (type === 'generic') {
    config.command = cmdInput.value.trim();
    config.args = Array.from(genericArgs.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);
    
    const env = {};
    genericEnv.querySelectorAll('.row').forEach(r => {
      const k = r.querySelector('.env-key').value.trim();
      const v = r.querySelector('.env-val').value.trim();
      if (k) env[k] = v;
    });
    
    if (Object.keys(env).length) config.env = env;
    if (genericDis.checked) config.disabled = true;
  }
  
  if (type === 'npx') {
    config.command = 'npx';
    
    const repo = npxRepo.value.trim();
    if (!repo) {
      alert('Repository is required');
      return null;
    }
    
    const flags = Array.from(npxFlags)
      .filter(c => c.checked)
      .map(c => c.dataset.flag);
    
    const extra = Array.from(npxArgs.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);
    
    config.args = ['-y', repo, ...extra];
    
    const env = {};
    npxEnv.querySelectorAll('.row').forEach(r => {
      const k = r.querySelector('.env-key').value.trim();
      const v = r.querySelector('.env-val').value.trim();
      if (k) env[k] = v;
    });
    
    if (Object.keys(env).length) config.env = env;
    if (npxDis.checked) config.disabled = true;
  }
  
  if (type === 'docker') {
    config.command = 'docker';
    
    const flags = Array.from(dockerFlags)
      .filter(c => c.checked)
      .map(c => c.dataset.flag);
    
    const image = dockerImage.value.trim();
    if (!image) {
      alert('Image name is required');
      return null;
    }
    
    const ports = Array.from(dockerPorts.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);
    
    const vols = Array.from(dockerVolumes.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);
    
    const env = {};
    dockerEnv.querySelectorAll('.row').forEach(r => {
      const k = r.querySelector('.env-key').value.trim();
      const v = r.querySelector('.env-val').value.trim();
      if (k) env[k] = v;
    });
    
    let args = ['run', ...flags];
    ports.forEach(p => args.push('-p', p));
    vols.forEach(v => {
      const [s, d] = v.split(':');
      args.push('--mount', `type=bind,src=${s},dst=${d}`);
    });
    args.push(image);
    
    config.args = args;
    if (Object.keys(env).length) config.env = env;
    if (dockerDis.checked) config.disabled = true;
  }
  
  return config;
}
