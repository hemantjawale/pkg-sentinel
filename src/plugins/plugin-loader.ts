/**
 * Plugin loader — discovers and loads plugins from filesystem and npm packages.
 */

import type { IPluginLoader, IPlugin } from './interfaces.js';
import type { PkgSentinelConfig } from '../types/config.js';

export class PluginLoader implements IPluginLoader {
  async loadPlugins(config: PkgSentinelConfig): Promise<IPlugin[]> {
    const plugins: IPlugin[] = [];

    // Load from configured packages
    for (const pkgName of config.plugins.packages) {
      if (config.plugins.disabled.includes(pkgName)) continue;
      try {
        const plugin = await this.loadPlugin(pkgName);
        await plugin.initialize(config);
        plugins.push(plugin);
      } catch {
        // Plugin load failure is non-fatal — log and continue
      }
    }

    return plugins;
  }

  async loadPlugin(source: string): Promise<IPlugin> {
    try {
      // Dynamic import for npm packages or file paths
      const module = await import(source);
      const PluginClass = module.default ?? module.Plugin ?? module;

      if (typeof PluginClass === 'function') {
        return new PluginClass() as IPlugin;
      }

      if (typeof PluginClass === 'object' && 'metadata' in PluginClass) {
        return PluginClass as IPlugin;
      }

      throw new Error(`Invalid plugin format: ${source}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin "${source}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
