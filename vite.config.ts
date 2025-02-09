import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

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
	build: {
		assetsInlineLimit: filePath => (filePath.endsWith('.svg') ? false : undefined),
	},
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().getTime()),
	},
})
