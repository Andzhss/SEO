(function() {
  const data = {};

  // --- 1. PAMATDATI & URL ---
  data.url = window.location.href;
  data.domain = window.location.hostname;
  data.title = document.title || "";
  data.titleLen = data.title.length;

  const metaDesc = document.querySelector('meta[name="description"]');
  data.metaDescription = metaDesc ? metaDesc.getAttribute("content") : "";
  data.metaDescLen = data.metaDescription ? data.metaDescription.length : 0;

  const canonical = document.querySelector('link[rel="canonical"]');
  data.canonical = canonical ? canonical.getAttribute("href") : "";

  // --- 2. TEHNOLOĢIJAS & ĀTRUMS (jauns) ---
  // Mēģinām uzminēt CMS (WordPress, Shopify, etc.)
  data.cms = "Nevar noteikt";
  if (document.querySelector('meta[name="generator"]')) {
      const gen = document.querySelector('meta[name="generator"]').getAttribute("content");
      if (gen.toLowerCase().includes("wordpress")) data.cms = "WordPress";
      if (gen.toLowerCase().includes("shopify")) data.cms = "Shopify";
      if (gen.toLowerCase().includes("wix")) data.cms = "Wix";
  } else if (document.body.innerHTML.includes("wp-content")) {
      data.cms = "WordPress";
  }

  // Ielādes ātrums (Navigation Timing API)
  const navEntry = performance.getEntriesByType("navigation")[0];
  data.loadTime = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) + " ms" : "N/A";
  data.ttfb = navEntry ? Math.round(navEntry.responseStart - navEntry.startTime) + " ms" : "N/A"; // Servera reakcijas laiks

  // --- 3. SATURA STRUKTŪRA ---
  const h1 = document.querySelector("h1");
  data.h1 = h1 ? h1.innerText.trim() : "";
  data.h1Count = document.querySelectorAll("h1").length;

  const h2Elements = document.querySelectorAll("h2");
  data.h2Count = h2Elements.length;
  // Saglabājam tikai pirmos 5 H2 priekš pārskata
  data.h2Sample = Array.from(h2Elements).slice(0, 5).map(el => el.innerText.trim());

  // Saites
  const allLinks = Array.from(document.querySelectorAll("a"));
  data.totalLinks = allLinks.length;
  data.internalLinks = allLinks.filter(a => a.href.includes(window.location.hostname)).length;
  data.externalLinks = data.totalLinks - data.internalLinks;
  
  // Vārdu skaits
  const bodyText = document.body.innerText || "";
  data.wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;

  // --- 4. ATTĒLI ---
  const images = document.querySelectorAll("img");
  let noAltCount = 0;
  let hugeImages = 0; // Bildes bez izmēriem vai potenciāli lielas
  
  images.forEach(img => {
    if (!img.hasAttribute("alt") || img.getAttribute("alt").trim() === "") {
      noAltCount++;
    }
    // Pārbaude, vai bildei ir width/height atribūti (CLS novēršanai)
    if (!img.hasAttribute("width") || !img.hasAttribute("height")) {
        hugeImages++;
    }
  });
  data.imageCount = images.length;
  data.imagesWithoutAlt = noAltCount;
  data.imagesNoDimensions = hugeImages;

  // --- 5. TEHNISKĀS PĀRBAUDES ---
  const robots = document.querySelector('meta[name="robots"]');
  data.robots = robots ? robots.getAttribute("content") : "Index/Follow (Noklusētais)";

  const viewport = document.querySelector('meta[name="viewport"]');
  data.mobileFriendly = !!viewport; 

  // Schema.org analīze (Advanced)
  const schemas = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
          const json = JSON.parse(script.innerText);
          if (json['@type']) {
              schemas.push(json['@type']);
          } else if (json['@graph']) {
              json['@graph'].forEach(g => {
                  if (g['@type']) schemas.push(g['@type']);
              });
          }
      } catch (e) {}
  });
  data.schemaTypes = schemas.length > 0 ? schemas.join(", ") : "Nav atrasts";

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  data.hasSocialTags = !!ogTitle;

  // Iegūstam tekstu priekš AI (tikai svarīgāko)
  data.bodySnippet = bodyText.substring(0, 800).replace(/\s+/g, " ").trim();

  return data;
})();
