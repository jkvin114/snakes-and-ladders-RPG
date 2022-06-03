import * as Util from "../core/Util"
import * as ENUM from "../data/enum"
import { ITEM } from "../data/enum"

import { items as ItemList } from "../../res/item.json"
import {  PlayerClientInterface, testSetting } from "../app"
import type { Player } from "./player"
import { ClientPayloadInterface, ServerPayloadInterface } from "../data/PayloadInterface"

class PlayerInventory {
	// player:Player
	activeItems: Util.ActiveItem[]
	item: number[]
	itemSlots: number[]
	token: number
	life: number
	lifeBought: number
	money: number
	player: Player

	static readonly indicateList = [
		ITEM.WARRIORS_SHIELDSWORD,
		ITEM.INVISIBILITY_CLOAK,
		ITEM.CARD_OF_DECEPTION,
		ITEM.GUARDIAN_ANGEL,
		ITEM.POWER_OF_MOTHER_NATURE,
		ITEM.TIME_WARP_POTION
	]
	constructor(player: Player) {
		this.player = player

		this.token = 2
		this.money = testSetting.money
		this.life = 0
		this.lifeBought = 0
		this.activeItems = []
		this.item = Util.makeArrayOf(0, ItemList.length)

		this.itemSlots = Util.makeArrayOf(-1, player.game.itemLimit) //보유중인 아이템만 저장(클라이언트 전송용)
	}
	transfer(func: Function, ...args: any[]) {
		this.player.mediator.sendToClient(func, ...args)
	}

	onTurnEnd() {
		this.activeItemCoolDown()
		if (this.haveItem(9)) {
			this.player.changeHP_heal(new Util.HPChangeData().setHpChange(Math.floor(this.player.ability.extraHP * 0.15)))
		}
	}

	/**
	 *
	 * @param {*} m
	 * @param {*} type 0: 돈 받음  1:돈 소모 2:돈 뺏김
	 */
	changemoney(m: number, type: number) {
		//사채
		if (type === ENUM.CHANGE_MONEY_TYPE.EARN && this.player.effects.has(ENUM.EFFECT.PRIVATE_LOAN)) {
			return
		}
		if (m === 0) {
			return
		}
		this.money += m

		switch (type) {
			case ENUM.CHANGE_MONEY_TYPE.EARN: //money earned
				this.player.statistics.add(ENUM.STAT.MONEY_EARNED, m)
				this.transfer(PlayerClientInterface.changeMoney, this.player.turn, m, this.money)
				break
			case ENUM.CHANGE_MONEY_TYPE.EVERY_TURN: //money earned
				this.player.statistics.add(ENUM.STAT.MONEY_EARNED, m)
				this.transfer(PlayerClientInterface.changeMoney, this.player.turn, 0, this.money)
				break
			case ENUM.CHANGE_MONEY_TYPE.SPEND: //money spend
				this.player.statistics.add(ENUM.STAT.MONEY_SPENT, -m)
				this.transfer(PlayerClientInterface.changeMoney, this.player.turn, 0, this.money)
				//0일 경우 indicator 는 표시안됨

				break
			case ENUM.CHANGE_MONEY_TYPE.TAKEN: //money taken
				this.player.statistics.add(ENUM.STAT.MONEY_TAKEN, -m)
				this.transfer(PlayerClientInterface.changeMoney, this.player.turn, m, this.money)
				break
		}
	}
	//========================================================================================================

	changeToken(token: number) {
		this.token += token
		this.transfer(PlayerClientInterface.update, "token", this.player.turn, this.token)
	}
	sellToken(token:number,moneyspent:number) {
		this.changeToken(-1 * token)
		this.giveMoney(moneyspent)
		this.player.message(this.player.name + " sold token, obtained " + moneyspent + "$!")
	}
	//========================================================================================================

