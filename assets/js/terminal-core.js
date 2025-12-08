(function () {
  const historyEl = document.getElementById("history");
  const promptWrapper = document.getElementById("promptWrapper");
  const inputEl = document.getElementById("cmd");

  if (!historyEl || !promptWrapper || !inputEl) {
    console.error("terminal-core: missing required DOM elements");
    return;
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  function appendLineElement() {
    const div = document.createElement("div");
    div.className = "history-line";
    div.textContent = "";
    historyEl.appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  function addHistoryInstant(text) {
    const div = document.createElement("div");
    div.className = "history-line";
    div.textContent = text;
    historyEl.appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
  }

  async function addHistoryTyped(text, typeSpeedMs) {
    const div = appendLineElement();
    for (let i = 0; i < text.length; i++) {
      div.textContent += text[i];
      if (i % 8 === 0) window.scrollTo(0, document.body.scrollHeight);
      await sleep(typeSpeedMs);
    }
    return div;
  }

  function htmlToPlain(html) {
    const tmp = document.createElement("span");
    tmp.innerHTML = html;
    const plain = (tmp.textContent || "").trim();
    tmp.remove();
    return plain;
  }

  async function addHistoryTypedHTML(html, typeSpeedMs) {
    const plain = htmlToPlain(html);
    const div = appendLineElement();
    for (let i = 0; i < plain.length; i++) {
      div.textContent += plain[i];
      if (i % 8 === 0) window.scrollTo(0, document.body.scrollHeight);
      await sleep(typeSpeedMs);
    }
    div.innerHTML = html;
    return div;
  }

  async function typeLines(lines, typeSpeedMs, linePauseMs) {
    for (const line of lines) {
      if (typeof line === "function") {
        await addHistoryTypedHTML(line(), typeSpeedMs);
      } else if (line === "") {
        addHistoryInstant("");
      } else {
        await addHistoryTyped(line, typeSpeedMs);
      }
      await sleep(linePauseMs);
    }
  }

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

  function lockInput() {
    inputEl.disabled = true;
    inputEl.blur();
  }

  function unlockInput() {
    inputEl.disabled = false;
    promptWrapper.classList.remove("hidden");
    inputEl.value = "";
    inputEl.focus();
  }

  function focusInput() {
    if (!inputEl.disabled) inputEl.focus();
  }

  function getConfigPath() {
    const script = document.querySelector("script[data-config]");
    return script ? script.getAttribute("data-config") : null;
  }

  async function loadConfig() {
    const path = getConfigPath();
    if (!path) throw new Error("terminal-core: data-config attribute missing");
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("terminal-core: failed to load config " + path);
    return await res.json();
  }

  async function runBoot(cfg) {
    const {
      current,
      typeSpeedMs = 18,
      linePauseMs = 120,
      bootPauseMs = 220,
      bootLines = [],
      payloadText = ""
    } = cfg;

    const defaultBoot = [
      () => `<span class="muted">node:</span> /${current} <span class="dim">// address chain</span>`,
      "",
      "[init] terminal online",
      "[net ] route table sync: degraded",
      "[dbg ] computing payload...",
      "",
      "[payload] index:value",
      ""
    ];

    await sleep(bootPauseMs);
    await typeLines(bootLines.length ? bootLines : defaultBoot, typeSpeedMs, linePauseMs);

    await sleep(bootPauseMs * 2);

    const payloadLines = String(payloadText || "").split("\n");
    for (const pl of payloadLines) {
      if (pl === "") addHistoryInstant("");
      else await addHistoryTyped(pl, typeSpeedMs);
      await sleep(linePauseMs);
    }

    addHistoryInstant("");
    await addHistoryTyped("[dbg ] input unlocked", typeSpeedMs);
    addHistoryInstant("");
    await addHistoryTyped("type the next endpoint", typeSpeedMs);
    addHistoryInstant("");
  }

  async function navigateWithCountdown(cfg, endpoint) {
    const {
      typeSpeedMs = 18,
      linePauseMs = 120,
      navDelaySec = 10
    } = cfg;

    await typeLines([
      "[ok  ] route accepted",
      "[note] log endpoint: /" + endpoint,
      "[note] recommended: record this node before the merge phase"
    ], typeSpeedMs, linePauseMs);

    let remaining = navDelaySec;
    const countdownLine = addHistoryInstant("[sys ] switching to /" + endpoint + " in " + remaining + "s...");

    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        countdownLine.textContent = "[sys ] transferring control -> /" + endpoint;
        window.location.href = "./" + endpoint + "/";
        return;
      }
      countdownLine.textContent = "[sys ] switching to /" + endpoint + " in " + remaining + "s...";
    }, 1000);
  }

  async function handleLine(cfg, line) {
    const {
      expected,
      acceptAliases = [],
      typeSpeedMs = 18,
      bootPauseMs = 220
    } = cfg;

    addHistoryInstant("guest@nocturne:~$ " + line);

    const endpoint = normalizeEndpoint(line);
    if (!endpoint) {
      await addHistoryTyped("[err ] empty input", typeSpeedMs);
      return;
    }

    await addHistoryTyped("[dbg ] resolving route...", typeSpeedMs);
    await sleep(bootPauseMs);

    const aliases = new Set([
      String(expected || "").toLowerCase(),
      ...acceptAliases.map(a => String(a).toLowerCase())
    ]);

    if (aliases.has(endpoint)) {
      lockInput();
      await navigateWithCountdown(cfg, endpoint);
    } else {
      await addHistoryTyped("[err ] route rejected", typeSpeedMs);
    }
  }

  async function init() {
    inputEl.disabled = true;

    const cfg = await loadConfig();

    await runBoot(cfg);
    unlockInput();

    window.addEventListener("click", focusInput);

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const line = inputEl.value;
        inputEl.value = "";
        handleLine(cfg, line);
      }
    });

    focusInput();
  }

  window.addEventListener("load", () => {
    init().catch(err => {
      console.error(err);
      addHistoryInstant("[err ] terminal boot failure");
    });
  });
})();
