/**
 * Vitest global test setup.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server.js';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
