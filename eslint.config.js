import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
	{
		name: 'app/files-to-lint',
		files: ['**/*.{ts,mts,tsx,vue}'],
	},

	{
		name: 'app/files-to-ignore',
		ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
	},

	...pluginVue.configs['flat/strongly-recommended'],
	...vueTsEslintConfig(),
	{
		rules: {
			'arrow-body-style': 'warn',
			'prefer-arrow-callback': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
		},
	},

	...pluginVueA11y.configs['flat/recommended'],
	{
		rules: {
			'vuejs-accessibility/label-has-for': [
				'error',
				{
					required: {
						some: ['nesting', 'id'], // either nesting (input within label) or for/id relation is required
						// every: ['id'], // for/id relation is required
					},
				},
			],
			'vuejs-accessibility/no-redundant-roles': [
				'error',
				// allowed roles
				{
					ol: ['list'],
				},
			],
		},
	},

	{
		...pluginVitest.configs.recommended,
		files: ['src/**/__tests__/*'],
	},
	skipFormatting,
]
