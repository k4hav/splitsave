"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const PRESETS = [1999, 1500, 1000, 500];
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#8b7cf6'/><stop offset='1' stop-color='#5b4bd5'/></linearGradient></defs><circle cx='20' cy='20' r='20' fill='url(#g)'/><text x='20' y='28' font-size='24' font-weight='700' text-anchor='middle' fill='#fff' font-family='sans-serif'>₹</text></svg>`
  );

function splitAmt(total: number, limit: number): number[] {
  const paise = Math.round(total * 100);
  const n = Math.max(1, Math.ceil(paise / (limit * 100)));
  const base = Math.floor(paise / n);
  const extra = paise - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < extra ? 1 : 0)) / 100);
}
const upiLink = (pa: string, pn: string, am: number, tn: string) =>
  `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn || "Payee")}&am=${am.toFixed(2)}&cu=INR&tn=${encodeURIComponent(tn)}`;
const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

const ICONS = {
  back: ["M19 12H5", "m12 19-7-7 7-7"],
  check: ["M20 6 9 17l-5-5"],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  reuse: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
  clock: ["M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20", "M12 6v6l4 2"],
  share: ["M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6", "M6 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6", "M18 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6", "M8.59 13.51l6.83 3.98", "M15.41 6.51l-6.82 3.98"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8", "M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  megaphone: ["m3 11 18-5v12L3 14v-3z", "M11.6 16.8a3 3 0 1 1-5.8-1.6"],
  split: ["M16 3h5v5", "M8 3H3v5", "M12 22v-8.3a4 4 0 0 0-1.17-2.87L3 3", "m15 9 6-6"],
  qr: ["M4 3h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M17 3h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M4 16h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z", "M21 16h-3a2 2 0 0 0-2 2v3", "M21 21v.01", "M12 7v3a2 2 0 0 1-2 2H7", "M3 12h.01", "M12 3h.01", "M12 16v.01", "M16 12h1", "M21 12v.01", "M12 21v-1"],
};
function Icon({ n, size = 20 }: { n: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[n].map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const G = {
  share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  telegram: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  sms: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  more: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
};
const Glyph = ({ d, size = 20 }: { d: string; size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden><path d={d} /></svg>;

function ShareMenu({ text, url, toast }: { text: string; url?: string; toast: (m: string) => void }) {
  const full = url ? `${text}
${url}` : text;
  const q = encodeURIComponent(full);
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const copy = async () => { try { await navigator.clipboard.writeText(full); toast("Copied to clipboard"); } catch { toast("Could not copy"); } };
  const more = async () => { try { if (navigator.share) await navigator.share({ title: "SplitSave", text, url }); else await copy(); } catch {} };
  const items = [
    { k: "WhatsApp", d: G.whatsapp, hc: "#25d366", go: () => open(`https://wa.me/?text=${q}`) },
    { k: "Telegram", d: G.telegram, hc: "#29a9eb", go: () => open(`https://t.me/share/url?url=${encodeURIComponent(url ?? " ")}&text=${encodeURIComponent(text)}`) },
    { k: "X", d: G.x, hc: "#000000", go: () => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ""}`) },
    { k: "Email", d: G.mail, hc: "#ea4335", go: () => open(`mailto:?subject=SplitSave&body=${q}`) },
    { k: "Message", d: G.sms, hc: "#8b5cf6", go: () => open(`sms:?body=${q}`) },
    { k: "Copy link", d: G.link, hc: "#6c5ce7", go: copy },
    { k: "More", d: G.more, hc: "#111111", go: more },
  ];
  return (
    <div className="tooltip-container" tabIndex={0} aria-label="Share">
      <span className="text"><Glyph d={G.share} size={22} /></span>
      <span className="tip-bridge" />
      {items.map((it, i) => (
        <button key={it.k} className="tip" aria-label={it.k} title={it.k} onClick={it.go}
          style={{ "--x": `${3 + 46 * (i % 4)}px`, "--y": `${i < 4 ? 58 : 104}px`, "--hc": it.hc, "--i": i } as CSSProperties}>
          <Glyph d={it.d} />
        </button>
      ))}
    </div>
  );
}
function ThemeBtn({ dark, onClick }: { dark: boolean; onClick: () => void }) {
  return (
    <button className="theme" onClick={onClick} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "m" : "s"} initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.4, opacity: 0 }} transition={{ duration: 0.25 }} style={{ display: "grid" }}>
          <Icon n={dark ? "moon" : "sun"} size={22} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

const NOTICE: { i: keyof typeof ICONS; t: string; d: string }[] = [
  { i: "split", t: "Splits big payments", d: "Enter an amount above your limit and get equal QR codes, each under it." },
  { i: "qr", t: "One QR at a time", d: "Show a QR, tap done once it is paid, and the card flips to the next one." },
  { i: "clock", t: "Keeps a record", d: "Every payment goes into your history with the total and the number of payments." },
];

const ord = (n: number) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

function Face({ s, k, back }: { s: Session; k: number; back?: boolean }) {
  const n = s.parts.length;
  const part = s.parts[k];
  return (
    <div className={"face" + (back ? " b" : "")}>
      <div className="inner">
        <i className="blob b1" /><i className="blob b2" />
        {part !== undefined && (
          <>
            <div className="thead">
              <span className="brand">SplitSave</span>
              <span className="chip">{n > 1 ? `${ord(k + 1)} of ${n}` : "Single"}</span>
            </div>
            <div className="plate">
              <QRCodeSVG value={upiLink(s.upi, s.name, part, n > 1 ? `Part ${k + 1}/${n}` : "Payment")}
                size={280} level="H" fgColor="#1a1a1f" bgColor="#ffffff" imageSettings={{ src: LOGO, height: 54, width: 54, excavate: true }} />
            </div>
            <div className="details">
              <div className="row"><span>Paid to</span><b>{s.name || s.upi}</b></div>
              {s.name && <div className="row"><span>UPI ID</span><b>{s.upi}</b></div>}
              <div className="row hl"><span>Amount</span><b>{inr(part)}</b></div>
              <div className="row"><span>Total</span><b>{inr(s.total)}</b></div>
              <div className="row"><span>Split</span><b>{n > 1 ? `${n} equal parts` : "No split"}</b></div>
              <div className="row"><span>Payment</span><b>{n > 1 && k === n - 1 ? "Last payment" : `${ord(k + 1)} payment`}</b></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2, d = 120 + ((i * 37) % 80);
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, c: ["#6c5ce7", "#22a06b", "#ff7aa8", "#ffb84d"][i % 4] };
});

type Entry = { id: number; total: number; parts: number[]; split: boolean; at: string };
type Session = { parts: number[]; total: number; split: boolean; upi: string; name: string };

export default function Home() {
  const [upi, setUpi] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [limitStr, setLimitStr] = useState("1999");
  const [split, setSplit] = useState(true);
  const [history, setHistory] = useState<Entry[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [launch, setLaunch] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [shown, setShown] = useState(20);
  const [notice, setNotice] = useState(false);
  const [fi, setFi] = useState<[number, number]>([0, 1]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("splitpay");
      if (s) { const d = JSON.parse(s); setUpi(d.upi ?? ""); setName(d.name ?? ""); }
      const h = localStorage.getItem("splitpay-history");
      if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("splitpay", JSON.stringify({ upi, name })); } catch {} }, [upi, name]);
  useEffect(() => { document.body.style.overflow = session ? "hidden" : ""; }, [session]);
  useEffect(() => { try { if (!localStorage.getItem("splitsave-notice-v1")) setNotice(true); } catch { setNotice(true); } }, []);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); setSiteUrl(window.location.href); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  const persist = (h: Entry[]) => { setHistory(h); try { localStorage.setItem("splitpay-history", JSON.stringify(h)); } catch {} };

  const total = parseFloat(amount) || 0;
  const limit = Math.max(1, parseInt(limitStr || "1999", 10));
  const validUpi = UPI_RE.test(upi.trim());
  const ready = validUpi && total > 0;
  const parts = useMemo(() => (total > 0 ? (split ? splitAmt(total, limit) : [total]) : []), [total, limit, split]);
  const over = !split && total > limit;

  const cleanAmount = (v: string) => {
    const [a, ...r] = v.replace(/[^\d.]/g, "").split(".");
    return r.length ? a + "." + r.join("").slice(0, 2) : a;
  };
  const start = () => { setSession({ parts, total, split, upi: upi.trim(), name: name.trim() }); setIdx(0); setFinished(false); setFi([0, 1]); };
  const markDone = () => {
    if (!session || busy) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (idx + 1 < session.parts.length) {
        setIdx(idx + 1);
        const old = idx % 2;
        setTimeout(() => setFi((f) => { const x: [number, number] = [f[0], f[1]]; x[old] = idx + 2; return x; }), 800);
        return;
      }
      setFinished(true);
      persist([{ id: Date.now(), total: session.total, parts: session.parts, split: session.split, at: new Date().toISOString() }, ...history]);
    }, 600);
  };
  const closeNotice = () => { setNotice(false); try { localStorage.setItem("splitsave-notice-v1", "1"); } catch {} };
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1800); };
  const toggleTheme = () => { const n = !dark; setDark(n); try { localStorage.setItem("splitsave-theme", n ? "dark" : "light"); } catch {} };
  const generate = () => { if (launch) return; setLaunch(true); setTimeout(() => { setLaunch(false); start(); }, 520); };
  const closeSession = () => { if (finished) setAmount(""); setSession(null); };
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const totalCollected = history.reduce((sum, h) => sum + Math.round(h.total * 100), 0) / 100;
  const shareText = !session ? "" : finished
    ? `Collected ${inr(session.total)}${session.parts.length > 1 ? ` in ${session.parts.length} payments` : ""} with SplitSave.`
    : `Pay ${inr(session.parts[idx])} to ${session.name || session.upi} via UPI\n` + upiLink(session.upi, session.name, session.parts[idx], session.parts.length > 1 ? `Part ${idx + 1}/${session.parts.length}` : "Payment");

  return (
    <main className="wrap">
      <div className="topbar">
        <ThemeBtn dark={dark} onClick={toggleTheme} />
        <ShareMenu text="SplitSave: split a large UPI payment into smaller QR codes." url={siteUrl || undefined} toast={notify} />
      </div>
      <header className="top">
        <motion.div className="logo" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <Icon n="split" size={30} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>Split<span>Save</span></motion.h1>
        <p>Split a large UPI payment into smaller QR codes.</p>
      </header>

      <AnimatePresence>
        {notice && (
          <motion.aside className="raised notice" role="note" style={{ overflow: "hidden" }}
            initial={{ opacity: 0, y: -24, height: 0, marginTop: 0 }} animate={{ opacity: 1, y: 0, height: "auto", marginTop: 26 }}
            exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }} transition={{ type: "spring", stiffness: 180, damping: 22 }}>
            <div className="nhead">
              <span className="nicon"><Icon n="megaphone" size={20} /></span>
              <strong>What SplitSave does</strong>
              <button className="iconbtn nclose" onClick={closeNotice} aria-label="Dismiss notice"><Icon n="x" size={16} /></button>
            </div>
            <p className="nlead">Fees can apply to larger UPI payments. SplitSave breaks one big payment into smaller QR codes so each one stays under your limit.</p>
            <ul className="nlist">
              {NOTICE.map((n, i) => (
                <motion.li key={n.t} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.12 }}>
                  <span className="ni"><Icon n={n.i} size={18} /></span>
                  <div><b>{n.t}</b><small>{n.d}</small></div>
                </motion.li>
              ))}
            </ul>
            <small className="nfoot">Everything runs in your browser. Nothing is sent to a server.</small>
          </motion.aside>
        )}
      </AnimatePresence>

      <section className="raised panel">
        <label>
          Your UPI ID
          <input className="inset" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" autoCapitalize="none" spellCheck={false} aria-invalid={!!upi && !validUpi} />
          {upi && !validUpi && <small className="err">Enter a valid UPI ID like name@okhdfc</small>}
        </label>
        <label>
          Payee name <span className="opt">(optional)</span>
          <input className="inset" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown in the payer's app" />
        </label>
        <label>
          Amount to collect
          <div className="amt">
            <span>₹</span>
            <input className="inset" inputMode="decimal" value={amount} onChange={(e) => setAmount(cleanAmount(e.target.value))} placeholder="3000" />
          </div>
          <small>Decimals allowed (up to 2). Parts are split equally.</small>
        </label>

        <div className="switch-row">
          <div>
            <strong>Split large payments</strong>
            <small>{split ? "Above the limit, you get multiple QRs" : "Always a single QR"}</small>
          </div>
          <button type="button" role="switch" aria-checked={split} aria-label="Split large payments" className={"sw" + (split ? " on" : "")} onClick={() => setSplit(!split)}>
            <span className="sw-knob"><i /><i /><i /></span>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {split && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", margin: "-10px", padding: "10px" }}>
              <div className="limit">
                <span>Max per QR</span>
                <div className="chips">
                  {PRESETS.map((p) => (
                    <button key={p} className={"pill" + (limitStr === String(p) ? " active" : "")} onClick={() => setLimitStr(String(p))}>{inr(p)}</button>
                  ))}
                  <div className="custom"><span>₹</span>
                    <input className="inset" inputMode="numeric" value={limitStr} onChange={(e) => setLimitStr(e.target.value.replace(/\D/g, ""))} aria-label="Custom limit" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ready && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", margin: "-10px", padding: "10px" }}>
              <div className="inset preview">
                <strong>{inr(total)}</strong>
                {parts.length > 1 && <span className="badge">× {parts.length}</span>}
                <span className="sub">{parts.length > 1 ? parts.map(inr).join(" + ") : "single QR"}</span>
              </div>
              {over && <p className="warn">Split is off: above your {inr(limit)} limit, so the charge may apply.</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <button className={"gen" + (launch ? " go" : "")} disabled={!ready || launch} onClick={generate}>
          <Icon n="qr" size={20} />
          <span>{ready ? (parts.length > 1 ? `Generate ${parts.length} QR codes` : "Generate QR") : "Enter UPI ID and amount"}</span>
        </button>
      </section>

      <section className="history">
        <div className="hhead">
          <h3><Icon n="clock" size={20} /> History</h3>
        </div>
        <div className="stats">
          <div className="stat"><small>Total collected</small><strong>{inr(totalCollected)}</strong></div>
          <div className="stat"><small>Payments</small><strong>{history.length.toLocaleString("en-IN")}</strong></div>
        </div>
        {history.length === 0 ? <p className="muted">Completed payments appear here.</p> : (
          <>
            <ul>
              {history.slice(0, shown).map((h) => (
                <li key={h.id} className="raised item">
                  <div>
                    <strong>{inr(h.total)}</strong>
                    <span className={"badge sm" + (h.parts.length > 1 ? "" : " single")}>{h.parts.length > 1 ? `× ${h.parts.length}` : "single"}</span>
                    <small>{h.parts.length > 1 ? h.parts.map(inr).join(" + ") : h.split ? "Under limit" : "Split off"}, {fmtDate(h.at)}</small>
                  </div>
                  <div className="hbtn">
                    <button className="iconbtn" title="Reuse amount" aria-label="Reuse amount" onClick={() => setAmount(String(h.total))}><Icon n="reuse" size={17} /></button>
                  </div>
                </li>
              ))}
            </ul>
            {history.length > shown && <button className="link more" onClick={() => setShown((s) => s + 20)}>Show more ({history.length - shown} older)</button>}
          </>
        )}
      </section>

      <AnimatePresence>
        {session && (
          <motion.div className="pay" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
            <div className="paybar">
              <button className="iconbtn round" onClick={closeSession} aria-label="Back"><Icon n="back" /></button>
              <div className="dots">
                {session.parts.map((_, i) => <span key={i} className={"dot" + (finished || i < idx ? " ok" : i === idx ? " now" : "")} />)}
              </div>
              <div className="rightslot">
                <ThemeBtn dark={dark} onClick={toggleTheme} />
                <ShareMenu text={shareText} toast={notify} />
              </div>
            </div>

            {finished ? (
              <motion.div className="stage" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="burst">
                  {CONFETTI.map((c, i) => (
                    <motion.i key={i} style={{ background: c.c }} initial={{ x: 0, y: 0, scale: 0, opacity: 1 }} animate={{ x: c.x, y: c.y, scale: 1, opacity: 0 }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 }} />
                  ))}
                  <motion.div className="raised bigtick" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
                    <svg viewBox="0 0 52 52" width="64" height="64"><motion.path d="M13 27 l9 9 l17 -19" fill="none" stroke="#22a06b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} /></svg>
                  </motion.div>
                </div>
                <h2 className="payamt">{inr(session.total)}</h2>
                <p className="step">{session.parts.length > 1 ? `Collected in ${session.parts.length} payments` : "Payment collected"}. Saved to history.</p>
                <button className="primary big" onClick={closeSession}>New payment</button>
              </motion.div>
            ) : (
              <div className="stage">
                <div className="card3d">
                  <div className="content" style={{ "--n": idx } as CSSProperties}>
                    <Face s={session} k={fi[0]} />
                    <Face s={session} k={fi[1]} back />
                  </div>
                </div>
                <button className={"donebtn" + (busy ? " sent" : "")} onClick={markDone} disabled={busy}>
                  <span>{busy ? "Done!" : idx + 1 < session.parts.length ? "Mark as done" : "Mark as done"}</span>
                  <span className="dknob"><Icon n="check" size={22} /></span>
                </button>
                <p className="hint">Tap after the payment is received</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="toastwrap">
        <AnimatePresence>
          {toast && <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>{toast}</motion.div>}
        </AnimatePresence>
      </div>
    </main>
  );
}
