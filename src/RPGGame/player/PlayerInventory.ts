import * as Util from "../core/Util"
import * as ENUM from "../data/enum"
import { ITEM } from "../data/enum"

import { items as ItemList } from "../../../res/item_new.json"
// import {  PlayerClientInterface, testSetting } from "../app"
import type { Player } from "./player"
import { ClientInputEventFormat, ServerGameEventFormat } from "../data/EventFormat"
import { PlayerComponent } from "./PlayerComponent"
import { ActiveItem, ItemData } from "../core/ActiveItem"
import { HPChange } from "../core/health"
import { AblityChangeEffect, EffectFactory } from "../StatusEffect"
import { ItemBuild } from "../core/ItemBuild"
import { EFFECT } from "../StatusEffect/enum"
import { SpecialEffect } from "../data/SpecialEffectRegistry"

class PlayerInventory implements PlayerComponent {
	// player:Player
	private activeItems: Map<ITEM, ActiveItem>
	private itemData:Map<ITEM,ItemData>
	private item: number[]
	itemSlots: number[]
	token: number
	life: number
	lifeBought: number
	money: number
	private player: Player

	static readonly indicateList = [
		ITEM.WARRIORS_SHIELDSWORD,
		ITEM.INVISIBILITY_CLOAK,
		ITEM.CARD_OF_DECEPTION,
		ITEM.GUARDIAN_ANGEL,
		ITEM.POWER_OF_MOTHER_NATURE,
		ITEM.TIME_WARP_POTION
	]
	constructor(player: Player, money: number) {
		this.player = player
		this.token = 2
		this.money = money
		this.life = 0
		this.lifeBought = 0
		this.activeItems = new Map<ITEM, ActiveItem>()
		this.itemData=new Map<ITEM,ItemData>()
		this.item = Util.makeArrayOf(0, ItemList.length)
		this.itemSlots = Util.makeArrayOf(-1, player.game.itemLimit) //보유중인 아이템만 저장(클라이언트 전송용)
	}
	onDeath: () => void
	onTurnStart() {
		if (this.haveItem(ITEM.TRINITY_FORCE) && this.itemData.has(ITEM.TRINITY_FORCE)) {
			const stacks=this.itemData.get(ITEM.TRINITY_FORCE)?.getDataValue("stack")
			console.log(stacks)
			if(!stacks) return
			if(stacks>=2){
				this.itemData.get(ITEM.TRINITY_FORCE)?.resetDataValue("stack")
				this.player.effects.updateSpecialEffectData(EFFECT.ITEM_TRINITY_FORCE, [0])
				this.player.effects.applySpecial(EffectFactory.create(EFFECT.ITEM_ABILITY_TRINITY_FORCE)
				,SpecialEffect.ITEM.TRINITY_FORCE_ABILITY.name)
				this.player.game.eventEmitter.indicateItem(this.player.turn, ITEM.TRINITY_FORCE)
			}
		}
	}
	transfer(func: Function, ...args: any[]) {
		this.player.mediator.sendToClient(func, ...args)
	}

