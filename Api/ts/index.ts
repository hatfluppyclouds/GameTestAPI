import { Entity, Location, Player, world, Vector, EntityRaycastOptions, IEntityComponent, EntityHealthComponent, EntityInventoryComponent, ItemType, ItemStack, BeforeChatEvent, BeforeItemUseEvent, ProjectileHitEvent, BlockRaycastOptions, Block, BlockLocation, BeforeItemUseOnEvent, EntityHitEvent, BlockBreakEvent, BlockPermutation, BlockType, IBlockProperty, EffectType, Items, EntityHurtEvent, Dimension, ExplosionOptions, EntityQueryOptions, MinecraftEffectTypes } from "mojang-minecraft";
import { ActionFormData, ActionFormResponse, ModalFormData, ModalFormResponse } from "mojang-minecraft-ui";
import { EntityAttackEvent, EntityDamageEvent, BlockBrokenEvent, ItemInteractEvent, OnDeathEventSignal, ItemInteractOnEventSignal, EntityAttackEventSignal, BlockBrokenEventSignal, EntityDamageEventSignal, OnChatEventSignal, ProjectileEventSignal, ItemInteractEventSignal, OnTickSignal, PlayerJoinedEvent, OnEntityCreateEventSignal, OnItemReleaseEvent, OnItemReleaseEventSignal } from "./events/index.js";

// Official GameTestAPI
/*
Credit to:
rezabruh
jayly
Iblqzed
*/

// Types / Interfaces
export type DimensionList = 
| "overworld"
| "nether"
| "theEnd"
;
export type GameModeList = 
| "survival"
| "creative"
| "adventure"
;
export interface ExecuteCommandI {
    statusMessage: string;
    command: string;
    error: string;
}
export interface RaycastOptions {
    maxDistance: number;
    includePassableBlocks?: boolean;
    includeLiquidBlocks?: boolean;
}
export interface DatabaseI {
    key: string;
    value: string;
}
export interface CustomCommandOptionI {
    name: string;
    description: string;
    cancel?: boolean;
    hidden?: boolean;
    permission?: string[];
}
export interface CustomEnchantmentOptions {
    name: string;
    description: string;
    itemType: string[];
    additionalLore?: string;
}

