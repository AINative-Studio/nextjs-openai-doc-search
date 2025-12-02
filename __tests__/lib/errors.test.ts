/**
 * Unit Tests for Error Classes
 * Tests ApplicationError and UserError custom error types
 */

import { ApplicationError, UserError } from '../../lib/errors'

describe('Error Classes', () => {
  describe('ApplicationError', () => {
    it('should create error with message', () => {
      const error = new ApplicationError('Test error')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ApplicationError)
      expect(error.message).toBe('Test error')
    })

    it('should create error with message and data', () => {
      const errorData = { code: 500, details: 'Server error' }
      const error = new ApplicationError('Server failed', errorData)

      expect(error.message).toBe('Server failed')
      expect(error.data).toEqual(errorData)
    })

    it('should handle default empty data object', () => {
      const error = new ApplicationError('Simple error')
      expect(error.data).toEqual({})
    })

    it('should preserve error stack trace', () => {
      const error = new ApplicationError('Stack test')
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('Stack test')
    })

    it('should handle complex nested data', () => {
      const complexData = {
        nested: { value: 123 },
        array: [1, 2, 3],
        status: 'failed',
      }
      const error = new ApplicationError('Complex error', complexData)
      expect(error.data).toEqual(complexData)
    })
  })

  describe('UserError', () => {
    it('should create error with message', () => {
      const error = new UserError('Invalid input')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UserError)
      expect(error).toBeInstanceOf(ApplicationError)
      expect(error.message).toBe('Invalid input')
    })

    it('should create error with message and data', () => {
      const errorData = { field: 'email', reason: 'invalid format' }
      const error = new UserError('Validation failed', errorData)

      expect(error.message).toBe('Validation failed')
      expect(error.data).toEqual(errorData)
    })

    it('should handle default empty data object', () => {
      const error = new UserError('User error')
      expect(error.data).toEqual({})
    })

    it('should preserve error stack trace', () => {
      const error = new UserError('Stack test')
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('Stack test')
    })

    it('should extend ApplicationError', () => {
      const userError = new UserError('User issue')
      const appError = new ApplicationError('App issue')

      // UserError extends ApplicationError
      expect(userError).toBeInstanceOf(UserError)
      expect(userError).toBeInstanceOf(ApplicationError)
      expect(appError).toBeInstanceOf(ApplicationError)
      expect(appError).not.toBeInstanceOf(UserError)
    })
  })

  describe('Error Handling Patterns', () => {
    it('should be catchable in try-catch', () => {
      expect(() => {
        throw new ApplicationError('Test')
      }).toThrow(ApplicationError)

      expect(() => {
        throw new UserError('Test')
      }).toThrow(UserError)
    })

    it('should maintain instanceof checks in catch blocks', () => {
      try {
        throw new ApplicationError('App error')
      } catch (error) {
        expect(error instanceof ApplicationError).toBe(true)
        expect(error instanceof UserError).toBe(false)
      }

      try {
        throw new UserError('User error')
      } catch (error) {
        expect(error instanceof UserError).toBe(true)
        // UserError extends ApplicationError, so this is true
        expect(error instanceof ApplicationError).toBe(true)
      }
    })

    it('should support error data extraction in catch blocks', () => {
      const testData = { code: 404, resource: 'user' }

      try {
        throw new ApplicationError('Not found', testData)
      } catch (error) {
        if (error instanceof ApplicationError) {
          expect(error.data).toEqual(testData)
        }
      }
    })
  })

  describe('Error Serialization', () => {
    it('should serialize ApplicationError to JSON', () => {
      const error = new ApplicationError('Test error', { code: 500 })
      const serialized = JSON.stringify({
        message: error.message,
        data: error.data,
      })

      expect(serialized).toContain('Test error')
      expect(serialized).toContain('500')
    })

    it('should serialize UserError to JSON', () => {
      const error = new UserError('Validation error', { field: 'email' })
      const serialized = JSON.stringify({
        message: error.message,
        data: error.data,
      })

      expect(serialized).toContain('Validation error')
      expect(serialized).toContain('email')
    })
  })
})
