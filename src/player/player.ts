import obsInfo = require("../../res/obstacles.json")
import SETTINGS = require("../../res/globalsettings.json")
import * as ENUM from "../data/enum"
import * as Util from "../core/Util"
// import { PlayerClientInterface, testSetting } from "../app"
import type { Game } from "../Game"
import { EntityFilter } from "../entity/EntityFilter"
import { Projectile } from "../Projectile"
import { PlayerAbility } from "./PlayerAbility"
import PlayerStatistics from "./PlayerStatistics"
import { PlayerMapHandler } from "../MapHandlers/PlayerMapHandler"
import PlayerInventory from "./PlayerInventory"
import { PlayerStatusEffects } from "./PlayerStatusEffect"
import { ObstacleHelper, SkillInfoFactory } from "../core/helpers"
import { Entity } from "../entity/Entity"
import { SummonedEntity } from "../characters/SummonedEntity/SummonedEntity"
import { AiAgent, DefaultAgent } from "../AiAgents/AiAgent"
import { ServerPayloadInterface } from "../data/PayloadInterface"
import { MAP } from "../MapHandlers/MapStorage"
import ABILITY = require("../../res/character_ability.json")
import { Indicator } from "../TrainHelper"
const { isMainThread } = require('worker_threads')

// class Minion extends Entity{
// 	constructor(){
// 		super(null,null)
// 	}
// 	hi(){

// 	}
// }

// let args

// if(isMainThread){
// 	args=require("minimist")(process.argv.slice(2))
// }

const testSetting = {
	lvl: 1,
	pos: 50,
	money: 0
}
// if (args["l"]) testSetting.lvl = args["l"]
// if (args["p"]) testSetting.pos = args["p"]
// if (args["m"]) testSetting.money = args["m"]

console.log(testSetting)
export interface ValueScale {
	base: number
	scales: { ability: string; val: number }[]
}

abstract class Player extends Entity {
	//game: Game
	//	players: Player[]
	//	mapId: number
	AI: boolean
	AiAgent: AiAgent
	turn: number
	name: string
	champ: number
	champ_name: string
	team: boolean
	//	pos: number
	lastpos: number
	dead: boolean

	kill: number
	death: number
	assist: number
	invulnerable: boolean
	adice: number //추가 주사위숫자
	pendingSkill: number
	oneMoreDice: boolean
	diceControl: boolean
	diceControlCool: number
	thisLevelDeathCount: number //현재 레벨에서 사망 횟수
	thisLifeKillCount: number //죽지않고 킬 횟수
	waitingRevival: boolean

	//	HP: number
	//	MaxHP: number
	ability: PlayerAbility
	statistics: PlayerStatistics
	inven: PlayerInventory
	effects: PlayerStatusEffects
	mapHandler: PlayerMapHandler
	shield: number
	cooltime: number[]
	duration: number[]
	basicAttackCount: number //basic attack count avaliable in this turn

	//0.slow 1.speed 2.stun 3.silent 4. shield  5.poison  6.radi  7.annuity 8.slave
	// loanTurnLeft: number

	autoBuy:boolean
	damagedby: number[]
	//for eath player, turns left to be count as assist(maximum 3)

	bestMultiKill: number

	// abstract readonly hpGrowth: number
	abstract readonly cooltime_list: number[]
	// abstract itemtree: {
	// 	level: number
	// 	items: number[]
	// 	final: number
	// }
	abstract readonly duration_list: number[]
	abstract readonly skill_ranges: number[]
	skillInfoKor: SkillInfoFactory
	skillInfo: SkillInfoFactory

	abstract getSkillTrajectorySpeed(s: string): number
	abstract getSkillTargetSelector(skill: number): Util.SkillTargetSelector
	abstract getSkillProjectile(projpos: number): Projectile
	abstract getSkillDamage(target: number): Util.SkillAttack

	abstract passive(): void
	abstract getSkillName(skill: number): string
	abstract onSkillDurationCount(): void
	abstract onSkillDurationEnd(skill: number): void
	// abstract aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number }
	abstract getSkillBaseDamage(skill: number): number
	constructor(turn: number, team: boolean, game: Game, ai: boolean, char: number, name: string) {
		super(game, ABILITY[char].initial.HP, testSetting.pos, ENUM.ENTITY_TYPE.PLAYER)
		this.AI = ai //AI여부
		this.turn = turn //턴 (0에서 시작)
		this.name = name //이름
		this.champ = char //챔피언 코드
		this.champ_name = SETTINGS.characters[char].name //챔피언 이름
		this.team = team //0:readteam  1:blue
		this.lastpos = 0 //이전위치
		this.dead = false
		this.level = testSetting.lvl //레벨, 1에서시작

		this.UEID = this.game.turn2Id(this.turn)

		this.kill = 0
		this.death = 0
		this.assist = 0
		this.invulnerable = true
		this.adice = 0 //추가 주사위숫자

		this.pendingSkill = -1
		this.oneMoreDice = false
		this.diceControl = false
		this.diceControlCool = 0
		this.thisLevelDeathCount = 0 //현재 레벨에서 사망 횟수
		this.thisLifeKillCount = 0 //죽지않고 킬 횟수
		this.waitingRevival = false

		// this.HP = basic_stats[0]
		// this.MaxHP = basic_stats[0]
		this.ability = new PlayerAbility(this)
		this.statistics = new PlayerStatistics(this)
		this.inven = new PlayerInventory(this,testSetting.money)
		this.effects = new PlayerStatusEffects(this)
		this.mapHandler = PlayerMapHandler.create(this, this.mapId)
		this.AiAgent = new DefaultAgent(this)

		this.shield = 0

		this.cooltime = [0, 0, 0]
		this.duration = [0, 0, 0]
		this.basicAttackCount = 0
		// this.loanTurnLeft = 0

		this.damagedby = [0, 0, 0, 0]
		//for eath player, turns left to be count as assist(maximum 3)
		this.bestMultiKill = 0
		this.skillInfo = new SkillInfoFactory(this.champ, this, SkillInfoFactory.LANG_ENG)
		this.skillInfoKor = new SkillInfoFactory(this.champ, this, SkillInfoFactory.LANG_KOR)
		this.autoBuy=ai
	}
	transfer(func: Function, ...args: any[]) {
		this.mediator.sendToClient(func, ...args)
	}

