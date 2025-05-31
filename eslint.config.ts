import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
	{
		name: 'app/files-to-lint',
		files: ['**/*.{ts,mts,tsx,vue}'],
	},

	globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

	pluginVue.configs['flat/strongly-recommended'],
	vueTsConfigs.recommended,
	{
		rules: {
			'arrow-body-style': 'warn',
			'prefer-arrow-callback': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
		},
	},

	pluginVueA11y.configs['flat/recommended'],
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
			'vuejs-accessibility/no-autofocus': 'warn',
		},
	},

	{
		...pluginVitest.configs.recommended,
		files: ['src/**/__tests__/*'],
	},
	skipFormatting,
)
