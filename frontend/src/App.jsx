import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import ProductionRoadmap from './pages/ProductionRoadmap'
import QRScanner from './pages/QRScanner'
import ProductDetails from './pages/ProductDetails'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Routes with Layout (navigation tabs) */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/roadmap" element={<Layout><ProductionRoadmap /></Layout>} />
        <Route path="/scanner" element={<Layout><QRScanner /></Layout>} />
        
        {/* Standalone route without Layout (no navigation tabs) */}
        <Route path="/product/:id" element={<ProductDetails />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App


