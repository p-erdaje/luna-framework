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
import type { GameManagers, IGame } from "./IGame";

/**
 * Game
 *
 * Default framework implementation of {@link IGame}. A thin Facade —
 * every manager is constructed elsewhere (by the app assembling a
 * Luna-based game) and simply handed in here. Game itself never
 * imports Phaser, the DOM, or any concrete adapter, so it's fully unit
 * testable with fake managers — the same fakes used across the other
 * manager test suites (see Game.spec.ts).
 *
 * @example
 * const game = new Game({
 *   events: new EventBus(),
 *   config: new ConfigManager(),
 *   time: new TimeManager(),
 *   scenes: new SceneManager(new PhaserSceneManagerAdapter(scene.scene)),
 *   input: new InputManager(new KeyboardInputSourceAdapter()),
 *   save: new SaveManager(new LocalStorageAdapter()),
 *   assets: new AssetManager(new PhaserAssetLoaderAdapter(scene.load)),
 *   audio: new AudioManager(new PhaserAudioAdapter(scene.sound)),
 *   ui: new UIBridgeStore(),
 *   network: new NetworkManager(new FetchHttpAdapter(), new NativeWebSocketAdapter())
 * });
 *
 * // In a Phaser Scene's update(time, delta):
 * game.update(time);
 */
export class Game implements IGame {
  public readonly events: IEventBus;
  public readonly config: IConfigManager;
  public readonly time: ITimeManager;
  public readonly scenes: ISceneManager;
  public readonly input: IInputManager;
  public readonly save: ISaveManager;
  public readonly assets: IAssetManager;
  public readonly audio: IAudioManager;
  public readonly ui: IUIBridgeStore;
  public readonly network: INetworkManager;

  public constructor(managers: GameManagers) {
    this.events = managers.events;
    this.config = managers.config;
    this.time = managers.time;
    this.scenes = managers.scenes;
    this.input = managers.input;
    this.save = managers.save;
    this.assets = managers.assets;
    this.audio = managers.audio;
    this.ui = managers.ui;
    this.network = managers.network;
  }

  public update(currentTimestampMs: number): void {
    this.time.update(currentTimestampMs);
    this.input.update();
  }

  public destroy(): void {
    this.audio.stopAll();
    this.network.disconnectSocket();
    this.events.clear();
    this.ui.unsubscribeAll();
  }
}
