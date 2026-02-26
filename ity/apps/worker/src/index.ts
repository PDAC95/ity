export interface Env {
  DOMAIN_MAPPING: KVNamespace;
  UPLOADS: R2Bucket;
  VERCEL_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Skip for localhost and Vercel preview URLs
    if (
      hostname === 'localhost' ||
      hostname.includes('vercel.app') ||
      hostname.includes('127.0.0.1')
    ) {
      return fetch(request);
    }

    // Skip for main ITY domains (handled directly by Vercel)
    if (hostname === 'ity.com' || hostname.endsWith('.ity.com')) {
      return fetch(request);
    }

    // Lookup custom domain in KV store
    let schoolId: string | null = null;

    try {
      schoolId = await env.DOMAIN_MAPPING.get(hostname);
    } catch (error) {
      console.error('KV lookup error:', error);
    }

    if (!schoolId) {
      return new Response(
        JSON.stringify({
          error: 'School not found',
          message: `No school is configured for domain: ${hostname}`,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Forward to Vercel with school context headers
    const vercelUrl = new URL(url.pathname + url.search, env.VERCEL_URL);

    const newHeaders = new Headers(request.headers);
    newHeaders.set('X-School-ID', schoolId);
    newHeaders.set('X-School-Domain', hostname);
    newHeaders.set('X-Forwarded-Host', hostname);

    const newRequest = new Request(vercelUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'manual',
    });

    try {
      const response = await fetch(newRequest);

      // Clone response and modify headers if needed
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Served-By', 'ity-domain-router');

      return newResponse;
    } catch (error) {
      console.error('Upstream fetch error:', error);
      return new Response(
        JSON.stringify({
          error: 'Upstream error',
          message: 'Failed to reach the application server',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
