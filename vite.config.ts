import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import postcssNesting from 'postcss-nesting'

process.env.BROWSER = 'chrome' // for '--open' command

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), WindiCSS()],
	css: {
		postcss: {
			plugins: [postcssNesting],
		},
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	define: {
		// https://stackoverflow.com/a/68093777/3870081
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
		__BUILD_TIME__: JSON.stringify(new Date().getTime()),
	},
})
