// src/worker.js
import { Router } from 'itty-router';
import express from 'express';

// ←←← โค้ด Express ของคุณวางตรงนี้ ←←←
const app = express();

// ใช้ built-in แทน body-parser (Express 4.16+ มีในตัว รองรับ Workers ดีกว่า)
app.use(express.json({ limit: '10mb' }));  // สำหรับ JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  // สำหรับ form data

// Routes ของคุณทั้งหมด (copy มาจาก app.js/server.js)
app.get('/', (req, res) => res.send('Hello from Express on Cloudflare!'));
app.get('/api/test', (req, res) => res.json({ ok: true, time: Date.now() }));
// ... routes อื่น ๆ ของคุณ

// ──────────────────────────────
// ส่วน bridge (ไม่ต้องแก้)
const router = Router();
router.all('*', (request) => app(request._cfRequest || request));

export default {
  fetch: router.handle
};