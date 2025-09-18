import { loadConfig, shouldTransformFile, shouldInstrumentMethod } from '../../src/transformer/config-loader.js';
import { TracingConfig, DEFAULT_CONFIG } from '../../src/transformer/types.js';

describe('Config Loader', () => {
  describe('loadConfig', () => {
    it('should load default configuration', () => {
      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge user configuration with defaults', () => {
      const userConfig: Partial<TracingConfig> = {
        spanNamePrefix: 'custom',
        debug: true,
      };

      const config = loadConfig(userConfig);
      expect(config.spanNamePrefix).toBe('custom');
      expect(config.debug).toBe(true);
      expect(config.autoInjectTracer).toBe(DEFAULT_CONFIG.autoInjectTracer);
    });

    it('should throw error for invalid configuration', () => {
      const userConfig: Partial<TracingConfig> = {
        include: [], // Invalid: empty array
      };

      expect(() => loadConfig(userConfig)).toThrow('CONFIG_INVALID');
    });

    it('should set debug mode correctly', () => {
      const userConfig: Partial<TracingConfig> = {
        include: ['**/*.ts'],
        debug: true,
      };

      // Should not throw
      const config = loadConfig(userConfig);
      expect(config.debug).toBe(true);
    });
  });

  describe('shouldTransformFile', () => {
    const config: TracingConfig = {
      ...DEFAULT_CONFIG,
      include: ['**/*service.ts', '**/*repository.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
    };

    it('should include matching files', () => {
      expect(shouldTransformFile('src/user.service.ts', config)).toBe(true);
      expect(shouldTransformFile('lib/data/user.repository.ts', config)).toBe(true);
    });

    it('should exclude matching files', () => {
      expect(shouldTransformFile('src/user.service.test.ts', config)).toBe(false);
      expect(shouldTransformFile('node_modules/some-package/index.ts', config)).toBe(false);
    });

    it('should not include non-matching files', () => {
      expect(shouldTransformFile('src/user.controller.ts', config)).toBe(false);
      expect(shouldTransformFile('src/utils.ts', config)).toBe(false);
    });

    it('should handle Windows-style paths', () => {
      expect(shouldTransformFile('src\\user.service.ts', config)).toBe(true);
      expect(shouldTransformFile('src\\user.service.test.ts', config)).toBe(false);
    });
  });

  describe('shouldInstrumentMethod', () => {
    it('should instrument public methods by default', () => {
      const config = { ...DEFAULT_CONFIG };
      expect(shouldInstrumentMethod('getData', config)).toBe(true);
      expect(shouldInstrumentMethod('processData', config)).toBe(true);
    });

    it('should respect instrumentPrivateMethods setting', () => {
      const config = { ...DEFAULT_CONFIG, instrumentPrivateMethods: false };
      expect(shouldInstrumentMethod('_privateMethod', config)).toBe(false);
      
      const configWithPrivate = { ...DEFAULT_CONFIG, instrumentPrivateMethods: true };
      expect(shouldInstrumentMethod('_privateMethod', configWithPrivate)).toBe(true);
    });

    it('should respect exclude methods', () => {
      const config = { 
        ...DEFAULT_CONFIG, 
        excludeMethods: ['toString', 'getValue'] 
      };
      expect(shouldInstrumentMethod('toString', config)).toBe(false);
      expect(shouldInstrumentMethod('getValue', config)).toBe(false);
      expect(shouldInstrumentMethod('getData', config)).toBe(true);
    });

    it('should respect include methods filter', () => {
      const config = { 
        ...DEFAULT_CONFIG, 
        includeMethods: ['getData', 'processData'] 
      };
      expect(shouldInstrumentMethod('getData', config)).toBe(true);
      expect(shouldInstrumentMethod('processData', config)).toBe(true);
      expect(shouldInstrumentMethod('otherMethod', config)).toBe(false);
    });

    it('should prioritize includeMethods over excludeMethods', () => {
      const config = { 
        ...DEFAULT_CONFIG, 
        includeMethods: ['getData'],
        excludeMethods: ['getData'] // This should be ignored
      };
      expect(shouldInstrumentMethod('getData', config)).toBe(true);
    });
  });
});
