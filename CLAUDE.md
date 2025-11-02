# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ESLint plugin for Nuxt 4 projects that enforces architectural boundaries between layers. The plugin inspects import statements and validates that layers only import from their allowed dependencies based on user-configured rules.

## Key Commands

### Testing
```bash
npm test
```
Runs the test suite using ESLint's RuleTester (tests/layer-boundaries.test.js).

### Release Management
```bash
npm run changeset           # Create a changeset for your changes
npm run version-packages    # Bump version based on changesets
npm run release            # Publish to npm
```

## Architecture

### Core Rule Implementation (src/rules/layer-boundaries.js)

The plugin implements a single ESLint rule that:

1. **Detects current layer** from file path by looking for `/{rootDir}/{layerName}/` pattern
   - Falls back to checking for `/app/` if no layer folder is found
   - Returns `null` if file is not in a layer (rule doesn't apply)

2. **Detects imported layer** from import statements:
   - Checks for alias imports (e.g., `#layers/shared/utils`)
   - Checks for relative imports (e.g., `../shared/utils`)
   - Uses regex to extract layer name from path

3. **Validates import permissions** by checking configuration:
   - Layers can specify `canImport: []` (no imports), `canImport: ['*']` (all imports), or `canImport: ['layerA', 'layerB']` (specific layers)
   - Same-layer imports are always allowed
   - Reports violations with helpful error messages

### Configuration Schema

The rule accepts configuration in two forms:
- Array syntax: `layers: { shared: [] }`
- Object syntax: `layers: { shared: { canImport: [] } }`

Both are normalized internally to the object form in src/rules/layer-boundaries.js:62-69.

### Plugin Entry Point (src/index.js)

Exports:
- `rules` object containing the layer-boundaries rule
- `configs.recommended` with a default configuration example

## Testing Approach

Tests use ESLint's RuleTester with:
- Valid test cases: imports that should pass
- Invalid test cases: imports that should fail with specific error messages

Test files must specify a filename that matches the expected layer structure (e.g., `/repo/layers/products/components/ProductList.vue`) for the rule to detect the current layer correctly.

## Important Implementation Details

- All path operations normalize backslashes to forward slashes for cross-platform compatibility (Windows vs Unix)
- Layer detection requires the file to be in the configured root directory structure
- The rule only checks `ImportDeclaration` nodes (standard ES6 imports)
- Path matching uses basic string operations and regex, not full path resolution