	onTurnEnd() {
		if (this.haveItem(ITEM.TRINITY_FORCE) && this.itemData.has(ITEM.TRINITY_FORCE)) {
			const stacks=this.itemData.get(ITEM.TRINITY_FORCE)?.getDataValue("stack")
			if(!stacks) return
			this.player.effects.updateSpecialEffectData(EFFECT.ITEM_TRINITY_FORCE, [stacks])
		}

		this.activeItems.forEach((i) => i.cooldown())
		this.sendActiveItemStatus()

		// if (this.haveItem(9)) {
		// 	this.player.changeHP_heal(new HPChange(Math.floor(this.player.ability.extraHP * 0.15)))
		// }
	}
	moveByDice(distance: number) {
		if(distance<=0) return
		if (this.haveItem(ITEM.FLAIL_OF_JUDGEMENT) && this.itemData.has(ITEM.FLAIL_OF_JUDGEMENT)) {
			this.itemData.get(ITEM.FLAIL_OF_JUDGEMENT)?.addDataValue("charge", distance)

			let charge = this.itemData.get(ITEM.FLAIL_OF_JUDGEMENT)?.getDataValue("charge")
			if(!charge) return
			let range=Math.floor(charge / 6)
			this.player.effects.applySpecial(new AblityChangeEffect(EFFECT.ITEM_FLAIL_OF_JUDGEMENT_RANGE,4,
				new Map().set("attackRange",range)))
			this.player.effects.updateSpecialEffectData(EFFECT.ITEM_FLAIL_OF_JUDGEMENT, [
				charge,
				charge * 6,
				range,
			])
		}
		if (this.haveItem(ITEM.STAFF_OF_JUDGEMENT) && this.itemData.has(ITEM.STAFF_OF_JUDGEMENT)) {
			this.itemData.get(ITEM.STAFF_OF_JUDGEMENT)?.addDataValue("charge", distance)
			let charge = this.itemData.get(ITEM.STAFF_OF_JUDGEMENT)?.getDataValue("charge")
			if(!charge) return
			this.player.effects.updateSpecialEffectData(EFFECT.ITEM_STAFF_OF_JUDGEMENT, [charge, charge * 10])
		}
		if (this.haveItem(ITEM.DAGGER) && this.itemData.has(ITEM.DAGGER)) {
			this.itemData.get(ITEM.DAGGER)?.addDataValue("charge", distance)
			let charge = this.itemData.get(ITEM.DAGGER)?.getDataValue("charge")
			if(!charge) return
			this.player.effects.updateSpecialEffectData(EFFECT.ITEM_DAGGER, [charge, charge * 3])
		}
	}
	/**
	 *
	 * @param {*} m
	 * @param {*} type 0: 돈 받음  1:돈 소모 2:돈 뺏김
	 */
	changemoney(m: number, type: number) {
		//사채
		if (type === ENUM.CHANGE_MONEY_TYPE.EARN && this.player.effects.has(EFFECT.PRIVATE_LOAN)) {
			return
		}
		if (m === 0) {
			return
		}
		this.money += m

		switch (type) {
			case ENUM.CHANGE_MONEY_TYPE.EARN: //money earned
				this.player.statistics.add(ENUM.STAT.MONEY_EARNED, m)
				this.player.game.eventEmitter.changeMoney(this.player.turn, m, this.money)
				break
			case ENUM.CHANGE_MONEY_TYPE.EVERY_TURN: //money earned
				this.player.statistics.add(ENUM.STAT.MONEY_EARNED, m)
				this.player.game.eventEmitter.changeMoney(this.player.turn, 0, this.money)
				break
			case ENUM.CHANGE_MONEY_TYPE.SPEND: //money spend
				this.player.statistics.add(ENUM.STAT.MONEY_SPENT, -m)
				this.player.game.eventEmitter.changeMoney(this.player.turn, 0, this.money)
				//0일 경우 indicator 는 표시안됨

				break
			case ENUM.CHANGE_MONEY_TYPE.TAKEN: //money taken
				this.player.statistics.add(ENUM.STAT.MONEY_TAKEN, -m)
				this.player.game.eventEmitter.changeMoney(this.player.turn, m, this.money)
				break
		}
	}
	//========================================================================================================

	changeToken(token: number) {
		this.token += token
		this.player.game.eventEmitter.update("token", this.player.turn, this.token)
	}
	sellToken(token: number, moneyspent: number) {
		this.changeToken(-1 * token)
		this.giveMoney(moneyspent)
		this.player.sendConsoleMessage(this.player.name + " sold token, obtained " + moneyspent + "$!")
	}
	//========================================================================================================

	changeLife(life: number) {
		this.life = Math.max(this.life + life, 0)
		this.player.game.eventEmitter.update("life", this.player.turn, this.life)
	}

	giveTurnMoney(m: number) {
		this.changemoney(m, ENUM.CHANGE_MONEY_TYPE.EVERY_TURN)
	}

	giveMoney(m: number) {
		this.changemoney(m, ENUM.CHANGE_MONEY_TYPE.EARN)
	}
	//========================================================================================================

	takeMoney(m: number) {
		this.changemoney(-1 * m, ENUM.CHANGE_MONEY_TYPE.TAKEN)
	}

	haveItem(item: ITEM): boolean {
		return this.item[item] > 0
	}

	addActiveItem(itemData: ActiveItem) {
		this.activeItems.set(itemData.id, itemData)
		this.sendActiveItemStatus()
		//console.log("buy active item" + itemdata)
	}

	onKillEnemy() {
		if (this.isActiveItemAvailable(ITEM.TIME_WARP_POTION) && this.player.ability.AP.get() >= 200) {
			//	console.log("------------time warp potion")
			this.useActiveItem(ITEM.TIME_WARP_POTION)
			this.player.skillManager.resetCooltime([ENUM.SKILL.Q, ENUM.SKILL.W])
		}
	}
	/**
	 * 한번이라도 산적있으면 true
	 * @param {}item_id id of item
	 * @returns
	 */
	boughtActiveItem(item_id: ITEM) {
		return this.activeItems.has(item_id)
	}

