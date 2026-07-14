/**
 * server/media/process.js — media transformation + inspection helpers.
 *
 * All heavy/native dependencies (sharp, file-type, fluent-ffmpeg + system
 * ffmpeg) are lazy-imported so the server still boots if an optional binary is
 * missing. Image processing is required for the avatar/comment flows; audio &
 * video probing degrade gracefully (metadata simply comes back null) when
 * ffmpeg is unavailable, rather than failing the whole upload.
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

/**
 * Magic-byte MIME sniff — never trust the client-declared Content-Type.
 * Returns the detected MIME or null if it can't be determined.
 */
export async function sniffMime(buffer) {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const ft = await fileTypeFromBuffer(buffer);
    return ft?.mime ?? null;
  } catch (e) {
    console.warn('[media] mime sniff unavailable:', e?.message);
    return null;
  }
}

/**
 * Re-encode an image to WEBP (max 1080w) and produce a 320w WEBP thumbnail.
 * EXIF orientation is auto-applied via .rotate().
 */
export async function processImage(buffer) {
  const sharp = (await import('sharp')).default;
  const base  = sharp(buffer, { failOn: 'none' }).rotate();

  const mainBuf = await base.clone()
    .resize({ width: 1080, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbBuf = await base.clone()
    .resize({ width: 320, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();

  const meta = await sharp(mainBuf).metadata();
  return {
    main:  { buffer: mainBuf,  mime: 'image/webp', width: meta.width ?? null, height: meta.height ?? null },
    thumb: { buffer: thumbBuf, mime: 'image/webp' },
  };
}

/**
 * Probe an audio/video buffer for duration (+ dimensions for video) and,
 * optionally, extract a poster frame (returned as a WEBP buffer).
 * Returns {} if ffmpeg/ffprobe is unavailable.
 */
export async function probeMedia(buffer, ext, { wantPoster = false } = {}) {
  let tmpPath;
  try {
    tmpPath = path.join(os.tmpdir(), `s442_${randomUUID()}.${ext || 'bin'}`);
    await fs.promises.writeFile(tmpPath, buffer);

    const meta = await ffprobe(tmpPath);
    let posterWebp = null;
    if (wantPoster) posterWebp = await posterFrame(tmpPath);
    return { ...meta, posterWebp };
  } catch (e) {
    console.warn('[media] probe unavailable:', e?.message);
    return {};
  } finally {
    if (tmpPath) fs.promises.rm(tmpPath, { force: true }).catch(() => {});
  }
}

// ── internals ─────────────────────────────────────────────────

async function ffprobe(filePath) {
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return resolve({});
      const vstream = (data?.streams || []).find((s) => s.width && s.height) || {};
      const dur = Number(data?.format?.duration);
      resolve({
        duration_ms: Number.isFinite(dur) ? Math.round(dur * 1000) : null,
        width:  vstream.width  ?? null,
        height: vstream.height ?? null,
      });
    });
  });
}

async function posterFrame(filePath) {
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  const outName = `poster_${randomUUID()}.png`;
  const outDir  = os.tmpdir();
  const outPath = path.join(outDir, outName);

  const pngBuf = await new Promise((resolve) => {
    ffmpeg(filePath)
      .on('end',   async () => { try { resolve(await fs.promises.readFile(outPath)); } catch { resolve(null); } })
      .on('error', () => resolve(null))
      .screenshots({ count: 1, timemarks: ['1'], filename: outName, folder: outDir, size: '640x?' });
  });
  fs.promises.rm(outPath, { force: true }).catch(() => {});
  if (!pngBuf) return null;

  try {
    const sharp = (await import('sharp')).default;
    return await sharp(pngBuf).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  } catch {
    return null;
  }
}
