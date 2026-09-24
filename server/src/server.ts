import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { seedExampleData } from './config/seedExampleData.js';
import { ensureDemoUsers } from './config/seedUsers.js';
import './models/index.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await ensureDemoUsers();
  await seedExampleData();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
