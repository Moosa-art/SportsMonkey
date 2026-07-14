/**
 * server/routes/media.js — Area 5 media upload pipeline.
 *
 *   POST   /api/media/upload   (multipart/form-data)
 *     fields: file (binary, required), kind ('image'|'audio'|'video'|'voice'),
 *             use  ('avatar'|'comment'|'post'|'story'|'message') — size policy
 *     -> 201 { id, url, thumbnail_url?, mime, bytes, width?, height?, duration_ms?, kind, use }
 *     errors: 400 bad kind/missing file · 413 too large/too long · 415 mime mismatch
 *
 *   GET    /api/media/file?key=…   stream a locally-stored object (local driver)
 *   GET    /api/media/:id          metadata (auth)
 *   DELETE /api/media/:id          soft-delete, owner-only
 */

import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { getStorage, newKey } from '../storage/index.js';
import { sniffMime, processImage, probeMedia } from '../media/process.js';

const router  = Router();
const storage = getStorage();

// Hard ceiling enforced by multer; per-use limits applied after parsing.
const HARD_MAX = 100 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: HARD_MAX, files: 1 },
});

const KINDS = ['image', 'audio', 'video', 'voice'];
const USES  = ['avatar', 'comment', 'post', 'story', 'message', 'other'];

const MIME_WHITELIST = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'],
  voice: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'],
  video: ['video/mp4', 'video/webm'],
};

const MB = 1024 * 1024;
function maxBytesFor(kind, use) {
  if (kind === 'image') return (use === 'post' || use === 'story') ? 15 * MB : 10 * MB;
  if (kind === 'audio' || kind === 'voice') return 25 * MB;
  if (kind === 'video') return 100 * MB;
  return 10 * MB;
}

const MAX_VOICE_MS      = 5 * 60 * 1000;
const MAX_VIDEO_POST_MS = 5 * 60 * 1000;
const MAX_VIDEO_REEL_MS = 90 * 1000;

const EXT_BY_MIME = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/webm': 'weba', 'audio/ogg': 'ogg',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};
const extFromMime = (m) => EXT_BY_MIME[m] || 'bin';