	/**
	 * 한번이라도 산적있고 지금 아이템 가지고있고 쿨타임 돌아왔으면 true
	 * @param {} item_id id of item
	 * @returns
	 */
	isActiveItemAvailable(item_id: ITEM) {
		//console.log(this.item + "avaliable" + this.activeItems)
		if (!this.haveItem(item_id)) return false
		return this.activeItems.has(item_id) && this.activeItems.get(item_id)?.cooltime === 0
	}

	/**
	 * 아이템 사용
	 * @param {} item_id id of item
	 * @returns
	 */
	useActiveItem(item_id: ITEM) {
		if (this.isActiveItemAvailable(item_id)) {
			this.activeItems.get(item_id)?.use()

			if (PlayerInventory.indicateList.includes(item_id)) {
				this.player.game.eventEmitter.indicateItem(this.player.turn, item_id)
				this.sendActiveItemStatus()
			}



			if (item_id === ITEM.FLAIL_OF_JUDGEMENT){
				this.itemData.get(item_id)?.resetDataValue("charge")
				this.player.effects.updateSpecialEffectData(EFFECT.ITEM_FLAIL_OF_JUDGEMENT,[0,0,0])
				this.player.effects.reset(EFFECT.ITEM_FLAIL_OF_JUDGEMENT_RANGE)
			}
			if (item_id === ITEM.STAFF_OF_JUDGEMENT){
				this.itemData.get(item_id)?.resetDataValue("charge")
				this.player.effects.updateSpecialEffectData(EFFECT.ITEM_STAFF_OF_JUDGEMENT,[0,0])
			}
			if (item_id === ITEM.DAGGER){
				this.itemData.get(item_id)?.resetDataValue("charge")
				this.player.effects.updateSpecialEffectData(EFFECT.ITEM_DAGGER,[0,0])
			}
		}
	}

	sendActiveItemStatus() {
		let data: { id: number; cool: number; coolRatio: number }[] = []
		for (const [id, item] of this.activeItems.entries()) {
			if (PlayerInventory.indicateList.includes(id) && this.haveItem(id)) {
				data.push(item.selialize())
			}
		}
		//	console.log(data)
		this.player.game.eventEmitter.update("activeItem", this.player.turn, data)
		let itemdata:{
			kor: string;
			eng: string;
			item: number;
		}[]=[]
		for(const itemData of this.itemData.values()){
			let d=itemData.serialize()
			if(!!d && ItemList[d.item].itemlevel >= 3 && this.haveItem(d.item))
				itemdata.push(d)
		}
		this.player.game.eventEmitter.update("itemData", this.player.turn, itemdata)
	}
	getActiveItemData(item_id: ITEM, key: string) {
		if (!this.itemData.has(item_id)) return 0
		return this.itemData.get(item_id)?.getDataValue(key)
	}
	addActiveItemData(item_id: ITEM, key: string, val: number) {
		if (this.itemData.has(item_id)) this.itemData.get(item_id)?.addDataValue(key, val)
	}
	resetActiveItemData(item_id: ITEM, key: string) {
		if (this.itemData.has(item_id)) this.itemData.get(item_id)?.resetDataValue(key)
	}
	getStoreData(priceMultiplier: number): ServerGameEventFormat.EnterStore {
		return {
			item: this.itemSlots,
			money: this.money,
			token: this.token,
			life: this.life,
			lifeBought: this.lifeBought,
			recommendeditem: this.player.AiAgent.itemBuild.getRecommendedItems(),
			itemLimit: this.player.game.itemLimit,
			priceMultiplier: priceMultiplier,
		}
	}

	convertCountToItemSlots(items: number[]): number[] {
		let itemslot = Util.makeArrayOf(-1, this.player.game.itemLimit)
		let index = 0
		for (let i = 0; i < items.length; ++i) {
			for (let j = 0; j < items[i]; ++j) {
				itemslot[index] = i
				index += 1
			}
		}
		return itemslot
	}

