/**
 * Server Form - Utilities Module
 * Provides shared utility functions for the server form.
 */

import * as FormFields from './form-fields.js';

export function getTemplateDescription(templateId) {
  const descriptions = {
    'tavily-mcp': 'AI-powered search engine',
    'filesystem-server': 'Access files from specified directories',
    'apify-web-adapter': 'Scrape websites using Apify\'s actors'
  };
  
  return descriptions[templateId] || 'Quick Add template';
}

export function handleAdvancedSubmit(config, type, cmdInput, genericArgs, genericEnv, genericDis, npxRepo, npxArgs, npxEnv, npxDis, dockerFlags, dockerImage, dockerPorts, dockerVolumes, dockerEnv, dockerDis) {
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
      return;
    }
    
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
      return;
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

// Aliases for form-fields.js functions to maintain compatibility with index.js
export function addGenericArg(container, value) {
  return FormFields.addGenericArg(container, value);
}

export function addGenericEnv(container, key, value) {
  return FormFields.addGenericEnv(container, key, value);
}

export function addNpxArg(container, value) {
  return FormFields.addNpxArg(container, value);
}

export function addNpxEnv(container, key, value) {
  return FormFields.addNpxEnv(container, key, value);
}

export function addDockerPort(container, value) {
  return FormFields.addDockerPort(container, value);
}

export function addDockerVolume(container, value) {
  return FormFields.addDockerVolume(container, value);
}

export function addDockerEnv(container, key, value) {
  return FormFields.addDockerEnv(container, key, value);
}
