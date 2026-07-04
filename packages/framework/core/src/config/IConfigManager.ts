/**
 * IConfigManager
 *
 * Contract for centralized, type-safe configuration access. Exists to
 * enforce the "Configuration Over Hardcoding" principle: values that
 * would otherwise be magic numbers or scattered constants live here
 * instead, and every module reads from the same source of truth.
 *
 * @template TConfig - shape of the configuration schema for a given game
 * or package. Defaults to a generic string-keyed record when no specific
 * schema is provided.
 */
export interface IConfigManager<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Get a config value. Returns `defaultValue` if the key is missing;
   * throws if the key is missing and no default was provided.
   */
  get<K extends keyof TConfig>(key: K, defaultValue?: TConfig[K]): TConfig[K];

  /** Set or overwrite a single config value. */
  set<K extends keyof TConfig>(key: K, value: TConfig[K]): void;

  /** Check whether a key currently has a value. */
  has(key: keyof TConfig): boolean;

  /** Shallow-merge a partial config object into the current config. */
  merge(partial: Partial<TConfig>): void;

  /** Get a snapshot of the entire current config. Mutating the returned object does not affect internal state. */
  getAll(): Readonly<Partial<TConfig>>;

  /** Restore the config to the values it was constructed with, discarding any set()/merge() changes since. */
  reset(): void;
}
