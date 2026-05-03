import {
  CustomElement,
  Dispatch,
  DispatchEmitter,
  State,
  TemplateResult,
  Watch,
  html,
} from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-counter',
  styleUrl: './counter.element.scss',
})
export class CounterElement extends HTMLElement {
  @State() count = 0;

  @Dispatch('counter.change') counterChange!: DispatchEmitter;

  @Watch('count')
  handleCountChange(change: { new: number }) {
    this.counterChange.emit({
      bubbles: true,
      composed: true,
      detail: {
        count: change.new,
      },
    });
  }

  render(): TemplateResult {
    const display = this.format(this.count);
    return html`
      <button class="card" type="button" @click=${this.increment}>
        <span class="kicker">
          <span class="kicker-dot"></span>
          counter · @State()
        </span>

        <span class="display" aria-live="polite">
          <span class="display-mute">${display.mute}</span
          ><span class="display-num">${display.num}</span>
        </span>

        <span class="hint">
          <span class="hint-text">tap anywhere to count</span>
          <span class="hint-chip">+1</span>
        </span>
      </button>
    `;
  }

  private increment() {
    this.count++;
  }

  // Pad to at least 4 digits and split into a muted lead and a bright tail
  // so the number reads like a stopwatch — e.g. 0042, 0420, 4200, 42000.
  private format(value: number): { mute: string; num: string } {
    const raw = String(value);
    const padded = raw.length >= 4 ? raw : `${'0000'.slice(raw.length)}${raw}`;
    const tail = padded.length - raw.length;
    return {
      mute: padded.slice(0, tail),
      num: padded.slice(tail),
    };
  }
}
