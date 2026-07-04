import type { IConfigManager } from "./IConfigManager";

/**
 * ConfigManager
 *
 * Default framework implementation of {@link IConfigManager}. Holds
 * configuration as a plain object internally, so it's framework-agnostic
 * and testable in isolation — no dependency on Phaser, the browser, or
 * environment variables.
 *
 * A game or package defines its own config shape and passes it in:
 *
 * @example
 * interface GameConfig extends Record<string, unknown> {
 *   playerSpeed: number;
 *   masterVolume: number;
 * }
 *
 * const config = new ConfigManager<GameConfig>({ playerSpeed: 200 });
 * config.get("playerSpeed");             // 200
 * config.get("masterVolume", 0.8);       // 0.8 (key missing, uses fallback)
 */
export class ConfigManager<TConfig extends Record<string, unknown> = Record<string, unknown>>
  implements IConfigManager<TConfig>
{
  private _config: Partial<TConfig>;
  private readonly _initialConfig: Partial<TConfig>;

  public constructor(initialConfig: Partial<TConfig> = {}) {
    this._initialConfig = { ...initialConfig };
    this._config = { ...initialConfig };
  }

  public get<K extends keyof TConfig>(key: K, defaultValue?: TConfig[K]): TConfig[K] {
    if (Object.prototype.hasOwnProperty.call(this._config, key)) {
      return this._config[key] as TConfig[K];
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(
      `ConfigManager: no value found for key "${String(key)}" and no default was provided.`
    );
  }

  public set<K extends keyof TConfig>(key: K, value: TConfig[K]): void {
    this._config[key] = value;
  }

  public has(key: keyof TConfig): boolean {
    return Object.prototype.hasOwnProperty.call(this._config, key);
  }

  public merge(partial: Partial<TConfig>): void {
    this._config = { ...this._config, ...partial };
  }

  public getAll(): Readonly<Partial<TConfig>> {
    return { ...this._config };
  }

  public reset(): void {
    this._config = { ...this._initialConfig };
  }
}
