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

const createUuid = () => `_${Math.random().toString(36).substring(2, 10)}`

export { formatDateTime, formatTime, createUuid }
