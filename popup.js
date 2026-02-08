document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const toneSelect = document.getElementById('tone');
  
  const scanBtn = document.getElementById('scanBtn');
  const generateAiBtn = document.getElementById('generateAiBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  const reportSection = document.getElementById('reportSection');
  const basicMetrics = document.getElementById('basicMetrics');
  const aiResultContainer = document.getElementById('aiResultContainer');
  const auditResult = document.getElementById('auditResult');
  const copyBtn = document.getElementById('copyBtn');
  const statusDiv = document.getElementById('status');

  let currentSeoData = null; 

  const storedKey = localStorage.getItem('geminiApiKey');
  if (storedKey) {
    apiKeyInput.value = storedKey;
  }

  // --- 1. SOLIS: SKENĒT LAPU ---
  if (scanBtn) {
      scanBtn.addEventListener('click', async () => {
        showStatus('Skenē lapu...', 'status');
        
        reportSection.style.display = 'none';
        aiResultContainer.style.display = 'none';
        currentSeoData = null;

        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab) throw new Error('Nav aktīva taba.');

          // Pārbauda, vai lapa nav aizsargāta
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
             throw new Error('Nevar skenēt pārlūka sistēmas lapas.');
          }

          const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });

          if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
            throw new Error('Neizdevās nolasīt datus.');
          }

          currentSeoData = injectionResults[0].result;
          
          renderBasicReport(currentSeoData);
          reportSection.style.display = 'block';
          showStatus('Skenēšana pabeigta.', 'success');

        } catch (error) {
          console.error(error);
          showStatus('Kļūda: ' + error.message, 'error');
        }
      });
  }

  // --- LEJUPIELĀDE ---
  if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        if (!currentSeoData) return;

        const d = currentSeoData;
        const dateStr = new Date().toLocaleString();
        
        let text = `SEO TEHNISKAIS PĀRSKATS\n`;
        text += `Ģenerēts: ${dateStr}\n`;
        text += `URL: ${d.url}\n`;
        text += `---------------------------\n\n`;

        text += `[PAMATDATI]\n`;
        text += `Title: ${d.title}\n`;
        text += `Meta Description: ${d.metaDescription || "NAV"}\n`;
        text += `Robots: ${d.robots}\n`;
        text += `Canonical: ${d.canonical || "NAV"}\n\n`;

        text += `[SATURS]\n`;
        text += `H1: ${d.h1 || "NAV"}\n`;
        text += `Vārdu skaits: ${d.wordCount}\n`;
        text += `Attēli: ${d.imageCount} (bez ALT: ${d.imagesWithoutAlt})\n\n`;

        text += `[VIRSRAKSTI H2 (${d.h2Count})]\n`;
        if (d.h2s) d.h2s.forEach(h => text += `- ${h}\n`);
        
        text += `\n[VIRSRAKSTI H3 (${d.h3Count})]\n`;
        if (d.h3s) d.h3s.forEach(h => text += `- ${h}\n`);

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seo-report.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  // --- 2. SOLIS: AI ANALĪZE ---
  if (generateAiBtn) {
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

        localStorage.setItem('geminiApiKey', apiKey);
        
        showStatus('AI analizē datus...', 'status');
        aiResultContainer.style.display = 'none';
        generateAiBtn.disabled = true;

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
  }

  if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        auditResult.select();
        navigator.clipboard.writeText(auditResult.value).then(() => {
            const original = copyBtn.innerText;
            copyBtn.innerText = 'Nokopēts!';
            setTimeout(() => copyBtn.innerText = original, 2000);
        });
      });
  }

  function showStatus(msg, type) {
    if (statusDiv) {
        statusDiv.textContent = msg;
        statusDiv.className = 'status ' + type;
    }
  }

  // --- RENDERING FUNKCIJA (TABULA) ---
  function renderBasicReport(data) {
    const createRow = (icon, label, value, isGood) => {
        let valueClass = 'metric-value';
        if (isGood === false) valueClass += ' bad';
        if (isGood === true) valueClass += ' good';

        return `
            <div class="metric-row">
                <span class="metric-label">${icon} ${label}</span>
                <span class="${valueClass}">${value}</span>
            </div>`;
    };

    let html = '';
    
    // Meta Dati
    html += `<div class="group-header">Meta & Saturs</div>`;
    const titleLen = data.title ? data.title.length : 0;
    html += createRow('📝', 'Title', data.title || '(Tukšs)', titleLen > 0 && titleLen < 65);
    
    const descLen = data.metaDescription ? data.metaDescription.length : 0;
    html += createRow('📄', 'Description', data.metaDescription || '(Tukšs)', descLen > 50 && descLen < 160);
    
    const robotsGood = data.robots.toLowerCase().includes('noindex') ? false : true;
    html += createRow('🤖', 'Robots Tag', data.robots, robotsGood);

    // Struktūra
    html += `<div class="group-header">Struktūra</div>`;
    html += createRow('🛑', 'H1 Virsraksts', data.h1 || '(Trūkst)', !!data.h1);
    html += createRow('📑', 'H2 / H3', `${data.h2Count} / ${data.h3Count}`, null);
    html += createRow('🔠', 'Vārdu skaits', data.wordCount, data.wordCount > 300);
    
    const imgStatus = (data.imagesWithoutAlt === 0); 
    html += createRow('🖼️', 'Attēli (bez ALT)', `${data.imagesWithoutAlt} / ${data.imageCount}`, imgStatus);

    // Tehniskais
    html += `<div class="group-header">Tehniskais</div>`;
    html += createRow('🔗', 'Canonical URL', data.canonical ? 'Ir' : 'Nav', !!data.canonical);
    html += createRow('🏷️', 'Schema (JSON-LD)', data.hasSchema ? 'Ir' : 'Nav', data.hasSchema);
    html += createRow('📱', 'Mobile Viewport', data.viewport ? 'Ir' : 'Nav', data.viewport);
    
    const ogStatus = data.ogTags.hasTitle && data.ogTags.hasImage;
    html += createRow('👍', 'Open Graph (FB)', ogStatus ? 'Ir' : 'Daļēji/Nav', ogStatus);

    basicMetrics.innerHTML = html;
  }

  async function generateReport(apiKey, tone, data) {
    const prompt = `
      You are an expert SEO Auditor. Analyze this landing page data and write a short, punchy cold-email snippet (in Latvian) pointing out the top 3 critical errors and how fixing them increases revenue.
      Tone: ${tone}
      Data:
      - Title: ${data.title}
      - Meta Desc: ${data.metaDescription}
      - Robots: ${data.robots}
      - H1: ${data.h1}
      - Word Count: ${data.wordCount}
      - Images without Alt: ${data.imagesWithoutAlt} / ${data.imageCount}
      - Body Snippet: "${data.bodySnippet}"
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API kļūda');
    }
    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  }
});
