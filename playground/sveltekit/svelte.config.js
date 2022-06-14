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
					external: [
						{
						  from: "agnostic-svelte", // import from third party
						  names: [ // import these components
						  "Button as AButton", // import as `AButton`
						  "Alert"
						],
						  defaultImport: false, // telling `unplugin-svelte-components` to import any component as non-default export
						},
					  ],

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
