import { reactive, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, vi, it, expect, afterEach, beforeEach } from 'vitest'
import TableForm from '@/components/TableForm.vue'
// import { PROVIDE_TABLES, PROVIDE_UPDATE_ENTRY } from '@/keys'
import { mockTables } from '../mock.data'

const CONFIG = { minSeats: 4, maxSeats: 8 }
const updateEntry = vi.fn()
const state = reactive({
	tables: [],
	isAdmin: false,
})
const isSubmitLocked = ref(false)
const validationErrors = reactive(new Map())
const beforeSubmit = vi.fn(() => {
	isSubmitLocked.value = true
})
const unlockSubmit = vi.fn(() => {
	isSubmitLocked.value = false
})
const handleSubmitError = vi.fn()
const validateName = vi.fn()
// vi.mock('@/use/store', async importOriginal => {
// 	const mod = await importOriginal<typeof import('@/use/store')>()
// 	return {
// 		...mod,
// 		useStore: () => ({
// 			state: _state,
// 		}),
// 	}
// })
vi.mock('@/use/store', () => ({
	useStore: () => ({ config: CONFIG, state, updateEntry }),
}))
vi.mock('@/use/errorHandling', () => ({
	useErrorHandling: () => ({
		isSubmitLocked,
		beforeSubmit,
		handleSubmitError,
		unlockSubmit,
		validationErrors,
		validateName,
	}),
}))
// const tables = mockTables()
const factory = (/* props?: object */) =>
	mount(TableForm, {
		// global: {
		// 	provide: {
		// 		[PROVIDE_TABLES as symbol]: tables,
		// 		[PROVIDE_UPDATE_ENTRY as symbol]: () => {},
		// 	},
		// },
		props: {
			entry: { ...mockTables()[0] },
			// isAdmin: false,
			// ...props,
		},
	})

describe('TableForm.vue', () => {
	let wrapper
	let entry

	beforeEach(() => {
		state.isAdmin = false
		state.tables = mockTables()
		entry = mockTables()[0]
		updateEntry.mockReset()
		beforeSubmit.mockClear()
		unlockSubmit.mockClear()
		handleSubmitError.mockClear()
		validateName.mockClear()
		validationErrors.clear()
		isSubmitLocked.value = false
	})

	afterEach(() => {
		wrapper.unmount()
	})

	it('renders correctly', async () => {
		expect(TableForm).toBeTruthy()
		wrapper = factory()
		expect(wrapper.findAll('[data-test-seat]').length).toBe(entry.seats)

		const increaseButtonSelector = '[data-test-increase-button]'
		expect(wrapper.find(increaseButtonSelector).exists()).toBe(false)

		// wrapper.setProps({ isAdmin: true })
		state.isAdmin = true
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
		// wrapper = factory({ isAdmin: true })
		state.isAdmin = true
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

		await cancelButton.trigger('click')
		// check that 1 occurrence of the event has been emitted
		expect(wrapper.emitted('cancel')).toBeTruthy()
		expect(wrapper.emitted('cancel')?.length).toBe(1)
		// console.log(wrapper.text());
		// console.log(wrapper.html())
	})

	it('does not submit when submit is locked', async () => {
		isSubmitLocked.value = true
		wrapper = factory()

		await wrapper.find('form').trigger('submit')

		expect(beforeSubmit).not.toHaveBeenCalled()
		expect(updateEntry).not.toHaveBeenCalled()
		expect(wrapper.emitted('saving')).toBeFalsy()
		expect(wrapper.emitted('saved')).toBeFalsy()
	})

	it('does not call updateEntry if validation errors exist on submit', async () => {
		wrapper = factory()
		validationErrors.set('seat_1', 'ungueltig')

		await wrapper.find('form').trigger('submit')

		expect(beforeSubmit).toHaveBeenCalledTimes(1)
		expect(updateEntry).not.toHaveBeenCalled()
		expect(wrapper.emitted('saving')).toBeFalsy()
		expect(wrapper.emitted('saved')).toBeFalsy()
		expect(unlockSubmit).toHaveBeenCalledTimes(1)
	})

	it('emits saving/saved and calls updateEntry with unlocked fields on successful submit', async () => {
		wrapper = factory()
		updateEntry.mockResolvedValue(undefined)

		await wrapper.find('form').trigger('submit')

		expect(beforeSubmit).toHaveBeenCalledTimes(1)
		expect(wrapper.emitted('saving')?.length).toBe(1)
		expect(updateEntry).toHaveBeenCalledTimes(1)
		expect(updateEntry).toHaveBeenCalledWith(
			entry.id,
			expect.objectContaining({
				id: entry.id,
				locked_by: '',
				locked_at: null,
			}),
		)
		expect(wrapper.emitted('saved')?.length).toBe(1)
		expect(unlockSubmit).toHaveBeenCalledTimes(1)
	})
})
