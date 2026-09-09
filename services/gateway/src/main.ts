import { createGateway } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);
const gateway = createGateway();

gateway.app.listen(port, () => {
  console.log(
    `[gateway] ACME Workshop BFF (S1) on http://localhost:${port} · sessions: ${gateway.sessionStoreKind}`,
  );
  if (gateway.sessionStoreKind === 'memory') {
    console.warn('[gateway] IN-MEMORY SESSIONS — set DATABASE_URL for the Postgres-backed store.');
  }
});