	distance(p1: Player, p2: Player): number {
		return Math.abs(p1.pos - p2.pos)
	}
	distanceTo(p2: Player): number {
		return Math.abs(this.pos - p2.pos)
	}
	getPlayer(): Player {
		return this
	}
	message(text: string) {
		this.game.clientInterface.message(text)
	}
	getSkillInfoKor() {
		return this.skillInfoKor.get()
	}
	getSkillInfoEng() {
		return this.skillInfo.get()
	}
	getSkillAmount(key: string): number {
		return 0
	}
	calculateScale(data: ValueScale) {
		return this.ability.calculateScale(data)
	}
	isMyTurn(){
		return this.game.thisturn===this.turn
	}
	toggleAutoBuy(){
		if(this.AI) return
		this.autoBuy=!this.autoBuy
	}
	calculateAdditionalDice(amount: number): number {
		let first = this.mediator.selectBestOneFrom(EntityFilter.ALL_PLAYER(this))(function () {
			return this.pos
		})

		if (!(first instanceof Player)) return

		//자신이 1등보다 15칸이상 뒤쳐져있으면 주사위숫자 2 추가,
		//자신이 1등보다 30칸이상 뒤쳐져있으면 주사위숫자 4 추가
		//자신이 1등보다 레벨이 2 낮으면 주사위숫자 5 추가
		//역주사위 효과 있을시 추가안함
		if (this.pos + 15 < first.pos && !this.effects.has(ENUM.EFFECT.BACKDICE) && first.mapHandler.isOnMainWay()) {
			this.adice += amount
			if (this.pos + 30 < first.pos) {
				this.adice += amount
			}
			if (this.level + 1 < first.level) {
				this.adice += Math.floor(amount * 1.5)
			}
		}
		this.adice += this.ability.moveSpeed.get()

		//장화 아이템
		if (
			(this.inven.haveItem(ENUM.ITEM.BOOTS) || this.inven.haveItem(ENUM.ITEM.BOOTS_OF_HASTE)) &&
			this.game.totalnum - 1 === this.mediator.getPlayerRankOf(this, (p) => p.pos)
		) {
			this.adice += 1
		}

		//동레벨서 2~3번이상사망시 주사위2배 상시부여
		if (
			(this.thisLevelDeathCount >= 3 && this.level < 4) ||
			(this.thisLevelDeathCount >= 2 && this.level < 2) ||
			this.thisLevelDeathCount >= 7
		) {
			this.effects.apply(ENUM.EFFECT.DOUBLEDICE, 1)
		}
		//	 this.applyEffectBeforeDice(ENUM.EFFECT.DOUBLEDICE, 1)
		return this.adice
	}
	// getAiTarget(targets: number[]) {
	// 	return AIHelper.getAiTarget(this, targets)
	// }
	// getAiProjPos(skilldata: any, skill: number) {
	// 	return AIHelper.getAiProjPos(this, skilldata, skill)
	// }
	// getAiAreaPos(skilldata:any,skill:number){
	// 	return AIHelper.getAiAreaPos(this, skilldata, skill)
	// }
	/**
	 *
	 * @param {*} skill 0 ~
	 */
	isSkillLearned(skill: number): boolean {
		if (this.level < 2 && skill === ENUM.SKILL.W) {
			return false
		}
		if (this.level < 3 && skill === ENUM.SKILL.ULT) {
			return false
		}
		return true
	}
	isTargetableFrom(e: Entity): boolean {
		if (!e) return true
		if (this.dead || this.invulnerable || this.effects.has(ENUM.EFFECT.INVISIBILITY)) return false
		if (e instanceof Player && !this.mapHandler.isTargetableFrom(e)) return false
		return true
	}
	isAttackableFrom(e: Entity): boolean {
		if (!e) return true

		return this.isTargetableFrom(e) && this.isEnemyOf(e)
	}
	isEnemyOf(e: Entity): boolean {
		if (!e) return true

		if (e instanceof SummonedEntity) {
			if (e.summoner === this) return false
			if (this.game.isTeam && e.summoner.team === this.team) return false
			return true
		} else if (e instanceof Player) {
			if (e === this) return false
			if (this.game.isTeam && e.team === this.team) return false
			return true
		}
		return super.isEnemyOf(e)
	}
	/**
	 * 스킬 사용가능여부 체크
	 * @param {} s (0~) 스킬
	 * @returns
	 */
	isCooltimeAvaliable(s: number): boolean {
		if (this.cooltime[s] > 0) {
			return false
		}
		return true
	}
	//========================================================================================================

