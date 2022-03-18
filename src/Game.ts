import oceanmap = require("../res/ocean_map.json")
import casinomap = require("../res/casino_map.json")
import defaultmap = require("../res/map.json")
import SETTINGS = require("../res/globalsettings.json")
import GAMESETTINGS = require("../res/gamesetting.json")
import { ISimulationSetting } from "./SimulationRunner"
import * as ENUM from "./enum"
import * as Util from "./Util"
import { Player } from "./player"
import { Projectile, ProjectileBuilder, RangeProjectile, PassProjectile } from "./Projectile"
// import { PassProjectile } from "./PassProjectile"
import { PlayerSelector, ObstacleHelper, AIHelper } from "./helpers"

import { Creed } from "./characters/Creed"
import { Bird } from "./characters/Bird"
import { Silver } from "./characters/Silver"
import { Jean } from "./characters/Jean"
import { Jellice } from "./characters/Jellice"
import { Gorae } from "./characters/Gorae"
import { Timo } from "./characters/Timo"
import { Yangyi } from "./characters/Yangyi"
import { SummonedEntity } from "./characters/SummonedEntity/SummonedEntity"
import { PlayerClientInterface } from "./app"
import { Tree } from "./characters/Tree"
const MAP: Util.MapStorage = new Util.MapStorage([defaultmap, oceanmap, casinomap])
const STATISTIC_VERSION = 3
//version 3: added kda to each category

interface IGameSetting {
	itemLimit: number
	extraResistanceAmount: number
	additionalDiceAmount: number
	useAdditionalLife: boolean
	AAOnForceMove: boolean
	AAcounterAttackStrength: number
	autoNextTurnOnSilent: boolean
	diceControlItemFrequency: number
	shuffleObstacle: boolean

	killRecord: boolean
	itemRecord: boolean
	positionRecord: boolean
	moneyRecord: boolean
}
class GameSetting {
	instant: boolean
	isTeam: boolean
	GameSpeed: number

	itemLimit: number
	extraResistanceAmount: number
	additionalDiceAmount: number
	useAdditionalLife: boolean
	AAOnForceMove: boolean
	AAcounterAttackStrength: number
	autoNextTurnOnStore: boolean
	autoNextTurnOnSilent: boolean
	diceControlItemFrequency: number
	shuffleObstacle: boolean

	killRecord: boolean
	itemRecord: boolean
	positionRecord: boolean
	moneyRecord: boolean
	constructor(setting: IGameSetting, instant: boolean, isTeam: boolean) {
		this.instant = instant
		this.isTeam = isTeam

		if (setting === null) {
			this.randomize()
			this.autoNextTurnOnStore = true
			this.autoNextTurnOnSilent = true
			this.killRecord = true
			this.itemRecord = true
			this.positionRecord = true
			this.moneyRecord = true
			this.itemLimit = 6
			return
		}

		this.itemLimit = setting.itemLimit
		this.extraResistanceAmount = setting.extraResistanceAmount
		this.additionalDiceAmount = setting.additionalDiceAmount
		this.useAdditionalLife = setting.useAdditionalLife
		this.AAOnForceMove = setting.AAOnForceMove
		this.AAcounterAttackStrength = setting.AAcounterAttackStrength
		this.autoNextTurnOnSilent = setting.autoNextTurnOnSilent
		this.diceControlItemFrequency = setting.diceControlItemFrequency
		this.shuffleObstacle = setting.shuffleObstacle

		this.killRecord = setting.killRecord
		this.itemRecord = setting.itemRecord
		this.positionRecord = setting.positionRecord
		this.moneyRecord = setting.moneyRecord
	}

	randomize() {
		this.extraResistanceAmount = Util.randInt(GAMESETTINGS.gameplaySetting.extraResistanceAmount.options.length)
		this.additionalDiceAmount = Util.randInt(GAMESETTINGS.gameplaySetting.additionalDiceAmount.options.length)
		this.useAdditionalLife = Util.randomBoolean()
		this.AAOnForceMove = Util.randomBoolean()
		this.AAcounterAttackStrength = Util.randInt(GAMESETTINGS.gameplaySetting.AAcounterAttackStrength.options.length)
		this.diceControlItemFrequency = Util.randInt(GAMESETTINGS.gameplaySetting.diceControlItemFrequency.options.length)
		this.shuffleObstacle = Util.randomBoolean()
		return this
	}

	setSimulationSettings(setting: ISimulationSetting) {
		this.killRecord = setting.killRecord
		this.itemRecord = setting.itemRecord
		this.positionRecord = setting.positionRecord
		this.moneyRecord = setting.moneyRecord
	}
	getInitialSetting() {
		return {
			itemLimit: this.itemLimit,
			useAdditionalLife: this.useAdditionalLife,
			autoNextTurnOnSilent: this.autoNextTurnOnSilent
		}
	}

	getSummary() {
		return [
			{ name: "itemLimit", value: this.itemLimit },
			{
				name: "extraResistanceAmount",
				value: GAMESETTINGS.gameplaySetting.extraResistanceAmount.options[this.extraResistanceAmount]
			},
			{
				name: "additionalDiceAmount",
				value: GAMESETTINGS.gameplaySetting.additionalDiceAmount.options[this.additionalDiceAmount]
			},
			{ name: "useAdditionalLife", value: this.useAdditionalLife },
			{ name: "AAOnForceMove", value: this.AAOnForceMove },
			{
				name: "AAcounterAttackStrength",
				value: GAMESETTINGS.gameplaySetting.AAcounterAttackStrength.options[this.AAcounterAttackStrength]
			},
			{
				name: "diceControlItemFrequency",
				value: GAMESETTINGS.gameplaySetting.diceControlItemFrequency.options[this.diceControlItemFrequency]
			},
			{ name: "shuffleObstacle", value: this.shuffleObstacle }
		]
	}
}

