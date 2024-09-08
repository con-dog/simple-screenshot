(async function () {
  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
      },
      files: ["content-script.js"],
      injectImmediately: true,
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, _) => {
    if (message.type === "CAPTURE_SCREENSHOT") {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        // Send the full screenshot back to the content script
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "CROP_SCREENSHOT",
          dataUrl: dataUrl,
          rect: message.rect,
        });
      });
    }
    return true; // Indicates that the response is sent asynchronously
  });
})();
