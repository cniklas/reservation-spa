import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

process.env.BROWSER = 'chrome' // for '--open' command

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: tag => tag === 'search',
				},
			},
		}),
		UnoCSS(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().getTime()),
	},
})
