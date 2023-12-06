import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import TableForm from '../../src/components/TableForm.vue'
import type { TableDoc } from '../../src/types/TableDoc.type'
import { PROVIDE_TABLES, PROVIDE_UPDATE_DOCUMENT } from '../../src/keys'

const tables: TableDoc[] = [
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
const entry = tables.at(0)

const factory = (props?: any) =>
	mount(TableForm, {
		global: {
			provide: {
				[PROVIDE_TABLES as symbol]: tables,
				[PROVIDE_UPDATE_DOCUMENT as symbol]: () => {},
			},
		},
		props: {
			entry,
			isLoggedIn: false,
			...props,
		},
	})

describe('TableForm.vue', () => {
	let wrapper = null

	afterEach(() => {
		wrapper.unmount()
	})

	it('renders correctly', async () => {
		expect(TableForm).toBeTruthy()
		wrapper = factory()
		expect(wrapper.findAll('[data-test-seat]').length).toBe(entry.seats)

		const increaseButtonSelector = '[data-test-increase-button]'
		expect(wrapper.find(increaseButtonSelector).exists()).toBe(false)

		wrapper.setProps({ isLoggedIn: true })
		await flushPromises()

		expect(wrapper.find(increaseButtonSelector).exists()).toBe(true)

		const checkbox = wrapper.find('input[type=checkbox]')
		expect(checkbox.exists()).toBe(true)
		expect(checkbox.element.checked).toBe(entry.active)
	})

	it('it increases/decreases the number of seats if increase/decrease button is clicked', async () => {
		const minSeats = 4
		const maxSeats = 8
		const seatsSelector = '[data-test-seat]'
		wrapper = factory({ isLoggedIn: true })

		// decrease
		const decreaseButton = wrapper.find('[data-test-decrease-button]')
		await decreaseButton.trigger('click')
		expect(wrapper.findAll(seatsSelector).length).toBe(entry.seats - 1)

		for (let i = 0; i < 5; i++) {
			await decreaseButton.trigger('click')
		}
		expect(wrapper.findAll(seatsSelector).length).toBe(minSeats)

		// increase
		const increaseButton = wrapper.find('[data-test-increase-button]')
		await increaseButton.trigger('click')
		expect(wrapper.findAll(seatsSelector).length).toBe(minSeats + 1)

		for (let i = 0; i < 5; i++) {
			await increaseButton.trigger('click')
		}
		expect(wrapper.findAll(seatsSelector).length).toBe(maxSeats)
	})

	it('emits a custom event "cancel" when cancel button is clicked', async () => {
		wrapper = factory()
		const cancelButton = wrapper.find('[data-test-cancel-button]')
		expect(cancelButton.exists()).toBe(true)

		cancelButton.trigger('click')
		// check that 1 occurrence of the event has been emitted
		expect(wrapper.emitted('cancel')).toBeTruthy()
		expect(wrapper.emitted('cancel').length).toBe(1)
		// console.log(wrapper.text());
		// console.log(wrapper.html())
	})
})