	//========================================================================================================
	showEffect(type: string, source: number) {
		this.game.clientInterface.visualEffect(this.pos, type, source)
	}
	//========================================================================================================
	onMyTurnStart() {

		if (!this.oneMoreDice) {
			this.onSkillDurationCount()
			this.decrementAllSkillDuration()
			this.inven.giveTurnMoney(MAP.getTurnGold(this.mapId, this.level))
			this.effects.onTurnStart()
			console.log("-------------------------onmyturnstart"+this.turn)
		}
		this.rechargeBasicAttack()
		this.passive()
		this.cooltime = this.cooltime.map(Util.decrement)

		this.game.clientInterface.update( "skillstatus", this.turn, this.getSkillStatus())
	}

	getSkillStatus(): ServerPayloadInterface.SkillStatus {
		return {
			turn: this.game.thisturn,
			cooltime: this.cooltime,
			cooltimeratio: this.getCooltimePercent(),
			duration: this.getDurationPercent(),
			level: this.level,
			basicAttackCount: this.basicAttackCount,
			canBasicAttack: this.canBasicAttack(),
			canUseSkill: this.canUseSkill()
		}
	}
	rechargeBasicAttack() {
		this.basicAttackCount = this.ability.basicAttackSpeed.get()
	}
	canBasicAttack(): boolean {
		return (
			this.basicAttackCount > 0 &&
			this.effects.canBasicAttack() &&
			this.mediator.selectAllFrom(this.getBasicAttackFilter()).length > 0 &&
			!this.dead &&
			this.mapHandler.canAttack()
		)
	}

	canUseSkill(): boolean {
		return !this.effects.has(ENUM.EFFECT.SILENT) && !this.dead && this.mapHandler.canAttack()
	}

	//========================================================================================================
	/**
	 * called right before receiving obstacle effects
	 */
	onBeforeObs() {
		if (this.oneMoreDice) {
			return
		}

		this.invulnerable = false
		this.mapHandler.onBeforeObs()

		// for (let p of this.projectile) {
		// 	p.projCoolDown()
		// }
		// if (this.loanTurnLeft === 1) {
		// 	this.inven.takeMoney(400)
		// }
		// this.loanTurnLeft = Math.max(0, this.loanTurnLeft - 1)

		this.effects.onBeforeObs()
	}

	//========================================================================================================

	onAfterObs() {
		// if (!this.oneMoreDice) {

		// }
		if (this.oneMoreDice) {
			return
		}
		this.effects.onAfterObs()
	}

	/**
	 * 	decrement all skill durations at once
	 */
	decrementAllSkillDuration() {
		for (let i = 0; i < this.duration.length; i++) this.setSingleSkillDuration(i, this.duration[i] - 1)
	}
	/**
	 * set all skill durations at once
	 * @param durations
	 */
	setAllSkillDuration(durations: number[]) {
		for (let i = 0; i < durations.length; i++) this.setSingleSkillDuration(i, durations[i])
	}

	/**
	 * change one skill`s duration
	 * checks if the skill duration ends
	 * @param skill
	 * @param val
	 */
	setSingleSkillDuration(skill: number, val: number) {
		if (val === 0 && this.isSkillActivated(skill)) {
			this.onSkillDurationEnd(skill)
		}
		if (val < 0) val = 0
		this.duration[skill] = val
	}

	//========================================================================================================

	onMyTurnEnd() {
		if (this.oneMoreDice) {
			return
		}
		this.damagedby = this.damagedby.map(Util.decrement)

		this.diceControlCooldown()

		this.inven.onTurnEnd()
		this.effects.onTurnEnd()
		this.ability.onTurnEnd()
	}
	//========================================================================================================

	checkMuststop(dice: number): number {
		if (this.pos + dice < 0) {
			return this.pos
		}

		for (let m of MAP.getMuststop(this.mapId)) {
			if ((this.pos < m && this.pos + dice > m) || (this.pos > m && this.pos + dice < m)) {
				return m - this.pos
			}
		}
		return dice
	}

	//========================================================================================================

	giveDiceControl() {
		this.diceControlCool = 3
		this.diceControl = true
		this.game.clientInterface.update("dc_item", this.turn, 1)
	}
	useDiceControl() {
		this.diceControlCool = 0
		this.diceControl = false
		this.game.clientInterface.update("dc_item", this.turn, -1)
	}
	diceControlCooldown() {
		this.diceControlCool = Math.max(this.diceControlCool - 1, 0)
		if (this.diceControlCool === 0) {
			this.diceControl = false
			// this.diceControlCool = SETTINGS.DC_COOL
		}
	}
	//========================================================================================================

