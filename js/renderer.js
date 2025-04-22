// File: js/renderer.js
window.addEventListener('DOMContentLoaded', () => {
    const { readConfig, writeConfig, revealConfig } = window.api;
  
    // —— ACE JSON editor setup —— 
    const editor = ace.edit("json-editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/json");
    editor.setShowPrintMargin(false);
  
    // —— Application state —— 
    let mcpConfig = { mcpServers: {} };
    let currentServer = null;
  
    // —— DOM references —— 
    const serverList      = document.getElementById('server-list');
    const addBtn          = document.getElementById('add-server-btn');
    const exportBtn       = document.getElementById('export-json-btn');
    const revealBtn       = document.getElementById('reveal-btn');
    const pasteBtn        = document.getElementById('paste-btn');
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
  
      serverModal.classList.add('open');
    }
  
    function openServerModal(name) {
      if (name) {
        fillModal(name, mcpConfig.mcpServers[name], true);
      } else {
        fillModal('', { command:'', args:[], env:{} }, false);
      }
    }
  
    // —— “Paste Config” logic —— 
    pasteBtn.onclick    = () => pasteModal.classList.add('open');
    pasteCancel.onclick = () => pasteModal.classList.remove('open');
    pasteClose.onclick  = () => pasteModal.classList.remove('open');
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
      pasteModal.classList.remove('open');
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
        const flags = Array.from(npxFlags).filter(c => c.checked).map(c => c.dataset.flag);
        const repo  = npxRepo.value.trim();
        if (!repo) return alert('Repository is required');
        const extra = Array.from(npxArgs.querySelectorAll('input'))
                           .map(i => i.value.trim()).filter(Boolean);
        cfg.args = [...flags, repo, ...extra];
        const env = {};
        npxEnv.querySelectorAll('.row').forEach(r => {
          const k = r.querySelector('.env-key').value.trim();
          const v = r.querySelector('.env-val').value.trim();
          if (k) env[k] = v;
        });
        if (Object.keys(env).length) cfg.env = env;
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
  
      if (currentServer && currentServer !== name) {
        delete mcpConfig.mcpServers[currentServer];
      }
      mcpConfig.mcpServers[name] = cfg;
      await writeConfig(JSON.stringify(mcpConfig, null, 2));
      refreshTable();
      serverModal.classList.remove('open');
    }
  
    // —— Refresh table view —— 
    function refreshTable() {
      serverList.innerHTML = '';
      Object.entries(mcpConfig.mcpServers).forEach(([n, c]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${n}</td>
          <td>${c.command}</td>
          <td>
            <span class="badge ${c.disabled?'badge-disabled':'badge-enabled'}">
              ${c.disabled?'Disabled':'Enabled'}
            </span>
          </td>
          <td>
            <button class="btn btn-export" data-edit="${n}">Edit</button>
            <button class="btn btn-del"    data-del ="${n}">Delete</button>
          </td>`;
        serverList.appendChild(tr);
      });
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
    }
  
    // —— JSON editor modal —— 
    function showJsonModal() {
      editor.setValue(JSON.stringify(mcpConfig, null, 2), -1);
      jsonModal.classList.add('open');
    }
    async function downloadJson() {
      const txt = editor.getValue();
      try {
        JSON.parse(txt);
        await writeConfig(txt);
        mcpConfig = JSON.parse(txt);
        refreshTable();
        jsonModal.classList.remove('open');
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
      }
    }
  
    // —— Wire up event listeners —— 
    addBtn.onclick         = () => openServerModal();
    exportBtn.onclick      = showJsonModal;
    revealBtn.onclick      = () => revealConfig();
    pasteBtn.onclick       = () => pasteModal.classList.add('open');
    pasteCancel.onclick    = () => pasteModal.classList.remove('open');
    pasteClose.onclick     = () => pasteModal.classList.remove('open');
    pasteLoad.onclick      = pasteLoad.onclick; // already defined above
    closeBtns.forEach(b    => b.onclick = () => b.closest('.modal').classList.remove('open'));
    cancelBtn.onclick      = () => serverModal.classList.remove('open');
    form.addEventListener('submit', saveServer);
    addArgBtnG.onclick     = () => addGenericArg('');
    addEnvBtnG.onclick     = () => addGenericEnv('','');
    addArgBtnN.onclick     = () => addNpxArg('');
    addEnvBtnN.onclick     = () => addNpxEnv('','');
    addPortBtn.onclick     = () => addDockerPort('');
    addVolBtn.onclick      = () => addDockerVolume('');
    addEnvBtnD.onclick     = () => addDockerEnv('','');
    downloadJsonBtn.onclick= downloadJson;
    jsonCancelBtn.onclick  = () => jsonModal.classList.remove('open');
  
    // —— Startup load —— 
    readConfig()
      .then(txt => {
        console.log("Loaded MCP config:", txt);
        try {
          mcpConfig = JSON.parse(txt);
        } catch (err) {
          console.error("Invalid JSON in config file:", err);
          mcpConfig = { mcpServers: {} };
        }
        refreshTable();
      })
      .catch(err => {
        console.error("Failed to read config file:", err);
        mcpConfig = { mcpServers: {} };
        refreshTable();
      });
  });
  