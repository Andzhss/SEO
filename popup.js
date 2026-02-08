// Funkcija tabulas ģenerēšanai (AR JAUNO DIZAINU)
  function renderBasicReport(data) {
    // Palīgfunkcija rindas izveidei
    const createRow = (icon, label, value, isGood) => {
        let valueClass = 'metric-value';
        if (isGood === false) valueClass += ' bad'; // Sarkans
        if (isGood === true) valueClass += ' good'; // Zaļš

        return `
            <div class="metric-row">
                <span class="metric-label">${icon} ${label}</span>
                <span class="${valueClass}">${value}</span>
            </div>`;
    };

    let html = '';
    
    // --- META DATI ---
    html += `<div class="group-header">Meta & Saturs</div>`;
    
    const titleLen = data.title ? data.title.length : 0;
    html += createRow('📝', 'Title', data.title || '(Tukšs)', titleLen > 0 && titleLen < 65);
    
    const descLen = data.metaDescription ? data.metaDescription.length : 0;
    html += createRow('📄', 'Description', data.metaDescription || '(Tukšs)', descLen > 50 && descLen < 160);
    
    // Pārbauda, vai nav nejauši nobloķēts no Google
    const robotsGood = data.robots.toLowerCase().includes('noindex') ? false : true;
    html += createRow('🤖', 'Robots Tag', data.robots, robotsGood);

    // --- STRUKTŪRA ---
    html += `<div class="group-header">Struktūra</div>`;
    html += createRow('🛑', 'H1 Virsraksts', data.h1 || '(Trūkst)', !!data.h1);
    html += createRow('📑', 'H2 / H3', `${data.h2Count} / ${data.h3Count}`, null);
    html += createRow('🔠', 'Vārdu skaits', data.wordCount, data.wordCount > 300);
    
    const imgStatus = (data.imagesWithoutAlt === 0); 
    html += createRow('🖼️', 'Attēli (bez ALT)', `${data.imagesWithoutAlt} / ${data.imageCount}`, imgStatus);

    // --- TEHNISKAIS ---
    html += `<div class="group-header">Tehniskais</div>`;
    
    html += createRow('🔗', 'Canonical URL', data.canonical ? 'Ir' : 'Nav', !!data.canonical);
    html += createRow('🏷️', 'Schema (JSON-LD)', data.hasSchema ? 'Ir' : 'Nav', data.hasSchema);
    html += createRow('📱', 'Mobile Viewport', data.viewport ? 'Ir' : 'Nav', data.viewport);
    
    const ogStatus = data.ogTags.hasTitle && data.ogTags.hasImage;
    html += createRow('👍', 'Open Graph (FB)', ogStatus ? 'Ir' : 'Daļēji/Nav', ogStatus);

    basicMetrics.innerHTML = html;
  }

    let html = '';
    
    // --- META DATI ---
    html += `<div style="font-weight:bold; margin-top:10px; color:#333;">META & SATURS</div>`;
    
    const titleLen = data.title ? data.title.length : 0;
    html += createRow('Title', data.title || '(Tukšs)', titleLen > 0 && titleLen < 65);
    
    const descLen = data.metaDescription ? data.metaDescription.length : 0;
    html += createRow('Description', data.metaDescription || '(Tukšs)', descLen > 50 && descLen < 160);
    
    // Pārbauda, vai nav nejauši nobloķēts no Google
    const robotsGood = data.robots.toLowerCase().includes('noindex') ? false : true;
    html += createRow('Robots Tag', data.robots, robotsGood);

    // --- STRUKTŪRA ---
    html += `<div style="font-weight:bold; margin-top:10px; color:#333;">STRUKTŪRA</div>`;
    html += createRow('H1', data.h1 || '(Trūkst)', !!data.h1);
    html += createRow('H2 / H3', `${data.h2Count} / ${data.h3Count}`, null);
    html += createRow('Vārdu skaits', data.wordCount, data.wordCount > 300);
    
    const imgStatus = (data.imagesWithoutAlt === 0); 
    html += createRow('Attēli (bez ALT)', `${data.imagesWithoutAlt} / ${data.imageCount}`, imgStatus);

    // --- TEHNISKAIS ---
    html += `<div style="font-weight:bold; margin-top:10px; color:#333;">TEHNISKAIS</div>`;
    
    html += createRow('Canonical', data.canonical ? 'Ir' : 'Nav', !!data.canonical);
    html += createRow('Schema (JSON-LD)', data.hasSchema ? 'Ir' : 'Nav', data.hasSchema);
    html += createRow('Mobile Viewport', data.viewport ? 'Ir' : 'Nav', data.viewport);
    
    const ogStatus = data.ogTags.hasTitle && data.ogTags.hasImage;
    html += createRow('Open Graph (FB)', ogStatus ? 'Ir' : 'Daļēji/Nav', ogStatus);

    basicMetrics.innerHTML = html;
  }
