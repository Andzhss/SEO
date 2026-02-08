(function() {
  const data = {};

  // URL
  data.url = window.location.href;

  // Title
  data.title = document.title || "";

  // Meta Description
  const metaDesc = document.querySelector('meta[name="description"]');
  data.metaDescription = metaDesc ? metaDesc.getAttribute("content") : "";

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  data.canonical = canonical ? canonical.getAttribute("href") : "";

  // H1
  const h1 = document.querySelector("h1");
  data.h1 = h1 ? h1.innerText.trim() : "";

  // H2 - Iegūstam gan skaitu, gan tekstu sarakstu
  const h2Elements = document.querySelectorAll("h2");
  data.h2Count = h2Elements.length;
  data.h2s = Array.from(h2Elements).map(el => el.innerText.trim()).filter(text => text.length > 0);

  // H3 - Iegūstam gan skaitu, gan tekstu sarakstu
  const h3Elements = document.querySelectorAll("h3");
  data.h3Count = h3Elements.length;
  data.h3s = Array.from(h3Elements).map(el => el.innerText.trim()).filter(text => text.length > 0);

  // Links count
  data.linkCount = document.querySelectorAll("a").length;

  // Body text 
  const bodyText = document.body.innerText || "";
  
  // Word count
  data.wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  // Snippet
  data.bodySnippet = bodyText.substring(0, 1000).replace(/\s+/g, " ").trim();

  // Images analysis
  const images = document.querySelectorAll("img");
  let noAltCount = 0;
  images.forEach(img => {
    if (!img.hasAttribute("alt") || img.getAttribute("alt").trim() === "") {
      noAltCount++;
    }
  });
  data.imageCount = images.length;
  data.imagesWithoutAlt = noAltCount;

  return data;
})();
