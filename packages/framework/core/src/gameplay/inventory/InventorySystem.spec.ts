import { describe, expect, it, vi } from "vitest";
import { Entity } from "../../ecs/Entity";
import { EventBus } from "../../events/EventBus";
import type { InventoryComponent } from "./InventoryComponent";
import type {
  InventoryFullEvent,
  InventoryItemAddedEvent,
  InventoryItemRemovedEvent
} from "./InventoryEvents";
import { InventorySystem } from "./InventorySystem";

function createEntityWithInventory(maxSlots: number): Entity {
  const entity = new Entity("entity-0");
  entity.addComponent<InventoryComponent>({ type: "inventory", slots: [], maxSlots });
  return entity;
}

describe("InventorySystem — addItem", () => {
  it("creates a new slot when the item isn't already held", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    inventory.addItem(entity, "sword", 1);

    expect(inventory.getAllItems(entity)).toEqual([{ itemId: "sword", quantity: 1 }]);
  });

  it("tops up an existing stack of the same item instead of creating a new slot", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    inventory.addItem(entity, "arrow", 5);
    inventory.addItem(entity, "arrow", 3);

    expect(inventory.getAllItems(entity)).toEqual([{ itemId: "arrow", quantity: 8 }]);
  });

  it("stacks without limit when no maxStackSize is given", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    inventory.addItem(entity, "gold", 9999);

    expect(inventory.getItemQuantity(entity, "gold")).toBe(9999);
    expect(inventory.getAllItems(entity)).toHaveLength(1);
  });

  it("splits into multiple slots when maxStackSize is given and exceeded", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    inventory.addItem(entity, "potion", 25, { maxStackSize: 10 });

    expect(inventory.getAllItems(entity)).toEqual([
      { itemId: "potion", quantity: 10 },
      { itemId: "potion", quantity: 10 },
      { itemId: "potion", quantity: 5 }
    ]);
  });

  it("tops up an existing under-capacity stack before creating a new one, respecting maxStackSize", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    inventory.addItem(entity, "potion", 8, { maxStackSize: 10 });
    inventory.addItem(entity, "potion", 5, { maxStackSize: 10 });

    expect(inventory.getAllItems(entity)).toEqual([
      { itemId: "potion", quantity: 10 },
      { itemId: "potion", quantity: 3 }
    ]);
  });

  it("adds as much as fits and returns false when the inventory can't hold the full quantity", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(1);

    const result = inventory.addItem(entity, "potion", 25, { maxStackSize: 10 });

    expect(result).toBe(false);
    expect(inventory.getAllItems(entity)).toEqual([{ itemId: "potion", quantity: 10 }]);
  });

  it("never creates more slots than the inventory's maxSlots", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(2);

    inventory.addItem(entity, "a", 1);
    inventory.addItem(entity, "b", 1);
    inventory.addItem(entity, "c", 1);

    expect(inventory.getAllItems(entity)).toEqual([
      { itemId: "a", quantity: 1 },
      { itemId: "b", quantity: 1 }
    ]);
  });

  it("returns true and does nothing for a zero or negative quantity", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    expect(inventory.addItem(entity, "sword", 0)).toBe(true);
    expect(inventory.addItem(entity, "sword", -5)).toBe(true);
    expect(inventory.getAllItems(entity)).toEqual([]);
  });

  it("returns false for an entity with no InventoryComponent", () => {
    const inventory = new InventorySystem();
    const entity = new Entity("entity-0");

    expect(inventory.addItem(entity, "sword", 1)).toBe(false);
  });

  it("emits inventory:itemAdded with the quantity actually added", () => {
    const eventBus = new EventBus();
    const inventory = new InventorySystem(eventBus);
    const entity = createEntityWithInventory(10);
    const handler = vi.fn();

    eventBus.on<InventoryItemAddedEvent>("inventory:itemAdded", handler);
    inventory.addItem(entity, "sword", 1);

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0", itemId: "sword", quantityAdded: 1 });
  });

  it("emits inventory:full with the rejected quantity when the inventory can't fit everything", () => {
    const eventBus = new EventBus();
    const inventory = new InventorySystem(eventBus);
    const entity = createEntityWithInventory(1);
    const handler = vi.fn();

    eventBus.on<InventoryFullEvent>("inventory:full", handler);
    inventory.addItem(entity, "potion", 25, { maxStackSize: 10 });

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0", itemId: "potion", quantityRejected: 15 });
  });

  it("does not throw when constructed without an EventBus", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    expect(() => inventory.addItem(entity, "sword", 1)).not.toThrow();
  });
});

