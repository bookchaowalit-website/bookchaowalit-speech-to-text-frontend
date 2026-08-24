"use client";

import { useRef, useState } from "react";

type RecognitionResult = { length: number; [index: number]: { 0: { transcript: string } } };
type RecognitionEvent = { results: RecognitionResult };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor() {
  const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}

export default function Home() {
  const [transcript, setTranscript] = useState("Click start, speak a sentence, and let the browser set it down here.");
  const [status, setStatus] = useState("READY");
  const [copied, setCopied] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const isListening = status === "LISTENING";

  function start() {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setStatus("UNAVAILABLE");
      setTranscript("SpeechRecognition is not available in this browser. Try Chrome or Edge with microphone permission.");
      return;
    }
    const nextRecognition = new Constructor();
    nextRecognition.continuous = true;
    nextRecognition.interimResults = true;
    nextRecognition.onresult = (event) => {
      let nextText = "";
      for (let index = 0; index < event.results.length; index += 1) nextText += `${event.results[index][0].transcript} `;
      setTranscript(nextText.trim());
    };
    nextRecognition.onerror = () => setStatus("ERROR");
    nextRecognition.onend = () => setStatus((current) => current === "LISTENING" ? "STOPPED" : current);
    recognition.current = nextRecognition;
    nextRecognition.start();
    setStatus("LISTENING");
  }

  function stop() {
    recognition.current?.stop();
    setStatus("STOPPED");
  }

  async function copyTranscript() {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch { setCopied(false); }
  }

  return (
    <main className="voice-shell">
      <nav className="voice-nav" aria-label="Voice Booth">
        <span className="voice-mark">VOICE / BOOTH</span>
        <span>BROWSER MICROPHONE · NO CLOUD KEY</span>
      </nav>

      <header className="voice-hero">
        <div><h1>Let the browser catch the room.</h1><p>A quiet speech-to-text booth for one take at a time. The transcript is created by the browser&apos;s native recognition surface.</p></div>
        <div className={`voice-status voice-status-${status.toLowerCase()}`}><span className="voice-status-dot" />{status}</div>
      </header>

      <section className="voice-console" aria-label="Speech recorder">
        <div className="voice-console-top"><span>TAKE 001</span><span>{isListening ? "CAPTURING VOICE" : "READY FOR A TAKE"}</span></div>
        <div className="voice-wave" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <span key={index} style={{ height: `${18 + ((index * 17) % 54)}%` }} />)}</div>
        <div className="voice-controls"><button type="button" className="voice-start" onClick={start} disabled={isListening}><span />Start recording</button><button type="button" className="voice-stop" onClick={stop} disabled={!isListening}>Stop</button></div>
        <p className="voice-console-note">Give the browser microphone access when prompted. Stop ends the current recognition session.</p>
      </section>

      <section className="voice-transcript" aria-live="polite">
        <div className="voice-transcript-head"><div><span>TRANSCRIPT / LIVE PAPER</span><h2>What was said.</h2></div><button type="button" onClick={copyTranscript}>{copied ? "Copied" : "Copy transcript"}</button></div>
        <p className="voice-paper">{transcript}</p>
        <div className="voice-paper-meta"><span>{transcript.split(/\s+/).filter(Boolean).length} words</span><button type="button" onClick={() => { setTranscript(""); setStatus("READY"); }}>Clear paper</button></div>
      </section>

      <footer className="voice-footer"><span>METHOD / Web SpeechRecognition API</span><span>LIMIT / browser support and microphone permission apply</span></footer>
    </main>
  );
}
