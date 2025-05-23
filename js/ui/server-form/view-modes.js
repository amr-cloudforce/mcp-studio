/**
 * Server Form - View Modes Module
 * Handles switching between quick and advanced views.
 */

export function setupViewModeToggle(viewModeRadios, quickSection, typeSelector) {
  viewModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'quick') {
        quickSection.classList.add('active');
        document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
        typeSelector.style.display = 'none';
      } else {
        quickSection.classList.remove('active');
        const selectedType = document.querySelector('input[name="type"]:checked').value;
        document.getElementById(`section-${selectedType}`).classList.add('active');
        typeSelector.style.display = 'block';
      }
    });
  });
}

// Alias for setupViewModeToggle to maintain compatibility with index.js
export function initViewModeToggle(quickSection, typeSelector, viewModeRadios) {
  return setupViewModeToggle(viewModeRadios, quickSection, typeSelector);
}

export function setupQuickViewAdvancedOptionsToggle(quickShowAdvanced, quickAdvancedOptions) {
  quickShowAdvanced.addEventListener('change', () => {
    quickAdvancedOptions.style.display = quickShowAdvanced.checked ? 'block' : 'none';
  });
}

// Alias for setupQuickViewAdvancedOptionsToggle to maintain compatibility with index.js
export function initAdvancedOptionsToggle(quickShowAdvanced, quickAdvancedOptions) {
  return setupQuickViewAdvancedOptionsToggle(quickShowAdvanced, quickAdvancedOptions);
}

export function setupTypeSelector(typeRadios, quickSection, typeSelector) {
  typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`section-${radio.value}`).classList.add('active');
    });
  });
}

export function setupViewMode(config, viewToggleContainer, quickSection, typeSelector, templateId) {
  // Show view toggle
  viewToggleContainer.style.display = 'block';
  
  // Set quick view as active
  document.querySelector('input[name="view-mode"][value="quick"]').checked = true;
  quickSection.classList.add('active');
  document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
  typeSelector.style.display = 'none';
}

export function setupQuickView(viewToggleContainer, quickSection, typeSelector, quickTemplateName, quickTemplateDesc, getTemplateDescription, setupAdvancedView, generateQuickViewForm, config) {
  viewToggleContainer.style.display = 'block';
  document.querySelector('input[name="view-mode"][value="quick"]').checked = true;
  quickSection.classList.add('active');
  document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
  typeSelector.style.display = 'none';

  quickTemplateName.textContent = config.metadata.templateName || 'Template';
  quickTemplateName.dataset.templateId = config.metadata.quickAddTemplate;
  quickTemplateDesc.textContent = getTemplateDescription(config.metadata.quickAddTemplate);

  setupAdvancedView(config);
  generateQuickViewForm(config);
}

export function setupAdvancedView(cmdInput, genericDis, genericArgs, genericEnv, npxDis, npxFlags, npxRepo, npxArgs, npxEnv, dockerDis, dockerFlags, dockerImage, dockerEnv, addGenericArg, addGenericEnv, addNpxArg, addNpxEnv, addDockerEnv, config) {
  const type = config.command === 'npx' ? 'npx'
             : config.command === 'docker' ? 'docker'
             : 'generic';

  document.querySelector(`input[name="type"][value="${type}"]`).checked = true;

  if (type === 'generic') {
    cmdInput.value = config.command;
    genericDis.checked = !!config.disabled;
    
    genericArgs.innerHTML = '';
    (config.args || []).forEach(a => addGenericArg(genericArgs, a));
    if (!(config.args || []).length) addGenericArg(genericArgs, '');
    
    genericEnv.innerHTML = '';
    Object.entries(config.env || {}).forEach(([k, v]) => addGenericEnv(genericEnv, k, v));
    if (!config.env) addGenericEnv(genericEnv, '', '');
  }
  
  if (type === 'npx') {
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
  
  if (type === 'docker') {
    dockerDis.checked = !!config.disabled;
    
    const flags = (config.args || []).filter(a => a.startsWith('-'));
    const rest = (config.args || []).filter(a => !a.startsWith('-'));
    
    dockerFlags.forEach(c => c.checked = flags.includes(c.dataset.flag));
    dockerImage.value = rest[0] || '';
    
    dockerEnv.innerHTML = '';
    Object.entries(config.env || {}).forEach(([k, v]) => addDockerEnv(dockerEnv, k, v));
    if (!config.env) addDockerEnv(dockerEnv, '', '');
  }
}
