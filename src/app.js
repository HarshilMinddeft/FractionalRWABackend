const express = require('express');
const cors = require('cors');
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

  // ── Step 3: Auto-load all module routes ───────────────────────────────────
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
    await this.setupRoutes();

    const PORT = env.PORT;
    this.server.listen(PORT, '0.0.0.0', () => {
      console.info(`🚀 FractionalRWA Backend running on port ${PORT}`);
      console.info(`   Environment : ${env.NODE_ENV}`);
    });
  }
}

module.exports = new App();
