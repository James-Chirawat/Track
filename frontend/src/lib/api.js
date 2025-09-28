// API configuration for backend communication
const API_BASE_URL = 'https://track-backend.webhookapi.workers.dev'

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async request(endpoint, options = {}, retries = 2) {
    const url = `${this.baseUrl}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 8000, // 8 second timeout
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return data
      } catch (error) {
        console.error(`API request failed (attempt ${attempt + 1}):`, error)
        
        if (attempt === retries) {
          throw error
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  // Branches API
  async getBranches() {
    return this.request('/api/branches')
  }

  async createBranch(branchData) {
    return this.request('/api/branches', {
      method: 'POST',
      body: branchData,
    })
  }

  // Products API
  async getProducts() {
    return this.request('/api/products')
  }

  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: productData,
    })
  }

  async getProduct(productId) {
    return this.request(`/api/products/${productId}`)
  }

  async updateProduct(productId, productData) {
    return this.request(`/api/products/${productId}`, {
      method: 'PUT',
      body: productData,
    })
  }

  // Production Stages API
  async createProductionStage(stageData) {
    return this.request('/api/production-stages', {
      method: 'POST',
      body: stageData,
    })
  }

  // Dashboard API
  async getDashboardData() {
    return this.request('/api/dashboard')
  }
}

export const apiClient = new ApiClient()
export default apiClient
