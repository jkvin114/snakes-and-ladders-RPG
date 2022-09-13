import { CHANGE_MONEY_TYPE, EFFECT, INIT_SKILL_RESULT, ITEM, SKILL } from "../data/enum"
import { MAP } from "../MapHandlers/MapStorage"
import { ServerGameEventInterface } from "../data/PayloadInterface"
import { copyElementsOnly, pickRandom, ListSet, shuffle, SkillTargetSelector, sleep, Stack } from "../core/Util"
import { items as ItemList } from "../../res/item.json"
import PlayerInventory from "../player/PlayerInventory"
import {trajectorySpeedRatio} from "../../res/globalsettings.json"
import { EntityMediator } from "../entity/EntityMediator"
import { Player } from "../player/player"
import { EntityFilter } from "../entity/EntityFilter"
import SETTINGS = require("./../../res/globalsettings.json")
import TRAIN_SETTINGS = require("./../../res/train_setting.json")

const CORE_ITEMS=ItemList.filter((i)=>i.itemlevel===3).map((i)=>i.id)
const ITEMS=ItemList

abstract class AiAgent {
	player: Player
	attemptedSkills: Set<SKILL>
	isRandomItem:boolean
	abstract itemtree: {
		level: number
		items: number[]
		final: number
	}
	static readonly BASICATTACK = 4
	constructor(player: Player) {
		this.player = player
		this.isRandomItem=TRAIN_SETTINGS.train && TRAIN_SETTINGS.random_item
		this.attemptedSkills = new Set<SKILL>()
	}
	onAfterCreate(){
		if(this.isRandomItem){
			if(TRAIN_SETTINGS.random_item_exclude_character.includes(this.player.champ)) 
				return

			let randTree=shuffle(CORE_ITEMS)

		//	this.itemtree.items=randTree
		}
	}
	static simulationAiSkill(player:Player){
		player.AiAgent.attemptedSkills.clear()
		if (player.game.gameover || !(player.canUseSkill() || player.canBasicAttack())) {
			return
		}
		for (let i = 0; i < 5; ++i) {
			let skill = player.AiAgent.nextSkill()
		//	console.log("aiskill "+skill)
			if (skill < 0) break
			if (skill === AiAgent.BASICATTACK) {
				player.basicAttack()
				continue
			}
			player.AiAgent.attemptedSkills.add(skill)

			let skillinit = player.initSkill(skill)
		//	console.log(skillinit)
			if (skillinit.type === INIT_SKILL_RESULT.NOT_LEARNED || skillinit.type === INIT_SKILL_RESULT.NO_COOL) {
				continue
			}

			let result = false
			switch (skillinit.type) {
				case INIT_SKILL_RESULT.NON_TARGET:
					result = player.AiAgent.useNonTargetSkill(skill)
					break
				case INIT_SKILL_RESULT.ACTIVATION:
					result = player.AiAgent.useActivationSkill(skill)
					break
				case INIT_SKILL_RESULT.TARGTING:
					if (skillinit.data.kind !== "target" || skillinit.data.targets.length <= 0) break
					let target = player.AiAgent.selectTarget(skillinit.skill, skillinit.data)
					if(!target) break

					player.game.useSkillToTarget(target.turn)
					result = true
					break
				case INIT_SKILL_RESULT.PROJECTILE:
					if (skillinit.data.kind !== "location") break
					let projpos = player.AiAgent.getProjectilePos(skillinit.skill, skillinit.data)
					if (projpos < 0) break
					player.game.placeSkillProjectile(projpos)
					result = true
					break
				case INIT_SKILL_RESULT.AREA_TARGET:
					if (skillinit.data.kind !== "location") break
					let areapos = player.AiAgent.getAreaPos(skillinit.skill, skillinit.data)
					if (areapos < 0) break
					player.game.useAreaSkill(areapos)
					result = true
					break
			}

			if (!result) continue

		}
	}
	static async aiSkill(player: Player, callback: Function) {
		player.AiAgent.attemptedSkills.clear()
		//await sleep(ONE_SKILL_DELAY)
		if (player.game.gameover || !(player.canUseSkill() || player.canBasicAttack())) {
			callback()
			return
		}
		for (let i = 0; i < 5; ++i) {
			let skill = player.AiAgent.nextSkill()
			
			if (skill < 0) break
			if (skill ===  AiAgent.BASICATTACK) {
				player.basicAttack()
				await sleep(SETTINGS.delay_per_ai_skill/2)
				continue
			}
			else if(!player.canUseSkill()){
				continue
			}
			player.AiAgent.attemptedSkills.add(skill)
			//console.log(player.AiAgent.attemptedSkills)
			let skillinit = player.initSkill(skill)
		//	console.log(skillinit)
			if (skillinit.type === INIT_SKILL_RESULT.NOT_LEARNED || skillinit.type === INIT_SKILL_RESULT.NO_COOL) {
				continue
			}
			let delay = player.getSkillTrajectorySpeed(player.getSkillName(skill))

			let result = false
			switch (skillinit.type) {
				case INIT_SKILL_RESULT.NON_TARGET:
					result = player.AiAgent.useNonTargetSkill(skill)

					break
				case INIT_SKILL_RESULT.ACTIVATION:
					result = player.AiAgent.useActivationSkill(skill)
					break
				case INIT_SKILL_RESULT.TARGTING:
					if (skillinit.data.kind !== "target" || skillinit.data.targets.length <= 0) break
					let target = player.AiAgent.selectTarget(skillinit.skill, skillinit.data)
					if(!target) break

					player.game.useSkillToTarget(target.turn)
					if (delay > 0) {
						delay = (MAP.getCoordinateDistance(player.mapId, player.pos, target.pos) * delay) / trajectorySpeedRatio
						await sleep(delay)
					}
					result = true
					break
				case INIT_SKILL_RESULT.PROJECTILE:
					if (skillinit.data.kind !== "location") break
					let projpos = player.AiAgent.getProjectilePos(skillinit.skill, skillinit.data)
					if (projpos < 0) break
					player.game.placeSkillProjectile(projpos)
					result = true
					break
				case INIT_SKILL_RESULT.AREA_TARGET:
					if (skillinit.data.kind !== "location") break
					let areapos = player.AiAgent.getAreaPos(skillinit.skill, skillinit.data)
					if (areapos < 0) break
					player.game.useAreaSkill(areapos)
					result = true
					break
			}

			if (!result) continue

			await sleep(SETTINGS.delay_per_ai_skill)
		}
		callback()
	}
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			return SKILL.Q
		}
		return -1
	}
	useNonTargetSkill(skill: SKILL): boolean {
		return this.player.useNonTargetSkill(skill)
	}
	useActivationSkill(skill: SKILL): boolean {
		this.player.useActivationSkill(skill)
		return true
	}

	selectTarget(skill: SKILL, targets: ServerGameEventInterface.PlayerTargetSelector): Player {
		let players = targets.targets
		if (players.length === 1) {
			return this.player.game.pOfTurn(players[0])
		}
		let ps = this.player.mediator.allPlayer()
		players.sort(function (b, a) {
			if (Math.abs(ps[a].pos - ps[b].pos) < 8) {
				return ps[b].HP - ps[a].HP
			} else {
				return ps[a].pos - ps[b].pos
			}
		})
		return ps[players[0]]
	}
	getProjectilePos(skill: SKILL, selector: ServerGameEventInterface.LocationTargetSelector): number {
		let me = this.player
		let goal = null
		let targets = me.mediator
			.selectAllFrom(
				EntityFilter.ALL_ENEMY_PLAYER(this.player).in(
					me.pos - 3 - Math.floor(selector.range / 2),
					me.pos - 3 + Math.floor(selector.range / 2)
				)
			)
			.map((p:Player) => p.turn)

		//	console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		if (targets.length === 1) {
			//타겟이 1명일경우
			goal = targets[0]
			//속박걸렸으면 플레이어 위치 그대로
			if (!me.game.pOfTurn(goal).canThrowDice()) {
				return Math.floor(me.game.pOfTurn(goal).pos)
			}
		} else {
			//타겟이 여러명일경우
			let ps = me.mediator.allPlayer()

			//앞에있는플레이어 우선
			targets.sort(function (b: number, a: number): number {
				return ps[a].pos - ps[b].pos
			})

			//속박걸린 플레이어있으면 그 플레이어 위치 그대로
			for (let t of targets) {
				if (!ps[t].canThrowDice()) {
					return Math.floor(ps[t].pos)
				}
			}

			goal = targets[0]
		}
		return Math.floor(Math.min(me.game.pOfTurn(goal).pos + 7 - selector.size, me.pos + selector.range / 2))
	}
	getAreaPos(skill: SKILL, selector: ServerGameEventInterface.LocationTargetSelector): number {
		let me = this.player

		let goal = null
		let targets = me.mediator
			.selectAllFrom(
				EntityFilter.ALL_ATTACKABLE_PLAYER(me)
					.in(me.pos - 3 - Math.floor(selector.range / 2), me.pos - 3 + Math.floor(selector.range / 2))
			)
			.map((p:Player) => p.turn)

		//	console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		if (targets.length === 1) {
			//타겟이 1명일경우
			goal = targets[0]
			return Math.floor(me.game.pOfTurn(goal).pos - selector.size + 1)
		} else {
			//타겟이 여러명일경우
			let ps = me.mediator.allPlayer()

			//앞에있는플레이어 우선
			targets.sort(function (b: number, a: number): number {
				return ps[b].pos - ps[a].pos
			})

			return Math.floor(ps[0].pos - selector.size + 1)
		}
	}
	willDiceControl() {
		return this.player.diceControl && this.player.level < MAP.get(this.player.mapId).dc_limit_level
	}

	getDiceControlDice() {
		return 6
	}
	store() {
		new AIStoreInstance(this.player.inven, this.itemtree).setItemLimit(this.player.game.itemLimit).run()
	}
}