class PlayerFactory {
	static create(character_id: number, name: string, turn: number, team: string | boolean, game: Game, isAI: boolean) {
		switch (character_id) {
			case 0:
				return new Creed(turn, team, game, isAI, name)
			case 1:
				return new Silver(turn, team, game, isAI, name)
			case 2:
				return new Timo(turn, team, game, isAI, name)
			case 3:
				return new Yangyi(turn, team, game, isAI, name)
			case 4:
				return new Jean(turn, team, game, isAI, name)
			case 5:
				return new Jellice(turn, team, game, isAI, name)
			case 6:
				return new Gorae(turn, team, game, isAI, name)
			case 7:
				return new Bird(turn, team, game, isAI, name)
			case 8:
				return new Tree(turn, team, game, isAI, name)
			default:
				return new Creed(turn, team, game, isAI, name)
		}
	}
}

class Game {
	readonly instant: boolean //readonly: can only assign value in constructor
	readonly rname: string
	readonly mapId: number
	readonly simulation: boolean
	readonly itemLimit: number
	readonly isTeam: boolean
	readonly shuffledObstacles: { obs: number; money: number }[]
	readonly setting: GameSetting

	PNUM: number
	CNUM: number
	totalnum: number
	thisturn: number
	skilldmg: any
	skillcount: number
	clientsReady: number
	pendingObs: number
	pendingAction: string
	roullete_result: number
	nextUPID: number
	UPIDGen: Util.UniqueIdGenerator
	UEIDGen: Util.UniqueIdGenerator

	// nextPassUPID: number
	rangeProjectileList: Map<string, RangeProjectile>
	passProjectileList: Map<string, PassProjectile>
	passProjectileQueue: PassProjectile[]
	gameover: boolean

	summonedEntityList: Map<string, SummonedEntity>
	submarine_cool: number
	submarine_id: string
	dcitem_id: string
	totalEffectsApplied: number
	totalturn: number
	killRecord: {
		pos: number
		turn: number
		killer: Number
		dead: number
	}[]
	playerSelector: PlayerSelector

	constructor(mapid: number, rname: string, setting: GameSetting) {
		this.setting = setting
		this.instant = setting.instant
		this.simulation = false
		this.rname = rname

		if (mapid < 0 || mapid > 2) mapid = 0
		this.mapId = mapid //0: 오리지널  1:바다  2:카지노

		this.totalturn = 0
		this.isTeam = setting.isTeam
		this.PNUM = 0
		this.CNUM = 0
		this.totalnum = 0
		this.thisturn = 0
		this.skilldmg = -1
		this.skillcount = 0
		this.clientsReady = 0
		this.pendingObs = 0
		this.pendingAction = null
		this.roullete_result = -1
		this.itemLimit = setting.itemLimit
		this.nextUPID = 1
		// this.nextPassUPID = 1
		this.summonedEntityList = new Map()
		this.rangeProjectileList = new Map()
		this.passProjectileList = new Map()
		this.passProjectileQueue = []
		this.gameover = false
		this.shuffledObstacles = this.setting.shuffleObstacle
			? MAP.getShuffledObstacles(this.mapId)
			: MAP.getObstacleList(this.mapId)

		this.submarine_cool = 0
		this.submarine_id = "" //잠수함의 upid
		this.dcitem_id = ""
		this.killRecord = []
		this.totalEffectsApplied = 0 //total number of effects applied until now
		this.playerSelector = new PlayerSelector(this.isTeam)
		this.UPIDGen = new Util.UniqueIdGenerator(this.rname + "_P")
		this.UEIDGen = new Util.UniqueIdGenerator(this.rname + "_ET")
	}
	sendToClient(transfer: Function, ...args: any[]) {
		if (!this.instant) {
			transfer(this.rname, ...args)
		}
		//console.log("sendtoclient",transfer.name)
	}

	p(): Player {
		return this.playerSelector.get(this.thisturn)
	}

	//========================================================================================================

	//client:Socket(),team:number,char:int,name:str
	addPlayer(team: boolean | string, char: number, name: string) {
		console.log("add player " + char + "  " + team)
		let p = PlayerFactory.create(Number(char), name, this.totalnum, team, this, false)

		this.playerSelector.addPlayer(p)
		this.PNUM += 1
		this.totalnum += 1
	}
	//========================================================================================================

	//team:number,char:str,name:str
	addAI(team: boolean | string, char: number, name: string) {
		console.log("add ai " + char + "  " + team)

		char = Number(char)
		let p = PlayerFactory.create(Number(char), name, this.totalnum, team, this, true)

		this.playerSelector.addPlayer(p)
		this.CNUM += 1
		this.totalnum += 1
	}

	getInitialSetting() {
		let setting = []
		for (let p of this.playerSelector.getAll()) {
			setting.push({
				turn: p.turn,
				team: p.team,
				HP: p.HP,
				MaxHP: p.MaxHP,
				name: p.name,
				champ: p.champ,
				champ_name: p.champ_name,
				recommendedItem: p.itemtree.items
			})
		}
		return {
			isTeam: this.isTeam,
			playerSettings: setting,
			gameSettings: this.setting.getInitialSetting(),
			shuffledObstacles: this.shuffledObstacles
		}
	}

