document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const toneSelect = document.getElementById('tone');
  const generateBtn = document.getElementById('generateBtn');
  const resultSection = document.getElementById('resultSection');
  const auditResult = document.getElementById('auditResult');
  const copyBtn = document.getElementById('copyBtn');
  const statusDiv = document.getElementById('status');

  // Load API Key
  const storedKey = localStorage.getItem('geminiApiKey');
  if (storedKey) {
    apiKeyInput.value = storedKey;
  }

  generateBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const tone = toneSelect.value;

    if (!apiKey) {
      showStatus('Please enter your Gemini API Key.', 'error');
      return;
    }

    // Save API Key
    localStorage.setItem('geminiApiKey', apiKey);

    showStatus('Auditing page...', 'status');
    resultSection.style.display = 'none';
    auditResult.value = '';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found.');
      }

      // Execute content script
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
        throw new Error('Failed to retrieve data from the page.');
      }

      const seoData = injectionResults[0].result;
      
      showStatus('Generating report with Gemini...', 'status');
      
      const report = await generateReport(apiKey, tone, seoData);
      
      auditResult.value = report;
      resultSection.style.display = 'block';
      showStatus('Audit complete.', 'success');

    } catch (error) {
      console.error(error);
      showStatus('Error: ' + error.message, 'error');
    }
  });

  copyBtn.addEventListener('click', () => {
    auditResult.select();
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(auditResult.value).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            setTimeout(() => copyBtn.innerText = originalText, 2000);
        }).catch(err => {
             document.execCommand('copy');
             const originalText = copyBtn.innerText;
             copyBtn.innerText = 'Copied!';
             setTimeout(() => copyBtn.innerText = originalText, 2000);
        });
    } else {
        document.execCommand('copy');
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => copyBtn.innerText = originalText, 2000);
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
  }

  async function generateReport(apiKey, tone, data) {
    const prompt = `
      You are an expert SEO Auditor. I will provide you with data from a client's landing page. 
      Analyze it and write a short, punchy cold-email snippet (in Latvian language) pointing out the top 3 critical errors and how fixing them would increase their revenue. 
      Be direct and professional.
      
      Tone of Voice: ${tone}
      
      Page Data:
      - Page Title: ${data.title || 'Missing'}
      - Meta Description: ${data.metaDescription || 'Missing'}
      - H1 Tag: ${data.h1 || 'Missing'}
      - H2 Count: ${data.h2Count}
      - H3 Count: ${data.h3Count}
      - Word Count: ${data.wordCount}
      - Images without Alt Text: ${data.imagesWithoutAlt}
      
      Visible Body Snippet:
      "${data.bodySnippet}"
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gemini API request failed');
    }

    const result = await response.json();
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
        return result.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Gemini API returned an empty response.');
    }
  }
});
