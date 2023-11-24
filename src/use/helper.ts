import { inject, type InjectionKey } from 'vue'

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

// const _cardinalRules = new Intl.PluralRules('de-DE')
// const formatCount = (count: number, noun: [string, string]) => {
// 	const _rule = _cardinalRules.select(count)
// 	return _rule === 'one' ? `${count} ${noun[0]}` : `${count} ${noun[1]}`
// }
const formatCount = (count: number, noun: [string, string]) =>
	count === 1 ? `${count} ${noun[0]}` : `${count} ${noun[1]}`

const createUuid = () => `_${Math.random().toString(36).substring(2, 10)}`

// https://logaretm.com/blog/type-safe-provide-inject/
const injectStrict = <T>(key: InjectionKey<T>, fallback?: T) => {
	const resolved = inject(key, fallback)
	if (!resolved) throw new Error(`Could not resolve ${key.description}`)
	return resolved
}

export { formatDateTime, formatTime, formatCount, createUuid, injectStrict }
