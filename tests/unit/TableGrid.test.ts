import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, vi, it, expect, beforeEach } from 'vitest'
import TableGrid from '../../src/components/TableGrid.vue'
import type { Table } from '../../src/types/Table.type'
import { createUuid, firstWord, remainingWords } from '../../src/use/helper'
import { mockTables } from '../mock.data'

const _uuid = createUuid()
const createTime = () => new Date().getTime()

const state = reactive<{
	tables: Table[]
	isAuthenticated: boolean
}>({
	tables: [],
	isAuthenticated: false,
})
vi.mock('../../src/use/store', () => ({
	useStore: () => ({ state }),
}))

const factory = () =>
	mount(TableGrid, {
		props: {
			uuid: _uuid,
		},
	})

describe('TableGrid.vue', () => {
	let wrapper
	let editButtons
	let unlockButtons
	const getEditButtons = () => wrapper.findAll('[data-test-edit-button]')
	const getUnlockButtons = () => wrapper.findAll('[data-test-unlock-button]')
	beforeEach(() => {
		wrapper = factory()
		state.tables = mockTables()
		state.isAuthenticated = false
	})

	it('renders correctly', async () => {
		expect(TableGrid).toBeTruthy()

		const firstTable = wrapper.vm.filteredTables.at(0)
		const emptySeats = wrapper.vm.emptySeats(firstTable)
		expect(wrapper.find('[data-test-table]').text()).toContain(
			`Tisch ${firstWord(firstTable.name)}${remainingWords(firstTable.name)}${emptySeats}`,
		)
	})

	it('if a table is locked its edit button is disabled', async () => {
		const index = 1
		state.tables[index].locked_by = _uuid
		state.tables[index].locked_at = createTime()
		await flushPromises()

		editButtons = getEditButtons()
		expect(editButtons.filter(button => button.attributes('aria-disabled') === 'true').length).toBe(1)
		expect(editButtons.at(index).attributes('aria-disabled')).toBe('true')
	})

	it('emits a custom event "edit" when edit button is clicked', async () => {
		const index = 1
		editButtons = getEditButtons()
		editButtons.at(index).trigger('click')
		// check that 1 occurrence of the event has been emitted
		expect(wrapper.emitted('edit')).toBeTruthy()
		expect(wrapper.emitted('edit').length).toBe(1)
		// [ [ '_sh68eapb' ] ]
		expect(wrapper.emitted('edit').at(0).at(0)).toBe(state.tables[index].id)
	})

	it('has an unlock button for each locked table if user is logged in ', async () => {
		state.tables.map((table, i) => {
			// skip first table
			if (i === 0) return

			table.locked_by = createUuid()
			table.locked_at = createTime()
		})
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(0)

		state.isAuthenticated = true
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(state.tables.length - 1)
	})

	it('has no unlock button for a table locked by the logged-in user', async () => {
		const id = (state.tables.at(-1) as Table).id
		state.tables.map(table => {
			// one table is locked by the logged-in user
			table.locked_by = table.id === id ? _uuid : createUuid()
			table.locked_at = createTime()
		})
		state.isAuthenticated = true
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(state.tables.length - 1)
	})

	it('emits a custom event "unlock" when unlock button is clicked', async () => {
		const index = 1
		state.tables[index].locked_by = createUuid()
		state.tables[index].locked_at = createTime()
		state.isAuthenticated = true
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(1)

		unlockButtons.at(0).trigger('click')
		// check that 1 occurrence of the event has been emitted
		expect(wrapper.emitted('unlock')).toBeTruthy()
		expect(wrapper.emitted('unlock').length).toBe(1)
		expect(wrapper.emitted('unlock').at(0).at(0)).toBe(state.tables[index].id)
	})
})