class DefaultAgent extends AiAgent {
	itemtree: {
		level: number
		items: number[]
		final: number
	}
	constructor(player: Player) {
		super(player)
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.EPIC_WHIP,
				ITEM.TIME_WARP_POTION,
				ITEM.EPIC_FRUIT,
				ITEM.BOOTS_OF_HASTE
			],
			final: ITEM.EPIC_SWORD
		}
	}
}

class AIStoreInstance {
	build: {
		level: number
		items: number[]
		final: number
	}
	resultItems: ListSet<number>
	inven: PlayerInventory
	totalMoneySpend: number
	itemLimit: number
	constructor(inven: PlayerInventory, build: { level: number; items: number[]; final: number }) {
		this.inven = inven
		this.build = build
		this.totalMoneySpend = 0
		this.resultItems = new ListSet(inven.itemSlots)
	}
	getChildItemCounts(target:number,itemlist:number[]):Map<number,number>{
		let counts=new Map<number,number>()
		let stk=[target]
		while(stk.length>0){
			for(const child of ITEMS[stk.pop()].children){
				stk.push(child)
				if(!counts.has(child)) counts.set(child,itemlist[child])
			}
		}
		return counts
	}
	setItemLimit(limit: number) {
		this.itemLimit = limit
		return this
	}
	hasEnoughMoney() {
		return this.inven.money - this.totalMoneySpend >= 30
	}

