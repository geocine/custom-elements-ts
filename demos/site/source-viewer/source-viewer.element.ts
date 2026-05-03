import { CustomElement, Prop, State, TemplateResult, html } from 'custom-elements-ts';

import { SOURCES, SourceFile } from './sources.generated';

declare const Prism: {
  highlight(code: string, grammar: unknown): string;
  languages: {
    typescript: unknown;
    javascript: unknown;
  };
};

/**
 * Inline source viewer for site playgrounds.
 */
@CustomElement({
  tag: 'cts-source-viewer',
  styleUrl: './source-viewer.element.scss',
})
export class SourceViewerElement extends HTMLElement {
  /** Key into the `SOURCES` map. e.g. `counter`, `todo-dashboard`. */
  @Prop() slug = '';

  /** Index of the file shown in the body. Reset whenever `slug` changes. */
  @State() activeIndex = 0;

  // Avoid re-tokenizing unchanged source.
  private files: SourceFile[] = [];
  private highlighted: string[] = [];
  private cachedFor = '\0';

  // Raw node insertion avoids lowercasing `.innerHTML` in parsed templates.
  private bodyNode: HTMLPreElement | null = null;
  private codeNode: HTMLElement | null = null;
  private renderedHtml = '';

  render(): TemplateResult {
    if (this.cachedFor !== this.slug) {
      this.recompute();
      this.cachedFor = this.slug;
    }

    if (!this.files.length) {
      return html`
        <div class="viewer">
          <p class="empty">Source unavailable for <code>${this.slug}</code>.</p>
        </div>
      `;
    }

    const showTabs = this.files.length > 1;
    const active = this.highlighted[this.activeIndex] ?? '';

    if (!this.bodyNode || !this.codeNode) {
      this.codeNode = document.createElement('code');
      this.bodyNode = document.createElement('pre');
      this.bodyNode.className = 'body';
      this.bodyNode.tabIndex = 0;
      this.bodyNode.appendChild(this.codeNode);
    }
    if (this.renderedHtml !== active) {
      this.codeNode.innerHTML = active;
      this.renderedHtml = active;
    }

    return html`
      <div class="viewer">
        <div class="bar">
          <span class="kicker">
            <span class="kicker-dot" aria-hidden="true"></span>
            inline source
          </span>

          ${showTabs
            ? html`
                <div class="tabs" role="tablist" aria-label="Source files">
                  ${this.files.map((file, index) => {
                    const isActive = index === this.activeIndex;
                    return html`
                      <button
                        class=${isActive ? 'tab is-active' : 'tab'}
                        role="tab"
                        type="button"
                        aria-selected=${isActive ? 'true' : 'false'}
                        @click=${() => this.selectTab(index)}
                      >
                        ${file.name}
                      </button>
                    `;
                  })}
                </div>
              `
            : html`<span class="single">${this.files[0]?.name ?? ''}</span>`}
        </div>

        ${this.bodyNode}
      </div>
    `;
  }

  private selectTab(index: number) {
    if (index === this.activeIndex) return;
    this.activeIndex = index;
    // Center the active tab when the bar is overflowing on narrow widths.
    requestAnimationFrame(() => {
      const tab = this.shadowRoot?.querySelectorAll<HTMLElement>('.tab')[index];
      tab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  }

  private recompute() {
    const files = SOURCES[this.slug] ?? [];
    this.files = files;

    const grammar =
      typeof Prism !== 'undefined'
        ? (Prism.languages.typescript ?? Prism.languages.javascript)
        : null;

    this.highlighted = files.map((file) =>
      grammar ? Prism.highlight(file.source, grammar) : escapeHtml(file.source)
    );

    if (this.activeIndex >= files.length) {
      this.activeIndex = 0;
    }
  }
}

const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (char) => ENTITY_MAP[char] ?? char);
}
