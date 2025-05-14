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
  
  // Get all arguments except -y (which is always included)
  const allArgs = (config.args || []).filter(a => a !== '-y');
  
  // Find the repository (first non-flag argument)
  const repoIndex = allArgs.findIndex(a => !a.startsWith('-'));
  const repo = repoIndex >= 0 ? allArgs[repoIndex] : '';
  
  // Set repository value
  npxRepo.value = repo;
  
  // Handle standard flags (single dash flags like -y)
  const standardFlags = allArgs.filter(a => a.startsWith('-') && !a.startsWith('--'));
  npxFlags.forEach(c => c.checked = standardFlags.includes(c.dataset.flag));
  
  // Process remaining arguments, preserving flag-style arguments and their values
  npxArgs.innerHTML = '';
  
  if (allArgs.length > 0) {
    // Skip the repository in the arguments list
    const remainingArgs = [...allArgs];
    if (repoIndex >= 0) {
      remainingArgs.splice(repoIndex, 1);
    }
    
    // Process remaining arguments, preserving flag-style arguments and their values
    let i = 0;
    while (i < remainingArgs.length) {
      const arg = remainingArgs[i];
      
      // Skip standard flags that are handled by checkboxes
      if (standardFlags.includes(arg)) {
        i++;
        continue;
      }
      
      // Handle flag-style arguments (--flag value)
      if (arg.startsWith('--') && i + 1 < remainingArgs.length && !remainingArgs[i + 1].startsWith('-')) {
        utils.addNpxArg(npxArgs, `${arg} ${remainingArgs[i + 1]}`);
        i += 2; // Skip both the flag and its value
      } else {
        utils.addNpxArg(npxArgs, arg);
        i++;
      }
    }
  }
  
  // Add an empty row if no arguments were added
  if (npxArgs.children.length === 0) {
    utils.addNpxArg(npxArgs, '');
  }
  
  // Set up environment variables
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
    
    // Extract arguments and process them
    const rawArgs = utils.extractArgs(npxArgs);
    const processedArgs = [];
    
    // Process each argument, splitting flag-style arguments and their values
    rawArgs.forEach(arg => {
      // Check if this is a flag-style argument with its value (e.g., "--access-token value")
      const flagMatch = arg.match(/^(--\S+)\s+(.+)$/);
      if (flagMatch) {
        // Split into flag and value
        processedArgs.push(flagMatch[1], flagMatch[2]);
      } else {
        processedArgs.push(arg);
      }
    });
    
    // Always include -y
    config.args = ['-y', repo, ...processedArgs];
    
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