	run() {
		let attemptedCoreItems=new Set<number>()
		while (this.hasEnoughMoney()) {
			if (this.build.level >= this.itemLimit) {
				this.buyLife()
				break
			}

			//console.log("aistore",this.inven.money - this.totalMoneySpend)
			let tobuy = 0
			if (this.build.level >= this.build.items.length) {
				tobuy = this.build.final
			} else {
				tobuy = this.build.items[this.build.level]
			}

			if (attemptedCoreItems.has(tobuy) || this.aiAttemptItemBuy(tobuy) == 0) break
			attemptedCoreItems.add(tobuy)
		}

		this.inven.aiUpdateItem(this.resultItems.toArray(), this.totalMoneySpend)
	}
	buyLife() {
		let lifeprice = 150 * Math.pow(2, this.inven.lifeBought)

		while (this.inven.money >= lifeprice) {
			lifeprice = 150 * Math.pow(2, this.inven.lifeBought)
			this.inven.changeLife(1)
			this.inven.lifeBought += 1
			this.inven.changemoney(-lifeprice, CHANGE_MONEY_TYPE.SPEND)
		}
	}

	isFull(temp_itemlist: ListSet<number>) {
		return !temp_itemlist.has(-1)
	}
	copyCurrentItems(){
		return this.resultItems.copy()
	}
	//========================================================================================================

