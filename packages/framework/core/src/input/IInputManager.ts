/** Payload emitted on the EventBus when a bound action's state changes. */
export interface InputActionEvent {
  readonly action: string;
}

/**
 * IInputManager
 *
 * Framework-level input API based on named "actions" rather than raw
 * key codes (Command pattern — see docs/ARCHITECTURE.md -> Design
 * Pattern Usage: Command -> Input handling). Game code asks "is the
 * player pressing jump?" instead of "is Space or KeyW down?", so
 * rebinding controls later never touches gameplay code.
 */
export interface IInputManager {
  /** Bind a named action to one or more raw input codes. Any bound code being down counts as the action being down. */
  bindAction(action: string, codes: string[]): void;

  /** Remove a previously bound action entirely. */
  unbindAction(action: string): void;

  /** True if the action is currently held down. */
  isActionDown(action: string): boolean;

  /** True only during the update() call where the action transitioned from up to down. */
  isActionJustPressed(action: string): boolean;

  /** True only during the update() call where the action transitioned from down to up. */
  isActionJustReleased(action: string): boolean;

  /** Poll the input source and refresh justPressed/justReleased state for every bound action. Call once per game frame. */
  update(): void;
}
