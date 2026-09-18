(() => {
  console.log("[Jira Upgrade Tools] extensão carregada — collapsible columns");

  const STORAGE_KEY = "jira-upgrade-tools:collapsed-columns";
  const COLUMN = '[data-testid="platform-board-kit.ui.column.draggable-column.styled-wrapper"]';
  const HEADER = '[data-testid="platform-board-kit.common.ui.column-header.header.column-header-container"]';
  const TITLE = '[data-testid="platform-board-kit.common.ui.column-header.editable-title.column-title.column-name"]';
  const BOARD_ROW = '._m6k41e03._1e0c1ule._kqswh2mm._1bsb1osq';

  const collapsed = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  })();
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));

  function syncGrid(column) {
    const grid = column.parentElement;
    if (!grid) return;

    const columns = [...grid.querySelectorAll(":scope > " + COLUMN)];
    if (!columns.length) return;

    // O Jira usa minmax(150px, 1fr), então width no filho não libera a track.
    // Substituímos cada track: 32px para colapsada e minmax(150px, 1fr) para aberta.
    grid.style.setProperty(
      "grid-template-columns",
      columns
        .map((item) =>
          item.classList.contains("jut-column-collapsed")
            ? "32px"
            : "minmax(150px, 1fr)"
        )
        .join(" "),
      "important"
    );
  }

  function apply(column, title, value) {
    column.classList.toggle("jut-column-collapsed", value);
    syncGrid(column);
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

      const collapseButton = document.createElement("button");
      collapseButton.type = "button";
      collapseButton.className = "jut-collapse-column";
      collapseButton.textContent = "‹";
      collapseButton.title = `Colapsar ${title}`;
      collapseButton.setAttribute("aria-label", collapseButton.title);

      // Coloca o botão no canto DIREITO do header.
      header.appendChild(collapseButton);

      // Botão independente usado somente quando a coluna está colapsada.
      const expandButton = document.createElement("button");
      expandButton.type = "button";
      expandButton.className = "jut-expand-column";
      expandButton.innerHTML = '<span class="jut-expand-arrow">›</span><span class="jut-collapsed-title"></span>';
      // Use transform em vez de writing-mode: o texto fica inteiro, apenas rotacionado.
      expandButton.querySelector(".jut-collapsed-title").textContent = title;
      expandButton.title = `Expandir ${title}`;
      expandButton.setAttribute("aria-label", expandButton.title);
      column.appendChild(expandButton);

      collapseButton.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        apply(column, title, true);
      });
      expandButton.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        apply(column, title, false);
      });
      titleEl.classList.add("jut-column-title-toggle");
      titleEl.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        apply(column, title, !column.classList.contains("jut-column-collapsed"));
      });

      apply(column, title, collapsed.has(title));
    });
  }

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(install, 100);
  }).observe(document.documentElement, {childList:true,subtree:true});

  install();
})();