	moveByDice(dice: number): boolean {
		this.lastpos = this.pos
		let died = this.changePos(this.pos + dice)
		return died
	}
	/**
	 * called to change position of player for dice or forcemove
	 * @param {} pos
	 * @returns died
	 */
	changePos(pos: number): boolean {
		if (this.mapHandler.doMineDamage()) return true

		this.pos = Util.clamp(pos, 0, MAP.getLimit(this.mapId))
		this.lvlup()

		return false
	}

	forceMove(pos: number): void {
		this.statistics.add(ENUM.STAT.FORCEMOVE, 1)
		this.adice = 0
		this.mapHandler.onForceMove(pos)
		this.changePos(pos)

		this.effects.reset(ENUM.EFFECT.STUN)
		this.invulnerable = false
		// this.stun = false
	}

	isBehindOf(other: Player): boolean {
		return this.pos < other.pos
	}
	//========================================================================================================

	resetCooltime(list: ENUM.SKILL[]) {
		//this.message(this.name + "`s cooltime has been reset")
		for (let i of list) {
			this.cooltime[i] = 0
		}
	}
	/**
	 * 스킬사용후 쿨타임 시작
	 * @param {} skill 스킬종류,0에서시작
	 */
	startCooltime(skill: ENUM.SKILL) {
		this.cooltime[skill] = this.cooltime_list[skill]
		if (skill === ENUM.SKILL.ULT) {
			this.cooltime[skill] -= this.ability.ultHaste.get()
		}
	}
	startDuration(skill: ENUM.SKILL) {
		this.duration[skill] = this.duration_list[skill]
	}
	/**
	 *
	 * @param skill skill
	 * @param amt has to be positive
	 */
	setCooltime(skill: ENUM.SKILL, amt: number) {
		this.cooltime[skill] = amt
	}

	isSkillActivated(skill: ENUM.SKILL) {
		return this.duration[skill] > 0
	}

	//========================================================================================================

	//========================================================================================================
	incrementKda(type: string) {
		switch (type) {
			case "k":
				this.kill += 1
				break
			case "d":
				this.death += 1
				break
			case "a":
				this.assist += 1
				break
		}
		//	console.log("incrementKda " + type)

		let str = this.kill + "/" + this.death + "/" + this.assist

		// if (this.game.instant) return
		this.game.clientInterface.update("kda", this.turn, str)
	}

	/**
	 * 캐릭터 외형 변경
	 * @param name name of that apperance
	 * set to default if name===""
	 */
	changeApperance(name: string) {
		this.game.clientInterface.update("appearance", this.turn, name)
		//	console.log("changeApperance"+name)
	}
	resetApperance() {
		this.changeApperance("")
	}
	/**
	 * 캐릭터 스킬 아이콘 변경
	 * @param name name of that skill
	 * set to default if name===""
	 */
	changeSkillImage(name: string, skill: ENUM.SKILL) {
		this.game.clientInterface.update("skillImg", this.turn, {
			champ: this.champ,
			skill: skill,
			skill_name: name
		})
		//	console.log("changeApperance"+name)
	}
	resetSkillImage(skill: ENUM.SKILL) {
		this.changeSkillImage("", skill)
	}
	getDurationPercent() {
		return this.duration.map((d, i) => {
			if (this.duration_list[i] === 0) return 0
			else return d / this.duration_list[i]
		})
	}
	getCooltimePercent() {
		return this.cooltime.map((c, i) => {
			if (this.cooltime_list[i] === 0) return 0
			else return c / this.cooltime_list[i]
		})
	}
	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data Util.HPChangeData

   */
	private changeHP_damage(data: Util.HPChangeData) {
		if (this.dead) {
			return
		}
		let hp = data.hp

		if (hp > -4000) {
			if (data.source >= 0) {
				this.statistics.add(ENUM.STAT.DAMAGE_TAKEN_BY_CHAMP, -hp)
			} //챔피언에게 받은 피해
			else {
				this.statistics.add(ENUM.STAT.DAMAGE_TAKEN_BY_OBS, -hp)
			} //장애물에게 받은 피해
		}
		this.MaxHP += data.maxHp
		this.HP = Math.min(this.HP + hp, this.MaxHP)

		// if (this.game.instant) return

		// let isblocked = data.hasFlag(Util.HPChangeData.FLAG_SHIELD)

		if (hp <= 0) {
			let hpChangeData: ServerPayloadInterface.Damage = {
				turn: this.turn,
				change: hp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				source: data.source,
				currshield:this.shield
			}
			this.game.clientInterface.changeHP_damage(hpChangeData)
		}
	}

	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data Util.HPChangeData

