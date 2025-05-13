/**
 * Form Fields
 * Handles dynamic form field generation
 */

import * as utils from './utils.js';

/**
 * Initialize type selector
 * @param {NodeList} typeRadios - Type radio buttons
 */
export function initTypeSelector(typeRadios) {
  typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`section-${radio.value}`).classList.add('active');
    });
  });
}

/**
 * Set up form for a generic server
 * @param {object} config - Server configuration
 * @param {HTMLElement} cmdInput - Command input element
 * @param {HTMLElement} genericArgs - Generic args container
 * @param {HTMLElement} genericEnv - Generic env container
 * @param {HTMLElement} genericDis - Generic disabled checkbox
 */
export function setupGenericForm(config, cmdInput, genericArgs, genericEnv, genericDis) {
  cmdInput.value = config.command;
  genericDis.checked = !!config.disabled;
  
  genericArgs.innerHTML = '';
  (config.args || []).forEach(a => utils.addGenericArg(genericArgs, a));
  if (!(config.args || []).length) utils.addGenericArg(genericArgs, '');
  
  genericEnv.innerHTML = '';
  Object.entries(config.env || {}).forEach(([k, v]) => utils.addGenericEnv(genericEnv, k, v));
  if (!config.env) utils.addGenericEnv(genericEnv, '', '');
}

/**
 * Set up form for an NPX server
 * @param {object} config - Server configuration
 * @param {HTMLElement} npxRepo - NPX repo input element
 * @param {NodeList} npxFlags - NPX flags checkboxes
 * @param {HTMLElement} npxArgs - NPX args container
 * @param {HTMLElement} npxEnv - NPX env container
 * @param {HTMLElement} npxDis - NPX disabled checkbox
 */
export function setupNpxForm(config, npxRepo, npxFlags, npxArgs, npxEnv, npxDis) {
  npxDis.checked = !!config.disabled;
  
  const flags = (config.args || []).filter(a => a.startsWith('-'));
  const rest = (config.args || []).filter(a => !a.startsWith('-'));
  
  npxFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
  npxRepo.value = rest[0] || '';
  
  npxArgs.innerHTML = '';
  rest.slice(1).forEach(a => utils.addNpxArg(npxArgs, a));
  if (rest.length <= 1) utils.addNpxArg(npxArgs, '');
  
  npxEnv.innerHTML = '';
  Object.entries(config.env || {}).forEach(([k, v]) => utils.addNpxEnv(npxEnv, k, v));
  if (!config.env) utils.addNpxEnv(npxEnv, '', '');
}

/**
 * Set up form for a Docker server
 * @param {object} config - Server configuration
 * @param {HTMLElement} dockerImage - Docker image input element
 * @param {NodeList} dockerFlags - Docker flags checkboxes
 * @param {HTMLElement} dockerPorts - Docker ports container
 * @param {HTMLElement} dockerVolumes - Docker volumes container
 * @param {HTMLElement} dockerEnv - Docker env container
 * @param {HTMLElement} dockerDis - Docker disabled checkbox
 */
export function setupDockerForm(config, dockerImage, dockerFlags, dockerPorts, dockerVolumes, dockerEnv, dockerDis) {
  dockerDis.checked = !!config.disabled;
  
  const flags = (config.args || []).filter(a => a.startsWith('-'));
  const rest = (config.args || []).filter(a => !a.startsWith('-'));
  
  dockerFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
  dockerImage.value = rest[0] || '';
  
  dockerEnv.innerHTML = '';
  Object.entries(config.env || {}).forEach(([k, v]) => utils.addDockerEnv(dockerEnv, k, v));
  if (!config.env) utils.addDockerEnv(dockerEnv, '', '');
}

/**
 * Handle advanced form submission
 * @param {string} type - Server type
 * @param {object} config - Server configuration
 * @param {HTMLElement} cmdInput - Command input element
 * @param {HTMLElement} genericArgs - Generic args container
 * @param {HTMLElement} genericEnv - Generic env container
 * @param {HTMLElement} genericDis - Generic disabled checkbox
 * @param {HTMLElement} npxRepo - NPX repo input element
 * @param {NodeList} npxFlags - NPX flags checkboxes
 * @param {HTMLElement} npxArgs - NPX args container
 * @param {HTMLElement} npxEnv - NPX env container
 * @param {HTMLElement} npxDis - NPX disabled checkbox
 * @param {HTMLElement} dockerImage - Docker image input element
 * @param {NodeList} dockerFlags - Docker flags checkboxes
 * @param {HTMLElement} dockerPorts - Docker ports container
 * @param {HTMLElement} dockerVolumes - Docker volumes container
 * @param {HTMLElement} dockerEnv - Docker env container
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
    config.args = utils.extractArgs(genericArgs);
    
    const env = utils.extractEnvVars(genericEnv);
    if (Object.keys(env).length) config.env = env;
    
    if (genericDis.checked) config.disabled = true;
  }
  
  if (type === 'npx') {
    config.command = 'npx';
    
    // Repository (required)
    const repo = npxRepo.value.trim();
    if (!repo) {
      alert('Repository is required');
      return null;
    }
    
    // Extra arguments
    const extra = utils.extractArgs(npxArgs);
    
    // Always include -y
    config.args = ['-y', repo, ...extra];
    
    // Environment variables
    const env = utils.extractEnvVars(npxEnv);
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
    
    const ports = utils.extractArgs(dockerPorts);
    const vols = utils.extractArgs(dockerVolumes);
    
    const env = utils.extractEnvVars(dockerEnv);
    
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
