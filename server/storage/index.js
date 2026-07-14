/**
 * server/storage/index.js — pluggable object storage.
 *
 * One small interface, two drivers, selected by env `STORAGE_DRIVER`:
 *   - 'local' (default) — writes to ./uploads, served back through the API at
 *     GET /api/media/file?key=… (so it works behind the existing Vite /api
 *     proxy with no extra config).
 *   - 'r2' | 's3'       — Cloudflare R2 or any S3-compatible bucket. R2 is
 *     S3-compatible, so we code against the AWS S3 SDK and swapping to AWS is a
 *     pure config change (per ratified decision D4).
 *
 * Interface every driver implements:
 *   async save({ buffer, key, mime }) -> publicUrl
 *   async remove(key) -> void
 *   publicUrl(key) -> string
 *   keyFromUrl(url) -> string|null
 *   localPath(key) -> string|null      (local driver only)
 *
 * Required env for the R2/S3 driver:
 *   STORAGE_DRIVER=r2
 *   R2_BUCKET=...            R2_ENDPOINT=https://<acct>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID=...     R2_SECRET_ACCESS_KEY=...
 *   R2_PUBLIC_BASE=https://cdn.yourdomain.com   (public/CDN base for objects)
 *   R2_REGION=auto           (optional; defaults to 'auto')
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DRIVER     = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
const LOCAL_ROUTE = '/api/media/file';

/** Build a collision-free, date-sharded storage key. */
export function newKey(ext, dir = 'media') {
  const d    = new Date();
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const id   = randomUUID().replace(/-/g, '');
  const clean = ext ? `.${String(ext).replace(/^\./, '')}` : '';
  return `${dir}/${yyyy}/${mm}/${id}${clean}`;
}

// ── Local disk driver ─────────────────────────────────────────
class LocalDiskStorage {
  constructor() {
    this.dir = UPLOAD_DIR;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async save({ buffer, key }) {
    const full = path.join(this.dir, key);
    await fs.promises.mkdir(path.dirname(full), { recursive: true });
    await fs.promises.writeFile(full, buffer);
    return this.publicUrl(key);
  }

  async remove(key) {
    if (!key) return;
    await fs.promises.rm(path.join(this.dir, key), { force: true }).catch(() => {});
  }

  publicUrl(key) {
    const base = process.env.PUBLIC_MEDIA_BASE || LOCAL_ROUTE;
    return `${base}?key=${encodeURIComponent(key)}`;
  }

  keyFromUrl(url) {
    if (!url) return null;
    const i = url.indexOf('key=');
    return i >= 0 ? decodeURIComponent(url.slice(i + 4)) : null;
  }

  localPath(key) {
    return path.join(this.dir, key);
  }
}

// ── S3 / Cloudflare R2 driver ─────────────────────────────────
class S3Storage {
  constructor() {
    this.bucket     = process.env.R2_BUCKET || process.env.S3_BUCKET;
    this.publicBase = (process.env.R2_PUBLIC_BASE || process.env.S3_PUBLIC_BASE || '').replace(/\/$/, '');
    this._client    = null;
    if (!this.bucket || !this.publicBase) {
      console.warn('[storage] R2/S3 driver selected but R2_BUCKET / R2_PUBLIC_BASE are not fully configured.');
    }
  }

  async _getClient() {
    if (this._client) return this._client;
    // Lazy-import so local-only dev never needs the AWS SDK installed at runtime.
    const { S3Client } = await import('@aws-sdk/client-s3');
    this._client = new S3Client({
      region:         process.env.R2_REGION || process.env.S3_REGION || 'auto',
      endpoint:       process.env.R2_ENDPOINT || process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID     || process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
      },
    });
    return this._client;
  }

  async save({ buffer, key, mime }) {
    const client = await this._getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await client.send(new PutObjectCommand({
      Bucket:       this.bucket,
      Key:          key,
      Body:         buffer,
      ContentType:  mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return this.publicUrl(key);
  }

  async remove(key) {
    if (!key) return;
    const client = await this._getClient();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch(() => {});
  }

  publicUrl(key) {
    return `${this.publicBase}/${key}`;
  }

  keyFromUrl(url) {
    if (!url || !this.publicBase) return null;
    return url.startsWith(this.publicBase) ? url.slice(this.publicBase.length + 1) : null;
  }

  localPath() {
    return null; // objects are served from the CDN, not the API host
  }
}

let _storage = null;

/** Returns the process-wide storage singleton for the configured driver. */
export function getStorage() {
  if (_storage) return _storage;
  _storage = (DRIVER === 'r2' || DRIVER === 's3') ? new S3Storage() : new LocalDiskStorage();
  console.log(`[storage] driver = ${DRIVER === 'r2' || DRIVER === 's3' ? 'r2/s3' : 'local'}`);
  return _storage;
}
