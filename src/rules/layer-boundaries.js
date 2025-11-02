import path from 'node:path'

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Nuxt layer architecture boundaries with project config',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          root: { type: 'string' },
          aliases: {
            type: 'array',
            items: { type: 'string' },
          },
          layers: {
            type: 'object',
            additionalProperties: {
              anyOf: [
                {
                  type: 'array',
                  items: { type: 'string' },
                },
                {
                  type: 'object',
                  properties: {
                    canImport: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                  required: ['canImport'],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ['layers'],
        additionalProperties: false,
      },
    ],
    messages: {
      layerViolation: '{{fromLayer}} cannot import from {{toLayer}}. {{hint}}',
    },
  },

  create(context) {
    const option = context.options[0] || {}
    const rootDir = option.root ? option.root.replace(/\\/g, '/') : 'layers'
    const aliasPrefixes = Array.isArray(option.aliases) && option.aliases.length > 0
      ? option.aliases
      : ['#layers']
    const rawLayers = option.layers

    // Normalize layer shapes
    // allow "shared": [] or "shared": { canImport: [] }
    const layerConfig = {}
    for (const [name, value] of Object.entries(rawLayers)) {
      if (Array.isArray(value)) {
        layerConfig[name] = { canImport: value }
      } else {
        layerConfig[name] = value
      }
    }

    function getCurrentLayer() {
      const filename = context.getFilename()
      const normalized = path.normalize(filename).replace(/\\/g, '/')

      const marker = `/${rootDir}/`
      const idx = normalized.indexOf(marker)
      if (idx !== -1) {
        const after = normalized.slice(idx + marker.length)
        const [layerName] = after.split('/')
        if (layerConfig[layerName]) {
          return layerName
        }
      }

      if (normalized.includes('/app/') && layerConfig.app) {
        return 'app'
      }

      return null
    }

    function getImportedLayer(importPath) {
      for (const prefix of aliasPrefixes) {
        if (importPath.startsWith(prefix + '/')) {
          const rest = importPath.slice(prefix.length + 1)
          const [layerName] = rest.split('/')
          if (layerConfig[layerName]) {
            return layerName
          }
        }
      }

      const relMatch = importPath.match(/\.\.\/(\w+)/)
      if (relMatch) {
        const layerName = relMatch[1]
        if (layerConfig[layerName]) {
          return layerName
        }
      }

      return null
    }

    function isAllowedImport(fromLayer, toLayer) {
      const rule = layerConfig[fromLayer]
      if (!rule) return true

      const allowed = rule.canImport || []
      if (allowed.includes('*')) return true
      return allowed.includes(toLayer)
    }

    function violationHint(fromLayer) {
      const rule = layerConfig[fromLayer]
      if (!rule) return 'Check your eslint-plugin-nuxt-layers config.'
      const allowed = rule.canImport || []
      if (allowed.length === 0) return 'This layer must not import from other layers.'
      return `Allowed imports for ${fromLayer}: ${allowed.join(', ')}`
    }

    const currentLayer = getCurrentLayer()
    if (!currentLayer) return {}

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        const importedLayer = getImportedLayer(importPath)
        if (!importedLayer) return
        if (currentLayer === importedLayer) return

        if (!isAllowedImport(currentLayer, importedLayer)) {
          context.report({
            node: node.source,
            messageId: 'layerViolation',
            data: {
              fromLayer: currentLayer,
              toLayer: importedLayer,
              hint: violationHint(currentLayer),
            },
          })
        }
      },
    }
  },
}
