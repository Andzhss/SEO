const fs = require('fs');
const vm = require('vm');

console.log("Running content.js tests...");

// Mock Document
const mockDocument = {
  title: "Test Page Title",
  querySelector: (selector) => {
    if (selector === 'meta[name="description"]') return { getAttribute: () => "Test Meta Description" };
    if (selector === 'h1') return { innerText: "Test H1" };
    return null;
  },
  querySelectorAll: (selector) => {
    if (selector === 'h2') return [{}, {}]; // 2 H2s
    if (selector === 'h3') return [{}, {}, {}]; // 3 H3s
    if (selector === 'img') return [
      { hasAttribute: () => true, getAttribute: () => "alt text" },
      { hasAttribute: () => false, getAttribute: () => null }, // No alt attribute
      { hasAttribute: () => true, getAttribute: () => "" },    // Empty alt attribute
      { hasAttribute: () => true, getAttribute: () => "  " }   // Whitespace alt attribute
    ];
    return [];
  },
  body: {
    innerText: "This is the body text. It has some words. " + "word ".repeat(200)
  }
};

// Read content.js
const contentJsCode = fs.readFileSync('content.js', 'utf8');

// Create context with mock document
const context = {
  document: mockDocument,
  console: console
};

vm.createContext(context);
const result = vm.runInContext(contentJsCode, context);

console.log("Scraped Data:", result);

// Assertions
try {
  if (result.title !== "Test Page Title") throw new Error(`Title mismatch: expected "Test Page Title", got "${result.title}"`);
  if (result.metaDescription !== "Test Meta Description") throw new Error(`Meta mismatch: expected "Test Meta Description", got "${result.metaDescription}"`);
  if (result.h1 !== "Test H1") throw new Error(`H1 mismatch: expected "Test H1", got "${result.h1}"`);
  if (result.h2Count !== 2) throw new Error(`H2 count mismatch: expected 2, got ${result.h2Count}`);
  if (result.h3Count !== 3) throw new Error(`H3 count mismatch: expected 3, got ${result.h3Count}`);
  
  // 1 no attribute, 1 empty, 1 whitespace = 3 images without valid alt text.
  // Let's check my content.js logic:
  // if (!img.hasAttribute("alt") || img.getAttribute("alt").trim() === "")
  // no attribute -> true
  // empty -> true
  // whitespace -> trim() === "" -> true
  // "alt text" -> false
  // So expected is 3.
  if (result.imagesWithoutAlt !== 3) throw new Error(`Images without alt mismatch: expected 3, got ${result.imagesWithoutAlt}`);

  console.log("Content.js logic verified successfully!");
} catch (e) {
  console.error("Test failed:", e.message);
  process.exit(1);
}
