const apiUrl = new URLSearchParams(window.location.search).get('api');

const request = async (action, params = {}) => {
  if (!apiUrl) throw new Error("API URL not provided in parameters.");
  
  const url = new URL(apiUrl);
  url.searchParams.append('action', action);
  
  // Append any GET params
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow' // Google Apps Script redirects to a temp URL
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

const postRequest = async (action, data) => {
  if (!apiUrl) throw new Error("API URL not provided in parameters.");

  const payload = {
    action,
    ...data
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    // Using text/plain to avoid CORS preflight issues with Apps Script
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const api = {
  async getCategories() {
    return await request('getCategories');
  },

  async getInventory(category) {
    return await request('getInventory', { category });
  },

  async getAllInventory() {
    return await request('getAllInventory');
  },

  async addItem(category, itemData) {
    return await postRequest('addItem', { category, itemData });
  },

  async deductItems(faculty, purpose, itemsToDeduct) {
    return await postRequest('deductItems', { faculty, purpose, itemsToDeduct });
  },

  async addFine(fineData) {
    return await postRequest('addFine', { fineData });
  },

  async getRecentActivity() {
    return await request('getRecentActivity');
  },

  async getAllLogs() {
    return await request('getAllLogs');
  },

  async createSnapshot() {
    return await request('createSnapshot');
  }
};
