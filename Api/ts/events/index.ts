import { BeforeChatEvent, Player, world, BeforeItemUseEvent, Entity, ItemStack, ProjectileHitEvent, EntityHealthComponent, BeforeItemUseOnEvent, EntityHitEvent, EntityHurtEvent, BlockBreakEvent, EntityCreateEvent, ItemReleaseChargeEvent } from "mojang-minecraft";
import { PlayerClass, EntityClass, ItemStackClass, LocationClass, VectorClass, BlockClass, BlockLocationClass, BlockPermutationClass } from "../index.js";

export class OnChatEvent {
    public message: string;
    public readonly sender: PlayerClass;
    private cancelableData: BeforeChatEvent;
    public isCanceled: boolean;
    public args: string[];
    public constructor(msg: string, player: Player, data: BeforeChatEvent) {
        this.cancelableData = data;
        this.message = msg;
        this.args = this.message.split(' ');
        this.sender = new PlayerClass(player);
        if(this.isCanceled == undefined)
            this.isCanceled = false;
        }
    public cancel() : void {
        this.cancelableData.cancel = true;
        this.isCanceled = true
    }
}
export class OnChatEventSignal {
    public constructor() {}
    public subscribe(callback: (data: OnChatEvent) => void) : (data: OnChatEvent) => void {
        callback["OnChat"] = true;
        let worldChat = world.events.beforeChat.subscribe((data) => {
            if(callback["OnChat"] != true) world.events.beforeChat.unsubscribe(worldChat);
            
            const callbackProperties = new OnChatEvent(data.message, data.sender, data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: OnChatEvent) => void) : void {
        callback["OnChat"] = false;
    }
}
export class PlayerJoinedEvent {
    public player: PlayerClass;
    public constructor(players: PlayerClass) {
        this.player = players;
    }
}
export class ItemInteractEvent {
    public source: EntityClass;
    public item: ItemStackClass;
    private cancelableData: BeforeItemUseEvent;
    public constructor(entitySource: Entity, ItemSource: ItemStack, data: BeforeItemUseEvent) {
        this.source = new EntityClass(entitySource);
        this.item = new ItemStackClass(ItemSource);
        this.cancelableData = data;
    }
    public cancel(): void {
        this.cancelableData.cancel = true;
    }
}
export class ItemInteractEventSignal {
    public constructor() {}
    public subscribe(callback: (data: ItemInteractEvent) => void) : (data: ItemInteractEvent) => void {
        callback["ItemInteract"] = true;
        let worldInteract = world.events.beforeItemUse.subscribe((data) => {
            if(callback["ItemInteract"] != true) world.events.beforeItemUse.unsubscribe(worldInteract);
            
            const callbackProperties = new ItemInteractEvent(data.source, data.item, data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: ItemInteractEvent) => void) : void {
        callback["ItemInteract"] = false;
    }
}
export class ProjectileEvent {
    public readonly source: EntityClass;
    public readonly location: LocationClass;
    public readonly projectile: EntityClass;
    public readonly entityHit: EntityClass;
    public readonly hitVector: VectorClass;
    public readonly blockHit: BlockClass;
    public constructor(data: ProjectileHitEvent) {
        if(data.source)
            this.source = new EntityClass(data.source);
        this.location = new LocationClass(data.location);
        this.projectile = new EntityClass(data.projectile);
        if(data.entityHit)
            this.entityHit = new EntityClass(data.entityHit.entity);
        if(data.blockHit)
            this.blockHit = new BlockClass(data.blockHit.block);
        this.hitVector = new VectorClass(data.hitVector.x, data.hitVector.y, data.hitVector.z);
    }
}
export class ProjectileEventSignal {
    public constructor() {}
    public subscribe(callback: (data: ProjectileEvent) => void) : (data: ProjectileEvent) => void {
        callback["projectileDamage"] = true;
        let worldProjectile = world.events.projectileHit.subscribe((data) => {
            if(callback["projectileDamage"] != true) world.events.projectileHit.unsubscribe(worldProjectile);
            
            const callbackProperties = new ProjectileEvent(data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: ProjectileEvent) => void) : void {
        callback["projectileDamage"] = false;
    }
}
export class OnDeathEvent {
    public readonly player: PlayerClass;
    public readonly cause: string;
    public readonly attacker: EntityClass;
    public constructor(player: Player, cause: string, attacker: Entity) {
        this.player = new PlayerClass(player);
        this.cause = cause;
        if(attacker)
            this.attacker = new EntityClass(attacker);
    }
}
export class OnDeathEventSignal {
    public constructor() {}
    public subscribe(callback: (data: OnDeathEvent) => void) : (data: OnDeathEvent) => void {
        callback["PlayerDeath"] = true;

        let hitInfo: {
            name: string;
            cause: string;
            attacker: Entity;
            dead: boolean
        }[] = [];
        world.events.entityHurt.subscribe((data) => {
            if(data.hurtEntity.id != "minecraft:player") return;

            if(callback["PlayerDeath"] == true) {
                let hurtPlayer = data.hurtEntity as Player;
                let playerIndex = hitInfo.findIndex(arg => arg.name == hurtPlayer.name);
                if(data.damagingEntity) {
                    if(playerIndex < 0) {
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: data.damagingEntity, dead: true });
                    } else {
                        hitInfo.splice(playerIndex, 1);
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: data.damagingEntity, dead: true });
                    }
                } else {
                    if(playerIndex < 0) {
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: undefined, dead: true });
                    } else {
                        hitInfo.splice(playerIndex, 1);
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: undefined, dead: true });
                    }
                }
            }
        });

        world.events.playerLeave.subscribe((data) => {
            let playerIndex = hitInfo.findIndex(arg => arg.name == data.playerName);
            if(playerIndex >= 0) {
                hitInfo.splice(playerIndex, 1);
            }
        });

        let playerCallback = world.events.tick.subscribe(() => {
            for(let player of world.getPlayers()) {
                if(!player.hasComponent("minecraft:health")) return;

                let health = player.getComponent("minecraft:health") as EntityHealthComponent;
                if(health.current <= 0 && callback["PlayerDeath"] == true) {
                    let playerIndex = hitInfo.findIndex(arg => arg.name == player.name);
                    if(playerIndex < 0) hitInfo.push({ name: player.name, cause: "died", attacker: undefined, dead: true });
                    if(playerIndex >= 0 && hitInfo[playerIndex].dead == true) {
                        const callbackProperties = new OnDeathEvent(player, hitInfo[playerIndex].cause, hitInfo[playerIndex].attacker);
                        callback(callbackProperties);
                        hitInfo[playerIndex].dead = false;
                    }
                    let playerRespawnCallback = world.events.tick.subscribe(() => {
                        if(health.current > 0) {
                            hitInfo.splice(playerIndex, 1);
                            world.events.tick.unsubscribe(playerRespawnCallback);
                        }
                    });
                } else if(callback["PlayerDeath"] == false) {
                    hitInfo = [];
                    world.events.tick.unsubscribe(playerCallback);
                }
            }
        });
        return callback;
    }
    public unsubscribe(callback: (data: OnDeathEvent) => void) : void {
        callback["PlayerDeath"] = false;
    }

}
export class ItemInteractOnEvent {
    private cancelableData: BeforeItemUseOnEvent;
    public readonly player: PlayerClass;
    public item: ItemStackClass;
    public readonly faceLocationX: number;
    public readonly faceLocationY: number;
    public readonly blockLocation: BlockLocationClass;
    public readonly block: BlockClass;
    public constructor(data: BeforeItemUseOnEvent) {
        this.cancelableData = data;
        this.item = data.item ? new ItemStackClass(data.item) : undefined;
        this.player = new PlayerClass(data.source as Player);
        this.faceLocationX = data.faceLocationX;
        this.faceLocationY = data.faceLocationY;
        this.blockLocation = new BlockLocationClass(data.blockLocation);
        this.block = new BlockClass(data.source.dimension.getBlock(data.blockLocation));
    }
    public cancel() : void {
        this.cancelableData.cancel = true;
    }
}
export class ItemInteractOnEventSignal {
    public constructor() {}
    public subscribe(callback: (data: ItemInteractOnEvent) => void) : (data: ItemInteractOnEvent) => void {
        callback["InteractOn"] = true;

        let worldInteractOn = world.events.beforeItemUseOn.subscribe((data) => {
            if(data.source.id != "minecraft:player") return;

            if(callback["InteractOn"] != true) world.events.beforeItemUseOn.unsubscribe(worldInteractOn);
            
            const callbackProperties = new ItemInteractOnEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    public unsubscribe(callback: (data: ItemInteractOnEvent) => void) : void {
        callback["InteractOn"] = false;
    }
}
export class EntityAttackEvent {
    public readonly hitBlock: BlockClass;
    public readonly hitEntity: EntityClass;
    public readonly entity: EntityClass;
    public constructor(data: EntityHitEvent) {
        this.entity = new EntityClass(data.entity);
        data.hitEntity ? this.hitEntity = new EntityClass(data.hitEntity) : undefined;
        data.hitBlock ? this.hitBlock = new BlockClass(data.hitBlock) : undefined;
    }
}
export class EntityAttackEventSignal {
    public constructor() {}
    public subscribe(callback: (data: EntityAttackEvent) => void) : (data: EntityAttackEvent) => void {
        callback["EntityAttack"] = true;
        let worldHit = world.events.entityHit.subscribe((data) => {
            if(callback["EntityAttack"] != true) world.events.entityHit.unsubscribe(worldHit);
            
            const callbackProperties = new EntityAttackEvent(data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: EntityAttackEvent) => void) : void {
        callback["EntityAttack"] = false;
    }
}
export class EntityDamageEvent {
    public readonly cause: string;
    public readonly damage: number;
    public readonly damagingEntity: EntityClass;
    public readonly hurtEntity: EntityClass;
    public readonly projectile: EntityClass;
    public constructor(data: EntityHurtEvent) {
        this.cause = data.cause;
        this.damage = data.damage ? data.damage : undefined;
        if(data.damagingEntity)
            this.damagingEntity = new EntityClass(data.damagingEntity);
        this.hurtEntity = new EntityClass(data.hurtEntity);
        if(data.projectile)
            this.projectile = new EntityClass(data.projectile);
        
    }
}
export class EntityDamageEventSignal {
    public constructor() {}
    public subscribe(callback: (data: EntityDamageEvent) => void) : (data: EntityDamageEvent) => void {
        callback["EntityDamage"] = true;
        let worldHurt = world.events.entityHurt.subscribe((data) => {
            if(callback["EntityDamage"] != true) world.events.entityHurt.unsubscribe(worldHurt);
            
            const callbackProperties = new EntityDamageEvent(data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: EntityDamageEvent) => void) : void {
        callback["EntityDamage"] = true;
    }
}
export class BlockBrokenEvent {
    public readonly player: PlayerClass;
    public readonly block: BlockClass;
    public readonly blockPermutation: BlockPermutationClass;
    public constructor(data: BlockBreakEvent) {
        this.player = new PlayerClass(data.player);
        this.block = new BlockClass(data.block);
        this.blockPermutation = new BlockPermutationClass(data.brokenBlockPermutation);
    }
}
export class BlockBrokenEventSignal {
    public constructor() {}
    public subscribe(callback: (data: BlockBrokenEvent) => void): (data: BlockBrokenEvent) => void {
        callback["BlockBroken"] = true;
        let worldBreak = world.events.blockBreak.subscribe((data) => {
            if(callback["BlockBroken"] != true) world.events.blockBreak.unsubscribe(worldBreak);

            const callbackProperties = new BlockBrokenEvent(data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: BlockBrokenEvent) => void) : void {
        callback["BlockBroken"] = false;
    }
}
export class OnTickSignal {
    public constructor() {}
    public subscribe(callback: () => void) : () => void {
        callback["onTick"] = true;
        let worldTick = world.events.tick.subscribe(() => {
            if(callback["onTick"] != true) world.events.tick.unsubscribe(worldTick);

            callback();
        });

        return callback;
    }
    public unsubscribe(callback: () => void) : void {
        callback["onTick"] = false;
    }
}
export class OnEntityCreateEvent {
    public readonly entity: EntityClass;
    public constructor(data: EntityCreateEvent) {
        this.entity = new EntityClass(data.entity);
    }
}
export class OnEntityCreateEventSignal {
    public constructor() {}
    public subscribe(callback: (data: OnEntityCreateEvent) => void): (data: OnEntityCreateEvent) => void {
        callback["OnEntityCreate"] = true;
        let worldEntityCreate = world.events.entityCreate.subscribe((data) => {
            if(callback["OnEntityCreate"] != true) world.events.entityCreate.unsubscribe(worldEntityCreate);

            const callbackProperties = new OnEntityCreateEvent(data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: OnEntityCreateEvent) => void) : void {
        callback["OnEntityCreate"] = false;
    }
}

export class OnItemReleaseEvent {
    public readonly source: EntityClass;
    public readonly item: ItemStackClass;
    public readonly useDuration: number;
    public constructor(data: ItemReleaseChargeEvent) {
        this.source = new EntityClass(data.source);
        this.item = new ItemStackClass(data.itemStack);
        this.useDuration = data.useDuration;
    }
}
export class OnItemReleaseEventSignal {
    public constructor() {}
    public subscribe(callback: (data: OnItemReleaseEvent) => void): (data: OnItemReleaseEvent) => void {
        callback["OnItemRelease"] = true;
        let worldItemRelease = world.events.itemReleaseCharge.subscribe((data) => {
            if(callback["OnItemRelease"] != true) world.events.itemReleaseCharge.unsubscribe(worldItemRelease);

            const callbackProperties = new OnItemReleaseEvent(data);
            callback(callbackProperties);
        });

        return callback;
    }
    public unsubscribe(callback: (data: OnItemReleaseEvent) => void) : void {
        callback["OnItemRelease"] = false;
    }
}