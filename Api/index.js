import { Location, world, Vector, EntityRaycastOptions, ItemStack, BlockRaycastOptions, BlockLocation, Items, ExplosionOptions, MinecraftEffectTypes } from "mojang-minecraft";
import { ActionFormData, ModalFormData } from "mojang-minecraft-ui";
import { EntityAttackEvent, EntityDamageEvent, BlockBrokenEvent, ItemInteractEvent, OnDeathEventSignal, ItemInteractOnEventSignal, EntityAttackEventSignal, BlockBrokenEventSignal, EntityDamageEventSignal, OnChatEventSignal, ProjectileEventSignal, ItemInteractEventSignal, OnTickSignal, PlayerJoinedEvent, OnEntityCreateEventSignal, OnItemReleaseEvent, OnItemReleaseEventSignal } from "./events/index.js";
// Class
export class EntityHealth {
    constructor(data) {
        this.current = data.current;
        this.max = data.value;
        this.data = data;
    }
    setCurrent(value) {
        return this.data.setCurrent(value);
    }
}
export class LocationClass {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
    }
}
export class BlockLocationClass {
    constructor(blockLocation) {
        this.x = blockLocation.x;
        this.y = blockLocation.y;
        this.z = blockLocation.z;
    }
}
export class VectorClass {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    getVectorData() {
        return new Vector(this.x, this.y, this.z);
    }
}
export class ItemStackClass {
    constructor(item) {
        this.item = item;
        this.amount = item.amount;
        this.data = item.data;
        this.id = item.id;
        this.nameTag = item.nameTag;
    }
    setNameTag(name) {
        return this.item.nameTag = name;
    }
    getComponent(componentId) {
        return this.item.getComponent(componentId);
    }
    getComponents() {
        return this.item.getComponents();
    }
    hasComponent(componentId) {
        return this.item.hasComponent(componentId);
    }
    getLore() {
        return this.item.getLore();
    }
    setLore(lore) {
        return this.item.setLore(lore);
    }
    getItem() {
        return this.item;
    }
}
export class Database {
    constructor() {
        world.events.worldInitialize.subscribe(() => {
            world.getDimension("overworld").runCommand(`scoreboard objectives add database dummy`);
        });
    }
    create(options) {
        if (options.key)
            world.getDimension("overworld").runCommand(`scoreboard players set "$hgtDB(K:${options.key}, V:${options.value})" database 0`);
    }
    get(keys) {
        let regex = new RegExp(`(?<=\\$hgtDB\\(K:${keys}, V:)[a-zA-Z\\s\\d\\-\\.]+(?=\\))`, "g");
        let value = world.getDimension("overworld").runCommand(`scoreboard players list`).statusMessage.match(regex);
        return value;
    }
    has(keys) {
        let regex = new RegExp(`(?<=)\\$hgtDB\\(K:${keys}, V:[a-zA-Z\\s\\d\\-\\.]+\\)(?=)`, "g");
        let key = world.getDimension("overworld").runCommand(`scoreboard players list`).statusMessage.match(regex);
        if (key)
            return true;
        if (!key)
            return false;
    }
    remove(keys) {
        if (!this.has(keys))
            return;
        let value = this.get(keys);
        world.getDimension("overworld").runCommand(`scoreboard players reset "$hgtDB(K:${keys}, V:${value})" database`);
    }
}
export class CustomCommandCallBack {
    constructor(player, argument) {
        this.sender = player;
        this.args = argument;
    }
}
export class CustomCommand {
    constructor() {
        this.prefix = "!";
        this.commandList = new Map();
        this.privateCmdList = new Map();
        this.privateErr = false;
        this.defaultCommands();
        this.errorCommands();
    }
    create(options, callback) {
        if (options.hidden == true)
            this.privateCmdList.set(options.name, options.description);
        if (options.hidden == undefined || options.hidden == false)
            this.commandList.set(options.name, options.description);
        let hasErrCode = new Map();
        world.events.beforeChat.subscribe(data => {
            if (data.message.split(" ")[0] == `${this.prefix}${options.name}`) {
                if (options.permission) {
                    for (const perms of options.permission) {
                        if (data.sender.hasTag(perms)) {
                            hasErrCode.set(data.sender.name, 1);
                        }
                    }
                    if (!hasErrCode.has(data.sender.name)) {
                        this.privateErr = true;
                        data.cancel = true;
                        return data.sender.runCommand(`tellraw "${data.sender.name}" {"rawtext":[{"text":"§cYou don't have permission to run this command!"}]}`);
                    }
                    if (hasErrCode.has(data.sender.name)) {
                        hasErrCode.delete(data.sender.name);
                    }
                }
                if (options.cancel == false)
                    data.cancel = false;
                else
                    data.cancel = true;
                const callbackProperties = new CustomCommandCallBack(new PlayerClass(data.sender), data.message.split(' '));
                callback(callbackProperties);
            }
        });
    }
    getPrefix() {
        return this.prefix;
    }
    setPrefix(newPrefix) {
        return this.prefix = newPrefix;
    }
    getAllCommands() {
        const nameArray = new Array;
        const descArray = new Array;
        for (const nameMap of this.commandList.keys()) {
            nameArray.push(nameMap);
        }
        for (const descMap of this.commandList.values()) {
            descArray.push(descMap);
        }
        return {
            name: nameArray.join(' '),
            description: descArray.join(' ')
        };
    }
    defaultCommands() {
        this.create({
            name: "help",
            description: "Help command",
            cancel: true,
        }, (data) => {
            const commandsArray = new Array;
            for (const commandMap of this.commandList.keys()) {
                commandsArray.push(`${commandMap} - ${this.commandList.get(commandMap)}`);
            }
            data.sender.sendMessage(`§aList of available commands:\n§e${commandsArray.join("\n")}`);
        });
    }
    errorCommands() {
        world.events.beforeChat.subscribe(data => {
            const command = data.message.replace(this.prefix, "").split(" ")[0];
            if (data.message.split(" ")[0] == `${this.prefix}`) {
                data.cancel = true;
                return data.sender.runCommand(`tellraw "${data.sender.name}" {"rawtext":[{"text":"§cUnknown Command!"}]}`);
            }
            if (data.message.startsWith(this.prefix)) {
                if (!this.commandList.has(command) && !this.privateCmdList.has(command)) {
                    data.cancel = true;
                    return data.sender.runCommand(`tellraw "${data.sender.name}" {"rawtext":[{"text":"§cUnknown Command: \\"${command}\\"."}]}`);
                }
                if (this.privateCmdList.has(command) && this.privateErr == true)
                    return;
            }
        });
    }
}
export class CustomEnchantmentType {
    constructor(enchantment) {
        this.name = enchantment.name;
        this.description = enchantment.description;
        this.itemType = enchantment.itemType;
        this.additionalLore = enchantment.additionalLore ? enchantment.additionalLore : undefined;
    }
}
export class CustomEnchantment {
    constructor() {
        this.enchantmentList = new Map();
    }
    onHit(options, callback) {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.entityHit.subscribe(data => {
            if (data.hitEntity && data.entity.id == "minecraft:player") {
                let entityPlayer = data.entity;
                let entityInv = entityPlayer.getComponent("minecraft:inventory");
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if (item && options.itemType.some(type => item.id.includes(type))) {
                    if (!item.nameTag)
                        return;
                    let itemName = item.nameTag.split("\n");
                    if (itemName.includes(options.name)) {
                        const callbackProperties = new EntityAttackEvent(data);
                        callback(callbackProperties);
                    }
                }
            }
        });
        return new CustomEnchantmentType({
            name: options.name,
            description: options.description,
            itemType: options.itemType,
            additionalLore: options.additionalLore ? options.additionalLore : undefined,
        });
    }
    onDamage(options, callback) {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.entityHurt.subscribe(data => {
            if (data.damagingEntity && data.hurtEntity && data.damagingEntity.id == "minecraft:player") {
                let entityPlayer = data.damagingEntity;
                let entityInv = entityPlayer.getComponent("minecraft:inventory");
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if (item && options.itemType.some(type => item.id.includes(type))) {
                    if (!item.nameTag)
                        return;
                    let itemName = item.nameTag.split("\n");
                    if (itemName.includes(options.name)) {
                        const callbackProperties = new EntityDamageEvent(data);
                        callback(callbackProperties);
                    }
                }
            }
        });
        return new CustomEnchantmentType({
            name: options.name,
            description: options.description,
            itemType: options.itemType,
            additionalLore: options.additionalLore ? options.additionalLore : undefined,
        });
    }
    onBreak(options, callback) {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.blockBreak.subscribe(data => {
            let playerInv = data.player.getComponent("minecraft:inventory");
            let item = playerInv.container.getItem(data.player.selectedSlot);
            if (item && options.itemType.some(type => item.id.includes(type))) {
                if (!item.nameTag)
                    return;
                let itemName = item.nameTag.split("\n");
                if (itemName.includes(options.name)) {
                    const callbackProperties = new BlockBrokenEvent(data);
                    callback(callbackProperties);
                }
            }
        });
        return new CustomEnchantmentType({
            name: options.name,
            description: options.description,
            itemType: options.itemType,
            additionalLore: options.additionalLore ? options.additionalLore : undefined,
        });
    }
    onInteract(options, callback) {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.beforeItemUse.subscribe(data => {
            if (data.source.id == "minecraft:player") {
                let entityPlayer = data.source;
                let entityInv = entityPlayer.getComponent("minecraft:inventory");
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if (item && options.itemType.some(type => item.id.includes(type))) {
                    if (!item.nameTag)
                        return;
                    let itemName = item.nameTag.split("\n");
                    if (itemName.includes(options.name)) {
                        const callbackProperties = new ItemInteractEvent(data.source, data.item, data);
                        callback(callbackProperties);
                    }
                }
            }
        });
        return new CustomEnchantmentType({
            name: options.name,
            description: options.description,
            itemType: options.itemType,
            additionalLore: options.additionalLore ? options.additionalLore : undefined,
        });
    }
    onRelease(options, callback) {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.itemReleaseCharge.subscribe(data => {
            if (data.source.id == "minecraft:player") {
                let entityPlayer = data.source;
                let entityInv = entityPlayer.getComponent("minecraft:inventory");
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if (item && options.itemType.some(type => item.id.includes(type))) {
                    if (!item.nameTag)
                        return;
                    let itemName = item.nameTag.split("\n");
                    if (itemName.includes(options.name)) {
                        const callbackProperties = new OnItemReleaseEvent(data);
                        callback(callbackProperties);
                    }
                }
            }
        });
        return new CustomEnchantmentType({
            name: options.name,
            description: options.description,
            itemType: options.itemType,
            additionalLore: options.additionalLore ? options.additionalLore : undefined,
        });
    }
    getAllEnchantments() {
        const nameArray = new Array;
        let itemArray = [];
        for (const nameMap of this.enchantmentList.keys()) {
            nameArray.push(nameMap);
        }
        for (const descMap of this.enchantmentList.values()) {
            itemArray = descMap;
        }
        return {
            name: nameArray,
            item: itemArray,
        };
    }
    addEnchantment(item, enchantment) {
        if (!enchantment.itemType.some(type => item.id.includes(type)))
            return;
        if (item.nameTag) {
            let splitName = item.nameTag.split("\n");
            if (splitName.includes(enchantment.name))
                return;
        }
        let newItem = new ItemStackClass(new ItemStack(Items.get(item.id), item.amount, item.data));
        let itemName = item.nameTag ? item.nameTag.split("\n") : [`§r§b${item.id.replace("minecraft:", "").replace("_", " ")}`];
        itemName.push(enchantment.name);
        newItem.setNameTag(itemName.join("\n"));
        let lores = item.getLore();
        if (enchantment.additionalLore)
            lores.push(enchantment.additionalLore);
        newItem.setLore(lores);
        newItem.getComponents = item.getComponents;
        newItem.getComponent('enchantments').enchantments = item.getComponent('enchantments').enchantments;
        return newItem;
    }
    changeEnchantment(item, oldEnchantment, newEnchantment) {
        if (item.nameTag) {
            let splitName = item.nameTag.split("\n");
            if (!splitName.includes(oldEnchantment.name))
                return;
            if (splitName.includes(newEnchantment.name))
                return;
        }
        let newItem = new ItemStackClass(new ItemStack(Items.get(item.id), item.amount, item.data));
        let itemName = item.nameTag ? item.nameTag.split("\n") : [`§r§b${item.id.replace("minecraft:", "").replace("_", " ")}`];
        let lores = item.getLore();
        if (itemName.includes(oldEnchantment.name)) {
            let changeIndex = itemName.findIndex(arg => arg == oldEnchantment.name);
            itemName.splice(changeIndex, 1, newEnchantment.name);
            if (oldEnchantment.additionalLore && newEnchantment.additionalLore) {
                let changeLoreIndex = lores.findIndex(arg => arg == oldEnchantment.additionalLore);
                lores.splice(changeLoreIndex, 1, newEnchantment.additionalLore);
            }
            if (!oldEnchantment.additionalLore && newEnchantment.additionalLore) {
                lores.push(newEnchantment.additionalLore);
            }
        }
        newItem.setNameTag(itemName.join("\n"));
        newItem.setLore(lores);
        newItem.getComponents = item.getComponents;
        newItem.getComponent('enchantments').enchantments = item.getComponent('enchantments').enchantments;
        return newItem;
    }
    hasEnchantment(item, enchantment) {
        let itemName = item.nameTag ? item.nameTag.split("\n") : [`§r§b${item.id.replace("minecraft:", "").replace("_", " ")}`];
        if (itemName.includes(enchantment.name))
            return true;
        if (!itemName.includes(enchantment.name))
            return false;
    }
}
export class ActionFormDataUI {
    constructor() {
        const action = new ActionFormData();
        this.ActionForm = action;
    }
    title(name) {
        this.ActionForm.title(name);
        return this;
    }
    body(bodyText) {
        this.ActionForm.body(bodyText);
        return this;
    }
    button(buttonText, iconPath) {
        this.ActionForm.button(buttonText, iconPath);
        return this;
    }
    show(player) {
        return this.ActionForm.show(player.getPlayerData());
    }
    getActionData() {
        return this.ActionForm;
    }
}
export class ModalFormDataUI {
    constructor() {
        const modal = new ModalFormData();
        this.ModalForm = modal;
        modal.title;
        modal.dropdown;
        modal.textField;
        modal.slider;
        modal.toggle;
    }
    title(name) {
        this.ModalForm.title(name);
        return this;
    }
    dropdown(label, options) {
        this.ModalForm.dropdown(label, options);
        return this;
    }
    slider(label, minimumValue, maximumValue, valueStep) {
        this.ModalForm.slider(label, minimumValue, maximumValue, valueStep);
        return this;
    }
    textField(label, placeHolder) {
        this.ModalForm.textField(label, placeHolder);
        return this;
    }
    toggle(label) {
        this.ModalForm.toggle(label);
        return this;
    }
    show(player) {
        return this.ModalForm.show(player.getPlayerData());
    }
    getModalData() {
        return this.ModalForm;
    }
}
// Main Class
export class EventsClass {
    constructor() {
        this.blockBreak = new BlockBrokenEventSignal();
        this.onDeath = new OnDeathEventSignal();
        this.itemInteractOn = new ItemInteractOnEventSignal();
        this.entityAttack = new EntityAttackEventSignal();
        this.entityDamage = new EntityDamageEventSignal();
        this.onChat = new OnChatEventSignal();
        this.projectileHit = new ProjectileEventSignal();
        this.itemInteract = new ItemInteractEventSignal();
        this.ticks = new OnTickSignal();
        this.entityCreate = new OnEntityCreateEventSignal();
        this.itemRelease = new OnItemReleaseEventSignal();
    }
    playerJoined(callback) {
        world.events.playerJoin.subscribe(data => {
            const callbackProperties = new PlayerJoinedEvent(new PlayerClass(data.player));
            callback(callbackProperties);
        });
    }
    ready(callback) {
        world.events.worldInitialize.subscribe(() => {
            callback();
        });
    }
}
export class DimensionClass {
    constructor(dimension) {
        this._dimension = dimension;
    }
    spawnItem(item, location) {
        let itemEntity = this._dimension.spawnItem(item.getItem(), new BlockLocation(location.x, location.y, location.z));
        return new EntityClass(itemEntity);
    }
    createExplosion(location, radius, explosion) {
        return this._dimension.createExplosion(new Location(location.x, location.y, location.z), radius, explosion);
    }
    getBlock(location) {
        const block = this._dimension.getBlock(new BlockLocation(location.x, location.y, location.z));
        return new BlockClass(block);
    }
    spawnEntity(identifier, location) {
        let totalLocation = new BlockLocation(location.x, location.y, location.z);
        const entity = this._dimension.spawnEntity(identifier, totalLocation);
        return new EntityClass(entity);
    }
}
export class WorldClass {
    constructor() { }
    executeCommand(command, dimension = "overworld") {
        try {
            const cmd = world.getDimension(dimension).runCommand(command);
            return {
                statusMessage: cmd.statusMessage,
                command: command,
                error: "NULL"
            };
        }
        catch (err) {
            return {
                statusMessage: "ERROR",
                command: command,
                error: `${err}`
            };
        }
    }
    sendMessage(message) {
        return world.getDimension("overworld").runCommand(`tellraw @a {"rawtext":[{"text":"${message}"}]}`);
    }
    getDimension(dimensionId) {
        return new DimensionClass(world.getDimension(dimensionId));
    }
}
export class BlockPermutationClass {
    constructor(data) {
        this.dataPermutation = data;
        this.type = data.type;
    }
    getAllProperties() {
        return this.dataPermutation.getAllProperties();
    }
    getProperty(propertyName) {
        return this.dataPermutation.getProperty(propertyName);
    }
    getTags() {
        return this.dataPermutation.getTags();
    }
    hasTag(tag) {
        return this.hasTag(tag);
    }
    clone() {
        return this.dataPermutation.clone();
    }
}
export class BlockClass {
    constructor(block) {
        if (block) {
            this.id = block.id;
            this.x = block.x;
            this.y = block.y;
            this.z = block.z;
            this.location = new BlockLocationClass(block.location);
            this._block = block;
            this.isEmpty = block.isEmpty;
            this.isWaterLogged = block.isWaterlogged;
            this.permutation = new BlockPermutationClass(block.permutation);
            this.type = block.type;
        }
    }
    getComponent(componentId) {
        return this._block.getComponent(componentId);
    }
    getTags() {
        return this._block.getTags();
    }
    hasTag(tag) {
        return this._block.hasTag(tag);
    }
    beWaterLogged() {
        return this._block.isWaterlogged = true;
    }
    setPermutation(permutation) {
        return this._block.setPermutation(permutation);
    }
    setType(type) {
        return this._block.setType(type);
    }
    getBlockData() {
        return this._block;
    }
}
export class EntityClass {
    constructor(entity) {
        this._entity = entity;
        this.isSneaking = entity.isSneaking;
        this.location = new LocationClass(entity.location);
        this.dimension = new DimensionClass(entity.dimension);
        this.nameTag = entity.nameTag;
        this.viewVector = new VectorClass(entity.viewVector.x, entity.viewVector.y, entity.viewVector.z);
        this.velocity = new VectorClass(entity.velocity.x, entity.velocity.y, entity.velocity.z);
        this.id = entity.id;
    }
    executeCommand(command) {
        try {
            const cmd = this._entity.runCommand(command);
            return {
                statusMessage: cmd.statusMessage,
                command: command,
                error: "NULL"
            };
        }
        catch (err) {
            return {
                statusMessage: "ERROR",
                command: command,
                error: `${err}`
            };
        }
    }
    addEffect(effectType, duration, amplifier = 1, showParticles = false) {
        return this._entity.addEffect(effectType, duration, amplifier, showParticles);
    }
    getEntitiesFromViewVector(options) {
        if (!options) {
            return [...this._entity.getEntitiesFromViewVector()].map(entity => new EntityClass(entity));
        }
        else {
            const raycastOptions = new EntityRaycastOptions;
            raycastOptions.maxDistance = options.maxDistance;
            return [...this._entity.getEntitiesFromViewVector(raycastOptions)].map(entity => new EntityClass(entity));
        }
    }
    getBlockFromViewVector(options) {
        if (!options) {
            return new BlockClass(this._entity.getBlockFromViewVector());
        }
        else {
            const raycastOptions = new BlockRaycastOptions();
            raycastOptions.maxDistance = options.maxDistance;
            if (options.includePassableBlocks)
                raycastOptions.includePassableBlocks = options.includePassableBlocks;
            if (options.includeLiquidBlocks)
                raycastOptions.includeLiquidBlocks = options.includeLiquidBlocks;
            return new BlockClass(this._entity.getBlockFromViewVector(raycastOptions));
        }
    }
    setNameTag(name) {
        return this._entity.nameTag = name;
    }
    getScore(objective) {
        return world.scoreboard.getObjective(objective).getScore(this._entity.scoreboard);
    }
    setVelocity(velocity) {
        return this._entity.setVelocity(velocity.getVectorData());
    }
    getTags() {
        return this._entity.getTags();
    }
    addTag(tag) {
        return this._entity.addTag(tag);
    }
    hasTag(tag) {
        return this._entity.hasTag(tag);
    }
    removeTag(tag) {
        return this._entity.removeTag(tag);
    }
    getComponent(component) {
        return this._entity.getComponent(component);
    }
    hasComponent(component) {
        return this._entity.hasComponent(component);
    }
    kill() {
        return this._entity.kill();
    }
    getHealth() {
        const health = this._entity.getComponent("minecraft:health");
        return new EntityHealth(health);
    }
    getEntityData() {
        return this._entity;
    }
}
export class PlayerClass extends EntityClass {
    constructor(player) {
        super(player);
        this._player = player;
        this.name = player.name;
        this.nameTag = player.nameTag;
        this.location = new LocationClass(player.location);
        this.dimension = new DimensionClass(player.dimension);
        this.viewVector = new VectorClass(player.viewVector.x, player.viewVector.y, player.viewVector.z);
        this.velocity = new VectorClass(player.velocity.x, player.velocity.y, player.velocity.z);
        this.selectedSlot = player.selectedSlot;
        this.isSneaking = player.isSneaking;
    }
    executeCommand(command) {
        try {
            const cmd = this._player.runCommand(command);
            return {
                statusMessage: cmd.statusMessage,
                command: command,
                error: "NULL"
            };
        }
        catch (err) {
            return {
                statusMessage: "ERROR",
                command: command,
                error: `${err}`
            };
        }
    }
    addEffect(effectType, duration, amplifier = 1, showParticles = true) {
        return this._player.addEffect(effectType, duration, amplifier, showParticles);
    }
    sendMessage(message) {
        return this._player.runCommand(`tellraw "${this._player.name}" {"rawtext":[{"text":"${message}"}]}`);
    }
    getEntitiesFromViewVector(options) {
        if (!options) {
            return [...this._player.getEntitiesFromViewVector()].map(entity => new EntityClass(entity));
        }
        else {
            const raycastOptions = new EntityRaycastOptions;
            raycastOptions.maxDistance = options.maxDistance;
            return [...this._player.getEntitiesFromViewVector(raycastOptions)].map(entity => new EntityClass(entity));
        }
    }
    getBlockFromViewVector(options) {
        if (!options) {
            return new BlockClass(this._player.getBlockFromViewVector());
        }
        else {
            const raycastOptions = new BlockRaycastOptions();
            raycastOptions.maxDistance = options.maxDistance;
            if (options.includePassableBlocks)
                raycastOptions.includePassableBlocks = options.includePassableBlocks;
            if (options.includeLiquidBlocks)
                raycastOptions.includeLiquidBlocks = options.includeLiquidBlocks;
            return new BlockClass(this._player.getBlockFromViewVector(raycastOptions));
        }
    }
    setNameTag(name) {
        return this._player.nameTag = name;
    }
    setVelocity(velocity) {
        // Custom Set Velocity from Jayly
        let normalVelocity = velocity.getVectorData();
        normalVelocity = Vector.add(normalVelocity, new Vector(0, -1, 0));
        const health = this._player.getComponent("health");
        const currentHp = health.current;
        this._player.addEffect(MinecraftEffectTypes.instantHealth, 0, 255);
        const explosion = new ExplosionOptions();
        explosion.breaksBlocks = false;
        this._player.setVelocity(normalVelocity);
        this._player.dimension.createExplosion(this._player.location, 0.001, explosion);
        this._player.runCommand("stopsound @s random.explode");
        health.setCurrent(currentHp);
    }
    getScore(objective) {
        return world.scoreboard.getObjective(objective).getScore(this._player.scoreboard);
    }
    getTags() {
        return this._player.getTags();
    }
    addTag(tag) {
        return this._player.addTag(tag);
    }
    removeTag(tag) {
        return this._player.removeTag(tag);
    }
    hasTag(tag) {
        return this._player.hasTag(tag);
    }
    getComponent(component) {
        return this._player.getComponent(component);
    }
    hasComponent(component) {
        return this._player.hasComponent(component);
    }
    kill() {
        return this._player.kill();
    }
    getHealth() {
        const health = this._player.getComponent("minecraft:health");
        return new EntityHealth(health);
    }
    getGamemode() {
        var testforName = new RegExp(`(?<=Found )${this._player.name}+(?=)`, "g");
        var survival = this.executeCommand(`testfor @a[name="${this._player.name}",m=s]`).statusMessage.match(testforName);
        var creative = this.executeCommand(`testfor @a[name="${this._player.name}",m=c]`).statusMessage.match(testforName);
        var adventure = this.executeCommand(`testfor @a[name="${this._player.name}",m=a]`).statusMessage.match(testforName);
        if (survival)
            return "survival";
        else if (creative)
            return "creative";
        else if (adventure)
            return "adventure";
    }
    setGamemode(gamemode) {
        if (gamemode == "survival")
            this.executeCommand(`gamemode s "${this._player.name}"`);
        else if (gamemode == "creative")
            this.executeCommand(`gamemode c "${this._player.name}"`);
        else if (gamemode == "adventure")
            this.executeCommand(`gamemode a "${this._player.name}"`);
    }
    getInventory() {
        return this._player.getComponent("minecraft:inventory");
    }
    addItem(item) {
        let inv = this._player.getComponent("minecraft:inventory");
        inv.container.addItem(item.getItem());
    }
    getItem(slot) {
        let inv = this._player.getComponent("minecraft:inventory");
        let item = inv.container.getItem(slot);
        if (!item)
            return;
        let newItem = new ItemStack(Items.get(item.id), item.amount, item.data);
        newItem.nameTag = item.nameTag;
        newItem.getComponents = item.getComponents;
        newItem.setLore(item.getLore());
        newItem.getComponent("enchantments").enchantments = item.getComponent("enchantments").enchantments;
        let itemAsItemStackClass = new ItemStackClass(newItem);
        return itemAsItemStackClass;
    }
    setItem(slot, item) {
        let inv = this._player.getComponent("minecraft:inventory");
        inv.container.setItem(slot, item.getItem());
    }
    isMoving() {
        return this._player.hasTag(`gametest:is_moving`);
    }
    isSleeping() {
        return this._player.hasTag(`gametest:is_sleeping`);
    }
    isJumping() {
        return this._player.hasTag(`gametest:is_jumping`);
    }
    isOnFire() {
        return this._player.hasTag(`gametest:is_on_fire`);
    }
    isSprinting() {
        return this._player.hasTag(`gametest:is_sprinting`);
    }
    isSwimming() {
        return this._player.hasTag(`gametest:is_swimming`);
    }
    isClicking() {
        return this._player.hasTag(`gametest:is_clicking`);
    }
    getPlayerData() {
        return this._player;
    }
}
export class Minecraft {
    constructor() {
        this.world = new WorldClass();
        this.events = new EventsClass();
        this.commands = new CustomCommand();
        this.enchantments = new CustomEnchantment();
    }
    getAllPlayers() {
        return [...world.getPlayers()].map(player => new PlayerClass(player));
    }
    getAllEntities(getEntities) {
        if (getEntities) {
            return [...world.getDimension("overworld").getEntities(getEntities)].map(entities => new EntityClass(entities));
        }
        else {
            return [...world.getDimension("overworld").getEntities()].map(entities => new EntityClass(entities));
        }
    }
}
export const GametestAPI = new Minecraft();
