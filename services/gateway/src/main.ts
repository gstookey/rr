import { createGatewayApp } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);

createGatewayApp().listen(port, () => {
  console.log(`[gateway] ACME Workshop BFF (S0 skeleton) listening on http://localhost:${port}`);
});
