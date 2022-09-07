import { BeforeChatEvent, Player, BeforeItemUseEvent, Entity, ItemStack, ProjectileHitEvent, BeforeItemUseOnEvent, EntityHitEvent, EntityHurtEvent, BlockBreakEvent, EntityCreateEvent, ItemReleaseChargeEvent } from "mojang-minecraft";
import { PlayerClass, EntityClass, ItemStackClass, LocationClass, VectorClass, BlockClass, BlockLocationClass, BlockPermutationClass } from "../index.js";
export declare class OnChatEvent {
    message: string;
    readonly sender: PlayerClass;
    private cancelableData;
    isCanceled: boolean;
    args: string[];
    constructor(msg: string, player: Player, data: BeforeChatEvent);
    cancel(): void;
}
export declare class OnChatEventSignal {
    constructor();
    subscribe(callback: (data: OnChatEvent) => void): (data: OnChatEvent) => void;
    unsubscribe(callback: (data: OnChatEvent) => void): void;
}
export declare class PlayerJoinedEvent {
    player: PlayerClass;
    constructor(players: PlayerClass);
}
export declare class ItemInteractEvent {
    source: EntityClass;
    item: ItemStackClass;
    private cancelableData;
    constructor(entitySource: Entity, ItemSource: ItemStack, data: BeforeItemUseEvent);
    cancel(): void;
}
export declare class ItemInteractEventSignal {
    constructor();
    subscribe(callback: (data: ItemInteractEvent) => void): (data: ItemInteractEvent) => void;
    unsubscribe(callback: (data: ItemInteractEvent) => void): void;
}
export declare class ProjectileEvent {
    readonly source: EntityClass;
    readonly location: LocationClass;
    readonly projectile: EntityClass;
    readonly entityHit: EntityClass;
    readonly hitVector: VectorClass;
    readonly blockHit: BlockClass;
    constructor(data: ProjectileHitEvent);
}
export declare class ProjectileEventSignal {
    constructor();
    subscribe(callback: (data: ProjectileEvent) => void): (data: ProjectileEvent) => void;
    unsubscribe(callback: (data: ProjectileEvent) => void): void;
}
export declare class OnDeathEvent {
    readonly player: PlayerClass;
    readonly cause: string;
    readonly attacker: EntityClass;
    constructor(player: Player, cause: string, attacker: Entity);
}
export declare class OnDeathEventSignal {
    constructor();
    subscribe(callback: (data: OnDeathEvent) => void): (data: OnDeathEvent) => void;
    unsubscribe(callback: (data: OnDeathEvent) => void): void;
}
export declare class ItemInteractOnEvent {
    private cancelableData;
    readonly player: PlayerClass;
    item: ItemStackClass;
    readonly faceLocationX: number;
    readonly faceLocationY: number;
    readonly blockLocation: BlockLocationClass;
    readonly block: BlockClass;
    constructor(data: BeforeItemUseOnEvent);
    cancel(): void;
}
export declare class ItemInteractOnEventSignal {
    constructor();
    subscribe(callback: (data: ItemInteractOnEvent) => void): (data: ItemInteractOnEvent) => void;
    unsubscribe(callback: (data: ItemInteractOnEvent) => void): void;
}
export declare class EntityAttackEvent {
    readonly hitBlock: BlockClass;
    readonly hitEntity: EntityClass;
    readonly entity: EntityClass;
    constructor(data: EntityHitEvent);
}
export declare class EntityAttackEventSignal {
    constructor();
    subscribe(callback: (data: EntityAttackEvent) => void): (data: EntityAttackEvent) => void;
    unsubscribe(callback: (data: EntityAttackEvent) => void): void;
}
export declare class EntityDamageEvent {
    readonly cause: string;
    readonly damage: number;
    readonly damagingEntity: EntityClass;
    readonly hurtEntity: EntityClass;
    readonly projectile: EntityClass;
    constructor(data: EntityHurtEvent);
}
export declare class EntityDamageEventSignal {
    constructor();
    subscribe(callback: (data: EntityDamageEvent) => void): (data: EntityDamageEvent) => void;
    unsubscribe(callback: (data: EntityDamageEvent) => void): void;
}
export declare class BlockBrokenEvent {
    readonly player: PlayerClass;
    readonly block: BlockClass;
    readonly blockPermutation: BlockPermutationClass;
    constructor(data: BlockBreakEvent);
}
export declare class BlockBrokenEventSignal {
    constructor();
    subscribe(callback: (data: BlockBrokenEvent) => void): (data: BlockBrokenEvent) => void;
    unsubscribe(callback: (data: BlockBrokenEvent) => void): void;
}
export declare class OnTickSignal {
    constructor();
    subscribe(callback: () => void): () => void;
    unsubscribe(callback: () => void): void;
}
export declare class OnEntityCreateEvent {
    readonly entity: EntityClass;
    constructor(data: EntityCreateEvent);
}
export declare class OnEntityCreateEventSignal {
    constructor();
    subscribe(callback: (data: OnEntityCreateEvent) => void): (data: OnEntityCreateEvent) => void;
    unsubscribe(callback: (data: OnEntityCreateEvent) => void): void;
}
export declare class OnItemReleaseEvent {
    readonly source: EntityClass;
    readonly item: ItemStackClass;
    readonly useDuration: number;
    constructor(data: ItemReleaseChargeEvent);
}
export declare class OnItemReleaseEventSignal {
    constructor();
    subscribe(callback: (data: OnItemReleaseEvent) => void): (data: OnItemReleaseEvent) => void;
    unsubscribe(callback: (data: OnItemReleaseEvent) => void): void;
}
