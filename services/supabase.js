'use strict';

const axios = require('axios');

const API_BASE   = 'https://api.supabase.com/v1';
const TIMEOUT_MS = 30000;

async function apiCall(method, urlPath, accessToken, data, logger, actionName) {
  const url = API_BASE + urlPath;
  try {
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      data: data || undefined,
      timeout: TIMEOUT_MS,
    });
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('TIMEOUT: ' + actionName + ' vuot qua ' + (TIMEOUT_MS / 1000) + 's');
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      throw new Error('Khong ket duoc mang: ' + err.message);
    }
    if (err.response) {
      const status = err.response.status;
      const msg =
        (err.response.data && (err.response.data.message || err.response.data.error)) ||
        err.response.statusText ||
        'Unknown API error';
      throw new Error(status + ': ' + msg);
    }
    throw err;
  }
}

const actions = {
  listProjects: {
    description: 'Liet ke tat ca projects trong tai khoan Supabase',
    params: [],
    async execute(profile, params, logger) {
      const token = profile.credentials && profile.credentials.accessToken;
      if (!token) return { success: false, data: null, message: 'Thieu credentials.accessToken trong profile' };
      try {
        const data  = await apiCall('GET', '/projects', token, null, logger, 'listProjects');
        const count = Array.isArray(data) ? data.length : '?';
        return { success: true, data, message: 'Tim thay ' + count + ' project(s)' };
      } catch (err) {
        return { success: false, data: null, message: err.message };
      }
    },
  },

  createProject: {
    description: 'Tao project Supabase moi',
    params: [
      { name: 'name',            required: true,  description: 'Ten project' },
      { name: 'organization_id', required: true,  description: 'ID cua organization' },
      { name: 'db_pass',         required: true,  description: 'Mat khau database' },
      { name: 'region',          required: false, description: 'Region (mac dinh: ap-southeast-1)' },
      { name: 'plan',            required: false, description: 'Plan: free | pro (mac dinh: free)' },
    ],
    async execute(profile, params, logger) {
      const token = profile.credentials && profile.credentials.accessToken;
      if (!token) return { success: false, data: null, message: 'Thieu credentials.accessToken trong profile' };

      const missing = [];
      if (!params.name)            missing.push('name');
      if (!params.organization_id) missing.push('organization_id');
      if (!params.db_pass)         missing.push('db_pass');
      if (missing.length > 0) return { success: false, data: null, message: 'Thieu params bat buoc: ' + missing.join(', ') };

      const body = {
        name:            params.name,
        organization_id: params.organization_id,
        db_pass:         params.db_pass,
        region:          params.region || 'ap-southeast-1',
        plan:            params.plan   || 'free',
      };

      try {
        const data = await apiCall('POST', '/projects', token, body, logger, 'createProject');
        return { success: true, data, message: "Da tao project '" + (data.name || params.name) + "' (ref: " + (data.id || '?') + ')' };
      } catch (err) {
        return { success: false, data: null, message: err.message };
      }
    },
  },

  getProjectApiKeys: {
    description: 'Lay API keys cua mot project',
    params: [
      { name: 'project_ref', required: true, description: 'Reference ID cua project' },
    ],
    async execute(profile, params, logger) {
      const token = profile.credentials && profile.credentials.accessToken;
      if (!token) return { success: false, data: null, message: 'Thieu credentials.accessToken trong profile' };
      if (!params.project_ref) return { success: false, data: null, message: 'Thieu param: project_ref' };

      try {
        const data     = await apiCall('GET', '/projects/' + params.project_ref + '/api-keys', token, null, logger, 'getProjectApiKeys');
        const keyCount = Array.isArray(data) ? data.length : '?';
        return { success: true, data, message: 'Lay duoc ' + keyCount + ' API key(s) cho project ' + params.project_ref };
      } catch (err) {
        return { success: false, data: null, message: err.message };
      }
    },
  },

  pauseProject: {
    description: 'Tam dung (pause) mot project Supabase',
    params: [
      { name: 'project_ref', required: true, description: 'Reference ID cua project' },
    ],
    async execute(profile, params, logger) {
      const token = profile.credentials && profile.credentials.accessToken;
      if (!token) return { success: false, data: null, message: 'Thieu credentials.accessToken trong profile' };
      if (!params.project_ref) return { success: false, data: null, message: 'Thieu param: project_ref' };

      try {
        const data = await apiCall('POST', '/projects/' + params.project_ref + '/pause', token, null, logger, 'pauseProject');
        return { success: true, data, message: 'Da gui lenh pause cho project ' + params.project_ref };
      } catch (err) {
        return { success: false, data: null, message: err.message };
      }
    },
  },

  restoreProject: {
    description: 'Khoi phuc (restore) mot project Supabase da bi pause',
    params: [
      { name: 'project_ref', required: true, description: 'Reference ID cua project' },
    ],
    async execute(profile, params, logger) {
      const token = profile.credentials && profile.credentials.accessToken;
      if (!token) return { success: false, data: null, message: 'Thieu credentials.accessToken trong profile' };
      if (!params.project_ref) return { success: false, data: null, message: 'Thieu param: project_ref' };

      try {
        const data = await apiCall('POST', '/projects/' + params.project_ref + '/restore', token, null, logger, 'restoreProject');
        return { success: true, data, message: 'Da gui lenh restore cho project ' + params.project_ref };
      } catch (err) {
        return { success: false, data: null, message: err.message };
      }
    },
  },
};

module.exports = {
  name:       'supabase',
  displayName: 'Supabase',
  version:    '1.0.0',
  apiBaseUrl: API_BASE,
  configSchema: {
    required: ['credentials.accessToken'],
    optional: ['meta.organization_id'],
  },
  actions,
};