   */
	changeHP_heal(data: Util.HPChangeData) {
		if (data.type !== "respawn" && this.dead) {
			return
		}
		if (this.HP === this.MaxHP && data.type !== "heal") {
			return
		}
		if (data.hp <= 0) return
		let hp = data.hp
		if (data.type !== "respawn" && data.type !== "maxhpChange") {
			this.statistics.add(ENUM.STAT.HEAL_AMT, Math.min(hp, this.MaxHP - this.HP))
		}

		this.HP = Math.min(this.HP + hp, this.MaxHP)

		let type = data.type
		if (data.type === "noeffect" || data.type === "maxhpChange") {
			type = "heal_simple"
		}

		if (hp > 0) {
			let changeData: ServerPayloadInterface.Heal = {
				turn: this.turn,
				change: hp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				type: type,
				currshield:this.shield
			}
			this.game.clientInterface.changeHP_heal(changeData)
		}
	}

	//========================================================================================================

	killplayer() {
		this.doObstacleDamage(9999, "stab")
	}
	//========================================================================================================

	getPossiblePosList(): number[] {
		let list = []
		let offset = 1
		let increase = 1

		if (this.effects.has(ENUM.EFFECT.DOUBLEDICE)) {
			increase = 2
			offset = 2
		}
		if (this.effects.has(ENUM.EFFECT.BACKDICE)) {
			increase *= -1
			offset *= -1
		}

		if (this.effects.has(ENUM.EFFECT.SLOW)) {
			offset -= 2
		}
		if (this.effects.has(ENUM.EFFECT.SPEED)) {
			offset += 2
		}
		offset += this.adice

		for (let i = offset, n = 0; n < 6; i += increase, ++n) {
			if (this.pos + i < MAP.get(this.mapId).finish) {
				list.push(this.pos + i)
			}
		}
		return list
	}

	getWorstDice(): number {
		let list = this.getPossiblePosList()
		if (list.length === 0) {
			return 1
		}
		let worst = 5
		let dice = 1
		let searchto = list.length - Math.floor(Math.random() * 4) //앞으로 3~6칸(랜덤)중 선택함
		for (let i = 0; i < searchto; ++i) {
			let obs = this.game.shuffledObstacles[list[i]].obs
			//상점
			if (obs === 0 && worst > 0 && i > 1) {
				break
			}

			if (list[i] > 0) {
				if (obsInfo.obstacles[obs].val < worst) {
					worst = obsInfo.obstacles[obs].val
					dice = i + 1
				}
			}
		}
		if (Math.random() < 0.8 || worst < -1) return dice
		//가장 나쁜장애물이 -2 이하이면 그대로 반환
		else if (this.effects.has(ENUM.EFFECT.BACKDICE)) return 6
		else return 1
	}
	//========================================================================================================

	//========================================================================================================

	arriveAtSquare(isForceMoved: boolean): number {
		if (this.dead) {
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}

		if (this.pos < 0) {
			this.pos = 0
		}
		//	console.log("arriveAtSquare" + this.turn)
		this.mapHandler.onArriveSquare(this.pos)

		if (this.pos >= MAP.getFinish(this.mapId) && this.mapHandler.isOnMainWay()) {
			if (this.effects.has(ENUM.EFFECT.SLAVE)) {
				this.pos = MAP.getFinish(this.mapId) - 1
				this.killplayer()
				this.message(this.name + " has been finally freed from slavery")
				return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
			} else {
				this.game.gameover = true
				return ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
			}
		}

		if (this.game.applyRangeProjectile(this)) return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE

		let isRooted=this.effects.has(ENUM.EFFECT.STUN)
		let isInvisible=this.effects.has(ENUM.EFFECT.INVISIBILITY)
		if(!isForceMoved){
			this.onBeforeObs()
		}

		return this.obstacle(this.game.shuffledObstacles[this.pos].obs, isForceMoved,isRooted,isInvisible)
	}

	/**
	 *
	 * @param {*} obs obstacle id
	 * @param {*} isForceMoved whether it is forcemoved
	 * @returns
	 */
	obstacle(obs: number, isForceMoved: boolean,isRooted:boolean,isInvisible:boolean): number {
		//속박일경우
		if (isRooted) {
			//특정 장애물은 속박시 무시
			if (SETTINGS.ignoreStunObsList.includes(obs)) {
				if (this.game.setting.legacyAA) this.basicAttack()

				obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.STUN
			}
		}
		else if (obs === 0) {
			this.invulnerable = true
			//this.effects.apply(ENUM.EFFECT.SILENT, 1, EFFECT_TIMING.BEFORE_SKILL) //cant use skill in the store

			this.goStore()
			obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		} else if (obs === -1) {
			obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
		}
		//투명화:   해로운 장애물일경우만 무시
		else if (isInvisible && obsInfo.obstacles[obs].val < 0) {
			obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		} else {
			let money = this.game.shuffledObstacles[this.pos].money * 10
			if (money > 0) {
				this.inven.giveMoney(money)
			}
			obs = ObstacleHelper.applyObstacle(this, obs, isForceMoved)
		}

		if (this.game.setting.legacyAA) this.basicAttack()

		return obs
	}


	goStore(priceMultiplier?: number) {
		if (!priceMultiplier) priceMultiplier = 1
		if(this.autoBuy){
			this.AiAgent.store()
		}
		else{
			this.game.clientInterface.goStore(this.turn, this.inven.getStoreData(priceMultiplier))
		}
		
	}

