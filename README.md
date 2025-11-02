# eslint-plugin-nuxt-layers

ESLint plugin for Nuxt 4 projects that use a layered folder layout. Enforce architectural boundaries between layers with configurable import rules.

## Why?

In a Nuxt 4 project with multiple layers, you want to prevent unwanted dependencies between layers. For example:

- **shared** layer should not import from any other layer
- **products** and **cart** can import from **shared** but not from each other
- **app** can import from everything

This plugin helps you enforce these rules automatically through ESLint.

## Features

✅ **Comprehensive import detection** - Checks ES6 imports, dynamic imports, CommonJS require, export-from, and export-all
✅ **Smart path resolution** - Handles both alias imports (`#layers/shared`) and relative imports (`../../shared`)
✅ **Configuration validation** - Warns you if you reference non-existent layers in your config
✅ **Helpful error messages** - Shows the import path and suggests how to fix violations
✅ **Cross-platform** - Works on Windows, macOS, and Linux
✅ **Flexible naming** - Supports layer names with hyphens, underscores, and special characters

## Install

```bash
npm install eslint-plugin-nuxt-layers --save-dev
```

## Usage

### Quick start

In your `eslint.config.js` (ESLint 9+ flat config):

```js
import nuxtLayers from 'eslint-plugin-nuxt-layers'

export default [
  {
    plugins: {
      'nuxt-layers': nuxtLayers,
    },
    rules: {
      'nuxt-layers/layer-boundaries': [
        'error',
        {
          root: 'layers',
          aliases: ['#layers', '@layers'],
          layers: {
            shared: [],
            products: ['shared'],
            cart: ['shared'],
            app: ['*'],
          },
        },
      ],
    },
  },
]
```

Or use the recommended config:

```js
import nuxtLayers from 'eslint-plugin-nuxt-layers'

export default [
  {
    plugins: {
      'nuxt-layers': nuxtLayers,
    },
    rules: nuxtLayers.configs.recommended.rules,
  },
]
```

### Configuration

#### Options

- **`root`** (string, default: `'layers'`): The directory name where your layers are located
- **`aliases`** (array of strings, default: `['#layers']`): Path aliases that point to your layers directory
- **`layers`** (object, required): Configuration for each layer

#### Layer configuration

Each layer can be configured in two ways:

**Array syntax** (shorthand):
```js
layers: {
  shared: [],           // Cannot import from any other layer
  products: ['shared'], // Can only import from shared
}
```

**Object syntax** (explicit):
```js
layers: {
  shared: { canImport: [] },
  products: { canImport: ['shared'] },
}
```

Special values:
- `[]` - Cannot import from any other layer
- `['*']` - Can import from all layers
- `['layerA', 'layerB']` - Can only import from layerA and layerB

### Example configurations

#### E-commerce with features

```js
{
  root: 'layers',
  aliases: ['#layers', '@layers'],
  layers: {
    shared: [],
    ui: ['shared'],
    billing: ['shared', 'ui'],
    marketing: ['shared', 'ui'],
    app: ['*'],
  },
}
```

#### Strict hierarchical layers

```js
{
  root: 'modules',
  aliases: ['#modules'],
  layers: {
    core: [],
    domain: ['core'],
    application: ['core', 'domain'],
    presentation: ['application', 'domain', 'core'],
  },
}
```

## How it works

The plugin inspects import statements in your files and checks:

1. **Current layer**: Determined by file path (e.g., `layers/products/components/ProductList.vue` is in the `products` layer)
2. **Imported layer**: Detected from import paths:
   - Alias imports: `import X from '#layers/shared/utils'` → `shared` layer
   - Relative imports: `import X from '../../shared/utils'` → `shared` layer (supports multi-level paths)
3. **Permission**: Checks if the current layer is allowed to import from the imported layer

### Supported Import Types

The plugin checks all types of imports and exports:

- **ES6 imports**: `import X from '#layers/shared/utils'`
- **Dynamic imports**: `const X = await import('#layers/shared/utils')`
- **CommonJS require**: `const X = require('#layers/shared/utils')`
- **Export from**: `export { X } from '#layers/shared/utils'`
- **Export all**: `export * from '#layers/shared/utils'`
- **Relative imports**: `import X from '../../shared/utils'`

If a forbidden import is detected, ESLint reports an error with a helpful message.

### Example violations

```js
// In layers/cart/components/Cart.vue
import ProductList from '#layers/products/components/ProductList.vue'
// ❌ Error: cart cannot import from products (#layers/products/components/ProductList.vue).
//    Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".
```

```js
// In layers/shared/utils/format.js
import Cart from '#layers/cart/components/Cart.vue'
// ❌ Error: shared cannot import from cart (#layers/cart/components/Cart.vue).
//    This layer must not import from other layers.
```

```js
// In layers/products/components/ProductList.vue
const Cart = await import('#layers/cart/utils')
// ❌ Error: products cannot import from cart (#layers/cart/utils).
//    Allowed imports: [shared]. To allow this import, add "cart" to the canImport array for "products".
```

### Configuration validation

The plugin validates your configuration and reports errors for common mistakes:

```js
layers: {
  products: ['shared', 'typo-layer'], // ❌ Error: Layer "products" references non-existent layer "typo-layer"
}
```

## Project structure

This plugin expects a structure like:

```
your-project/
├── layers/
│   ├── shared/
│   │   └── utils/
│   ├── products/
│   │   └── components/
│   ├── cart/
│   │   └── components/
│   ├── my-feature/          # Layer names with hyphens are supported
│   │   └── components/
├── app/
│   └── pages/
└── nuxt.config.ts
```

You can customize the `root` directory name and layer names in the configuration. Layer names with hyphens, underscores, and other characters are fully supported.

## Debugging

If the rule is not working as expected:

1. **Check file paths**: The layer is detected from the file path. Make sure your files are in `layers/{layerName}/...`
2. **Check aliases**: The plugin looks for imports starting with your configured aliases
3. **Check layer names**: Layer names in config must match folder names exactly (the plugin will warn you if you reference non-existent layers)
4. **Check import types**: The rule checks ES6 imports, dynamic imports, require statements, and export statements
5. **Enable ESLint debug**: Run `ESLINT_DEBUG=eslint:cli-engine eslint yourfile.js` to see what's happening

## Development

### Running tests

```bash
npm test
```

### Adding a changeset

When you make changes:

```bash
npm run changeset
```

Follow the prompts to document your changes. This will create a changeset file that will be used to bump versions and generate changelogs.

### Publishing

```bash
npm run version-packages  # Bump version
npm run release           # Publish to npm
```

## Contributing

Contributions welcome! Please open an issue first to discuss what you would like to change.

## License

MIT
