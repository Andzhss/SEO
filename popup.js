document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const toneSelect = document.getElementById('tone');
  
  // Jaunās pogas un sadaļas no atjaunotā HTML
  const scanBtn = document.getElementById('scanBtn');
  const generateAiBtn = document.getElementById('generateAiBtn');
  const reportSection = document.getElementById('reportSection');
  const basicMetrics = document.getElementById('basicMetrics');
  const aiResultContainer = document.getElementById('aiResultContainer');
  const auditResult = document.getElementById('auditResult');
  const copyBtn = document.getElementById('copyBtn');
  const statusDiv = document.getElementById('status');

  let currentSeoData = null; // Šeit glabāsim noskrapētos datus

  // Ielādējam saglabāto API atslēgu
  const storedKey = localStorage.getItem('geminiApiKey');
  if (storedKey) {
    apiKeyInput.value = storedKey;
  }

  // --- 1. SOLIS: SKENĒT LAPU (Netērē AI tokenus) ---
  scanBtn.addEventListener('click', async () => {
    showStatus('Skenē lapu...', 'status');
    
    // Paslēpjam iepriekšējos rezultātus, ja tādi ir
    reportSection.style.display = 'none';
    aiResultContainer.style.display = 'none';
    currentSeoData = null;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('Nav aktīva taba.');
      }

      // Izpildām content.js skriptu
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
        throw new Error('Neizdevās nolasīt datus no lapas.');
      }

      currentSeoData = injectionResults[0].result;
      
      // Uzzīmējam tabulu ar tehniskajiem datiem
      renderBasicReport(currentSeoData);
      
      // Parādām rezultātu sadaļu
      reportSection.style.display = 'block';
      showStatus('Skenēšana pabeigta.', 'success');

    } catch (error) {
      console.error(error);
      showStatus('Kļūda: ' + error.message, 'error');
    }
  });

  // --- 2. SOLIS: ĢENERĒT AI IETEIKUMUS (Tērē tokenus) ---
  generateAiBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const tone = toneSelect.value;

    if (!apiKey) {
      showStatus('Lūdzu, ievadi Gemini API atslēgu.', 'error');
      return;
    }

    if (!currentSeoData) {
      showStatus('Vispirms veic lapas skenēšanu!', 'error');
      return;
    }

    // Saglabājam API atslēgu
    localStorage.setItem('geminiApiKey', apiKey);

    showStatus('AI analizē datus...', 'status');
    aiResultContainer.style.display = 'none';
    generateAiBtn.disabled = true; // Atslēdzam pogu, lai nespieno

    try {
      const report = await generateReport(apiKey, tone, currentSeoData);
      
      auditResult.value = report;
      aiResultContainer.style.display = 'block';
      showStatus('AI Audits gatavs!', 'success');

    } catch (error) {
      console.error(error);
      showStatus('AI Kļūda: ' + error.message, 'error');
    } finally {
      generateAiBtn.disabled = false;
    }
  });

  // Kopēšanas funkcionalitāte
  copyBtn.addEventListener('click', () => {
    auditResult.select();
    
    // Mēģinām izmantot moderno Clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(auditResult.value).then(() => {
            feedbackCopy();
        }).catch(err => {
             // Fallback
             document.execCommand('copy');
             feedbackCopy();
        });
    } else {
        document.execCommand('copy');
        feedbackCopy();
    }
  });

  function feedbackCopy() {
    const originalText = copyBtn.innerText;
    copyBtn.innerText = 'Nokopēts!';
    setTimeout(() => copyBtn.innerText = originalText, 2000);
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
  }

  // Funkcija tabulas ģenerēšanai
  function renderBasicReport(data) {
    // Palīgfunkcija rindas izveidei
    const createRow = (label, value, isGood) => {
        let valueClass = 'metric-value';
        if (isGood === false) valueClass += ' bad'; // Sarkans
        if (isGood === true) valueClass += ' good'; // Zaļš
        // Ja isGood ir null, krāsa nemainās

        return `
            <div class="metric-row">
                <span class="metric-label">${label}</span>
                <span class="${valueClass}">${value}</span>
            </div>`;
    };

    let html = '';
    
    // Pārbaudes loģika vizuālajam attēlojumam
    const titleLen = data.title ? data.title.length : 0;
    const descLen = data.metaDescription ? data.metaDescription.length : 0;

    html += createRow('Title', data.title || '(Tukšs)', titleLen > 0 && titleLen < 65);
    html += createRow('Description', data.metaDescription || '(Tukšs)', descLen > 50 && descLen < 160);
    html += createRow('H1', data.h1 || '(Trūkst)', !!data.h1);
    html += createRow('H2 skaits', data.h2Count, null);
    html += createRow('H3 skaits', data.h3Count, null);
    html += createRow('Vārdu skaits', data.wordCount, data.wordCount > 300);
    
    // Attēlu pārbaude
    const imgStatus = (data.imagesWithoutAlt === 0); 
    html += createRow('Attēli bez ALT', `${data.imagesWithoutAlt} / ${data.imageCount || '?'}`, imgStatus);

    // Canonical (ja content.js to atgriež)
    if (data.canonical !== undefined) {
        html += createRow('Canonical', data.canonical ? 'Ir' : 'Nav', !!data.canonical);
    }

    basicMetrics.innerHTML = html;
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
      - Word Count: ${data.wordCount}
      - Images without Alt Text: ${data.imagesWithoutAlt}
      
      Visible Body Snippet (first 1000 chars):
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
      throw new Error(errorData.error?.message || 'Gemini API pieprasījums neizdevās');
    }

    const result = await response.json();
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts) {
        return result.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Gemini API atgrieza tukšu atbildi.');
    }
  }
});
