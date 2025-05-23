// js/storage/composioStore.js
const { app }  = require('electron');
const fs       = require('fs');
const path     = require('path');

const FILE = path.join(app.getPath('userData'), 'composio.json');

// read the whole file once; if missing or broken start fresh
let data;
try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); }
catch { data = {}; }

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getApiKey() {
    return data.apiKey || '';
  },
  setApiKey(key) {
    data.apiKey = key;
    save();
  },
  getAppsCache() {
    return data.appsCache || null;
  },
  setAppsCache(cache) {
    data.appsCache = cache;
    save();
  }
};
