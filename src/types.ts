import type { FilterPattern } from "@rollup/pluginutils"
import type { TransformResult } from "unplugin"
import { PreprocessorGroup } from "svelte/types/compiler/preprocess"

type Awaitable<T> = T | PromiseLike<T>

/**
 * Null or whatever
 */
export type Nullable<T> = T | null | undefined

/**
 * Array, or not yet
 */
export type Arrayable<T> = T | Array<T>

export type FunctionArgs<Args extends any[] = any[], Return = void> = (
	...args: Args
) => Return

export interface FunctionWrapperOptions<
	Args extends any[] = any[],
	This = any
> {
	fn: FunctionArgs<Args, This>
	args: Args
	this_arg: This
}

export type AnyFn = (...args: any[]) => any

export type EventFilter<
	Args extends any[] = any[],
	This = any,
	Invoke extends AnyFn = AnyFn
> = (
	invoke: Invoke,
	options: FunctionWrapperOptions<Args, This>
) => ReturnType<Invoke> | Promise<ReturnType<Invoke>>

export interface ImportInfo {
	as?: string
	name?: string
	defaultImport?: boolean
	from: string
}

export interface PublicPluginAPI {
	/**
	 * Resolves a component using the configured resolvers.
	 */
	findComponent: (
		name: string,
		filename?: string
	) => Promise<ImportInfo | undefined>
	/**
	 * Obtain an import statement for a resolved component.
	 */
	stringifyImport: (info: ImportInfo) => string
}

/**
 * Plugin options.
 */
export interface Options {
	/**
	 * RegExp or glob to match files to be transformed
	 */
	include?: FilterPattern

	/**
	 * RegExp or glob to match files to NOT be transformed
	 */
	exclude?: FilterPattern

	/**
	 * Relative paths to the directory to search for components.
	 * @default 'src/components'
	 */
	dirs?: string | string[]

	/**
	 * Valid file extensions for components.
	 * @default ['svelte']
	 */
	extensions?: string | string[]

	/**
	 * Glob patterns to match file names to be detected as components.
	 *
	 * When specified, the `dirs` and `extensions` options will be ignored.
	 */
	globs?: string | string[]

	/**
	 * Search for subdirectories
	 * @default true
	 */
	deep?: boolean

	/**
	 * Allow subdirectories as namespace prefix for components
	 * @default false
	 */
	directoryAsNamespace?: boolean

	/**
	 * Collapse same prefixes (case-insensitive) of folders and components
	 * to prevent duplication inside namespaced component name
	 *
	 * Works when `directoryAsNamespace: true`
	 * @default false
	 */
	collapseSamePrefixes?: boolean

	/**
	 * Subdirectory paths for ignoring namespace prefixes
	 *
	 * Works when `directoryAsNamespace: true`
	 * @default "[]"
	 */
	globalNamespaces?: string[]

	/**
	 * Apply custom transform over the path for importing
	 */
	importPathTransform?: (path: string) => string | undefined

	/**
	 * Generate TypeScript declaration for global components
	 *
	 * Accept boolean or a path related to project root
	 *
	 * @default true
	 */
	dts?: boolean | string

	/**
	 * Accept a svelte pre-processor
	 */
	preprocess?: PreprocessorGroup | null

	/**
	 * Do not emit warning on component overriding
	 *
	 * @default false
	 */
	allowOverrides?: boolean

	/**
	 * Import Third-Party Components
	 **/
	external?: ExternalImport[]
}

export interface ExternalImport {
	from: string
	names: string[]
	defaultImport: boolean
}

export type ComponentResolveResult = Awaitable<
	string | ImportInfo | null | undefined | void
>

export type ComponentResolverFunction = (name: string) => ComponentResolveResult
export interface ComponentResolverObject {
	type: "component"
	resolve: ComponentResolverFunction
}
export type ComponentResolver =
	| ComponentResolverFunction
	| ComponentResolverObject

export type ResolvedOptions = Omit<
	Required<Options>,
	"resolvers" | "extensions" | "dirs" | "globalComponentsDeclaration"
> & {
	resolvers: ComponentResolverObject[]
	extensions: string[]
	dirs: string[]
	resolvedDirs: string[]
	globs: string[]
	dts: string | false
	root: string
}

export type Transformer = (
	code: string,
	id: string,
	path: string,
	query: Record<string, string>
) => Awaitable<TransformResult | null>
