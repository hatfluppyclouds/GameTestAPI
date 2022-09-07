import { Entity, Location, Player, Vector, IEntityComponent, EntityHealthComponent, EntityInventoryComponent, ItemStack, Block, BlockLocation, BlockPermutation, BlockType, IBlockProperty, EffectType, Dimension, ExplosionOptions, EntityQueryOptions } from "mojang-minecraft";
import { ActionFormData, ActionFormResponse, ModalFormData, ModalFormResponse } from "mojang-minecraft-ui";
import { EntityAttackEvent, EntityDamageEvent, BlockBrokenEvent, ItemInteractEvent, OnDeathEventSignal, ItemInteractOnEventSignal, EntityAttackEventSignal, BlockBrokenEventSignal, EntityDamageEventSignal, OnChatEventSignal, ProjectileEventSignal, ItemInteractEventSignal, OnTickSignal, PlayerJoinedEvent, OnEntityCreateEventSignal, OnItemReleaseEvent, OnItemReleaseEventSignal } from "./events/index.js";
export declare type DimensionList = "overworld" | "nether" | "theEnd";
export declare type GameModeList = "survival" | "creative" | "adventure";
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
export declare class EntityHealth {
    readonly max: number;
    readonly current: number;
    private data;
    constructor(data: EntityHealthComponent);
    setCurrent(value: number): void;
}
export declare class LocationClass {
    x: number;
    y: number;
    z: number;
    constructor(data: Location);
}
export declare class BlockLocationClass {
    x: number;
    y: number;
    z: number;
    constructor(blockLocation: BlockLocation);
}
export declare class VectorClass {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number);
    getVectorData(): Vector;
}
export declare class ItemStackClass {
    amount: number;
    data: number;
    readonly id: string;
    readonly nameTag: string;
    private item;
    constructor(item: ItemStack);
    setNameTag(name: string): string;
    getComponent(componentId: string): any;
    getComponents(): any[];
    hasComponent(componentId: string): boolean;
    getLore(): string[];
    setLore(lore: string[]): void;
    getItem(): ItemStack;
}
export declare class Database {
    constructor();
    create(options: DatabaseI): void;
    get(keys: string): string;
    has(keys: string): boolean;
    remove(keys: string): void;
}
export declare class CustomCommandCallBack {
    readonly sender: PlayerClass;
    args: string[];
    constructor(player: PlayerClass, argument: string[]);
}
export declare class CustomCommand {
    private prefix;
    private commandList;
    private privateCmdList;
    private privateErr;
    constructor();
    create(options: CustomCommandOptionI, callback: (data: CustomCommandCallBack) => void): void;
    getPrefix(): string;
    setPrefix(newPrefix: string): string;
    getAllCommands(): {
        name: string;
        description: string;
    };
    private defaultCommands;
    private errorCommands;
}
export declare class CustomEnchantmentType {
    readonly name: string;
    readonly description: string;
    readonly itemType: string[];
    readonly additionalLore: string;
    constructor(enchantment: {
        name: string;
        description: string;
        itemType: string[];
        additionalLore?: string;
    });
}
export declare class CustomEnchantment {
    private enchantmentList;
    constructor();
    onHit(options: CustomEnchantmentOptions, callback: (data: EntityAttackEvent) => void): CustomEnchantmentType;
    onDamage(options: CustomEnchantmentOptions, callback: (data: EntityDamageEvent) => void): CustomEnchantmentType;
    onBreak(options: CustomEnchantmentOptions, callback: (data: BlockBrokenEvent) => void): CustomEnchantmentType;
    onInteract(options: CustomEnchantmentOptions, callback: (data: ItemInteractEvent) => void): CustomEnchantmentType;
    onRelease(options: CustomEnchantmentOptions, callback: (data: OnItemReleaseEvent) => void): CustomEnchantmentType;
    getAllEnchantments(): {
        name: string[];
        item: string[];
    };
    addEnchantment(item: ItemStackClass, enchantment: CustomEnchantmentType): ItemStackClass;
    changeEnchantment(item: ItemStackClass, oldEnchantment: CustomEnchantmentType, newEnchantment: CustomEnchantmentType): ItemStackClass;
    hasEnchantment(item: ItemStackClass, enchantment: CustomEnchantmentType): boolean;
}
export declare class ActionFormDataUI {
    private ActionForm;
    constructor();
    title(name: string): ActionFormDataUI;
    body(bodyText: string): ActionFormDataUI;
    button(buttonText: string, iconPath?: string): ActionFormDataUI;
    show(player: PlayerClass): Promise<ActionFormResponse>;
    getActionData(): ActionFormData;
}
export declare class ModalFormDataUI {
    private ModalForm;
    constructor();
    title(name: string): ModalFormDataUI;
    dropdown(label: string, options: string[]): ModalFormDataUI;
    slider(label: string, minimumValue: number, maximumValue: number, valueStep: number): ModalFormDataUI;
    textField(label: string, placeHolder: string): ModalFormDataUI;
    toggle(label: string): ModalFormDataUI;
    show(player: PlayerClass): Promise<ModalFormResponse>;
    getModalData(): ModalFormData;
}
export declare class EventsClass {
    readonly onDeath: OnDeathEventSignal;
    readonly itemInteractOn: ItemInteractOnEventSignal;
    readonly entityAttack: EntityAttackEventSignal;
    readonly blockBreak: BlockBrokenEventSignal;
    readonly entityDamage: EntityDamageEventSignal;
    readonly onChat: OnChatEventSignal;
    readonly projectileHit: ProjectileEventSignal;
    readonly itemInteract: ItemInteractEventSignal;
    readonly ticks: OnTickSignal;
    readonly entityCreate: OnEntityCreateEventSignal;
    readonly itemRelease: OnItemReleaseEventSignal;
    constructor();
    playerJoined(callback: (data: PlayerJoinedEvent) => void): void;
    ready(callback: () => void): void;
}
export declare class DimensionClass {
    private _dimension;
    constructor(dimension: Dimension);
    spawnItem(item: ItemStackClass, location: BlockLocationClass): EntityClass;
    createExplosion(location: LocationClass, radius: number, explosion: ExplosionOptions): void;
    getBlock(location: BlockLocationClass): BlockClass;
    spawnEntity(identifier: string, location: LocationClass | BlockLocationClass): EntityClass;
}
export declare class WorldClass {
    constructor();
    executeCommand(command: string, dimension?: DimensionList): ExecuteCommandI;
    sendMessage(message: string): void;
    getDimension(dimensionId: string): DimensionClass;
}
export declare class BlockPermutationClass {
    private dataPermutation;
    readonly type: BlockType;
    constructor(data: BlockPermutation);
    getAllProperties(): IBlockProperty[];
    getProperty(propertyName: string): IBlockProperty;
    getTags(): string[];
    hasTag(tag: string): boolean;
    clone(): BlockPermutation;
}
export declare class BlockClass {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly location: BlockLocationClass;
    readonly isEmpty: boolean;
    readonly isWaterLogged: boolean;
    readonly permutation: BlockPermutationClass;
    readonly type: BlockType;
    private _block;
    constructor(block: Block);
    getComponent(componentId: string): any;
    getTags(): string[];
    hasTag(tag: string): boolean;
    beWaterLogged(): boolean;
    setPermutation(permutation: BlockPermutation): void;
    setType(type: BlockType): void;
    getBlockData(): Block;
}
export declare class EntityClass {
    readonly nameTag: string;
    readonly location: LocationClass;
    readonly viewVector: VectorClass;
    readonly velocity: VectorClass;
    readonly id: string;
    readonly dimension: DimensionClass;
    isSneaking: boolean;
    private _entity;
    constructor(entity: Entity);
    executeCommand(command: string): ExecuteCommandI;
    addEffect(effectType: EffectType, duration: number, amplifier?: number, showParticles?: boolean): void;
    getEntitiesFromViewVector(options?: RaycastOptions): EntityClass[];
    getBlockFromViewVector(options?: RaycastOptions): BlockClass;
    setNameTag(name: string): string;
    getScore(objective: string): number;
    setVelocity(velocity: VectorClass): void;
    getTags(): string[];
    addTag(tag: string): boolean;
    hasTag(tag: string): boolean;
    removeTag(tag: string): boolean;
    getComponent(component: string): IEntityComponent;
    hasComponent(component: string): boolean;
    kill(): void;
    getHealth(): EntityHealth;
    getEntityData(): Entity;
}
export declare class PlayerClass extends EntityClass {
    readonly nameTag: string;
    readonly name: string;
    readonly location: LocationClass;
    readonly viewVector: VectorClass;
    readonly velocity: VectorClass;
    readonly dimension: DimensionClass;
    selectedSlot: number;
    isSneaking: boolean;
    private _player;
    constructor(player: Player);
    executeCommand(command: string): ExecuteCommandI;
    addEffect(effectType: EffectType, duration: number, amplifier?: number, showParticles?: boolean): void;
    sendMessage(message: string): void;
    getEntitiesFromViewVector(options?: RaycastOptions): EntityClass[];
    getBlockFromViewVector(options?: RaycastOptions): BlockClass;
    setNameTag(name: string): string;
    setVelocity(velocity: VectorClass): void;
    getScore(objective: string): number;
    getTags(): string[];
    addTag(tag: string): boolean;
    removeTag(tag: string): boolean;
    hasTag(tag: string): boolean;
    getComponent(component: string): IEntityComponent;
    hasComponent(component: string): boolean;
    kill(): void;
    getHealth(): EntityHealth;
    getGamemode(): GameModeList;
    setGamemode(gamemode: GameModeList): void;
    getInventory(): EntityInventoryComponent;
    addItem(item: ItemStackClass): void;
    getItem(slot: number): ItemStackClass;
    setItem(slot: number, item: ItemStackClass): void;
    isMoving(): boolean;
    isSleeping(): boolean;
    isJumping(): boolean;
    isOnFire(): boolean;
    isSprinting(): boolean;
    isSwimming(): boolean;
    isClicking(): boolean;
    getPlayerData(): Player;
}
export declare class Minecraft {
    readonly world: WorldClass;
    readonly events: EventsClass;
    readonly commands: CustomCommand;
    readonly enchantments: CustomEnchantment;
    constructor();
    getAllPlayers(): PlayerClass[];
    getAllEntities(getEntities?: EntityQueryOptions): EntityClass[];
}
export declare const GametestAPI: Minecraft;
