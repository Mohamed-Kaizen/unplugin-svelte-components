# unplugin-svelte-components

[![NPM version](https://img.shields.io/npm/v/unplugin-svelte-components?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-svelte-components)

On-demand components auto importing for Svelte.

[Sveltekit Demo](https://stackblitz.com/edit/sveltejs-kit-template-default-bmc4wn)
[Svelte Vite Demo](https://stackblitz.com/edit/vitejs-vite-19qjgd)

## Features

- ⚡️ Supports Vite, Webpack, Rollup, esbuild and more, powered by <a href="https://github.com/unjs/unplugin">unplugin</a>.
- 🏝 Tree-shakable, only registers the components you use.
- 🪐 Folder names as namespaces.
- 🦾 Full TypeScript support.
- 😃 Works perfectly with [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import).

## Installation

```bash
pnpm add -D unplugin-svelte-components
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Components from 'unplugin-svelte-components/vite'

export default defineConfig({
  plugins: [
    Components({ /* options */ }),
  ],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Components from 'unplugin-svelte-components/rollup'

export default {
  plugins: [
    Components({ /* options */ }),
  ],
}
```

<br></details>


<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-svelte-components/webpack')({ /* options */ }),
  ],
}
```
<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'

build({
  /* ... */
  plugins: [
    require('unplugin-svelte-components/esbuild')({
      /* options */
    }),
  ],
})
```

<br></details>

<details>
<summary>sveltekit</summary><br>

```ts
// vite.config.ts
import Components from 'unplugin-svelte-components/vite'

export default defineConfig({
  plugins: [
    Components({ /* options */ }), // before sveltekit plugin
    sveltekit(),
  ],
})
```

<br></details>

## Usage

Use components as you would usually do, it will import components on demand, and there is no `import` required anymore!

It will automatically turn this

```html
<HelloWorld msg="Hello Svelte" />
```

into this

```html
<HelloWorld msg="Hello Svelte" />

<script>
import HelloWorld from './src/components/HelloWorld.svelte'
</script>
```

## TypeScript

To get TypeScript support for auto-imported components, you can change the config as following to get the support.

```ts
Components({
  dts: true, // enabled by default if `typescript` is installed
})
```

Once the setup is done, a `components.d.ts` will be generated and updates automatically with the type definitions. Feel free to commit it into git or not as you want.

> **Make sure you also add `components.d.ts` to your `tsconfig.json` under `includes`.**

## Registered third party components

It's cool to have your own components have been import it, but sometime you want to import third party components.

Thus `unplugin-svelte-components` provided a way to import these components.

```ts
Components({
  dts: true,
  external: [
    {
      from: "agnostic-svelte", // import from third party
      names: [ // import these components
        "Alert",
        "Button as AButton", // import as `AButton`
      ],
      defaultImport: false, // telling `unplugin-svelte-components` to import any component as non-default export
    },
  ],
})
```

So the `Alert` and `AButton` will be available to use.

## Disabling

In some cases, you may want to disable the auto-import in your page, `unplugin-svelte-components` provides a way to do that by just adding `<!-- unplugin-svelte-components disabled -->` in your **.svelte** file

```html
<!-- unplugin-svelte-components disabled -->
<HelloWorld msg="Hello Svelte" />
```

## Configuration

The following show the default values of the configuration

```ts
Components({
  // relative paths to the directory to search for components.
  dirs: ['src/components'],

  // valid file extensions for components.
  extensions: ['svelte'],

// search for subdirectories
  deep: true,

  // generate `components.d.ts` global declarations,
  // also accepts a path for custom filename
  // default: `true` if package typescript is installed
  dts: false,

  // Allow subdirectories as namespace prefix for components.
  directoryAsNamespace: false,
  // Subdirectory paths for ignoring namespace prefixes
  // works when `directoryAsNamespace: true`
  globalNamespaces: [],

  // Transform path before resolving
  importPathTransform: v => v,

  // Allow for components to override other components with the same name
  allowOverrides: false,

  // Accept a svelte pre-processor (e.g. svelte-preprocess)
  preprocess:  null,

  // filters for transforming targets
  include: [/\.svelte$/, /\.svelte\?svelte/],
  exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.svelte-kit[\\/]/,],
})
```

## Thanks

Thanks to [Anthony Fu](https://github.com/antfu), this project is heavily inspired by [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components/).

## License

MIT License © 2022-PRESENT [Mohamed Nesredin](https://github.com/Mohamed-Kaizen)