import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, vi, it, expect, afterEach } from 'vitest'
import TableForm from '../../src/components/TableForm.vue'
// import { PROVIDE_TABLES, PROVIDE_UPDATE_ENTRY } from '../../src/keys'
import { mockTables } from '../mock.data'

const CONFIG = { minSeats: 4, maxSeats: 8 }
const state = reactive<{
	isAuthenticated: boolean
}>({
	isAuthenticated: false,
})
// vi.mock('../../src/use/store', async importOriginal => {
// 	const mod = await importOriginal<typeof import('../../src/use/store')>()
// 	return {
// 		...mod,
// 		useStore: () => ({
// 			state: _state,
// 		}),
// 	}
// })
vi.mock('../../src/use/store', () => ({
	useStore: () => ({ config: CONFIG, state }),
}))
// const tables = mockTables()
const entry = mockTables()[0]

const factory = (/* props?: object */) =>
	mount(TableForm, {
		// global: {
		// 	provide: {
		// 		[PROVIDE_TABLES as symbol]: tables,
		// 		[PROVIDE_UPDATE_ENTRY as symbol]: () => {},
		// 	},
		// },
		props: {
			entry,
			// isAuthenticated: false,
			// ...props,
		},
	})

describe('TableForm.vue', () => {
	let wrapper

	afterEach(() => {
		wrapper.unmount()
	})

	it('renders correctly', async () => {
		expect(TableForm).toBeTruthy()
		wrapper = factory()
		expect(wrapper.findAll('[data-test-seat]').length).toBe(entry.seats)

		const increaseButtonSelector = '[data-test-increase-button]'
		expect(wrapper.find(increaseButtonSelector).exists()).toBe(false)

		// wrapper.setProps({ isAuthenticated: true })
		state.isAuthenticated = true
		await flushPromises()

		expect(wrapper.find(increaseButtonSelector).exists()).toBe(true)

		const checkbox = wrapper.find('input[type=checkbox]')
		expect(checkbox.exists()).toBe(true)
		expect(checkbox.element.checked).toBe(entry.active)
	})

	it('increases/decreases the number of seats when increase/decrease button is clicked', async () => {
		const minSeats = 4
		const maxSeats = 8
		const seatsSelector = '[data-test-seat]'
		// wrapper = factory({ isAuthenticated: true })
		wrapper = factory()

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
