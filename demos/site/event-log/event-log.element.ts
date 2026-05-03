import { CustomElement, Prop, State, TemplateResult, Watch, html } from 'custom-elements-ts';

interface LogEntry {
  id: number;
  name: string;
  detail: string;
  time: string;
}

const MAX_ENTRIES = 6;

/**
 * Live event log for bubbling CustomEvents on the showcase page.
 */
@CustomElement({
  tag: 'cts-event-log',
  styleUrl: './event-log.element.scss',
})
export class EventLogElement extends HTMLElement {
  /** Comma-separated list of event names to subscribe to on `document`. */
  @Prop() events = '';
  /** Optional human label rendered above the list. */
  @Prop() label = 'Event log';
  /** Optional empty-state copy. */
  @Prop() empty = 'Interact with the component above to see events stream in.';

  @State() entries: LogEntry[] = [];

  private subscriptions: Array<{ name: string; handler: EventListener }> = [];
  private nextId = 1;

  connectedCallback() {
    this.bind();
  }

  disconnectedCallback() {
    this.unbind();
  }

  @Watch('events')
  rebind() {
    this.unbind();
    this.bind();
  }

  render(): TemplateResult {
    const entries = this.entries;
    return html`
      <header class="head">
        <span class="dot" aria-hidden="true"></span>
        <span class="label">${this.label}</span>
        <span class="count" aria-hidden="true">${entries.length}</span>
      </header>

      ${entries.length === 0
        ? html`<p class="empty">${this.empty}</p>`
        : html`<ol class="list" aria-live="polite">
            ${entries.map(
              (entry) => html`
                <li class="entry" data-id=${entry.id}>
                  <span class="entry-time">${entry.time}</span>
                  <span class="entry-name">${entry.name}</span>
                  <span class="entry-detail">${entry.detail}</span>
                </li>
              `
            )}
          </ol>`}
    `;
  }

  private bind() {
    const names = this.events
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    for (const name of names) {
      const handler: EventListener = (event) => this.record(name, event as CustomEvent);
      document.addEventListener(name, handler);
      this.subscriptions.push({ name, handler });
    }
  }

  private unbind() {
    for (const { name, handler } of this.subscriptions) {
      document.removeEventListener(name, handler);
    }
    this.subscriptions = [];
  }

  private record(name: string, event: CustomEvent) {
    const entry: LogEntry = {
      id: this.nextId++,
      name,
      detail: this.formatDetail(event.detail),
      time: this.timestamp(),
    };
    // Newest first, capped to MAX_ENTRIES so the panel never grows unbounded.
    this.entries = [entry, ...this.entries].slice(0, MAX_ENTRIES);
  }

  private formatDetail(detail: unknown): string {
    if (detail === null || detail === undefined) return '—';
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'number' || typeof detail === 'boolean') {
      return String(detail);
    }
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }

  private timestamp(): string {
    const now = new Date();
    const pad = (value: number, size = 2) => String(value).padStart(size, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(
      now.getMilliseconds(),
      3
    )}`;
  }
}
