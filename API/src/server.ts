import { config } from './config/env';
import { connectDB } from './config/db';
import app from './app';
import { initSocket } from './socket';
import { recoverActiveDeliveries } from './modules/delivery/delivery.simulator';

async function bootstrap(): Promise<void> {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Initialize socket.io
  initSocket(server);

  // Recover active deliveries from MongoDB after startup/restart
  recoverActiveDeliveries().catch((err) => {
    console.error('[server] Active delivery recovery failed:', err);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
}

bootstrap();
