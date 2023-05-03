import {obstacles} from "../../../res/obstacle_data.json"
import SETTINGS = require("../../../res/globalsettings.json")
import ABILITY = require("../../../res/character_ability.json")
import CONFIG from "../../../config/config.json"

import type { Game } from "../Game"
import { EntityFilter } from "../entity/EntityFilter"
import { PlayerAbility } from "./PlayerAbility"
import PlayerStatistics from "./PlayerStatistics"
import { PlayerMapHandler } from "../MapHandlers/PlayerMapHandler"
import PlayerInventory from "./PlayerInventory"
import { PlayerStatusEffects } from "./PlayerStatusEffect"
import { ObstacleHelper } from "../core/Obstacles"
import { Entity } from "../entity/Entity"
import { SummonedEntity } from "../characters/SummonedEntity/SummonedEntity"
import { AiAgent, DefaultAgent } from "../AiAgents/AiAgent"
import { ServerGameEventFormat } from "../data/EventFormat"
import { MAP } from "../MapHandlers/MapStorage"
import { Indicator } from "../Simulation/data/Indicator"
// const { isMainThread } = require('worker_threads')
import { HPChange } from "../core/health"
import { DamageRecord, PlayerDamageRecorder } from "./PlayerDamageRecord"
import {
	BASICATTACK_TYPE,
	ENTITY_TYPE,
	ITEM,
	SKILL,
	STAT,
	MAP_TYPE,
	ARRIVE_SQUARE_RESULT_TYPE,
	INIT_SKILL_RESULT,
} from "../data/enum"
import { EFFECT } from "../StatusEffect/enum"
import { AbilityUtilityScorecard, clamp, decrement, removeDuplicate, roundToNearest } from "../core/Util"
import { CharacterSkillManager, EmptySkillManager } from "../characters/SkillManager/CharacterSkillManager"

// if(isMainThread){
// 	args=require("minimist")(process.argv.slice(2))
// }

const initialSetting =
	CONFIG.dev_settings && CONFIG.dev_settings.enabled
		? {
				lvl: CONFIG.dev_settings.player.level,
				pos: CONFIG.dev_settings.player.pos,
				money: CONFIG.dev_settings.player.money,
		  }
		: {
				lvl: 1,
				pos: 0,
				money: 0,
		  }
// if (args["l"]) testSetting.lvl = args["l"]
// if (args["p"]) testSetting.pos = args["p"]
// if (args["m"]) testSetting.money = args["m"]

console.log(initialSetting)

class Player extends Entity{
	AI: boolean
	
	turn: number
	name: string
	isLoggedIn: boolean
	champ: number
	champ_name: string
	team: number
	lastpos: number
	dead: boolean

	kill: number
	death: number
	assist: number
	invulnerable: boolean
	adice: number //추가 주사위숫자
	oneMoreDice: boolean
	diceControl: boolean
	diceControlCool: number
	thisLevelDeathCount: number //현재 레벨에서 사망 횟수
	private thisLifeKillCount: number //죽지않고 킬 횟수
	waitingRevival: boolean

	ability: PlayerAbility
	readonly statistics: PlayerStatistics
	readonly damageRecord: PlayerDamageRecorder
	inven: PlayerInventory
	effects: PlayerStatusEffects
	readonly mapHandler: PlayerMapHandler
	shield: number
	// loanTurnLeft: number

	private autoBuy: boolean
	private damagedby: number[] //for eath player, turns left to be count as assist(maximum 3)

	bestMultiKill: number
	thisTurnObstacleCount: number //variable to prevent infinite recursion error
	
	//skillManager and AiAgent will be initialized properly later
	skillManager:CharacterSkillManager
	AiAgent:AiAgent

