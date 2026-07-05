// Poolpad — a Poolsuite-style notepad window for poolsuite.net.
// Reuses Poolsuite's own compiled Tailwind classes so the window chrome
// matches the native ones. Only classes observed in their live DOM are
// used; anything custom is applied via inline styles.

(() => {
  const LS_TEXT = "poolpad:text";
  const LS_FONT = "poolpad:fontSize";
  const LS_POS = "poolpad:pos";
  const LS_OPEN = "poolpad:open";

  // Close-button "X" icon lifted from Poolsuite's own title bar.
  const X_ICON =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOAQMAAAAlhr+SAAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAB1JREFUCNdjOMADQgYGIMRzAISYGYAIwoaIQ9QAAKYLB+eSH+asAAAAAElFTkSuQmCC";

  // Pixel-art notepad icon for the dock (crisp-edges keeps the retro look).
  const DOCK_ICON =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" shape-rendering="crispEdges">
        <rect x="5" y="2" width="21" height="28" fill="#000"/>
        <rect x="6" y="3" width="19" height="26" fill="#fff"/>
        <rect x="6" y="3" width="19" height="4" fill="#7fcdc2"/>
        <rect x="9" y="1" width="2" height="4" fill="#000"/>
        <rect x="15" y="1" width="2" height="4" fill="#000"/>
        <rect x="21" y="1" width="2" height="4" fill="#000"/>
        <rect x="9" y="10" width="13" height="1" fill="#000"/>
        <rect x="9" y="13" width="13" height="1" fill="#000"/>
        <rect x="9" y="16" width="13" height="1" fill="#000"/>
        <rect x="9" y="19" width="9" height="1" fill="#000"/>
        <rect x="9" y="22" width="11" height="1" fill="#000"/>
        <rect x="9" y="25" width="6" height="1" fill="#000"/>
      </svg>`
    );

  // ---- helpers -------------------------------------------------------------

  const el = (tag, className, styleText) => {
    const n = document.createElement(tag);
    if (className) n.setAttribute("class", className);
    if (styleText) n.style.cssText = styleText;
    return n;
  };

  const loadPos = () => {
    try {
      const p = JSON.parse(localStorage.getItem(LS_POS));
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return p;
    } catch (_) {}
    return { x: 120, y: 60 };
  };

  // ---- window --------------------------------------------------------------

  let win, textarea, layer;

  // Poolsuite brings a window forward by bumping z-index on its layer wrapper
  // (the absolute inset-0 div); mirror that so stacking interleaves naturally
  // with native windows.
  function bringToFront() {
    const layers = layer.parentElement.children;
    let max = 0;
    for (const l of layers) {
      if (l === layer) continue;
      const z = parseInt(l.style.zIndex, 10);
      if (Number.isFinite(z) && z > max) max = z;
    }
    layer.style.zIndex = String(max + 1);
  }

  function buildWindow(layerHost) {
    layer = el("div", "h-full w-full inset-0 absolute pointer-events-none");

    const pos = loadPos();
    win = el(
      "div",
      // Verbatim Poolsuite window chrome classes (minus vdr drag/resize hooks,
      // which are Vue-managed — drag is reimplemented below).
      "flex flex-col pointer-events-auto border bg-secondary border-black rounded-md p-1.5 shadow-is-component"
    );
    win.id = "component-is-poolpad";
    win.style.cssText = `position:absolute;transform:translate(${pos.x}px,${pos.y}px);width:640px;height:460px;`;
    win.addEventListener("pointerdown", bringToFront);
    if (localStorage.getItem(LS_OPEN) !== "1") win.style.display = "none";

    // Title bar — same structure as native windows.
    const header = el("div", "drag-header flex p-1.5 -m-1.5 mb-0 relative z-[1]", "cursor:default;");
    const closeBtn = el(
      "button",
      "w-[18px] h-[18px] flex items-center justify-center -ml-px active:bg-white focus:outline-none active:invert rounded-[2px] focus-visible:invert focus-visible:bg-white"
    );
    const xImg = el("img", "w-[7px] pointer-events-none");
    xImg.src = X_ICON;
    closeBtn.appendChild(xImg);
    closeBtn.addEventListener("click", () => setOpen(false));

    const titleWrap = el("div", "flex-1 flex justify-end items-center");
    const title = el("h2", "uppercase font-ishmeria leading-[14px] tracking-[-1px] pr-[5px]");
    title.textContent = "Poolpad";
    titleWrap.appendChild(title);
    header.append(closeBtn, titleWrap);

    // Toolbar: font size +/- and download.
    const toolbar = el(
      "div",
      "flex items-center gap-2 font-everyday text-[10px] tracking-[-1px]",
      "margin:8px 0 6px;"
    );
    const mkBtn = (label, titleText) => {
      const b = el(
        "button",
        "focus:outline-none active:invert rounded-[2px]",
        "border:1px solid #000;background:#fff;padding:2px 8px;line-height:14px;cursor:pointer;"
      );
      b.textContent = label;
      b.title = titleText;
      return b;
    };
    const smaller = mkBtn("A-", "Decrease font size");
    const bigger = mkBtn("A+", "Increase font size");
    const download = mkBtn("Download .txt", "Download your notes");
    const sizeLabel = el("span", "", "opacity:.6;");
    toolbar.append(smaller, bigger, sizeLabel, el("div", "flex-1"), download);

    // Editor.
    const editorWrap = el(
      "div",
      "flex-1 flex rounded-[2px]",
      "border:1px solid #000;background:#fff;overflow:hidden;min-height:0;"
    );
    textarea = el(
      "textarea",
      "flex-1 focus:outline-none",
      "resize:none;border:none;background:transparent;padding:10px;width:100%;" +
        // Pixolde is Poolsuite's own body-text font (track names, guestbook).
        'font-family:Pixolde,Monaco,monospace;line-height:1.5;color:#111;'
    );
    textarea.placeholder = "Type something summery…";
    textarea.spellcheck = false;
    textarea.value = localStorage.getItem(LS_TEXT) || "";
    editorWrap.appendChild(textarea);

    win.append(header, toolbar, editorWrap);
    layer.appendChild(win);
    layerHost.appendChild(layer);

    // --- behavior ---

    let fontSize = parseInt(localStorage.getItem(LS_FONT), 10) || 16;
    const applyFont = () => {
      fontSize = Math.min(40, Math.max(9, fontSize));
      textarea.style.fontSize = fontSize + "px";
      sizeLabel.textContent = fontSize + "px";
      localStorage.setItem(LS_FONT, String(fontSize));
    };
    smaller.addEventListener("click", () => { fontSize -= 1; applyFont(); });
    bigger.addEventListener("click", () => { fontSize += 1; applyFont(); });
    applyFont();

    textarea.addEventListener("input", () => {
      localStorage.setItem(LS_TEXT, textarea.value);
    });

    download.addEventListener("click", () => {
      const blob = new Blob([textarea.value], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "poolpad.txt";
      a.click();
      URL.revokeObjectURL(url);
    });

    // Drag via the title bar.
    let drag = null;
    header.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      drag = { sx: e.clientX, sy: e.clientY, ...loadPos() };
      header.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    header.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const x = drag.x + e.clientX - drag.sx;
      const y = drag.y + e.clientY - drag.sy;
      win.style.transform = `translate(${x}px,${y}px)`;
    });
    header.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const x = drag.x + e.clientX - drag.sx;
      const y = drag.y + e.clientY - drag.sy;
      localStorage.setItem(LS_POS, JSON.stringify({ x, y }));
      drag = null;
    });
  }

  function setOpen(open) {
    win.style.display = open ? "" : "none";
    localStorage.setItem(LS_OPEN, open ? "1" : "0");
    if (open) {
      bringToFront();
      textarea.focus();
    }
  }

  // ---- dock button ---------------------------------------------------------

  function buildDockButton(dockUl, dockOuter) {
    // The dock bar has a fixed md width sized for 9 items (9 × 80 = 720px).
    // Widen it by one slot so the new button fits.
    if (dockOuter) dockOuter.style.width = "802px";

    const li = el(
      "li",
      "md:w-[80px] md:h-[80px] w-[72px] h-[72px] flex items-center justify-center -mr-[10px] md:-mb-[10px] md:mr-0 group"
    );
    const btn = el(
      "button",
      "focus:outline-none group w-full h-full flex items-center justify-center md:border-r border-black group-last:border-r-0 md:shadow-is-button-dock md:active:shadow-is-button-dock-active"
    );
    const inner = el(
      "div",
      "pointer-events-none flex items-center justify-center flex-col gap-1 md:group-active:top-px relative"
    );
    const iconBox = el("div", "flex items-center justify-center aspect-square w-8 h-8 mt-1 md:-mt-1 relative");
    const icon = el("img", "aspect-square relative", "image-rendering:pixelated;width:32px;height:32px;");
    icon.src = DOCK_ICON;
    icon.alt = "Poolpad";
    iconBox.appendChild(icon);
    const label = el("span", "relative font-everyday text-[10px] tracking-[-1px] p-[3px] py-[2px]");
    label.textContent = "Poolpad";
    inner.append(iconBox, label);
    btn.appendChild(inner);
    li.appendChild(btn);
    // Second slot, right after Player. The dock stays centered because it is
    // positioned with left-1/2 / -translate-x-1/2, which tracks the new width.
    dockUl.insertBefore(li, dockUl.children[1] || null);

    btn.addEventListener("click", () => setOpen(win.style.display === "none"));
  }

  // ---- boot ----------------------------------------------------------------

  // Poolsuite is a Vue SPA with a boot animation; poll until the desktop exists.
  let tries = 0;
  const timer = setInterval(() => {
    if (++tries > 240) return clearInterval(timer);
    if (document.getElementById("component-is-poolpad")) return clearInterval(timer);

    const layerHost = document.querySelector("#injection-wrapper > div");
    const dockIcon = document.querySelector('ul li button img[src^="/dock/"], ul li button img[src*="/dock/"]');
    if (!layerHost || !dockIcon) return;

    const dockUl = dockIcon.closest("ul");
    const dockOuter = [...document.querySelectorAll("div")].find((d) =>
      (d.getAttribute("class") || "").includes("md:w-[722px]")
    );

    clearInterval(timer);
    buildWindow(layerHost);
    buildDockButton(dockUl, dockOuter);
  }, 500);
})();
