import { reactive, readonly } from 'vue'
import type { RealtimePostgresUpdatePayload } from '@supabase/supabase-js'
import { supabase } from '@/supabase'
import type { Table, CreateTable, LockedTable } from '@/types/Table.type'

const state = reactive<{
	tables: Table[]
	subscribed: boolean
	isAuthenticated: boolean
}>({
	tables: [],
	subscribed: false,
	isAuthenticated: false,
})

const _onDatabaseUpdate = (payload: RealtimePostgresUpdatePayload<Table>) => {
	const newEntry = payload.new as Table | null
	if (!newEntry) return

	const index = state.tables.findIndex(table => table.id === newEntry.id) // im Fehlerfall `-1`
	if (index === -1) return
	state.tables[index] = newEntry
}

const realtimeSubscribe = () => {
	if (state.subscribed) return

	supabase
		.channel('schema-db-changes')
		.on('postgres_changes', { event: 'UPDATE', schema: 'public' }, _onDatabaseUpdate)
		.subscribe((status, error) => {
			if (status === 'SUBSCRIBED') state.subscribed = true
			if (error) throw error
		})
}

const realtimeUnsubscribe = async () => {
	const status = await supabase.channel('schema-db-changes').unsubscribe()
	if (status === 'ok') state.subscribed = false
}

const fetchEntries = async () => {
	try {
		const { data, error /* , status */ } = await supabase.from('tables').select().order('index', { ascending: true })
		if (error) throw error
		if (data === null) throw new Error('Verbindung zur Datenbank fehlgeschlagen.')

		state.tables = data
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message) // ¯\\_(ツ)_/¯
	}
}

const updateEntry = async (id: number, data: Table | LockedTable) => {
	try {
		const { error } = await supabase.from('tables').update(data).eq('id', id) /* .select() */
		if (error) throw error
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const addEntry = async (data: CreateTable) => {
	if (!state.isAuthenticated) return

	try {
		const { error } = await supabase.from('tables').insert(data) /* .select() */
		if (error) throw error
	} catch (error) {
		const message = (error as Error).message ?? 'Verbindung zum Server fehlgeschlagen.'
		console.error(message)
	}
}

const setAuthState = (isAuthenticated = false) => {
	state.isAuthenticated = isAuthenticated
}

// Singleton State Pattern, see https://markus.oberlehner.net/blog/vue-composition-api-composables/#the-singleton-state-pattern
export const useStore = () => ({
	config: readonly({ minSeats: 4, maxSeats: 8 }),
	state: readonly(state),
	realtimeSubscribe,
	realtimeUnsubscribe,
	fetchEntries,
	updateEntry,
	addEntry,
	setAuthState,
})
