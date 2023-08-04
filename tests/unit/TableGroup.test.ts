import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import TableGroup from '../../src/components/TableGroup.vue'
import type { Timestamp, TableDoc } from '../../src/types/TableDoc.type'
import { createUuid } from '../../src/use/helper'

const _uuid = createUuid()
const _timestamp: Timestamp = { seconds: 1691082706, nanoseconds: 0 }
const fetchTables = (): TableDoc[] => [
	{
		active: true,
		block_id: 1,
		id: 'test_table_id-1',
		index: 1,
		name: 'Test Table 1',
		modified: { seconds: 0, nanoseconds: 0 },
		seat_1: 'Table 1, Test Person 1.1',
		seat_2: 'Table 1, Test Person 1.2',
		seat_3: 'Table 1, Test Person 1.3',
		seat_4: 'Table 1, Test Person 1.4',
		seat_5: 'Table 1, Test Person 1.5',
		seat_6: 'Table 1, Test Person 1.6',
		seat_7: 'Table 1, Test Person 1.7',
		seat_8: 'Table 1, Test Person 1.8',
		seats: 8,
	},
	{
		active: true,
		block_id: 1,
		id: 'test_table_id-2',
		index: 2,
		name: 'Test Table 2',
		modified: { seconds: 0, nanoseconds: 0 },
		seat_1: 'Table 2, Test Person 2.1',
		seat_2: 'Table 2, Test Person 2.2',
		seat_3: '',
		seat_4: '',
		seat_5: '',
		seat_6: '',
		seat_7: '',
		seat_8: '',
		seats: 7,
	},
	{
		active: true,
		block_id: 1,
		id: 'test_table_id-3',
		index: 3,
		name: 'Test Table 3',
		modified: { seconds: 0, nanoseconds: 0 },
		seat_1: '',
		seat_2: '',
		seat_3: '',
		seat_4: '',
		seat_5: '',
		seat_6: '',
		seat_7: '',
		seat_8: '',
		seats: 4,
	},
]

const factory = () =>
	mount(TableGroup, {
		props: {
			tables: undefined,
			uuid: _uuid,
			isLoggedIn: false,
			isFormOpen: false,
		},
	})

describe('TableGroup.vue', () => {
	let wrapper = null
	let tables: TableDoc[] = []
	let editButtons = null
	let unlockButtons = null
	const getEditButtons = () => wrapper.findAll('[data-test-edit-button]')
	const getUnlockButtons = () => wrapper.findAll('[data-test-unlock-button]')
	beforeEach(() => {
		wrapper = factory()
		tables = fetchTables()
	})

	it('renders correctly', async () => {
		const tableSelector = '[data-test-table]'
		expect(TableGroup).toBeTruthy()
		expect(wrapper.find(tableSelector).exists()).toBe(false)

		wrapper.setProps({ tables })
		await flushPromises()

		expect(wrapper.findAll(tableSelector).length).toBe(tables.length)
		expect(wrapper.find(tableSelector).text()).toContain(tables.at(0).name)
	})

	it('has all edit buttons to be disabled when form is open', async () => {
		wrapper.setProps({ tables, isFormOpen: true })
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
		wrapper.setProps({ tables })
		await flushPromises()

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

		wrapper.setProps({ tables, isLoggedIn: true })
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
		wrapper.setProps({ tables, isLoggedIn: true })
		await flushPromises()

		unlockButtons = getUnlockButtons()
		expect(unlockButtons.length).toBe(tables.length - 1)
	})

	it('emits a custom event "unlock" when unlock button is clicked', async () => {
		const index = 1
		tables[index].locked_by = createUuid()
		tables[index].locked_at = _timestamp
		wrapper.setProps({ tables, isLoggedIn: true })
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
