/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return handleCORS();
		}

		// API Routes
		if (url.pathname === '/api/hello') {
			return handleHello(request);
		}

		if (url.pathname === '/api/status') {
			return handleStatus(env);
		}

		// Default route
		return handleDefault();
	},
};

function handleCORS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}

async function handleHello(request) {
	const data = {
		message: 'Hello World from Cloudflare Workers! 🚀',
		timestamp: new Date().toISOString(),
		method: request.method,
		userAgent: request.headers.get('User-Agent'),
	};

	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

function handleStatus(env) {
	const status = {
		status: 'healthy',
		environment: env.ENVIRONMENT || 'development',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
	};

	return new Response(JSON.stringify(status, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

function handleDefault() {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Backend - Cloudflare Worker</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 { margin-top: 0; }
        .endpoint {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            border-left: 4px solid #4ade80;
        }
        code {
            background: rgba(0, 0, 0, 0.2);
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Consolas', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Track Backend</h1>
        <p>Welcome to your Cloudflare Worker! This is a Node.js-compatible worker running on the edge.</p>
        
        <h2>Available Endpoints:</h2>
        
        <div class="endpoint">
            <h3>GET /api/hello</h3>
            <p>Returns a hello world message with request information</p>
            <code>curl ${location.origin}/api/hello</code>
        </div>
        
        <div class="endpoint">
            <h3>GET /api/status</h3>
            <p>Returns the health status of the worker</p>
            <code>curl ${location.origin}/api/status</code>
        </div>
        
        <p><strong>Environment:</strong> Cloudflare Workers with Node.js compatibility</p>
        <p><strong>Framework:</strong> Native Fetch API</p>
        <p><strong>Deployment:</strong> Ready for <code>npm run deploy</code></p>
    </div>
</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html',
			'Access-Control-Allow-Origin': '*',
		},
	});
}


