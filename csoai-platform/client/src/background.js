/**
 * SOAI Browser Extension - Background Service Worker
 * Handles context menus and background tasks
 */

// Configuration
const API_BASE_URL = 'https://coai-dashboard.manus.space';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for reporting
  chrome.contextMenus.create({
    id: 'soai-report',
    title: 'Report AI Safety Incident',
    contexts: ['page', 'selection', 'image'],
  });

  chrome.contextMenus.create({
    id: 'soai-report-selection',
    title: 'Report selected text as AI incident',
    contexts: ['selection'],
    parentId: 'soai-report',
  });

  chrome.contextMenus.create({
    id: 'soai-report-page',
    title: 'Report this page',
    contexts: ['page'],
    parentId: 'soai-report',
  });

  console.log('SOAI extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'soai-report-selection') {
    // Store selected text for the popup
    chrome.storage.local.set({
      pendingReport: {
        type: 'selection',
        text: info.selectionText,
        url: tab?.url,
        title: tab?.title,
      },
    });
    // Open popup
    chrome.action.openPopup();
  } else if (info.menuItemId === 'soai-report-page') {
    // Store page info for the popup
    chrome.storage.local.set({
      pendingReport: {
        type: 'page',
        url: tab?.url,
        title: tab?.title,
      },
    });
    // Open popup
    chrome.action.openPopup();
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SUBMIT_REPORT') {
    submitReport(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_PENDING_REPORT') {
    chrome.storage.local.get(['pendingReport'], (result) => {
      sendResponse(result.pendingReport || null);
      // Clear pending report after retrieval
      chrome.storage.local.remove(['pendingReport']);
    });
    return true;
  }
});

// Submit report to COAI API
async function submitReport(data) {
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

  return result.result?.data;
}

// Badge management
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#e94560' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Periodic check for pending reports (optional feature)
// chrome.alarms.create('checkPendingReports', { periodInMinutes: 30 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'checkPendingReports') {
//     checkPendingReports();
//   }
// });
