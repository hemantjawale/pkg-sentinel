/**
 * Plugin registry — manages loaded plugin lifecycle.
 */

import type { IPluginRegistry, IPlugin } from './interfaces.js';
import type { IAnalyzer } from '../analyzers/interfaces.js';
import type { IRule } from '../rules/interfaces.js';
import type { IReporter } from '../reporters/interfaces.js';

export class PluginRegistry implements IPluginRegistry {
  private readonly plugins = new Map<string, IPlugin>();

  register(plugin: IPlugin): void {
    const name = plugin.metadata.name;
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }
    this.plugins.set(name, plugin);
  }

  getAll(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  get(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }

  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(name);
    }
  }

  getAnalyzers(): IAnalyzer[] {
    return this.getAll().flatMap((p) => p.getAnalyzers());
  }

  getRules(): IRule[] {
    return this.getAll().flatMap((p) => p.getRules());
  }

  getReporters(): IReporter[] {
    return this.getAll().flatMap((p) => p.getReporters());
  }
}
