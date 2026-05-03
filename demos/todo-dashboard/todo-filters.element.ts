import {
  CustomElement,
  Dispatch,
  DispatchEmitter,
  Prop,
  TemplateResult,
  html,
} from 'custom-elements-ts';

type Filter = 'all' | 'active' | 'done';

@CustomElement({
  tag: 'cts-todo-filters',
  shadow: false,
})
export class TodoFiltersElement extends HTMLElement {
  @Prop() filter: Filter = 'all';
  @Prop() total = 0;
  @Prop() active = 0;
  @Prop() done = 0;

  @Dispatch('filter.change') filterChange!: DispatchEmitter;

  render(): TemplateResult {
    return html`
      <nav class="filters" aria-label="Task filters">
        ${this.renderButton('all', 'All', this.total)}
        ${this.renderButton('active', 'Active', this.active)}
        ${this.renderButton('done', 'Done', this.done)}
      </nav>
    `;
  }

  private renderButton(filter: Filter, label: string, count: number): TemplateResult {
    return html`
      <button
        class="filter"
        aria-pressed=${this.filter === filter}
        @click=${() => this.setFilter(filter)}
      >
        <span>${label}</span>
        <span class="filter-count">${count}</span>
      </button>
    `;
  }

  private setFilter(filter: Filter) {
    this.filterChange.emit({
      bubbles: true,
      composed: true,
      detail: { filter },
    });
  }
}
