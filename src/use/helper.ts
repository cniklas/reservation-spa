const formatDateTime = (timestamp?: number, options?: Intl.DateTimeFormatOptions) => {
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

export { formatDateTime, formatTime }