	//()=>{turn:number,stun:boolean}
	startTurn() {
		for (let p of this.playerSelector.getAll()) {
			//	p.players = this.players
			p.ability.sendToClient()
		}
		let p = this.playerSelector.get(0)

		//if this is first turn ever
		this.clientsReady += 1
		if (this.clientsReady !== this.PNUM) {
			return null
		}
		return {
			crypt_turn: "",
			turn: p.turn,
			stun: p.effects.has(ENUM.EFFECT.STUN),
			ai: p.AI,
			dc: p.diceControl,
			dc_cool: p.diceControlCool,
			adice: 0,
			effects: new Array<string>()
		}
	}
	//========================================================================================================

	summonSubmarine() {
		if (this.submarine_cool === 0) {
			console.log("submarine" + this.submarine_id)
			this.removePassProjectileById(this.submarine_id)
			this.submarine_id = ""
			let pos = 0
			let submarine_range = MAP.get(this.mapId).submarine_range

			if (submarine_range !== null) {
				let diff = submarine_range.end - submarine_range.start
				pos = submarine_range.start + Math.floor(Math.random() * diff)
			}

			this.placeSubmarine(pos)
			this.submarine_cool = SETTINGS.submarine_cooltime
		} else {
			this.submarine_cool = Math.max(0, this.submarine_cool - 1)
		}
	}

	// removePassProjById(id: string) {
	// 	if (id === "") return
	// 	//console.log("REmoved PASSPROJECTILE  PASSPROJECTILE" + id)
	// 	// let toremove=this.passProjectileList.filter((p: PassProjectile) => p.UPID === id)
	// 	let toremove = this.passProjectileList.get(id)
	// 	if (toremove !== null) {
	// 		// this.passProjectileList = this.passProjectileList.filter((proj: PassProjectile) => {
	// 		// 	proj.UPID!==id
	// 		// })
	// 		this.passProjectileList.delete(id)

	// 		toremove.removeProj()
	// 		toremove = null
	// 	}
	// }

	getDiceControlPlayer() {
		const bias = 1.5

		let firstpos = this.playerSelector.getFirstPlayer().pos
		return Util.chooseWeightedRandom(
			this.playerSelector.getAll().map((p) => {
				return firstpos * bias - p.pos
			})
		)
	} //50 30 20   :   25  45  55    : 20%, 36%, 44%

	/**
	 * called on every player`s turn start
	 * @returns
	 */
	summonDicecontrolItem() {
		// this.sendToClient(PlayerClientInterface.summonEntity,TreePlant.create(this,null).summon(this.p(),1,this.p().pos+5).getTransferData())
		// this.sendToClient(PlayerClientInterface.summonEntity,TreePlant.create(this,null).summon(this.p(),1,this.p().pos+6).getTransferData())

		let freq = this.setting.diceControlItemFrequency
		if (freq === 0) return

		let playercount = this.totalnum

		//player number 4:44% ~ 50% / 3: 31~39% / 2: 16~28% don`t create new item
		if (this.dcitem_id === "" && Util.chooseWeightedRandom([playercount ** 2 + (3 - freq) * 2, 20]) === 0) {
			return
		}
		//if there is dc item left on the map, don`t change position by 50%
		if (this.dcitem_id !== "" && Util.randomBoolean()) return

		this.removePassProjectileById(this.dcitem_id)
		this.dcitem_id = ""

		//don`t re-place item by 40~22% based on player count and freq
		if (Util.chooseWeightedRandom([playercount + freq, 2]) === 1) {
			return
		}

		//플레이어 1명 랜덤선택(뒤쳐져있을수록 확률증가)
		let r = this.getDiceControlPlayer()

		//플레이어가 일정레벨이상일시 등장안함
		if (this.playerSelector.get(r).level >= MAP.get(this.mapId).dc_limit_level) return

		//플레이어 앞 1칸 ~ (4~8)칸 사이 배치
		let range = 4 + (3 - freq) * 2 //4~8
		let pos = this.playerSelector.get(r).pos + Math.floor(Math.random() * range) + 1
		let bound = MAP.get(this.mapId).respawn[MAP.get(this.mapId).dc_limit_level - 1]

		//일정범위 벗어나면 등장안함
		if (pos <= 0 || pos >= bound) return

		this.placeDiceControlItem(pos)
	}

	/**
	 * 킬을 해서 추가주사위 던지면 80%로 앞1~ 8칸이내에 주컨아이템 소환
	 * @param turn
	 */
	summonDicecontrolItemOnkill(turn: number) {
		if (
			this.playerSelector.get(turn).level >= MAP.get(this.mapId).dc_limit_level ||
			this.setting.diceControlItemFrequency === 0
		)
			return

		// P = 0.8~1.0
		if (Math.random() < 0.7 + 0.1 * this.setting.diceControlItemFrequency) {
			this.removePassProjectileById(this.dcitem_id)
			let range = 6
			this.placeDiceControlItem(this.playerSelector.get(turn).pos + Math.floor(Math.random() * range) + 1)
		}
	}

	updateEntityPos(entity: SummonedEntity,pos:number) {
		pos=Util.clamp(pos,0,MAP.getFinish(this.mapId))
		entity.move(pos)

		this.sendToClient(PlayerClientInterface.update, "move_entity", entity.summoner.turn, {
			UEID: entity.UEID,
			pos: entity.pos
		})
	}

