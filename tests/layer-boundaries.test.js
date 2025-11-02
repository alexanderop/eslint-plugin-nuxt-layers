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
  ],

  invalid: [
    {
      name: 'cart cannot import products',
      filename: '/repo/layers/cart/components/Cart.vue',
      code: "import ProductList from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [
        {
          messageId: 'layerViolation',
          data: {
            fromLayer: 'cart',
            toLayer: 'products',
          },
        },
      ],
    },
    {
      name: 'shared cannot import cart',
      filename: '/repo/layers/shared/utils/format.js',
      code: "import Cart from '#layers/cart/components/Cart.vue';",
      options: [baseOptions],
      errors: [{ messageId: 'layerViolation' }],
    },
    {
      name: 'shared cannot import products',
      filename: '/repo/layers/shared/utils/format.js',
      code: "import ProductList from '#layers/products/components/ProductList.vue';",
      options: [baseOptions],
      errors: [{ messageId: 'layerViolation' }],
    },
    {
      name: 'products cannot import cart',
      filename: '/repo/layers/products/components/ProductList.vue',
      code: "import Cart from '#layers/cart/components/Cart.vue';",
      options: [baseOptions],
      errors: [{ messageId: 'layerViolation' }],
    },
  ],
})

console.log('All tests passed!')
