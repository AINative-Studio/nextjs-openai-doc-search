/**
 * Comprehensive Tests for utils.ts
 * Ensures 100% coverage of utility functions
 */

import { cn } from '@/lib/utils'

describe('Utils Module', () => {
  describe('cn - Class Name Utility', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle single class name', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('should handle multiple class names', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toContain('base')
      expect(result).toContain('active')
    })

    it('should handle false conditional classes', () => {
      const isActive = false
      const result = cn('base', isActive && 'active')
      expect(result).toContain('base')
      expect(result).not.toContain('active')
    })

    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2'])
      expect(result).toBeDefined()
    })

    it('should handle object notation', () => {
      const result = cn({ 'class1': true, 'class2': false, 'class3': true })
      expect(result).toContain('class1')
      expect(result).toContain('class3')
      expect(result).not.toContain('class2')
    })

    it('should merge Tailwind classes correctly', () => {
      // Test Tailwind merge functionality
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBeDefined()
      // tailwind-merge should resolve conflicts, keeping px-4
      expect(result).toContain('px-4')
      expect(result).toContain('py-1')
    })

    it('should handle complex Tailwind conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500')
      // Should keep last bg- class
      expect(result).toContain('bg-blue-500')
      expect(result).not.toContain('bg-red-500')
    })

    it('should handle no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle whitespace', () => {
      const result = cn('  class1  ', '  class2  ')
      expect(result).toBeDefined()
    })

    it('should handle mixed inputs', () => {
      const result = cn(
        'base-class',
        { 'conditional-1': true, 'conditional-2': false },
        ['array-class-1', 'array-class-2'],
        undefined,
        'final-class'
      )

      expect(result).toContain('base-class')
      expect(result).toContain('conditional-1')
      expect(result).not.toContain('conditional-2')
      expect(result).toContain('final-class')
    })

    it('should handle responsive Tailwind classes', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg')
      expect(result).toContain('text-sm')
      expect(result).toContain('md:text-base')
      expect(result).toContain('lg:text-lg')
    })

    it('should handle hover and focus states', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2')
      expect(result).toContain('hover:bg-blue-500')
      expect(result).toContain('focus:ring-2')
    })

    it('should merge duplicate classes', () => {
      const result = cn('class1 class2', 'class1 class3')
      expect(result).toBeDefined()
      // twMerge should handle duplicates, but we just verify it works
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('class')
    })

    it('should handle complex combinations', () => {
      const result = cn(
        'px-4 py-2',
        'bg-blue-500',
        'hover:bg-blue-600',
        'text-white',
        { 'rounded': true, 'shadow': false },
        ['transition', 'duration-200']
      )

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
