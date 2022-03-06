// import oceanmap = require("../res/ocean_map.json")
// import casinomap = require("../res/casino_map.json")
// import defaultmap = require("../res/map.json")
import obsInfo = require("../res/obstacles.json")
import SETTINGS = require("../res/globalsettings.json")
import * as ENUM from "./enum"
import * as Util from "./Util"
import { Game, MAP } from "./Game"
import { Projectile } from "./Projectile"
import Ability from "./PlayerAbility"
import PlayerStatistics from "./PlayerStatistics"
import PlayerMapData from "./PlayerMapData"
import PlayerInventory from "./PlayerInventory"
import {PlayerStatusEffects,ShieldEffect} from "./PlayerStatusEffect"
import {PlayerClientInterface} from "./app"
import {ObstacleHelper,AIHelper} from "./helpers"

//for test only
const LVL = 1
const POS = 0



//anything that has its own HP
abstract class Entity{
	game: Game
	mapId: number
	pos: number
	HP: number
	MaxHP: number
	constructor(game:Game,basic_stats:number[]){
		this.game = game
		this.mapId = game.mapId
		this.HP=basic_stats[0]
		this.MaxHP=basic_stats[0]
	}

}

// class Minion extends Entity{
// 	constructor(){
// 		super(null,null)
// 	}
// 	hi(){

// 	}
// }

abstract class Player extends Entity{
	//game: Game
//	players: Player[]
//	mapId: number
	AI: boolean
	turn: number
	name: string
	champ: number
	champ_name: string
	team: boolean | string
//	pos: number
	lastpos: number
	dead: boolean
	level: number

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
	ability: Ability
	statistics: PlayerStatistics
	inven:PlayerInventory
	effects:PlayerStatusEffects
	mapdata:PlayerMapData
	shield: number
	cooltime: number[]
	duration: number[]
	projectile: Projectile[]
	//0.slow 1.speed 2.stun 3.silent 4. shield  5.poison  6.radi  7.annuity 8.slave
	// loanTurnLeft: number


	damagedby: number[]
	//for eath player, turns left to be count as assist(maximum 3)

	bestMultiKill: number

	transfer:Function

	abstract readonly hpGrowth: number	
	abstract readonly cooltime_list: number[]
	abstract itemtree: {
		level: number
		items: number[]
		final: number
	}
	abstract readonly duration_list:number[]