	summonEntity(entity: SummonedEntity, summoner: Player, lifespan: number, pos: number) {
		let id = this.UEIDGen.generate()

		pos=Util.clamp(pos,0,MAP.getFinish(this.mapId))
		console.log(id)

		entity=entity.summon(summoner,lifespan,pos,id)
		this.summonedEntityList.set(id, entity)

		this.sendToClient(PlayerClientInterface.summonEntity,entity.getTransferData())
		return entity
	}


	removeEntity(entityId: string, iskilled: boolean) {
		if (!this.summonedEntityList.has(entityId)) return
		console.log("removeEntity")

		this.summonedEntityList.delete(entityId)
		this.sendToClient(PlayerClientInterface.deleteEntity, entityId, iskilled)
	}
	entityOnTurnStart() {
		for (let e of this.summonedEntityList.values()) {
			e.onTurnStart(this.thisturn)
		}
	}
	getEnemyEntityInRange(attacker: Player, rad: number): SummonedEntity[] {
		let entities = []

		for (let e of this.summonedEntityList.values()) {
			if (
				e.pos <= attacker.pos + rad &&
				e.pos >= attacker.pos - rad &&
				this.playerSelector.isOpponent(e.summoner.turn, attacker.turn)
			) {
				entities.push(e)
			}
		}
		return entities
	}

	goNextTurn() {
		if (this.gameover) {
			return null
		}
		this.pendingObs = 0
		this.pendingAction = null
		let p = this.p()
		this.applyTickEffect()
		this.projectileCooldown()
		p.onTurnEnd()

		//다음턴 안넘어감(one more dice)
		if (p.oneMoreDice) {
			//	console.log("ONE MORE DICE")
			p.oneMoreDice = false
			p.effects.cooldownAllHarmful()
			this.summonDicecontrolItemOnkill(p.turn)
			// p.effects[ENUM.EFFECT.STUN] = Math.max(p.effects[ENUM.EFFECT.STUN] - 1, 0)
			p.adice = 0
		}
		//다음턴 넘어감
		else {
			this.thisturn += 1
			this.thisturn %= this.totalnum

			this.summonDicecontrolItem()
			if (this.thisturn === 0) {
				console.log(`turn ${this.totalturn}===========================================================================`)

				this.totalturn += 1
				if (this.totalturn >= 30 && this.totalturn % 10 === 0) {
					for (let p of this.playerSelector.getAll()) {
						p.ability.addExtraResistance((this.totalturn / 10) * 2 * this.setting.extraResistanceAmount)
					}
				}
				this.recordStat()

				//잠수함, 1턴 일때만 소환
				if (this.mapId === 1) {
					this.summonSubmarine()
				}
			}
			p = this.p()

			p.invulnerable = false
			if (p.dead || p.waitingRevival) {
				p.respawn()
			}
			p.onTurnStart()
			this.entityOnTurnStart()
		}

		let additional_dice = p.calculateAdditionalDice(this.setting.additionalDiceAmount)

		let doubledice = false
		let effects = new Array<string>()

		if (p.effects.has(ENUM.EFFECT.DOUBLEDICE)) {
			effects.push("doubledice")
		}
		if (p.effects.has(ENUM.EFFECT.BACKDICE)) {
			effects.push("backdice")
		}
		if (p.effects.has(ENUM.EFFECT.CURSE)) {
			effects.push("badluck")
		}
		if (this.mapId === 2 && p.mapdata.isSubwayDice()) {
			effects.push("subway")
		}

		if (p.effects.has(ENUM.EFFECT.SLOW)) {
			additional_dice -= 2
		}
		if (p.effects.has(ENUM.EFFECT.SPEED)) {
			additional_dice += 2
		}
		//	console.log("adice" + additional_dice + " " + doubledice + " turn" + p.turn)

		// //temp
		// if(p.turn===0){
		// 	p.diceControl=true
		// }

		let avaliablepos: number[] = []
		if (p.diceControl) {
			avaliablepos = p.getPossiblePosList()
		}
		//	console.log("avliablepos" + avaliablepos)
		return {
			crypt_turn: "",
			turn: p.turn,
			stun: p.effects.has(ENUM.EFFECT.STUN),
			ai: p.AI,
			dc: p.diceControl,
			dc_cool: p.diceControlCool,
			adice: additional_dice,
			effects: effects,
			avaliablepos: avaliablepos
		}
	}

	//called when start of every 1p`s turn
	getPlayerVisibilitySyncData() {
		let data = []
		for (let plyr of this.playerSelector.getAll()) {
			data.push({
				alive: !plyr.dead,
				pos: plyr.pos,
				turn: plyr.turn
			})
		}
		return data
	}

	/**
	 * called start of every turn,
	 * record all player`s current position of this turn
	 */
	recordStat() {
		for (let plyr of this.playerSelector.getAll()) {
			if (plyr.mapdata.onMainWay) {
				plyr.statistics.addPositionRecord(plyr.pos)
			} else if (MAP.get(this.mapId).way2_range != undefined) {
				plyr.statistics.addPositionRecord(
					MAP.get(this.mapId).way2_range.start + (plyr.pos - MAP.get(this.mapId).way2_range.way_start)
				)
			}
			plyr.statistics.addMoneyRecord()
		}
	}

	/**
	 *
	 * @param {int} killer -1 if executed
	 * @param {int} dead
	 * @param {int} pos
	 */
	addKillData(killer: number, dead: number, pos: number) {
		if (this.setting.killRecord) this.killRecord.push({ killer: killer, dead: dead, pos: pos, turn: this.totalturn })
	}