	convertItemSlotsToCount(itemslots: number[]): number[] {
		let items = Util.makeArrayOf(0, ItemList.length)
		for (let item of itemslots) {
			items[item] += 1
		}
		return items
	}
	changeOneItem(item: number, count: number) {
		this.item[item] += count

		let maxHpChange = 0
		if (count > 0) {
			if (ItemList[item].itemlevel >= 3) {
				//	this.message(this.name + " bought " + count + " " + ItemList[item].name)
			}

			this.player.statistics.addItemRecord({
				item_id: item,
				count: count,
				turn: this.player.game.totalturn,
			})
		}
		for (let j = 0; j < ItemList[item].ability.length; ++j) {
			let ability = ItemList[item].ability[j]
			let change_amt = ability.value * count
			this.player.ability.update(ability.type, change_amt)
		}

		if (!this.boughtActiveItem(item)) {
			let cool = ItemList[item].active_cooltime
			if (cool !== undefined) this.addActiveItem(new ActiveItem(ItemList[item].name, item, cool))
		}
		if(!this.itemData.has(item) && count>0) 
			this.itemData.set(item,new ItemData(item))

		if (this.item[item] <= 0 && count < 0) {
		
			this.player.effects.onRemoveItem(item)
			if (PlayerInventory.indicateList.includes(item)) this.sendActiveItemStatus()
		} else if (this.item[item] > 0 && this.item[item] - count <= 0) {
			this.player.effects.onAddItem(item)
		}
	}
	/**
	 *data: 아이템 슬롯
	 * @param {*} data {
	 * storedata:{item:int[]}
	 * moneyspend:int
	 * }
	 */
	playerBuyItem(data: ClientInputEventFormat.ItemBought) {
		//	console.log("updateitem " + data.item)
		//	console.log("updatetoken " + data.token)
		this.changemoney(-1 * data.moneyspend, ENUM.CHANGE_MONEY_TYPE.SPEND)
		this.changeToken(data.tokenbought)
		this.changeLife(data.life)
		this.lifeBought += data.life

		let newitemlist = this.convertItemSlotsToCount(data.item)
		this.itemSlots = data.item

		for (let i = 0; i < ItemList.length; ++i) {
			let diff = newitemlist[i] - this.item[i]

			if (diff === 0) {
				continue
			}
			this.changeOneItem(i, diff)

			if(ItemList[i].itemlevel==3) 
				this.player.AiAgent.itemBuild.onBuyCoreItem(i)
		}
		this.player.ability.flushChange()
		//	this.item = data.storedata.item
		this.player.game.eventEmitter.update("item", this.player.turn, this.sortedItemSlot())
	}
	thief() {
		let itemhave = []
		for (let i of ItemList) {
			if (this.haveItem(i.id) && i.itemlevel === 1) {
				itemhave.push(i.id)
			}
		}
		if (itemhave.length === 0) {
			return
		}
		let thiefitem = Util.pickRandom(itemhave)

		this.player.sendConsoleMessage(this.player.name + "`s` " + ItemList[thiefitem].name + " got stolen!")
		this.changeOneItem(thiefitem, -1)
		this.itemSlots = this.convertCountToItemSlots(this.item)
		this.player.game.eventEmitter.update("item", this.player.turn, this.sortedItemSlot())
		this.player.ability.flushChange()
	}
	/**
	 *data: 아이템 각각의 갯수
	 * @param {*} data {
	 * storedata:{item:int[]}
	 * moneyspend:int
	 * }
	 */
	aiUpdateItem(slots: number[], moneyspend: number) {
		// console.log("changemoney"+moneyspend)
		this.changemoney(-1 * moneyspend, ENUM.CHANGE_MONEY_TYPE.SPEND)
		// this.inven.changeToken(data.tokenbought)
		// this.inven.changeLife(data.life)
		// this.inven.lifeBought += data.life
		let item = this.convertItemSlotsToCount(slots)

		for (let i = 0; i < ItemList.length; ++i) {
			let diff = item[i] - this.item[i]

			if (diff === 0) {
				continue
			}
			this.changeOneItem(i, diff)
		}
		// this.itemSlots = this.convertCountToItemSlots(this.item)
		this.itemSlots = slots
		this.player.ability.flushChange()
		this.player.game.eventEmitter.update("item", this.player.turn, this.sortedItemSlot())
	}
	/**
	 * 빈칸만 맨 뒤로 정렬
	 * @returns
	 */
	sortedItemSlot() {
		return this.itemSlots.sort((a, b) => -(a + 1))
	}
	/**
	 * 첫번째 상점에선 2등급이상아이템 구입불가
	 * @param {} item
	 */
	checkStoreLevel(item: any) {
		if (this.player.level <= 2 && item.itemlevel >= 2) {
			return false
		}
		return true
	}
	getItemBuildUtility():Util.AbilityUtilityScorecard{
		let utility={
			attack:0,magic:0,defence:0,health:0,myutilRatio:0
		}
		for(const item of this.itemSlots){
			if(item===-1) continue
			let cat=ItemList[item].category
			let weight=(ItemList[item].itemlevel**3)/ cat.length
			for(const c of cat){
				if(c==="attack") utility.attack+=weight
				if(c==="magic") utility.magic+=weight
				if(c==="defence"){
					utility.defence+=weight
					utility.health+=weight/1.5
				} 
				if(c==="health") utility.health+=weight
			}
		}
		return utility
	}

	static getItemName(item: ITEM): string {
		return ItemList[item].name
	}
}
export default PlayerInventory
