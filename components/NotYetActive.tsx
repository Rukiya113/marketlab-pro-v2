import { Bot } from './Icons';

/**
 * Standard placeholder for sidebar destinations that don't have a real
 * implementation yet. A financial terminal should never present a route
 * that looks live but isn't - this makes the "not built yet" state explicit
 * and honest instead of a dead '#' link or a silently empty page.
 */
export default function NotYetActive({ title, blurb }: { title: string; blurb: string }) {
  return (
    <main className="workspace">
      <section className="panel notYetActive">
        <div className="panelTitle">
          {title}
          <span>NOT YET ACTIVE</span>
        </div>
        <div className="notYetActiveBody">
          <Bot size={34} />
          <h2>{title} is not built yet</h2>
          <p className="muted">{blurb}</p>
        </div>
      </section>
    </main>
  );
}
