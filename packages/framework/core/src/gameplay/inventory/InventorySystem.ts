import type { Entity } from "../../ecs/Entity";
import type { IEventBus } from "../../events/IEventBus";
import type { InventoryComponent } from "./InventoryComponent";
import type {
  InventoryFullEvent,
  InventoryItemAddedEvent,
  InventoryItemRemovedEvent
} from "./InventoryEvents";
import type { ItemStack } from "./ItemStack";

const INVENTORY_COMPONENT_TYPE = "inventory";
const ITEM_ADDED_EVENT = "inventory:itemAdded";
const ITEM_REMOVED_EVENT = "inventory:itemRemoved";
const INVENTORY_FULL_EVENT = "inventory:full";

/** Options for a single addItem() call. */
export interface AddItemOptions {
  /** Max quantity a single slot of this item can hold. Omit for unlimited stacking (one slot holds the whole quantity). */
  readonly maxStackSize?: number;
}

/**
 * InventorySystem
 *
 * Adds and removes items on entities carrying an {@link InventoryComponent},
 * handling stacking and slot-capacity limits and emitting EventBus
 * notifications so UI (inventory screens, pickup toasts) can react
 * without polling. Action-driven — triggered by picking up loot, using
 * a potion, crafting — so this is a plain service class rather than a
 * per-frame {@link ISystem}, the same shape as {@link HealthSystem}.
 *
 * Framework-agnostic and fully unit testable: no Phaser or DOM dependency.
 */
export class InventorySystem {
  private readonly _eventBus?: IEventBus;

  public constructor(eventBus?: IEventBus) {
    this._eventBus = eventBus;
  }

  /**
   * Add `quantity` of `itemId` to the entity's inventory. Fills existing
   * stacks of the same item first (up to maxStackSize, if given), then
   * uses free slots for the remainder. If there isn't room for the full
   * quantity, adds as much as fits and returns false — the rest is
   * rejected, not queued. No-ops (returns false) if the entity has no
   * InventoryComponent.
   */
  public addItem(entity: Entity, itemId: string, quantity: number, options?: AddItemOptions): boolean {
    if (quantity <= 0) {
      return true;
    }

    const inventory = this._getInventory(entity);
    if (!inventory) {
      return false;
    }

    const maxStackSize = options?.maxStackSize;
    let remaining = quantity;

    remaining = this._fillExistingStacks(inventory, itemId, remaining, maxStackSize);
    remaining = this._fillNewSlots(inventory, itemId, remaining, maxStackSize);

    const added = quantity - remaining;

    if (added > 0) {
      this._eventBus?.emit<InventoryItemAddedEvent>(ITEM_ADDED_EVENT, {
        entityId: entity.id,
        itemId,
        quantityAdded: added
      });
    }

    if (remaining > 0) {
      this._eventBus?.emit<InventoryFullEvent>(INVENTORY_FULL_EVENT, {
        entityId: entity.id,
        itemId,
        quantityRejected: remaining
      });
      return false;
    }

    return true;
  }

  /**
   * Remove `quantity` of `itemId` from the entity's inventory. Atomic:
   * if the entity doesn't hold at least `quantity`, nothing is removed
   * and this returns false. Slots that reach 0 quantity are dropped
   * from the inventory entirely.
   */
  public removeItem(entity: Entity, itemId: string, quantity: number): boolean {
    if (quantity <= 0) {
      return true;
    }

    const inventory = this._getInventory(entity);
    if (!inventory || this.getItemQuantity(entity, itemId) < quantity) {
      return false;
    }

    let remaining = quantity;
    for (const stack of inventory.slots) {
      if (remaining === 0) {
        break;
      }
      if (stack.itemId !== itemId) {
        continue;
      }
      const removedFromStack = Math.min(stack.quantity, remaining);
      stack.quantity -= removedFromStack;
      remaining -= removedFromStack;
    }

    inventory.slots = inventory.slots.filter((stack) => stack.quantity > 0);

    this._eventBus?.emit<InventoryItemRemovedEvent>(ITEM_REMOVED_EVENT, {
      entityId: entity.id,
      itemId,
      quantityRemoved: quantity
    });

    return true;
  }

  /** Total quantity of `itemId` the entity currently holds, across every stack. 0 if none or no InventoryComponent. */
  public getItemQuantity(entity: Entity, itemId: string): number {
    const inventory = this._getInventory(entity);
    if (!inventory) {
      return 0;
    }
    return inventory.slots
      .filter((stack) => stack.itemId === itemId)
      .reduce((total, stack) => total + stack.quantity, 0);
  }

  /** Whether the entity holds at least `quantity` of `itemId` (default 1). */
  public hasItem(entity: Entity, itemId: string, quantity = 1): boolean {
    return this.getItemQuantity(entity, itemId) >= quantity;
  }

  /** Read-only snapshot of every occupied slot. Mutating the returned array does not affect internal state. */
  public getAllItems(entity: Entity): readonly ItemStack[] {
    const inventory = this._getInventory(entity);
    return inventory ? [...inventory.slots] : [];
  }

  /** How many more distinct item stacks the inventory can hold. 0 if the entity has no InventoryComponent. */
  public getFreeSlotCount(entity: Entity): number {
    const inventory = this._getInventory(entity);
    return inventory ? inventory.maxSlots - inventory.slots.length : 0;
  }

  /**
   * Whether every slot is occupied. Note this only reflects distinct-stack
   * capacity — an existing stack of the same item may still have room
   * under its maxStackSize even when isFull() is true.
   */
  public isFull(entity: Entity): boolean {
    const inventory = this._getInventory(entity);
    return inventory !== undefined && inventory.slots.length >= inventory.maxSlots;
  }

  /** Remove every item from the entity's inventory. No-ops if the entity has no InventoryComponent. */
  public clear(entity: Entity): void {
    const inventory = this._getInventory(entity);
    if (inventory) {
      inventory.slots = [];
    }
  }

  private _getInventory(entity: Entity): InventoryComponent | undefined {
    return entity.getComponent<InventoryComponent>(INVENTORY_COMPONENT_TYPE);
  }

  /** Tops up existing stacks of `itemId`, respecting maxStackSize. Returns the quantity still left to place. */
  private _fillExistingStacks(
    inventory: InventoryComponent,
    itemId: string,
    quantity: number,
    maxStackSize: number | undefined
  ): number {
    let remaining = quantity;

    for (const stack of inventory.slots) {
      if (remaining === 0) {
        break;
      }
      if (stack.itemId !== itemId) {
        continue;
      }

      const capacity = maxStackSize !== undefined ? maxStackSize - stack.quantity : remaining;
      const spaceInStack = Math.max(0, capacity);
      const toAdd = Math.min(spaceInStack, remaining);

      stack.quantity += toAdd;
      remaining -= toAdd;
    }

    return remaining;
  }

  /** Creates new slots for whatever quantity remains, respecting maxStackSize and the inventory's slot cap. Returns the quantity that still didn't fit. */
  private _fillNewSlots(
    inventory: InventoryComponent,
    itemId: string,
    quantity: number,
    maxStackSize: number | undefined
  ): number {
    let remaining = quantity;

    while (remaining > 0 && inventory.slots.length < inventory.maxSlots) {
      const stackSize = maxStackSize !== undefined ? Math.min(maxStackSize, remaining) : remaining;
      inventory.slots.push({ itemId, quantity: stackSize });
      remaining -= stackSize;
    }

    return remaining;
  }
}
