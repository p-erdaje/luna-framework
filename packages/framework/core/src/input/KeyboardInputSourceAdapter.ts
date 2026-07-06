import type { IInputSourceAdapter } from "./IInputSourceAdapter";

/**
 * KeyboardInputSourceAdapter
 *
 * The only place in the framework that listens to real DOM keyboard
 * events. Tracks currently-held keys using their `KeyboardEvent.code`
 * value (e.g. "KeyW", "Space", "ArrowUp") in a Set.
 *
 * Pure event plumbing, no business logic — intentionally excluded from
 * unit test coverage requirements (see docs/CONTRIBUTING.md -> Testing
 * Strategy). InputManager's actual binding/diffing logic is verified in
 * InputManager.spec.ts using a fake adapter instead.
 */
export class KeyboardInputSourceAdapter implements IInputSourceAdapter {
  private readonly _pressedCodes = new Set<string>();

  public constructor(target: Window = window) {
    target.addEventListener("keydown", this._handleKeyDown);
    target.addEventListener("keyup", this._handleKeyUp);
  }

  public isDown(code: string): boolean {
    return this._pressedCodes.has(code);
  }

  private readonly _handleKeyDown = (event: KeyboardEvent): void => {
    this._pressedCodes.add(event.code);
  };

  private readonly _handleKeyUp = (event: KeyboardEvent): void => {
    this._pressedCodes.delete(event.code);
  };
}
