import { defineConfig } from '@playwright/test';

const development = 'http://127.0.0.1:4317';
const production = 'http://127.0.0.1:4318';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: development,
    viewport: { width: 960, height: 640 },
    trace: 'retain-on-failure',
    launchOptions: process.env.ROOM_CHROME_PATH
      ? { executablePath: process.env.ROOM_CHROME_PATH }
      : {},
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4317 --strictPort',
      url: `${development}/room/`,
    },
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 4318 --strictPort --base /harmonic-parser/',
      url: `${production}/harmonic-parser/`,
    },
  ],
});
