import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import TableGroup from '../../src/components/TableGroup.vue'
import type { Timestamp, TableDoc } from '../../src/types/TableDoc.type'

const _uuid = 'test_tableGroup_uuid'
const _timestamp: Timestamp = { seconds: 1691082706, nanoseconds: 0 }
const _tables: TableDoc[] = [
	{
		active: true,
		block_id: 1,
		id: '1',
		index: 1,
		name: 'Table 1',
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
		id: '2',
		index: 2,
		name: 'Table 2',
		modified: { seconds: 0, nanoseconds: 0 },
		seat_1: 'Table 2, Test Person 2.1',
		seat_2: '',
		seat_3: '',
		seat_4: '',
		seat_5: '',
		seat_6: '',
		seat_7: '',
		seat_8: '',
		seats: 8,
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
	let editButtons = null
	const getEditButtons = () => wrapper.findAll('[data-test-edit-button]')
	beforeEach(() => {
		wrapper = factory()
		// editButtons = getEditButtons()
	})

	it('renders correctly', async () => {
		const tableSelector = '[data-test-table]'
		expect(TableGroup).toBeTruthy()
		expect(wrapper.find(tableSelector).exists()).toBe(false)

		wrapper.setProps({ tables: _tables })
		await flushPromises()

		// console.log(wrapper.text());
		// console.log(wrapper.html())
		expect(wrapper.findAll(tableSelector).length).toBe(_tables.length)
		expect(wrapper.find(tableSelector).text()).toContain(_tables.at(0).name)
	})

	it('has all edit buttons to be disabled when form is open', async () => {
		wrapper.setProps({ tables: _tables, isFormOpen: true })
		await flushPromises()

		editButtons = getEditButtons()
		editButtons.forEach(button => {
			expect(button.isDisabled()).toBe(true)
		})
	})

	it('if a table is locked its edit button is disabled', async () => {
		const index = 1
		const tables = [..._tables]
		tables[index].locked_by = _uuid
		tables[index].locked_at = _timestamp
		wrapper.setProps({ tables: _tables })
		await flushPromises()

		editButtons = getEditButtons()
		expect(editButtons.filter(button => button.isDisabled()).length).toBe(1)
		expect(editButtons.at(index).isDisabled()).toBe(true)
	})

	// 🚩 TODO add test for edit button click event
	// 🚩 TODO add test for unlock button and its click event
})
