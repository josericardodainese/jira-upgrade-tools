(() => {
  const STORAGE_KEY = "jira-upgrade-tools:collapsed-columns";
  const BUTTON_CLASS = "jut-collapse-column";
  const COLLAPSED_CLASS = "jut-column-collapsed";

  const normalize = (v) => (v || "").replace(/\s+/g, " ").trim();
  const readState = () => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  };
  const writeState = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));

  function candidateHeaders() {
    const selectors = [
      "[data-testid*='column'] [role='heading']",
      "[data-testid*='column'] h1,[data-testid*='column'] h2,[data-testid*='column'] h3,[data-testid*='column'] h4",
      "[role='group'] [role='heading']",
      "h1,h2,h3,h4,h5,h6,[role='heading']"
    ];
    return [...new Set(document.querySelectorAll(selectors.join(",")))];
  }

  function findColumn(heading) {
    let el = heading;
    for (let i = 0; i < 10 && el; i++, el = el.parentElement) {
      const r = el.getBoundingClientRect();
      if (r.width >= 120 && r.width <= 420 && r.height >= 250) {
        const parent = el.parentElement;
        if (!parent) continue;
        const siblings = [...parent.children].filter((x) => {
          const sr = x.getBoundingClientRect();
          return sr.width >= 120 && sr.width <= 420 && sr.height >= 250;
        });
        if (siblings.length >= 2) return el;
      }
    }
    return null;
  }

  function headerHost(heading, column) {
    let el = heading.parentElement;
    while (el && el !== column) {
      const r = el.getBoundingClientRect();
      if (r.height >= 28 && r.height <= 90 && r.width > 100) return el;
      el = el.parentElement;
    }
    return heading.parentElement || heading;
  }

  function install() {
    const collapsed = readState();
    const seen = new Set();

    for (const heading of candidateHeaders()) {
      const column = findColumn(heading);
      if (!column || seen.has(column) || column.dataset.jutCollapsible === "true") continue;

      const title = normalize(heading.textContent);
      if (!title || title.length > 80) continue;

      seen.add(column);
      column.dataset.jutCollapsible = "true";
      column.dataset.jutColumnTitle = title;

      const host = headerHost(heading, column);
      host.classList.add("jut-column-header");

      const button = document.createElement("button");
      button.type = "button";
      button.className = BUTTON_CLASS;
      button.title = "Colapsar coluna";
      button.innerHTML = "<span aria-hidden='true'>‹</span>";
      host.appendChild(button);

      const setCollapsed = (value) => {
        column.classList.toggle(COLLAPSED_CLASS, value);
        button.innerHTML = value ? "<span aria-hidden='true'>›</span>" : "<span aria-hidden='true'>‹</span>";
        button.title = value ? `Expandir ${title}` : `Colapsar ${title}`;
        button.setAttribute("aria-label", button.title);
        if (value) collapsed.add(title); else collapsed.delete(title);
        writeState(collapsed);
      };

      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCollapsed(!column.classList.contains(COLLAPSED_CLASS));
      });

      setCollapsed(collapsed.has(title));
    }
  }

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(install, 100);
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("resize", install);
  install();
})();
