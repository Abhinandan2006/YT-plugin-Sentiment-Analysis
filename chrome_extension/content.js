chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ANALYZE_COMMENTS') {
    analyzeComments()
      .then(predictions => sendResponse({ success: true, predictions: predictions }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

window.youtubeSentimentPredictions = window.youtubeSentimentPredictions || [];

async function collectUnanalyzedComments(targetCount = 100) {
  let unanalyzedComments = [];
  let unanalyzedElements = [];
  let noNewCommentsCount = 0;
  const maxNoNewComments = 8; 
  
  return new Promise((resolve) => {
    const scrollInterval = setInterval(() => {
      const commentElements = document.querySelectorAll('ytd-comment-view-model #content-text, ytd-comment-renderer #content-text');
      let newFound = false;
      
      commentElements.forEach(el => {
        let headerElement = null;
        let isSuperchat = false;
        let isMember = false;
        
        let container = el.closest('ytd-comment-view-model');
        if (container) {
          headerElement = container.querySelector('#author-text');
          const memberBadge = container.querySelector('ytd-author-comment-badge-renderer');
          if (memberBadge && memberBadge.offsetWidth > 0 && !memberBadge.hasAttribute('hidden')) isMember = true;
          
          const paidChip = container.querySelector('#paid-comment-chip');
          if (paidChip && paidChip.offsetWidth > 0 && !paidChip.hasAttribute('hidden')) isSuperchat = true;
        } 
        
        if (!headerElement) {
          container = el.closest('ytd-comment-renderer');
          if (container) {
            headerElement = container.querySelector('#header-author');
            const memberBadge = container.querySelector('ytd-author-comment-badge-renderer');
            if (memberBadge && memberBadge.offsetWidth > 0 && !memberBadge.hasAttribute('hidden')) isMember = true;
            
            const sponsorComment = el.closest('ytd-sponsorships-comment-renderer');
            const paidChip = container.querySelector('#paid-comment-chip');
            
            if ((sponsorComment && sponsorComment.offsetWidth > 0 && !sponsorComment.hasAttribute('hidden')) || 
                (paidChip && paidChip.offsetWidth > 0 && !paidChip.hasAttribute('hidden'))) {
              isSuperchat = true;
            }
          }
        }

        if (!headerElement) headerElement = el;

        if (headerElement && !headerElement.parentElement.querySelector('.sentiment-badge')) {
          if (!unanalyzedElements.includes(headerElement)) {
            unanalyzedComments.push({
              text: el.innerText,
              isMember: isMember,
              isSuperchat: isSuperchat
            });
            unanalyzedElements.push(headerElement);
            newFound = true;
          }
        }
      });
      
      if (newFound) {
        noNewCommentsCount = 0;
      } else {
        noNewCommentsCount++;
      }
      
      if (unanalyzedComments.length >= targetCount || noNewCommentsCount >= maxNoNewComments) {
        clearInterval(scrollInterval);
        resolve({
          comments: unanalyzedComments.slice(0, targetCount),
          elements: unanalyzedElements.slice(0, targetCount)
        });
      } else {
        window.scrollBy(0, 1500); 
      }
    }, 800);
  });
}

async function analyzeComments() {
  const { comments, elements } = await collectUnanalyzedComments(100);
  
  if (comments.length === 0) {
    if (window.youtubeSentimentPredictions && window.youtubeSentimentPredictions.length > 0) {
      return window.youtubeSentimentPredictions;
    }
    throw new Error("No new comments to analyze. Scroll down to load more.");
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'FETCH_SENTIMENT', comments: comments.map(c => c.text) },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        
        if (response && response.success) {
          response.data.forEach((prediction, index) => {
            const sentiment = prediction.sentiment;
            const headerElement = elements[index];
            const meta = comments[index];
            injectBadge(headerElement, sentiment);
            
            window.youtubeSentimentPredictions.push({
              comment: meta.text,
              sentiment: sentiment,
              isMember: meta.isMember,
              isSuperchat: meta.isSuperchat
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
