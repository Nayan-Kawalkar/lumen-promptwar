"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { ArrowRight, Mic, MicOff } from "lucide-react";
import { DEMO_CONTEXT, DEMO_DECISION } from "@/lib/demo";

const EXAMPLES = [
  { label: "6-month internship", decision: DEMO_DECISION, context: DEMO_CONTEXT, demo: true },
  {
    label: "Switch jobs",
    decision: "Should I leave my stable job for a startup offer?",
    context:
      "I've been at a large IT services company for 3 years. A 20-person startup offered me 40% more salary plus some equity. The work sounds exciting and the founders seem smart. I'm bored at my current job and I feel like I'm not learning anything. My manager is nice though and I just got a good rating.",
  },
  {
    label: "Move cities",
    decision: "Should I move to Bangalore for a master's program?",
    context:
      "I got admitted to a 2-year MTech program in Bangalore. It's a well-ranked college and Bangalore has lots of tech jobs. Fees are about ₹4 lakh total, I'd take a loan. I'd be leaving my hometown and my friends. Everyone says a master's is necessary to get good roles in AI.",
  },
  {
    label: "Drop a course",
    decision: "Should I drop my hardest elective this semester?",
    context:
      "I'm taking 6 courses and Machine Learning is killing me. I'm failing the quizzes. If I drop it I'll have more time for my other subjects and my GPA will be safer. I can take it again next year. I originally chose it because I want to work in AI.",
  },
];

type SpeechRec = {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
};

const noop = () => () => {};
const hasSpeech = () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

export function DecisionInput({
  initial,
  onSubmit,
  error,
}: {
  initial?: { decision: string; context: string; demo: boolean };
  onSubmit: (v: { decision: string; context: string; demo: boolean }) => void;
  error?: string | null;
}) {
  const [decision, setDecision] = useState(initial?.decision ?? "");
  const [context, setContext] = useState(initial?.context ?? "");
  const [demo, setDemo] = useState(initial?.demo ?? false);
  const [listening, setListening] = useState(false);
  const canListen = useSyncExternalStore(noop, hasSpeech, () => false);
  const rec = useRef<SpeechRec | null>(null);
  const baseText = useRef("");

  const toggleMic = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-IN";
    baseText.current = context ? context.trimEnd() + " " : "";
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setContext(baseText.current + text);
      setDemo(false);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  const ready = decision.trim().length >= 3 && context.trim().length >= 10;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 0.6 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit({ decision: decision.trim(), context: context.trim(), demo });
      }}
      className="mx-auto w-full max-w-2xl px-5"
    >
      <p className="label mb-4 text-center">Step 1 · Describe</p>
      <h1 className="text-center font-serif text-4xl leading-tight md:text-6xl">
        What are you <span className="italic text-light">deciding</span>?
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted md:text-base">
        Include the details and — most importantly — <em className="text-text/80">why</em> you&apos;re leaning the way
        you are. The more honest, the more Lumen can see.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              setDecision(ex.decision);
              setContext(ex.context);
              setDemo(Boolean(ex.demo));
            }}
            className="rounded-full border border-line bg-white/[0.02] px-3.5 py-1.5 text-xs text-muted transition hover:border-light/40 hover:text-text"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="glass mt-6 rounded-3xl p-2 shadow-[0_30px_120px_-40px_rgba(255,214,140,0.25)]">
        <label className="block px-4 pt-3">
          <span className="label">The decision</span>
          <input
            value={decision}
            onChange={(e) => {
              setDecision(e.target.value);
              setDemo(false);
            }}
            maxLength={300}
            placeholder="e.g. Should I accept a 6-month internship?"
            className="mt-1 w-full bg-transparent font-serif text-2xl text-text placeholder:text-muted/50 focus:outline-none"
          />
        </label>
        <div className="mx-4 my-2 h-px bg-line" />
        <label className="relative block px-4 pb-2">
          <span className="label">Details &amp; your reasoning</span>
          <textarea
            value={context}
            onChange={(e) => {
              setContext(e.target.value);
              setDemo(false);
            }}
            maxLength={4000}
            rows={7}
            placeholder="What's the situation? What are the options? Why are you leaning one way?"
            className="scroll-thin mt-1 w-full resize-none bg-transparent text-[15px] leading-relaxed text-text/90 placeholder:text-muted/50 focus:outline-none"
          />
        </label>
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          {canListen ? (
            <button
              type="button"
              onClick={toggleMic}
              aria-pressed={listening}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${
                listening ? "bg-contradiction/20 text-contradiction" : "text-muted hover:bg-white/5 hover:text-text"
              }`}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              {listening ? "Listening… tap to stop" : "Speak instead"}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={!ready}
            className="group inline-flex items-center gap-2 rounded-full bg-light px-6 py-3 text-sm font-medium text-ink transition enabled:shadow-[0_0_50px_-10px_rgba(255,214,140,0.9)] disabled:opacity-30"
          >
            Scan my reasoning
            <ArrowRight className="size-4 transition group-enabled:group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-contradiction">
          {error}
        </p>
      )}
      <p className="mt-5 text-center text-xs text-muted/60">
        Your text is sent to Google Gemini to generate questions. Nothing is stored.
      </p>
    </motion.form>
  );
}
