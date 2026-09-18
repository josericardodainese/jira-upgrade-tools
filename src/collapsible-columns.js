(() => {
  console.log("[Jira Upgrade Tools] extensão carregada — collapsible columns");

  const STORAGE_KEY = "jira-upgrade-tools:collapsed-columns";
  const COLUMN = '[data-testid="platform-board-kit.ui.column.draggable-column.styled-wrapper"]';
  const HEADER = '[data-testid="platform-board-kit.common.ui.column-header.header.column-header-container"]';
  const TITLE = '[data-testid="platform-board-kit.common.ui.column-header.editable-title.column-title.column-name"]';

  const collapsed = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  })();
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));

  function setCollapsed(column, title, value) {
    column.classList.toggle("jut-column-collapsed", value);
    const rail = column.querySelector(":scope > .jut-collapsed-rail");
    if (rail) {
      rail.textContent = "›";
      rail.title = `Expandir ${title}`;
      rail.setAttribute("aria-label", rail.title);
    }
    if (value) collapsed.add(title); else collapsed.delete(title);
    save();
  }

  function install() {
    const columns = [...document.querySelectorAll(COLUMN)];
    console.debug("[Jira Upgrade Tools] colunas encontradas:", columns.length);

    columns.forEach((column) => {
      if (column.dataset.jutCollapsible === "true") return;

      const titleEl = column.querySelector(TITLE);
      const header = column.querySelector(HEADER);
      if (!titleEl || !header) return;

      const title = (titleEl.getAttribute("title") || titleEl.textContent || "").trim();
      if (!title) return;

      column.dataset.jutCollapsible = "true";
      column.dataset.jutColumnTitle = title;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "jut-collapse-column";
      button.textContent = "‹";
      button.title = `Colapsar ${title}`;
      button.setAttribute("aria-label", button.title);
      header.appendChild(button);

      const rail = document.createElement("button");
      rail.type = "button";
      rail.className = "jut-collapsed-rail";
      rail.textContent = "›";
      rail.title = `Expandir ${title}`;
      rail.setAttribute("aria-label", rail.title);
      column.prepend(rail);

      const collapse = (e) => {
        e.preventDefault(); e.stopPropagation();
        setCollapsed(column, title, true);
      };
      const expand = (e) => {
        e.preventDefault(); e.stopPropagation();
        setCollapsed(column, title, false);
      };

      button.addEventListener("click", collapse);
      rail.addEventListener("click", expand);

      titleEl.classList.add("jut-column-title-toggle");
      titleEl.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        setCollapsed(column, title, !column.classList.contains("jut-column-collapsed"));
      });

      setCollapsed(column, title, collapsed.has(title));
    });
  }

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(install, 100);
  }).observe(document.documentElement, {childList:true, subtree:true});

  install();
})();