describe("InventorySystem — removeItem", () => {
  it("reduces the quantity of a matching stack", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 10);

    inventory.removeItem(entity, "arrow", 4);

    expect(inventory.getItemQuantity(entity, "arrow")).toBe(6);
  });

  it("removes the slot entirely once its quantity reaches 0", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 5);

    inventory.removeItem(entity, "arrow", 5);

    expect(inventory.getAllItems(entity)).toEqual([]);
  });

  it("removes across multiple stacks of the same item until the quantity is satisfied", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "potion", 25, { maxStackSize: 10 });

    inventory.removeItem(entity, "potion", 15);

    expect(inventory.getItemQuantity(entity, "potion")).toBe(10);
  });

  it("is atomic: removes nothing and returns false if the entity doesn't hold enough", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 3);

    const result = inventory.removeItem(entity, "arrow", 10);

    expect(result).toBe(false);
    expect(inventory.getItemQuantity(entity, "arrow")).toBe(3);
  });

  it("returns false for an entity with no InventoryComponent", () => {
    const inventory = new InventorySystem();
    const entity = new Entity("entity-0");

    expect(inventory.removeItem(entity, "arrow", 1)).toBe(false);
  });

  it("returns true and does nothing for a zero or negative quantity", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 5);

    expect(inventory.removeItem(entity, "arrow", 0)).toBe(true);
    expect(inventory.getItemQuantity(entity, "arrow")).toBe(5);
  });

  it("emits inventory:itemRemoved on a successful removal", () => {
    const eventBus = new EventBus();
    const inventory = new InventorySystem(eventBus);
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 10);
    const handler = vi.fn();

    eventBus.on<InventoryItemRemovedEvent>("inventory:itemRemoved", handler);
    inventory.removeItem(entity, "arrow", 4);

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0", itemId: "arrow", quantityRemoved: 4 });
  });

  it("does not emit inventory:itemRemoved when the removal fails", () => {
    const eventBus = new EventBus();
    const inventory = new InventorySystem(eventBus);
    const entity = createEntityWithInventory(10);
    const handler = vi.fn();

    eventBus.on<InventoryItemRemovedEvent>("inventory:itemRemoved", handler);
    inventory.removeItem(entity, "arrow", 4);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("InventorySystem — queries", () => {
  it("getItemQuantity() sums quantity across every stack of that item", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "potion", 25, { maxStackSize: 10 });

    expect(inventory.getItemQuantity(entity, "potion")).toBe(25);
  });

  it("getItemQuantity() returns 0 for an item the entity doesn't hold", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);

    expect(inventory.getItemQuantity(entity, "potion")).toBe(0);
  });

  it("hasItem() defaults to checking for at least 1", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "key", 1);

    expect(inventory.hasItem(entity, "key")).toBe(true);
    expect(inventory.hasItem(entity, "map")).toBe(false);
  });

  it("hasItem() respects an explicit quantity threshold", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 5);

    expect(inventory.hasItem(entity, "arrow", 5)).toBe(true);
    expect(inventory.hasItem(entity, "arrow", 6)).toBe(false);
  });

  it("getAllItems() returns a snapshot that does not mutate internal state when changed", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "arrow", 5);

    const snapshot = inventory.getAllItems(entity) as { itemId: string; quantity: number }[];
    snapshot.push({ itemId: "injected", quantity: 999 });

    expect(inventory.getAllItems(entity)).toEqual([{ itemId: "arrow", quantity: 5 }]);
  });

  it("getFreeSlotCount() reflects capacity minus occupied slots", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(5);
    inventory.addItem(entity, "a", 1);
    inventory.addItem(entity, "b", 1);

    expect(inventory.getFreeSlotCount(entity)).toBe(3);
  });

  it("getFreeSlotCount() returns 0 for an entity with no InventoryComponent", () => {
    const inventory = new InventorySystem();
    const entity = new Entity("entity-0");

    expect(inventory.getFreeSlotCount(entity)).toBe(0);
  });

  it("isFull() is true once every slot is occupied", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(1);
    inventory.addItem(entity, "a", 1);

    expect(inventory.isFull(entity)).toBe(true);
  });

  it("isFull() is false when at least one slot is free", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(2);
    inventory.addItem(entity, "a", 1);

    expect(inventory.isFull(entity)).toBe(false);
  });

  it("clear() removes every item from the inventory", () => {
    const inventory = new InventorySystem();
    const entity = createEntityWithInventory(10);
    inventory.addItem(entity, "a", 1);
    inventory.addItem(entity, "b", 1);

    inventory.clear(entity);

    expect(inventory.getAllItems(entity)).toEqual([]);
  });

  it("clear() does not throw for an entity with no InventoryComponent", () => {
    const inventory = new InventorySystem();
    const entity = new Entity("entity-0");

    expect(() => inventory.clear(entity)).not.toThrow();
  });
});
