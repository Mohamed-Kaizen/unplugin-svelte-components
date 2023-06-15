import { sveltekit } from "@sveltejs/kit/vite"
import Components from "unplugin-svelte-components/vite"
import AutoImport from "unplugin-auto-import/vite"

import type { UserConfig } from "vite"

const config: UserConfig = {
	plugins: [
		AutoImport({
			dts: "./src/auto-imports.d.ts",
			imports: ["svelte", "svelte/store", "svelte/transition"],
			dirs: ["./src/lib"],
		}),
		Components({
			dirs: ["./src/components"],
			dts: "./src/components.d.ts",
			external: [
				{
					from: "@rgossiaux/svelte-headlessui", // import from third party
					names: [
						// import these components
						"Switch as ASwitch",
						"Switch",
					],
					defaultImport: false, // telling `unplugin-svelte-components` to import any component as non-default export
				},
			],
		}),
		sveltekit(),
	],
}

export default config
