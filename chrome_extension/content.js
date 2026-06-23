chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ANALYZE_COMMENTS') {
    analyzeComments()
      .then(predictions => sendResponse({ success: true, predictions: predictions }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

window.youtubeSentimentPredictions = window.youtubeSentimentPredictions || [];

async function analyzeComments() {
  const commentElements = document.querySelectorAll('ytd-comment-view-model #content-text, ytd-comment-renderer #content-text');
  
  if (commentElements.length === 0) {
    throw new Error("No comments found. Please scroll down to load comments.");
  }
  const unanalyzedComments = [];
  const unanalyzedElements = [];

  commentElements.forEach(el => {
    let headerElement = null;
    
    let container = el.closest('ytd-comment-view-model');
    if (container) {
      headerElement = container.querySelector('#author-text');
    } 
    
    if (!headerElement) {
      container = el.closest('ytd-comment-renderer');
      if (container) {
        headerElement = container.querySelector('#header-author');
      }
    }

    if (!headerElement) {
      headerElement = el;
    }

    if (headerElement && !headerElement.parentElement.querySelector('.sentiment-badge')) {
      unanalyzedComments.push(el.innerText);
      unanalyzedElements.push(headerElement);
    }
  });

  if (unanalyzedComments.length === 0) {
    if (window.youtubeSentimentPredictions && window.youtubeSentimentPredictions.length > 0) {
      return Promise.resolve(window.youtubeSentimentPredictions);
    }
    throw new Error("No new comments to analyze. Scroll down to load more.");
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'FETCH_SENTIMENT', comments: unanalyzedComments },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        
        if (response && response.success) {
          response.data.forEach((prediction, index) => {
            const sentiment = prediction.sentiment;
            const headerElement = unanalyzedElements[index];
            injectBadge(headerElement, sentiment);
            window.youtubeSentimentPredictions.push({
              comment: unanalyzedComments[index],
              sentiment: sentiment
            });
          });
          resolve(window.youtubeSentimentPredictions);
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
  
  if (sentiment === 1) {
    badge.textContent = 'Positive 🟢';
    badge.style.backgroundColor = '#2e7d32';
  } else {
    badge.textContent = 'Negative 🔴';
    badge.style.backgroundColor = '#d32f2f';
  }
  
  element.appendChild(badge);
}
