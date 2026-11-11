// ─────────────────────────────────────────────────────────────
//  YOUR PROJECTS — add, remove or reorder entries here.
//  Each one becomes a clickable segment on the loop.
//    title: the text shown on the segment (short is better)
//    url:   where it links to (a page, a folder, or an outside link)
// ─────────────────────────────────────────────────────────────
const projects = [
  { title: "about",         url: "#" },
  { title: "project one",   url: "#" },
  { title: "project two",   url: "#" },
  { title: "project three", url: "#" },
  { title: "lab",           url: "#" },
  { title: "project four",  url: "#" },
  { title: "project five",  url: "#" },
  { title: "contact",       url: "#" },
];

// ─────────────────────────────────────────────────────────────
//  Settings you can tweak
// ─────────────────────────────────────────────────────────────
const settings = {
  speed: 1,            // 0 = still, 1 = normal, 2 = twice as fast
  wobble: 0.16,        // how irregular the loop is
  maxFontSize: 30,     // upper limit for the label size
  redWidth: 38,        // thickness of the red loop
};

// ─────────────────────────────────────────────────────────────
//  Below here is the engine — you shouldn't need to edit it
// ─────────────────────────────────────────────────────────────
const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("loop");
const TAU = Math.PI * 2;
const CTRL = 10;       // control points per loop
const STEPS = 40;      // samples between control points

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(name, attrs = {}, parent = svg) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent.appendChild(node);
  return node;
}

// A wobbly closed shape: control points around an ellipse, pushed in/out by slow waves
function controlPoints(t, cx, cy, rx, ry, seed) {
  const pts = [];
  for (let i = 0; i < CTRL; i++) {
    const a = (i / CTRL) * TAU;
    const f = 1 + settings.wobble * (
      0.6 * Math.sin(a * 2 + seed + t * 0.00031) +
      0.4 * Math.sin(a * 3 - seed * 1.3 + t * 0.00047)
    );
    pts.push([cx + rx * f * Math.cos(a), cy + ry * f * Math.sin(a)]);
  }
  return pts;
}

// Smooth closed curve (Catmull-Rom) through the control points
function smooth(ctrl) {
  const out = [];
  const n = ctrl.length;
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i];
    const p2 = ctrl[(i + 1) % n],     p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < STEPS; k++) {
      const u = k / STEPS, u2 = u * u, u3 = u2 * u;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);
      out.push([x, y]);
    }
  }
  out.push(out[0]); // close the loop
  return out;
}

const toPath = (pts) => "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");

// ── Build the scene ──
const red = el("path", { class: "red", "stroke-width": settings.redWidth });

const weights = projects.map((p) => p.title.length + 2);
const weightSum = weights.reduce((a, b) => a + b, 0);

const segments = projects.map((p, i) => {
  const a = el("a", { href: p.url });
  const label = document.createElementNS(NS, "title");
  label.textContent = p.title;
  a.appendChild(label);
  const path = el("path", { id: "seg-" + i, class: "seg " + (i % 2 === 0 ? "green" : "black") }, a);
  const text = el("text", {}, a);
  const tp = el("textPath", { href: "#seg-" + i, startOffset: "50%", "text-anchor": "middle" }, text);
  tp.textContent = p.title;
  return { path, text };
});

let sized = false;

function frame(t) {
  const time = reduceMotion ? 0 : t * settings.speed;

  // Red loop (behind)
  red.setAttribute("d", toPath(smooth(controlPoints(time, 640, 360, 470, 270, 2.1))));

  // Main loop
  const pts = smooth(controlPoints(time, 600, 350, 430, 250, 0));

  // Cumulative length along the loop
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1];

  // Size the text and stroke once, from the loop's length
  if (!sized) {
    const unit = total / weightSum;
    const fs = Math.max(11, Math.min(settings.maxFontSize, unit * 1.5));
    svg.style.setProperty("--fs", fs);
    segments.forEach((s) => {
      s.text.setAttribute("font-size", fs);
      s.path.setAttribute("stroke-width", fs * 1.5);
    });
    sized = true;
  }

  // Give each project its share of the loop
  let start = 0, acc = 0, idx = 0;
  segments.forEach((s, i) => {
    acc += weights[i];
    const target = (acc / weightSum) * total;
    const from = idx;
    while (idx < pts.length - 1 && cum[idx] < target) idx++;
    if (i === segments.length - 1) idx = pts.length - 1;
    s.path.setAttribute("d", toPath(pts.slice(from, idx + 1)));
  });

  if (!reduceMotion && settings.speed > 0) requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
