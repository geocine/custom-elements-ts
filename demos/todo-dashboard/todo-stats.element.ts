import {
  CustomElement,
  Dispatch,
  DispatchEmitter,
  Prop,
  TemplateResult,
  html,
} from 'custom-elements-ts';

interface PipTrack {
  filled: number;
  total: number;
  overflow: number;
}

const MAX_PIPS = 10;

@CustomElement({
  tag: 'cts-todo-stats',
  shadow: false,
})
export class TodoStatsElement extends HTMLElement {
  @Prop() total = 0;
  @Prop() done = 0;
  @Prop() goal = 5;

  @Dispatch('goal.change') goalChange!: DispatchEmitter;

  render(): TemplateResult {
    const total = this.asNumber(this.total);
    const done = this.asNumber(this.done);
    const goal = Math.max(1, this.asNumber(this.goal));
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const remaining = Math.max(0, goal - done);
    const overGoal = Math.max(0, done - goal);
    const reached = done >= goal;
    const pip = this.buildPipTrack(done, goal);

    return html`
      <aside class="stats-panel">
        ${this.renderProgressCard(total, done, percent)}
        ${this.renderGoalCard(done, goal, remaining, overGoal, reached, pip)}
      </aside>
    `;
  }

  private renderProgressCard(total: number, done: number, percent: number): TemplateResult {
    const empty = total === 0;
    const complete = !empty && percent >= 100;
    const className = complete
      ? 'stat-card stat-card--progress is-complete'
      : 'stat-card stat-card--progress';

    return html`
      <article class=${className}>
        <header class="stat-head">
          <span class="stat-label">Progress</span>
          <span class="stat-tag" data-state=${complete ? 'complete' : empty ? 'empty' : 'live'}>
            ${complete ? 'Sprint complete' : empty ? 'No tasks yet' : 'In flight'}
          </span>
        </header>

        <div class="progress-display" aria-live="polite">
          ${empty
            ? html`<span class="progress-num is-empty">—</span>`
            : html`<span class="progress-num">${percent}</span
                ><span class="progress-suffix">%</span>`}
        </div>

        <div class="progress-track" aria-hidden="true">
          <span class="progress-track-fill" style=${`--p:${empty ? 0 : percent / 100}`}></span>
        </div>

        <p class="stat-caption">
          ${empty
            ? html`Add a task above to start tracking progress.`
            : html`<strong>${done}</strong> of <strong>${total}</strong> ${total === 1
                  ? 'task'
                  : 'tasks'}
                complete`}
        </p>
      </article>
    `;
  }

  private renderGoalCard(
    done: number,
    goal: number,
    remaining: number,
    overGoal: number,
    reached: boolean,
    pip: PipTrack
  ): TemplateResult {
    const className = reached ? 'stat-card stat-card--goal is-met' : 'stat-card stat-card--goal';

    return html`
      <article class=${className}>
        <header class="stat-head">
          <span class="stat-label">Sprint goal</span>
          <div class="stepper" aria-label="Adjust completion goal">
            <button
              class="stepper-btn"
              type="button"
              aria-label="Decrease goal"
              disabled=${goal <= 1}
              @click=${this.decreaseGoal}
            >
              −
            </button>
            <span class="stepper-value" aria-hidden="true">${goal}</span>
            <button
              class="stepper-btn"
              type="button"
              aria-label="Increase goal"
              @click=${this.increaseGoal}
            >
              +
            </button>
          </div>
        </header>

        <div
          class="goal-pips"
          role="img"
          aria-label=${`${Math.min(done, pip.total)} of ${pip.total} goal pips filled`}
        >
          ${this.renderPips(pip.filled, pip.total)}
          ${pip.overflow > 0
            ? html`<span class="pip-more" aria-hidden="true">+${pip.overflow}</span>`
            : null}
        </div>

        <p class="stat-caption">
          ${reached
            ? html`<span class="goal-met">Goal met</span>${overGoal > 0
                  ? html`<span class="goal-over">+${overGoal} bonus</span>`
                  : null}`
            : html`<strong>${done}</strong>/<strong>${goal}</strong>
                <span class="goal-sep">·</span>
                <strong>${remaining}</strong> to go`}
        </p>
      </article>
    `;
  }

  private renderPips(filled: number, total: number): TemplateResult[] {
    const pips: TemplateResult[] = [];
    for (let i = 0; i < total; i++) {
      pips.push(html`<span class=${i < filled ? 'pip is-filled' : 'pip'}></span>`);
    }
    return pips;
  }

  private buildPipTrack(done: number, goal: number): PipTrack {
    if (goal <= MAX_PIPS) {
      return {
        filled: Math.min(done, goal),
        total: goal,
        overflow: 0,
      };
    }
    const filled = Math.min(MAX_PIPS, Math.round((done / goal) * MAX_PIPS));
    return {
      filled,
      total: MAX_PIPS,
      overflow: goal - MAX_PIPS,
    };
  }

  private decreaseGoal() {
    this.emitGoal(Math.max(1, this.asNumber(this.goal) - 1));
  }

  private increaseGoal() {
    this.emitGoal(this.asNumber(this.goal) + 1);
  }

  private emitGoal(goal: number) {
    this.goalChange.emit({
      bubbles: true,
      composed: true,
      detail: { goal },
    });
  }

  private asNumber(value: unknown): number {
    return typeof value === 'number' ? value : Number(value) || 0;
  }
}
