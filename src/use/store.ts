import { reactive, readonly } from 'vue'
import { id as createUuid, type User } from '@instantdb/core'
import { instant } from '@/instant'
import type { Table, CreateTable, LockedTable } from '@/types/Table.type'

const state = reactive<{
	tables: Table[]
	subscribed: boolean
	isAuthenticated: boolean
	isAdmin: boolean
}>({
	tables: [],
	subscribed: false,
	isAuthenticated: false,
	isAdmin: false,
})

const fetchEntries = async () => {
	if (state.subscribed) return

	try {
		// realtime subscription with offline support
		instant.subscribeQuery({ tables: { $: { order: { index: 'asc' } } } }, ({ data, error /* , pageInfo */ }) => {
			if (error) throw error
			if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

			state.tables = data.tables
			state.subscribed = true
		})
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message) // ¯\\_(ツ)_/¯
	}
}

const updateEntry = async (id: string, data: Table | LockedTable) => {
	try {
		instant.transact(instant.tx.tables[id]!.update(data))
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const addEntry = async (data: CreateTable) => {
	if (!state.isAuthenticated) return

	try {
		instant.transact(instant.tx.tables[createUuid()]!.update(data))
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const setAuthState = (user: User | undefined) => {
	state.isAuthenticated = !!user
	// @ts-expect-error it's my own custom type
	state.isAdmin = user?.type === 'admin'
}

// Singleton State Pattern, see https://markus.oberlehner.net/blog/vue-composition-api-composables/#the-singleton-state-pattern
export const useStore = () => ({
	config: readonly({ minSeats: 4, maxSeats: 8 }),
	state: readonly(state),
	fetchEntries,
	updateEntry,
	addEntry,
	setAuthState,
})
