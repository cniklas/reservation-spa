import { ref, computed } from 'vue'
import { formatDateTime } from '@/use/helper'

export const ONE_MINUTE = 60 * 1000
export const EDIT_TIMEOUT = 4 * ONE_MINUTE
export const RELEASE_TIME = new Date(import.meta.env.VITE_RELEASE_DATE).getTime()

export const useTimeout = () => {
	const clientTime = ref('')
	const serverTime = ref('')
	const clientOffset = ref(0)

	const isReleased = ref(false)
	// takes into account that the client time may not be set correctly
	const _isReleasedNow = () => RELEASE_TIME <= Date.now() + clientOffset.value

	let _releaseIntervalId: number
	const clearReleaseInterval = () => {
		clearInterval(_releaseIntervalId)
	}

	const fetchTime = async () => {
		try {
			// console.time('server time')
			// @ts-ignore
			const response = await fetch(import.meta.env.VITE_GET_TIME_URL, { priority: 'low' })
			if (!response.ok) throw new Error('Could not retrieve server time')
			// console.timeEnd('server time')

			const clientNow = Date.now()
			// 🔺 getMilliseconds() ist missverständlich, da z.B. für 2 ms `2` und nicht `002` zurückgegeben wird
			// clientTime.value = `${formatDateTime(clientNow)}.${new Date(clientNow).getMilliseconds()}`
			clientTime.value = formatDateTime(clientNow)

			const { atom, micro }: { atom: string; micro: number } = await response.json()
			const serverNow = new Date(atom).getTime() + Math.round(micro / 1000)
			serverTime.value = formatDateTime(serverNow)

			const _clientOffset = serverNow - clientNow
			if (Math.abs(_clientOffset) > 2000) clientOffset.value = _clientOffset

			isReleased.value = _isReleasedNow()
			if (isReleased.value) return

			_releaseIntervalId = window.setInterval(() => {
				if (!_isReleasedNow()) return
				clearReleaseInterval()
				isReleased.value = true
			}, 2000)
		} catch (error) {
			console.error(error)
		}
	}

	let _editTimeoutId: number
	let _countdownIntervalId: number
	const isTimerRunning = ref(false)
	const countdown = ref(0)
	const countdownToTime = computed(() =>
		new Date(countdown.value * 1000).toLocaleTimeString('de-DE', { minute: 'numeric', second: 'numeric' }),
	)

	const _decreaseCountdown = () => {
		countdown.value--
	}

	const setTimer = (onTimeoutOrCancel: Function) => {
		_editTimeoutId = window.setTimeout(onTimeoutOrCancel, EDIT_TIMEOUT)
		isTimerRunning.value = true
		countdown.value = EDIT_TIMEOUT / 1000
		_countdownIntervalId = window.setInterval(_decreaseCountdown, 1000)
	}

	const clearTimer = () => {
		clearTimeout(_editTimeoutId)
		isTimerRunning.value = false
		clearInterval(_countdownIntervalId)
	}

	return {
		clientTime,
		serverTime,
		clientOffset,
		isReleased,
		clearReleaseInterval,
		fetchTime,
		isTimerRunning,
		countdown,
		countdownToTime,
		setTimer,
		clearTimer,
	}
}
