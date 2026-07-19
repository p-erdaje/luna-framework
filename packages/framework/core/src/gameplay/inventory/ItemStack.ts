/**
 * ItemStack
 *
 * One occupied inventory slot: an item id and how many of it are held
 * there. Plain data — item metadata (name, icon, description) is a
 * game-specific concern and intentionally lives outside the framework.
 */
export interface ItemStack {
  readonly itemId: string;
  quantity: number;
}
