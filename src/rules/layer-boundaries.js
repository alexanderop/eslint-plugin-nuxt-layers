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
      layerViolation: '{{fromLayer}} cannot import from {{toLayer}} ({{importPath}}). {{hint}}',
      invalidLayerReference: 'Layer "{{layer}}" references non-existent layer "{{reference}}" in canImport. Available layers: {{available}}',
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

    // Validate that all canImport references point to existing layers
    const layerNames = Object.keys(layerConfig)
    for (const [layerName, config] of Object.entries(layerConfig)) {
      const canImport = config.canImport || []
      for (const ref of canImport) {
        if (ref !== '*' && !layerNames.includes(ref)) {
          // Report configuration error at the first file processed
          const filename = context.getFilename()
          if (filename !== '<input>') {
            context.report({
              loc: { line: 1, column: 0 },
              messageId: 'invalidLayerReference',
              data: {
                layer: layerName,
                reference: ref,
                available: layerNames.join(', '),
              },
            })
          }
        }
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

    function getImportedLayer(importPath, currentFilePath) {
      // Check alias imports first
      for (const prefix of aliasPrefixes) {
        if (importPath.startsWith(prefix + '/')) {
          const rest = importPath.slice(prefix.length + 1)
          const [layerName] = rest.split('/')
          if (layerConfig[layerName]) {
            return layerName
          }
        }
      }

      // Handle relative imports by resolving against current file path
      if (importPath.startsWith('.')) {
        const currentDir = path.dirname(currentFilePath)
        const resolvedPath = path.resolve(currentDir, importPath).replace(/\\/g, '/')

        // Check if resolved path contains any configured layer
        const marker = `/${rootDir}/`
        const idx = resolvedPath.indexOf(marker)
        if (idx !== -1) {
          const after = resolvedPath.slice(idx + marker.length)
          const [layerName] = after.split('/')
          if (layerConfig[layerName]) {
            return layerName
          }
        }

        // Also check for app directory in relative imports
        if (resolvedPath.includes('/app/') && layerConfig.app) {
          return 'app'
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

    function violationHint(fromLayer, toLayer) {
      const rule = layerConfig[fromLayer]
      if (!rule) return 'Check your eslint-plugin-nuxt-layers config.'
      const allowed = rule.canImport || []
      if (allowed.length === 0) return 'This layer must not import from other layers.'
      const suggestion = `To allow this import, add "${toLayer}" to the canImport array for "${fromLayer}".`
      return `Allowed imports: [${allowed.join(', ')}]. ${suggestion}`
    }

    const currentLayer = getCurrentLayer()
    if (!currentLayer) return {}

    function checkImport(node, importPath) {
      const filename = context.getFilename()
      const importedLayer = getImportedLayer(importPath, filename)
      if (!importedLayer) return
      if (currentLayer === importedLayer) return

      if (!isAllowedImport(currentLayer, importedLayer)) {
        context.report({
          node,
          messageId: 'layerViolation',
          data: {
            fromLayer: currentLayer,
            toLayer: importedLayer,
            importPath,
            hint: violationHint(currentLayer, importedLayer),
          },
        })
      }
    }

    return {
      ImportDeclaration(node) {
        checkImport(node.source, node.source.value)
      },
      ImportExpression(node) {
        // Dynamic import: import('#layers/shared/utils')
        // ImportExpression has 'source' property in ESTree spec
        const source = node.source || node.arguments?.[0]
        if (source && source.type === 'Literal' && typeof source.value === 'string') {
          checkImport(source, source.value)
        }
      },
      CallExpression(node) {
        // CommonJS require: require('#layers/shared/utils')
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          checkImport(node.arguments[0], node.arguments[0].value)
        }
      },
      ExportNamedDeclaration(node) {
        // Export from: export { x } from '#layers/shared/utils'
        if (node.source && node.source.type === 'Literal') {
          checkImport(node.source, node.source.value)
        }
      },
      ExportAllDeclaration(node) {
        // Export all: export * from '#layers/shared/utils'
        if (node.source && node.source.type === 'Literal') {
          checkImport(node.source, node.source.value)
        }
      },
    }
  },
}
