import { callGeminiPool } from './gemini-pool.ts';

Deno.test('parallel winner cancels unfinished generation requests', async () => {
  const original = globalThis.fetch;
  const signals: AbortSignal[] = [];
  let calls = 0;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input).includes('pageSize')) return Response.json({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }] });
    calls++;
    if (init?.signal) signals.push(init.signal);
    await new Promise(resolve => setTimeout(resolve, calls === 1 ? 5 : 25));
    return Response.json({ candidates: [{ content: { parts: [{ text: 'answer' }] } }] });
  }) as typeof fetch;
  try {
    const result = await callGeminiPool({ keys: ['test-key-a', 'test-key-b'], models: ['gemini-2.5-flash'], prompt: 'test', maxTokens: 100, race: 2 });
    if (result.text !== 'answer' || !signals.some(signal => signal.aborted)) throw Error('Unfinished requests were not cancelled');
    await new Promise(resolve => setTimeout(resolve, 35));
  } finally { globalThis.fetch = original; }
});

Deno.test('aliases resolving to the same model are requested only once', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response('{}', { status: 429 }); }) as typeof fetch;
  try {
    await callGeminiPool({ keys: ['test-key-c'], models: ['gemini-2.0-flash', 'gemini-2.5-flash'], prompt: 'test', maxTokens: 100 });
    if (calls !== 1) throw Error(`Expected one request, received ${calls}`);
  } finally { globalThis.fetch = original; }
});