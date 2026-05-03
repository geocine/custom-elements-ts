import {
  CustomElement,
  Dispatch,
  DispatchEmitter,
  Prop,
  State,
  TemplateResult,
  Toggle,
  Watch,
  html,
} from 'custom-elements-ts';

type Filter = 'all' | 'active' | 'done';

interface TodoItem {
  id: number;
  label: string;
  done: boolean;
}

interface EmptyMessage {
  title: string;
  sub: string;
}

const EMPTY_MESSAGES: Record<Filter, EmptyMessage> = {
  all: {
    title: 'Nothing on the board.',
    sub: 'Capture a task above to start tracking work.',
  },
  active: {
    title: 'All caught up.',
    sub: 'No active tasks remain — bask in the silence.',
  },
  done: {
    title: 'Nothing finished yet.',
    sub: 'Tick a task off the list to see it surface here.',
  },
};

@CustomElement({
  tag: 'cts-todo-dashboard',
  styleUrl: './todo-dashboard.element.scss',
})
export class TodoDashboardElement extends HTMLElement {
  @Prop() heading = 'Sprint board';
  @Toggle() compact = false;

  @State() draft = '';
  @State() filter: Filter = 'all';
  @State() goal = 5;
  @State() revision = 0;
  @State() items: TodoItem[] = [
    { id: 1, label: 'Wire @CustomElement decorator', done: true },
    { id: 2, label: 'Diff deeply nested @State() arrays', done: false },
    { id: 3, label: 'Audit @Listen on shadow root selectors', done: false },
  ];

  @Dispatch('todo.change') todoChange!: DispatchEmitter;

  private nextId = 4;

  @Watch('items')
  handleItemsChange() {
    this.revision++;
    this.todoChange.emit({
      bubbles: true,
      composed: true,
      detail: {
        total: this.items.length,
        done: this.doneCount,
        active: this.activeCount,
      },
    });
  }

  render(): TemplateResult {
    const visible = this.visibleItems;
    const total = this.items.length;
    const done = this.doneCount;
    const active = total - done;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    return html`
      <section class=${this.compact ? 'shell compact' : 'shell'}>
        <header class="header">
          <div class="title-block">
            <span class="eyebrow">
              <span class="eyebrow-dot"></span>
              Taskboard
            </span>
            <h1>${this.heading}</h1>
            <p class="meta">
              <span><strong>${active}</strong> active</span>
              <span class="dot-sep">·</span>
              <span><strong>${done}</strong> done</span>
              <span class="dot-sep">·</span>
              <span><strong>${total}</strong> total</span>
            </p>
          </div>
          <span class="revision" title="State revision count">
            <span class="revision-pulse"></span>
            <span class="revision-label">live</span>
            <span class="revision-num">r${this.padRev(this.revision)}</span>
          </span>
        </header>

        <div class="progress" aria-hidden="true">
          <span class="progress-fill" style=${`--progress:${progress / 100}`}></span>
        </div>

        <cts-todo-stats
          total=${total}
          done=${done}
          goal=${this.goal}
          @goal.change=${this.handleGoalChange}
        ></cts-todo-stats>

        <div class="composer">
          <div class="composer-field">
            <span class="composer-icon" aria-hidden="true">${this.iconPlus()}</span>
            <input
              aria-label="New task"
              placeholder="Capture a task and press enter"
              .value=${this.draft}
              @input=${this.updateDraft}
              @keydown=${this.handleDraftKeydown}
            />
            <kbd aria-hidden="true">Enter</kbd>
          </div>
          <button class="primary" disabled=${!this.canAdd} @click=${this.addItem}>Add task</button>
        </div>

        <cts-todo-filters
          filter=${this.filter}
          total=${total}
          active=${active}
          done=${done}
          @filter.change=${this.handleFilterChange}
        ></cts-todo-filters>

        ${visible.length
          ? html`<div
              class="list"
              role="list"
              @todo.toggle=${this.handleTodoToggle}
              @todo.labelchange=${this.handleTodoLabelChange}
              @todo.remove=${this.handleTodoRemove}
            >
              ${visible.map(
                (item, index) => html`
                  <cts-todo-item
                    todoid=${item.id}
                    label=${item.label}
                    done=${item.done}
                    rowindex=${index}
                  ></cts-todo-item>
                `
              )}
            </div>`
          : this.renderEmpty()}

        <footer class="footer">
          <span class="footer-stats">
            <strong>${done}</strong>
            <span class="footer-divider">/</span>
            <span>${total}</span>
            <span class="footer-label">completed</span>
          </span>
          <div class="footer-actions">
            <button disabled=${total === 0} @click=${this.completeAll}>Complete all</button>
            <button disabled=${done === 0} @click=${this.clearDone}>Clear done</button>
          </div>
        </footer>
      </section>
    `;
  }

