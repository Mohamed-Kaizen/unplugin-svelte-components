import adapter from "@sveltejs/adapter-auto"
import preprocess from "svelte-preprocess"
import Components from "unplugin-svelte-components/vite"
import Icons from "unplugin-icons/vite"
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
					dts: "./src/components.d.ts",
					directoryAsNamespace: true,
					external: [
						{
							from: "flowbite-svelte",
							names: [
								"GradientMonochromeButton",
								"Button as FButton",
							],
							defaultImport: false,
						},
					],
				}),
				Icons({
					compiler: "svelte",
				}),
			],
		},
	},
}

export default config
