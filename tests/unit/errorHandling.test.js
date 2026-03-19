import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorHandling } from '@/use/errorHandling'

describe('useErrorHandling', () => {
	let composable

	beforeEach(() => {
		composable = useErrorHandling()
		composable.validationErrors.clear()
		composable.isSubmitLocked.value = false
	})

	it('locks and unlocks submit state', () => {
		expect(composable.isSubmitLocked.value).toBe(false)
		composable.beforeSubmit()
		expect(composable.isSubmitLocked.value).toBe(true)

		composable.unlockSubmit()
		expect(composable.isSubmitLocked.value).toBe(false)
	})

	it('clears validation error for empty names', () => {
		composable.validationErrors.set('seat_1', 'error')
		composable.validateName('seat_1', '', [])

		expect(composable.validationErrors.has('seat_1')).toBe(false)
	})

	it('requires first and last name', () => {
		composable.validateName('seat_1', 'Cher', [])

		expect(composable.validationErrors.get('seat_1')).toBe('Bitte trage Vor- und Nachnamen ein.')
	})

	it('adds collision suggestions for similar names', () => {
		composable.validateName('seat_1', 'Max Mustermann', [
			{ name: 'Max Mustermann', table: '3' },
			{ name: 'Anna Beispiel', table: '2' },
		])

		const errors = composable.validationErrors.get('seat_1')
		expect(Array.isArray(errors)).toBe(true)
		expect(errors).toContain('<span class="font-600">Max Mustermann</span> an Tisch 3')
	})

	it('removes previous error for valid and unique names', () => {
		composable.validateName('seat_1', 'SingleName', [])
		expect(composable.validationErrors.has('seat_1')).toBe(true)

		composable.validateName('seat_1', 'Erika Mustermann', [])
		expect(composable.validationErrors.has('seat_1')).toBe(false)
	})

	it('validates duplicate table names case-insensitively', () => {
		composable.validateTableName('garten', ['Bar', 'Garten'])
		expect(composable.validationErrors.get('name')).toBe('Bitte wähle einen anderen Namen')

		composable.validateTableName('Lounge', ['Bar', 'Garten'])
		expect(composable.validationErrors.has('name')).toBe(false)
	})

	it('unlocks submit on handleSubmitError', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		composable.beforeSubmit()
		expect(composable.isSubmitLocked.value).toBe(true)

		composable.handleSubmitError(new Error('boom'))

		expect(composable.isSubmitLocked.value).toBe(false)
		logSpy.mockRestore()
	})
})
