import type { IComponent } from "../../ecs/IComponent";
import type { ItemStack } from "./ItemStack";

/**
 * InventoryComponent
 *
 * Pure data — a compact list of occupied slots (no empty placeholders;
 * `slots.length` is however many distinct item stacks are currently
 * held) plus a cap on how many distinct stacks are allowed. Mutated
 * only through {@link InventorySystem}, never directly by game code.
 */
export interface InventoryComponent extends IComponent {
  readonly type: "inventory";
  slots: ItemStack[];
  readonly maxSlots: number;
}
