/**
 * SOAI Browser Extension - Content Script
 * Runs on all pages to enable quick reporting
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      selectedText: window.getSelection()?.toString() || '',
    });
  }
  return true;
});

// Optional: Add floating report button (can be toggled in settings)
function createFloatingButton() {
  // Check if button already exists
  if (document.getElementById('soai-floating-btn')) return;

  const button = document.createElement('div');
  button.id = 'soai-floating-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  `;
  button.title = 'Report AI Safety Incident';
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  });

  document.body.appendChild(button);
}

// Check settings and optionally show floating button
chrome.storage.sync.get(['showFloatingButton'], (result) => {
  if (result.showFloatingButton) {
    createFloatingButton();
  }
});

// Detect AI-related content on page (optional feature)
function detectAIContent() {
  const aiKeywords = [
    'chatgpt', 'openai', 'claude', 'anthropic', 'midjourney', 
    'dall-e', 'stable diffusion', 'gemini', 'copilot', 'ai assistant',
    'machine learning', 'artificial intelligence', 'neural network'
  ];

  const pageText = document.body.innerText.toLowerCase();
  const foundKeywords = aiKeywords.filter(keyword => pageText.includes(keyword));

  if (foundKeywords.length > 0) {
    // Page contains AI-related content
    chrome.runtime.sendMessage({
      type: 'AI_CONTENT_DETECTED',
      keywords: foundKeywords,
      url: window.location.href,
    });
  }
}

// Run detection after page load (optional, disabled by default)
// window.addEventListener('load', () => {
//   setTimeout(detectAIContent, 2000);
// });
