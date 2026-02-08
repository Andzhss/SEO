document.addEventListener('DOMContentLoaded', () => {
  // UI Elementi
  const scanBtn = document.getElementById('scanBtn');
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  const generateEmailBtn = document.getElementById('generateEmailBtn');
  const setupPanel = document.getElementById('setupPanel');
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  
  const reportSection = document.getElementById('reportSection');
  const statusDiv = document.getElementById('status');
  const domainDisplay = document.getElementById('domainDisplay');
  const aiOutput = document.getElementById('aiOutput');
  const aiSection = document.getElementById('aiSection');

  let currentData = null;

  // Ielādējam API atslēgu
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      setupPanel.style.display = 'none'; // Paslēpjam, ja ir atslēga
    }
  });

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if(key) {
      chrome.storage.local.set({geminiApiKey: key}, () => {
        setupPanel.style.display = 'none';
        showStatus('API atslēga saglabāta!', 'text-success');
      });
    }
  });

  // --- 1. SKENĒŠANA ---
  scanBtn.addEventListener('click', async () => {
    showStatus('Analizēju lapu...', '');
    reportSection.style.display = 'none';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Pārbaude vai nav sistēmas lapa
      if(!tab.url.startsWith('http')) {
        showStatus('Šo lapu nevar skenēt.', 'text-danger');
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      if (!results || !results[0] || !results[0].result) throw new Error('Nav datu');

      currentData = results[0].result;
      renderReport(currentData);
      showStatus('Analīze pabeigta.', 'text-success');

    } catch (e) {
      console.error(e);
      showStatus('Kļūda skenējot: ' + e.message, 'text-danger');
    }
  });

  // --- 2. RENDERING (Attēlošana) ---
  function renderReport(data) {
    reportSection.style.display = 'block';
    domainDisplay.textContent = data.domain;

    // Augšējie rādītāji
    document.getElementById('valSpeed').textContent = data.loadTime;
    document.getElementById('valSpeed').className = parseInt(data.loadTime) > 2000 ? 'val text-danger' : 'val text-success';
    
    document.getElementById('valWords').textContent = data.wordCount;
    document.getElementById('valTech').textContent = data.cms;

    // Detalizētais saraksts
    const list = document.getElementById('detailedMetrics');
    list.innerHTML = '';

    addDetail(list, 'Title Garums', `${data.titleLen} zīmes`, data.titleLen > 10 && data.titleLen < 70);
    addDetail(list, 'Meta Description', data.metaDescription ? 'Ir' : 'NAV', !!data.metaDescription);
    addDetail(list, 'H1 Virsraksts', data.h1Count === 1 ? 'OK' : (data.h1Count === 0 ? 'NAV' : 'Vairāki!'), data.h1Count === 1);
    addDetail(list, 'Attēli bez ALT', data.imagesWithoutAlt, data.imagesWithoutAlt === 0);
    addDetail(list, 'Schema.org', data.schemaTypes, data.schemaTypes !== "Nav atrasts");
    addDetail(list, 'Mobile Friendly', data.mobileFriendly ? 'Jā' : 'Nē', data.mobileFriendly);
    addDetail(list, 'Servera laiks (TTFB)', data.ttfb, parseInt(data.ttfb) < 600);
  }

  function addDetail(container, label, value, isGood) {
    const div = document.createElement('div');
    div.className = 'detail-row';
    const colorClass = isGood ? 'text-success' : 'text-danger';
    div.innerHTML = `<span class="detail-label">${label}</span><span class="detail-val ${colorClass}">${value}</span>`;
    container.appendChild(div);
  }

  // --- 3. AUDITA ĢENERATORS (TXT Fails) ---
  downloadReportBtn.addEventListener('click', () => {
    if (!currentData) return;
    const d = currentData;
    
    // Šī ir tava profesionālā "veidne"
    const lines = [
      `SEO AUDITA PĀRSKATS: ${d.domain}`,
      `Datums: ${new Date().toLocaleDateString()}`,
      `------------------------------------------------`,
      ``,
      `1. KRITISKĀS KĻŪDAS (Jālabo nekavējoties)`,
      `   [${d.h1Count !== 1 ? 'X' : '✓'}] H1 Virsraksts: ${d.h1Count === 0 ? 'TRŪKST (Liela problēma)' : (d.h1Count > 1 ? 'Pārāk daudz (Mulsina Google)' : 'Kārtībā')}`,
      `   [${d.imagesWithoutAlt > 0 ? 'X' : '✓'}] Attēlu optimizācija: ${d.imagesWithoutAlt} attēliem trūkst apraksta (ALT tags).`,
      `   [${parseInt(d.loadTime) > 2500 ? 'X' : '✓'}] Ātrums: Lapa ielādējas ${d.loadTime}. (Ieteicams zem 2500ms).`,
      ``,
      `2. SATURA ANALĪZE`,
      `   - Title Tags: "${d.title}" (${d.titleLen} zīmes).`,
      `   - Meta Description: ${d.metaDescription ? 'Ir' : 'TRŪKST - Tas samazina klikšķus meklētājā.'}`,
      `   - Vārdu skaits: ${d.wordCount} vārdi.`,
      ``,
      `3. TEHNISKAIS STĀVOKLIS`,
      `   - CMS/Platforma: ${d.cms}`,
      `   - Schema Dati: ${d.schemaTypes}`,
      `   - Mobilā versija: ${d.mobileFriendly ? 'Ir' : 'Nav optimizēts (Kritiski!)'}`,
      `   - Servera reakcija (TTFB): ${d.ttfb}`,
      ``,
      `------------------------------------------------`,
      `KOPSAVILKUMS:`,
      `Šai lapai ir potenciāls, bet tehniskās kļūdas traucē tai ierindoties augstāk Google meklētājā.`,
      `Ieteicamais nākamais solis: Veikt pilnu atslēgvārdu izpēti un salabot H1/Attēlu kļūdas.`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.domain}_SEO_Audits.txt`;
    a.click();
  });

  // --- 4. AI EMAIL ĢENERATORS ---
  generateEmailBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value;
    if (!apiKey) {
      showStatus('Ievadi API atslēgu!', 'text-danger');
      setupPanel.style.display = 'block';
      return;
    }
    
    showStatus('Ģenerē e-pastu...', '');
    generateEmailBtn.disabled = true;
    aiSection.style.display = 'block';
    
    const d = currentData;
    // Izceļam lielāko problēmu
    let mainProblem = "vispārēja optimizācija";
    if (d.h1Count !== 1) mainProblem = "lapas struktūra (H1 kļūdas)";
    else if (d.imagesWithoutAlt > 5) mainProblem = "attēlu neesamība Google meklētājā";
    else if (parseInt(d.loadTime) > 3000) mainProblem = "lēna lapas darbība";

    const prompt = `
      You are an SEO expert sales person. Write a short, personalized cold email in Latvian to the owner of ${d.domain}.
      
      Don't sound like a robot. Be direct and helpful.
      
      The Hook: I just visited your site and noticed a problem with ${mainProblem}.
      The Data to mention:
      1. Load speed is ${d.loadTime} (Slow sites lose customers).
      2. Missing Alt tags on ${d.imagesWithoutAlt} images.
      3. ${d.metaDescription ? "Meta description exists but needs review" : "Missing Meta Description (Critical)"}.
      
      Call to action: Ask if I can send them a video showing how to fix this in 5 minutes.
      My Name: [Tavs Vārds]
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const resData = await response.json();
      aiOutput.value = resData.candidates[0].content.parts[0].text;
      showStatus('E-pasts gatavs!', 'text-success');
    } catch (e) {
      aiOutput.value = "Kļūda: " + e.message;
    } finally {
      generateEmailBtn.disabled = false;
    }
  });

  document.getElementById('copyAiBtn').addEventListener('click', () => {
    aiOutput.select();
    document.execCommand('copy');
  });

  function showStatus(msg, className) {
    statusDiv.textContent = msg;
    statusDiv.className = 'status ' + className;
  }
});
