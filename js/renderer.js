// File: js/renderer.js
// With nodeIntegration: true and contextIsolation: false,
// we can directly require Node.js modules
const { ipcRenderer, shell } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const composioService = require('../composio-service.js');

window.addEventListener('DOMContentLoaded', () => {
    // Direct IPC calls instead of using window.api
    const readConfig = () => ipcRenderer.invoke('read-config');
    const writeConfig = (cfg) => ipcRenderer.invoke('write-config', cfg);
    const revealConfig = () => ipcRenderer.invoke('reveal-config');
    const openUrl = (url) => ipcRenderer.invoke('open-url', url);
    const checkPrerequisites = () => ipcRenderer.invoke('check-prerequisites');
  
    // —— ACE JSON editor setup —— 
    const editor = ace.edit("json-editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/json");
    editor.setShowPrintMargin(false);
  
    // —— Application state —— 
    let mcpConfig = { mcpServers: {}, inactive: {} };
    let currentServer = null;
    
    // —— Helper: Track active modal for Escape key handling ——
    let activeModal = null;
    
    // Function to close the active modal
    function closeActiveModal() {
      if (activeModal) {
        activeModal.classList.remove('open');
        activeModal = null;
        return true;
      }
      return false;
    }
    
    // Function to set active modal
    function setActiveModal(modal) {
      activeModal = modal;
      modal.classList.add('open');
    }
    
    // Global keyboard event listener for Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeActiveModal();
      }
    });
  
    // —— DOM references —— 
    const serverList      = document.getElementById('server-list');
    const versionTag      = document.getElementById('version-tag');
    const prereqWarning   = document.getElementById('prerequisites-warning');
    const prereqMessage   = document.getElementById('prereq-message');
    const missingDocker   = document.getElementById('missing-docker');
    const missingNodejs   = document.getElementById('missing-nodejs');
    const installDockerBtn= document.getElementById('install-docker-btn');
    const installNodejsBtn= document.getElementById('install-nodejs-btn');
    const restartWarning  = document.getElementById('restart-warning');
    const restartClaudeBtn= document.getElementById('restart-claude-btn');
    const addBtn          = document.getElementById('add-server-btn');
    const quickAddBtn     = document.getElementById('quick-add-btn');
    const exportBtn       = document.getElementById('export-json-btn');
    const revealBtn       = document.getElementById('reveal-btn');
    const pasteBtn        = document.getElementById('paste-btn');
    const aboutBtn        = document.getElementById('about-btn');
    const aboutModal      = document.getElementById('about-modal');
    const aboutClose      = document.getElementById('about-close');
    const aboutCloseBtn   = document.getElementById('about-close-btn');
    const aboutVersion    = document.getElementById('about-version');
    const dockerStatus    = document.getElementById('docker-status');
    const nodejsStatus    = document.getElementById('nodejs-status');
    const dockerStatusDot = document.getElementById('docker-status-dot');
    const nodejsStatusDot = document.getElementById('nodejs-status-dot');
    const dockerInstLink  = document.getElementById('docker-install-link');
    const nodejsInstLink  = document.getElementById('nodejs-install-link');
    
    // Quick Add modal elements
    const quickAddModal   = document.getElementById('quick-add-modal');
    const quickAddClose   = document.getElementById('quick-add-close');
    const templateList    = document.getElementById('template-list');
    const templateSelection = document.getElementById('template-selection');
    const templateConfig  = document.getElementById('template-config');
    const backToTemplates = document.getElementById('back-to-templates');
    const selectedTemplateName = document.getElementById('selected-template-name');
    const selectedTemplateDesc = document.getElementById('selected-template-desc');
    const quickAddForm    = document.getElementById('quick-add-form');
    const quickAddName    = document.getElementById('quick-add-name');
    const quickAddInputs  = document.getElementById('quick-add-inputs');
    const showAdvanced    = document.getElementById('show-advanced');
    const advancedOptions = document.getElementById('advanced-options');
    const quickAddCancel  = document.getElementById('quick-add-cancel');
    const quickAddSave    = document.getElementById('quick-add-save');
    const pasteModal      = document.getElementById('paste-modal');
    const pasteClose      = document.getElementById('paste-close');
    const pasteCancel     = document.getElementById('paste-cancel-btn');
    const pasteLoad       = document.getElementById('paste-load-btn');
    const pasteTextarea   = document.getElementById('paste-json');
    const serverModal     = document.getElementById('server-modal');
    const jsonModal       = document.getElementById('json-modal');
    const closeBtns       = document.querySelectorAll('.close');
    const cancelBtn       = document.getElementById('cancel-btn');
    const downloadJsonBtn = document.getElementById('download-json');
    const jsonCancelBtn   = document.getElementById('json-cancel');
    const form            = document.getElementById('server-form');
  
    // Always‑visible field
    const nameInput       = document.getElementById('server-name');
  
    // Generic fields
    const cmdInput        = document.getElementById('server-cmd');
    const genericArgs     = document.getElementById('args-container');
    const genericEnv      = document.getElementById('env-container');
    const addArgBtnG      = document.getElementById('add-arg-btn');
    const addEnvBtnG      = document.getElementById('add-env-btn');
    const genericDis      = document.getElementById('server-disabled');
  
    // NPX fields
    const npxRepo         = document.getElementById('npx-repo');
    const npxFlags        = document.querySelectorAll('#section-npx input[data-flag]');
    const npxArgs         = document.getElementById('npx-args-container');
    const npxEnv          = document.getElementById('npx-env-container');
    const addArgBtnN      = document.getElementById('add-npx-arg-btn');
    const addEnvBtnN      = document.getElementById('add-npx-env-btn');
    const npxDis          = document.getElementById('npx-disabled');
  
    // Docker fields
    const dockerImage     = document.getElementById('docker-image');
    const dockerFlags     = document.querySelectorAll('#section-docker input[data-flag]');
    const dockerPorts     = document.getElementById('docker-ports');
    const dockerVolumes   = document.getElementById('docker-volumes');
    const dockerEnv       = document.getElementById('docker-env-container');
    const addPortBtn      = document.getElementById('add-docker-port-btn');
    const addVolBtn       = document.getElementById('add-docker-volume-btn');
    const addEnvBtnD      = document.getElementById('add-docker-env-btn');
    const dockerDis       = document.getElementById('docker-disabled');
  
    // Type‑switch radios
    const typeRadios      = document.querySelectorAll('input[name="type"]');
  
    // —— Helper: dynamic row creation —— 
    function makeRow(container, html) {
      const div = document.createElement('div');
      div.className = 'row';
      div.innerHTML = html;
      div.querySelector('button').onclick = () => div.remove();
      container.appendChild(div);
    }
    const addGenericArg   = val => makeRow(genericArgs, `<input type="text" value="${val}"><button class="btn btn-del">&times;</button>`);
    const addGenericEnv   = (k,v)=>makeRow(genericEnv, `<input class="env-key" type="text" placeholder="KEY" value="${k}"><input class="env-val" type="text" placeholder="VALUE" value="${v}"><button class="btn btn-del">&times;</button>`);
    const addNpxArg       = val => makeRow(npxArgs, `<input type="text" value="${val}"><button class="btn btn-del">&times;</button>`);
    const addNpxEnv       = (k,v)=>makeRow(npxEnv, `<input class="env-key" type="text" placeholder="KEY" value="${k}"><input class="env-val" type="text" placeholder="VALUE" value="${v}"><button class="btn btn-del">&times;</button>`);
    const addDockerPort   = val => makeRow(dockerPorts, `<input type="text" placeholder="host:container" value="${val}"><button class="btn btn-del">&times;</button>`);
    const addDockerVolume = val => makeRow(dockerVolumes, `<input type="text" placeholder="src:dst" value="${val}"><button class="btn btn-del">&times;</button>`);
    const addDockerEnv    = (k,v)=>makeRow(dockerEnv, `<input class="env-key" type="text" placeholder="KEY" value="${k}"><input class="env-val" type="text" placeholder="VALUE" value="${v}"><button class="btn btn-del">&times;</button>`);
  
    // —— Toggle form sections —— 
    typeRadios.forEach(radio =>
      radio.addEventListener('change', () => {
        document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`section-${radio.value}`).classList.add('active');
      })
    );
  
    // —— Prefill & open modal —— 
    function fillModal(name, cfg, isExisting) {
      currentServer = isExisting ? name : null;
      document.getElementById('modal-title').textContent = isExisting ? 'Edit Server' : 'Add Server';
      form.reset();
      // Clear dynamic containers
      [genericArgs,genericEnv,npxArgs,npxEnv,dockerPorts,dockerVolumes,dockerEnv].forEach(c => c.innerHTML = '');
      // Add one blank row each
      addGenericArg(''); addGenericEnv('','');
      addNpxArg('');     addNpxEnv('','');
      addDockerPort(''); addDockerVolume(''); addDockerEnv('','');
  
      // Always‑visible name
      nameInput.value = name || '';
  
      // Detect type
      const t = cfg.command === 'npx'   ? 'npx'
              : cfg.command === 'docker'? 'docker'
              : 'generic';
      document.querySelector(`input[name="type"][value="${t}"]`).checked = true;
      const sel = document.querySelector(`input[name="type"][value="${t}"]`);
    sel.checked = true;
    sel.dispatchEvent(new Event('change'));
      
      // Populate per‑type fields
      if (t === 'generic') {
        cmdInput.value = cfg.command;
        genericDis.checked = !!cfg.disabled;
        genericArgs.innerHTML = '';
        (cfg.args||[]).forEach(a => addGenericArg(a));
        if (!(cfg.args||[]).length) addGenericArg('');
        genericEnv.innerHTML = '';
        Object.entries(cfg.env||{}).forEach(([k,v]) => addGenericEnv(k,v));
        if (!cfg.env) addGenericEnv('','');
      }
  
      if (t === 'npx') {
        npxDis.checked = !!cfg.disabled;
        const flags = (cfg.args||[]).filter(a => a.startsWith('-'));
        const rest  = (cfg.args||[]).filter(a => !a.startsWith('-'));
        npxFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
        npxRepo.value = rest[0]||'';
        npxArgs.innerHTML = '';
        rest.slice(1).forEach(a => addNpxArg(a));
        if (rest.length <= 1) addNpxArg('');
        npxEnv.innerHTML = '';
        Object.entries(cfg.env||{}).forEach(([k,v]) => addNpxEnv(k,v));
        if (!cfg.env) addNpxEnv('','');
      }
  
      if (t === 'docker') {
        dockerDis.checked = !!cfg.disabled;
        const flags = (cfg.args||[]).filter(a => a.startsWith('-'));
        const rest  = (cfg.args||[]).filter(a => !a.startsWith('-'));
        dockerFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
        dockerImage.value = rest[0]||'';
        dockerEnv.innerHTML = '';
        Object.entries(cfg.env||{}).forEach(([k,v]) => addDockerEnv(k,v));
        if (!cfg.env) addDockerEnv('','');
      }
  
      setActiveModal(serverModal);
    }
  
    function openServerModal(name) {
      if (name) {
        // Check if the server is in the active or inactive section
        if (mcpConfig.mcpServers && mcpConfig.mcpServers[name]) {
          fillModal(name, mcpConfig.mcpServers[name], true);
        } else if (mcpConfig.inactive && mcpConfig.inactive[name]) {
          // For inactive servers, set the disabled flag to true
          const cfg = { ...mcpConfig.inactive[name], disabled: true };
          fillModal(name, cfg, true);
        } else {
          console.error(`Server "${name}" not found in either active or inactive sections`);
          return;
        }
      } else {
        // Creating a new server
        fillModal('', { command:'', args:[], env:{} }, false);
      }
      setActiveModal(serverModal);
    }
  
    // —— "Paste Config" logic —— 
    pasteBtn.onclick    = () => setActiveModal(pasteModal);
    pasteCancel.onclick = closeActiveModal;
    pasteClose.onclick  = closeActiveModal;
    pasteLoad.onclick   = () => {
      let txt = pasteTextarea.value;
      let obj;
      try {
        obj = JSON.parse(txt);
      } catch(e) {
        return alert('Invalid JSON: ' + e.message);
      }
      if (!obj.mcpServers) return alert('Missing "mcpServers"');
      const entries = Object.entries(obj.mcpServers);
      if (entries.length !== 1) return alert('Paste exactly one server entry');
      const [name, cfg] = entries[0];
      closeActiveModal();
      fillModal(name, cfg, false);
    };
  
    // —— Save handler —— 
    async function saveServer(e) {
      e.preventDefault();
      const t = document.querySelector('input[name="type"]:checked').value;
      const name = nameInput.value.trim();
      if (!name) return alert('Name is required');
  
      let cfg = { command:'', args:[] };
  
      if (t === 'generic') {
        cfg.command = cmdInput.value.trim();
        cfg.args = Array.from(genericArgs.querySelectorAll('input'))
                        .map(i => i.value.trim()).filter(Boolean);
        const env = {};
        genericEnv.querySelectorAll('.row').forEach(r => {
          const k = r.querySelector('.env-key').value.trim();
          const v = r.querySelector('.env-val').value.trim();
          if (k) env[k] = v;
        });
        if (Object.keys(env).length) cfg.env = env;
        if (genericDis.checked) cfg.disabled = true;
      }
  
      if (t === 'npx') {
        cfg.command = 'npx';
      
        // Repository (required)
        const repo = npxRepo.value.trim();
        if (!repo) return alert('Repository is required');
      
        // Extra arguments
        const extra = Array
          .from(npxArgs.querySelectorAll('input'))
          .map(i => i.value.trim())
          .filter(Boolean);
      
        // Always include -y
        cfg.args = ['-y', repo, ...extra];
      
        // Environment variables
        const env = {};
        npxEnv.querySelectorAll('.row').forEach(r => {
          const k = r.querySelector('.env-key').value.trim();
          const v = r.querySelector('.env-val').value.trim();
          if (k) env[k] = v;
        });
        if (Object.keys(env).length) cfg.env = env;
      
        // Disabled flag
        if (npxDis.checked) cfg.disabled = true;
      }
  
      if (t === 'docker') {
        cfg.command = 'docker';
        const flags = Array.from(dockerFlags).filter(c => c.checked).map(c => c.dataset.flag);
        const image = dockerImage.value.trim();
        if (!image) return alert('Image name is required');
        const ports = Array.from(dockerPorts.querySelectorAll('input'))
                           .map(i => i.value.trim()).filter(Boolean);
        const vols  = Array.from(dockerVolumes.querySelectorAll('input'))
                           .map(i => i.value.trim()).filter(Boolean);
        const env   = {};
        dockerEnv.querySelectorAll('.row').forEach(r => {
          const k = r.querySelector('.env-key').value.trim();
          const v = r.querySelector('.env-val').value.trim();
          if (k) env[k] = v;
        });
        let args = ['run', ...flags];
        ports.forEach(p => args.push('-p', p));
        vols.forEach(v => {
          const [s,d] = v.split(':');
          args.push('--mount', `type=bind,src=${s},dst=${d}`);
        });
        args.push(image);
        cfg.args = args;
        if (Object.keys(env).length) cfg.env = env;
        if (dockerDis.checked) cfg.disabled = true;
      }
  
      // Determine if we're editing an inactive server
      const isEditingInactive = currentServer && mcpConfig.inactive && mcpConfig.inactive[currentServer];
      
      // Remove the server from its original location if it's being renamed
      if (currentServer && currentServer !== name) {
        if (isEditingInactive) {
          delete mcpConfig.inactive[currentServer];
        } else {
          delete mcpConfig.mcpServers[currentServer];
        }
      }
      
      // Determine where to save the server based on the disabled flag
      if (cfg.disabled) {
        // Save to inactive section
        if (!mcpConfig.inactive) {
          mcpConfig.inactive = {};
        }
        
        // Remove disabled flag as it's implied by being in the inactive section
        delete cfg.disabled;
        
        // Save to inactive section
        mcpConfig.inactive[name] = cfg;
        
        // Remove from active section if it exists there
        if (mcpConfig.mcpServers && mcpConfig.mcpServers[name]) {
          delete mcpConfig.mcpServers[name];
        }
      } else {
        // Save to active section
        mcpConfig.mcpServers[name] = cfg;
        
        // Remove from inactive section if it exists there
        if (mcpConfig.inactive && mcpConfig.inactive[name]) {
          delete mcpConfig.inactive[name];
        }
      }
      
      await writeConfig(JSON.stringify(mcpConfig, null, 2));
      refreshTable();
      closeActiveModal();
    }
  
    // —— Refresh table view —— 
    function refreshTable() {
      serverList.innerHTML = '';
      
      // Add active servers
      Object.entries(mcpConfig.mcpServers || {}).forEach(([n, c]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${n}</td>
          <td>${c.command}</td>
          <td>
            <span class="badge badge-enabled">Active</span>
          </td>
          <td>
            <button class="btn btn-export" data-edit="${n}">Edit</button>
            <button class="btn btn-del" data-del="${n}">Delete</button>
            <button class="btn btn-reveal" data-deactivate="${n}">Deactivate</button>
          </td>`;
        serverList.appendChild(tr);
      });
      
      // Add inactive servers
      Object.entries(mcpConfig.inactive || {}).forEach(([n, c]) => {
        const tr = document.createElement('tr');
        tr.className = 'inactive-row';
        tr.innerHTML = `
          <td>${n}</td>
          <td>${c.command}</td>
          <td>
            <span class="badge badge-disabled">Inactive</span>
          </td>
          <td>
            <button class="btn btn-export" data-edit-inactive="${n}">Edit</button>
            <button class="btn btn-del" data-del-inactive="${n}">Delete</button>
            <button class="btn btn-add" data-activate="${n}">Activate</button>
          </td>`;
        serverList.appendChild(tr);
      });
      
      // Wire up event handlers for active servers
      serverList.querySelectorAll('[data-edit]').forEach(b => 
        b.onclick = () => openServerModal(b.dataset.edit)
      );
      
      serverList.querySelectorAll('[data-del]').forEach(b =>
        b.onclick = async () => {
          if (!confirm(`Delete "${b.dataset.del}"?`)) return;
          delete mcpConfig.mcpServers[b.dataset.del];
          await writeConfig(JSON.stringify(mcpConfig, null, 2));
          refreshTable();
        }
      );
      
      serverList.querySelectorAll('[data-deactivate]').forEach(b =>
        b.onclick = async () => {
          const name = b.dataset.deactivate;
          const server = mcpConfig.mcpServers[name];
          
          // Ensure inactive object exists
          if (!mcpConfig.inactive) {
            mcpConfig.inactive = {};
          }
          
          // Move server to inactive
          mcpConfig.inactive[name] = server;
          delete mcpConfig.mcpServers[name];
          
          await writeConfig(JSON.stringify(mcpConfig, null, 2));
          refreshTable();
        }
      );
      
      // Wire up event handlers for inactive servers
      serverList.querySelectorAll('[data-edit-inactive]').forEach(b => 
        b.onclick = () => {
          const name = b.dataset.editInactive;
          fillModal(name, mcpConfig.inactive[name], true);
          currentServer = name;
          setActiveModal(serverModal);
        }
      );
      
      serverList.querySelectorAll('[data-del-inactive]').forEach(b =>
        b.onclick = async () => {
          const name = b.dataset.delInactive;
          if (!confirm(`Delete inactive server "${name}"?`)) return;
          delete mcpConfig.inactive[name];
          await writeConfig(JSON.stringify(mcpConfig, null, 2));
          refreshTable();
        }
      );
      
      serverList.querySelectorAll('[data-activate]').forEach(b =>
        b.onclick = async () => {
          const name = b.dataset.activate;
          const server = mcpConfig.inactive[name];
          
          // Move server to active
          mcpConfig.mcpServers[name] = server;
          delete mcpConfig.inactive[name];
          
          await writeConfig(JSON.stringify(mcpConfig, null, 2));
          refreshTable();
        }
      );
    }
  
    // —— JSON editor modal —— 
    function showJsonModal() {
      editor.setValue(JSON.stringify(mcpConfig, null, 2), -1);
      setActiveModal(jsonModal);
    }
    async function downloadJson() {
      const txt = editor.getValue();
      try {
        JSON.parse(txt);
        await writeConfig(txt);
        mcpConfig = JSON.parse(txt);
        refreshTable();
        closeActiveModal();
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
      }
    }
  
    // —— Quick Add functionality —— 
    // Save callback for Quick Add
    async function saveQuickAddServer(name, cfg, initialState) {
      if (initialState === 'active') {
        // Add to mcpServers
        mcpConfig.mcpServers[name] = cfg;
      } else {
        // Add to inactive
        if (!mcpConfig.inactive) {
          mcpConfig.inactive = {};
        }
        mcpConfig.inactive[name] = cfg;
      }
      
      // Save the configuration
      await writeConfig(JSON.stringify(mcpConfig, null, 2));
      refreshTable();
    }
    
    // Initialize Quick Add
    const quickAdd = new QuickAdd(mcpConfig, saveQuickAddServer);
    
    // —— Wire up event listeners —— 
    addBtn.onclick         = () => openServerModal();
    quickAddBtn.onclick    = () => quickAdd.openModal();
    quickAddClose.onclick  = () => quickAdd.closeModal();
    exportBtn.onclick      = showJsonModal;
    revealBtn.onclick      = () => revealConfig();
    pasteBtn.onclick       = () => setActiveModal(pasteModal);
    pasteCancel.onclick    = closeActiveModal;
    pasteClose.onclick     = closeActiveModal;
    pasteLoad.onclick      = pasteLoad.onclick; // already defined above
    closeBtns.forEach(b    => b.onclick = closeActiveModal);
    cancelBtn.onclick      = closeActiveModal;
    form.addEventListener('submit', saveServer);
    addArgBtnG.onclick     = () => addGenericArg('');
    addEnvBtnG.onclick     = () => addGenericEnv('','');
    addArgBtnN.onclick     = () => addNpxArg('');
    addEnvBtnN.onclick     = () => addNpxEnv('','');
    addPortBtn.onclick     = () => addDockerPort('');
    addVolBtn.onclick      = () => addDockerVolume('');
    addEnvBtnD.onclick     = () => addDockerEnv('','');
    downloadJsonBtn.onclick= downloadJson;
    jsonCancelBtn.onclick  = closeActiveModal;
    
    // About modal handlers
    aboutBtn.onclick = () => {
      checkPrerequisites().then(status => {
        // Update About modal with prerequisite status
        const { docker, nodejs, dockerUrl, nodejsUrl } = status;
        
        // Docker status
        if (docker) {
          dockerStatus.textContent = 'Installed';
          dockerStatusDot.className = 'status-dot green';
        } else {
          dockerStatus.textContent = 'Not Installed';
          dockerStatusDot.className = 'status-dot red';
        }
        
        // Node.js status
        if (nodejs) {
          nodejsStatus.textContent = 'Installed';
          nodejsStatusDot.className = 'status-dot green';
        } else {
          nodejsStatus.textContent = 'Not Installed';
          nodejsStatusDot.className = 'status-dot red';
        }
        
        // Set version in about modal
        aboutVersion.textContent = versionTag.textContent;
        
        // Installation links
        dockerInstLink.onclick = (e) => {
          e.preventDefault();
          openUrl(dockerUrl);
        };
        
        nodejsInstLink.onclick = (e) => {
          e.preventDefault();
          openUrl(nodejsUrl);
        };
        
        // Show modal
        setActiveModal(aboutModal);
      });
    };
    
    aboutClose.onclick = closeActiveModal;
    aboutCloseBtn.onclick = closeActiveModal;
    
    // —— Prerequisites handlers ——
    installDockerBtn.addEventListener('click', () => {
      checkPrerequisites().then(status => {
        openUrl(status.dockerUrl);
      });
    });
    
    installNodejsBtn.addEventListener('click', () => {
      checkPrerequisites().then(status => {
        openUrl(status.nodejsUrl);
      });
    });
    
    // Listen for prerequisites status from main process
    window.addEventListener('message', event => {
      if (event.data.type === 'prerequisites-status') {
        const { docker, nodejs, appVersion } = event.data.data;
        
        // Display version
        versionTag.textContent = `v${appVersion}`;
        
        // Check prerequisites
        let missingDeps = [];
        
        if (!docker) {
          missingDeps.push('Docker');
          missingDocker.style.display = 'block';
        } else {
          missingDocker.style.display = 'none';
        }
        
        if (!nodejs) {
          missingDeps.push('Node.js');
          missingNodejs.style.display = 'block';
        } else {
          missingNodejs.style.display = 'none';
        }
        
        if (missingDeps.length > 0) {
          prereqMessage.textContent = `Missing dependencies: ${missingDeps.join(', ')}. Please install to use all features.`;
          prereqWarning.style.display = 'block';
        } else {
          prereqWarning.style.display = 'none';
        }
      }
    });
    
    // Manual check for prerequisites (as a backup if IPC event doesn't fire)
    checkPrerequisites().then(status => {
      const { docker, nodejs } = status;
      let missingDeps = [];
      
      if (!docker) {
        missingDeps.push('Docker');
        missingDocker.style.display = 'block';
      }
      
      if (!nodejs) {
        missingDeps.push('Node.js');
        missingNodejs.style.display = 'block';
      }
      
      if (missingDeps.length > 0) {
        prereqMessage.textContent = `Missing dependencies: ${missingDeps.join(', ')}. Please install to use all features.`;
        prereqWarning.style.display = 'block';
      }
    });
  
    // —— Startup load —— 
    readConfig()
      .then(txt => {
        console.log("Loaded MCP config:", txt);
        try {
          mcpConfig = JSON.parse(txt);
          
          // Ensure mcpServers and inactive properties exist
          if (!mcpConfig.mcpServers) {
            mcpConfig.mcpServers = {};
          }
          
          if (!mcpConfig.inactive) {
            mcpConfig.inactive = {};
          }
        } catch (err) {
          console.error("Invalid JSON in config file:", err);
          mcpConfig = { mcpServers: {}, inactive: {} };
        }
        refreshTable();
        
        // If no servers are configured, show the paste dialog automatically
        if (Object.keys(mcpConfig.mcpServers).length === 0 && Object.keys(mcpConfig.inactive).length === 0) {
          setTimeout(() => setActiveModal(pasteModal), 500);
        }
      })
      .catch(err => {
        console.error("Failed to read config file:", err);
        mcpConfig = { mcpServers: {}, inactive: {} };
        refreshTable();
        
        // Show the paste dialog on error as well
        setTimeout(() => setActiveModal(pasteModal), 500);
      });
  });