	changeLife(life: number) {
		this.life = Math.max(this.life + life, 0)
		this.transfer(PlayerClientInterface.update, "life", this.player.turn, this.life)
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

	addActiveItem(itemData: Util.ActiveItem) {
		this.activeItems.push(itemData)
		this.sendActiveItemStatus()
		//console.log("buy active item" + itemdata)
	}

	onKillEnemy(){
		if(this.isActiveItemAvailable(ITEM.TIME_WARP_POTION) && this.player.ability.AP.get()>=200){
			console.log("------------time warp potion")
			this.useActiveItem(ITEM.TIME_WARP_POTION)
			this.player.resetCooltime([ENUM.SKILL.Q,ENUM.SKILL.W])
		}
	}
	/**
	 * 한번이라도 산적있으면 true
	 * @param {}item_id id of item
	 * @returns
	 */
	boughtActiveItem(item_id: ITEM) {
		return this.activeItems.some((i: Util.ActiveItem) => i.id === item_id)
	}

	activeItemCoolDown() {
		this.activeItems.forEach((i) => i.cooldown())
		this.sendActiveItemStatus()
	}

	/**
	 * 한번이라도 산적있고 지금 아이템 가지고있고 쿨타임 돌아왔으면 true
	 * @param {} item_id id of item
	 * @returns
	 */
	isActiveItemAvailable(item_id: ITEM) {
		//console.log(this.item + "avaliable" + this.activeItems)
		if (!this.haveItem(item_id)) return false

		return this.activeItems.some((it) => it.id === item_id && it.cooltime === 0)
	}

	/**
	 * 아이템 사용
	 * @param {} item_id id of item
	 * @returns
	 */
	useActiveItem(item_id: ITEM) {
		if (this.isActiveItemAvailable(item_id)) {
			this.activeItems.filter((ef: Util.ActiveItem) => ef.id === item_id)[0].use()

			if (PlayerInventory.indicateList.includes(item_id)) {
				this.transfer(PlayerClientInterface.indicateItem, this.player.turn, item_id)
				this.sendActiveItemStatus()
			}
		}
	}

	sendActiveItemStatus() {
		let data: { id: number; cool: number; coolRatio: number }[] = this.activeItems
			.filter((ef: Util.ActiveItem) => PlayerInventory.indicateList.includes(ef.id) && this.haveItem(ef.id))
			.map((item) => {
				return { id: item.id, cool: item.cooltime, coolRatio: 1 - item.cooltime / item.resetVal }
			})
			console.log(data)
		this.transfer(PlayerClientInterface.update, "activeItem", this.player.turn, data)
	}
	getStoreData(priceMultiplier: number):ServerPayloadInterface.EnterStore {
		return {
			item: this.itemSlots,
			money: this.money,
			token: this.token,
			life: this.life,
			lifeBought: this.lifeBought,
			recommendeditem: this.player.AiAgent.itemtree.items,
			itemLimit: this.player.game.itemLimit,
			priceMultiplier: priceMultiplier
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
				turn: this.player.game.totalturn
			})
		}
		for (let j = 0; j < ItemList[item].ability.length; ++j) {
			let ability = ItemList[item].ability[j]
			let change_amt = ability.value * count
			this.player.ability.update(ability.type, change_amt)
		}
		

		if (ItemList[item].active_cooltime != null && !this.boughtActiveItem(item)) {
			this.addActiveItem(new Util.ActiveItem(ItemList[item].name, item, ItemList[item].active_cooltime))
		}

		if (this.item[item] <= 0 && this.item[item] - count > 0) {
			this.player.effects.onRemoveItem(item)
			if(PlayerInventory.indicateList.includes(item))
				this.sendActiveItemStatus()

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
	playerBuyItem(data: ClientPayloadInterface.ItemBought) {
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
		}
		this.player.ability.flushChange()
		//	this.item = data.storedata.item
		this.transfer(PlayerClientInterface.update, "item", this.player.turn, this.itemSlots)
	}
	thief(){
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

		this.player.message(this.player.name + "`s` " + ItemList[thiefitem].name + " got stolen!")
		this.player.inven.changeOneItem(thiefitem, -1)
		this.player.inven.itemSlots = this.player.inven.convertCountToItemSlots(this.player.inven.item)
		this.player.transfer(PlayerClientInterface.update, "item", this.player.turn, this.player.inven.itemSlots)
		this.player.ability.flushChange()
	}
	/**
	 *data: 아이템 각각의 갯수
	 * @param {*} data {
	 * storedata:{item:int[]}
	 * moneyspend:int
	 * }
	 */
	aiUpdateItem(item: number[], moneyspend: number) {
		this.changemoney(-1 * moneyspend, ENUM.CHANGE_MONEY_TYPE.SPEND)
		// this.inven.changeToken(data.tokenbought)
		// this.inven.changeLife(data.life)
		// this.inven.lifeBought += data.life

		for (let i = 0; i < ItemList.length; ++i) {
			let diff = item[i] - this.item[i]

			if (diff === 0) {
				continue
			}
			this.changeOneItem(i, diff)
		}
		this.itemSlots = this.convertCountToItemSlots(this.item)
		this.player.ability.flushChange()
		this.transfer(PlayerClientInterface.update, "item", this.player.turn, this.itemSlots)
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

	static getItemName(item: ITEM): string {
		return ItemList[item].name
	}
}
export default PlayerInventory