	constructor(turn: number, team: number, game: Game, ai: boolean, name: string,champ:number) {
		super(game, 200, initialSetting.pos, ENTITY_TYPE.PLAYER)
		this.AI = ai //AI여부
		this.turn = turn //턴 (0에서 시작)
		this.name = name //이름
		this.champ = champ //챔피언 코드
		this.champ_name = '' //챔피언 이름
		this.team = team //0:readteam  1:blue
		this.lastpos = 0 //이전위치
		this.dead = false
		this.level = initialSetting.lvl //레벨, 1에서시작
		this.isLoggedIn = false
		this.UEID = this.game.turn2Id(this.turn)

		this.kill = 0
		this.death = 0
		this.assist = 0
		this.invulnerable = true
		this.adice = 0 //추가 주사위숫자

		
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
		this.inven = new PlayerInventory(this, initialSetting.money)
		this.effects = new PlayerStatusEffects(this)
		this.mapHandler = PlayerMapHandler.create(this, this.mapId)
		this.damageRecord = new PlayerDamageRecorder()

		this.shield = 0

		// this.loanTurnLeft = 0

		this.damagedby = [0, 0, 0, 0]
		//for eath player, turns left to be count as assist(maximum 3)
		this.bestMultiKill = 0
		this.autoBuy = ai
		this.thisTurnObstacleCount = 0
		this.skillManager=new EmptySkillManager(this)
		this.AiAgent=new DefaultAgent(this)
	}
	bindCharacter(id:number,skillManager:CharacterSkillManager,ai:AiAgent){
		this.skillManager=skillManager
        this.AiAgent=ai
        this.champ=id
        this.champ_name=SETTINGS.characters[id].name
		this.ability.init(id)
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
	protected getPlayer(): Player {
		return this
	}
	sendConsoleMessage(text: string) {
		this.game.eventEmitter.message("[@]", text)
	}
	setAutoBuy(b: boolean) {
		if (this.AI) return
		this.autoBuy = b
	}
	onGameStart() {
		this.mapHandler.onGameStart()
		const util=this.mediator.getOpponentTotalTypeUtility(this)
		this.AiAgent.applyInitialOpponentUtility(util)
	}
	calculateAdditionalDice(amount: number): number {
		let first = this.mediator.selectBestOneFrom(EntityFilter.ALL_PLAYER(this),e=>e.pos)

		//자신이 1등보다 15칸이상 뒤쳐져있으면 주사위숫자 2 추가,
		//자신이 1등보다 30칸이상 뒤쳐져있으면 주사위숫자 4 추가
		//자신이 1등보다 레벨이 2 낮으면 주사위숫자 5 추가
		//역주사위 효과 있을시 추가안함
		if (this.pos + 15 < first.pos && !this.effects.has(EFFECT.BACKDICE) && first.mapHandler.isOnMainWay()) {
			this.adice += amount
			if (this.pos + 30 < first.pos) {
				this.adice += amount
			}
			if (this.level + 1 < first.level) {
				this.adice += Math.floor(amount * 1.5)
			}
		}
		this.adice += this.ability.moveSpeed.val

		//장화 아이템
		if (
			(this.inven.haveItem(ITEM.BOOTS) || this.inven.haveItem(ITEM.BOOTS_OF_HASTE)) &&
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
			this.effects.apply(EFFECT.DOUBLEDICE, 1)
		}
		return this.adice
	}
	
	/**
	 * can be targeted by the entity
	 * @param e
	 * @returns
	 */
	isTargetableFrom(e: Entity): boolean {
		if (!e) return true
		if (this.dead || this.invulnerable || this.effects.has(EFFECT.INVISIBILITY)) return false
		if (e instanceof Player && !this.mapHandler.isTargetableFrom(e)) return false
		return true
	}
	canBasicAttack(): boolean {
		return (
			this.skillManager.basicAttackCount > 0 &&
			this.effects.canBasicAttack() &&
			!this.dead &&
			this.mapHandler.canAttack() &&
			this.skillManager.hasBasicAttackTarget()
		)
	}

	canUseSkill(): boolean {
		return !this.effects.has(EFFECT.SILENT) && !this.dead && this.mapHandler.canAttack()
	}
	getSkillStatus(): ServerGameEventFormat.SkillStatus{
		let status=this.skillManager.getSkillStatus()
		status.turn=this.turn
		status.canBasicAttack=this.canBasicAttack()
		status.canUseSkill=this.canUseSkill()
		status.level=this.level
		return status
	}
	/**
	 *
	 * @param e
	 * @returns true if targetable and enemy of the entity
	 */
	isAttackableFrom(e: Entity): boolean {
		if (!e) return true

		return this.isTargetableFrom(e) && this.isEnemyOf(e)
	}
	/**
	 * false if it is itself or is in a same team, true otherwise
	 * @param e
	 * @returns
	 */
	isEnemyOf(e: Entity): boolean {
		if (!e) return true

		if (e instanceof SummonedEntity) {
			if (e.summoner === this) return false
			if (e.summoner.team === this.team) return false
			return true
		} else if (e instanceof Player) {
			if (e === this) return false
			if (e.team === this.team) return false
			return true
		}
		return super.isEnemyOf(e)
	}
	
	//========================================================================================================

	
	/**
	 * show visual effect to client
	 * @param type
	 * @param source
	 */
	showEffect(type: string, source: number) {
		this.game.eventEmitter.visualEffect(this.pos, type, source)
	}
	private lifetimeMoneyMultiplier(){
		return Math.max(1,this.lifeTime * 0.15)
	}
	//========================================================================================================
	onMyTurnStart() {
		this.thisTurnObstacleCount = 0
		if (!this.oneMoreDice) {
			
			this.inven.giveTurnMoney(Math.floor(MAP.getTurnGold(this.mapId, this.level) * this.lifetimeMoneyMultiplier()))
			this.effects.onTurnStart()
			this.lifeTime+=1
		}
		this.inven.onTurnStart()
		this.skillManager.onTurnStart()
		this.game.eventEmitter.update("skillstatus", this.turn, this.skillManager.getSkillStatus())
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

	

	//========================================================================================================

	onMyTurnEnd() {
		if (this.oneMoreDice) {
			return
		}
		this.damagedby = this.damagedby.map(decrement)

		this.diceControlCooldown()

		this.inven.onTurnEnd()
		this.effects.onTurnEnd()
		this.ability.onTurnEnd()
		this.damageRecord.onTurnEnd()
	}
	//========================================================================================================
	/**
	 * modify dice number if there is a muststop position on the path
	 * @param dice
	 * @returns
	 */
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
		this.game.eventEmitter.update("dc_item", this.turn, 1)
	}
	useDiceControl() {
		this.diceControlCool = 0
		this.diceControl = false
		this.game.eventEmitter.update("dc_item", this.turn, -1)
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
		this.inven.moveByDice(dice)
		let died = this.changePos(this.pos + dice)
		return died
	}
	/**
	 * called to change position of player for dice or forcemove
	 * @param {} pos
	 * @returns died
	 */
	changePos(pos: number): boolean {
		if (this.mapHandler.onChangePos()) return true

		this.pos = clamp(pos, 0, MAP.getLimit(this.mapId))
		this.checkLevelUp()
		this.game.onPlayerChangePos(this.turn)
		return false
	}
	canThrowDice() {
		return !(this.effects.has(EFFECT.ROOT) || this.effects.has(EFFECT.GROUNGING))
	}

	forceMove(pos: number): void {
		this.statistics.add(STAT.FORCEMOVE, 1)
		this.adice = 0
		this.mapHandler.onForceMove(pos)
		this.changePos(pos)

		this.effects.reset(EFFECT.ROOT)
		this.effects.reset(EFFECT.GROUNGING)

		this.invulnerable = false
		// this.stun = false
	}

	isBehindOf(other: Player): boolean {
		return this.pos < other.pos
	}
	//========================================================================================================

	

	//========================================================================================================

	//========================================================================================================
	private incrementKda(type: string) {
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
		this.game.eventEmitter.update("kda", this.turn, str)
	}

	/**
	 * 캐릭터 외형 변경
	 * @param name name of that apperance
	 * set to default if name===""
	 */
	changeApperance(name: string) {
		this.game.eventEmitter.update("appearance", this.turn, name)
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
	changeSkillImage(name: string, skill: SKILL) {
		this.game.eventEmitter.update("skillImg", this.turn, {
			champ: this.champ,
			skill: skill,
			skill_name: name,
		})
		//	console.log("changeApperance"+name)
	}
	resetSkillImage(skill: SKILL) {
		this.changeSkillImage("", skill)
	}
	
	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data HPChange

   */
	changeHP_damage(data: HPChange) {
		if (this.dead) {
			return
		}
		let hp = data.hp

		//if it is not a damage from execution
		if (hp > -4000) {
			if (data.sourcePlayer != null) {
				this.statistics.add(STAT.DAMAGE_TAKEN_BY_CHAMP, -hp)
			} //챔피언에게 받은 피해
			else {
				this.statistics.add(STAT.DAMAGE_TAKEN_BY_OBS, -hp)
			} //장애물에게 받은 피해
		}
		this.MaxHP += data.maxHp
		this.HP = Math.min(this.HP + hp, this.MaxHP)

		// if (this.game.instant) return

		// let isblocked = data.hasFlag(HPChange.FLAG_SHIELD)

		if (hp <= 0) {
			let hpChangeData: ServerGameEventFormat.Damage = {
				turn: this.turn,
				change: hp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				source: data.getSourceTurn(),
				currshield: this.shield,
			}
			this.game.eventEmitter.changeHP_damage(hpChangeData)
		}
	}

	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data HPChange

   */
	changeHP_heal(data: HPChange) {
		if (data.type !== "respawn" && this.dead) {
			return
		}
		if (this.HP === this.MaxHP && data.type !== "heal") {
			return
		}
		if (data.hp <= 0) return
		let hp = data.hp
		if (data.type !== "respawn" && data.type !== "maxhpChange") {
			this.statistics.add(STAT.HEAL_AMT, Math.min(hp, this.MaxHP - this.HP))
		}

		this.HP = Math.min(this.HP + hp, this.MaxHP)

		let type = data.type
		if (data.type === "noeffect" || data.type === "maxhpChange") {
			type = "heal_simple"
		}

		if (hp > 0) {
			let changeData: ServerGameEventFormat.Heal = {
				turn: this.turn,
				change: hp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				type: type,
				currshield: this.shield,
			}
			this.game.eventEmitter.changeHP_heal(changeData)
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

		if (this.effects.has(EFFECT.DOUBLEDICE)) {
			increase = 2
			offset = 2
		}
		if (this.effects.has(EFFECT.BACKDICE)) {
			increase *= -1
			offset *= -1
		}

		if (this.effects.has(EFFECT.SLOW)) {
			offset -= 2
		}
		if (this.effects.has(EFFECT.SPEED)) {
			offset += 2
		}
		offset += this.adice

		for (let i = offset, n = 0; n < 6; i += increase, ++n) {
			if (this.pos + i < this.mapHandler.gamemap.finish) {
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
			let obs = this.game.getObstacleAt(list[i])
			//상점
			if (obs === 0 && worst > 0 && i > 1) {
				break
			}

			if (list[i] > 0) {
				if (obstacles[obs].val < worst) {
					worst = obstacles[obs].val
					dice = i + 1
				}
			}
		}
		if (Math.random() < 0.8 || worst < -1) return dice
		//가장 나쁜장애물이 -2 이하이면 그대로 반환
		else if (this.effects.has(EFFECT.BACKDICE)) return 6
		else return 1
	}
	//========================================================================================================

	
	isFinished(pos: number) {
		if (!this.mapHandler.isOnMainWay()) return false
		return this.game.isFinishPosition(pos)
	}
	/**
	 * 1. mapHandler.onArriveSquare()
	 * 2. check finish position
	 * 3. apply projectile
	 * 	3-1 if projectile makes player ignore obstacle, return ARRIVE_SQUARE_RESULT_TYPE.NONE
	 * 4. onBeforeObs() if not forcemoved
	 * 5. apply obstacle
	 *
	 *
	 * @param isForceMoved
	 * @returns ARRIVE_SQUARE_RESULT_TYPE
	 */
	arriveAtSquare(isForceMoved: boolean): number {
		if (this.dead) {
			return ARRIVE_SQUARE_RESULT_TYPE.DEATH
		}

		if (this.pos < 0) {
			this.pos = 0
		}
		//	console.log("arriveAtSquare" + this.turn)
		this.mapHandler.onArriveSquare(this.pos)

		if (this.isFinished(this.pos)) {
			if (this.effects.has(EFFECT.SLAVE)) {
				this.pos = MAP.getFinish(this.mapId) - 1
				this.killplayer()
				this.sendConsoleMessage(this.name + " has been finally freed from slavery")
				return ARRIVE_SQUARE_RESULT_TYPE.DEATH
			} else {
				this.game.gameover = true
				return ARRIVE_SQUARE_RESULT_TYPE.FINISH
			}
		}

		if (this.game.applyRangeProjectile(this)) return ARRIVE_SQUARE_RESULT_TYPE.NONE

		let isInvisible = this.effects.has(EFFECT.INVISIBILITY)
		let rooted = this.effects.has(EFFECT.ROOT)
		if (!isForceMoved) {
			this.onBeforeObs()
		}

		return this.obstacle(this.game.getObstacleAt(this.pos), isForceMoved, isInvisible, rooted)
	}

	/**
	 *	1. if rooted, return ARRIVE_SQUARE_RESULT_TYPE.STUN 
	 	2. if arrived at store, return ARRIVE_SQUARE_RESULT_TYPE.NONE 
	 *  3. if arrived at finish, return ARRIVE_SQUARE_RESULT_TYPE.FINISH 
	 *  4. if invisible and ignored obstacle, return ARRIVE_SQUARE_RESULT_TYPE.NONE 
	 *  5. receive money and apply obstacle
	 *  6. basic attack(only for legacy AA)
	 * 
	 * @param {*} obs obstacle id
	 * @param {*} isForceMoved whether it is forcemoved
	 * @returns ARRIVE_SQUARE_RESULT_TYPE or obstacle id
	 */
	private obstacle(obs: number, isForceMoved: boolean, isInvisible: boolean, rooted: boolean): number {
		//속박일경우
		if (rooted) {
			if (this.game.setting.legacyAA) this.basicAttack()

			return ARRIVE_SQUARE_RESULT_TYPE.STUN
		} else if (obs === 0) {
			this.invulnerable = true
			//this.effects.apply( EFFECT.SILENT, 1, EFFECT_TIMING.BEFORE_SKILL) //cant use skill in the store

			this.goStore()
			obs = ARRIVE_SQUARE_RESULT_TYPE.NONE
		} else if (obs === -1) {
			obs = ARRIVE_SQUARE_RESULT_TYPE.FINISH
		}
		//투명화:  장애물 무시
		else if (isInvisible) {
			obs = ARRIVE_SQUARE_RESULT_TYPE.NONE
		} else {
			let money = this.game.getMoneyAt(this.pos)
			if (money > 0) {
				this.inven.giveMoney(money)
			}
			obs = ObstacleHelper.applyObstacle(this, obs, isForceMoved)
		}

		if (this.game.setting.legacyAA) this.basicAttack()

		return obs
	}

	/**
	 * if autobuy, buy items
	 * otherwise, send store data to client and activate store button
	 * @param priceMultiplier
	 */
	goStore(priceMultiplier?: number) {
		if (!priceMultiplier) priceMultiplier = 1
		if (this.autoBuy) {
			const util=this.mediator.getOpponentTotalTypeUtility(this)
			this.AiAgent.store(util)
		} else {
			this.game.eventEmitter.goStore(this.turn, this.inven.getStoreData(priceMultiplier))
		}
	}
	/**
	 * levels up if avaliable
	 */
	private checkLevelUp() {
		let respawn = MAP.getRespawn(this.mapId)
		for (let i = 1; i < respawn.length; ++i) {
			if (this.pos >= respawn[i] && this.level <= i && this.mapHandler.isOnMainWay()) {
				this.lvlup()
				break
			}
		}
	}
	//========================================================================================================

	lvlup() {
		this.addMaxHP(ABILITY[this.champ].growth.HP)
		this.level += 1
		this.ability.onLevelUp(this.game.totalnum)

		this.effects.reset(EFFECT.ANNUITY_LOTTERY) //연금복권 끝

		if (this.level === 3) {
			this.skillManager.cooltime[2] = 1

			if (this.mapId === MAP_TYPE.RAPID)
				// this.cooltime[2] = 0
				this.skillManager.cooltime[2] = 4
		}
		this.thisLevelDeathCount = 0
	}

	//========================================================================================================

	heal(h: number) {
		this.changeHP_heal(new HPChange(h).setType("heal"))
	}
	//========================================================================================================

	addMaxHP(m: number) {
		//this.transfer(PlayerClientInterface.update, "maxhp", this.turn, m)
		this.MaxHP += m
		this.changeHP_heal(new HPChange(m).setType("maxhpChange"))
	}

	//========================================================================================================

	private addKill(deadplayer: Player) {
		//선취점
		let totalkill = this.mediator.allPlayer().reduce(function (t: number, a: Player) {
			return t + a.kill
		}, 0)
		const fbKillMoney=this.mapId===MAP_TYPE.RAPID?130:100
		const killMoney= this.mapId===MAP_TYPE.RAPID?100:70

		this.inven.onKillEnemy()
		// console.log("--------------addkill" + totalkill)
		if (totalkill === 0) {
			this.inven.giveMoney(fbKillMoney)
			this.sendConsoleMessage(this.name + ", First Blood!")
		} else {
			this.inven.giveMoney(killMoney + 10 * this.thisLifeKillCount + 20 * deadplayer.thisLifeKillCount)
		}
		this.oneMoreDice = true
		// this.diceControl = true
		// this.diceControlCool = SETTINGS.DC_COOL
		this.thisLifeKillCount += 1
		this.incrementKda("k")
		if (this.thisLifeKillCount > this.bestMultiKill) this.bestMultiKill = this.thisLifeKillCount

		// this.giveEffect('speed',1,1)
	}
	/**
	 * display visual effect to client as obstacle effect
	 * @param type
	 */
	obstacleEffect(type: string) {
		this.game.eventEmitter.visualEffect(this.pos, type, -1)
	}

	/**
	 * damage from obstacles
	 * apply obstacle resistance
	 * @param damage
	 * @param type
	 */
	doObstacleDamage(damage: number, type?: string): boolean {
		let changeData = new HPChange(0)

		if (type != null) {
			changeData.setType(type)
			this.obstacleEffect(type)
		}
		damage = this.effects.onObstacleDamage(damage)
		damage *= 1 - this.ability.obsR.get() / 100 //장애물 저항
		damage = Math.floor(damage)
		this.damageRecord.add(new DamageRecord(-1, 2, Math.min(damage, this.HP)))
		return this.doDamage(damage, changeData)
	}
	updateTotalShield(change: number, noindicate: boolean) {
		//	console.log("updateshield" + change)
		this.shield += Math.floor(change)
		if (change === 0) return
		this.game.eventEmitter.changeShield({
			turn: this.turn,
			shield: this.shield,
			change: change,
			indicate: !noindicate,
		})
	}
	/**
	 * shield absorbs damage
	 * @param damage
	 * @returns
	 */
	private shieldDamage(damage: number): number {
		let damageLeft = this.effects.applyShield(damage)
		if (damageLeft > damage) return damage

		this.updateTotalShield(-(damage - damageLeft), false)
		this.statistics.add(STAT.DAMAGE_REDUCED, damage - damageLeft)

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
	 * @param changeData: HPChange
	 * @return 죽으면 true
	 */
	doDamage(damage: number, changeData: HPChange): boolean {
		try {
			
			// if (this.dead || this.invulnerable || damage === 0 || changeData.getSourceTurn() === this.turn) {
			// 	return false
			// }
			
			if (this.dead || this.invulnerable || damage === 0) {
				return false
			}
			//	let predictedHP = this.HP + this.shield - damage

			damage = this.shieldDamage(damage)

			this.effects.onFinalDamage(damage)

			//if(!!changeData.sourcePlayer)
			//	console.log("damage from "+changeData.sourcePlayer.champ_name+" to "+this.champ_name)
			this.changeHP_damage(changeData.setHpChange(-1 * Math.floor(damage)))

			if (this.HP <= 0) {
				this.effects.onLethalDamage()
				let reviveType = this.canRevive()

				if (reviveType == null) {
					this.die(changeData.sourcePlayer)
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

	private canRevive(): string | null {
		if (this.inven.isActiveItemAvailable(ITEM.GUARDIAN_ANGEL)) return "guardian_angel"

		if (this.inven.life > 0) return "life"

		return null
	}
	/**
	 * spend life or item
	 * set player as waiting revival
	 * @param reviveType
	 */
	private prepareRevive(reviveType: string) {
		this.game.eventEmitter.update("waiting_revival", this.turn, "")

		if (reviveType === "life") this.inven.changeLife(-1)

		if (reviveType === "guardian_angel") {
			this.game.eventEmitter.indicateItem(this.turn, ITEM.GUARDIAN_ANGEL)
			this.inven.useActiveItem(ITEM.GUARDIAN_ANGEL)
		}
		this.waitingRevival = true
		this.HP = 0
		this.dead = true
		this.invulnerable = true
	}

	private sendKillInfo(killer: Player | null) {
		// if (this.game.instant) return

		// if (gostore) {
		// 	this.transfer(PlayerClientInterface.goStore, this.turn, this.inven.getStoreData(1))
		// }

		let killData: ServerGameEventFormat.Death = {
			killer: -1,
			turn: this.turn,
			location: this.pos,
			isShutDown: false,
			killerMultiKillCount: 1,
			damages: this.damageRecord.serialize(),
		}

		//상대에게 죽은경우
		if (killer != null) {
			//console.log("sendkillinfo skillfrom " + skillfrom)
			let killerMultiKillCount = killer.thisLifeKillCount
			killer.effects.reset(EFFECT.SLAVE)

			let isShutDown = this.thisLifeKillCount > 1
			killData.isShutDown = isShutDown
			killData.killerMultiKillCount = killerMultiKillCount
			killData.killer = killer.turn
		}

		this.game.eventEmitter.die(killData)
	}

	/**
	 * 1. 메세지 전송
	 * 2. 어시스트 기록
	 * 3. 다음턴데미지, 이펙트, 스킬지속시간, 투사체 초기화
	 * 4. 리스폰지점으로 이동
	 * @param {*} skillfrom 0에서시작
	 */
	private die(skillfrom: Player | null) {
		let killerturn = -1
		if (!skillfrom) {
			this.sendConsoleMessage(this.name + " has been executed!")
			this.statistics.add(STAT.EXECUTED, 1)
		} else {
			killerturn = skillfrom.turn
			this.sendConsoleMessage(skillfrom.name + " killed " + this.name)
			skillfrom.addKill(this)
		}
		this.thisLifeKillCount = 0
		this.game.addKillData(killerturn, this.turn, this.pos)
		this.lifeTime=0
		this.addAssist(killerturn)
		this.HP = 0
		this.dead = true
		this.incrementKda("d")
		this.damagedby = [0, 0, 0, 0]

		this.invulnerable = true
		this.skillManager.onDeath()
		this.mapHandler.onDeath()
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
		this.damageRecord.onDeath()
	}

	//========================================================================================================

	private getRespawnPoint(): number {
		let res = MAP.getRespawn(this.mapId)

		return res[this.level - 1]
	}

	//========================================================================================================
	/**
	 * if it is revial: make HP half only, indicate client that it revived
	 */
	respawn() {
		let health = this.MaxHP
		if (this.waitingRevival) {
			health = Math.floor(health / 2)
			this.statistics.add(STAT.REVIVE, 1)
		}

		this.changeHP_heal(new HPChange(health).setRespawn())
		this.dead = false
		this.invulnerable = false
		//	console.log("revive" + this.HP)
		this.game.eventEmitter.respawn(this.turn, this.pos, this.waitingRevival)

		this.waitingRevival = false
	}

	markDamageFrom(turn: number) {
		this.damagedby[turn] = 3
	}
	//========================================================================================================
	/**
	 * 3턴 이내에 피해를 준 플레이어가 사망
	 * @param {*} skillfrom
	 */
	private addAssist(skillfrom: number) {
		//let assists=[]
		for (let i = 0; i < this.game.totalnum; ++i) {
			if (this.damagedby[i] > 0 && this.turn !== i && skillfrom !== i) {
				// if (skillfrom === i) {
				// 	continue
				// }
				let plyr = this.game.pOfTurn(i)

				plyr.incrementKda("a")
				plyr.inven.giveMoney(25)
				this.sendConsoleMessage(plyr.name + " assist!")
				//assists.push(this.players[i])
			}
		}
		// return assists
	}
	/**
	 * perform basic attack if possible
	 * call mapHandler.onBasicAttack()
	 * @returns true if performed basic attack
	 */
	basicAttack(): boolean {
		if (!this.effects.canBasicAttack()) {
			return false
		}
		let attacked=this.skillManager.basicAttack()

		if(attacked) 
			this.statistics.add(STAT.BASICATTACK, 1)

		return attacked
	}

	aiSkill(callback: Function) {
		this.AiAgent.aiSkill(callback)
	}
	simulationAiSkill() {
		this.AiAgent.simulationAiSkill()
	}
	getTargetParameters() {}

	getCharacterTypeUtility():AbilityUtilityScorecard{

		let util=this.inven.getItemBuildUtility()
		let cats=ABILITY[this.champ].category
		for(let i=0;i<cats.length;i++){
			let weight=AiAgent.CHAR_TYPE_UTILITY_WEIGHTS[cats.length-1][i]
			if(cats[i]==="attack") util.attack=weight*(10+util.attack)
			if(cats[i]==="magic") util.magic=weight*(10+util.magic)
			if(cats[i]==="defence") util.defence=weight*(10+util.defence)
			if(cats[i]==="health") util.health=weight*(10+util.health)
		}
		return util
	}
	/**
	 * called start of every turn,
	 * record all player`s current position of this turn
	 */
	addStatisticRecord() {
		this.statistics.addPositionRecord(this.mapHandler.getPositonForRecord(this.pos))
		this.statistics.addMoneyRecord()
	}

	//0.damagetakenbychamp 1. damagetakenbyobs  2.damagedealt
	//3.healamt  4.moneyearned  5.moneyspent   6.moneytaken  7.damagereduced
	//8 timesrevived 9 timesforcemoved 10 basicattackused  11 timesexecuted

	getTrainIndicator(totalturn: number): Indicator {
		let ind = new Indicator(this.champ)
		ind.damage_per_death = this.statistics.stats[STAT.DAMAGE_DEALT] / Math.max(0.5, this.death)
		ind.damage_reduction_per_gold =
			this.statistics.stats[STAT.DAMAGE_REDUCED] / this.statistics.stats[STAT.MONEY_EARNED]
		ind.damage_reduction_per_turn = this.statistics.stats[STAT.DAMAGE_REDUCED] / totalturn
		ind.damage_per_gold = this.statistics.stats[2] / this.statistics.stats[STAT.MONEY_EARNED]
		ind.end_position = this.pos
		ind.damage_reduction_rate =
			this.statistics.stats[7] / Math.max(1, this.statistics.stats[7] + this.statistics.stats[0])
		ind.heal_per_gold = this.statistics.stats[3] / this.statistics.stats[STAT.MONEY_EARNED]
		ind.kda =(this.kill+this.assist)/Math.max(0.5,this.death)
		//if(this.pos >= this.mapHandler.gamemap.finish)
		//	ind.isWinner=true

		return ind
	}
	getCoreItemBuild(): number[] {
		return this.AiAgent.itemBuild.coreItemBuildRecord
	}
	private normNRound(val:number,divide:number){
		return roundToNearest(val / divide,-3)
	}
	private hasE_01(...ef:EFFECT[]){
		for(const e of ef){
			if(this.effects.has(e)) return 1
		}
		return 0
	}
	private getFinishProximity(finish:number):number{
		let maxStep=6
		if(this.effects.has(EFFECT.SPEED)) maxStep+=2
		maxStep+=this.ability.moveSpeed.val
		if(this.effects.has(EFFECT.SLOW)) maxStep-=2
		if(this.effects.has(EFFECT.DOUBLEDICE)) maxStep*=2
		let diff=Math.max(0.5,finish-this.pos)

		let proximity=0

		if(diff <= maxStep*2) proximity=maxStep/diff

		
		if(this.waitingRevival || this.effects.has(EFFECT.INVISIBILITY) || this.effects.has(EFFECT.SHIELD)) proximity *=2
		
		proximity *= this.hasE_01(EFFECT.ROOT,EFFECT.GROUNGING,EFFECT.BACKDICE) * 0.5
		proximity *= this.hasE_01(EFFECT.SLAVE) *0.25
		
		if(this.game.thisturn===this.turn) proximity*=3

		return proximity 

	}
	getStateLabel(finish: number): string {
		let states=[
			this.champ,
			this.normNRound(this.pos , finish),
			roundToNearest(this.normNRound(this.pos , finish)**2,-3) ,
			this.normNRound(this.statistics.stats[STAT.MONEY_SPENT],300),
			this.normNRound(this.statistics.stats[STAT.MONEY_EARNED],300),
			(this.dead)?0:1,
			this.normNRound(this.kill,5),
			this.normNRound(this.death , 5),
			this.normNRound(this.level , 10),
			this.normNRound(this.HP, 500),
			(this.inven.life>0 || this.inven.isActiveItemAvailable(ITEM.GUARDIAN_ANGEL))?1:0,
			this.getFinishProximity(finish)
		]

		let str=""
		states.forEach((val,i)=>{
			if(i===0) str+=val
			else return str+=","+val
		},"")
		return str
	}
}

export { Player }
