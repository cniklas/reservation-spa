import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import TableGrid from '../../src/components/TableGrid.vue'
import type { Timestamp, TableDoc } from '../../src/types/TableDoc.type'
import { createUuid, firstWord, remainingWords } from '../../src/use/helper'
import { mockTables } from '../mock.data'

const _uuid = createUuid()
const _timestamp: Timestamp = { seconds: 1691082706, nanoseconds: 0 }

const factory = () =>
	mount(TableGrid, {
		props: {
			tables: mockTables(),
			uuid: _uuid,
			isAuthenticated: false,
			isFormOpen: false,
		},
	})

describe('TableGrid.vue', () => {
	let wrapper = null
	let tables: TableDoc[] = []
	let editButtons = null
	let unlockButtons = null
	const getEditButtons = () => wrapper.findAll('[data-test-edit-button]')
	const getUnlockButtons = () => wrapper.findAll('[data-test-unlock-button]')
	beforeEach(() => {
		wrapper = factory()
		tables = mockTables()
	})

	it('renders correctly', async () => {
		expect(TableGrid).toBeTruthy()

		const firstTable = wrapper.vm.filteredTables.at(0)
		const emptySeats = wrapper.vm.emptySeats(firstTable)
		expect(wrapper.find('[data-test-table]').text()).toContain(
			`Tisch ${firstWord(firstTable.name)}${remainingWords(firstTable.name)}${emptySeats}`,
		)
	})

	it('has all edit buttons to be disabled when form is open', async () => {
		wrapper.setProps({ isFormOpen: true })
		await flushPromises()

		editButtons = getEditButtons()
		editButtons.forEach(button => {
			expect(button.isDisabled()).toBe(true)
		})
	})

	it('if a table is locked its edit button is disabled', async () => {
		const index = 1
		tables[index].locked_by = _uuid
		tables[index].locked_at = _timestamp
		wrapper.setProps({ tables })
		await flushPromises()

		editButtons = getEditButtons()
		expect(editButtons.filter(button => button.isDisabled()).length).toBe(1)
		expect(editButtons.at(index).isDisabled()).toBe(true)
	})

	it('emits a custom event "edit" when edit button is clicked', async () => {
		const index = 1
		editButtons = getEditButtons()
		editButtons.at(index).trigger('click')
		// check that 1 occurrence of the event has been emitted
		expect(wrapper.emitted('edit')).toBeTruthy()
		expect(wrapper.emitted('edit').length).toBe(1)
		// [ [ '_sh68eapb' ] ]
		expect(wrapper.emitted('edit').at(0).at(0)).toBe(tables.at(index).id)
	})

	it('has an unlock button for each locked table if user is logged in ', async () => {
		tables.map((table, i) => {
			// skip first table
			if (i === 0) return

			table.locked_by = createUuid()
			table.locked_at = _timestamp
		})
		wrapper.setProps({ tables })
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(0)

		wrapper.setProps({ isAuthenticated: true })
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(tables.length - 1)
	})

	it('it has no unlock button for a table locked by the logged-in user', async () => {
		const id = tables.at(-1).id
		tables.map(table => {
			// one table is locked by the logged-in user
			table.locked_by = table.id === id ? _uuid : createUuid()
			table.locked_at = _timestamp
		})
		wrapper.setProps({ tables, isAuthenticated: true })
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(tables.length - 1)
	})

	it('emits a custom event "unlock" when unlock button is clicked', async () => {
		const index = 1
		tables[index].locked_by = createUuid()
		tables[index].locked_at = _timestamp
		wrapper.setProps({ tables, isAuthenticated: true })
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(1)

		unlockButtons.at(0).trigger('click')
		// check that 1 occurrence of the event has been emitted
		expect(wrapper.emitted('unlock')).toBeTruthy()
		expect(wrapper.emitted('unlock').length).toBe(1)
		expect(wrapper.emitted('unlock').at(0).at(0)).toBe(tables.at(index).id)
		// console.log(wrapper.text());
		// console.log(wrapper.html())
	})
})
