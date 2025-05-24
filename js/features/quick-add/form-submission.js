/**
 * Quick Add Form Submission Module
 * Handles form submission logic
 */

/**
 * Handle form submission
 * @param {Event} e - The submit event
 * @param {Object} baseModule - The base module instance
 */
export async function handleSubmit(e, baseModule) {
  e.preventDefault();
  
  const templates = baseModule.getTemplates();
  const template = templates[baseModule.currentTemplate];
  const name = baseModule.nameInput.value.trim();
  
  if (!name) {
    return alert('Server name is required');
  }
  
  // Get all input values
  const inputValues = {};
  template.userInputs.forEach(input => {
    const element = document.getElementById(`input-${input.name}`);
    if (element) {
      if (input.type === 'checkbox') {
        // For checkboxes, use the checked property
        inputValues[input.name] = element.checked ? 'true' : 'false';
      } else if (input.type === 'file') {
        // For file inputs, use the file path
        inputValues[input.name] = element.files && element.files[0] ? element.files[0].path : '';
      } else {
        // For all other inputs, use the value
        inputValues[input.name] = element.value;
      }
    } else if (input.default) {
      inputValues[input.name] = input.default;
    }
  });
  
  // Check if any required fields are missing
  const missingRequired = template.userInputs
    .filter(input => {
      // Special case for directory-list type
      if (input.type === 'directory-list') {
        // Get all directory inputs
        const directoryInputs = document.querySelectorAll('.directory-input');
        const directories = Array.from(directoryInputs)
          .map(input => input.value.trim())
          .filter(dir => dir !== '');
        
        // Check if at least one directory is selected
        return directories.length === 0;
      }
      
      // Special case for actor-list type
      if (input.type === 'actor-list') {
        // Get all actor inputs
        const actorInputs = document.querySelectorAll('.actor-input');
        const actors = Array.from(actorInputs)
          .map(input => input.value.trim())
          .filter(actor => actor !== '');
        
        // Check if at least one actor is selected
        return actors.length === 0;
      }
      
      return input.required && !inputValues[input.name];
    })
    .map(input => input.displayName);
  
  if (missingRequired.length > 0) {
    return alert(`Missing required fields: ${missingRequired.join(', ')}`);
  }
  
  // Create the server configuration
  const cfg = JSON.parse(JSON.stringify(template.config));
  
  // Special case for filesystem-server: collect directories
  if (baseModule.currentTemplate === 'filesystem-server') {
    // Get all directory inputs
    const directoryInputs = document.querySelectorAll('.directory-input');
    const directories = Array.from(directoryInputs)
      .map(input => input.value.trim())
      .filter(dir => dir !== '');
    
    // Check if at least one directory is selected
    if (directories.length === 0) {
      return alert('Please select at least one directory');
    }
    
    // Add directories to args
    cfg.args = [...cfg.args, ...directories];
  } 
  // Special case for apify-web-adapter: collect actors
  else if (baseModule.currentTemplate === 'apify-web-adapter') {
    // Get all actor inputs
    const actorInputs = document.querySelectorAll('.actor-input');
    const actors = Array.from(actorInputs)
      .map(input => input.value.trim())
      .filter(actor => actor !== '');
    
    // Check if at least one actor is selected
    if (actors.length === 0) {
      return alert('Please add at least one Apify actor');
    }
    
    // Join actors with commas and replace the {actorIds} placeholder
    const actorsString = actors.join(',');
    inputValues.actorIds = actorsString;
    
    // Replace template variables in args
    if (cfg.args) {
      cfg.args = cfg.args.map(arg => {
        if (typeof arg === 'string' && arg.includes('{')) {
          // Replace all {variable} with actual values
          return arg.replace(/{([^}]+)}/g, (match, varName) => {
            return inputValues[varName] || match;
          });
        }
        return arg;
      });
    }
  } else {
    // Replace template variables in args
    if (cfg.args) {
      cfg.args = cfg.args.map(arg => {
        if (typeof arg === 'string' && arg.includes('{')) {
          // Replace all {variable} with actual values
          return arg.replace(/{([^}]+)}/g, (match, varName) => {
            return inputValues[varName] || match;
          });
        }
        return arg;
      });
    }
  }
  
  // Replace template variables in env
  if (cfg.env) {
    Object.keys(cfg.env).forEach(key => {
      const value = cfg.env[key];
      if (typeof value === 'string' && value.includes('{')) {
        cfg.env[key] = value.replace(/{([^}]+)}/g, (match, varName) => {
          return inputValues[varName] || match;
        });
      }
    });
  }
  
  // Check if server should be active or inactive
  const initialState = inputValues.initialState || 'active';
  
  // Add server to configuration
  baseModule.addServer(name, cfg, initialState);
}
