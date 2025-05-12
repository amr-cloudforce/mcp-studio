/**
 * Server Form
 * Handles the server form functionality
 */

import configManager from '../config/config-manager.js';
import modalManager from './modal-manager.js';
import notifications from './notifications.js';

class ServerForm {
  constructor() {
    // Form elements
    this.form = document.getElementById('server-form');
    this.modal = document.getElementById('server-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.nameInput = document.getElementById('server-name');
    
    // Type selector
    this.typeRadios = document.querySelectorAll('input[name="type"]');
    
    // Generic fields
    this.cmdInput = document.getElementById('server-cmd');
    this.genericArgs = document.getElementById('args-container');
    this.genericEnv = document.getElementById('env-container');
    this.addArgBtnG = document.getElementById('add-arg-btn');
    this.addEnvBtnG = document.getElementById('add-env-btn');
    this.genericDis = document.getElementById('server-disabled');
    
    // NPX fields
    this.npxRepo = document.getElementById('npx-repo');
    this.npxFlags = document.querySelectorAll('#section-npx input[data-flag]');
    this.npxArgs = document.getElementById('npx-args-container');
    this.npxEnv = document.getElementById('npx-env-container');
    this.addArgBtnN = document.getElementById('add-npx-arg-btn');
    this.addEnvBtnN = document.getElementById('add-npx-env-btn');
    this.npxDis = document.getElementById('npx-disabled');
    
    // Docker fields
    this.dockerImage = document.getElementById('docker-image');
    this.dockerFlags = document.querySelectorAll('#section-docker input[data-flag]');
    this.dockerPorts = document.getElementById('docker-ports');
    this.dockerVolumes = document.getElementById('docker-volumes');
    this.dockerEnv = document.getElementById('docker-env-container');
    this.addPortBtn = document.getElementById('add-docker-port-btn');
    this.addVolBtn = document.getElementById('add-docker-volume-btn');
    this.addEnvBtnD = document.getElementById('add-docker-env-btn');
    this.dockerDis = document.getElementById('docker-disabled');
    
    // Cancel button
    this.cancelBtn = document.getElementById('cancel-btn');
    
    // Current server being edited
    this.currentServer = null;
  }

  /**
   * Initialize the server form
   */
  initialize() {
    // Set up form submission handler
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Set up cancel button
    this.cancelBtn.addEventListener('click', () => modalManager.closeActiveModal());
    
    // Set up type selector
    this.typeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`section-${radio.value}`).classList.add('active');
      });
    });
    
    // Set up dynamic row buttons
    this.addArgBtnG.addEventListener('click', () => this.addGenericArg(''));
    this.addEnvBtnG.addEventListener('click', () => this.addGenericEnv('', ''));
    this.addArgBtnN.addEventListener('click', () => this.addNpxArg(''));
    this.addEnvBtnN.addEventListener('click', () => this.addNpxEnv('', ''));
    this.addPortBtn.addEventListener('click', () => this.addDockerPort(''));
    this.addVolBtn.addEventListener('click', () => this.addDockerVolume(''));
    this.addEnvBtnD.addEventListener('click', () => this.addDockerEnv('', ''));
    
    return this;
  }

  /**
   * Open the server form modal
   * @param {string} name - Server name (optional, for editing)
   */
  openModal(name = null) {
    if (name) {
      const server = configManager.getServer(name);
      if (server) {
        this.fillForm(name, server.config, true);
      } else {
        console.error(`Server "${name}" not found`);
        return;
      }
    } else {
      this.fillForm('', { command: '', args: [], env: {} }, false);
    }
    
    modalManager.showModal(this.modal);
  }

  /**
   * Fill the form with server data
   * @param {string} name - Server name
   * @param {object} config - Server configuration
   * @param {boolean} isExisting - Whether this is an existing server
   */
  fillForm(name, config, isExisting) {
    this.currentServer = isExisting ? name : null;
    this.modalTitle.textContent = isExisting ? 'Edit Server' : 'Add Server';
    
    // Reset form
    this.form.reset();
    
    // Clear dynamic containers
    [this.genericArgs, this.genericEnv, this.npxArgs, this.npxEnv, 
     this.dockerPorts, this.dockerVolumes, this.dockerEnv].forEach(c => c.innerHTML = '');
    
    // Add one blank row each
    this.addGenericArg('');
    this.addGenericEnv('', '');
    this.addNpxArg('');
    this.addNpxEnv('', '');
    this.addDockerPort('');
    this.addDockerVolume('');
    this.addDockerEnv('', '');
    
    // Set name
    this.nameInput.value = name || '';
    
    // Detect type
    const type = config.command === 'npx' ? 'npx'
               : config.command === 'docker' ? 'docker'
               : 'generic';
    
    // Set type radio
    document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    const selectedRadio = document.querySelector(`input[name="type"][value="${type}"]`);
    selectedRadio.checked = true;
    selectedRadio.dispatchEvent(new Event('change'));
    
    // Fill type-specific fields
    if (type === 'generic') {
      this.cmdInput.value = config.command;
      this.genericDis.checked = !!config.disabled;
      
      this.genericArgs.innerHTML = '';
      (config.args || []).forEach(a => this.addGenericArg(a));
      if (!(config.args || []).length) this.addGenericArg('');
      
      this.genericEnv.innerHTML = '';
      Object.entries(config.env || {}).forEach(([k, v]) => this.addGenericEnv(k, v));
      if (!config.env) this.addGenericEnv('', '');
    }
    
    if (type === 'npx') {
      this.npxDis.checked = !!config.disabled;
      
      const flags = (config.args || []).filter(a => a.startsWith('-'));
      const rest = (config.args || []).filter(a => !a.startsWith('-'));
      
      this.npxFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
      this.npxRepo.value = rest[0] || '';
      
      this.npxArgs.innerHTML = '';
      rest.slice(1).forEach(a => this.addNpxArg(a));
      if (rest.length <= 1) this.addNpxArg('');
      
      this.npxEnv.innerHTML = '';
      Object.entries(config.env || {}).forEach(([k, v]) => this.addNpxEnv(k, v));
      if (!config.env) this.addNpxEnv('', '');
    }
    
    if (type === 'docker') {
      this.dockerDis.checked = !!config.disabled;
      
      const flags = (config.args || []).filter(a => a.startsWith('-'));
      const rest = (config.args || []).filter(a => !a.startsWith('-'));
      
      this.dockerFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
      this.dockerImage.value = rest[0] || '';
      
      this.dockerEnv.innerHTML = '';
      Object.entries(config.env || {}).forEach(([k, v]) => this.addDockerEnv(k, v));
      if (!config.env) this.addDockerEnv('', '');
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="type"]:checked').value;
    const name = this.nameInput.value.trim();
    
    if (!name) {
      alert('Name is required');
      return;
    }
    
    let config = { command: '', args: [] };
    
    if (type === 'generic') {
      config.command = this.cmdInput.value.trim();
      config.args = Array.from(this.genericArgs.querySelectorAll('input'))
        .map(i => i.value.trim())
        .filter(Boolean);
      
      const env = {};
      this.genericEnv.querySelectorAll('.row').forEach(r => {
        const k = r.querySelector('.env-key').value.trim();
        const v = r.querySelector('.env-val').value.trim();
        if (k) env[k] = v;
      });
      
      if (Object.keys(env).length) config.env = env;
      if (this.genericDis.checked) config.disabled = true;
    }
    
    if (type === 'npx') {
      config.command = 'npx';
      
      // Repository (required)
      const repo = this.npxRepo.value.trim();
      if (!repo) {
        alert('Repository is required');
        return;
      }
      
      // Extra arguments
      const extra = Array.from(this.npxArgs.querySelectorAll('input'))
        .map(i => i.value.trim())
        .filter(Boolean);
      
      // Always include -y
      config.args = ['-y', repo, ...extra];
      
      // Environment variables
      const env = {};
      this.npxEnv.querySelectorAll('.row').forEach(r => {
        const k = r.querySelector('.env-key').value.trim();
        const v = r.querySelector('.env-val').value.trim();
        if (k) env[k] = v;
      });
      
      if (Object.keys(env).length) config.env = env;
      if (this.npxDis.checked) config.disabled = true;
    }
    
    if (type === 'docker') {
      config.command = 'docker';
      
      const flags = Array.from(this.dockerFlags)
        .filter(c => c.checked)
        .map(c => c.dataset.flag);
      
      const image = this.dockerImage.value.trim();
      if (!image) {
        alert('Image name is required');
        return;
      }
      
      const ports = Array.from(this.dockerPorts.querySelectorAll('input'))
        .map(i => i.value.trim())
        .filter(Boolean);
      
      const vols = Array.from(this.dockerVolumes.querySelectorAll('input'))
        .map(i => i.value.trim())
        .filter(Boolean);
      
      const env = {};
      this.dockerEnv.querySelectorAll('.row').forEach(r => {
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
      if (this.dockerDis.checked) config.disabled = true;
    }
    
    // Update configuration
    configManager.updateServer(name, this.currentServer, config, config.disabled);
    await configManager.saveConfig();
    
    // Show restart warning
    notifications.showRestartWarning();
    
    // Close modal
    modalManager.closeActiveModal();
  }

  /**
   * Add a generic argument row
   * @param {string} value - Argument value
   */
  addGenericArg(value) {
    this.makeRow(this.genericArgs, `
      <input type="text" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Add a generic environment variable row
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  addGenericEnv(key, value) {
    this.makeRow(this.genericEnv, `
      <input class="env-key" type="text" placeholder="KEY" value="${key}">
      <input class="env-val" type="text" placeholder="VALUE" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Add an NPX argument row
   * @param {string} value - Argument value
   */
  addNpxArg(value) {
    this.makeRow(this.npxArgs, `
      <input type="text" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Add an NPX environment variable row
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  addNpxEnv(key, value) {
    this.makeRow(this.npxEnv, `
      <input class="env-key" type="text" placeholder="KEY" value="${key}">
      <input class="env-val" type="text" placeholder="VALUE" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Add a Docker port row
   * @param {string} value - Port mapping
   */
  addDockerPort(value) {
    this.makeRow(this.dockerPorts, `
      <input type="text" placeholder="host:container" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Add a Docker volume row
   * @param {string} value - Volume mapping
   */
  addDockerVolume(value) {
    this.makeRow(this.dockerVolumes, `
      <input type="text" placeholder="src:dst" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Add a Docker environment variable row
   * @param {string} key - Environment variable key
   * @param {string} value - Environment variable value
   */
  addDockerEnv(key, value) {
    this.makeRow(this.dockerEnv, `
      <input class="env-key" type="text" placeholder="KEY" value="${key}">
      <input class="env-val" type="text" placeholder="VALUE" value="${value}">
      <button class="btn btn-del">&times;</button>
    `);
  }

  /**
   * Create a dynamic row
   * @param {HTMLElement} container - Container element
   * @param {string} html - Row HTML
   */
  makeRow(container, html) {
    const div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = html;
    div.querySelector('button').onclick = () => div.remove();
    container.appendChild(div);
    return div;
  }
}

// Create and export a singleton instance
const serverForm = new ServerForm();
export default serverForm;
