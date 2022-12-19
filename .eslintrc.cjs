/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
	root: true,
	extends: [
		// https://eslint.vuejs.org/rules/
		// vue3-recommended > vue3-strongly-recommended > vue3-essential > base
		'plugin:vue/vue3-strongly-recommended',
		'eslint:recommended',
		'@vue/eslint-config-prettier',
	],
	parserOptions: {
		ecmaVersion: 'latest',
	},
}