	/**
	 * 아이템 레벨이 부족해서 못사는 경우에는 그 아이템의 모든 하위아이템 중 레벨 되는 것들은 모두 구매 시도함
	 * @param tobuy 
	 * @returns 
	 */
	aiAttemptItemBuyLevelNotMet(tobuy: number):number{
		let childItemsThatMeetsLevel=[]
		let stk=new Stack<number>().push(tobuy)
		while(stk.size>0){
			for(const c of ITEMS[stk.pop()].children){
				if(this.inven.checkStoreLevel(ITEMS[c])) childItemsThatMeetsLevel.push(c)
				else stk.push(c)
			}
		}
		let moneyspend=0
		for(let item of childItemsThatMeetsLevel){
			moneyspend += this.aiAttemptItemBuy(item)
		}
		return moneyspend
	}

	/**
	 *
	 * @param {*} tobuy index of item 0~
	 *@returns money spent by trying to buy this item
	 */
	aiAttemptItemBuy(tobuy: number): number {
		const item = ITEMS[tobuy]
		let temp_itemlist = this.copyCurrentItems() //이 아이템을 샀을 경우의 아이템리스트
		let price = item.price - this.calcDiscount(tobuy, temp_itemlist)
		
		//구매불가
		if(!this.canbuy(price) || this.isFull(temp_itemlist) || !this.inven.checkStoreLevel(item)){
			let moneyspent = 0
			//레벨때문에 구매불가
			
			
			if (item.children.length === 0) {
				return 0
			}
			
			if(!this.inven.checkStoreLevel(item)){
				moneyspent += this.aiAttemptItemBuyLevelNotMet(tobuy)
				return moneyspent
			}

			temp_itemlist = this.copyCurrentItems()
			for (let i = 0; i < item.children.length; ++i) {

				const child = item.children[i]

				//이미 보유중인 하위템은 또 안사도록
				if (temp_itemlist.has(child)) {
					this.removeItem(temp_itemlist,child)
					continue
				}

				moneyspent += this.aiAttemptItemBuy(child)
			}
			return moneyspent
		}//구매가능
		else{
			this.totalMoneySpend += price
			this.resultItems=temp_itemlist.copy()
			this.addItem(tobuy)
			if (item.itemlevel === 3) {
				this.build.level += 1
			}
			return price
		}

	}

	//========================================================================================================

	/**
	 * 아이템 구매가능여부
	 * @param {*} price
	 */
	canbuy(price: number): boolean {
		return price <= this.inven.money - this.totalMoneySpend
	}
	//========================================================================================================

	/**
	 * 아이템 구입시 할인될 가격 반환
	 * @param {*} tobuy int
	 * @param {*} temp_itemlist copy of player`s item list
	 */
	calcDiscount(tobuy: number, itemslots: ListSet<number>): number {
		const thisitem = ITEMS[tobuy]

		// if (thisitem.children.length === 0) {
		// 	return 0
		// }
		let discount = 0
		//c:number
		for (const c of thisitem.children) {
			if (!itemslots.has(c)) {
				discount += this.calcDiscount(c, itemslots)
			} else {
				discount += ITEMS[c].price
				this.removeItem(itemslots,c)
			}
		}
		return discount
	}

	removeItem(itemslots:ListSet<number>, item:number) {
		if (!itemslots.has(item)) return

		itemslots.delete(item).add(-1)
		return itemslots
	}
	addItem(item:number){
		if (!this.resultItems.has(-1)) return

		this.resultItems.add(item).delete(-1)
	}
	//========================================================================================================

	getItemNames(): string[] {
		return ITEMS.map((i: any) => i.name)
	}
}

export { AiAgent, DefaultAgent }
