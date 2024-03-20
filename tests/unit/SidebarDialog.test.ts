import { mount, flushPromises } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import SidebarDialog from '../../src/components/SidebarDialog.vue'

const headline = 'Test SidebarDialog headline'
const factory = () =>
	mount(SidebarDialog, {
		slots: {
			headline,
		},
	})

describe('SidebarDialog.vue', () => {
	let wrapper

	beforeEach(() => {
		wrapper = factory()
		vi.useFakeTimers()
	})
	// https://github.com/jsdom/jsdom/issues/3294#issuecomment-1196577616
	beforeAll(() => {
		HTMLDialogElement.prototype.showModal = vi.fn()
		HTMLDialogElement.prototype.close = vi.fn()
		// @ts-ignore
		HTMLDialogElement.prototype.scrollTo = vi.fn()
	})

	it('renders correctly', () => {
		expect(SidebarDialog).toBeTruthy()
		expect(wrapper.find('[data-test-headline]').text()).toMatch(headline)
	})

	it('sets ref "slideIn" to `true` if the "open" method is called', async () => {
		expect(wrapper.vm.slideIn).toBe(false)

		wrapper.vm.open()
		vi.runAllTimers()
		await flushPromises()
		expect(wrapper.vm.slideIn).toBe(true)
	})

	it('emits a custom event "closing" if the "close" method is called', async () => {
		wrapper.vm.close()
		expect(wrapper.emitted('closing')).toBeTruthy()
		expect(wrapper.emitted('closing').length).toBe(1)
	})

	it('emits a custom event "closed" after a certain time if the "close" method is called', async () => {
		wrapper.vm.close()
		expect(wrapper.emitted('closed')).toBeFalsy()

		vi.runAllTimers()
		expect(wrapper.emitted('closed')).toBeTruthy()
		expect(wrapper.emitted('closed').length).toBe(1)
	})

	it('emits a custom event "cancel" if the HTMLDialogElement "cancel" event is triggered', async () => {
		wrapper.vm.$el.dispatchEvent(new Event('cancel'))
		expect(wrapper.emitted('cancel')).toBeTruthy()
		expect(wrapper.emitted('cancel').length).toBe(1)
	})
})
