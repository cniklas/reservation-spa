/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
	root: true,
	extends: [
		// https://eslint.vuejs.org/rules/
		// vue3-recommended > vue3-strongly-recommended > vue3-essential > base
		'plugin:vue/vue3-strongly-recommended',
		'eslint:recommended',
		'@vue/eslint-config-typescript',
		'@vue/eslint-config-prettier/skip-formatting',
		'plugin:vuejs-accessibility/recommended',
	],
	rules: {
		'arrow-body-style': 'warn',
		'prefer-arrow-callback': 'warn',
		"@typescript-eslint/no-explicit-any": "warn",
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
				nav: ['navigation'],
				ol: ['list'],
			},
		],
	},
	parserOptions: {
		ecmaVersion: 'latest',
	},
}
