(() => {
  const STORAGE_KEY = "jira-upgrade-tools:collapsed-columns";
  const BUTTON_CLASS = "jut-collapse-column";
  const COLLAPSED_CLASS = "jut-column-collapsed";

  const readState = () => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  };

  const writeState = (state) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state]));

  const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();

  function findColumns() {
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading']")];
    return headings.map((heading) => {
      const title = normalize(heading.textContent);
      if (!title) return null;

      let node = heading;
      for (let i = 0; i < 7 && node?.parentElement; i++, node = node.parentElement) {
        const el = node.parentElement;
        const rect = el.getBoundingClientRect();
        if (rect.width >= 120 && rect.width <= 500 && rect.height > 180) {
          const style = getComputedStyle(el);
          if (style.display === "flex" || style.display === "block") {
            return { column: el, heading, title };
          }
        }
      }
      return null;
    }).filter(Boolean);
  }

  function install() {
    const collapsed = readState();

    for (const { column, heading, title } of findColumns()) {
      if (column.dataset.jutCollapsible === "true") continue;
      column.dataset.jutCollapsible = "true";
      column.dataset.jutColumnTitle = title;

      const button = document.createElement("button");
      button.type = "button";
      button.className = BUTTON_CLASS;
      button.setAttribute("aria-label", `Colapsar coluna ${title}`);
      button.title = "Colapsar/expandir coluna";
      button.textContent = "‹";

      heading.parentElement?.appendChild(button);

      const setCollapsed = (value) => {
        column.classList.toggle(COLLAPSED_CLASS, value);
        button.textContent = value ? "›" : "‹";
        button.setAttribute("aria-expanded", String(!value));
        button.setAttribute("aria-label", `${value ? "Expandir" : "Colapsar"} coluna ${title}`);
        if (value) collapsed.add(title); else collapsed.delete(title);
        writeState(collapsed);
      };

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCollapsed(!column.classList.contains(COLLAPSED_CLASS));
      });

      if (collapsed.has(title)) setCollapsed(true);
    }
  }

  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(install, 150);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();