	rollDice(dicenum: number) {
		let p: Player = this.p()

		// //return if stun
		// if (p.effects.has(ENUM.EFFECT.STUN)) {
		// 	return null
		// }

		//original dice number
		let diceShown = Math.floor(Math.random() * 6) + 1
		let dcused = false

		// diceShown=6  //임시

		//주사위컨트롤
		if (dicenum !== null && dicenum !== undefined && dicenum > 0 && p.diceControl) {
			diceShown = dicenum
			p.useDiceControl()
			dcused = true
		}

		//ai 주컨
		if (p.AI && AIHelper.willDiceControl(p)) {
			diceShown = AIHelper.getDiceControlDice(p)
			dcused = true
			p.useDiceControl()
		}

		//badluck effect
		if (p.effects.has(ENUM.EFFECT.CURSE)) {
			diceShown = p.getWorstDice()
		}

		let moveDistance = diceShown

		//doubledice,backdice
		if (p.effects.has(ENUM.EFFECT.BACKDICE)) {
			moveDistance *= -1
		}
		if (p.effects.has(ENUM.EFFECT.DOUBLEDICE)) {
			moveDistance *= 2
		}

		//speed,slow
		if (p.effects.has(ENUM.EFFECT.SLOW)) {
			moveDistance -= 2
		}
		if (p.effects.has(ENUM.EFFECT.SPEED)) {
			moveDistance += 2
		}

		//additional moveDistance
		moveDistance += p.adice
		p.adice = 0

		//상점 체크
		moveDistance = p.checkMuststop(moveDistance)

		//지나가는 투사체 체크
		let result = this.checkPassProj(p, p.pos, moveDistance)
		moveDistance = result.moveDistance

		this.passProjectileQueue = result.projList

		let currpos = p.pos

		//need to choose between two way
		if (p.mapdata.needToAskWay2(moveDistance)) {
			if (p.AI) {
			} else {
				this.pendingAction = "ask_way2"
			}
		}
		//	console.log("move" + moveDistance)

		if (this.mapId === ENUM.MAP_TYPE.CASINO && p.mapdata.isSubwayDice()) {
			let subwayData = p.mapdata.getSubwayDice()
			diceShown = subwayData.diceShown
			moveDistance = subwayData.moveDistance
		}

		//move player
		let died = p.moveByDice(moveDistance)

		//dont move if player is killed by mine
		if (died) {
			moveDistance = 0
		}

		return {
			dice: diceShown, //표시된 주사위 숫자
			actualdice: moveDistance, //플레이어 움직일 거리
			currpos: currpos,
			turn: this.thisturn,
			finish: MAP.getFinish(this.mapId),
			dcused: dcused,
			died: died
		}
	}
	playerForceMove(player: Player, pos: number, ignoreObstacle: boolean, movetype: string) {
		this.pendingObs = 0 //강제이동시 장애물무시

		this.sendToClient(PlayerClientInterface.tp, player.turn, pos, movetype)

		player.forceMove(pos)

		if (!ignoreObstacle) {
			if (this.instant) {
				player.arriveAtSquare(true)
			} else {
				setTimeout(
					() => {
						player.arriveAtSquare(true)
					},
					movetype === "simple" ? 1000 : 1500
				)
			}
		} else if (this.mapId === ENUM.MAP_TYPE.CASINO) {
			player.mapdata.checkSubway()
		}
	}
	//========================================================================================================

	checkPassProj(player: Player, currpos: number, dice: number) {
		let projList = []

		let sortedlist = Array.from(this.passProjectileList.values()).sort((a, b) => a.pos - b.pos)

		for (let pp of sortedlist) {
			if ((pp.pos > currpos && pp.pos <= currpos + dice) || (pp.pos < currpos && pp.pos >= currpos + dice)) {
				if (player.AI && pp.name === "submarine") {
					continue
				}
				if (!pp.canApplyTo(player)) continue

				projList.push(pp)
				if (pp.hasFlag(Projectile.FLAG_STOP_PLAYER)) {
					dice = pp.pos - currpos
					break
				}
			}
		}

		return { moveDistance: dice, projList: projList }
	}
	//========================================================================================================

	checkObstacle(): number {
		let p = this.p()

		p.onBeforeObs()

		//passprojqueue 에 있는 투사체들을 pendingaction 에 적용
		let died = this.applyPassProj()

		if (died) return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE

		//장애물 효과 적용
		let result = p.arriveAtSquare(false)

		if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.STORE) {
			p.effects.apply(ENUM.EFFECT.SILENT, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
			if (p.AI) {
				AIHelper.aiStore(p)
				result = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
			}
		}
		let winner = this.thisturn

		//게임 오버시 player 배열 순위순으로 정렬후 게임 끝냄
		if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH) {
			this.playerSelector.getAll().sort(function (a, b) {
				if (a.turn === winner) {
					return -1000
				}
				if (b.turn === winner) {
					return 1000
				} else {
					if (b.kill === a.kill) {
						return a.death - b.death
					} else {
						return b.kill - a.kill
					}
				}
			})
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
		}

		//godhand, 사형재판, 납치범 대기중으로 표시
		if (SETTINGS.pendingObsList.some((a) => result === a)) {
			if (!this.p().AI) {
				this.pendingObs = result
			}
		}

		p.onAfterObs()

