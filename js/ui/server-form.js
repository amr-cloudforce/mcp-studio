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
    
    // View toggle
    this.viewToggleContainer = document.getElementById('view-toggle-container');
    this.viewModeRadios = document.querySelectorAll('input[name="view-mode"]');
    
    // Quick view elements
    this.quickSection = document.getElementById('section-quick');
    this.quickTemplateName = document.getElementById('quick-template-name');
    this.quickTemplateDesc = document.getElementById('quick-template-desc');
    this.quickInputs = document.getElementById('quick-inputs');
    this.quickShowAdvanced = document.getElementById('quick-show-advanced');
    this.quickAdvancedOptions = document.getElementById('quick-advanced-options');
    
    // Type selector
    this.typeSelector = document.querySelector('.type-selector');
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
    
    // Set up view mode toggle
    this.viewModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'quick') {
          // Show quick view, hide advanced view
          this.quickSection.classList.add('active');
          document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
          this.typeSelector.style.display = 'none';
        } else {
          // Show advanced view, hide quick view
          this.quickSection.classList.remove('active');
          const selectedType = document.querySelector('input[name="type"]:checked').value;
          document.getElementById(`section-${selectedType}`).classList.add('active');
          this.typeSelector.style.display = 'block';
        }
      });
    });
    
    // Set up quick view advanced options toggle
    this.quickShowAdvanced.addEventListener('change', () => {
      this.quickAdvancedOptions.style.display = this.quickShowAdvanced.checked ? 'block' : 'none';
    });
    
    // Set up type selector
    this.typeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
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
     this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.quickInputs, 
     this.quickAdvancedOptions].forEach(c => c.innerHTML = '');
    
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
    
    // Check if this is a Quick Add server
    if (config.metadata && config.metadata.quickAddTemplate) {
      // This is a Quick Add server, show the quick view
      this.setupQuickView(config);
      return;
    }
    
    // Hide view toggle for non-Quick Add servers
    this.viewToggleContainer.style.display = 'none';
    this.typeSelector.style.display = 'block';
    
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
    
    const name = this.nameInput.value.trim();
    
    if (!name) {
      alert('Name is required');
      return;
    }
    
    let config = { command: '', args: [] };
    
    // Check if quick view is active
    const isQuickViewActive = document.querySelector('input[name="view-mode"][value="quick"]')?.checked;
    
    if (isQuickViewActive) {
      // Handle quick view form submission
      const templateId = this.quickTemplateName.dataset.templateId;
      
      // Get the original config to preserve metadata
      const originalConfig = this.currentServer ? configManager.getServer(this.currentServer)?.config : null;
      if (originalConfig && originalConfig.metadata) {
        config.metadata = originalConfig.metadata;
      }
      
      // Handle based on template type
      switch (templateId) {
        case 'tavily-mcp':
          this.handleTavilySubmit(config);
          break;
        case 'filesystem-server':
          this.handleFilesystemSubmit(config);
          break;
        case 'apify-web-adapter':
          this.handleApifySubmit(config);
          break;
        default:
          // For unknown templates, use the advanced view
          const type = document.querySelector('input[name="type"]:checked').value;
          this.handleAdvancedSubmit(config, type);
          break;
      }
    } else {
      // Handle advanced view form submission
      const type = document.querySelector('input[name="type"]:checked').value;
      this.handleAdvancedSubmit(config, type);
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
   * Handle advanced view form submission
   * @param {object} config - Server configuration
   * @param {string} type - Server type
   */
  handleAdvancedSubmit(config, type) {
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
    
    return config;
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
  
  /**
   * Set up the quick view for a Quick Add server
   * @param {object} config - Server configuration
   */
  setupQuickView(config) {
    // Show view toggle
    this.viewToggleContainer.style.display = 'block';
    
    // Set quick view as active
    document.querySelector('input[name="view-mode"][value="quick"]').checked = true;
    this.quickSection.classList.add('active');
    document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
    this.typeSelector.style.display = 'none';
    
    // Set template info
    this.quickTemplateName.textContent = config.metadata.templateName || 'Template';
    this.quickTemplateName.dataset.templateId = config.metadata.quickAddTemplate;
    this.quickTemplateDesc.textContent = this.getTemplateDescription(config.metadata.quickAddTemplate);
    
    // Also set up the advanced view
    this.setupAdvancedView(config);
    
    // Generate quick view form based on template type
    this.generateQuickViewForm(config);
  }
  
  /**
   * Set up the advanced view for a Quick Add server
   * @param {object} config - Server configuration
   */
  setupAdvancedView(config) {
    // Detect type
    const type = config.command === 'npx' ? 'npx'
               : config.command === 'docker' ? 'docker'
               : 'generic';
    
    // Set type radio
    document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    
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
   * Generate the quick view form based on template type
   * @param {object} config - Server configuration
   */
  generateQuickViewForm(config) {
    const templateId = config.metadata.quickAddTemplate;
    
    // Clear quick view containers
    this.quickInputs.innerHTML = '';
    this.quickAdvancedOptions.innerHTML = '';
    
    // Generate form based on template type
    switch (templateId) {
      case 'tavily-mcp':
        this.generateTavilyForm(config);
        break;
      case 'filesystem-server':
        this.generateFilesystemForm(config);
        break;
      case 'apify-web-adapter':
        this.generateApifyForm(config);
        break;
      default:
        // For unknown templates, just show a message
        this.quickInputs.innerHTML = `
          <div class="form-group">
            <p>This server was created with a Quick Add template that is no longer available.</p>
            <p>You can still edit it using the Advanced View.</p>
          </div>
        `;
        
        // Switch to advanced view
        document.querySelector('input[name="view-mode"][value="advanced"]').checked = true;
        this.quickSection.classList.remove('active');
        const selectedType = document.querySelector('input[name="type"]:checked').value;
        document.getElementById(`section-${selectedType}`).classList.add('active');
        this.typeSelector.style.display = 'block';
    }
  }
  
  /**
   * Generate form for Tavily template
   * @param {object} config - Server configuration
   */
  generateTavilyForm(config) {
    // Extract API key from env
    const apiKey = config.env && config.env.TAVILY_API_KEY ? config.env.TAVILY_API_KEY : '';
    
    // Create form
    const formHtml = `
      <div class="form-group">
        <label for="tavily-api-key">Tavily API Key</label>
        <input type="password" id="tavily-api-key" value="${apiKey}">
        <small>Your Tavily API key</small>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
      </div>
    `;
    
    this.quickInputs.innerHTML = formHtml;
  }
  
  /**
   * Generate form for Filesystem template
   * @param {object} config - Server configuration
   */
  generateFilesystemForm(config) {
    // Extract directories from args (skip the first two args which are -y and the package name)
    const directories = config.args.slice(2) || [];
    
    // Create form
    let formHtml = `
      <div class="form-group">
        <label>Directories</label>
        <div id="quick-directory-container" class="directory-list-container">
          <!-- Directory rows will be added here -->
        </div>
        <button type="button" id="quick-add-directory-btn" class="btn btn-add">+ Add Directory</button>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
      </div>
    `;
    
    this.quickInputs.innerHTML = formHtml;
    
    // Add directory rows
    const container = document.getElementById('quick-directory-container');
    directories.forEach(dir => {
      const row = document.createElement('div');
      row.className = 'directory-row';
      row.innerHTML = `
        <div class="row">
          <input type="text" class="directory-input" value="${dir}" readonly>
          <button type="button" class="btn btn-reveal browse-btn">Browse</button>
          <button type="button" class="btn btn-del remove-btn">&times;</button>
        </div>
      `;
      container.appendChild(row);
      
      // Set up event listeners
      const browseBtn = row.querySelector('.browse-btn');
      const removeBtn = row.querySelector('.remove-btn');
      const input = row.querySelector('.directory-input');
      
      browseBtn.addEventListener('click', async () => {
        const directory = await window.api.selectDirectory();
        if (directory) {
          input.value = directory;
        }
      });
      
      removeBtn.addEventListener('click', () => {
        row.remove();
      });
    });
    
    // If no directories, add an empty row
    if (directories.length === 0) {
      this.addQuickDirectoryRow();
    }
    
    // Set up add directory button
    document.getElementById('quick-add-directory-btn').addEventListener('click', () => {
      this.addQuickDirectoryRow();
    });
  }
  
  /**
   * Add a directory row to the quick view
   */
  addQuickDirectoryRow() {
    const container = document.getElementById('quick-directory-container');
    const row = document.createElement('div');
    row.className = 'directory-row';
    row.innerHTML = `
      <div class="row">
        <input type="text" class="directory-input" placeholder="Select a directory" readonly>
        <button type="button" class="btn btn-reveal browse-btn">Browse</button>
        <button type="button" class="btn btn-del remove-btn">&times;</button>
      </div>
    `;
    container.appendChild(row);
    
    // Set up event listeners
    const browseBtn = row.querySelector('.browse-btn');
    const removeBtn = row.querySelector('.remove-btn');
    const input = row.querySelector('.directory-input');
    
    browseBtn.addEventListener('click', async () => {
      const directory = await window.api.selectDirectory();
      if (directory) {
        input.value = directory;
      }
    });
    
    removeBtn.addEventListener('click', () => {
      row.remove();
    });
  }
  
  /**
   * Generate form for Apify template
   * @param {object} config - Server configuration
   */
  generateApifyForm(config) {
    // Extract API key from env
    const apiKey = config.env && config.env.APIFY_TOKEN ? config.env.APIFY_TOKEN : '';
    
    // Extract actor ID from args
    const actorId = config.args && config.args.length > 3 ? config.args[3] : 'filip_cicvarek/meetup-scraper';
    
    // Create form
    const formHtml = `
      <div class="form-group">
        <label for="apify-api-key">Apify API Token</label>
        <input type="password" id="apify-api-key" value="${apiKey}">
        <small>Your Apify API token from apify.com</small>
      </div>
      <div class="form-group">
        <label for="apify-actor-id">Actor ID</label>
        <input type="text" id="apify-actor-id" value="${actorId}">
        <small>Apify actor to use (default: filip_cicvarek/meetup-scraper)</small>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
      </div>
    `;
    
    this.quickInputs.innerHTML = formHtml;
  }
  
  /**
   * Handle Tavily form submission
   * @param {object} config - Server configuration
   */
  handleTavilySubmit(config) {
    // Set command and args
    config.command = 'npx';
    config.args = ['-y', '@modelcontextprotocol/server-tavily'];
    
    // Get API key
    const apiKey = document.getElementById('tavily-api-key').value.trim();
    
    // Set environment variables
    config.env = {
      TAVILY_API_KEY: apiKey
    };
    
    // Set disabled flag
    const disabled = document.getElementById('quick-disabled').checked;
    if (disabled) config.disabled = true;
    
    // Store template ID in metadata
    if (!config.metadata) {
      config.metadata = {
        quickAddTemplate: 'tavily-mcp',
        templateName: 'Tavily Search'
      };
    }
    
    return config;
  }
  
  /**
   * Handle Filesystem form submission
   * @param {object} config - Server configuration
   */
  handleFilesystemSubmit(config) {
    // Set command and args
    config.command = 'npx';
    
    // Get directories
    const directoryInputs = document.querySelectorAll('#quick-directory-container .directory-input');
    const directories = Array.from(directoryInputs)
      .map(input => input.value.trim())
      .filter(dir => dir !== '');
    
    // Check if at least one directory is selected
    if (directories.length === 0) {
      alert('Please select at least one directory');
      return;
    }
    
    // Set args
    config.args = ['-y', '@modelcontextprotocol/server-filesystem', ...directories];
    
    // Set disabled flag
    const disabled = document.getElementById('quick-disabled').checked;
    if (disabled) config.disabled = true;
    
    // Store template ID in metadata
    if (!config.metadata) {
      config.metadata = {
        quickAddTemplate: 'filesystem-server',
        templateName: 'Filesystem Server'
      };
    }
    
    return config;
  }
  
  /**
   * Handle Apify form submission
   * @param {object} config - Server configuration
   */
  handleApifySubmit(config) {
    // Set command and args
    config.command = 'npx';
    
    // Get API key and actor ID
    const apiKey = document.getElementById('apify-api-key').value.trim();
    const actorId = document.getElementById('apify-actor-id').value.trim() || 'filip_cicvarek/meetup-scraper';
    
    // Set args
    config.args = ['-y', '@modelcontextprotocol/server-apify-web-adapter', '--', actorId];
    
    // Set environment variables
    config.env = {
      APIFY_TOKEN: apiKey
    };
    
    // Set disabled flag
    const disabled = document.getElementById('quick-disabled').checked;
    if (disabled) config.disabled = true;
    
    // Store template ID in metadata
    if (!config.metadata) {
      config.metadata = {
        quickAddTemplate: 'apify-web-adapter',
        templateName: 'Apify Web Adapter'
      };
    }
    
    return config;
  }
  
  /**
   * Get template description based on template ID
   * @param {string} templateId - Template ID
   * @returns {string} - Template description
   */
  getTemplateDescription(templateId) {
    const descriptions = {
      'tavily-mcp': 'AI-powered search engine',
      'filesystem-server': 'Access files from specified directories',
      'apify-web-adapter': 'Scrape websites using Apify\'s actors'
    };
    
    return descriptions[templateId] || 'Quick Add template';
  }
}

// Create and export a singleton instance
const serverForm = new ServerForm();
export default serverForm;
