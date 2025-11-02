import { RuleTester } from 'eslint'
import rule from '../src/rules/layer-boundaries.js'

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const baseOptions = {
  root: 'layers',
  aliases: ['#layers', '@layers'],
  layers: {
    shared: [],
    products: ['shared'],
    cart: ['shared'],
    'my-feature': ['shared'],
    app: ['*'],
  },
}

tester.run('layer-boundaries', rule, {
  valid: [
    {
      name: 'products imports shared via alias',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "import util from '#layers/shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'cart imports shared via relative',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "import util from '../shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'app can import products',
      filename: '/repo/app/pages/index.vue',
      code: "import ProductList from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
    },
    {
      name: 'app can import cart',
      filename: '/repo/app/pages/checkout.vue',
      code: "import Cart from '#layers/cart/components/Cart.vue';",
      options: [baseOptions],
    },
    {
      name: 'app can import shared',
      filename: '/repo/app/utils/helpers.js',
      code: "import util from '#layers/shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'same layer import is allowed',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "import ProductItem from '#layers/products/components/ProductItem.vue';",
      options: [baseOptions],
    },
    {
      name: 'layer with hyphenated name can import shared',
      filename: '/repo/layers/my-feature/components/Feature.vue',
      code: "import util from '#layers/shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'multi-level relative import works',
      filename: '/repo/layers/products/nested/deep/Component.vue',
      code: "import util from '../../../shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'alternative alias @layers works',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "import util from '@layers/shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'dynamic import is allowed',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "const util = await import('#layers/shared/utils');",
      options: [baseOptions],
    },
    {
      name: 'require statement is allowed',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "const util = require('#layers/shared/utils');",
      options: [baseOptions],
    },
    {
      name: 'export from is allowed',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "export { foo } from '#layers/shared/utils';",
      options: [baseOptions],
    },
    {
      name: 'export all is allowed',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "export * from '#layers/shared/utils';",
      options: [baseOptions],
    },
  ],

  invalid: [
    {
      name: 'cart cannot import products',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "import ProductList from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [
        {
          message: 'cart cannot import from products (#layers/products/components/ProductList.vue). Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".',
        },
      ],
    },
    {
      name: 'shared cannot import cart',
      filename: '/repo/layers/shared/utils/format.js',
      code: "import Cart from '#layers/cart/components/Cart.vue';",
      options: [baseOptions],
      errors: [{ message: 'shared cannot import from cart (#layers/cart/components/Cart.vue). This layer must not import from other layers.' }],
    },
    {
      name: 'shared cannot import products',
      filename: '/repo/layers/shared/utils/format.js',
      code: "import ProductList from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [{ message: 'shared cannot import from products (#layers/products/components/ProductList.vue). This layer must not import from other layers.' }],
    },
    {
      name: 'products cannot import cart',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "import Cart from '#layers/cart/components/Cart.vue';",
      options: [baseOptions],
      errors: [{ message: 'products cannot import from cart (#layers/cart/components/Cart.vue). Allowed imports: [shared]. To allow this import, add "cart" to the canImport array for "products".' }],
    },
    {
      name: 'relative path violation is caught',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "import ProductList from '../../products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [
        {
          message: 'cart cannot import from products (../../products/components/ProductList.vue). Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".',
        },
      ],
    },
    {
      name: 'export from violation is caught',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "export { ProductList } from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [
        {
          message: 'cart cannot import from products (#layers/products/components/ProductList.vue). Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".',
        },
      ],
    },
    {
      name: 'export all violation is caught',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "export * from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [
        {
          message: 'cart cannot import from products (#layers/products/components/ProductList.vue). Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".',
        },
      ],
    },
    {
      name: 'require violation is caught',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "const ProductList = require('#layers/products/components/ProductList.vue');",
      options: [baseOptions],
      errors: [
        {
          message: 'cart cannot import from products (#layers/products/components/ProductList.vue). Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".',
        },
      ],
    },
    {
      name: 'dynamic import violation is caught',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "const ProductList = await import('#layers/products/components/ProductList.vue');",
      options: [baseOptions],
      errors: [
        {
          message: 'cart cannot import from products (#layers/products/components/ProductList.vue). Allowed imports: [shared]. To allow this import, add "products" to the canImport array for "cart".',
        },
      ],
    },
  ],
})

console.log('All tests passed!')
