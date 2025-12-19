(function () {
  const historyEl = document.getElementById("history");
  const inputEl = document.getElementById("hiddenCmd");

  if (!historyEl || !inputEl) {
    console.error("terminal-core: missing #history or #hiddenCmd");
    return;
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  /* -----------------------------
     Line creation + classification
  ------------------------------ */

  function classifyLine(div) {
    const t = (div.textContent || "").trimStart();

    if (t.startsWith("[crit")) div.classList.add("line-crit");
    else if (t.startsWith("[err")) div.classList.add("line-err");
    else if (t.startsWith("[!!")) div.classList.add("line-err");
    else if (t.startsWith("[warn")) div.classList.add("line-warn");
    else if (t.startsWith("[ok")) div.classList.add("line-ok");
    else if (t.startsWith("[note")) div.classList.add("line-note");
    else if (t.startsWith("[flag")) div.classList.add("line-flag");
    else if (t.startsWith("[mem")) div.classList.add("line-mem");
    else if (t.startsWith("[dbg")) div.classList.add("line-dbg");
    else if (t.startsWith("[init")) div.classList.add("line-init");
    else if (t.startsWith("[payload")) div.classList.add("line-payload");
    else if (t.startsWith("[in")) div.classList.add("line-in");
    else if (t.startsWith("[sys")) div.classList.add("line-info"); // alias
    else if (t.startsWith("[log")) div.classList.add("line-dbg");  // optional alias
    else if (t.startsWith("[info")) div.classList.add("line-info");
    else div.classList.add("line-info");

    // Semantic overrides
    if (t.includes("route rejected")) {
      div.classList.remove("line-dbg", "line-info", "line-note");
      div.classList.add("line-err");
    }
    if (t.includes("route accepted")) {
      div.classList.remove("line-dbg", "line-info", "line-note");
      div.classList.add("line-ok");
    }
  }

  function addLine(text) {
    const div = document.createElement("div");
    div.className = "history-line";
    div.textContent = text;
    historyEl.appendChild(div);
    classifyLine(div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  function addBlankLine() {
    const div = addLine("\u00A0"); // NBSP so it always occupies height
    div.classList.add("line-blank");
    return div;
  }


  async function typeLine(text, speed) {
    const div = document.createElement("div");
    div.className = "history-line";
    div.textContent = "";
    historyEl.appendChild(div);

    const s = String(text ?? "");
    for (let i = 0; i < s.length; i++) {
      div.textContent += s[i];
      if (i % 8 === 0) window.scrollTo(0, document.body.scrollHeight);
      await sleep(speed);
    }

    classifyLine(div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  async function typeLines(lines, speed, pause) {
    for (const line of lines) {
      if (line === "") {
        addBlankLine();
      } else {
        await typeLine(line, speed);
      }
      await sleep(pause);
    }
  }

  /* -----------------------------
     Config loading
  ------------------------------ */

  function getConfigPath() {
    const script = document.querySelector("script[data-config]");
    return script ? script.getAttribute("data-config") : null;
  }

  async function loadConfig() {
    const path = getConfigPath();
    if (!path) throw new Error("missing data-config attribute");
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("failed to load config: " + path);
    return await res.json();
  }

  /* -----------------------------
     Live input line (appended late)
  ------------------------------ */

  let liveLineEl = null;
  let liveTypedEl = null;

  function removeLiveLine() {
    if (liveLineEl && liveLineEl.parentNode) {
      liveLineEl.parentNode.removeChild(liveLineEl);
    }
    liveLineEl = null;
    liveTypedEl = null;
  }

  function createLiveLine() {
    removeLiveLine();

    const line = document.createElement("div");
    line.className = "history-line";

    const awaiting = document.createElement("span");
    awaiting.className = "muted";
    awaiting.textContent = "awaiting input";

    const space = document.createElement("span");
    space.textContent = " ";

    const typed = document.createElement("span");

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");

    line.appendChild(awaiting);
    line.appendChild(space);
    line.appendChild(typed);
    line.appendChild(cursor);

    // Tap/click the "awaiting input" line to focus the real input (mobile keyboard)
    line.style.cursor = "text";
    line.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      focusInput(true);
    });

    historyEl.appendChild(line);
    window.scrollTo(0, document.body.scrollHeight);

    liveLineEl = line;
    liveTypedEl = typed;
  }

  function lockInput() {
    inputEl.disabled = true;
    inputEl.blur();
    inputEl.value = "";
    removeLiveLine();
  }

  function unlockInput() {
    inputEl.disabled = false;
    inputEl.value = "";
    createLiveLine();
    // Don't aggressively focus here; mobile often needs a user gesture anyway.
    // We'll refocus via pointerdown / blur handlers below.
  }

  function focusInput(fromUserGesture = false) {
    if (inputEl.disabled) return;

    // Focus immediately; desktop doesn't need the extra retries
    inputEl.focus({ preventScroll: true });

    // iOS sometimes needs repeats when called from a gesture
    if (fromUserGesture) {
      requestAnimationFrame(() => inputEl.focus({ preventScroll: true }));
      setTimeout(() => inputEl.focus({ preventScroll: true }), 50);
    }
  }

  /* -----------------------------
     Endpoint parsing + routing
  ------------------------------ */

  function normalizeEndpoint(raw) {
    if (!raw) return "";
    let s = raw.trim().toLowerCase();

    if (s.startsWith("https://")) s = s.slice(8);
    else if (s.startsWith("http://")) s = s.slice(7);

    if (s.indexOf(".") !== -1) {
      const idx = s.indexOf("/");
      if (idx !== -1) s = s.slice(idx + 1);
    }

    while (s.startsWith("/")) s = s.slice(1);
    s = s.split(" ").join("");
    while (s.endsWith("/")) s = s.slice(0, -1);

    return s;
  }

  async function navigateWithCountdown(cfg, endpoint) {
    const speed = cfg.typeSpeedMs ?? 18;
    const pause = cfg.linePauseMs ?? 120;
    const navDelaySec = cfg.navDelaySec ?? 10;

    await typeLines([
      "[ok  ] route accepted",
      "[note] log endpoint: /" + endpoint,
      "[note] recommended: record this node before the merge phase"
    ], speed, pause);

    let remaining = navDelaySec;
    const countdownLine = addLine("[sys ] switching to /" + endpoint + " in " + remaining + "s...");

    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        countdownLine.textContent = "[sys ] transferring control -> /" + endpoint;
        window.location.href = "/" + endpoint + "/";
        return;
      }
      countdownLine.textContent = "[sys ] switching to /" + endpoint + " in " + remaining + "s...";
    }, 1000);
  }

  async function handleLine(cfg, line) {
    const speed = cfg.typeSpeedMs ?? 18;
    const pauseMs = cfg.bootPauseMs ?? 220;

    removeLiveLine();
    addLine("[in  ] " + line);

    const endpoint = normalizeEndpoint(line);
    if (!endpoint) {
      await typeLine("[err ] empty input", speed);
      unlockInput();
      return;
    }

    await typeLine("[dbg ] resolving route...", speed);
    await sleep(pauseMs);

    const expected = String(cfg.expected || "").toLowerCase();
    const aliases = new Set([
      expected,
      ...(cfg.acceptAliases || []).map(a => String(a).toLowerCase())
    ]);

    if (aliases.has(endpoint)) {
      lockInput();
      await navigateWithCountdown(cfg, endpoint);
    } else {
      await typeLine("[err ] route rejected", speed);
      unlockInput();
    }
  }

  /* -----------------------------
     Boot sequence
  ------------------------------ */

  async function runBoot(cfg) {
    const current = cfg.current ?? "node";
    const speed = cfg.typeSpeedMs ?? 18;
    const pause = cfg.linePauseMs ?? 120;
    const bootPauseMs = cfg.bootPauseMs ?? 220;

    const defaultBoot = [
    "node: /" + current + " // address chain",
    "",
    "[init] terminal online",
    "[net ] route table sync: degraded",
    "[dbg ] computing payload...",
    "",
    "[payload] index:value",
    ""
    ];

    const bootLinesRaw = (Array.isArray(cfg.bootLines) && cfg.bootLines.length)
    ? cfg.bootLines
    : defaultBoot;

    // Normalize to strings and defensively trim leading blanks
    const bootLines = bootLinesRaw.map(x => String(x ?? ""));

    // Remove any leading empty/whitespace-only lines
    while (bootLines.length && bootLines[0].trim() === "") {
    bootLines.shift();
    }

    await sleep(bootPauseMs);
    await typeLines(bootLines, speed, pause);

    await sleep(bootPauseMs);

    const payloadText = String(cfg.payloadText || "");
    const payloadLines = payloadText.split("\n");

    for (const pl of payloadLines) {
      if (pl === "") addBlankLine();
      else await typeLine(pl, speed);
      await sleep(pause);
    }

    addBlankLine();
    await typeLine("[dbg ] input unlocked", speed);
  }

  /* -----------------------------
     Init
  ------------------------------ */

  async function init() {
    lockInput();

    let cfg;
    try {
      cfg = await loadConfig();
    } catch (e) {
      addLine("[err ] config load failure");
      addLine("[hint] check data-config path");
      return;
    }

    await runBoot(cfg);

    unlockInput();

    inputEl.addEventListener("input", () => {
      if (liveTypedEl) liveTypedEl.textContent = inputEl.value;
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const line = inputEl.value;
        inputEl.value = "";
        if (liveTypedEl) liveTypedEl.textContent = "";
        handleLine(cfg, line);
      }
    });

    // Focus on interaction (best for mobile). Keep it scoped to the terminal area
    const terminalEl = document.getElementById("terminal") || document.body;

    terminalEl.addEventListener(
      "pointerdown",
      (e) => {
        if (inputEl.disabled) return;

        // If you ever add real interactives, let them work normally
        if (e.target && e.target.closest && e.target.closest("a,button,input,textarea,select,label")) {
          return;
        }

        // Critical: stop the click from taking focus away from the input
        e.preventDefault();

        focusInput(true);
      },
      { passive: false } // required so preventDefault actually works
    );
    // If focus ever drops while unlocked, snap it back
    inputEl.addEventListener("blur", () => {
      if (inputEl.disabled) return;
      setTimeout(() => focusInput(false), 0);
      setTimeout(() => focusInput(false), 50);
    });

    // Initial attempt (desktop will work; mobile may need a tap)
    focusInput(false);

  }

  window.addEventListener("DOMContentLoaded", () => {
    init().catch(err => {
      console.error(err);
      addLine("[err ] terminal boot failure");
      addLine("[hint] check JSON validity");
    });
  });
})();
