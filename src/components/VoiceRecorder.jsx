import { useEffect, useRef, useState, useCallback } from 'react';
import { FiMic, FiSquare, FiTrash2, FiSend } from 'react-icons/fi';
import './media.css';

/**
 * VoiceRecorder — record a voice note with a live waveform, play it back, then
 * hand a ready-to-upload `File` to the caller via onComplete(file, durationMs).
 *
 * Cross-browser notes (Risk R4): iOS Safari only supports `audio/mp4`, others
 * prefer `audio/webm;codecs=opus`. We feature-detect the best supported type
 * and hide the recorder entirely when MediaRecorder is unavailable.
 */
function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((m) => {
    try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
  }) || '';
}

const DEFAULT_MAX_MS = 5 * 60 * 1000;

export default function VoiceRecorder({ onComplete, onCancel, maxMs = DEFAULT_MAX_MS }) {
  const [supported] = useState(
    () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  );
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const startedRef = useRef(0);
  const rafRef = useRef(0);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const canvasRef = useRef(null);

  const cleanupStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      cleanupStream();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    },
    [cleanupStream, blobUrl],
  );

  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const render = () => {
      analyser.getByteTimeDomainData(buf);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0A1F44';
      ctx.beginPath();
      const slice = width / buf.length;
      for (let i = 0; i < buf.length; i += 1) {
        const y = (buf[i] / 128.0) * (height / 2);
        const x = i * slice;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    setRecording(false);
  }, []);

  // Tick the elapsed timer and auto-stop at the cap.
  useEffect(() => {
    if (!recording) return undefined;
    const id = setInterval(() => {
      const ms = Date.now() - startedRef.current;
      setElapsed(ms);
      if (ms >= maxMs) stop();
    }, 200);
    return () => clearInterval(id);
  }, [recording, maxMs, stop]);

  const start = useCallback(async () => {
    setError(null);
    const mime = pickMimeType();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        blobRef.current = blob;
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        cleanupStream();
      };

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const actx = new AudioCtx();
        audioCtxRef.current = actx;
        const source = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawWave();
      }

      startedRef.current = Date.now();
      setElapsed(0);
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setError('Microphone access denied or unavailable.');
      cleanupStream();
    }
  }, [cleanupStream, drawWave]);

  const discard = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    blobRef.current = null;
    setElapsed(0);
    onCancel?.();
  };

  const send = () => {
    const blob = blobRef.current;
    if (!blob) return;
    const ext = blob.type.includes('mp4')
      ? 'm4a'
      : blob.type.includes('ogg')
        ? 'ogg'
        : 'webm';
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
    onComplete?.(file, elapsed);
  };

  const mmss = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  if (!supported) {
    return (
      <div className="voice-recorder voice-unsupported">
        Voice recording isn’t supported on this browser.
      </div>
    );
  }

  return (
    <div className="voice-recorder">
      {error && <div className="voice-error">{error}</div>}
      {!blobUrl ? (
        <>
          <canvas ref={canvasRef} className="voice-wave" width={220} height={40} />
          <span className="voice-time">{mmss(elapsed)}</span>
          {!recording ? (
            <button type="button" className="voice-btn voice-rec" onClick={start} aria-label="Start recording">
              <FiMic size={18} />
            </button>
          ) : (
            <button type="button" className="voice-btn voice-stop" onClick={stop} aria-label="Stop recording">
              <FiSquare size={16} />
            </button>
          )}
        </>
      ) : (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio className="voice-playback" src={blobUrl} controls />
          <span className="voice-time">{mmss(elapsed)}</span>
          <button type="button" className="voice-btn voice-discard" onClick={discard} aria-label="Discard recording">
            <FiTrash2 size={16} />
          </button>
          <button type="button" className="voice-btn voice-send" onClick={send} aria-label="Use recording">
            <FiSend size={16} />
          </button>
        </>
      )}
    </div>
  );
}
