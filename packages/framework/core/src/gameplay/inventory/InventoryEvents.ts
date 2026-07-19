/** Emitted whenever addItem() successfully adds at least some of the requested quantity. */
export interface InventoryItemAddedEvent {
  readonly entityId: string;
  readonly itemId: string;
  readonly quantityAdded: number;
}

/** Emitted whenever removeItem() successfully removes the full requested quantity. */
export interface InventoryItemRemovedEvent {
  readonly entityId: string;
  readonly itemId: string;
  readonly quantityRemoved: number;
}

/** Emitted when addItem() could not fit the entire requested quantity — no free slots and no room in existing stacks. */
export interface InventoryFullEvent {
  readonly entityId: string;
  readonly itemId: string;
  /** How much of the requested quantity could not be added. */
  readonly quantityRejected: number;
}
