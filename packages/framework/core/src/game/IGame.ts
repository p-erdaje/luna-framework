import type { IAssetManager } from "../assets/IAssetManager";
import type { IAudioManager } from "../audio/IAudioManager";
import type { IConfigManager } from "../config/IConfigManager";
import type { IEventBus } from "../events/IEventBus";
import type { IInputManager } from "../input/IInputManager";
import type { INetworkManager } from "../network/INetworkManager";
import type { ISaveManager } from "../save/ISaveManager";
import type { ISceneManager } from "../scene/ISceneManager";
import type { ITimeManager } from "../time/ITimeManager";
import type { IUIBridgeStore } from "../ui-bridge/IUIBridgeStore";

/**
 * GameManagers
 *
 * Every manager {@link Game} composes, all required. Game never
 * constructs an adapter or decides which concrete implementation to
 * use (LocalStorage vs IndexedDB, Keyboard vs Touch, etc.) — that
 * decision belongs to the app assembling these managers, consistent
 * with "the framework never depends on a game" (see
 * docs/ARCHITECTURE.md -> Framework Philosophy).
 */
export interface GameManagers {
  readonly events: IEventBus;
  readonly config: IConfigManager;
  readonly time: ITimeManager;
  readonly scenes: ISceneManager;
  readonly input: IInputManager;
  readonly save: ISaveManager;
  readonly assets: IAssetManager;
  readonly audio: IAudioManager;
  readonly ui: IUIBridgeStore;
  readonly network: INetworkManager;
}

/**
 * IGame
 *
 * Framework-level Facade (see docs/ARCHITECTURE.md -> Design Pattern
 * Usage: Facade -> Framework API) exposing every manager through one
 * object, plus the shared per-frame update and teardown lifecycle.
 */
export interface IGame extends GameManagers {
  /**
   * Advance the shared game clock and poll input for this frame. Call
   * once per frame — typically from a Phaser Scene's own
   * update(time, delta) — with a monotonically increasing timestamp.
   */
  update(currentTimestampMs: number): void;

  /**
   * Tear down every manager that holds an active resource: stop all
   * audio, disconnect the network socket, and clear all event bus and
   * UI bridge subscriptions. Call when the game is shutting down.
   */
  destroy(): void;
}
