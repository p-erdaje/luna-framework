/**
 * @luna/core
 *
 * Entry point for the framework core package.
 * Managers, EventBus, and Services will be exported here as they are
 * implemented in Phase 2 (see Dev_Plan.txt -> PHASE 2: Framework Foundation).
 */

export const LUNA_CORE_VERSION = "0.1.0";

export { EventBus } from "./events/EventBus";
export type { EventHandler, IEventBus } from "./events/IEventBus";

export { ConfigManager } from "./config/ConfigManager";
export type { IConfigManager } from "./config/IConfigManager";

export { TimeManager } from "./time/TimeManager";
export type { ITimeManager } from "./time/ITimeManager";

export { SceneManager } from "./scene/SceneManager";
export { PhaserSceneManagerAdapter } from "./scene/PhaserSceneManagerAdapter";
export type { ISceneManager, SceneChangedEvent } from "./scene/ISceneManager";
export type { IPhaserSceneManagerAdapter } from "./scene/IPhaserSceneManagerAdapter";

export { InputManager } from "./input/InputManager";
export { KeyboardInputSourceAdapter } from "./input/KeyboardInputSourceAdapter";
export type { IInputManager, InputActionEvent } from "./input/IInputManager";
export type { IInputSourceAdapter } from "./input/IInputSourceAdapter";

export { SaveManager } from "./save/SaveManager";
export { LocalStorageAdapter } from "./save/LocalStorageAdapter";
export { IndexedDbStorageAdapter } from "./save/IndexedDbStorageAdapter";
export type { ISaveManager } from "./save/ISaveManager";
export type { IStorageAdapter } from "./save/IStorageAdapter";

export { AssetManager } from "./assets/AssetManager";
export { PhaserAssetLoaderAdapter } from "./assets/PhaserAssetLoaderAdapter";
export type { AssetDescriptor } from "./assets/AssetDescriptor";
export type { IAssetLoaderAdapter, AssetLoadResult } from "./assets/IAssetLoaderAdapter";
export type {
  IAssetManager,
  AssetLoadProgressEvent,
  AssetLoadCompleteEvent
} from "./assets/IAssetManager";

export { UIBridgeStore } from "./ui-bridge/UIBridgeStore";
export type { IUIBridgeStore, UIBridgeListener } from "./ui-bridge/IUIBridgeStore";

export { AudioManager } from "./audio/AudioManager";
export { PhaserAudioAdapter } from "./audio/PhaserAudioAdapter";
export type { IAudioManager } from "./audio/IAudioManager";
export type { IAudioSourceAdapter, PlayOptions } from "./audio/IAudioSourceAdapter";

export { NetworkManager } from "./network/NetworkManager";
export { FetchHttpAdapter } from "./network/FetchHttpAdapter";
export { NativeWebSocketAdapter } from "./network/NativeWebSocketAdapter";
export type {
  INetworkManager,
  NetworkOpenEvent,
  NetworkMessageEvent,
  NetworkCloseEvent,
  NetworkErrorEvent
} from "./network/INetworkManager";
export type { IHttpAdapter, HttpRequestConfig, HttpResponse } from "./network/IHttpAdapter";
export type { IWebSocketAdapter, IWebSocketConnection } from "./network/IWebSocketAdapter";

export { Game } from "./game/Game";
export type { IGame, GameManagers } from "./game/IGame";

export { Entity } from "./ecs/Entity";
export { World } from "./ecs/World";
export type { IComponent } from "./ecs/IComponent";
export type { ISystem } from "./ecs/ISystem";

export { HealthSystem } from "./gameplay/health/HealthSystem";
export type { HealthComponent } from "./gameplay/health/HealthComponent";
export type {
  HealthChangedEvent,
  HealthDiedEvent,
  HealthRevivedEvent
} from "./gameplay/health/HealthEvents";

export { InventorySystem } from "./gameplay/inventory/InventorySystem";
export type { InventoryComponent } from "./gameplay/inventory/InventoryComponent";
export type { ItemStack } from "./gameplay/inventory/ItemStack";
export type {
  InventoryItemAddedEvent,
  InventoryItemRemovedEvent,
  InventoryFullEvent
} from "./gameplay/inventory/InventoryEvents";
