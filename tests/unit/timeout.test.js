import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTimeout, EDIT_TIMEOUT } from '@/use/timeout'

describe('useTimeout', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('starts countdown and fires callback at timeout', () => {
		const timeout = useTimeout()
		const onTimeout = vi.fn()

		timeout.setTimer(onTimeout)
		expect(timeout.isTimerRunning.value).toBe(true)
		expect(timeout.countdown.value).toBe(EDIT_TIMEOUT / 1000)

		vi.advanceTimersByTime(1000)
		expect(timeout.countdown.value).toBe(EDIT_TIMEOUT / 1000 - 1)

		vi.advanceTimersByTime(EDIT_TIMEOUT - 1000)
		expect(onTimeout).toHaveBeenCalledTimes(1)
	})

	it('clears timer and stops countdown updates', () => {
		const timeout = useTimeout()
		const onTimeout = vi.fn()

		timeout.setTimer(onTimeout)
		vi.advanceTimersByTime(2000)
		const stoppedAt = timeout.countdown.value

		timeout.clearTimer()
		expect(timeout.isTimerRunning.value).toBe(false)

		vi.advanceTimersByTime(EDIT_TIMEOUT)
		expect(onTimeout).not.toHaveBeenCalled()
		expect(timeout.countdown.value).toBe(stoppedAt)
	})

	it('fetches server time and stores offset when drift is larger than 2 seconds', async () => {
		const timeout = useTimeout()
		const clientNow = new Date('2026-03-19T12:00:00.000Z').getTime()
		vi.spyOn(Date, 'now').mockReturnValue(clientNow)

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				atom: new Date(clientNow + 3000).toISOString(),
				micro: 0,
			}),
		})
		vi.stubGlobal('fetch', mockFetch)

		await timeout.fetchTime()

		expect(mockFetch).toHaveBeenCalledTimes(1)
		expect(timeout.clientTime.value.length).toBeGreaterThan(0)
		expect(timeout.serverTime.value.length).toBeGreaterThan(0)
		expect(timeout.clientOffset.value).toBe(3000)
	})

	it('does not store offset when drift is 2 seconds or smaller', async () => {
		const timeout = useTimeout()
		const clientNow = new Date('2026-03-19T12:00:00.000Z').getTime()
		vi.spyOn(Date, 'now').mockReturnValue(clientNow)

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				atom: new Date(clientNow + 2000).toISOString(),
				micro: 0,
			}),
		})
		vi.stubGlobal('fetch', mockFetch)

		await timeout.fetchTime()
		expect(timeout.clientOffset.value).toBe(0)
	})

	it('handles fetch errors without throwing', async () => {
		const timeout = useTimeout()
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		const mockFetch = vi.fn().mockResolvedValue({ ok: false })
		vi.stubGlobal('fetch', mockFetch)

		await expect(timeout.fetchTime()).resolves.toBeUndefined()
		expect(errorSpy).toHaveBeenCalledTimes(1)
	})
})
