import { inject, type InjectionKey } from 'vue'
import type { SortableReservation } from '@/types/Reservation.type'

const formatDateTime = (timestamp?: number | string, options?: Intl.DateTimeFormatOptions) => {
	if (!timestamp) return ''

	const format: Intl.DateTimeFormatOptions = options ?? {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	}
	return new Date(timestamp).toLocaleDateString('de-DE', format)
}

const formatTime = (timestamp?: number) => {
	if (!timestamp) return ''

	return new Date(timestamp).toLocaleTimeString('de-DE')
}

const formatCount = (count: number, noun: [string, string]) => `${count} ${noun[count === 1 ? 0 : 1]}`

const createUuid = () => `_${Math.random().toString(36).substring(2, 10)}`

const sortByName = (a: SortableReservation, b: SortableReservation) =>
	a.sortableName.localeCompare(b.sortableName, 'de')

// https://logaretm.com/blog/type-safe-provide-inject/
const injectStrict = <T>(key: InjectionKey<T>, fallback?: T) => {
	const resolved = inject(key, fallback)
	if (!resolved) throw new Error(`Could not resolve ${key.description}`)
	return resolved
}

const blurInput = ({ target }: Event) => {
	;(target as HTMLInputElement).blur()
}

const firstWord = (str: string = '') => str.split(' ')[0]
const remainingWords = (str: string = '') => str.split(' ').slice(1).join(' ')

export {
	formatDateTime,
	formatTime,
	formatCount,
	createUuid,
	sortByName,
	injectStrict,
	blurInput,
	firstWord,
	remainingWords,
}
