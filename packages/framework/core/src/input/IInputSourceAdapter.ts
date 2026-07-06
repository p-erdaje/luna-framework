/**
 * IInputSourceAdapter
 *
 * Minimal contract describing a raw input source. A "code" is any string
 * identifying a digital button — a keyboard key ("KeyW", "Space"), a
 * mouse button ("MouseLeft"), or a touch region ("TouchTap0"). This
 * keeps {@link InputManager} agnostic of *where* input comes from.
 *
 * InputManager depends on this interface instead of the DOM or Phaser
 * directly (Adapter pattern), which is what makes action binding and
 * justPressed/justReleased tracking unit-testable with a fake source.
 */
export interface IInputSourceAdapter {
  /** Returns true if the given input code is currently held down. */
  isDown(code: string): boolean;
}
