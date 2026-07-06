import type { IEventBus } from "../events/IEventBus";
import type { IInputManager, InputActionEvent } from "./IInputManager";
import type { IInputSourceAdapter } from "./IInputSourceAdapter";

const ACTION_PRESSED_EVENT = "input:actionPressed";
const ACTION_RELEASED_EVENT = "input:actionReleased";

/**
 * InputManager
 *
 * Default framework implementation of {@link IInputManager}. Delegates
 * raw "is this code down right now?" queries to an injected
 * {@link IInputSourceAdapter}, and layers action binding plus
 * justPressed/justReleased diffing on top — none of which touches the
 * DOM, Phaser, or a real input device, so it's fully unit testable with
 * a fake adapter (see InputManager.spec.ts).
 *
 * If an {@link IEventBus} is provided, "input:actionPressed" and
 * "input:actionReleased" events are emitted on the frame an action's
 * state actually changes.
 */
export class InputManager implements IInputManager {
  private readonly _adapter: IInputSourceAdapter;
  private readonly _eventBus?: IEventBus;
  private readonly _bindings = new Map<string, string[]>();
  private readonly _isDown = new Map<string, boolean>();
  private readonly _wasDown = new Map<string, boolean>();

  public constructor(adapter: IInputSourceAdapter, eventBus?: IEventBus) {
    this._adapter = adapter;
    this._eventBus = eventBus;
  }

  public bindAction(action: string, codes: string[]): void {
    this._bindings.set(action, [...codes]);
    if (!this._isDown.has(action)) {
      this._isDown.set(action, false);
      this._wasDown.set(action, false);
    }
  }

  public unbindAction(action: string): void {
    this._bindings.delete(action);
    this._isDown.delete(action);
    this._wasDown.delete(action);
  }

  public isActionDown(action: string): boolean {
    return this._isDown.get(action) ?? false;
  }

  public isActionJustPressed(action: string): boolean {
    return this.isActionDown(action) && !(this._wasDown.get(action) ?? false);
  }

  public isActionJustReleased(action: string): boolean {
    return !this.isActionDown(action) && (this._wasDown.get(action) ?? false);
  }

  public update(): void {
    for (const [action, codes] of this._bindings) {
      const wasDown = this._isDown.get(action) ?? false;
      const isDown = codes.some((code) => this._adapter.isDown(code));

      this._wasDown.set(action, wasDown);
      this._isDown.set(action, isDown);

      if (isDown && !wasDown) {
        this._emit(ACTION_PRESSED_EVENT, action);
      } else if (!isDown && wasDown) {
        this._emit(ACTION_RELEASED_EVENT, action);
      }
    }
  }

  private _emit(event: string, action: string): void {
    this._eventBus?.emit<InputActionEvent>(event, { action });
  }
}
