chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_SENTIMENT') {
    const comments = request.comments;
    
    fetch('https://yt-sentiment-api.onrender.com/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comments: comments })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ success: true, data: data.predictions });
    })
    .catch(error => {
      console.error('Error fetching sentiment:', error);
      sendResponse({ success: false, error: error.message });
    });

    // Return true to indicate we wish to send a response asynchronously
    return true;
  }
});
