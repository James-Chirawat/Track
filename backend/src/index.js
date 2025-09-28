/**
 * Cocoa Track Backend API
 * Handles all data operations for the cocoa production tracking system
 */

import { createClient } from '@supabase/supabase-js'

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return handleCORS();
		}

		// Initialize Supabase client
		const supabase = createClient(
			env.SUPABASE_URL || 'https://sgbfyazjkdbtopzkndkd.supabase.co',
			env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYmZ5YXpqa2RidG9wemtuZGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTIwMzMsImV4cCI6MjA2ODIyODAzM30.jsfpX2AvzjCiTbU-3TycydgNkhR1lxsrsl1aarDllEI'
		);

		// API Routes
		if (url.pathname === '/api/branches') {
			return handleBranches(request, supabase);
		}

		if (url.pathname === '/api/products') {
			return handleProducts(request, supabase);
		}

		if (url.pathname.startsWith('/api/products/')) {
			const productId = url.pathname.split('/')[3];
			return handleProductById(request, supabase, productId);
		}

		if (url.pathname === '/api/production-stages') {
			return handleProductionStages(request, supabase);
		}

		if (url.pathname === '/api/dashboard') {
			return handleDashboard(request, supabase);
		}

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

// Branches API Handler
async function handleBranches(request, supabase) {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		if (request.method === 'GET') {
			const { data, error } = await supabase
				.from('branches')
				.select('*')
				.order('name');

			if (error) throw error;

			return new Response(JSON.stringify({ success: true, data }), { headers });
		}

		if (request.method === 'POST') {
			const body = await request.json();
			const { data, error } = await supabase
				.from('branches')
				.insert([body])
				.select()
				.single();

			if (error) throw error;

			return new Response(JSON.stringify({ success: true, data }), { headers });
		}

		return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { 
			status: 405, 
			headers 
		});
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error: error.message }), { 
			status: 500, 
			headers 
		});
	}
}

// Products API Handler
async function handleProducts(request, supabase) {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		if (request.method === 'GET') {
			const { data, error } = await supabase
				.from('products')
				.select(`
					*,
					branches (
						id,
						name,
						location
					)
				`)
				.order('created_at', { ascending: false });

			if (error) throw error;

			return new Response(JSON.stringify({ success: true, data }), { headers });
		}

		if (request.method === 'POST') {
			const body = await request.json();
			const { data, error } = await supabase
				.from('products')
				.insert([body])
				.select(`
					*,
					branches (
						id,
						name,
						location
					)
				`)
				.single();

			if (error) throw error;

			return new Response(JSON.stringify({ success: true, data }), { headers });
		}

		return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { 
			status: 405, 
			headers 
		});
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error: error.message }), { 
			status: 500, 
			headers 
		});
	}
}

// Single Product API Handler
async function handleProductById(request, supabase, productId) {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		if (request.method === 'GET') {
			// Get product details
			const { data: product, error: productError } = await supabase
				.from('products')
				.select(`
					*,
					branches (
						id,
						name,
						location,
						manager_name
					)
				`)
				.eq('id', productId)
				.single();

			if (productError) throw productError;

			// Get production stages
			const { data: stages, error: stagesError } = await supabase
				.from('production_stages')
				.select('*')
				.eq('product_id', productId)
				.order('recorded_at');

			if (stagesError) throw stagesError;

			return new Response(JSON.stringify({ 
				success: true, 
				data: { 
					product, 
					stages: stages || [] 
				} 
			}), { headers });
		}

		if (request.method === 'PUT') {
			const body = await request.json();
			const { data, error } = await supabase
				.from('products')
				.update(body)
				.eq('id', productId)
				.select(`
					*,
					branches (
						id,
						name,
						location
					)
				`)
				.single();

			if (error) throw error;

			return new Response(JSON.stringify({ success: true, data }), { headers });
		}

		return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { 
			status: 405, 
			headers 
		});
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error: error.message }), { 
			status: 500, 
			headers 
		});
	}
}

// Production Stages API Handler
async function handleProductionStages(request, supabase) {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		if (request.method === 'POST') {
			const body = await request.json();
			const { data, error } = await supabase
				.from('production_stages')
				.insert([body])
				.select()
				.single();

			if (error) throw error;

			return new Response(JSON.stringify({ success: true, data }), { headers });
		}

		return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { 
			status: 405, 
			headers 
		});
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error: error.message }), { 
			status: 500, 
			headers 
		});
	}
}

// Dashboard API Handler
async function handleDashboard(request, supabase) {
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		if (request.method === 'GET') {
			// Get all branches
			const { data: branches, error: branchesError } = await supabase
				.from('branches')
				.select('id, name, location')
				.order('name');

			if (branchesError) throw branchesError;

			// Get products with branch information
			const { data: products, error: productsError } = await supabase
				.from('products')
				.select(`
					id, 
					status, 
					branch_id,
					branches (
						id,
						name,
						location
					)
				`);

			if (productsError) throw productsError;

			// Get recent activity
			const { data: recentActivity, error: activityError } = await supabase
				.from('production_stages')
				.select(`
					id,
					stage_name,
					recorded_at,
					products (
						id,
						batch_number,
						branches (
							name
						)
					)
				`)
				.order('recorded_at', { ascending: false })
				.limit(10);

			if (activityError) throw activityError;

			// Calculate overall statistics
			const totalProducts = products?.length || 0;
			const inProduction = products?.filter(p => p.status === 'in_production').length || 0;
			const completed = products?.filter(p => p.status === 'completed').length || 0;
			const cancelled = products?.filter(p => p.status === 'cancelled').length || 0;

			// Calculate detailed branch statistics
			const branchStats = {};
			
			// Initialize all branches with zero counts
			branches?.forEach(branch => {
				branchStats[branch.id] = {
					branchId: branch.id,
					branchName: branch.name,
					branchLocation: branch.location,
					total: 0,
					inProduction: 0,
					completed: 0,
					cancelled: 0,
					statusBreakdown: {
						in_production: 0,
						completed: 0,
						cancelled: 0
					}
				};
			});

			// Count products by branch and status
			products?.forEach(product => {
				if (product.branch_id && branchStats[product.branch_id]) {
					const branch = branchStats[product.branch_id];
					branch.total++;
					
					switch (product.status) {
						case 'in_production':
							branch.inProduction++;
							branch.statusBreakdown.in_production++;
							break;
						case 'completed':
							branch.completed++;
							branch.statusBreakdown.completed++;
							break;
						case 'cancelled':
							branch.cancelled++;
							branch.statusBreakdown.cancelled++;
							break;
					}
				}
			});

			// Convert branchStats object to array for easier frontend handling
			const branchStatsArray = Object.values(branchStats);

			// Calculate status distribution
			const statusDistribution = {
				in_production: { count: inProduction, percentage: totalProducts > 0 ? Math.round((inProduction / totalProducts) * 100) : 0 },
				completed: { count: completed, percentage: totalProducts > 0 ? Math.round((completed / totalProducts) * 100) : 0 },
				cancelled: { count: cancelled, percentage: totalProducts > 0 ? Math.round((cancelled / totalProducts) * 100) : 0 }
			};

			return new Response(JSON.stringify({ 
				success: true, 
				data: {
					totalProducts,
					inProduction,
					completed,
					cancelled,
					statusDistribution,
					branchStats: branchStatsArray,
					recentActivity: recentActivity || []
				}
			}), { headers });
		}

		return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { 
			status: 405, 
			headers 
		});
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error: error.message }), { 
			status: 500, 
			headers 
		});
	}
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