// ── POST /upload ──────────────────────────────────────────────
router.post('/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    try {
      const kind = String(req.body.kind || '').toLowerCase();
      const use  = USES.includes(req.body.use) ? req.body.use : 'other';

      if (!KINDS.includes(kind)) return res.status(400).json({ error: 'kind must be image|audio|video|voice' });
      if (!req.file)             return res.status(400).json({ error: 'file is required' });

      const buffer = req.file.buffer;

      // Per-use size policy (multer already capped the absolute ceiling).
      const maxBytes = maxBytesFor(kind, use);
      if (buffer.length > maxBytes) {
        return res.status(413).json({ error: `File exceeds ${Math.floor(maxBytes / MB)}MB limit` });
      }

      // Magic-byte sniff — reject spoofed extensions/MIME.
      const sniffed   = await sniffMime(buffer);
      const allowList = MIME_WHITELIST[kind];
      if (sniffed && !allowList.includes(sniffed)) {
        return res.status(415).json({ error: `Detected type ${sniffed} is not allowed for ${kind}` });
      }
      if (!sniffed && !allowList.includes(req.file.mimetype)) {
        return res.status(415).json({ error: 'Unrecognised or unsupported file type' });
      }
      const effectiveMime = sniffed || req.file.mimetype;

      let mainUrl, thumbUrl = null;
      let width = null, height = null, durationMs = null;
      let bytes = buffer.length;
      let finalMime = effectiveMime;

      if (kind === 'image') {
        const { main, thumb } = await processImage(buffer);
        mainUrl   = await storage.save({ buffer: main.buffer,  key: newKey('webp'), mime: 'image/webp' });
        thumbUrl  = await storage.save({ buffer: thumb.buffer, key: newKey('webp'), mime: 'image/webp' });
        width     = main.width;
        height    = main.height;
        bytes     = main.buffer.length;
        finalMime = 'image/webp';
      } else {
        const ext   = extFromMime(effectiveMime);
        const probe = await probeMedia(buffer, ext, { wantPoster: kind === 'video' });
        durationMs  = probe.duration_ms ?? null;
        width       = probe.width ?? null;
        height      = probe.height ?? null;

        // Duration caps (only enforced when we could actually read a duration).
        if (kind === 'voice' && durationMs && durationMs > MAX_VOICE_MS) {
          return res.status(413).json({ error: 'Voice note exceeds the 5 minute limit' });
        }
        if (kind === 'video' && durationMs) {
          const cap = use === 'story' ? MAX_VIDEO_REEL_MS : MAX_VIDEO_POST_MS;
          if (durationMs > cap) {
            return res.status(413).json({ error: `Video exceeds the ${Math.round(cap / 1000)}s limit` });
          }
        }

        mainUrl = await storage.save({ buffer, key: newKey(ext), mime: effectiveMime });
        if (kind === 'video' && probe.posterWebp) {
          thumbUrl = await storage.save({ buffer: probe.posterWebp, key: newKey('webp'), mime: 'image/webp' });
        }
      }

      const result = await query(
        `INSERT INTO media_files
           (owner_id, kind, use_case, mime, url, thumbnail_url, bytes, width, height, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, kind, use, finalMime, mainUrl, thumbUrl, bytes, width, height, durationMs],
      );

      return res.status(201).json({
        id:            String(result.insertId),
        url:           mainUrl,
        thumbnail_url: thumbUrl,
        mime:          finalMime,
        bytes,
        width,
        height,
        duration_ms:   durationMs,
        kind,
        use,
      });
    } catch (e) {
      console.error('[media] upload failed:', e);
      return res.status(500).json({ error: 'Media processing failed' });
    }
  });
});

// ── GET /file?key=… (local driver only) ───────────────────────
router.get('/file', async (req, res) => {
  const key = String(req.query.key || '');
  // Reject traversal / absolute paths; allow only safe key characters.
  if (!key || key.includes('..') || key.startsWith('/') || !/^[\w./-]+$/.test(key)) {
    return res.status(400).end();
  }
  const localPath = storage.localPath ? storage.localPath(key) : null;
  if (!localPath) return res.status(404).end();
  return res.sendFile(localPath, (err) => {
    if (err && !res.headersSent) res.status(404).end();
  });
});

// ── GIF search (Tenor proxy) ──────────────────────────────────
// The API key lives ONLY on the server (env TENOR_API_KEY) so it is never
// shipped to the browser. Decision D5: Tenor over Giphy. Degrades gracefully
// to an empty, `configured:false` result when no key is set.
const TENOR_BASE = 'https://tenor.googleapis.com/v2';
const TENOR_TIMEOUT_MS = 6000;

function mapTenorResults(json) {
  const list = Array.isArray(json?.results) ? json.results : [];
  return list
    .map((r) => {
      const f = r.media_formats || {};
      const full = f.gif || f.mediumgif || f.tinygif || {};
      const preview = f.tinygif || f.nanogif || full || {};
      if (!full.url) return null;
      const dims = Array.isArray(full.dims) ? full.dims : [];
      return {
        id: String(r.id),
        description: r.content_description || 'GIF',
        url: full.url,
        preview: preview.url || full.url,
        width: dims[0] || null,
        height: dims[1] || null,
      };
    })
    .filter(Boolean);
}

async function tenorFetch(pathWithQuery) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TENOR_TIMEOUT_MS);
  try {
    const resp = await fetch(`${TENOR_BASE}${pathWithQuery}`, { signal: controller.signal });
    if (!resp.ok) throw new Error(`Tenor responded ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get('/gif/search', requireAuth, async (req, res) => {
  const key = process.env.TENOR_API_KEY;
  const q = String(req.query.q || '').trim();
  const pos = String(req.query.pos || '').trim();
  const limit = Math.min(Number(req.query.limit) || 24, 50);

  if (!key) return res.json({ results: [], next: null, configured: false });
  if (!q) return res.json({ results: [], next: null, configured: true });

  try {
    const params = new URLSearchParams({
      q,
      key,
      client_key: 'social442',
      limit: String(limit),
      media_filter: 'gif,tinygif,nanogif',
      contentfilter: 'high',
    });
    if (pos) params.set('pos', pos);
    const json = await tenorFetch(`/search?${params.toString()}`);
    return res.json({ results: mapTenorResults(json), next: json?.next || null, configured: true });
  } catch (err) {
    console.error('[GET /media/gif/search]', err?.message);
    return res.status(502).json({ error: 'GIF search failed', results: [] });
  }
});

router.get('/gif/trending', requireAuth, async (req, res) => {
  const key = process.env.TENOR_API_KEY;
  const pos = String(req.query.pos || '').trim();
  const limit = Math.min(Number(req.query.limit) || 24, 50);

  if (!key) return res.json({ results: [], next: null, configured: false });

  try {
    const params = new URLSearchParams({
      key,
      client_key: 'social442',
      limit: String(limit),
      media_filter: 'gif,tinygif,nanogif',
      contentfilter: 'high',
    });
    if (pos) params.set('pos', pos);
    const json = await tenorFetch(`/featured?${params.toString()}`);
    return res.json({ results: mapTenorResults(json), next: json?.next || null, configured: true });
  } catch (err) {
    console.error('[GET /media/gif/trending]', err?.message);
    return res.status(502).json({ error: 'GIF search failed', results: [] });
  }
});

// ── GET /:id (metadata) ───────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const rows = await query('SELECT * FROM media_files WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const m = rows[0];
  return res.json({
    id:            String(m.id),
    kind:          m.kind,
    use:           m.use_case,
    mime:          m.mime,
    url:           m.url,
    thumbnail_url: m.thumbnail_url,
    bytes:         Number(m.bytes),
    width:         m.width,
    height:        m.height,
    duration_ms:   m.duration_ms,
    created_at:    m.created_at,
  });
});

// ── DELETE /:id (owner-only, soft delete) ─────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const rows = await query('SELECT * FROM media_files WHERE id = ? AND is_deleted = 0', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const m = rows[0];
  if (String(m.owner_id) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Not your file' });
  }

  await query('UPDATE media_files SET is_deleted = 1 WHERE id = ?', [req.params.id]);

  // Best-effort removal of the underlying objects (soft-delete is the SoT).
  try {
    if (storage.keyFromUrl) {
      await storage.remove(storage.keyFromUrl(m.url));
      if (m.thumbnail_url) await storage.remove(storage.keyFromUrl(m.thumbnail_url));
    }
  } catch (e) {
    console.warn('[media] object cleanup failed (row already soft-deleted):', e?.message);
  }

  return res.json({ ok: true });
});

export default router;