	//========================================================================================================
	/**
	 * levels up if avaliable
	 */
	lvlup() {
		let respawn = MAP.getRespawn(this.mapId)
		for (let i = 1; i < respawn.length; ++i) {
			if (this.pos >= respawn[i] && this.level <= i && this.mapHandler.isOnMainWay()) {
				this.addMaxHP(ABILITY[this.champ].growth.HP)
				this.level += 1
				this.ability.onLevelUp(this.game.totalnum)

				this.effects.reset(ENUM.EFFECT.ANNUITY_LOTTERY) //연금복권 끝

				if (this.level === 3) {
					this.cooltime[2] = 1
				}
				this.thisLevelDeathCount = 0

				break
			}
		}
	}

	//========================================================================================================

	heal(h: number) {
		this.changeHP_heal(new Util.HPChangeData().setHpChange(h).setType("heal"))
	}
	//========================================================================================================

	addMaxHP(m: number) {
		//this.transfer(PlayerClientInterface.update, "maxhp", this.turn, m)
		this.MaxHP += m
		this.changeHP_heal(new Util.HPChangeData().setHpChange(m).setType("maxhpChange"))
	}

	//========================================================================================================

	addKill(deadplayer: Player) {
		
		//선취점
		let totalkill = this.mediator.allPlayer().reduce(function (t: number, a: Player) {
			return t + a.kill
		}, 0)
		this.inven.onKillEnemy()
		console.log("--------------addkill"+totalkill)
		if (totalkill === 0) {
			this.inven.giveMoney(100)
			this.message(this.name + ", First Blood!")
		} else {
			this.inven.giveMoney(70 + 10 * this.thisLifeKillCount + 20 * deadplayer.thisLifeKillCount)
		}
		this.oneMoreDice = true
		// this.diceControl = true
		// this.diceControlCool = SETTINGS.DC_COOL
		this.thisLifeKillCount += 1
		this.incrementKda("k")
		if (this.thisLifeKillCount > this.bestMultiKill) this.bestMultiKill = this.thisLifeKillCount

		// this.giveEffect('speed',1,1)
	}

	obstacleEffect(type: string) {
		this.game.clientInterface.visualEffect(this.pos,type,-1)
	}

	/**
	 * step before givedamage
	 * @param damage
	 * @param type
	 */
	doObstacleDamage(damage: number, type?: string): boolean {
		let changeData = new Util.HPChangeData().setSource(-1)

		if (type != null) {
			changeData.setType(type)
			this.obstacleEffect(type)
		}
		damage = this.effects.onObstacleDamage(damage)
		damage *= 1 - this.ability.obsR.get() / 100 //장애물 저항
		return this.doDamage(damage, changeData)
	}
	updateTotalShield(change: number, noindicate: boolean) {
		//	console.log("updateshield" + change)
		this.shield += Math.floor(change)
		if (change === 0) return
		this.game.clientInterface.changeShield( {
			turn: this.turn,
			shield: this.shield,
			change: change,
			indicate: !noindicate
		})
	}
	/**
	 * shield absorbs damage
	 * @param damage
	 * @returns
	 */
	shieldDamage(damage: number): number {
		let damageLeft = this.effects.applyShield(damage)
		if (damageLeft > damage) return

		this.updateTotalShield(-(damage - damageLeft), false)
		this.statistics.add(ENUM.STAT.DAMAGE_REDUCED, damage - damageLeft)

		return damageLeft
	}
	/**
	 * common damage giver for skill and obstacles
	 *
	 * 1. 무적 여부 체크
	 * 2. 방사능 체크
	 * 3. 어시스트용 array 에 데미지 근원 기록
	 * 4. 방어막 적용
	 * 5. 체력 바꿈
	 * 6. 죽었을경우 체크
	 * @param damage 총 합 데미지
	 * @param  skillfrom  starts with 0   ,obstacle:-1
	 * @param type: string
	 * @return 죽으면 true 아니면 false
	 */
	doDamage(damage: number, changeData: Util.HPChangeData):boolean {
		try {
			if (this.dead || this.invulnerable || damage === 0 || changeData.source===this.turn) {
				return false
			}
		//	let predictedHP = this.HP + this.shield - damage

			damage = this.shieldDamage(damage)

			this.effects.onFinalDamage(damage)

			
			// if (predictedHP <= 0) {
			// 	if (reviveType == null) {
			// 		changeData.setKilled()
			// 	} else {
			// 		//revive
			// 		changeData.setWillRevive()
			// 	}
			// }
			this.changeHP_damage(changeData.setHpChange(-1 * Math.floor(damage)))

			if (this.HP <= 0) {
				this.effects.onLethalDamage()
				let reviveType = this.canRevive()

				if (reviveType == null) {
					this.die(changeData.source)
					return true
				} else {
					this.prepareRevive(reviveType)
					return false
				}
			}
			return false
		} catch (e) {
			console.error(e)
			return false
		}
	}

	canRevive(): string {
		if (this.inven.isActiveItemAvailable(ENUM.ITEM.GUARDIAN_ANGEL)) return "guardian_angel"

		if (this.inven.life > 0) return "life"

		return null
	}

