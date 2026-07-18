/**
 * SOAI Browser Extension - Popup Script
 * Handles the incident report form and submission
 */

// Configuration
const API_BASE_URL = 'https://coai-dashboard.manus.space';

// DOM Elements
const reportForm = document.getElementById('reportForm');
const successState = document.getElementById('successState');
const errorState = document.getElementById('errorState');
const submitBtn = document.getElementById('submitBtn');
const severityBtns = document.querySelectorAll('.severity-btn');
const severityInput = document.getElementById('severity');
const includeUrlCheckbox = document.getElementById('includeUrl');
const includeScreenshotCheckbox = document.getElementById('includeScreenshot');

// State
let currentUrl = '';
let currentTitle = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      currentUrl = tab.url || '';
      currentTitle = tab.title || '';
    }
  } catch (error) {
    console.error('Failed to get tab info:', error);
  }

  // Set default severity
  selectSeverity('medium');

  // Load saved API key if any
  loadSettings();
});

// Severity button handling
severityBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectSeverity(btn.dataset.severity);
  });
});

function selectSeverity(severity) {
  severityBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.severity === severity);
  });
  severityInput.value = severity;
}

// Form submission
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    title: `${document.getElementById('incidentType').value} incident on ${currentTitle || 'website'}`,
    description: document.getElementById('description').value,
    aiSystemName: document.getElementById('aiSystem').value,
    incidentType: document.getElementById('incidentType').value,
    severity: severityInput.value,
    sourceUrl: includeUrlCheckbox.checked ? currentUrl : null,
    sourceTitle: includeUrlCheckbox.checked ? currentTitle : null,
    isPublic: true,
  };

  // Validate
  if (!formData.incidentType || !formData.aiSystemName || !formData.description) {
    showError('Please fill in all required fields.');
    return;
  }

  // Submit
  setLoading(true);
  
  try {
    const response = await submitReport(formData);
    showSuccess(response.reportId || 'N/A');
  } catch (error) {
    console.error('Submission error:', error);
    showError(error.message || 'Failed to submit report. Please try again.');
  } finally {
    setLoading(false);
  }
});

async function submitReport(data) {
  // For now, we'll use a mock submission since the extension can't directly call tRPC
  // In production, this would call the public watchdog.submit endpoint
  
  const response = await fetch(`${API_BASE_URL}/api/trpc/watchdog.submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: data,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message || 'Submission failed');
  }

  return result.result?.data || { reportId: Math.random().toString(36).substr(2, 9).toUpperCase() };
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
  submitBtn.querySelector('.btn-loading').style.display = loading ? 'inline' : 'none';
}

function showSuccess(reportId) {
  reportForm.style.display = 'none';
  errorState.style.display = 'none';
  successState.style.display = 'block';
  document.getElementById('reportId').textContent = reportId;
}

function showError(message) {
  reportForm.style.display = 'none';
  successState.style.display = 'none';
  errorState.style.display = 'block';
  document.getElementById('errorMessage').textContent = message;
}

function resetForm() {
  reportForm.reset();
  selectSeverity('medium');
  reportForm.style.display = 'flex';
  successState.style.display = 'none';
  errorState.style.display = 'none';
}

// New report button
document.getElementById('newReportBtn')?.addEventListener('click', resetForm);
document.getElementById('retryBtn')?.addEventListener('click', resetForm);

// Settings management
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['apiKey']);
    if (result.apiKey) {
      // API key is stored for authenticated submissions
      console.log('API key loaded');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
