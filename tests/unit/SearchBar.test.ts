import { flushPromises, mount } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SearchBar from '../../src/components/SearchBar.vue'

const inputValue = 'test'
const factory = () => mount(SearchBar)

describe('SearchBar.vue', () => {
	let wrapper = null

	const getInputElement = () => wrapper.find('[data-test-search-input]')
	const getButton = () => wrapper.find('[data-test-search-button]')
	beforeEach(() => {
		wrapper = factory()
		vi.useFakeTimers()
	})

	it('renders correctly', async () => {
		expect(SearchBar).toBeTruthy()
		const inputElement = getInputElement()
		expect(inputElement.exists()).toBe(true)

		const hiddenClass = '!hidden'
		const button = getButton()
		expect(button.exists()).toBe(true)
		expect(button.attributes('class')).toContain(hiddenClass)

		await inputElement.setValue(inputValue)
		expect(button.attributes('class')).not.toContain(hiddenClass)
	})

	it('resets the input field if the reset button is clicked', async () => {
		const inputElement = getInputElement()
		const button = getButton()
		inputElement.setValue(inputValue)
		expect(inputElement.element.value).toBe(inputValue)

		await button.trigger('click')
		expect(inputElement.element.value).toBe('')
	})

	it('emits a custom event "update" after a certain time if the input value changes', async () => {
		const inputElement = getInputElement()
		await inputElement.setValue(inputValue)

		vi.runAllTimers()
		await flushPromises()

		expect(wrapper.emitted('update')).toBeTruthy()
		expect(wrapper.emitted('update').length).toBe(1)
		expect(wrapper.emitted('update').at(-1).at(0)).toBe(inputValue)
	})
})
