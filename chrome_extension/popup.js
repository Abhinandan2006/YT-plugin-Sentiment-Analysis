document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  const spinner = document.getElementById('spinner');
  const btnText = document.querySelector('.btn-text');
  const statusMsg = document.getElementById('status-message');

  analyzeBtn.addEventListener('click', async () => {
    // Reset status
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';
    
    // Show loading state
    analyzeBtn.disabled = true;
    btnText.textContent = 'Analyzing...';
    spinner.classList.remove('hidden');

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes("youtube.com/watch")) {
        throw new Error("Please navigate to a YouTube video page.");
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ANALYZE_COMMENTS' });
      
      if (response && response.success) {
        statusMsg.textContent = `Analyzed ${response.count} comments!`;
        statusMsg.classList.add('success');
      } else {
        throw new Error(response?.error || 'Failed to analyze comments.');
      }
    } catch (error) {
      statusMsg.textContent = error.message;
      statusMsg.classList.add('error');
    } finally {
      // Reset button state
      analyzeBtn.disabled = false;
      btnText.textContent = 'Analyze Comments';
      spinner.classList.add('hidden');
    }
  });
});
