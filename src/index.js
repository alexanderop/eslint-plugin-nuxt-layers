import layerBoundaries from './rules/layer-boundaries.js'

export const rules = {
  'layer-boundaries': layerBoundaries,
}

export const configs = {
  recommended: {
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
}
