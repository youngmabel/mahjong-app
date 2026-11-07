/**
 * The spotlight: the screen dims except the part that matters, and Pip explains it beside the bright spot.
 * Used the first time each rule comes up (replacing the old yellow rule banners) and for the tour.
 */

import { h } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { SeatMap as SeatMapData } from '../coachview';
import { PipSvg, Words } from './Pip';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const PAD = 6;

function shown(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** The first of these elements that is on screen, or null. */
function findTarget(targets: readonly string[]): Element | null {
  for (const sel of targets) {
    const el = document.querySelector(sel);
    if (el && shown(el)) return el;
  }
  return null;
}

export function Spotlight(props: {
  targets: readonly string[];
  lead: string;
  title: string;
  text: string;
  nextLabel: string;
  onNext: () => void;
  /** e.g. "2 of 9" during the tour */
  progress?: string;
  onSkip?: () => void;
}) {
  const [box, setBox] = useState<Box | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const [cardH, setCardH] = useState(180);
  const card = useRef<HTMLDivElement>(null);
  const key = `${props.title}|${props.targets.join(',')}`;
  useLayoutEffect(() => {
    const el = findTarget(props.targets);
    if (el) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const update = () => {
      setView({ w: window.innerWidth, h: window.innerHeight });
      const t = findTarget(props.targets);
      if (!t) return setBox(null);
      const r = t.getBoundingClientRect();
      setBox({ left: r.left - PAD, top: r.top - PAD, width: r.width + 2 * PAD, height: r.height + 2 * PAD });
    };
    update();
    const later = window.setTimeout(update, 250); // after the scroll settles
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(later);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [key]);

  // measure the card, so it can always sit fully on screen
  useLayoutEffect(() => {
    const hgt = card.current?.getBoundingClientRect().height;
    if (hgt && Math.abs(hgt - cardH) > 1) setCardH(hgt);
  });

  // the card goes below the bright spot when it fits there, else above it, else against the screen edge with
  // more room (on very short screens it may then cover part of the spot, but its button is always reachable)
  let cardStyle = '';
  if (box && view.h > 0) {
    const gap = 10;
    const below = view.h - (box.top + box.height) - gap;
    const above = box.top - gap;
    if (below >= cardH + 8) cardStyle = `top:${Math.round(box.top + box.height + gap)}px`;
    else if (above >= cardH + 8) cardStyle = `bottom:${Math.round(view.h - box.top + gap)}px`;
    else cardStyle = box.top + box.height / 2 > view.h / 2 ? 'top:8px' : 'bottom:8px';
  }
  return (
    <div class="spotlight" role="dialog" aria-modal="true" aria-label={props.title}>
      {box ? (
        <div class="spot-hole" style={`left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px`} />
      ) : (
        <div class="spot-dim" />
      )}
      <div class={`spot-card${box ? '' : ' is-center'}`} style={cardStyle} ref={card}>
        <PipSvg pose="point" />
        <div class="spot-body">
          {props.lead && <p class="spot-lead">{props.lead}</p>}
          <p class="spot-title">{props.title}</p>
          <p class="spot-text">
            <Words text={props.text} />
          </p>
          <div class="spot-actions">
            {props.progress && <span class="muted spot-progress">{props.progress}</span>}
            {props.onSkip && (
              <button class="btn small" onClick={props.onSkip}>
                Skip the tour
              </button>
            )}
            <button class="btn small primary" onClick={props.onNext} autoFocus>
              {props.nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- The seat map ---------------------------------------------------------------------------------------------

const POS: Record<string, { x: number; y: number }> = { bottom: { x: 50, y: 88 }, top: { x: 50, y: 12 }, left: { x: 12, y: 50 }, right: { x: 88, y: 50 } };
const ARROW: Record<string, string> = {
  right: 'M60 80 Q80 80 81 62',
  top: 'M50 76 L50 26',
  left: 'M40 80 Q20 80 19 62',
};

/** Who sits where around the table: you at the bottom, play going to the right; arrows show where passed tiles go. */
export function SeatMap({ map }: { map: SeatMapData }) {
  return (
    <figure class="seatmap" aria-label={`Seats: ${map.seats.map((s) => `${s.you ? 'you' : s.side}, ${s.wind}`).join('; ')}. ${map.caption}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <marker id="seat-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--brass-2)" />
          </marker>
        </defs>
        <rect x="23" y="23" width="54" height="54" rx="9" class="sm-table" />
        {map.passTo && map.passTo !== 'bottom' && <path d={ARROW[map.passTo]} class="sm-arrow" marker-end="url(#seat-arrow)" />}
        {map.seats.map((s) => {
          const p = POS[s.side] as { x: number; y: number };
          return (
            <g key={s.seat} class={`sm-seat${s.you ? ' is-you' : ''}${s.active ? ' is-active' : ''}${s.dead ? ' is-dead' : ''}`}>
              <circle cx={p.x} cy={p.y} r="10.5" />
              <text x={p.x} y={p.y + 4.2} text-anchor="middle">
                {s.wind.charAt(0)}
              </text>
              {s.dealer && <circle cx={p.x + 9} cy={p.y - 9} r="3.2" class="sm-dealer" />}
            </g>
          );
        })}
        <text x="50" y="70" text-anchor="middle" class="sm-you">
          you
        </text>
      </svg>
      {map.caption && <figcaption>{map.caption}</figcaption>}
    </figure>
  );
}
