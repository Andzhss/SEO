(function() {
  const data = {};

  // --- 1. PAMATDATI ---
  data.url = window.location.href;
  data.title = document.title || "";
  
  const metaDesc = document.querySelector('meta[name="description"]');
  data.metaDescription = metaDesc ? metaDesc.getAttribute("content") : "";

  const canonical = document.querySelector('link[rel="canonical"]');
  data.canonical = canonical ? canonical.getAttribute("href") : "";

  // --- 2. SATURA STRUKTŪRA ---
  const h1 = document.querySelector("h1");
  data.h1 = h1 ? h1.innerText.trim() : "";

  // H2 un H3
  const h2Elements = document.querySelectorAll("h2");
  data.h2Count = h2Elements.length;
  data.h2s = Array.from(h2Elements).map(el => el.innerText.trim()).filter(t => t.length > 0);

  const h3Elements = document.querySelectorAll("h3");
  data.h3Count = h3Elements.length;
  data.h3s = Array.from(h3Elements).map(el => el.innerText.trim()).filter(t => t.length > 0);

  // Saites un vārdi
  data.linkCount = document.querySelectorAll("a").length;
  const bodyText = document.body.innerText || "";
  data.wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;
  data.bodySnippet = bodyText.substring(0, 1000).replace(/\s+/g, " ").trim();

  // Attēli
  const images = document.querySelectorAll("img");
  let noAltCount = 0;
  images.forEach(img => {
    if (!img.hasAttribute("alt") || img.getAttribute("alt").trim() === "") {
      noAltCount++;
    }
  });
  data.imageCount = images.length;
  data.imagesWithoutAlt = noAltCount;

  // --- 3. JAUNĀS TEHNISKĀS PĀRBAUDES ---
  
  // Robots Tag (Kritiski!)
  const robots = document.querySelector('meta[name="robots"]');
  data.robots = robots ? robots.getAttribute("content") : "Nav norādīts (Index/Follow)";

  // Viewport (Mobile)
  const viewport = document.querySelector('meta[name="viewport"]');
  data.viewport = !!viewport; // true/false

  // Favicon
  const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  data.favicon = !!favicon;

  // Open Graph (Sociālie tīkli)
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  data.ogTags = {
    hasTitle: !!ogTitle,
    hasImage: !!ogImage
  };

  // Schema.org (JSON-LD)
  const schema = document.querySelector('script[type="application/ld+json"]');
  data.hasSchema = !!schema;

  return data;
})();
