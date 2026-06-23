document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  const spinner = document.getElementById('spinner');
  const btnText = document.querySelector('.btn-text');
  const statusMsg = document.getElementById('status-message');

  analyzeBtn.addEventListener('click', async () => {
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';
    
    analyzeBtn.disabled = true;
    btnText.textContent = 'Analyzing...';
    spinner.classList.remove('hidden');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes("youtube.com/watch")) {
        throw new Error("Please navigate to a YouTube video page.");
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ANALYZE_COMMENTS' });
      
      if (response && response.success) {
        const predictions = response.predictions;
        statusMsg.textContent = `Analyzed ${predictions.length} comments!`;
        statusMsg.classList.add('success');
        
        let posCount = 0;
        let negCount = 0;
        let allText = "";

        predictions.forEach(pred => {
          if (pred.sentiment === 1) posCount++;
          else negCount++;
          allText += pred.comment + " ";
        });

        const total = predictions.length;
        const posPercent = total > 0 ? Math.round((posCount / total) * 100) : 0;
        const negPercent = total > 0 ? Math.round((negCount / total) * 100) : 0;

        document.getElementById('stat-pos-count').textContent = posCount;
        document.getElementById('stat-pos-percent').textContent = `${posPercent}%`;
        document.getElementById('stat-neg-count').textContent = negCount;
        document.getElementById('stat-neg-percent').textContent = `${negPercent}%`;

        const words = allText.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        const stopWords = new Set(["the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","is","are","was","were","am","been","has","had","can","could","should","would","like","just","very"]);
        
        const wordCounts = {};
        words.forEach(word => {
          if (word.length > 2 && !stopWords.has(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });

        const sortedWords = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const wordsContainer = document.getElementById('words-container');
        wordsContainer.innerHTML = '';
        sortedWords.forEach(([word, count]) => {
          const chip = document.createElement('div');
          chip.className = 'word-chip';
          chip.innerHTML = `${word} <span class="word-count">${count}</span>`;
          wordsContainer.appendChild(chip);
        });

        document.getElementById('dashboard').classList.remove('hidden');
      } else {
        throw new Error(response?.error || 'Failed to analyze comments.');
      }
    } catch (error) {
      statusMsg.textContent = error.message;
      statusMsg.classList.add('error');
    } finally {
      analyzeBtn.disabled = false;
      btnText.textContent = 'Analyze Comments';
      spinner.classList.add('hidden');
    }
  });
});
