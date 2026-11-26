// api/index.js — the hosted (Vercel) version of /api/*.
// vercel.json sends /api/<name> here as ?route=<name>. The logic is in
// lib/core.js, the same code the Docker server runs.

import { handleApi, API_HEADERS } from '../lib/core.js';

export default async function handler(req, res) {
  const pathname = '/api/' + String(req.query.route || '');
  // Vercel has already parsed a JSON body into req.body.
  const readJson = async () => (typeof req.body === 'object' && req.body) ? req.body : JSON.parse(req.body || '{}');
  const { status, body } = await handleApi(pathname, req.method, readJson);
  for (const [k, v] of Object.entries(API_HEADERS)) res.setHeader(k, v);
  res.status(status).send(JSON.stringify(body));
}