	prepareRevive(reviveType: string) {
		this.game.clientInterface.update("waiting_revival", this.turn,"")

		if (reviveType === "life") this.inven.changeLife(-1)

		if (reviveType === "guardian_angel") {
			this.game.clientInterface.indicateItem(this.turn, ENUM.ITEM.GUARDIAN_ANGEL)
			this.inven.useActiveItem(ENUM.ITEM.GUARDIAN_ANGEL)
		}
		this.waitingRevival = true
		this.HP = 0
		this.dead = true
		this.invulnerable=true
	}

	sendKillInfo(killer: number) {
		// if (this.game.instant) return

		// if (gostore) {
		// 	this.transfer(PlayerClientInterface.goStore, this.turn, this.inven.getStoreData(1))
		// }

		let killData: ServerPayloadInterface.Death = {
			killer: killer,
			turn: this.turn,
			location: this.pos,
			isShutDown: false,
			killerMultiKillCount: 1
		}

		//상대에게 죽은경우
		if (killer >= 0) {
			//console.log("sendkillinfo skillfrom " + skillfrom)
			let killerMultiKillCount = this.game.pOfTurn(killer).thisLifeKillCount
			this.game.pOfTurn(killer).effects.reset(ENUM.EFFECT.SLAVE)

			let isShutDown = this.thisLifeKillCount > 1
			killData.isShutDown = isShutDown
			killData.killerMultiKillCount = killerMultiKillCount
		}
		this.game.clientInterface.die(killData)
	}

	/**
	 * 1. 메세지 전송
	 * 2. 어시스트 기록
	 * 3. 다음턴데미지, 이펙트, 스킬지속시간, 투사체 초기화
	 * 4. 리스폰지점으로 이동
	 * @param {*} skillfrom 0에서시작
	 */
	die(skillfrom: number) {
		if (skillfrom >= 0) {
			this.message(this.game.pOfTurn(skillfrom).name + " killed " + this.name)
			this.game.pOfTurn(skillfrom).addKill(this)
			this.thisLifeKillCount = 0
		} else {
			this.message(this.name + " has been executed!")
			this.statistics.add(ENUM.STAT.EXECUTED, 1)
		}
		this.game.addKillData(skillfrom, this.turn, this.pos)

		this.Assist(skillfrom)
		this.HP = 0
		this.dead = true
		this.mapHandler.onDeath()
		this.incrementKda("d")
		this.damagedby = [0, 0, 0, 0]

		this.setAllSkillDuration([0, 0, 0])
		this.invulnerable = true
		this.effects.onDeath()
		this.oneMoreDice = false
		// for (let p of this.projectile) {
		// 	p.remove()
		// }
		// this.projectile = []
		this.thisLevelDeathCount += 1

		this.pos = this.getRespawnPoint()
		//	console.log("respawn pos" + this.pos)
		//this.giveEffect('silent',1,-1)
		if (MAP.getStore(this.mapId).includes(this.pos)) {
			this.goStore()
		}
		

		this.sendKillInfo(skillfrom)
	}
	

	//========================================================================================================

	getRespawnPoint(): number {
		let res = MAP.getRespawn(this.mapId)

		return res[this.level - 1]
	}

	//========================================================================================================

	respawn() {
		let health = this.MaxHP
		if (this.waitingRevival) {
			health = Math.floor(health / 2)
			this.statistics.add(ENUM.STAT.REVIVE, 1)
		}

		this.changeHP_heal(new Util.HPChangeData().setHpChange(health).setRespawn())
		this.dead = false
		this.invulnerable=false
		//	console.log("revive" + this.HP)
		this.game.clientInterface.respawn(this.turn, this.pos, this.waitingRevival)

		this.waitingRevival = false
	}

