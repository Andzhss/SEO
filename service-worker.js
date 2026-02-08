// service-worker.js

// Ļauj atvērt sānjoslu, noklikšķinot uz ikonas
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
