import { mount } from '@vue/test-utils'
import { it, expect } from 'vitest'
import AppSidebar from '../../src/components/AppSidebar.vue'

it('has a headline', () => {
	expect(AppSidebar).toBeTruthy()

	const headline = 'Test AppSidebar headline'
	const wrapper = mount(AppSidebar, {
		props: {
			headline,
		},
	})

	expect(wrapper.text()).toMatch(headline)
})
