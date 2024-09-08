# Simple Screenshot

#### Video Demo: https://youtu.be/rKi5wMLXEr4

#### Description: A simple screenshot tool that allows the user to take a screenshot of specific areas of any webpage.

## Simple Screenshot Browser Extension

This browser extension allows users to capture screenshots of specific areas on any webpage. It accomplishes this by creating an overlay on top of the page and handling user interactions to define the screenshot area. Let's break down the key components and how they work together.

### Extension Structure

The extension consists of three main parts:

manifest.json: Defines the extension's properties and permissions.
service-worker.js: Handles background tasks and communication.
content-script.js: Injects the screenshot functionality into web pages.
Activation and Injection
When the user clicks the extension icon:

The chrome.action.onClicked listener in service-worker.js is triggered.
It uses chrome.scripting.executeScript to inject and run content-script.js in the active tab.
Content Script Functionality
The content script is the core of the extension, implementing the screenshot capture logic:

### Overlay Creation

const overlay = document.createElement("canvas");
overlay.id = "ui-copilot-overlay";
// ... (style properties)
document.body.insertBefore(overlay, document.body.firstChild);
This creates a full-page canvas element that serves as the overlay for drawing the selection area.

### Event Overriding

To prevent interactions with the underlying page while allowing specific events for screenshot selection, the script overrides various event-related properties and methods:

function overrideAllEvents(prototype) {
const allProperties = Object.getOwnPropertyNames(prototype);
allProperties.forEach((prop) => {
if (prop.startsWith("on") && !["onmousedown", "onmousemove", "onmouseup", "onscroll"].includes(prop)) {
Object.defineProperty(prototype, prop, { /_ ... _/ });
}
});
}

// Apply to all relevant HTML element types
elementTypes.forEach((elementType) => {
overrideAllEvents(elementType.prototype);
});
This function aggressively overrides all event-related properties except for the ones needed for screenshot selection.

### Event Listeners

The script adds custom event listeners for mouse events and scrolling:

window.addEventListener("mousedown", handleMouseDown, true);
window.addEventListener("mousemove", handleMouseMove, true);
window.addEventListener("mouseup", handleMouseUp, true);
window.addEventListener("scroll", handleScroll, true);
These listeners manage the drawing of the selection area and trigger the screenshot capture process.

### Drawing the Selection Area

As the user clicks and drags, the handleMouseMove function updates the overlay:

function handleMouseMove(e) {
if (!isDrawing || !ctx) return;
const pos = getMousePos(e);
const width = Math.abs(pos.x - startX);
const height = Math.abs(pos.y - startY);
const x = Math.min(startX, pos.x);
const y = Math.min(startY, pos.y);
fillCanvasExcludingRect(x, y, width, height);
}
This function calculates the dimensions of the selection area and calls fillCanvasExcludingRect to update the overlay visuals.

### Capturing the Screenshot

When the user releases the mouse button, handleMouseUp is triggered:

function handleMouseUp(e) {
// ... (calculate dimensions)
chrome.runtime.sendMessage({
type: "CAPTURE_SCREENSHOT",
rect: {
x, y, width, height,
devicePixelRatio: window.devicePixelRatio,
scrollX: window.scrollX,
scrollY: window.scrollY,
viewportWidth: window.innerWidth,
viewportHeight: window.innerHeight,
},
});
}
This sends a message to the service worker to capture the visible tab.

### Service Worker Role

The service worker listens for the "CAPTURE_SCREENSHOT" message:

chrome.runtime.onMessage.addListener((message, sender, \_) => {
if (message.type === "CAPTURE_SCREENSHOT") {
chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
chrome.tabs.sendMessage(sender.tab.id, {
type: "CROP_SCREENSHOT",
dataUrl: dataUrl,
rect: message.rect,
});
});
}
return true;
});
It captures the entire visible tab and sends the result back to the content script for cropping.

### Image Processing and Output

The content script receives the full screenshot and processes it:

function cropScreenshot(dataUrl, rect) {
// ... (create canvas and crop image)
const croppedDataUrl = canvas.toDataURL();

// Trigger download
const a = document.createElement("a");
a.href = croppedDataUrl;
a.download = "screenshot.png";
a.click();

// Copy to clipboard
canvas.toBlob(async (blob) => {
await navigator.clipboard.write([
new ClipboardItem({ "image/png": blob }),
]);
showNotification("Image copied to clipboard!");
});
}
This function crops the full screenshot to the selected area, triggers a download, and copies the image to the clipboard.

### Additional Features

Scrollable Elements: The extension enables scrolling on elements that have overflow content:

function enableScrollingOnScrollableElements() {
const elements = document.querySelectorAll("_");
elements.forEach((el) => {
if (/_ ... conditions ... \*/) {
el.style.setProperty("pointer-events", "auto", "important");
el.style.setProperty("overflow", "auto", "important");
}
});
}

### Notifications: The extension shows a notification when the image is copied to the clipboard:

function showNotification(message) {
const notification = document.createElement("div");
// ... (style and append notification)
setTimeout(() => {
notification.style.opacity = "0";
setTimeout(() => {
document.body.removeChild(notification);
}, 500);
}, 3000);
}

### Taking it further

This Simple Screenshot extension provides a solid foundation that can be expanded in numerous ways to create a more feature-rich tool:

- Annotation Tools: Add drawing capabilities to allow users to highlight, circle, or add text to their screenshots before saving. This could include simple shapes, freehand drawing, and text insertion.
- OCR Integration: Implement Optical Character Recognition to extract text from the captured screenshot, enabling easy copying of text content.
- Multiple Selection Areas: Allow users to select multiple areas on a page for a combined screenshot, useful for comparing different sections.
- Delayed Capture: Add a timer feature for capturing screenshots after a set delay, useful for capturing hover states or temporary UI elements.
- Full Page Capture: Extend the functionality to capture entire web pages, including content outside the visible viewport, by programmatically scrolling and stitching images together.
- Cloud Integration: Offer direct uploading to cloud storage services like Google Drive or Dropbox, or image hosting sites like Imgur.
- Video Capture: Expand the tool to record short video clips of user interactions on the page.
- Privacy Features: Implement automatic blurring of sensitive information like email addresses or phone numbers in the captured screenshots.
- Collaboration Tools: Add features to easily share and collaborate on screenshots within teams, including commenting and version tracking.
- Browser Sync: Synchronize screenshots and settings across different devices using the user's browser account.
