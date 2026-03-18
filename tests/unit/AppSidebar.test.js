import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import AppSidebar from '@/components/AppSidebar.vue'

const factory = () => mount(AppSidebar)

describe('AppSidebar.vue', () => {
	let wrapper
	const getSidebar = () => wrapper.find('[data-test-sidebar]')

	beforeEach(() => {
		wrapper = factory()
		// vi.useFakeTimers()
	})

	it('renders correctly', () => {
		expect(AppSidebar).toBeTruthy()
		expect(getSidebar().exists()).toBe(true)
	})

	it('sets ref "slideIn" to `true` when the "open" method is called', async () => {
		expect(wrapper.vm.slideIn).toBe(false)

		wrapper.vm.open()
		expect(wrapper.vm.slideIn).toBe(true)
	})

	it('emits a custom event "closing" when the "close" method is called', async () => {
		wrapper.vm.close()
		expect(wrapper.emitted('closing')).toBeTruthy()
		expect(wrapper.emitted('closing').length).toBe(1)
	})

	it('emits a custom event "closed" after transition end when the "close" method is called', async () => {
		wrapper.vm.close()
		expect(wrapper.emitted('closed')).toBeFalsy()

		await getSidebar().trigger('transitionend')
		expect(wrapper.emitted('closed')).toBeTruthy()
		expect(wrapper.emitted('closed').length).toBe(1)
	})
})
