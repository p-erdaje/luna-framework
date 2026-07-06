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
