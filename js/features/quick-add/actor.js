/**
 * Quick Add Actor Module
 * Handles actor list functionality for the Quick Add wizard
 */

let container;
let addButton;

/**
 * Initialize the actor module
 */
export function init() {
  container = document.getElementById('actor-list-container');
  addButton = document.getElementById('add-actor-btn');
  
  // Add initial actor row
  addActorRow('filip_cicvarek/meetup-scraper');
  
  // Set up add button
  addButton.addEventListener('click', () => {
    addActorRow('');
  });
}

/**
 * Add an actor row to the container
 * @param {string} actor - Actor ID
 */
export function addActorRow(actor) {
  const row = document.createElement('div');
  row.className = 'actor-row';
  row.innerHTML = `
    <div class="row">
      <div class="actor-input-wrapper" style="flex: 1; position: relative;">
        <input type="text" class="actor-input" value="${actor}" placeholder="username/actor-name">
        <span class="actor-prefix" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #888; font-size: 0.9em; display: ${actor ? 'none' : 'block'};">apify.com/</span>
      </div>
      <button type="button" class="btn btn-reveal actor-info-btn" title="View actor details">ℹ️</button>
      <button type="button" class="btn btn-del remove-btn">&times;</button>
    </div>
  `;
  container.appendChild(row);
  
  // Set up event listeners
  const removeBtn = row.querySelector('.remove-btn');
  const infoBtn = row.querySelector('.actor-info-btn');
  const input = row.querySelector('.actor-input');
  const prefix = row.querySelector('.actor-prefix');
  
  // Remove button
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
  
  // Info button
  infoBtn.addEventListener('click', () => {
    const actorId = input.value.trim();
    if (actorId) {
      window.api.openUrl(`https://apify.com/${actorId}`);
    } else {
      alert('Please enter an actor ID first');
    }
  });
  
  // Input field focus/blur
  input.addEventListener('focus', () => {
    prefix.style.display = 'none';
  });
  
  input.addEventListener('blur', () => {
    if (!input.value.trim()) {
      prefix.style.display = 'block';
    }
  });
  
  // Input field change
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      prefix.style.display = 'none';
    } else {
      prefix.style.display = 'block';
    }
  });
}

/**
 * Get all actor IDs from the actor list
 * @returns {string[]} - Array of actor IDs
 */
export function getActorIds() {
  const actorInputs = document.querySelectorAll('.actor-input');
  return Array.from(actorInputs)
    .map(input => input.value.trim())
    .filter(actor => actor !== '');
}
