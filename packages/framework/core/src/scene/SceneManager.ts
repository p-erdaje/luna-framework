import type { IEventBus } from "../events/IEventBus";
import type { IPhaserSceneManagerAdapter } from "./IPhaserSceneManagerAdapter";
import type { ISceneManager, SceneChangedEvent } from "./ISceneManager";

const SCENE_CHANGED_EVENT = "scene:changed";

/**
 * SceneManager
 *
 * Default framework implementation of {@link ISceneManager}. Delegates
 * every actual start/stop/pause/resume call to an injected
 * {@link IPhaserSceneManagerAdapter} (Dependency Injection), so this
 * class contains only navigation logic and never touches Phaser
 * directly — see SceneManager.spec.ts, which tests it with a fake
 * adapter instead of a real Phaser instance.
 *
 * If an {@link IEventBus} is provided, a "scene:changed" event is
 * emitted after every navigation call so other systems (UI, audio,
 * analytics) can react without holding a direct reference to this
 * manager.
 */
export class SceneManager implements ISceneManager {
  private readonly _adapter: IPhaserSceneManagerAdapter;
  private readonly _eventBus?: IEventBus;
  private readonly _stack: string[] = [];

  public constructor(adapter: IPhaserSceneManagerAdapter, eventBus?: IEventBus) {
    this._adapter = adapter;
    this._eventBus = eventBus;
  }

  public goto(key: string, data?: Record<string, unknown>): void {
    const previous = this.getCurrentSceneKey();

    for (const sceneKey of this._stack) {
      this._adapter.stop(sceneKey);
    }
    this._stack.length = 0;

    this._adapter.start(key, data);
    this._stack.push(key);

    this._emitSceneChanged(previous, key);
  }

  public push(key: string, data?: Record<string, unknown>): void {
    const previous = this.getCurrentSceneKey();

    if (previous !== null) {
      this._adapter.pause(previous);
    }

    this._adapter.start(key, data);
    this._stack.push(key);

    this._emitSceneChanged(previous, key);
  }

  public pop(): void {
    if (this._stack.length <= 1) {
      return;
    }

    const previous = this._stack.pop();
    if (previous === undefined) {
      return;
    }

    this._adapter.stop(previous);

    const next = this.getCurrentSceneKey();
    if (next !== null) {
      this._adapter.resume(next);
    }

    this._emitSceneChanged(previous, next);
  }

  public replace(key: string, data?: Record<string, unknown>): void {
    const previous = this._stack.pop() ?? null;

    if (previous !== null) {
      this._adapter.stop(previous);
    }

    this._adapter.start(key, data);
    this._stack.push(key);

    this._emitSceneChanged(previous, key);
  }

  public getCurrentSceneKey(): string | null {
    return this._stack.at(-1) ?? null;
  }

  public getStack(): readonly string[] {
    return [...this._stack];
  }

  private _emitSceneChanged(from: string | null, to: string | null): void {
    this._eventBus?.emit<SceneChangedEvent>(SCENE_CHANGED_EVENT, { from, to });
  }
}
