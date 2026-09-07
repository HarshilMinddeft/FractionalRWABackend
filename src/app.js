const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const RouteLoader = require('./core/RouteLoader');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');

class App {
  constructor() {
    this.server = express();
  }

  // ── Step 1: Connect to MongoDB ─────────────────────────────────────────────
  async connectDatabase() {
    await connectDB();
  }

  // ── Step 2: Register global middleware ────────────────────────────────────
  setupMiddleware() {
    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: true }));
    this.server.use(
      cors({
        origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      }),
    );
  }

  // ── Step 3: Health check ──────────────────────────────────────────────────
  // Registered before setupRoutes() so the 404 fallback can't swallow it, and
  // outside src/modules/ because RouteLoader would prefix it with /api/<folder>.
  setupHealthCheck() {
    // mongoose.STATES maps the numeric readyState to a readable name
    // (0 disconnected, 1 connected, 2 connecting, 3 disconnecting).
    this.server.get('/health', (_req, res) => {
      const state = mongoose.connection.readyState;
      const healthy = state === 1;

      // 503 on a dropped database so a load balancer stops routing here,
      // rather than reporting 200 while every query fails.
      res.status(healthy ? 200 : 503).json({
        success: healthy,
        message: healthy ? 'OK' : 'Database unavailable',
        data: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          environment: env.NODE_ENV,
          database: mongoose.STATES[state],
        },
      });
    });
  }

  // ── Step 4: Auto-load all module routes ───────────────────────────────────
  async setupRoutes() {
    await RouteLoader.register(this.server);

    // 404 fallback
    this.server.use((_req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    // Global error handler (must be last)
    this.server.use(errorHandler);
  }

  // ── Orchestrate startup ───────────────────────────────────────────────────
  async initialize() {
    await this.connectDatabase();
    this.setupMiddleware();
    this.setupHealthCheck();
    await this.setupRoutes();

    const PORT = env.PORT;
    this.server.listen(PORT, '0.0.0.0', () => {
      console.info(`🚀 FractionalRWA Backend running on port ${PORT}`);
      console.info(`   Environment : ${env.NODE_ENV}`);
    });
  }
}

module.exports = new App();
