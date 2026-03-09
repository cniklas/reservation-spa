import { unref, type Ref } from 'vue'
import type { SortableReservation } from '@/types/Reservation.type'

const dateFormatter = new Intl.DateTimeFormat('de', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
})
const formatDateTime = (timestamp?: number | string) => (!!timestamp ? dateFormatter.format(new Date(timestamp)) : '')

const formatTime = (timestamp?: number) => (!!timestamp ? new Date(timestamp).toLocaleTimeString('de') : '')

const formatCount = (count: number, noun: [string, string]) => `${count} ${noun[count === 1 ? 0 : 1]}`

const createUuid = () => `_${Math.random().toString(36).substring(2, 10)}`

const collator = new Intl.Collator('de', { sensitivity: 'base' })
const sortByName = (a: SortableReservation, b: SortableReservation) => collator.compare(a.sortableName, b.sortableName)

const isEmpty = (...args: (Ref<string> | string)[]) => args.some(val => !unref(val).length)

export { formatDateTime, formatTime, formatCount, createUuid, sortByName, isEmpty }
