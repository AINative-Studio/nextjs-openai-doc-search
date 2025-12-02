// Jest setup file
// This file runs before each test file

// Mock environment variables for testing
process.env.META_API_KEY = 'test-meta-api-key'
process.env.META_BASE_URL = 'https://api.llama.com/compat/v1'
process.env.META_MODEL = 'Llama-4-Maverick-17B-128E-Instruct-FP8'
process.env.ZERODB_API_URL = 'https://api.ainative.studio'
process.env.ZERODB_PROJECT_ID = 'test-project-id'
process.env.ZERODB_EMAIL = 'test@example.com'
process.env.ZERODB_PASSWORD = 'test-password'

// Suppress console errors in tests unless needed
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Add TextEncoder and TextDecoder for edge runtime compatibility
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
