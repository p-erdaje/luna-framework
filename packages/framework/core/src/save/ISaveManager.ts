/**
 * ISaveManager
 *
 * Framework-level game save API, organized around named "slots"
 * (e.g. "slot1", "autosave") rather than raw storage keys. Handles
 * JSON serialization internally so game code just passes plain objects.
 */
export interface ISaveManager {
  /** Serialize and persist data under the given slot, overwriting any existing save there. */
  save<TData>(slot: string, data: TData): Promise<void>;

  /**
   * Load and deserialize the data saved under a slot.
   * Returns null if the slot is empty OR if the stored data is corrupted —
   * both cases mean "nothing usable to load", so callers only need one check.
   */
  load<TData>(slot: string): Promise<TData | null>;

  /** Delete the save in a slot. Safe to call even if the slot was never saved. */
  deleteSave(slot: string): Promise<void>;

  /** Check whether a slot currently has a save. */
  hasSave(slot: string): Promise<boolean>;

  /** List every slot name that currently has a save. */
  listSaveSlots(): Promise<string[]>;
}
