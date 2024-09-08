(function () {
  // List of all possible HTML element types
  const elementTypes = [
    HTMLElement,
    HTMLAnchorElement,
    HTMLAreaElement,
    HTMLAudioElement,
    HTMLBRElement,
    HTMLBaseElement,
    HTMLBodyElement,
    HTMLButtonElement,
    HTMLCanvasElement,
    HTMLDListElement,
    HTMLDataElement,
    HTMLDataListElement,
    HTMLDialogElement,
    HTMLDivElement,
    HTMLEmbedElement,
    HTMLFieldSetElement,
    HTMLFontElement,
    HTMLFormElement,
    HTMLFrameElement,
    HTMLFrameSetElement,
    HTMLHRElement,
    HTMLHeadElement,
    HTMLHeadingElement,
    HTMLHtmlElement,
    HTMLIFrameElement,
    HTMLImageElement,
    HTMLInputElement,
    HTMLLIElement,
    HTMLLabelElement,
    HTMLLegendElement,
    HTMLLinkElement,
    HTMLMapElement,
    HTMLMarqueeElement,
    HTMLMediaElement,
    HTMLMenuElement,
    HTMLMetaElement,
    HTMLMeterElement,
    HTMLModElement,
    HTMLOListElement,
    HTMLObjectElement,
    HTMLOptGroupElement,
    HTMLOptionElement,
    HTMLOutputElement,
    HTMLParagraphElement,
    HTMLParamElement,
    HTMLPictureElement,
    HTMLPreElement,
    HTMLProgressElement,
    HTMLQuoteElement,
    HTMLScriptElement,
    HTMLSelectElement,
    HTMLSourceElement,
    HTMLSpanElement,
    HTMLStyleElement,
    HTMLTableCaptionElement,
    HTMLTableCellElement,
    HTMLTableColElement,
    HTMLTableElement,
    HTMLTableRowElement,
    HTMLTableSectionElement,
    HTMLTemplateElement,
    HTMLTextAreaElement,
    HTMLTimeElement,
    HTMLTitleElement,
    HTMLTrackElement,
    HTMLUListElement,
    HTMLUnknownElement,
    HTMLVideoElement,
    SVGElement,
    Element,
    Document,
    Window,
  ];

  // Function to aggressively override all possible event-related properties and methods
  function overrideAllEvents(prototype) {
    const allProperties = Object.getOwnPropertyNames(prototype);

    allProperties.forEach((prop) => {
      if (
        prop.startsWith("on") &&
        !["onmousedown", "onmousemove", "onmouseup", "onscroll"].includes(prop)
      ) {
        Object.defineProperty(prototype, prop, {
          get: function () {
            return function () {
              return true;
            };
          },
          set: function () {},
          configurable: true,
        });
      }
    });
  }

  // Override events for all element types
  elementTypes.forEach((elementType) => {
    overrideAllEvents(elementType.prototype);
  });

  // Override global objects
  overrideAllEvents(window);
  overrideAllEvents(document);
  overrideAllEvents(EventTarget.prototype);

  // Modify addEventListener to allow specific events
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (["scroll", "mousedown", "mousemove", "mouseup"].includes(type)) {
      return originalAddEventListener.call(
        this,
        type,
        function (event) {
          if (type !== "scroll") {
            event.preventDefault();
            event.stopPropagation();
          }
          listener.call(this, event);
        },
        options
      );
    }
    // For other event types, do nothing
    return function () {};
  };

  // Aggressive CSS to disable interactions
  const style = document.createElement("style");
  style.textContent = `
    * {
      pointer-events: none !important;
      user-select: none !important;
      cursor: crosshair !important;
    }
    *::-webkit-scrollbar, *::-webkit-scrollbar-thumb, *::-webkit-scrollbar-track {
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);

  // Function to enable scrolling on scrollable elements
  function enableScrollingOnScrollableElements() {
    const elements = document.querySelectorAll("*");
    elements.forEach((el) => {
      if (
        el.tagName === "DIV" ||
        el.tagName === "MAIN" ||
        el.tagName === "SECTION" ||
        el.tagName === "ARTICLE" ||
        el.tagName === "ASIDE" ||
        el.tagName === "NAV" ||
        el.tagName === "HEADER" ||
        el.tagName === "FOOTER" ||
        el.tagName === "TABLE"
      ) {
        if (
          el.scrollHeight > el.clientHeight ||
          el.scrollWidth > el.clientWidth
        ) {
          el.style.setProperty("pointer-events", "auto", "important");
          el.style.setProperty("overflow", "auto", "important");
        }
      } else {
        return; // Excludes all other elements
      }
    });
  }

  // Run the function initially and on window resize
  enableScrollingOnScrollableElements();
  window.addEventListener("resize", enableScrollingOnScrollableElements);

  // Create an overlay div
  const overlay = document.createElement("canvas");
  overlay.id = "ui-copilot-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    padding: "0",
    margin: "0",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "2147483647",
    pointerEvents: "none",
  });
  document.body.insertBefore(overlay, document.body.firstChild);

  // Add event listeners for mouse events on the window
  ["mousedown", "mousemove", "mouseup", "scroll"].forEach((eventType) => {
    window.addEventListener(
      eventType,
      function (event) {
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  });

  const ctx = overlay.getContext("2d");
  if (!ctx) return;

  let isDrawing = false;
  let hasDrawn = false;
  let startX = 0;
  let startY = 0;

  // Function to set canvas size
  function setCanvasSize() {
    overlay.width = window.innerWidth;
    overlay.height = window.innerHeight;
    fillCanvasExcludingRect(0, 0, 0, 0);
  }

  // Set initial canvas size and update on window resize
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  // Fill the overlay with the tint initially
  fillCanvasExcludingRect(0, 0, 0, 0);

  function fillCanvasExcludingRect(x, y, width, height) {
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, overlay.width, overlay.height);
    ctx.rect(x, y, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill("evenodd");
    ctx.restore();

    if (width !== 0 && height !== 0) {
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.rect(x, y, width, height);
      ctx.stroke();
    }
  }

  function getMousePos(evt) {
    return {
      x: evt.clientX,
      y: evt.clientY,
    };
  }

  function handleMouseDown(e) {
    hasDrawn = false;
    isDrawing = true;
    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
  }

  function handleMouseMove(e) {
    if (!isDrawing || !ctx) return;
    const pos = getMousePos(e);
    const width = Math.abs(pos.x - startX);
    const height = Math.abs(pos.y - startY);
    const x = Math.min(startX, pos.x);
    const y = Math.min(startY, pos.y);
    fillCanvasExcludingRect(x, y, width, height);
  }

  function handleMouseUp(e) {
    isDrawing = false;
    hasDrawn = true;
    if (!ctx) return;
    const pos = getMousePos(e);
    const width = Math.abs(pos.x - startX);
    const height = Math.abs(pos.y - startY);
    const x = Math.min(startX, pos.x);
    const y = Math.min(startY, pos.y);

    chrome.runtime.sendMessage({
      type: "CAPTURE_SCREENSHOT",
      rect: {
        x,
        y,
        width,
        height,
        devicePixelRatio: window.devicePixelRatio,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
    });
  }

  function handleScroll() {
    if (hasDrawn) {
      fillCanvasExcludingRect(0, 0, 0, 0);
    }
  }

  function cropScreenshot(dataUrl, rect) {
    fetch(dataUrl)
      .then((response) => response.blob())
      .then((blob) => createImageBitmap(blob))
      .then(async (imageBitmap) => {
        console.log("Image processed successfully");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const { x, y, width, height, devicePixelRatio } = rect;

        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;

        ctx.drawImage(
          imageBitmap,
          x * devicePixelRatio,
          y * devicePixelRatio,
          width * devicePixelRatio,
          height * devicePixelRatio,
          0,
          0,
          width * devicePixelRatio,
          height * devicePixelRatio
        );

        const croppedDataUrl = canvas.toDataURL();

        console.info(
          "Cropped image data URL:",
          croppedDataUrl.substring(0, 100) + "..."
        );

        // Create a link element and trigger download
        const a = document.createElement("a");
        a.href = croppedDataUrl;
        a.download = "screenshot.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clear the overlay
        // fillCanvasExcludingRect(0, 0, 0, 0);

        try {
          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          console.log("Image copied to clipboard successfully");
          showNotification("Image copied to clipboard!");
        } catch (err) {
          console.error("Failed to copy image to clipboard:", err);
          showNotification("Failed to copy image to clipboard");
        }
      })
      .catch((error) => {
        console.error("Error processing image:", error);
        showNotification("Error processing image");
      });
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 16px;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 16px;
    transition: opacity 0.5s ease-in-out;
  `;
    document.body.appendChild(notification);

    // Fade out and remove the notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CROP_SCREENSHOT") {
      cropScreenshot(message.dataUrl, message.rect);
    }
  });

  window.addEventListener("mousedown", handleMouseDown, true);
  window.addEventListener("mousemove", handleMouseMove, true);
  window.addEventListener("mouseup", handleMouseUp, true);
  window.addEventListener("scroll", handleScroll, true);
})();