// Class
export class EntityHealth {
    public readonly max: number;
    public readonly current: number;
    private data: EntityHealthComponent;
    public constructor(data: EntityHealthComponent) {
        this.current = data.current;
        this.max = data.value;
        this.data = data;
    }
    public setCurrent(value: number) : void {
        return this.data.setCurrent(value);
    }
}
export class LocationClass {
    public x: number;
    public y: number;
    public z: number;
    public constructor(data: Location) {
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
    }
}
export class BlockLocationClass {
    public x: number;
    public y: number;
    public z: number;
    public constructor(blockLocation: BlockLocation) {
        this.x = blockLocation.x;
        this.y = blockLocation.y;
        this.z = blockLocation.z;
    }
}
export class VectorClass {
    public x: number;
    public y: number;
    public z: number;
    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    public getVectorData() : Vector {
        return new Vector(this.x, this.y, this.z);
    }
}
export class ItemStackClass {
    public amount: number;
    public data: number;
    public readonly id: string;
    public readonly nameTag: string;
    private item: ItemStack;
    public constructor(item: ItemStack) {
        this.item = item;
        this.amount = item.amount;
        this.data = item.data;
        this.id = item.id;
        this.nameTag = item.nameTag;
    }
    public setNameTag(name: string) : string {
        return this.item.nameTag = name;
    }
    public getComponent(componentId: string) : any {
        return this.item.getComponent(componentId);
    }
    public getComponents() : any[] {
        return this.item.getComponents();
    }
    public hasComponent(componentId: string) : boolean {
        return this.item.hasComponent(componentId);
    }
    public getLore() : string[] {
        return this.item.getLore();
    }
    public setLore(lore: string[]) : void {
        return this.item.setLore(lore);
    }
    public getItem() : ItemStack {
        return this.item;
    }
}
export class Database {
    public constructor() {
        world.events.worldInitialize.subscribe(() => {
            world.getDimension("overworld").runCommand(`scoreboard objectives add database dummy`);
        });
    }
    public create(options: DatabaseI) : void {
        if(options.key)
            world.getDimension("overworld").runCommand(`scoreboard players set "$hgtDB(K:${options.key}, V:${options.value})" database 0`);
    }
    public get(keys: string) : string {
        let regex = new RegExp(`(?<=\\$hgtDB\\(K:${keys}, V:)[a-zA-Z\\s\\d\\-\\.]+(?=\\))`, "g");
        let value = world.getDimension("overworld").runCommand(`scoreboard players list`).statusMessage.match(regex);
        return value;
    }
    public has(keys: string) : boolean {
        let regex = new RegExp(`(?<=)\\$hgtDB\\(K:${keys}, V:[a-zA-Z\\s\\d\\-\\.]+\\)(?=)`, "g");
        let key = world.getDimension("overworld").runCommand(`scoreboard players list`).statusMessage.match(regex);
        if(key)
            return true;
        
        if(!key)
            return false;
    }
    public remove(keys: string) : void {
        if(!this.has(keys)) return;

        let value = this.get(keys);
        world.getDimension("overworld").runCommand(`scoreboard players reset "$hgtDB(K:${keys}, V:${value})" database`)
    }
}
export class CustomCommandCallBack {
    public readonly sender: PlayerClass;
    public args: string[];
    public constructor(player: PlayerClass, argument: string[]) {
        this.sender = player;
        this.args = argument;
    }
}
export class CustomCommand {
    private prefix: string = "!";
    private commandList: Map<string, string> = new Map<string, string>();
    private privateCmdList: Map<string, string> = new Map<string, string>();
    private privateErr: boolean = false;
    public constructor() {
        this.defaultCommands();
        this.errorCommands();
    }
    public create(options: CustomCommandOptionI, callback: (data: CustomCommandCallBack) => void) : void {
        if(options.hidden == true)
            this.privateCmdList.set(options.name, options.description);

        if(options.hidden == undefined || options.hidden == false)
            this.commandList.set(options.name, options.description);
        
        let hasErrCode: Map<string, number> = new Map<string, number>();
        world.events.beforeChat.subscribe(data => {
            if(data.message.split(" ")[0] == `${this.prefix}${options.name}`) {
                if(options.permission) {
                    for(const perms of options.permission) {
                        if(data.sender.hasTag(perms)) {
                            hasErrCode.set(data.sender.name, 1)
                        }
                    }
                    if(!hasErrCode.has(data.sender.name)) {
                        this.privateErr = true;
                        data.cancel = true;
                        return data.sender.runCommand(`tellraw "${data.sender.name}" {"rawtext":[{"text":"§cYou don't have permission to run this command!"}]}`);
                    }
                    if(hasErrCode.has(data.sender.name)) {
                        hasErrCode.delete(data.sender.name);
                    }
                }
                
                if(options.cancel == false)
                    data.cancel = false;

                else
                    data.cancel = true;
                
                const callbackProperties = new CustomCommandCallBack(new PlayerClass(data.sender), data.message.split(' '));
                callback(callbackProperties);
            }
        });
    }
    public getPrefix() : string {
        return this.prefix;
    }
    public setPrefix(newPrefix: string) : string {
        return this.prefix = newPrefix;
    }
    public getAllCommands() : {
        name: string;
        description: string;
    } {
        const nameArray: string[] = new Array;
        const descArray: string[] = new Array;
        for(const nameMap of this.commandList.keys()) {
            nameArray.push(nameMap);
        }
        for(const descMap of this.commandList.values()) {
            descArray.push(descMap);
        }
        return {
            name: nameArray.join(' '),
            description: descArray.join(' ')
        }
    }
    private defaultCommands() : void {
        this.create({
            name: "help",
            description: "Help command",
            cancel: true,
        }, (data) => {
            const commandsArray: string[] = new Array;
            for(const commandMap of this.commandList.keys()) {
                commandsArray.push(`${commandMap} - ${this.commandList.get(commandMap)}`);
            }
            data.sender.sendMessage(`§aList of available commands:\n§e${commandsArray.join("\n")}`);
        });
    }
    private errorCommands() : void {
        world.events.beforeChat.subscribe(data => {
        const command = data.message.replace(this.prefix, "").split(" ")[0];
            if(data.message.split(" ")[0] == `${this.prefix}`) {
                data.cancel = true;
                return data.sender.runCommand(`tellraw "${data.sender.name}" {"rawtext":[{"text":"§cUnknown Command!"}]}`);
            }
            
            if(data.message.startsWith(this.prefix)) {
                if(!this.commandList.has(command) && !this.privateCmdList.has(command)) {
                    data.cancel = true;
                    return data.sender.runCommand(`tellraw "${data.sender.name}" {"rawtext":[{"text":"§cUnknown Command: \\"${command}\\"."}]}`);
                }
                if(this.privateCmdList.has(command) && this.privateErr == true) 
                    return;
            }
        });
    }
}
export class CustomEnchantmentType {
    public readonly name: string;
    public readonly description: string;
    public readonly itemType: string[];
    public readonly additionalLore: string;
    public constructor(enchantment: {
        name: string;
        description: string;
        itemType: string[];
        additionalLore?: string;
    }) {
        this.name = enchantment.name;
        this.description = enchantment.description;
        this.itemType = enchantment.itemType;
        this.additionalLore = enchantment.additionalLore ? enchantment.additionalLore : undefined;
    }
}
export class CustomEnchantment {
    private enchantmentList: Map<string, string[]> = new Map<string, string[]>();
    public constructor() {}
    public onHit(options: CustomEnchantmentOptions, callback: (data: EntityAttackEvent) => void) : CustomEnchantmentType {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.entityHit.subscribe(data => {
            if(data.hitEntity && data.entity.id == "minecraft:player") {
                let entityPlayer = data.entity as Player;
                let entityInv = entityPlayer.getComponent("minecraft:inventory") as EntityInventoryComponent;
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if(item && options.itemType.some(type => item.id.includes(type))) {
                    if(!item.nameTag) return;

                    let itemName = item.nameTag.split("\n");
                    if(itemName.includes(options.name)) {
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
    public onDamage(options: CustomEnchantmentOptions, callback: (data: EntityDamageEvent) => void) : CustomEnchantmentType {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.entityHurt.subscribe(data => {
            if(data.damagingEntity && data.hurtEntity && data.damagingEntity.id == "minecraft:player") {
                let entityPlayer = data.damagingEntity as Player;
                let entityInv = entityPlayer.getComponent("minecraft:inventory") as EntityInventoryComponent;
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if(item && options.itemType.some(type => item.id.includes(type))) {
                    if(!item.nameTag) return;

                    let itemName = item.nameTag.split("\n");
                    if(itemName.includes(options.name)) {
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
    public onBreak(options: CustomEnchantmentOptions, callback: (data: BlockBrokenEvent) => void) : CustomEnchantmentType {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.blockBreak.subscribe(data => {
            let playerInv = data.player.getComponent("minecraft:inventory") as EntityInventoryComponent;
            let item = playerInv.container.getItem(data.player.selectedSlot);
            if(item && options.itemType.some(type => item.id.includes(type))) {
                if(!item.nameTag) return;

                let itemName = item.nameTag.split("\n");
                if(itemName.includes(options.name)) {
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
    public onInteract(options: CustomEnchantmentOptions, callback: (data: ItemInteractEvent) => void) : CustomEnchantmentType {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.beforeItemUse.subscribe(data => {
            if(data.source.id == "minecraft:player") {
                let entityPlayer = data.source as Player;
                let entityInv = entityPlayer.getComponent("minecraft:inventory") as EntityInventoryComponent;
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if(item && options.itemType.some(type => item.id.includes(type))) {
                    if(!item.nameTag) return;

                    let itemName = item.nameTag.split("\n");
                    if(itemName.includes(options.name)) {
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
    public onRelease(options: CustomEnchantmentOptions, callback: (data: OnItemReleaseEvent) => void) : CustomEnchantmentType {
        this.enchantmentList.set(options.name, options.itemType);
        world.events.itemReleaseCharge.subscribe(data => {
            if(data.source.id == "minecraft:player") {
                let entityPlayer = data.source as Player;
                let entityInv = entityPlayer.getComponent("minecraft:inventory") as EntityInventoryComponent;
                let item = entityInv.container.getItem(entityPlayer.selectedSlot);
                if(item && options.itemType.some(type => item.id.includes(type))) {
                    if(!item.nameTag) return;

                    let itemName = item.nameTag.split("\n");
                    if(itemName.includes(options.name)) {
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
    public getAllEnchantments() : { name: string[], item: string[] } {
        const nameArray: string[] = new Array;
        let itemArray: string[] = [];
        for(const nameMap of this.enchantmentList.keys()) {
            nameArray.push(nameMap);
        }
        for(const descMap of this.enchantmentList.values()) {
            itemArray = descMap;
        }
        return {
            name: nameArray,
            item: itemArray,
        }
    }
    public addEnchantment(item: ItemStackClass, enchantment: CustomEnchantmentType) : ItemStackClass {
        if(!enchantment.itemType.some(type => item.id.includes(type))) return;
        if(item.nameTag) {
            let splitName = item.nameTag.split("\n");
            if(splitName.includes(enchantment.name)) return;
        }

        let newItem = new ItemStackClass(new ItemStack(Items.get(item.id), item.amount, item.data));
        let itemName = item.nameTag ? item.nameTag.split("\n") : [`§r§b${item.id.replace("minecraft:", "").replace("_", " ")}`];
        itemName.push(enchantment.name);
        newItem.setNameTag(itemName.join("\n"));
        let lores = item.getLore();
        if(enchantment.additionalLore)
            lores.push(enchantment.additionalLore);
        newItem.setLore(lores);
        newItem.getComponents = item.getComponents;
        newItem.getComponent('enchantments').enchantments = item.getComponent('enchantments').enchantments;
        
        return newItem;
    }
    public changeEnchantment(item: ItemStackClass, oldEnchantment: CustomEnchantmentType, newEnchantment: CustomEnchantmentType) : ItemStackClass {
        if(item.nameTag) {
            let splitName = item.nameTag.split("\n");
            if(!splitName.includes(oldEnchantment.name)) return;
            if(splitName.includes(newEnchantment.name)) return;
        }

        let newItem = new ItemStackClass(new ItemStack(Items.get(item.id), item.amount, item.data));
        let itemName = item.nameTag ? item.nameTag.split("\n") : [`§r§b${item.id.replace("minecraft:", "").replace("_", " ")}`];
        let lores = item.getLore();
        if(itemName.includes(oldEnchantment.name)) {
            let changeIndex = itemName.findIndex(arg => arg == oldEnchantment.name);
            itemName.splice(changeIndex, 1, newEnchantment.name);
            if(oldEnchantment.additionalLore && newEnchantment.additionalLore) {
                let changeLoreIndex = lores.findIndex(arg => arg == oldEnchantment.additionalLore);
                lores.splice(changeLoreIndex, 1, newEnchantment.additionalLore);
            }
            if(!oldEnchantment.additionalLore && newEnchantment.additionalLore) {
                lores.push(newEnchantment.additionalLore);
            }
        }
        newItem.setNameTag(itemName.join("\n"));
        newItem.setLore(lores);
        newItem.getComponents = item.getComponents;
        newItem.getComponent('enchantments').enchantments = item.getComponent('enchantments').enchantments;
        
        return newItem;
    }
    public hasEnchantment(item: ItemStackClass, enchantment: CustomEnchantmentType) : boolean {
        let itemName = item.nameTag ? item.nameTag.split("\n") : [`§r§b${item.id.replace("minecraft:", "").replace("_", " ")}`];
        if(itemName.includes(enchantment.name)) return true;
        if(!itemName.includes(enchantment.name)) return false;
    }
}
export class ActionFormDataUI {
    private ActionForm: ActionFormData;
    public constructor() {
        const action = new ActionFormData();
        this.ActionForm = action;
    }
    public title(name: string) : ActionFormDataUI {
        this.ActionForm.title(name);
        return this;
    }
    public body(bodyText: string) : ActionFormDataUI {
        this.ActionForm.body(bodyText);
        return this;
    }
    public button(buttonText: string, iconPath?: string) : ActionFormDataUI {
        this.ActionForm.button(buttonText, iconPath);
        return this;
    }
    public show(player: PlayerClass) : Promise<ActionFormResponse> {
        return this.ActionForm.show(player.getPlayerData());
    }
    public getActionData() : ActionFormData {
        return this.ActionForm;
    }
}
export class ModalFormDataUI {
    private ModalForm: ModalFormData;
    public constructor() {
        const modal = new ModalFormData();
        this.ModalForm = modal;
        modal.title;
        modal.dropdown;
        modal.textField;
        modal.slider;
        modal.toggle
    }
    public title(name: string) : ModalFormDataUI {
        this.ModalForm.title(name);
        return this;
    }
    public dropdown(label: string, options: string[]) : ModalFormDataUI {
        this.ModalForm.dropdown(label, options);
        return this;
    }
    public slider(label: string, minimumValue: number, maximumValue: number, valueStep: number) : ModalFormDataUI {
        this.ModalForm.slider(label, minimumValue, maximumValue, valueStep);
        return this;
    }
    public textField(label: string, placeHolder: string) : ModalFormDataUI {
        this.ModalForm.textField(label, placeHolder);
        return this;
    }
    public toggle(label: string) : ModalFormDataUI {
        this.ModalForm.toggle(label);
        return this;
    }
    public show(player: PlayerClass) : Promise<ModalFormResponse> {
        return this.ModalForm.show(player.getPlayerData());
    }
    public getModalData() : ModalFormData {
        return this.ModalForm;
    }
}

// Main Class
export class EventsClass {
    public readonly onDeath: OnDeathEventSignal;
    public readonly itemInteractOn: ItemInteractOnEventSignal;
    public readonly entityAttack: EntityAttackEventSignal;
    public readonly blockBreak: BlockBrokenEventSignal;
    public readonly entityDamage: EntityDamageEventSignal;
    public readonly onChat: OnChatEventSignal;
    public readonly projectileHit: ProjectileEventSignal;
    public readonly itemInteract: ItemInteractEventSignal;
    public readonly ticks: OnTickSignal;
    public readonly entityCreate: OnEntityCreateEventSignal;
    public readonly itemRelease: OnItemReleaseEventSignal;
    public constructor() {
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
    public playerJoined(callback: (data: PlayerJoinedEvent) => void) : void {
        world.events.playerJoin.subscribe(data => {
            const callbackProperties = new PlayerJoinedEvent(new PlayerClass(data.player));
            callback(callbackProperties);
        });
    }
    public ready(callback: () => void) : void {
        world.events.worldInitialize.subscribe(() => {
            callback();
        });
    }
}
export class DimensionClass {
    private _dimension: Dimension;
    public constructor(dimension: Dimension) {
        this._dimension = dimension;
    }
    public spawnItem(item: ItemStackClass, location: BlockLocationClass) : EntityClass {
        let itemEntity = this._dimension.spawnItem(item.getItem(), new BlockLocation(location.x, location.y, location.z));
        return new EntityClass(itemEntity);
    }
    public createExplosion(location: LocationClass, radius: number, explosion: ExplosionOptions) : void {
        return this._dimension.createExplosion(new Location(location.x, location.y, location.z), radius, explosion);
    }
    public getBlock(location: BlockLocationClass) : BlockClass {
        const block = this._dimension.getBlock(new BlockLocation(location.x, location.y, location.z));
        return new BlockClass(block);
    }
    public spawnEntity(identifier: string, location: LocationClass | BlockLocationClass) : EntityClass {
        let totalLocation = new BlockLocation(location.x, location.y, location.z);
        const entity = this._dimension.spawnEntity(identifier, totalLocation);
        return new EntityClass(entity);
    }
}
export class WorldClass {
    public constructor() {}
    public executeCommand(command: string, dimension: DimensionList = "overworld") : ExecuteCommandI {
        try {
            const cmd = world.getDimension(dimension).runCommand(command);
            return {
                statusMessage: cmd.statusMessage,
                command: command,
                error: "NULL"
            }
        } catch (err) {
            return {
                statusMessage: "ERROR",
                command: command,
                error: `${err}`
            }
        }
    }
    public sendMessage(message: string) : void {
        return world.getDimension("overworld").runCommand(`tellraw @a {"rawtext":[{"text":"${message}"}]}`);
    }
    public getDimension(dimensionId: string) : DimensionClass {
        return new DimensionClass(world.getDimension(dimensionId));
    }  
}
export class BlockPermutationClass {
    private dataPermutation: BlockPermutation;
    public readonly type: BlockType;
    public constructor(data: BlockPermutation) {
        this.dataPermutation = data;
        this.type = data.type;
    }
    public getAllProperties() : IBlockProperty[] {
        return this.dataPermutation.getAllProperties();
    }
    public getProperty(propertyName: string) : IBlockProperty {
        return this.dataPermutation.getProperty(propertyName);
    }
    public getTags() : string[] {
        return this.dataPermutation.getTags();
    }
    public hasTag(tag: string) : boolean {
        return this.hasTag(tag);
    }
    public clone() : BlockPermutation {
        return this.dataPermutation.clone();
    }

}
export class BlockClass {
    public readonly id: string;
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;
    public readonly location: BlockLocationClass;
    public readonly isEmpty: boolean;
    public readonly isWaterLogged: boolean;
    public readonly permutation: BlockPermutationClass;
    public readonly type: BlockType;
    private _block: Block;
    public constructor(block: Block) {
        if(block) {
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
    public getComponent(componentId: string) : any {
        return this._block.getComponent(componentId);
    }
    public getTags() : string[] {
        return this._block.getTags();
    }
    public hasTag(tag: string) : boolean {
        return this._block.hasTag(tag);
    }
    public beWaterLogged() : boolean {
        return this._block.isWaterlogged = true;
    }
    public setPermutation(permutation: BlockPermutation) : void {
        return this._block.setPermutation(permutation);
    }
    public setType(type: BlockType) : void {
        return this._block.setType(type);
    }
    public getBlockData() : Block {
        return this._block;
    }
}
export class EntityClass {
    public readonly nameTag: string;
    public readonly location: LocationClass;
    public readonly viewVector: VectorClass;
    public readonly velocity: VectorClass;
    public readonly id: string;
    public readonly dimension: DimensionClass;
    public isSneaking: boolean;
    private _entity: Entity
    public constructor(entity: Entity) {
        this._entity = entity;
        this.isSneaking = entity.isSneaking;
        this.location = new LocationClass(entity.location);
        this.dimension = new DimensionClass(entity.dimension);
        this.nameTag = entity.nameTag;
        this.viewVector = new VectorClass(entity.viewVector.x, entity.viewVector.y, entity.viewVector.z,);
        this.velocity = new VectorClass(entity.velocity.x, entity.velocity.y, entity.velocity.z,);
        this.id = entity.id;
    }
    public executeCommand(command: string) : ExecuteCommandI {
        try {
            const cmd = this._entity.runCommand(command);
            return {
                statusMessage: cmd.statusMessage,
                command: command,
                error: "NULL"
            }
        } catch (err) {
            return {
                statusMessage: "ERROR",
                command: command,
                error: `${err}`
            }
        }
    }
    public addEffect(effectType: EffectType, duration: number, amplifier: number = 1, showParticles: boolean = false) : void {
        return this._entity.addEffect(effectType, duration, amplifier, showParticles);
    }
    public getEntitiesFromViewVector(options?: RaycastOptions) : EntityClass[] {
        if(!options) {
            return [...this._entity.getEntitiesFromViewVector()].map(entity => new EntityClass(entity));
        } else {
            const raycastOptions: EntityRaycastOptions = new EntityRaycastOptions;
            raycastOptions.maxDistance = options.maxDistance;
            return [...this._entity.getEntitiesFromViewVector(raycastOptions)].map(entity => new EntityClass(entity));
        }
    }
    public getBlockFromViewVector(options?: RaycastOptions) : BlockClass {
        if(!options) {
            return new BlockClass(this._entity.getBlockFromViewVector());
        } else {
            const raycastOptions: BlockRaycastOptions = new BlockRaycastOptions();
            raycastOptions.maxDistance = options.maxDistance;
            if(options.includePassableBlocks)
                raycastOptions.includePassableBlocks = options.includePassableBlocks;
            if(options.includeLiquidBlocks)
                raycastOptions.includeLiquidBlocks = options.includeLiquidBlocks;
            return new BlockClass(this._entity.getBlockFromViewVector(raycastOptions));
        }
    }
    public setNameTag(name: string) : string {
        return this._entity.nameTag = name;
    }
    public getScore(objective: string) : number {
        return world.scoreboard.getObjective(objective).getScore(this._entity.scoreboard);
    }
    public setVelocity(velocity: VectorClass) : void {
        return this._entity.setVelocity(velocity.getVectorData());
    }
    public getTags() : string[] {
        return this._entity.getTags();
    }
    public addTag(tag: string) : boolean {
        return this._entity.addTag(tag);
    }
    public hasTag(tag: string) : boolean {
        return this._entity.hasTag(tag);
    }
    public removeTag(tag: string) : boolean {
        return this._entity.removeTag(tag);
    }
    public getComponent(component: string) : IEntityComponent {
        return this._entity.getComponent(component);
    }
    public hasComponent(component: string) : boolean {
        return this._entity.hasComponent(component);
    }
    public kill() : void {
        return this._entity.kill();
    }
    public getHealth() : EntityHealth {
        const health = this._entity.getComponent("minecraft:health") as EntityHealthComponent;

        return new EntityHealth(health);
    }
    public getEntityData() : Entity {
        return this._entity;
    }
}
export class PlayerClass extends EntityClass {
    public readonly nameTag: string;
    public readonly name: string;
    public readonly location: LocationClass;
    public readonly viewVector: VectorClass;
    public readonly velocity: VectorClass;
    public readonly dimension: DimensionClass;
    public selectedSlot: number;
    public isSneaking: boolean;
    private _player: Player;
    public constructor(player: Player) {
        super(player);
        this._player = player;
        this.name = player.name;
        this.nameTag = player.nameTag;
        this.location = new LocationClass(player.location);
        this.dimension = new DimensionClass(player.dimension);
        this.viewVector = new VectorClass(player.viewVector.x, player.viewVector.y, player.viewVector.z,);
        this.velocity = new VectorClass(player.velocity.x, player.velocity.y, player.velocity.z,);
        this.selectedSlot = player.selectedSlot;
        this.isSneaking = player.isSneaking;
    }
    public executeCommand(command: string) : ExecuteCommandI {
        try {
            const cmd = this._player.runCommand(command);
            return {
                statusMessage: cmd.statusMessage,
                command: command,
                error: "NULL"
            }
        } catch (err) {
            return {
                statusMessage: "ERROR",
                command: command,
                error: `${err}`
            }
        }
    }
    public addEffect(effectType: EffectType, duration: number, amplifier: number = 1, showParticles: boolean = true) : void {
        return this._player.addEffect(effectType, duration, amplifier, showParticles);
    }
    public sendMessage(message: string) : void {
        return this._player.runCommand(`tellraw "${this._player.name}" {"rawtext":[{"text":"${message}"}]}`);
    }
    public getEntitiesFromViewVector(options?: RaycastOptions) : EntityClass[] {
        if(!options) {
            return [...this._player.getEntitiesFromViewVector()].map(entity => new EntityClass(entity));
        } else {
            const raycastOptions: EntityRaycastOptions = new EntityRaycastOptions;
            raycastOptions.maxDistance = options.maxDistance;
            return [...this._player.getEntitiesFromViewVector(raycastOptions)].map(entity => new EntityClass(entity));
        }
    }
    public getBlockFromViewVector(options?: RaycastOptions) : BlockClass {
        if(!options) {
            return new BlockClass(this._player.getBlockFromViewVector());
        } else {
            const raycastOptions: BlockRaycastOptions = new BlockRaycastOptions();
            raycastOptions.maxDistance = options.maxDistance;
            if(options.includePassableBlocks)
                raycastOptions.includePassableBlocks = options.includePassableBlocks;
            if(options.includeLiquidBlocks)
                raycastOptions.includeLiquidBlocks = options.includeLiquidBlocks;
            return new BlockClass(this._player.getBlockFromViewVector(raycastOptions));
        }
    }
    public setNameTag(name: string) : string {
        return this._player.nameTag = name;
    }
    public setVelocity(velocity: VectorClass) {
        // Custom Set Velocity from Jayly
        let normalVelocity = velocity.getVectorData();
        normalVelocity = Vector.add(normalVelocity, new Vector(0, -1, 0));
        const health = this._player.getComponent("health") as EntityHealthComponent;

        const currentHp = health.current;
        this._player.addEffect(MinecraftEffectTypes.instantHealth, 0, 255);
      
        const explosion = new ExplosionOptions();
        explosion.breaksBlocks = false;

        this._player.setVelocity(normalVelocity);
        this._player.dimension.createExplosion(this._player.location, 0.001, explosion);
        this._player.runCommand("stopsound @s random.explode");
        
        health.setCurrent(currentHp);
    }
    public getScore(objective: string) : number {
        return world.scoreboard.getObjective(objective).getScore(this._player.scoreboard);
    }
    public getTags() : string[] {
        return this._player.getTags();
    }
    public addTag(tag: string) : boolean {
        return this._player.addTag(tag);
    }
    public removeTag(tag: string) : boolean {
        return this._player.removeTag(tag);
    }
    public hasTag(tag: string) : boolean {
        return this._player.hasTag(tag);
    }
    public getComponent(component: string) : IEntityComponent {
        return this._player.getComponent(component);
    }
    public hasComponent(component: string) : boolean {
        return this._player.hasComponent(component);
    }
    public kill() : void {
        return this._player.kill();
    }
    public getHealth() : EntityHealth {
        const health = this._player.getComponent("minecraft:health") as EntityHealthComponent;

        return new EntityHealth(health);
    }
    public getGamemode() : GameModeList {
        var testforName = new RegExp(`(?<=Found )${this._player.name}+(?=)`, "g");
        var survival = this.executeCommand(`testfor @a[name="${this._player.name}",m=s]`).statusMessage.match(testforName);
        var creative = this.executeCommand(`testfor @a[name="${this._player.name}",m=c]`).statusMessage.match(testforName);
        var adventure = this.executeCommand(`testfor @a[name="${this._player.name}",m=a]`).statusMessage.match(testforName);
        if(survival)
            return "survival";
        else if(creative)
            return "creative";
        else if(adventure)
            return "adventure";
    }
    public setGamemode(gamemode: GameModeList) : void {
        if(gamemode == "survival")
            this.executeCommand(`gamemode s "${this._player.name}"`);
        else if(gamemode == "creative")
            this.executeCommand(`gamemode c "${this._player.name}"`);
        else if(gamemode == "adventure")
            this.executeCommand(`gamemode a "${this._player.name}"`);
    }
    public getInventory() : EntityInventoryComponent {
        return this._player.getComponent("minecraft:inventory") as EntityInventoryComponent;
    }
    public addItem(item: ItemStackClass) : void {
        let inv = this._player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        inv.container.addItem(item.getItem());
    }
    public getItem(slot: number) : ItemStackClass {
        let inv = this._player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        let item = inv.container.getItem(slot);
        if(!item) return;
        
        let newItem = new ItemStack(Items.get(item.id), item.amount, item.data);
        newItem.nameTag = item.nameTag;
        newItem.getComponents = item.getComponents;
        newItem.setLore(item.getLore());
        newItem.getComponent("enchantments").enchantments = item.getComponent("enchantments").enchantments;
        let itemAsItemStackClass = new ItemStackClass(newItem);
        return itemAsItemStackClass;
    }
    public setItem(slot: number, item: ItemStackClass) : void {
        let inv = this._player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        inv.container.setItem(slot, item.getItem());
    }
    public isMoving() : boolean {
        return this._player.hasTag(`gametest:is_moving`);
    }
    public isSleeping() : boolean {
        return this._player.hasTag(`gametest:is_sleeping`);
    }
    public isJumping() : boolean {
        return this._player.hasTag(`gametest:is_jumping`);
    }
    public isOnFire() : boolean {
        return this._player.hasTag(`gametest:is_on_fire`);
    }
    public isSprinting() : boolean {
        return this._player.hasTag(`gametest:is_sprinting`);
    }
    public isSwimming() : boolean {
        return this._player.hasTag(`gametest:is_swimming`);
    }
    public isClicking() : boolean {
        return this._player.hasTag(`gametest:is_clicking`);
    }
    public getPlayerData() : Player {
        return this._player;
    }
}
export class Minecraft {
    public readonly world: WorldClass = new WorldClass();
    public readonly events: EventsClass = new EventsClass();
    public readonly commands: CustomCommand = new CustomCommand();
    public readonly enchantments: CustomEnchantment = new CustomEnchantment();
    public constructor() {}
    public getAllPlayers() : PlayerClass[] {
        return [...world.getPlayers()].map(player => new PlayerClass(player));
    }
    public getAllEntities(getEntities?: EntityQueryOptions) : EntityClass[] {
        if(getEntities) {
            return [...world.getDimension("overworld").getEntities(getEntities)].map(entities => new EntityClass(entities));
        } else {
            return [...world.getDimension("overworld").getEntities()].map(entities => new EntityClass(entities));
        }
    }
}

export const GametestAPI: Minecraft = new Minecraft();