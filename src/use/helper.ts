const formatTimestamp = (timestamp?: number) => {
	if (!timestamp) return ''

	return new Date(timestamp).toLocaleDateString('de-DE', {
		// year: '2-digit',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	})
}

export { formatTimestamp }
