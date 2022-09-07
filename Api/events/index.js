import { world } from "mojang-minecraft";
import { PlayerClass, EntityClass, ItemStackClass, LocationClass, VectorClass, BlockClass, BlockLocationClass, BlockPermutationClass } from "../index.js";
export class OnChatEvent {
    constructor(msg, player, data) {
        this.cancelableData = data;
        this.message = msg;
        this.args = this.message.split(' ');
        this.sender = new PlayerClass(player);
        if (this.isCanceled == undefined)
            this.isCanceled = false;
    }
    cancel() {
        this.cancelableData.cancel = true;
        this.isCanceled = true;
    }
}
export class OnChatEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["OnChat"] = true;
        let worldChat = world.events.beforeChat.subscribe((data) => {
            if (callback["OnChat"] != true)
                world.events.beforeChat.unsubscribe(worldChat);
            const callbackProperties = new OnChatEvent(data.message, data.sender, data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["OnChat"] = false;
    }
}
export class PlayerJoinedEvent {
    constructor(players) {
        this.player = players;
    }
}
export class ItemInteractEvent {
    constructor(entitySource, ItemSource, data) {
        this.source = new EntityClass(entitySource);
        this.item = new ItemStackClass(ItemSource);
        this.cancelableData = data;
    }
    cancel() {
        this.cancelableData.cancel = true;
    }
}
export class ItemInteractEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["ItemInteract"] = true;
        let worldInteract = world.events.beforeItemUse.subscribe((data) => {
            if (callback["ItemInteract"] != true)
                world.events.beforeItemUse.unsubscribe(worldInteract);
            const callbackProperties = new ItemInteractEvent(data.source, data.item, data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["ItemInteract"] = false;
    }
}
export class ProjectileEvent {
    constructor(data) {
        if (data.source)
            this.source = new EntityClass(data.source);
        this.location = new LocationClass(data.location);
        this.projectile = new EntityClass(data.projectile);
        if (data.entityHit)
            this.entityHit = new EntityClass(data.entityHit.entity);
        if (data.blockHit)
            this.blockHit = new BlockClass(data.blockHit.block);
        this.hitVector = new VectorClass(data.hitVector.x, data.hitVector.y, data.hitVector.z);
    }
}
export class ProjectileEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["projectileDamage"] = true;
        let worldProjectile = world.events.projectileHit.subscribe((data) => {
            if (callback["projectileDamage"] != true)
                world.events.projectileHit.unsubscribe(worldProjectile);
            const callbackProperties = new ProjectileEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["projectileDamage"] = false;
    }
}
export class OnDeathEvent {
    constructor(player, cause, attacker) {
        this.player = new PlayerClass(player);
        this.cause = cause;
        if (attacker)
            this.attacker = new EntityClass(attacker);
    }
}
export class OnDeathEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["PlayerDeath"] = true;
        let hitInfo = [];
        world.events.entityHurt.subscribe((data) => {
            if (data.hurtEntity.id != "minecraft:player")
                return;
            if (callback["PlayerDeath"] == true) {
                let hurtPlayer = data.hurtEntity;
                let playerIndex = hitInfo.findIndex(arg => arg.name == hurtPlayer.name);
                if (data.damagingEntity) {
                    if (playerIndex < 0) {
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: data.damagingEntity, dead: true });
                    }
                    else {
                        hitInfo.splice(playerIndex, 1);
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: data.damagingEntity, dead: true });
                    }
                }
                else {
                    if (playerIndex < 0) {
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: undefined, dead: true });
                    }
                    else {
                        hitInfo.splice(playerIndex, 1);
                        hitInfo.push({ name: hurtPlayer.name, cause: data.cause, attacker: undefined, dead: true });
                    }
                }
            }
        });
        world.events.playerLeave.subscribe((data) => {
            let playerIndex = hitInfo.findIndex(arg => arg.name == data.playerName);
            if (playerIndex >= 0) {
                hitInfo.splice(playerIndex, 1);
            }
        });
        let playerCallback = world.events.tick.subscribe(() => {
            for (let player of world.getPlayers()) {
                if (!player.hasComponent("minecraft:health"))
                    return;
                let health = player.getComponent("minecraft:health");
                if (health.current <= 0 && callback["PlayerDeath"] == true) {
                    let playerIndex = hitInfo.findIndex(arg => arg.name == player.name);
                    if (playerIndex < 0)
                        hitInfo.push({ name: player.name, cause: "died", attacker: undefined, dead: true });
                    if (playerIndex >= 0 && hitInfo[playerIndex].dead == true) {
                        const callbackProperties = new OnDeathEvent(player, hitInfo[playerIndex].cause, hitInfo[playerIndex].attacker);
                        callback(callbackProperties);
                        hitInfo[playerIndex].dead = false;
                    }
                    let playerRespawnCallback = world.events.tick.subscribe(() => {
                        if (health.current > 0) {
                            hitInfo.splice(playerIndex, 1);
                            world.events.tick.unsubscribe(playerRespawnCallback);
                        }
                    });
                }
                else if (callback["PlayerDeath"] == false) {
                    hitInfo = [];
                    world.events.tick.unsubscribe(playerCallback);
                }
            }
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["PlayerDeath"] = false;
    }
}
export class ItemInteractOnEvent {
    constructor(data) {
        this.cancelableData = data;
        this.item = data.item ? new ItemStackClass(data.item) : undefined;
        this.player = new PlayerClass(data.source);
        this.faceLocationX = data.faceLocationX;
        this.faceLocationY = data.faceLocationY;
        this.blockLocation = new BlockLocationClass(data.blockLocation);
        this.block = new BlockClass(data.source.dimension.getBlock(data.blockLocation));
    }
    cancel() {
        this.cancelableData.cancel = true;
    }
}
export class ItemInteractOnEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["InteractOn"] = true;
        let worldInteractOn = world.events.beforeItemUseOn.subscribe((data) => {
            if (data.source.id != "minecraft:player")
                return;
            if (callback["InteractOn"] != true)
                world.events.beforeItemUseOn.unsubscribe(worldInteractOn);
            const callbackProperties = new ItemInteractOnEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["InteractOn"] = false;
    }
}
export class EntityAttackEvent {
    constructor(data) {
        this.entity = new EntityClass(data.entity);
        data.hitEntity ? this.hitEntity = new EntityClass(data.hitEntity) : undefined;
        data.hitBlock ? this.hitBlock = new BlockClass(data.hitBlock) : undefined;
    }
}
export class EntityAttackEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["EntityAttack"] = true;
        let worldHit = world.events.entityHit.subscribe((data) => {
            if (callback["EntityAttack"] != true)
                world.events.entityHit.unsubscribe(worldHit);
            const callbackProperties = new EntityAttackEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["EntityAttack"] = false;
    }
}
export class EntityDamageEvent {
    constructor(data) {
        this.cause = data.cause;
        this.damage = data.damage ? data.damage : undefined;
        if (data.damagingEntity)
            this.damagingEntity = new EntityClass(data.damagingEntity);
        this.hurtEntity = new EntityClass(data.hurtEntity);
        if (data.projectile)
            this.projectile = new EntityClass(data.projectile);
    }
}
export class EntityDamageEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["EntityDamage"] = true;
        let worldHurt = world.events.entityHurt.subscribe((data) => {
            if (callback["EntityDamage"] != true)
                world.events.entityHurt.unsubscribe(worldHurt);
            const callbackProperties = new EntityDamageEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["EntityDamage"] = true;
    }
}
export class BlockBrokenEvent {
    constructor(data) {
        this.player = new PlayerClass(data.player);
        this.block = new BlockClass(data.block);
        this.blockPermutation = new BlockPermutationClass(data.brokenBlockPermutation);
    }
}
export class BlockBrokenEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["BlockBroken"] = true;
        let worldBreak = world.events.blockBreak.subscribe((data) => {
            if (callback["BlockBroken"] != true)
                world.events.blockBreak.unsubscribe(worldBreak);
            const callbackProperties = new BlockBrokenEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["BlockBroken"] = false;
    }
}
export class OnTickSignal {
    constructor() { }
    subscribe(callback) {
        callback["onTick"] = true;
        let worldTick = world.events.tick.subscribe(() => {
            if (callback["onTick"] != true)
                world.events.tick.unsubscribe(worldTick);
            callback();
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["onTick"] = false;
    }
}
export class OnEntityCreateEvent {
    constructor(data) {
        this.entity = new EntityClass(data.entity);
    }
}
export class OnEntityCreateEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["OnEntityCreate"] = true;
        let worldEntityCreate = world.events.entityCreate.subscribe((data) => {
            if (callback["OnEntityCreate"] != true)
                world.events.entityCreate.unsubscribe(worldEntityCreate);
            const callbackProperties = new OnEntityCreateEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["OnEntityCreate"] = false;
    }
}
export class OnItemReleaseEvent {
    constructor(data) {
        this.source = new EntityClass(data.source);
        this.item = new ItemStackClass(data.itemStack);
        this.useDuration = data.useDuration;
    }
}
export class OnItemReleaseEventSignal {
    constructor() { }
    subscribe(callback) {
        callback["OnItemRelease"] = true;
        let worldItemRelease = world.events.itemReleaseCharge.subscribe((data) => {
            if (callback["OnItemRelease"] != true)
                world.events.itemReleaseCharge.unsubscribe(worldItemRelease);
            const callbackProperties = new OnItemReleaseEvent(data);
            callback(callbackProperties);
        });
        return callback;
    }
    unsubscribe(callback) {
        callback["OnItemRelease"] = false;
    }
}