  private renderEmpty(): TemplateResult {
    const message = EMPTY_MESSAGES[this.filter];
    return html`
      <div class="empty">
        <span class="empty-icon" aria-hidden="true">${this.iconClipboard()}</span>
        <p class="empty-title">${message.title}</p>
        <p class="empty-sub">${message.sub}</p>
      </div>
    `;
  }

  // Inline SVG icons — kept tiny and reused via the template cache.

  private iconPlus(): TemplateResult {
    return html`<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="14"
      height="14"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>`;
  }

  private iconClipboard(): TemplateResult {
    return html`<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="26"
      height="26"
    >
      <path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z" />
      <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M9 13h6M9 17h4" />
    </svg>`;
  }

  // Event handlers

  private updateDraft(event: Event) {
    this.draft = (event.target as HTMLInputElement).value;
  }

  private handleDraftKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.addItem();
    }
  }

  private addItem() {
    const label = this.draft.trim();
    if (!label) return;
    this.items.push({ id: this.nextId++, label, done: false });
    this.draft = '';
  }

  private setFilter(filter: Filter) {
    this.filter = filter;
  }

  private handleFilterChange(event: Event) {
    this.setFilter((event as CustomEvent<{ filter: Filter }>).detail.filter);
  }

  private handleGoalChange(event: Event) {
    this.goal = Math.max(1, (event as CustomEvent<{ goal: number }>).detail.goal);
  }

  private handleTodoToggle(event: Event) {
    this.toggleItem((event as CustomEvent<{ id: number }>).detail.id);
  }

  private handleTodoLabelChange(event: Event) {
    const { id, label } = (event as CustomEvent<{ id: number; label: string }>).detail;
    this.updateItemLabel(id, label);
  }

  private handleTodoRemove(event: Event) {
    this.removeItem((event as CustomEvent<{ id: number }>).detail.id);
  }

  private toggleItem(id: number) {
    const item = this.items.find((entry) => entry.id === id);
    if (item) {
      item.done = !item.done;
    }
  }

  private updateItemLabel(id: number, value: string) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) return;
    const label = value.trim();
    if (label) {
      item.label = label;
    } else {
      this.removeItem(id);
    }
  }

  private removeItem(id: number) {
    const index = this.items.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  private completeAll() {
    this.items.forEach((item) => {
      item.done = true;
    });
  }

  private clearDone() {
    for (let index = this.items.length - 1; index >= 0; index--) {
      if (this.items[index].done) {
        this.items.splice(index, 1);
      }
    }
  }

  private padRev(value: number): string {
    return value < 10 ? `0${value}` : String(value);
  }

  private get canAdd(): boolean {
    return this.draft.trim().length > 0;
  }

  private get visibleItems(): TodoItem[] {
    if (this.filter === 'active') {
      return this.items.filter((item) => !item.done);
    }
    if (this.filter === 'done') {
      return this.items.filter((item) => item.done);
    }
    return this.items;
  }

  private get activeCount(): number {
    return this.items.filter((item) => !item.done).length;
  }

  private get doneCount(): number {
    return this.items.filter((item) => item.done).length;
  }
}
