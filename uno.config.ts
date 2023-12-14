import { defineConfig, presetWind } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
	shortcuts: {
		container: 'w-256 mx-auto max-w-full px-3 sm:px-4',
	},

	// https://unocss.dev/presets/wind
	presets: [presetWind()],
	// https://unocss.dev/transformers/directives
	transformers: [transformerDirectives()],
})
