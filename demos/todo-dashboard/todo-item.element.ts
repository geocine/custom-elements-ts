import {
  CustomElement,
  Dispatch,
  DispatchEmitter,
  Prop,
  TemplateResult,
  html,
} from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-todo-item',
  shadow: false,
})
export class TodoItemElement extends HTMLElement {
  @Prop() todoid = 0;
  @Prop() label = '';
  @Prop() done: unknown = false;
  @Prop() rowindex = 0;

  @Dispatch('todo.toggle') todoToggle!: DispatchEmitter;
  @Dispatch('todo.labelchange') todoLabelChange!: DispatchEmitter;
  @Dispatch('todo.remove') todoRemove!: DispatchEmitter;

  render(): TemplateResult {
    const done = this.isDone;
    return html`
      <div class="row" role="listitem" data-done=${done} style=${`--index:${this.rowindex}`}>
        <button
          class="check"
          aria-label=${done ? 'Mark as active' : 'Mark as done'}
          aria-pressed=${done}
          @click=${this.toggle}
        >
          <span class="check-tick">${this.iconCheck()}</span>
        </button>
        ${done
          ? html`<span class="task-label is-done">${this.label}</span>`
          : html`<input
              class="task-label"
              aria-label="Task label"
              .value=${this.label}
              @change=${this.changeLabel}
              @keydown=${this.commitEdit}
            />`}
        <button class="remove" aria-label="Remove task" @click=${this.removeTodo}>
          ${this.iconClose()}
        </button>
      </div>
    `;
  }

  private toggle() {
    this.todoToggle.emit({
      bubbles: true,
      composed: true,
      detail: { id: this.todoId },
    });
  }

  private changeLabel(event: Event) {
    this.todoLabelChange.emit({
      bubbles: true,
      composed: true,
      detail: {
        id: this.todoId,
        label: (event.target as HTMLInputElement).value,
      },
    });
  }

  private commitEdit(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    }
  }

  private removeTodo() {
    this.todoRemove.emit({
      bubbles: true,
      composed: true,
      detail: { id: this.todoId },
    });
  }

  private iconCheck(): TemplateResult {
    return html`<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="11"
      height="11"
    >
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>`;
  }

  private iconClose(): TemplateResult {
    return html`<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="13"
      height="13"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>`;
  }

  private get todoId(): number {
    return this.asNumber(this.todoid);
  }

  private get isDone(): boolean {
    return this.done === true || this.done === 'true';
  }

  private asNumber(value: unknown): number {
    return typeof value === 'number' ? value : Number(value) || 0;
  }
}
