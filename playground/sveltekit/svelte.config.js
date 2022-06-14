import adapter from "@sveltejs/adapter-auto"
import preprocess from "svelte-preprocess"
import Components from "unplugin-svelte-components/vite"
import AutoImport from "unplugin-auto-import/vite"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),
		vite: {
			plugins: [
				AutoImport({
					dts: "./src/auto-imports.d.ts",
					imports: ["svelte", "svelte/store", "svelte/transition"],
					dirs: ["./src/lib"],
				}),
				Components({
					dirs: ["./src/lib"],
					dts: "./src/components.d.ts",

				}),
			],
		},
		// Override http methods in the Todo forms
		methodOverride: {
			allowed: ['PATCH', 'DELETE']
		}

	},
}

export default config
