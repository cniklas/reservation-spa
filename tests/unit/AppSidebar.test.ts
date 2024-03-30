import { mount } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AppSidebar from '../../src/components/AppSidebar.vue'

const headline = 'Test AppSidebar headline'
const factory = () =>
	mount(AppSidebar, {
		slots: {
			headline,
		},
	})

describe('AppSidebar.vue', () => {
	let wrapper

	beforeEach(() => {
		wrapper = factory()
		vi.useFakeTimers()
	})

	it('renders correctly', () => {
		expect(AppSidebar).toBeTruthy()
		expect(wrapper.find('[data-test-headline]').text()).toMatch(headline)
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

	it('emits a custom event "closed" after a certain time when the "close" method is called', async () => {
		wrapper.vm.close()
		expect(wrapper.emitted('closed')).toBeFalsy()

		vi.runAllTimers()
		expect(wrapper.emitted('closed')).toBeTruthy()
		expect(wrapper.emitted('closed').length).toBe(1)
	})
})