	abstract getSkillInfoKor(): string[]
	abstract getSkillInfoEng(): string[]
	abstract getSkillTrajectorySpeed(s: string): number
	abstract getSkillTargetSelector(skill: number): Util.SkillTargetSelector
	abstract getSkillProjectile(target: number): Projectile
	abstract getSkillDamage(target: number): Util.SkillDamage
	abstract passive(): void
	abstract getSkillName(skill: number): string
	abstract onSkillDurationCount(): void
	abstract onSkillDurationEnd(skill: number): void
	abstract aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number }

	constructor(
		turn: number,
		team: boolean | string,
		game: Game,
		ai: boolean,
		char: number,
		name: string,
		basic_stats: number[]
	) {
		super(game,basic_stats)
		this.AI = ai //AI여부
		this.turn = turn //턴 (0에서 시작)
		this.name = name //이름
		this.champ = char //챔피언 코드
		this.champ_name = SETTINGS.characters[char].name //챔피언 이름
		this.team = team //0:readteam  1:blue
		this.pos = POS //현재위치
		this.lastpos = 0 //이전위치
		this.dead = false
		this.level = LVL //레벨, 1에서시작
		
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
		this.ability = new Ability(this, basic_stats)
		this.statistics = new PlayerStatistics(this)
		this.inven=new PlayerInventory(this)
		this.effects=new PlayerStatusEffects(this)
		this.mapdata=new PlayerMapData(this)

		this.shield = 0

		this.cooltime = [0, 0, 0]
		this.duration = [0, 0, 0]
		// this.loanTurnLeft = 0

		this.damagedby = [0, 0, 0, 0]
		//for eath player, turns left to be count as assist(maximum 3)
		this.projectile = []
		this.bestMultiKill = 0
		this.transfer=function(func:Function,...args:any[]){
			this.game.sendToClient(func,...args)
		}
	}

	
	distance(p1: Player, p2: Player): number {
		return Math.abs(p1.pos - p2.pos)
	}

	getPlayer(): Player {
		return this
	}
	message(text: string) {
		this.transfer(PlayerClientInterface.message,text)
	}


	calculateAdditionalDice(amount:number): number {
		let first: Player = this.game.playerSelector.getFirstPlayer()

		//자신이 1등보다 15칸이상 뒤쳐져있으면 주사위숫자 2 추가,
		//자신이 1등보다 30칸이상 뒤쳐져있으면 주사위숫자 4 추가
		//자신이 1등보다 레벨이 2 낮으면 주사위숫자 5 추가
		//역주사위 효과 있을시 추가안함
		if (this.pos + 15 < first.pos && !this.effects.has(ENUM.EFFECT.BACKDICE) && first.mapdata.onMainWay) {
			this.adice += amount
			if (this.pos + 30 < first.pos) {
				this.adice += amount
			}
			if (this.level + 1 < first.level) {
				this.adice += Math.floor(amount*1.5)
			}
		}
		this.adice += this.ability.moveSpeed

		//장화 아이템
		if ((this.inven.haveItem(ENUM.ITEM.BOOTS) ||
		 this.inven.haveItem(ENUM.ITEM.BOOTS_OF_HASTE))
		 && this.game.playerSelector.isLast(this)) {
			this.adice += 1
		}

		//동레벨서 2~3번이상사망시 주사위2배 상시부여
		if ((this.thisLevelDeathCount >= 3 && this.level < 4) 
		|| (this.thisLevelDeathCount >= 2 && this.level < 2) 
		|| (this.thisLevelDeathCount >= 7)) {

			this.effects.apply(ENUM.EFFECT.DOUBLEDICE, 1,ENUM.EFFECT_TIMING.TURN_START)
		}
		//	 this.applyEffectBeforeDice(ENUM.EFFECT.DOUBLEDICE, 1)
		return this.adice
	}
	getAiTarget(targets:number[]){
		return AIHelper.getAiTarget(this,targets)
	}
	getAiProjPos(skilldata: any, skill: number){
		return AIHelper.getAiProjPos(this,skilldata,skill)
	}


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
		if (this.game.instant) return
		this.game.sendToClient(PlayerClientInterface.visualEffect, this.turn, type, source)
	}
	//========================================================================================================
	onTurnStart() {
		this.passive()
		this.inven.giveTurnMoney(MAP.getTurnGold(this.mapId,this.level))
	}
	//========================================================================================================
	onBeforeObs() {
		if (this.oneMoreDice) {
			return
		}

		this.invulnerable = false
		this.mapdata.onBeforeObs()

		for (let p of this.projectile) {
			p.projCoolDown()
		}
		// if (this.loanTurnLeft === 1) {
		// 	this.inven.takeMoney(400)
		// }
		// this.loanTurnLeft = Math.max(0, this.loanTurnLeft - 1)

		this.cooltime = this.cooltime.map(Util.decrement)
		this.effects.onBeforeObs()
		
	}

	//========================================================================================================

	onAfterObs() {
		if (this.oneMoreDice) {
			return
		}
		this.onSkillDurationCount()

		this.decrementAllSkillDuration()
		
		
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

	onTurnEnd() {
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
		this.transfer(PlayerClientInterface.update, "dc_item", this.turn, 1)

	}
	useDiceControl() {
		this.diceControlCool = 0
		this.diceControl = false
		this.transfer(PlayerClientInterface.update, "dc_item", this.turn, -1)

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
	 * @returns
	 */
	changePos(pos: number): boolean {
		if (this.mapdata.doMineDamage()) return true

		if (pos < 0) {
			pos = 0
		}
		if (pos >= MAP.getFinish(this.mapId) && this.mapdata.onMainWay) {
			pos = MAP.getFinish(this.mapId)
		}

		this.pos = pos
		this.lvlup()

		return false
	}

	forceMove(pos: number, ignoreObstacle: boolean, movetype: string) {
		this.statistics.add(ENUM.STAT.FORCEMOVE, 1)
		this.adice = 0
		this.game.pendingObs = 0 //강제이동시 장애물무시
		this.mapdata.checkWay2OnForceMove(pos)

		this.changePos(pos)

		this.effects.reset(ENUM.EFFECT.STUN)
		this.invulnerable = false
		// this.stun = false

		let t = this.turn
		this.transfer(PlayerClientInterface.tp,t, pos, movetype)


		if (!ignoreObstacle) {
			if (this.game.instant) {
				this.arriveAtSquare(true)
			} else {
				setTimeout(
					() => {
						this.arriveAtSquare(true)
					},
					movetype === "simple" ? 700 : 1100
				)
			}
		} else if (this.game.mapId === ENUM.MAP_TYPE.CASINO) {
			this.mapdata.checkSubway()
		}
	}

	isBehindOf(other: Player): boolean {
		return this.pos < other.pos
	}
	//========================================================================================================

	resetCooltime(list: number[]) {
		this.message(this.name + "`s cooltime has been reset")
		for (let i of list) {
			this.cooltime[i] = 0
		}
	}
	/**
	 * 스킬사용후 쿨타임 시작
	 * @param {} skill 스킬종류,0에서시작
	 */
	startCooltime(skill: number) {
		this.cooltime[skill] = this.cooltime_list[skill]
		if (skill === ENUM.SKILL.ULT) {
			this.cooltime[skill] -= this.ability.ultHaste
		}
	}
	startDuration(skill:ENUM.SKILL){
		this.duration[skill] = this.duration_list[skill]
	}
	/**
	 *
	 * @param skill skill
	 * @param amt has to be positive
	 */
	setCooltime(skill: number, amt: number) {
		this.cooltime[skill] = amt
	}

	isSkillActivated(skill: number) {
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

		if (this.game.instant) return
		this.transfer(PlayerClientInterface.update, "kda", this.turn, str)

	}

	/**
	 * 캐릭터 외형 변경
	 * @param name name of that apperance
	 * set to default if name===""
	 */
	changeApperance(name: string) {
		this.transfer(PlayerClientInterface.update, "appearance", this.turn, name)
	//	console.log("changeApperance"+name)
	}

	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data Util.HPChangeData

   */
	changeHP_damage(data: Util.HPChangeData) {
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

		if (this.game.instant) return

		let isblocked = data.hasFlag(Util.HPChangeData.FLAG_SHIELD)

		if (hp <= 0 || isblocked || data.hasFlag(Util.HPChangeData.FLAG_NODMG_HIT)) {
			let hpChangeData = {
				turn: this.turn,
				hp: hp,
				maxhp: data.maxHp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				skillfrom: data.source,
				type: data.type,
				needDelay: data.needDelay,
				killed: data.killedByDamage,
				willRevive: data.willRevive,
				skillTrajectorySpeed: data.skillTrajectorySpeed,
				isBlocked: isblocked
			}

			this.transfer(PlayerClientInterface.changeHP_damage,hpChangeData)

		}
	}

	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data Util.HPChangeData

   */
	changeHP_heal(data: Util.HPChangeData) {
		if (!data.isRespawn && this.dead) {
			return
		}
		let hp = data.hp
		this.statistics.add(ENUM.STAT.HEAL_AMT, hp)

		this.MaxHP += data.maxHp
		this.HP = Math.min(this.HP + hp, this.MaxHP)

		if (this.game.instant) return
		if (hp > 0) {
			let changeData = {
				turn: this.turn,
				hp: hp,
				maxhp: data.maxHp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				skillfrom: data.source,
				type: data.type
			}
			this.transfer(PlayerClientInterface.changeHP_heal, changeData)

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

		if (this.game.mapId === ENUM.MAP_TYPE.CASINO) {
			this.mapdata.checkSubway()
		}

		if (this.pos >= MAP.getFinish(this.mapId) && this.mapdata.onMainWay) {
			if (this.effects.has(ENUM.EFFECT.SLAVE)) {
				this.pos = MAP.getFinish(this.mapId) - 1
				this.killplayer()
				this.message(this.name + " has been finally freed from slavery")
				return 0
			} else {
				this.game.gameover = true
				return ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
			}
		}

		

		if(this.game.applyProjectile(this)) 
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		
		let obs = this.game.shuffledObstacles[this.pos].obs
		//속박일경우
		if (this.effects.has(ENUM.EFFECT.STUN)) {
			//특정 장애물은 속박무시
			if (SETTINGS.ignoreStunObsList.includes(obs)) {
				if(!isForceMoved || !this.game.setting.AAOnForceMove)
					this.basicAttack()

				return ENUM.ARRIVE_SQUARE_RESULT_TYPE.STUN
			}
		}

		obs = this.obstacle(obs, isForceMoved)

		if(!isForceMoved || !this.game.setting.AAOnForceMove)
			this.basicAttack()

		return obs
	}

	/**

	 */
	/**
	 *
	 * @param {*} obs obstacle id
	 * @param {*} isForceMoved whether it is forcemoved
	 * @returns
	 */
	obstacle(obs: number, isForceMoved: boolean): number {
		
		//  if(obs===-1){return 'finish'}
		if (obs === 0) {
			this.invulnerable = true
			this.effects.apply(ENUM.EFFECT.SILENT, 1,ENUM.EFFECT_TIMING.BEFORE_SKILL)//cant use skill in the store

			this.goStore(false)
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.STORE
		}
		//투명화   해로운 장애물일경우만 무시
		if (this.effects.has(ENUM.EFFECT.INVISIBILITY) && obsInfo.obstacles[obs].val < 0) {
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}

		let money = this.game.shuffledObstacles[this.pos].money * 10
		if (money > 0) {
			this.inven.giveMoney(money)
		}

		obs=ObstacleHelper.applyObstacle(this,obs,isForceMoved)
		return obs
	}

	goStore(street_vendor: boolean) {
		if (this.game.instant) return
		this.transfer(PlayerClientInterface.goStore,  this.turn, this.inven.getStoreData(street_vendor ? 1.1 : 1))

	}
	
	//========================================================================================================
	/**
	 * levels up if avaliable
	 */
	lvlup() {
		let respawn = MAP.getRespawn(this.mapId)
		for (let i = 1; i < respawn.length; ++i) {
			if (this.pos >= respawn[i] && this.level <= i && this.mapdata.onMainWay) {
				this.addMaxHP(this.hpGrowth)
				this.level += 1
				this.ability.onLevelUp(this.game.totalnum * 5)

				this.effects.reset(ENUM.EFFECT.ANNUITY_LOTTERY) //연금복권 끝

				if (this.level === 3) {
					this.cooltime[2] = 4
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
		this.changeHP_heal(new Util.HPChangeData().setMaxHpChange(m))
	}



	//========================================================================================================

	addKill(deadplayer: Player) {
		this.incrementKda("k")
		//선취점
		let totalkill = this.game.playerSelector.getAll().reduce(function (t, a) {
			return t + a.kill
		}, 0)
		if (totalkill === 0) {
			this.inven.giveMoney(100)
			this.message(this.name + ", First Blood!")
		} else {
			this.inven.giveMoney(
				70 + 10 * this.thisLifeKillCount + 20 * deadplayer.thisLifeKillCount
			)
		}
		this.oneMoreDice = true
		// this.diceControl = true
		// this.diceControlCool = SETTINGS.DC_COOL
		this.thisLifeKillCount += 1

		if (this.thisLifeKillCount > this.bestMultiKill) this.bestMultiKill = this.thisLifeKillCount

		// this.giveEffect('speed',1,1)
	}

	/**
	 * sterp before givedamage
	 * @param damage
	 * @param origin
	 * @param type
	 * @param needDelay
	 * @param flags
	 */
	doPlayerDamage(
		damage: number,
		origin: number,
		type: string,
		needDelay: boolean,
		flags?: number[]
	): boolean {
		let changeData = new Util.HPChangeData()
			.setSource(origin)
			.setType(type)
			.setSkillTrajectorySpeed(this.game.playerSelector.get(origin).getSkillTrajectorySpeed(type))

		if (needDelay) changeData.setDelay()
		if (flags != null) {
			for (let f of flags) {
				changeData.addFlag(f)
			}
		}

		return this.doDamage(damage, changeData)
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
		}
		damage=this.effects.onObstacleDamage(damage)

		return this.doDamage(damage, changeData)
	}
	updateTotalShield(change: number, noindicate: boolean) {
		
	//	console.log("updateshield" + change)
		this.shield += Math.floor(change)
		if (this.game.instant || change==0) return
		this.transfer(PlayerClientInterface.changeShield,{
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
		let damageLeft=this.effects.applyShield(damage)
		
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
	doDamage(damage: number, changeData: Util.HPChangeData) {
		try {
			if (damage === 0 && changeData.hasFlag(Util.HPChangeData.FLAG_SHIELD)) {
				this.changeHP_damage(changeData)
				return false
			} else if (changeData.hasFlag(Util.HPChangeData.FLAG_NODMG_HIT)) {
				this.changeHP_damage(changeData)
				return false
			}

			if (this.invulnerable || damage === 0) {
				return false
			}

			// if (this.effects.has(ENUM.EFFECT.RADI)) {
			// 	damage *= 2
			// }
			if (changeData.source >= 0) {
				this.damagedby[changeData.source] = 3
				this.game.playerSelector.get(changeData.source).ability.absorb_hp(damage) //모든피해흡혈, 어시스트저장
			} else if (changeData.source === -1) {
				damage *= 1 - this.ability.obsR / 100 //장애물 저항
			}
			let predictedHP = this.HP + this.shield - damage

			//방패검 아이템
	//		console.log("predictedHP"+predictedHP)
			if (predictedHP < this.MaxHP * 0.05 && this.ability.AD * -0.7 < predictedHP && this.inven.isActiveItemAvaliable(ENUM.ITEM.WARRIORS_SHIELDSWORD)) {
				console.log("WARRIORS_SHIELDSWORD")
				this.effects.applySpecial(new ShieldEffect(2, Math.floor(0.7 * this.ability.AD)).setId(ENUM.EFFECT.ITEM_SHIELDSWORD),"item_shieldsword")
				this.inven.useActiveItem(ENUM.ITEM.WARRIORS_SHIELDSWORD)
				this.transfer(PlayerClientInterface.indicateItem,this.turn, ENUM.ITEM.WARRIORS_SHIELDSWORD)

			}

			damage = this.shieldDamage(damage)
			if (damage === 0) {
				this.showEffect(changeData.type, changeData.source)
				return false
			}
				

			predictedHP = this.HP - damage

			//투명망토 아이템
			if (predictedHP > 0 && predictedHP < this.MaxHP * 0.3 && this.inven.isActiveItemAvaliable(ENUM.ITEM.INVISIBILITY_CLOAK)) {
				this.effects.apply(ENUM.EFFECT.INVISIBILITY, 1,ENUM.EFFECT_TIMING.TURN_END)
				this.inven.useActiveItem(ENUM.ITEM.INVISIBILITY_CLOAK)
				this.transfer(PlayerClientInterface.indicateItem,this.turn, ENUM.ITEM.INVISIBILITY_CLOAK)

			}

			let reviveType = this.canRevive()
			if (predictedHP <= 0) {
				if (reviveType == null) {
					changeData.setKilled()
				} else {
					//revive
					changeData.setWillRevive()
				}
			}
			this.changeHP_damage(changeData.setHpChange(-1 * Math.floor(damage)))

			if (this.HP <= 0) {
				this.effects.onLethalDamage()

				if (reviveType == null) {
					this.die(changeData.source)
					if (changeData.source >= 0) {
						this.game.playerSelector.get(changeData.source).addKill(this)
						this.thisLifeKillCount = 0
					} else {
						this.statistics.add(ENUM.STAT.EXECUTED, 1)
					}
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
		if (this.inven.isActiveItemAvaliable(ENUM.ITEM.GUARDIAN_ANGEL)) return "guardian_angel"

		if (this.inven.life > 0) return "life"

		return null
	}

	prepareRevive(reviveType: string) {
		if (reviveType === "life") this.inven.changeLife(-1)

		if (reviveType === "guardian_angel") 
			{
				this.transfer(PlayerClientInterface.indicateItem,this.turn,ENUM.ITEM.GUARDIAN_ANGEL)
				this.inven.useActiveItem(ENUM.ITEM.GUARDIAN_ANGEL)
			}
		this.waitingRevival = true
		this.HP = 0
		this.dead = true
	}

	sendKillInfo(skillfrom: number, gostore: boolean) {
		if (this.game.instant) return

		let storeData = null
		if (gostore) {
			storeData = this.inven.getStoreData(1)
		}
		let killData = {
			skillfrom: skillfrom,
			turn: this.turn,
			location: this.pos,
			storeData: storeData,
			isShutDown: false,
			killerMultiKillCount: 1
		}

		//상대에게 죽은경우
		if (skillfrom >= 0) {
			//console.log("sendkillinfo skillfrom " + skillfrom)
			let killerMultiKillCount = this.game.playerSelector.get(skillfrom).thisLifeKillCount + 1
			let isShutDown = this.thisLifeKillCount > 1
			killData.isShutDown = isShutDown
			killData.killerMultiKillCount = killerMultiKillCount
		}
		this.transfer(PlayerClientInterface.die,killData)

	}

	/**
	 * 1. 메세지 전송
	 * 2. 어시스트 기록
	 * 3. 다음턴데미지, 이펙트, 스킬지속시간, 투사체 초기화
	 * 4. 리스폰지점으로 이동
	 * @param {*} skillfrom 0에서시작
	 */
	die(skillfrom: number) {
		if (skillfrom > 0) {
			this.message(this.game.playerSelector.get(skillfrom).name + " killed " + this.name)
		} else {
			this.message(this.name + " has been executed!")
		}
		this.game.addKillData(skillfrom, this.turn, this.pos)

		this.Assist(skillfrom)
		this.HP = 0
		this.dead = true
		this.mapdata.onDeath()
		this.incrementKda("d")
		this.damagedby = [0, 0, 0, 0]

		this.setAllSkillDuration([0, 0, 0])
		this.invulnerable = true
		this.effects.onDeath()
		this.oneMoreDice = false
		for (let p of this.projectile) {
			p.remove()
		}
		this.projectile = []
		this.thisLevelDeathCount += 1

		this.pos = this.getRespawnPoint()
	//	console.log("respawn pos" + this.pos)
		//this.giveEffect('silent',1,-1)
		let gostore = MAP.getStore(this.mapId).includes(this.pos)
		if (gostore && this.AI) {
			AIHelper.aiStore(this)
		}

		this.sendKillInfo(skillfrom, gostore)
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
			health =Math.floor(health/2)
			this.statistics.add(ENUM.STAT.REVIVE, 1)
		}

		this.changeHP_heal(new Util.HPChangeData().setHpChange(health).setRespawn())
		this.dead = false
	//	console.log("revive" + this.HP)
		this.transfer(PlayerClientInterface.respawn,this.turn, this.pos, this.waitingRevival)


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
				if (skillfrom === i) {
					continue
				}
				let plyr=this.game.playerSelector.get(i)

				plyr.incrementKda("a")
				plyr.inven.giveMoney(25)
				this.message(plyr.name + " assist!")
				//assists.push(this.players[i])
			}
		}
		// return assists
	}

	dealDamageTo(target: Player, damage: Util.Damage, damageType: string, name: string): boolean {
		

		//다이아몬드 기사 아이템
	// 	if (this.inven.haveItem(32)) {
	// 		this.ability.addMaxHP(5)
	// //		this.transfer(PlayerClientInterface.indicateItem,this.turn,32)
	// 	}

		let flags = []
		let needDelay=true
		if (damageType == "skill") {
			//this.ability.applyAttackAdditionalDamage(damage,target)

			damage=this.effects.onSkillHit(damage,target)
			damage=target.effects.onSkillDamage(damage,this.turn)

		//	this.ability.applySkillDmgReduction(damage)

			if (damage.getTotalDmg() === 0) {
				flags.push(Util.HPChangeData.FLAG_NODMG_HIT)
			}


		} else if (damageType == "basicattack") {
		//	this.ability.applyAttackAdditionalDamage(damage,target)

			damage=this.effects.onBasicAttackHit(damage,target)
			damage=target.effects.onBasicAttackDamage(damage,this.turn)

		} else if(damageType==="tick"){
			needDelay=false
			flags.push(Util.HPChangeData.FLAG_TICKDMG)
		}

		let calculatedDmg = this.ability.applyResistanceToDamage(damage, target)

		// if (this.effects.hasEffectFrom(ENUM.EFFECT.GHOST_ULT_DAMAGE, target.turn)) {
		// 	damage.updateNormalDamage(Util.CALC_TYPE.multiply, 0.5)
		// }

		target.statistics.add(ENUM.STAT.DAMAGE_REDUCED, damage.getTotalDmg() - calculatedDmg)
		this.statistics.add(ENUM.STAT.DAMAGE_DEALT, calculatedDmg)

		return target.doPlayerDamage(calculatedDmg, this.turn, name, needDelay, flags)
	}

	getBaseBasicAttackDamage(): Util.Damage {
		return new Util.Damage(this.ability.AD, 0, 0)
	}
	getBasicAttackName(): string {
		return "basicattack"
	}

	basicAttack() {
		let range = this.ability.attackRange

		let cancounterattack = []
		for (let p of this.game.playerSelector.getAll()) {
			if (Math.abs(this.pos - p.pos) <= range && this.game.playerSelector.isValidOpponent(this,p)) {
				this.hitBasicAttack(p, false)
				cancounterattack.push(p)
			}
		}

		for (let p of cancounterattack) {
			if (!p.dead && p.pos === this.pos && p.turn !== this.turn) {
				p.hitBasicAttack(this, true)
			}
		}
	}
	//========================================================================================================

	hitBasicAttack(target: Player, isCounterAttack: boolean): boolean {
		//console.log("hitBasicAttack"+target.name+"  "+this.name)

		if (!this.effects.canBasicAttack()) {
			return false
		}


		let damage: Util.Damage = this.ability.basicAttackDamage(target)

		//지하철에서는 평타피해 40% 감소
		if (this.game.mapId === ENUM.MAP_TYPE.CASINO && this.mapdata.isInSubway) {
			damage = damage.updateAttackDamage(Util.CALC_TYPE.multiply, 0.6)
		}
		//맞공격시 피해 절반
		if (isCounterAttack) {
			if(this.game.setting.AAcounterAttackStrength==0)
				return false

			damage = damage.updateAttackDamage(Util.CALC_TYPE.multiply, 0.5 * this.game.setting.AAcounterAttackStrength)
		}
		this.statistics.add(ENUM.STAT.BASICATTACK, 1)

		return this.dealDamageTo(target, damage, "basicattack", this.getBasicAttackName())
	}
	//========================================================================================================


	hitOneTarget(target: number, skilldmgdata: Util.SkillDamage) {

		let effectname = this.getSkillName(skilldmgdata.skill)

		let died = this.game.playerSelector.get(target).hitBySkill(skilldmgdata.damage,effectname,this.turn,skilldmgdata.onHit)
		if (died && skilldmgdata.onKill) {
			skilldmgdata.onKill()
		}

	}

	/**
	 * 
	 * @param skilldmg Damage
	 * @param effectname //스킬별 이펙트표시를 위한 이름
	 * @param source 
	 * @param onHit 
	 * @returns isdead
	 */
	hitBySkill(skilldmg: Util.Damage,effectname:string, source: number,onHit?:Function): boolean {
		//방어막 효과
		if (this.effects.has(ENUM.EFFECT.SHIELD)) {
			//console.log("shield")
			this.effects.reset(ENUM.EFFECT.SHIELD)
			this.doPlayerDamage(0, source, effectname, true, [Util.HPChangeData.FLAG_SHIELD])
			return false
		}

		if (onHit != null) {
			onHit(this)
		}
		let died = this.game.playerSelector.get(source).dealDamageTo(this, skilldmg, "skill", effectname)

		return died
	}
	//========================================================================================================

	



}

export { Player }
