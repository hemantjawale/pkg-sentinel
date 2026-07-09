/**
 * Plugin system interfaces.
 * Plugins extend pkg-sentinel without modifying core code.
 */

import type { IAnalyzer } from '../analyzers/interfaces.js';
import type { IRule } from '../rules/interfaces.js';
import type { IReporter } from '../reporters/interfaces.js';
import type { PkgSentinelConfig } from '../types/config.js';

/** Metadata about a plugin. */
export interface PluginMetadata {
  /** Unique plugin name. */
  name: string;

  /** Semantic version. */
  version: string;

  /** Human-readable description. */
  description: string;

  /** Plugin author. */
  author?: string;

  /** Minimum pkg-sentinel version required. */
  minHostVersion?: string;
}

/** Interface that all plugins must implement. */
export interface IPlugin {
  /** Plugin metadata. */
  readonly metadata: PluginMetadata;

  /**
   * Initialize the plugin with the host configuration.
   * Called once when the plugin is loaded.
   */
  initialize(config: PkgSentinelConfig): Promise<void>;

  /**
   * Return analyzers provided by this plugin.
   * These are registered alongside built-in analyzers.
   */
  getAnalyzers(): IAnalyzer[];

  /**
   * Return rules provided by this plugin.
   * These are registered alongside built-in rules.
   */
  getRules(): IRule[];

  /**
   * Return reporters provided by this plugin.
   */
  getReporters(): IReporter[];

  /**
   * Called when the plugin is being unloaded.
   * Clean up any resources.
   */
  destroy(): Promise<void>;
}

/** Interface for the plugin loader. */
export interface IPluginLoader {
  /**
   * Discover and load plugins from configured directories and packages.
   */
  loadPlugins(config: PkgSentinelConfig): Promise<IPlugin[]>;

  /**
   * Load a single plugin from a path or package name.
   */
  loadPlugin(source: string): Promise<IPlugin>;
}

/** Interface for the plugin registry. */
export interface IPluginRegistry {
  /** Register a loaded plugin. */
  register(plugin: IPlugin): void;

  /** Get all registered plugins. */
  getAll(): IPlugin[];

  /** Get a plugin by name. */
  get(name: string): IPlugin | undefined;

  /** Unregister and destroy a plugin. */
  unregister(name: string): Promise<void>;

  /** Get all analyzers from all plugins. */
  getAnalyzers(): IAnalyzer[];

  /** Get all rules from all plugins. */
  getRules(): IRule[];

  /** Get all reporters from all plugins. */
  getReporters(): IReporter[];
}
