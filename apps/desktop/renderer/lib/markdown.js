/**
 * Safe Markdown → HTML renderer for the Grok transcript.
 * Agent-provided HTML is always escaped. Only explicitly supported Markdown is emitted as markup.
 */
(() => {
  function escapeText(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderInline(value) {
    const tokens = [];
    const token = (html) => {
      const index = tokens.push(html) - 1;
      return `\u0000${index}\u0000`;
    };
    let text = String(value ?? "");
    // Images before links; local paths ok — timeline may rewrite src via resolveMediaSrc
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt, src) =>
      token(
        `<img class="md-img" src="${escapeText(src)}" alt="${escapeText(alt)}" loading="lazy" data-raw-src="${escapeText(src)}" />`,
      ),
    );
    text = text.replace(/`([^`\n]+)`/g, (_match, code) => token(`<code>${escapeText(code)}</code>`));
    text = text.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/gi, (_match, label, href) =>
      token(`<a href="${escapeText(href)}" title="${escapeText(href)}">${escapeText(label)}</a>`),
    );
    text = text.replace(
      /\[([^\]\n]*)\]\((<[^>\n]+>|file:\/\/[^)\n]+|(?:[A-Za-z]:[\\/]|\\\\|\/|\.\.?[\\/])[^)\n]+|[A-Za-z0-9_@()+.-]+[\\/][^)\n]+)\)/gi,
      (_match, label, rawHref) => {
        const href = String(rawHref).trim().replace(/^<|>$/g, "");
        return token(
          `<a href="${escapeText(href)}" class="md-path-link" title="${escapeText(href)}">${escapeText(label || href)}</a>`,
        );
      },
    );
    text = text.replace(/<(https?:\/\/[^>\s]+)>/gi, (_match, href) =>
      token(`<a href="${escapeText(href)}" title="${escapeText(href)}">${escapeText(href)}</a>`),
    );
    text = escapeText(text);
    text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
    text = text.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
    text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");
    return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => tokens[Number(index)] ?? "");
  }

  function splitTableRow(line) {
    return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  }

  function isTableDivider(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function renderMarkdown(source) {
    const lines = String(source ?? "").replaceAll("\r\n", "\n").split("\n");
    const parts = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      const fence = line.match(/^\s*```([^`]*)$/);
      if (fence) {
        const language = fence[1].trim();
        const body = [];
        index += 1;
        while (index < lines.length && !/^\s*```/.test(lines[index])) {
          body.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        parts.push(
          `<pre class="md-code"${language ? ` data-lang="${escapeText(language)}"` : ""}><code>${escapeText(body.join("\n"))}</code></pre>`,
        );
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        parts.push(`<h${level} class="md-h">${renderInline(heading[2].replace(/\s+#+\s*$/, ""))}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
        parts.push('<hr class="md-rule">');
        index += 1;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
          quote.push(renderInline(lines[index].replace(/^\s*>\s?/, "")));
          index += 1;
        }
        parts.push(`<blockquote class="md-quote">${quote.join("<br>")}</blockquote>`);
        continue;
      }

      if (line.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
        const headers = splitTableRow(line);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }
        const head = headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("");
        const body = rows.map((row) =>
          `<tr>${headers.map((_header, cellIndex) => `<td>${renderInline(row[cellIndex] ?? "")}</td>`).join("")}</tr>`,
        ).join("");
        parts.push(`<div class="md-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
        continue;
      }

      const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      if (unordered) {
        const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^\s*[-+*]\s+(.+)$/);
          if (!item) break;
          const task = item[1].match(/^\[([ xX])\]\s+(.*)$/);
          items.push(task
            ? `<li class="md-task"><input type="checkbox" disabled${task[1].toLowerCase() === "x" ? " checked" : ""}> ${renderInline(task[2])}</li>`
            : `<li>${renderInline(item[1])}</li>`);
          index += 1;
        }
        parts.push(`<ul class="md-list">${items.join("")}</ul>`);
        continue;
      }

      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (ordered) {
        const items = [];
        const start = Number(line.match(/^\s*(\d+)/)?.[1] ?? 1);
        while (index < lines.length) {
          const item = lines[index].match(/^\s*\d+[.)]\s+(.+)$/);
          if (!item) break;
          items.push(`<li>${renderInline(item[1])}</li>`);
          index += 1;
        }
        parts.push(`<ol class="md-list"${start !== 1 ? ` start="${start}"` : ""}>${items.join("")}</ol>`);
        continue;
      }

      if (!line.trim()) {
        index += 1;
        continue;
      }

      const paragraph = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^\s*```/.test(lines[index]) &&
        !/^(#{1,6})\s+/.test(lines[index]) &&
        !/^\s*>\s?/.test(lines[index]) &&
        !/^\s*[-+*]\s+/.test(lines[index]) &&
        !/^\s*\d+[.)]\s+/.test(lines[index])
      ) {
        paragraph.push(lines[index]);
        index += 1;
      }
      parts.push(`<p class="md-p">${renderInline(paragraph.join(" "))}</p>`);
    }
    return parts.join("") || '<p class="md-p"></p>';
  }

  function bindMarkdownLinks(element, openLink) {
    for (const link of element.querySelectorAll("a[href]")) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const href = link.getAttribute("href");
        if (href && /^https?:\/\//i.test(href)) openLink?.(href);
      });
    }
  }

  function setMarkdownContent(element, source, openLink) {
    element.classList.add("md-body");
    element.classList.remove("md-structured");
    element.innerHTML = renderMarkdown(source);
    bindMarkdownLinks(element, openLink);
  }

  /**
   * Structured timeline body: same safe Markdown, plus code fences wrapped as
   * language-tagged cards (Cursor/Windsurf-style blocks).
   */
  function setStructuredContent(element, source, openLink) {
    element.classList.add("md-body", "md-structured");
    element.innerHTML = renderMarkdown(source);
    for (const pre of [...element.querySelectorAll("pre.md-code")]) {
      if (pre.parentElement?.classList.contains("code-card")) continue;
      const card = document.createElement("div");
      card.className = "code-card";
      const header = document.createElement("div");
      header.className = "code-card-header";
      const lang = (pre.getAttribute("data-lang") || "code").trim() || "code";
      header.textContent = lang;
      pre.parentNode?.insertBefore(card, pre);
      card.append(header, pre);
    }
    bindMarkdownLinks(element, openLink);
  }

  globalThis.GrokMarkdown = {
    renderMarkdown,
    setMarkdownContent,
    setStructuredContent,
    escapeText,
  };
})();
