import { createMockOidc } from './provider.js';

const port = Number(process.env['MOCK_OIDC_PORT'] ?? 9100);
const issuer = process.env['MOCK_OIDC_ISSUER'] ?? `http://localhost:${port}`;

const { app } = await createMockOidc({ issuer });
app.listen(port, () => {
  console.log(`[mock-oidc] DEV ONLY provider listening on ${issuer}`);
});