	//========================================================================================================
	/**
	 * 3턴 이내에 피해를 준 플레이어가 사망
	 * @param {*} skillfrom
	 */
	Assist(skillfrom: number) {
		//let assists=[]
		for (let i = 0; i < this.game.totalnum; ++i) {
			if (this.damagedby[i] > 0 && this.turn !== i && skillfrom !== i) {
				// if (skillfrom === i) {
				// 	continue
				// }
				let plyr = this.game.pOfTurn(i)

				plyr.incrementKda("a")
				plyr.inven.giveMoney(25)
				this.message(plyr.name + " assist!")
				//assists.push(this.players[i])
			}
		}
		// return assists
	}
	useActivationSkill(skill: number): void {}
	useNonTargetSkill(skill: number): boolean {
		return false
	}
	/**
	 * check skill avalibility, get avaliable targets or locations from skilltargetselector
	 * @param {*} skill
	 */
	initSkill(skill: number): ServerPayloadInterface.SkillInit {
		this.pendingSkill = skill

		let payload: ServerPayloadInterface.SkillInit = {
			turn: this.turn,
			crypt_turn: this.game.cryptTurn(this.turn),
			type: ENUM.INIT_SKILL_RESULT.NON_TARGET,
			data: null,
			skill: skill
		}
		if (!this.isSkillLearned(skill)) {
			//	return "notlearned"
			payload.type = ENUM.INIT_SKILL_RESULT.NOT_LEARNED
			return payload
		} else if (!this.isCooltimeAvaliable(skill)) {
			payload.type = ENUM.INIT_SKILL_RESULT.NO_COOL
			return payload
		}
		let skillTargetSelector: Util.SkillTargetSelector = this.getSkillTargetSelector(skill)

		if (skillTargetSelector.isNonTarget()) {
			payload.type = ENUM.INIT_SKILL_RESULT.NON_TARGET
			if (!this.AI) {
				let result = this.useNonTargetSkill(skill)
				if (!result) payload.type = ENUM.INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			}
			return payload
		}

		if (skillTargetSelector.isActivation()) {
			if (!this.AI) this.useActivationSkill(skill)
			payload.type = ENUM.INIT_SKILL_RESULT.ACTIVATION
			return payload
		} else if (skillTargetSelector.isNoTarget()) {
			payload.type = ENUM.INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			return payload
		}
		skillTargetSelector.range = this.effects.modifySkillRange(skillTargetSelector.range)
		//마법의성,실명 적용

		if (skillTargetSelector.isProjectile()) {
			payload.type = ENUM.INIT_SKILL_RESULT.PROJECTILE
			payload.data = {
				kind: "location",
				pos: this.pos,
				range: skillTargetSelector.range,
				size: skillTargetSelector.projSize
			}
			return payload
		}
		if (skillTargetSelector.isAreaTarget()) {
			payload.type = ENUM.INIT_SKILL_RESULT.AREA_TARGET

			payload.data = {
				kind: "location",
				pos: this.pos,
				range: skillTargetSelector.range,
				size: skillTargetSelector.areaSize
			}
			return payload
		}
		let targets = this.mediator
			.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(skillTargetSelector.range))
			.map((pl:Player) => pl.turn)
		let conditionedTargets = this.mediator
			.selectAllFrom(
				EntityFilter.ALL_ATTACKABLE_PLAYER(this)
					.inRadius(skillTargetSelector.conditionedRange)
					.onlyIf(skillTargetSelector.condition)
			)
			.map((pl:Player) => pl.turn)
		targets = targets.concat(conditionedTargets)

		//	console.log("skillattr" + targets + " " + skillTargetSelector.range)
		if (targets.length === 0) {
			//return "notarget"
			payload.type = ENUM.INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE
			return payload
		}
		payload.type = ENUM.INIT_SKILL_RESULT.TARGTING
		payload.data = { targets: targets, kind: "target" }
		return payload
	}
	getBaseBasicAttackDamage(): Util.Damage {
		return new Util.Damage(this.ability.AD.get(), 0, 0)
	}
	getBasicAttackName(): string {
		return "basicattack"
	}
	usePendingAreaSkill(pos: number) {}

	private getBasicAttackFilter() {
		return EntityFilter.ALL_ENEMY(this).excludeUnattackable().inRadius(this.ability.attackRange.get())
	}

	basicAttack() {
		if (this.basicAttackCount <= 0) return false

		this.basicAttackCount -= 1
		if (!this.effects.canBasicAttack()) {
			return false
		}
		let damage: Util.Damage = this.ability.basicAttackDamage()

		damage = this.mapHandler.onBasicAttack(damage)
		this.statistics.add(ENUM.STAT.BASICATTACK, 1)
		//	console.log("basicattack")
		let died = this.mediator.basicAttack(this, this.getBasicAttackFilter())(damage)
	}
	getTargetParameters(){

	}


	//0.damagetakenbychamp 1. damagetakenbyobs  2.damagedealt
	//3.healamt  4.moneyearned  5.moneyspent   6.moneytaken  7.damagereduced
	//8 timesrevived 9 timesforcemoved 10 basicattackused  11 timesexecuted

	getTrainIndicator(totalturn:number):Indicator{
		let ind=new Indicator(this.champ)
		ind.damage_per_death=this.statistics.stats[ENUM.STAT.DAMAGE_DEALT]/Math.max(0.5,this.death)
		ind.damage_reduction_per_gold=this.statistics.stats[ENUM.STAT.DAMAGE_REDUCED]/this.statistics.stats[ENUM.STAT.MONEY_EARNED]
		ind.damage_reduction_per_turn=this.statistics.stats[ENUM.STAT.DAMAGE_REDUCED]/totalturn
		ind.damage_per_gold=this.statistics.stats[2]/this.statistics.stats[ENUM.STAT.MONEY_EARNED]
		ind.end_position=this.pos
		ind.damage_reduction_rate=this.statistics.stats[7]/Math.max(1,(this.statistics.stats[7]+this.statistics.stats[0]))
		ind.heal_per_gold=this.statistics.stats[3]/this.statistics.stats[ENUM.STAT.MONEY_EARNED]

		if(this.pos >= this.mapHandler.gamemap.finish) 
			ind.isWinner=true

		return ind
	}
	getCoreItemBuild():number[]{
		return this.AiAgent.itemtree.items.slice(0,this.AiAgent.itemtree.level)
	}
}

export { Player }
