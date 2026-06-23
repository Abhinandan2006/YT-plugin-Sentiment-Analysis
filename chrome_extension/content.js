chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ANALYZE_COMMENTS') {
    analyzeComments()
      .then(count => sendResponse({ success: true, count: count }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate we wish to send a response asynchronously
    return true;
  }
});

async function analyzeComments() {
  // Find all comment text elements
  // YouTube uses yt-formatted-string or yt-attributed-string with id="content-text"
  // It can be inside ytd-comment-renderer (older) or ytd-comment-view-model (newer)
  const commentElements = document.querySelectorAll('ytd-comment-view-model #content-text, ytd-comment-renderer #content-text');
  
  if (commentElements.length === 0) {
    throw new Error("No comments found. Please scroll down to load comments.");
  }

  // We only want to analyze comments that haven't been analyzed yet
  const unanalyzedComments = [];
  const unanalyzedElements = [];

  commentElements.forEach(el => {
    // Check if we already added a badge
    let headerElement = null;
    
    // Try newer YouTube layout
    let container = el.closest('ytd-comment-view-model');
    if (container) {
      headerElement = container.querySelector('#author-text');
    } 
    
    // Fallback to older YouTube layout
    if (!headerElement) {
      container = el.closest('ytd-comment-renderer');
      if (container) {
        headerElement = container.querySelector('#header-author');
      }
    }

    // If still not found, just use the comment text element itself as a fallback
    if (!headerElement) {
      headerElement = el;
    }

    if (headerElement && !headerElement.parentElement.querySelector('.sentiment-badge')) {
      unanalyzedComments.push(el.innerText);
      unanalyzedElements.push(headerElement); // Attach badge next to this element
    }
  });

  if (unanalyzedComments.length === 0) {
    throw new Error("All loaded comments are already analyzed.");
  }

  // Send to background script for API call
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'FETCH_SENTIMENT', comments: unanalyzedComments },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        
        if (response && response.success) {
          // Process predictions
          response.data.forEach((prediction, index) => {
            const sentiment = prediction.sentiment; // 1 for positive, 0 for negative (assuming)
            const headerElement = unanalyzedElements[index];
            injectBadge(headerElement, sentiment);
          });
          resolve(unanalyzedComments.length);
        } else {
          reject(new Error(response?.error || 'Failed to fetch sentiment. Is the local ML server running?'));
        }
      }
    );
  });
}

function injectBadge(element, sentiment) {
  if (!element) return;
  
  const badge = document.createElement('span');
  badge.className = 'sentiment-badge';
  badge.style.marginLeft = '8px';
  badge.style.padding = '2px 6px';
  badge.style.borderRadius = '12px';
  badge.style.fontSize = '12px';
  badge.style.fontWeight = 'bold';
  badge.style.color = 'white';
  
  // Customize based on sentiment (Assuming 1 = Positive, 0 = Negative)
  if (sentiment === 1) {
    badge.textContent = 'Positive 🟢';
    badge.style.backgroundColor = '#2e7d32'; // Green
  } else {
    badge.textContent = 'Negative 🔴';
    badge.style.backgroundColor = '#d32f2f'; // Red
  }
  
  element.appendChild(badge);
}
