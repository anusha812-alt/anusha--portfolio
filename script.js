/* =========================================================
   Anusha M portfolio: all interaction logic
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. Runs immediately: theme and JS flag ---------- */
  const root = document.documentElement;
  const THEME_KEY = "anusha-portfolio-theme";

  // Storage can throw in private or restricted browsing, so wrap it
  const store = {
    get() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } },
    set(value) { try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* theme still works for this visit */ } }
  };
  if (store.get() === "light") root.dataset.theme = "light";
  root.classList.add("js");

  /* ---------- 2. Everything that needs the page ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    $("#year").textContent = new Date().getFullYear();

    /* ----- Theme toggle ----- */
    const themeButton = $("#themeToggle");
    let redrawNetwork = () => {};
    function applyTheme(theme) {
      root.dataset.theme = theme;
      themeButton.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
      $('meta[name="theme-color"]').content = theme === "dark" ? "#0b1033" : "#eef1fc";
      redrawNetwork();
    }
    applyTheme(root.dataset.theme);
    themeButton.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      store.set(next);
    });

    /* ----- Split hero name into animated letters ----- */
    const title = $(".split");
    const words = title.textContent.trim().split(" ");
    title.setAttribute("aria-label", words.join(" "));
    title.textContent = "";
    let letterIndex = 0;
    words.forEach((word, w) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      wordSpan.setAttribute("aria-hidden", "true");
      [...word].forEach((letter) => {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = letter;
        span.style.setProperty("--i", letterIndex++);
        wordSpan.appendChild(span);
      });
      title.appendChild(wordSpan);
      if (w < words.length - 1) title.append(" ");
    });

    /* ----- Scroll reveals with staggering; reset when fully off screen ----- */
    $$(".stagger").forEach((group) => {
      $$(".reveal", group).forEach((el, i) => el.style.setProperty("--delay", `${i * 90}ms`));
    });
    $$(".hero .reveal").forEach((el, i) => el.style.setProperty("--delay", `${150 + i * 100}ms`));

    function startReveals() {
      const targets = [...$$(".reveal"), title];
      if (!("IntersectionObserver" in window)) {
        targets.forEach((el) => el.classList.add("in"));
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.08) entry.target.classList.add("in");
          else if (!entry.isIntersecting && !entry.target.contains(document.activeElement)) {
            entry.target.classList.remove("in");
          }
        });
      }, { threshold: [0, 0.08] });
      targets.forEach((el) => observer.observe(el));
    }
    // Keyboard users must never focus invisible content
    document.addEventListener("focusin", (event) => {
      const hidden = event.target.closest(".reveal");
      if (hidden) hidden.classList.add("in");
    });

    /* ----- Loading screen ----- */
    const loader = $("#loader");
    let loaded = false;
    function finishLoading() {
      if (loaded) return;
      loaded = true;
      loader.classList.add("done");
      startReveals();
      // Enable tilt once the hero entrance has completed
      setTimeout(() => $$(".tilt").forEach((el) => el.classList.add("settled")), 1500);
    }
    const minimumTime = reducedMotion ? 0 : 1200;
    window.addEventListener("load", () => setTimeout(finishLoading, Math.max(0, minimumTime - performance.now())));
    setTimeout(finishLoading, 3000); // never wait on slow web fonts

    /* ----- Animated counters (replay each time the strip returns) ----- */
    const stats = $(".stats");
    const counters = $$("[data-count]");
    let frames = [];
    function runCounters() {
      counters.forEach((el, i) => {
        const end = Number(el.dataset.count);
        const decimals = Number(el.dataset.decimals || 0);
        let start = null;
        const step = (time) => {
          start = start || time;
          const t = Math.min((time - start) / 1400, 1);
          el.textContent = (end * (1 - Math.pow(1 - t, 3))).toFixed(decimals);
          if (t < 1) frames[i] = requestAnimationFrame(step);
        };
        cancelAnimationFrame(frames[i]);
        frames[i] = requestAnimationFrame(step);
      });
    }
    if (!reducedMotion && "IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { if (entry.isIntersecting) runCounters(); }, { threshold: 0.4 }).observe(stats);
    }

    /* ----- Rotating hero focus ----- */
    const rotator = $("#rotator");
    const focusAreas = ["IoT & Cybersecurity", "Blockchain Technology", "Python programming", "user-friendly design"];
    let focusIndex = 0;
    if (!reducedMotion) {
      setInterval(() => {
        if (document.hidden) return;
        rotator.classList.add("out");
        setTimeout(() => {
          focusIndex = (focusIndex + 1) % focusAreas.length;
          rotator.textContent = focusAreas[focusIndex];
          rotator.classList.remove("out");
        }, 360);
      }, 3200);
    }

    /* ----- Mobile menu ----- */
    const nav = $("#nav");
    const menuButton = $("#menuToggle");
    $$("li", nav).forEach((li, i) => li.style.setProperty("--i", i));
    function setMenu(open) {
      nav.classList.toggle("open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    menuButton.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("click", (e) => { if (!e.target.closest("#header")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menuButton.focus(); }
    });

    /* ----- Scroll: progress bar, header, active link, timeline ----- */
    const header = $("#header");
    const progress = $("#progress");
    const pill = $("#navPill");
    const links = $$("a", nav);
    const sections = links.map((link) => $(link.getAttribute("href")));
    const timeline = $("#timeline");
    let activeIndex = -1;
    let ticking = false;

    function movePill() {
      const link = links[activeIndex];
      if (!link) return;
      pill.style.width = `${link.offsetWidth}px`;
      pill.style.transform = `translateX(${link.offsetLeft}px)`;
    }
    function onScroll() {
      ticking = false;
      const max = root.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      header.classList.toggle("scrolled", window.scrollY > 24);

      let current = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) current = i;
      });
      if (window.scrollY >= max - 4) current = sections.length - 1;
      if (current !== activeIndex) {
        activeIndex = current;
        links.forEach((link, i) => {
          link.classList.toggle("active", i === current);
          if (i === current) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
        movePill();
      }

      const box = timeline.getBoundingClientRect();
      const drawn = Math.min(Math.max((window.innerHeight * 0.75 - box.top) / box.height, 0), 1);
      timeline.style.setProperty("--line-progress", reducedMotion ? 1 : drawn.toFixed(3));
    }
    function requestScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
    window.addEventListener("scroll", requestScroll, { passive: true });
    window.addEventListener("resize", () => { requestScroll(); movePill(); if (window.innerWidth > 1000) setMenu(false); });
    if (document.fonts) document.fonts.ready.then(movePill);
    onScroll();

    /* ----- Two-factor locker demo (illustration only) ----- */
    const DEMO_CODE = "2580";
    const locker = $("#locker");
    const finger = $("#finger");
    const fingerLabel = $("#fingerLabel");
    const keypad = $("#keypad");
    const status = $("#lockerStatus");
    const dots = $$("#pinDots i");
    let entry = "";
    let verified = false;
    let busy = false;

    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Reset"].forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = key;
      button.dataset.key = key;
      if (key.length > 1) button.className = "wide";
      button.disabled = key !== "Reset";
      keypad.appendChild(button);
    });
    const showDots = () => dots.forEach((dot, i) => dot.classList.toggle("on", i < entry.length));
    const enableKeys = (on) => $$("button", keypad).forEach((b) => { if (b.dataset.key !== "Reset") b.disabled = !on; });
    let scanTimer;
    function resetLocker() {
      clearTimeout(scanTimer);
      entry = ""; verified = false; busy = false;
      locker.dataset.state = "idle";
      finger.classList.remove("ok", "scanning");
      finger.disabled = false;
      fingerLabel.textContent = "1. Tap to scan fingerprint";
      status.textContent = "Locker closed. Start with the fingerprint scan.";
      enableKeys(false);
      showDots();
    }
    finger.addEventListener("click", () => {
      if (busy || verified) return;
      busy = true;
      finger.classList.add("scanning");
      status.textContent = "Simulating fingerprint scan…";
      scanTimer = setTimeout(() => {
        busy = false; verified = true;
        finger.classList.replace("scanning", "ok");
        finger.disabled = true;
        fingerLabel.textContent = "Fingerprint step passed";
        status.textContent = "2. Enter the 4-digit demo code on the keypad.";
        enableKeys(true);
      }, 1300);
    });
    function pressKey(key) {
      if (key === "Reset") { resetLocker(); return; }
      if (!verified || locker.dataset.state === "open") return;
      if (key === "Clear") { entry = ""; showDots(); return; }
      if (entry.length >= 4) return;
      if (locker.dataset.state === "error") {
        locker.dataset.state = "idle";
        status.textContent = "2. Enter the 4-digit demo code on the keypad.";
      }
      entry += key;
      showDots();
      if (entry.length < 4) return;
      if (entry === DEMO_CODE) {
        locker.dataset.state = "open";
        status.textContent = "Both steps passed. Locker open! Press Reset to try again.";
        enableKeys(false);
      } else {
        locker.dataset.state = "error";
        status.textContent = "Wrong code. The locker stays closed. Try again.";
        entry = "";
        showDots();
      }
    }
    keypad.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (button) pressKey(button.dataset.key);
    });
    // Physical number keys work while focus is inside the demo
    locker.addEventListener("keydown", (e) => {
      if (/^[0-9]$/.test(e.key)) pressKey(e.key);
      if (e.key === "Backspace" && verified) { entry = entry.slice(0, -1); showDots(); }
    });

    /* ----- Skills donut and category filter ----- */
    const donut = $("#donut");
    const groups = $$(".skill-group");
    const total = groups.reduce((sum, g) => sum + $$("li", g).length, 0);
    const radius = 78;
    const circumference = 2 * Math.PI * radius;
    const colors = { programming: "--cyan", databases: "--amber", security: "--pink", iot: "--violet", tools: "--green" };
    let offset = 0;
    const arcs = {};
    groups.forEach((group) => {
      const share = ($$("li", group).length / total) * circumference;
      const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const attrs = { cx: 100, cy: 100, r: radius, "stroke-dasharray": `${share - 4} ${circumference - share + 4}`, "stroke-dashoffset": -offset, transform: "rotate(-90 100 100)" };
      Object.entries(attrs).forEach(([name, value]) => arc.setAttribute(name, value));
      arc.style.stroke = `var(${colors[group.dataset.cat]})`;
      donut.appendChild(arc);
      arcs[group.dataset.cat] = arc;
      offset += share;
    });
    function filterSkills(filter) {
      let count = total;
      let label = "skills in total";
      groups.forEach((group) => {
        const match = group.dataset.cat === filter;
        group.classList.toggle("selected", match);
        group.classList.toggle("dimmed", filter !== "all" && !match);
        arcs[group.dataset.cat].classList.toggle("focus", match);
        arcs[group.dataset.cat].classList.toggle("dim", filter !== "all" && !match);
        if (match) { count = $$("li", group).length; label = group.dataset.name; }
      });
      $("#donutNumber").textContent = count;
      $("#donutLabel").textContent = label;
      $$(".filters button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
    }
    $(".filters").addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) return;
      filterSkills(button.dataset.filter);
      // On stacked layouts, bring the chosen group into view
      const target = $(`.skill-group[data-cat="${button.dataset.filter}"]`);
      if (target && window.innerWidth <= 1000) {
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      }
    });

    /* ----- Project dialogs ----- */
    function closeModal(dialog) {
      dialog.classList.remove("show");
      setTimeout(() => dialog.close(), reducedMotion ? 0 : 250);
    }
    $$("[data-open]").forEach((button) => button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.open);
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add("locked");
      requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add("show")));
    }));
    $$(".modal").forEach((dialog) => {
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog || e.target.closest("[data-close]")) closeModal(dialog);
      });
      dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeModal(dialog); });
      dialog.addEventListener("close", () => {
        dialog.classList.remove("show");
        document.body.classList.remove("locked");
      });
    });

    /* ----- Copy to clipboard (with fallback for file:// pages) ----- */
    const toast = $("#toast");
    let toastTimer;
    function notify(message) {
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
    }
    function legacyCopy(text) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
      return ok;
    }
    $$("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
      const text = button.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; }
      catch (e) { ok = legacyCopy(text); button.focus(); }
      notify(ok ? `Copied ${text}` : "Copy failed. Select the text and copy it manually.");
    }));

    /* ----- Pointer effects: spotlight, magnetic buttons, tilt ----- */
    if (finePointer && !reducedMotion) {
      $$(".spotlight").forEach((card) => card.addEventListener("pointermove", (e) => {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - box.left}px`);
        card.style.setProperty("--my", `${e.clientY - box.top}px`);
      }));
      $$(".magnetic").forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const box = el.getBoundingClientRect();
          el.style.setProperty("--tx", `${(e.clientX - box.left - box.width / 2) * 0.12}px`);
          el.style.setProperty("--ty", `${(e.clientY - box.top - box.height / 2) * 0.2}px`);
        });
        el.addEventListener("pointerleave", () => { el.style.removeProperty("--tx"); el.style.removeProperty("--ty"); });
      });
      $$(".tilt").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--ry", `${((e.clientX - box.left) / box.width - 0.5) * 5}deg`);
          card.style.setProperty("--rx", `${(0.5 - (e.clientY - box.top) / box.height) * 5}deg`);
        });
        card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
      });
    }

    /* ----- Background: a quiet network of connected nodes ----- */
    const canvas = $("#network");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width, height, nodes = [], rafId = null;
    const pointer = { x: -999, y: -999 };

    function sizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width * ratio; canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(70, Math.floor((width * height) / 20000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25
      }));
    }
    let color = "";
    function draw(move) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color; ctx.strokeStyle = color;
      nodes.forEach((a, i) => {
        if (move) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;
        }
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j <= nodes.length; j++) {
          const b = j === nodes.length ? pointer : nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 130) {
            ctx.globalAlpha = (1 - distance / 130) * 0.25;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      });
    }
    function animate() { draw(true); rafId = requestAnimationFrame(animate); }
    redrawNetwork = () => { color = getComputedStyle(root).getPropertyValue("--cyan").trim(); draw(false); };
    sizeCanvas();
    redrawNetwork();
    if (!reducedMotion) animate();
    // Pause when the tab is hidden to save battery
    document.addEventListener("visibilitychange", () => {
      if (reducedMotion) return;
      cancelAnimationFrame(rafId);
      if (!document.hidden) animate();
    });
    let resizeTimer;
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Ignore small height changes caused by mobile browser toolbars
        if (window.innerWidth === lastWidth && Math.abs(window.innerHeight - height) < 120) return;
        lastWidth = window.innerWidth;
        sizeCanvas(); draw(false);
      }, 200);
    });
    if (finePointer) {
      window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
      root.addEventListener("pointerleave", () => { pointer.x = pointer.y = -999; });
    }
  });
})();
