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

  // H2 and H3 counts
  data.h2Count = document.querySelectorAll("h2").length;
  data.h3Count = document.querySelectorAll("h3").length;

  // Links count
  data.linkCount = document.querySelectorAll("a").length;

  // Body text for word count and snippet
  const bodyText = document.body.innerText || "";
  
  // Word count
  data.wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  // First 1000 chars of visible body text (for AI context)
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
