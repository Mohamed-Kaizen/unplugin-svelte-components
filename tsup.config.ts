import type { Options } from "tsup"

export default <Options>{
	entry: ["src/*.ts"],

	clean: false,

	outDir: "./",

	format: ["esm"],

	dts: true,

	skipNodeModulesBundle: true,
}
