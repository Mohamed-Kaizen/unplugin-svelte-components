import type { Options } from "tsup"

export default <Options>{
	entryPoints: ["src/*.ts"],
	clean: true,
	format: ["cjs", "esm"],
	dts: true,
	splitting: true,
	shims: false,
	banner: {
		js: `import { createRequire as topLevelCreateRequire } from 'module';\n const require = topLevelCreateRequire(import.meta.url);`,
	},
}