		return result
	}

	applyTickEffect() {
		console.log("apply" + this.thisturn)
		for (let p of this.playerSelector.getAll()) {
			p.effects.tick(this.thisturn)
		}
	}
	onEffectApply() {
		this.totalEffectsApplied += 1
		return this.totalEffectsApplied % 3
	}

	projectileCooldown() {
		for (let [id, proj] of this.rangeProjectileList.entries()) {
			if (proj.cooldown(this.thisturn)) {
				this.removeRangeProjectileById(id)
			}
		}
		for (let [id, proj] of this.passProjectileList.entries()) {
			if (proj.cooldown(this.thisturn)) {
				this.removePassProjectileById(id)
			}
		}
	}
	/**
	 * passprojqueue 에 있는 투사체들을 pendingaction 에 적용
	 */
	applyPassProj() {
		let died = false
		for (let pp of this.passProjectileQueue) {
			let upid = ""
			if (pp.name === "submarine") {
				upid = this.submarine_id
				// pp.removeProj()
				this.pendingAction = "submarine"
				this.submarine_id = ""
			}
			else if (pp.name === "dicecontrol") {
				upid = this.dcitem_id
				// pp.removeProj()
				this.dcitem_id = ""
				this.p().giveDiceControl()
			} else {
				died = this.p().hitBySkill(pp.damage, pp.name, pp.sourceTurn, pp.action)

				upid = pp.UPID
			}

			if (!pp.hasFlag(Projectile.FLAG_NOT_DISAPPER_ON_STEP)) this.removePassProjectileById(upid)

			if (died) break
		}
		this.passProjectileQueue = []
		return died
	}
	//========================================================================================================

	/**
	 * 클라로부터 신의손 정보 받아서 실행시킴
	 * @param {} godhand_info target,location
	 */
	processGodhand(godhand_info: { target: number; location: number }) {
		let p = this.playerSelector.get(godhand_info.target)
		p.damagedby[this.thisturn] = 3
		this.playerForceMove(p, godhand_info.location, false, "levitate")
	}
	//========================================================================================================

	//()=>{turn:number,silent:number,cooltime:number[],duration:number[]}
	skillCheck() {
		return this.getSkillStatus()
	}
	//========================================================================================================

	aiSkill() {
		AIHelper.aiSkill(this.p())
	}
	//========================================================================================================
	applyRangeProjectile(player: Player): boolean {
		if (player.invulnerable) {
			return false
		}
		let ignoreObstacle = false

		for (let proj of this.rangeProjectileList.values()) {
			if (proj.activated && proj.scope.includes(player.pos) && proj.canApplyTo(player)) {
				console.log("proj hit" + proj.UPID)
				let died = player.hitBySkill(proj.damage, proj.name, proj.sourceTurn, proj.action)

				if (proj.hasFlag(Projectile.FLAG_IGNORE_OBSTACLE)) ignoreObstacle = true

				if (!proj.hasFlag(Projectile.FLAG_NOT_DISAPPER_ON_STEP)) {
					this.removeRangeProjectileById(proj.UPID)
				}
				if (died) return true
			}
		}
		// let other = this.playerSelector.getPlayersByCondition(player, -1, false, true, false, false)
		// for (let o of other) {
		// 	for (let p of o.projectile) {

		// 	}
		// }
		return ignoreObstacle
	}
	getNameByTurn(turn: number) {
		if (turn < 0) return ""
		return this.playerSelector.get(turn).name
	}
	/**
	 *
	 * @param {*} skill 0~
	 *
	 * return
	 * notlearned
	 * nocool
	 *  notarget
	 *  non-target(skillstatus)
	 * projectile(pos,range,onmainway,size)
	 *  targeting(targets)
	 */
	initSkill(skill: number) {
		let p = this.p()
		//console.log("initSkill pendingskill" + skill)
		p.pendingSkill = skill

		if (!p.isSkillLearned(skill)) {
			//	return "notlearned"
			return ENUM.INIT_SKILL_RESULT.NOT_LEARNED
		}

		if (!p.isCooltimeAvaliable(skill)) {
			//return "nocool"
			return ENUM.INIT_SKILL_RESULT.NO_COOL
		}

		let skillTargetSelector: Util.SkillTargetSelector = p.getSkillTargetSelector(skill)

		//-1 when can`t use skill, 0 when it`s not attack skill that used immediately
		if (skillTargetSelector.isNonTarget()) {
			return {
				type: ENUM.INIT_SKILL_RESULT.NON_TARGET,
				skillstatus: this.getSkillStatus()
			}
		}

		if (skillTargetSelector.isNoTarget()) {
			//return "notarget"
			return ENUM.INIT_SKILL_RESULT.NO_TARGET
		}

		skillTargetSelector.range = p.effects.modifySkillRange(skillTargetSelector.range)
		//마법의성,실명 적용

		if (skillTargetSelector.isProjectile()) {
			return {
				type: ENUM.INIT_SKILL_RESULT.PROJECTILE,
				pos: p.pos,
				range: skillTargetSelector.range,
				onMainWay: p.mapdata.onMainWay,
				size: skillTargetSelector.projSize
			}
		}

		if(skillTargetSelector.isAreaTarget()){
			return {
				type: ENUM.INIT_SKILL_RESULT.AREA_TARGET,
				pos: p.pos,
				range: skillTargetSelector.range,
				onMainWay: p.mapdata.onMainWay,
				size: skillTargetSelector.areaSize
			}
		}

		let targets = this.playerSelector.getAvailableTarget(p, skillTargetSelector)

		//	console.log("skillattr" + targets + " " + skillTargetSelector.range)
		if (targets.length === 0) {
			//return "notarget"
			return ENUM.INIT_SKILL_RESULT.NO_TARGET
		}

		return {
			type: ENUM.INIT_SKILL_RESULT.NEED_TARGET,
			targets: targets
		}
	}
	useSkillToTarget(target: number) {
		let p = this.p()

		p.hitOneTarget(target, p.getSkillDamage(target))
		return this.getSkillStatus()
	}
	//========================================================================================================

	/**
	 *
	 * @returns turn,issilent,cooltile,duration,level,isdead
	 */
	getSkillStatus() {
		let p = this.p()
		return {
			turn: this.thisturn,
			silent: p.effects.has(ENUM.EFFECT.SILENT),
			cooltime: p.cooltime,
			duration: p.duration,
			level: p.level,
			dead: p.dead
		}
	}
	getNextUPID(): string {
		let id = "P" + String(this.nextUPID)
		this.nextUPID += 1
		//		console.log("upid" + id)
		return id
	}
	//========================================================================================================
	usePendingAreaSkill(pos:number){
		this.p().usePendingAreaSkill(pos)
	}
	placePendingSkillProj(pos: number) {
		let p = this.p()
		let proj = p.getSkillProjectile(pos)
		this.placeProjectile(proj, pos)
		// let id = this.getNextUPID()
		// proj.place(pos, id)
		// this.activeProjectileList.set(id, proj)
	}

	placeProjNoSelection(proj: Projectile, pos: number) {
		//console.log("placeProjNoSelection" + proj)
		this.placeProjectile(proj, pos)

		// let id = this.getNextUPID()
		// proj.place(pos, id)
		// this.activeProjectileList.set(id, proj)
	}

	// removeProjectile(UPID: string) {
	// 	this.rangeProjectileList.delete(UPID)
	// }

	//========================================================================================================

	isAttackableCoordinate(c: number): boolean {
		let coor = this.shuffledObstacles
		if (c < 1 || c >= coor.length || coor[c].obs === -1 || coor[c].obs === 0) {
			return false
		}
		return true
	}
	//========================================================================================================
	getPlaceableCoordinates(start: number, size: number) {
		let offset = 0
		let usedSize = 0
		let scope = []
		while (usedSize < size && offset < MAP.get(this.mapId).coordinates.length) {
			if (this.isAttackableCoordinate(start + offset)) {
				scope.push(start + offset)
				usedSize += 1
			}
			offset += 1
		}
		return scope
	}

	//========================================================================================================

	placeDiceControlItem(pos: number) {
		let upid = this.placeProjectile(new ProjectileBuilder(this, "dicecontrol", Projectile.TYPE_PASS).build(), pos)
		this.dcitem_id = upid
	}
	placeSubmarine(pos: number) {
		let upid = this.placeProjectile(new ProjectileBuilder(this, "submarine", Projectile.TYPE_PASS).build(), pos)
		this.submarine_id = upid
	}

	placeProjectile(proj: Projectile, pos: number): string {
		let id = this.UPIDGen.generate()
		proj.place(pos, id)

		if (proj instanceof PassProjectile) {
			this.passProjectileList.set(id, proj)
			this.sendToClient(PlayerClientInterface.placePassProj, proj.getTransferData())
		} else if (proj instanceof RangeProjectile) {
			this.rangeProjectileList.set(id, proj)
			this.sendToClient(PlayerClientInterface.placeProj, proj.getTransferData())
		}
		return id
	}

	removeRangeProjectileById(UPID: string) {
		if (!this.rangeProjectileList.has(UPID)) return

		this.rangeProjectileList.get(UPID).remove()
		this.rangeProjectileList.delete(UPID)
		this.sendToClient(PlayerClientInterface.removeProj, UPID)
	}

	removePassProjectileById(UPID: string) {
		if (!this.passProjectileList.has(UPID)) return

		this.passProjectileList.get(UPID).remove()
		this.passProjectileList.delete(UPID)
		this.sendToClient(PlayerClientInterface.removeProj, UPID)
	}
	/**
	 *
	//  * @param {*} type str
	//  * @param {*} pos
	//  */
	// placePassProj2(type: string, pos: number) {
	// 	return
	// 	if (type === "submarine") {
	// 		// let proj = new PassProjectile(this, type, () => {}, false)

	// 		let id
	// 		this.passProjectileList.set(id, proj)
	// 		proj.place(pos, id)
	// 		//.log("Placed PASSPROJECTILE  PASSPROJECTILE" + id)
	// 		this.submarine_id = id
	// 	}
	// 	if (type === "dicecontrol") {
	// 		// let proj = new PassProjectile(this, type, () => {}, false)
	// 		// this.passProjectileList.push(proj)
	// 		let id = this.getNextPassUPID()
	// 		this.passProjectileList.set(id, proj)
	// 		proj.place(pos, id)

	// 		this.dcitem_id = id
	// 	}

	// 	// this.passProjectileList.sort(function (a, b) {
	// 	// 	return a.pos - b.pos
	// 	// })
	// }
	// //========================================================================================================

	// getNextPassUPID(): string {
	// 	let id = "PP" + String(this.nextPassUPID)
	// 	this.nextPassUPID += 1
	// 	return id
	// }
	getGodHandTarget() {
		return this.playerSelector.getPlayersByCondition(this.p(), -1, false, false, false, true).map(function (p: Player) {
			return p.turn
		})
	}

	//========================================================================================================

	/**
	 * 선택 장애물 대기중일 경우 바로 스킬로 안넘어가고 선택지 전송
	 * @returns false if no pending obs,  of return {name of obs,argument(false on default)}
	 */
	checkPendingObs(): { name: string; argument: number | number[] } {
		if (this.pendingObs === 0 || this.p().dead) return null

		let name = ""
		let argument: number | number[] = -1
		if (this.pendingObs === 21) {
			//신의손 대기중일 경우 바로 스킬로 안넘어가고 신의손 타겟 전송
			let target = this.getGodHandTarget()
			if (target.length > 0) {
				name = "server:pending_obs:godhand"
				argument = target
			} else {
				this.pendingObs = 0
				return null
			}
		}
		//납치범
		else if (this.pendingObs === 33) {
			name = "server:pending_obs:kidnap"
		}
		//사형재판
		else if (this.pendingObs === 37) {
			let num = Math.floor(Math.random() * 6) //0~5
			//let num=5
			this.roullete_result = num
			name = "server:pending_obs:trial"
			argument = num
		}
		//카지노
		else if (this.pendingObs === 38) {
			let num = Math.floor(Math.random() * 6) //0~5
			this.roullete_result = num
			name = "server:pending_obs:casino"
			argument = num
		}
		//공갈협박
		else if (this.pendingObs === 63) {
			name = "server:pending_obs:threaten"
		}
		//떡상
		else if (this.pendingObs === 67) {
			name = "server:pending_obs:sell_token"
			argument = this.p().inven.token
		} //지하철
		else if (this.pendingObs === 6) {
			name = "server:pending_obs:subway"
			argument = this.p().mapdata.getSubwayPrices()
		}

		return { name: name, argument: argument }
	}
	//========================================================================================================
	processPendingObs(info: any) {
		//타임아웃될 경우
		if (!info) {
			if (this.pendingObs === 33) {
				this.kidnap(true)
			} //타임아웃 악용방지 자동실행
			if (this.pendingObs === 37 || this.pendingObs === 38) {
				this.roulleteComplete()
			}
			if (this.pendingObs === 63) {
				this.threaten(true)
			}
			if (this.pendingObs === 6) {
				this.p().mapdata.selectSubway(0, 0)
			}

			this.pendingObs = 0
			return
		}

		if (this.pendingObs === 0) {
			return
		}

		if (info.type === "godhand") {
			if (info.complete) {
				this.processGodhand(info)
			}
		} else if (info.type === "roullete") {
			this.roulleteComplete()
		} else if (info.type === "kidnap") {
			this.kidnap(info.result)
		} else if (info.type === "threaten") {
			this.threaten(info.result)
		} else if (info.type === "sell_token") {
			this.sellToken(info)
		} else if (info.type === "subway") {
			//console.log("subway")
			console.log(info)
			this.p().mapdata.selectSubway(info.result, info.price)
		}
		this.pendingObs = 0
	}
	//========================================================================================================

	processPendingAction(info: any) {
		//console.log(info)

		//타임아웃될 경우
		if (!info) {
			this.pendingAction = null
			return
		}

		if (!this.pendingAction) {
			return
		}

		if (info.type === "submarine" && info.complete) {
			this.playerForceMove(this.p(), info.pos, false, "levitate")
		}
		if (info.type === "ask_way2" && !info.result) {
			console.log("goWay2")
			this.p().mapdata.goWay2()
		}

		this.pendingAction = null
	}
	roulleteComplete() {
		//	console.log("roullete" + this.pendingObs)

		let p = this.p()
		//사형재판
		if (this.pendingObs === 37) {
			ObstacleHelper.trial(p, this.roullete_result)
		}
		//카지노
		else if (this.pendingObs === 38) {
			ObstacleHelper.casino(p, this.roullete_result)
		}

		this.pendingObs = 0
		this.roullete_result = -1
	}
	//========================================================================================================

	/**
	 * 납치범 실행
	 * @param result 납치범 결과 boolean
	 */
	kidnap(result: boolean) {
		ObstacleHelper.kidnap(this.p(), result)
		this.pendingObs = 0
	}
	//========================================================================================================

	/**
	 * 공갈협박 실행
	 * @param result  결과 boolean
	 */
	threaten(result: boolean) {
		ObstacleHelper.threaten(this.p(), result)

		this.pendingObs = 0
	}
	//========================================================================================================

	sellToken(info: any) {
		if (info.token > 0) {
			this.p().inven.sellToken(info)
		}
	}
	//========================================================================================================

	getStoreData(turn: number) {
		let p = this.playerSelector.get(turn)
		return p.inven.getStoreData(1)
	}
	//========================================================================================================
	getFinalStatistics() {
		//console.log(setting)
		let data = {
			players: new Array<any>(),
			totalturn: this.totalturn,
			version: STATISTIC_VERSION,
			map_data: {
				name: MAP.get(this.mapId).mapname,
				respawn: MAP.getRespawn(this.mapId),
				finish: MAP.getFinish(this.mapId)
			},
			killRecord: this.killRecord,
			isTeam: this.isTeam,
			setting: this.setting.getSummary()
		}

		for (let p of this.playerSelector.getAll()) {
			data.players.push({
				team: p.team,
				name: p.name,
				champ: p.champ_name,
				champ_id: p.champ,
				turn: p.turn,
				stats: p.statistics.stats,
				kda: [p.kill, p.death, p.assist],
				items: p.inven.itemSlots,
				bestMultiKill: p.bestMultiKill,
				positionRecord: p.statistics.positionRecord,
				moneyRecord: p.statistics.moneyRecord,
				itemRecord: p.statistics.itemRecord,
				kill: p.kill,
				death: p.death,
				assist: p.assist
			})
		}

		return data
	}
}

export { Game, MAP, GameSetting, IGameSetting }
