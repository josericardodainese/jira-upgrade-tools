(() => {
  console.log("%c[Jira Upgrade Tools]%c extensão carregada — collapsible columns",
    "background:#0052CC;color:white;font-weight:bold;padding:2px 6px;border-radius:3px",
    "color:#172B4D;font-weight:bold");

  const STORAGE_KEY = "jira-upgrade-tools:collapsed-columns";
  const COLUMN = '[data-testid="platform-board-kit.ui.column.draggable-column.styled-wrapper"]';
  const HEADER = '[data-testid="platform-board-kit.common.ui.column-header.header.column-header-container"]';
  const BOARD_COLUMN = '.__board-test-hook__column';
  const TITLE = '[data-testid="platform-board-kit.common.ui.column-header.editable-title.column-title.column-name"]';
  const collapsed = (() => { try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")); } catch { return new Set(); } })();
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));

  function install() {
    const columns = [...document.querySelectorAll(COLUMN)];
    if (columns.length) console.debug("[Jira Upgrade Tools] colunas encontradas:", columns.length);

    columns.forEach((column) => {
      if (column.dataset.jutCollapsible === "true") return;
      const titleEl = column.querySelector(TITLE);
      const header = column.querySelector(HEADER);
      const boardColumn = column.querySelector(BOARD_COLUMN);
      if (!titleEl || !header || !boardColumn) return;

      const title = (titleEl.getAttribute("title") || titleEl.textContent || "").trim();
      if (!title) return;

      column.dataset.jutCollapsible = "true";
      column.dataset.jutColumnTitle = title;
      header.classList.add("jut-column-header");
      titleEl.classList.add("jut-column-title-toggle");
      titleEl.setAttribute("role", "button");
      titleEl.setAttribute("tabindex", "0");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "jut-collapse-column";
      header.appendChild(button);

      const setCollapsed = (value) => {
        column.classList.toggle("jut-column-collapsed", value);
        boardColumn.classList.toggle("jut-board-column-collapsed", value);
        button.textContent = value ? "›" : "‹";
        button.title = value ? `Expandir ${title}` : `Colapsar ${title}`;
        button.setAttribute("aria-label", button.title);
        titleEl.title = button.title;
        if (value) collapsed.add(title); else collapsed.delete(title);
        save();
      };

      const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCollapsed(!column.classList.contains("jut-column-collapsed"));
      };

      button.addEventListener("click", toggle);
      titleEl.addEventListener("click", toggle);
      titleEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") toggle(e);
      });

      setCollapsed(collapsed.has(title));
    });
  }

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(install, 100);
  }).observe(document.documentElement, {childList:true, subtree:true});

  install();
})();
