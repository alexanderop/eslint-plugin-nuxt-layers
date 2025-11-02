# eslint-plugin-nuxt-layers

## 0.2.0

### Minor Changes

- daa87fb: Major improvements to layer boundary detection and error messages:

  - **Robust relative path detection**: Now properly handles multi-level relative imports (e.g., `../../shared/utils`) using path resolution instead of regex
  - **Support for special characters**: Layer names with hyphens, underscores, and other special characters are fully supported
  - **Configuration validation**: Validates that all layers referenced in `canImport` actually exist and warns about typos
  - **Extended import support**: Now checks dynamic imports (`import()`), CommonJS (`require()`), export-from (`export { } from`), and export-all (`export * from`)
  - **Improved error messages**: Shows the actual import path and provides actionable suggestions on how to fix violations
  - **Cross-platform compatibility**: Properly handles Windows and Unix path separators
  - **Comprehensive test coverage**: Added 8 new tests covering all new features

## 0.1.0

### Minor Changes

- Initial release
- Add `layer-boundaries` rule to enforce Nuxt 4 layer architecture
- Support configurable layer dependencies
- Support multiple path aliases
- Add comprehensive test suite with ESLint RuleTester
