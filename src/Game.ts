import CONFIG from "./../config/config.json"
import SETTINGS = require("../res/globalsettings.json")
import * as ENUM from "./data/enum"
import * as Util from "./core/Util"
import { Projectile, ProjectileBuilder, RangeProjectile, PassProjectile } from "./Projectile"
import { ObstacleHelper } from "./core/helpers"
import { AiAgent } from "./AiAgents/AiAgent"
import { SummonedEntity } from "./characters/SummonedEntity/SummonedEntity"
import { Entity } from "./entity/Entity"
import { ClientInputEventInterface, ServerGameEventInterface } from "./data/PayloadInterface"
import {MAP} from "./MapHandlers/MapStorage"
import { EntityMediator } from "./entity/EntityMediator"
import { Player } from "./player/player"
import { EntityFilter } from "./entity/EntityFilter"
// import { PlayerClientInterface } from "./app"
import { Creed } from "./characters/Creed"
import { Silver } from "./characters/Silver"
import { Timo } from "./characters/Timo"
import { Yangyi } from "./characters/Yangyi"
import { Jean } from "./characters/Jean"
import { Jellice } from "./characters/Jellice"
import { Gorae } from "./characters/Gorae"
import { Bird } from "./characters/Bird"
import { Tree } from "./characters/Tree"
import { GAME_CYCLE } from "./GameCycle/StateEnum"
import { GameSetting } from "./GameSetting"
import { GameEventObserver } from "./GameEventObserver"
import { GameRecord } from "./TrainHelper"
const STATISTIC_VERSION = 3
//version 3: added kda to each category
const crypto = require("crypto")

function encrypt(val: string, key: string):string {
	return crypto
		.createHash("sha512")
		.update(val + key)
		.digest("hex")
}

class PlayerFactory {
	static create(character_id: number, name: string, turn: number, team: boolean, game: Game, isAI: boolean) :Player{
		let char:Player
		switch (character_id) {
			case 0:
				char= new Creed(turn, team, game, isAI, name)
				break
			case 1:
				char= new Silver(turn, team, game, isAI, name)
				break
			case 2:
				char= new Timo(turn, team, game, isAI, name)
				break
			case 3:
				char= new Yangyi(turn, team, game, isAI, name)
				break
			case 4:
				char= new Jean(turn, team, game, isAI, name)
				break
			case 5:
				char= new Jellice(turn, team, game, isAI, name)
				break
			case 6:
				char= new Gorae(turn, team, game, isAI, name)
				break
			case 7:
				char= new Bird(turn, team, game, isAI, name)
				break
			case 8:
				char= new Tree(turn, team, game, isAI, name)
				break
			default:
				char=new Creed(turn, team, game, isAI, name)
				break
		}
		char.AiAgent.onAfterCreate()
		return char
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
	// skilldmg: any
	// skillcount: number
	clientsReady: number
	pendingObs: number
	private pendingAction: string
	roullete_result: number
	nextUPID: number
	readonly UPIDGen: Util.UniqueIdGenerator
	readonly UEIDGen: Util.UniqueIdGenerator

	// nextPassUPID: number
	rangeProjectiles: Map<string, RangeProjectile>
	passProjectiles: Map<string, PassProjectile>
	passProjectileQueue: PassProjectile[]
	gameover: boolean
	winner: number

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
	// playerSelector: PlayerSelector
	entityMediator: EntityMediator
	turnEncryption: Map<number, string>
	turnEncryptKey: string
	begun:boolean
	cycle:number
	arriveSquareCallback:Function
	arriveSquareTimeout:NodeJS.Timeout
	eventEmitter:GameEventObserver
	tempFinish:number
	disconnectedPlayers:Set<number>
	private static readonly PLAYER_ID_SUFFIX = "P"

	constructor(mapid: number, rname: string, setting: GameSetting) {
		this.setting = setting
		this.instant = setting.instant
		this.simulation = false
		this.rname = rname

		if (mapid < 0 || mapid > 3) mapid = 0
		this.mapId = mapid //0: 오리지널  1:바다  2:카지노
		this.begun=false
		this.totalturn = 0
		this.isTeam = setting.isTeam
		this.PNUM = 0
		this.CNUM = 0
		this.totalnum = 0
		this.thisturn = 0
		// this.skilldmg = -1
		// this.skillcount = 0
		this.clientsReady = 0
		this.pendingObs = 0
		this.pendingAction = null
		this.roullete_result = -1
		this.winner = -1
		this.itemLimit = setting.itemLimit
		// this.nextUPID = 1
		// this.nextPassUPID = 1
		this.summonedEntityList = new Map()
		this.rangeProjectiles = new Map()
		this.passProjectiles = new Map()
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
		// this.playerSelector = new PlayerSelector(this.isTeam)
		this.UPIDGen = new Util.UniqueIdGenerator(this.rname + "_P")
		this.UEIDGen = new Util.UniqueIdGenerator(this.rname + "_ET")
		this.turnEncryptKey = Math.round(new Date().valueOf() * Math.random() * Math.random()) + this.rname

		this.turnEncryption = new Map<number, string>()
		for (let i = 0; i < 4; ++i) {
			this.turnEncryption.set(i, encrypt(String(i), this.turnEncryptKey).slice(0,8))
		}
		this.arriveSquareTimeout=null
		this.arriveSquareCallback=null

		this.eventEmitter=new GameEventObserver(this.rname)
		this.entityMediator = new EntityMediator(this.isTeam, this.instant, this.rname)
		this.tempFinish=-1
		this.disconnectedPlayers=new Set<number>()
	}
	sendToClient(transfer: Function, ...args: any[]) {
		if (!this.instant) {
			transfer(this.rname, ...args)
		}
		//console.log("sendtoclient",transfer.name)
	}

	thisp(): Player {
		return this.entityMediator.getPlayer(this.turn2Id(this.thisturn))
	}

	pOfTurn(turn: number): Player {
		return this.entityMediator.getPlayer(this.turn2Id(turn))
	}
	pOfId(id:string){
		return this.entityMediator.getPlayer(id)
	}
	turn2Id(turn: number) {
		return String(turn + 1) + Game.PLAYER_ID_SUFFIX
	}
	id2Turn(id:string):number{
		return Number(id[0])
	}

	cryptTurn(turn: number) {
		return this.turnEncryption.get(turn)
	}
	thisCryptTurn() {
		return this.turnEncryption.get(this.thisturn)
	}
	isThisTurn(cryptTurn: string) {
		//	console.log(this.turnEncryption.get(this.game.thisturn),cryptTurn)
		return this.turnEncryption.get(this.thisturn) === cryptTurn
	}
	setCycle(cycle:number){
		this.cycle=cycle
	}
	getObstacleAt(pos:number){
		return this.shuffledObstacles[pos].obs
	}
	getMoneyAt(pos:number){
		return this.shuffledObstacles[pos].money
	}
	//========================================================================================================

	//team:number,char:int,name:str
	addPlayer(team: boolean, char: number, name: string) {
		// console.log("add player " + char + "  " + team)
		let p = PlayerFactory.create(Number(char), name, this.totalnum, team, this, false)
		p.setMediator(this.entityMediator)
		this.entityMediator.register(p,p.UEID)

		// this.playerSelector.addPlayer(p)
		this.PNUM += 1
		this.totalnum += 1
	}
	//========================================================================================================

	//team:number,char:str,name:str
	addAI(team: boolean, char: number, name: string) {
		console.log("add ai " + char + "  " + team)

		char = Number(char)
		let p = PlayerFactory.create(Number(char), name, this.totalnum, team, this, true)
		p.setMediator(this.entityMediator)
		this.entityMediator.register(p,p.UEID)

		// this.playerSelector.addPlayer(p)
		this.CNUM += 1
		this.totalnum += 1
	}

	getInitialSetting():ServerGameEventInterface.initialSetting {
		let setting= []
		for (let p of this.entityMediator.allPlayer()) {
			setting.push({
				turn: p.turn,
				team: p.team,
				HP: p.HP,
				MaxHP: p.MaxHP,
				name: p.name,
				champ: p.champ,
				champ_name: p.champ_name,
				recommendedItem: p.AiAgent.itemtree.items,
				skillScale:p.getSkillScale()
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
	canStart():boolean{
		

		// for (let p of this.playerSelector.getAll()) {
		// 	//	p.players = this.players
		// 	p.ability.sendToClient()
		// }
		// let p = this.pOfTurn(0)
		
		//if this is first turn ever
		this.clientsReady += 1
		if (this.clientsReady < this.PNUM) {
			return false
		}
		
		return true
		// p.onMyTurnStart()
		// this.entityMediator.onTurnStart(this.thisturn)
		
		// return {
		// 	crypt_turn: this.cryptTurn(0),
		// 	turn: p.turn,
		// 	stun: p.effects.has(ENUM.EFFECT.STUN),
		// 	ai: p.AI,
		// 	dc: p.diceControl,
		// 	dc_cool: p.diceControlCool,
		// 	adice: 0,
		// 	effects: new Array<string>(),
		// 	avaliablepos:new Array<number>()
		// }
	}
	//========================================================================================================

	user_update<T>(turn:number,type:string,data:T){
		if(type==='auto_store'){
			this.pOfTurn(turn).toggleAutoBuy()
		}
	}
	summonSubmarine() {
		if (this.submarine_cool === 0) {
			//console.log("submarine" + this.submarine_id)
			this.removePassProjectileById(this.submarine_id)
			this.submarine_id = ""
			let pos = 0
			let submarine_range = MAP.get(this.mapId).submarine_range

			if (submarine_range !== null) {
				let diff = submarine_range.end - submarine_range.start
				pos = submarine_range.start + Math.floor(Math.random() * diff)
			}
			pos=60
			this.placeSubmarine(pos)
			// this.placeSubmarine(60)
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

		let firstpos = this.entityMediator.selectBestOneFrom(EntityFilter.ALL_PLAYER(this.thisp()))(function () {
			return this.pos
		}).pos

		return Util.chooseWeightedRandom(
			this.entityMediator.allPlayer().map((p) => {
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
		if (this.pOfTurn(r).level >= MAP.get(this.mapId).dc_limit_level) return

		//플레이어 앞 1칸 ~ (4~8)칸 사이 배치
		let range = 4 + (3 - freq) * 2 //4~8
		let pos = this.pOfTurn(r).pos + Math.floor(Math.random() * range) + 1
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
		if (this.pOfTurn(turn).level >= MAP.get(this.mapId).dc_limit_level || this.setting.diceControlItemFrequency === 0)
			return

		// P = 0.8~1.0
		if (Math.random() < 0.7 + 0.1 * this.setting.diceControlItemFrequency) {
			this.removePassProjectileById(this.dcitem_id)
			let range = 6
			this.placeDiceControlItem(this.pOfTurn(turn).pos + Math.floor(Math.random() * range) + 1)
		}
	}

	// cleanupDeadEntities(){
	getEntityById(id: string) {
		return this.entityMediator.getEntity(id)
	}

	summonEntity(entity: SummonedEntity, summoner: Player, lifespan: number, pos: number) {
		let id = this.UEIDGen.generate()

		pos = Util.clamp(pos, 0, MAP.getLimit(this.mapId))
	//	console.log(id)

		entity.setMediator(this.entityMediator)
		this.entityMediator.register(entity, id)

		entity = entity.summon(summoner, lifespan, pos, id)
		// this.summonedEntityList.set(id, entity)
		this.eventEmitter.summonEntity(entity.getTransferData())
		// this.entityMediator.sendToClient(PlayerClientInterface.summonEntity, )
		return entity
	}

	removeEntity(entityId: string, iskilled: boolean) {
		// if (!this.summonedEntityList.has(entityId)) return
		this.entityMediator.withdraw(entityId)
		// this.summonedEntityList.delete(entityId)
		this.eventEmitter.deleteEntity(entityId, iskilled)
	}
	getEnemyEntityInRange(attacker: Player, rad: number): Entity[] {
		return this.entityMediator.selectAllFrom(EntityFilter.ALL_ENEMY(attacker).inRadius(rad))
	}
	onTurnEnd(){
		if(!this.begun) return
		this.resetPendingObs()
		this.pendingAction = null
		let p = this.thisp()
		this.entityMediator.onTurnEnd(this.thisturn)
		p.onMyTurnEnd()
	}
	onOneMoreDice(p:Player){
		p.onMyTurnStart()
	//	console.log("ONE MORE DICE")
		p.oneMoreDice = false
		p.effects.cooldownAllHarmful()
		this.summonDicecontrolItemOnkill(p.turn)
		p.adice = 0
	}
	onPlayerChangePos(turn:number){
		let secondLevel=this.entityMediator.getSecondPlayerLevel()
		// console.log("onPlayerChangePos"+secondLevel)
		if(this.setting.winByDecision){
			let respawns=MAP.getRespawn(this.mapId)
			if(secondLevel+1 >= respawns.length) {
				if(this.tempFinish!==-1)
					this.eventEmitter.update("finish_pos",turn,MAP.getFinish(this.mapId))

				this.tempFinish=-1
				return
			}
			let finishpos=respawns[secondLevel+1]
			if(this.tempFinish!==finishpos)
				this.eventEmitter.update("finish_pos",turn,finishpos)
			this.tempFinish=finishpos
		}
	}
	getNextTurn(){
		return (this.thisturn+1) % this.totalnum
	}
	goNextTurn():ServerGameEventInterface.TurnStart {
		if (this.gameover) {
			return null
		}
			
		this.entityMediator.forAllPlayer()(function () {
			this.ability.sendToClient()
		})
		
	

		let p = this.thisp()
		//다음턴 안넘어감(one more dice)
		if (p.oneMoreDice) {
			this.onOneMoreDice(p)
		}
		//다음턴 넘어감
		else {
			const lastturn=this.thisturn
			if(this.begun){
				//this.onTurnEnd()
				// this.thisturn += 1
				if(this.disconnectedPlayers.size < this.PNUM){
					let nextturn=this.getNextTurn()

					for(let i=1;i<this.totalnum;++i){
						if(!this.disconnectedPlayers.has(nextturn)) break
						nextturn =(nextturn+i) % this.totalnum
					}

					this.thisturn=nextturn
				}
				else if(p.AI){
					this.thisturn=this.getNextTurn()
				}
				else{
					//모든 플레이어가 연결끊김 상태이면 턴 안넘어감
				}
			}
			this.begun=true
			
			
		//	console.log("thisturn" + this.thisturn)

			this.summonDicecontrolItem()
			this.projectileCooldown()

			if (this.thisturn <= lastturn) {
			//	console.log(`turn ${this.totalturn}===========================================================================`)

				this.totalturn += 1
				if (this.totalturn >= 30 && this.totalturn % 10 === 0) {
					this.entityMediator.forAllPlayer()(function () {
						this.ability.addExtraResistance((this.game.totalturn / 10) * 2 * this.game.setting.extraResistanceAmount)
					})
				}
				this.recordStat()

				//잠수함, 1턴 일때만 소환
				if (this.mapId === ENUM.MAP_TYPE.OCEAN) {
					this.summonSubmarine()
				}
			}

			p = this.thisp()

			p.invulnerable = false
			if (p.dead || p.waitingRevival) {
				p.respawn()
			}
			this.entityMediator.onTurnStart(this.thisturn)
			p.onMyTurnStart()
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
		let noDice=p.effects.has(ENUM.EFFECT.ROOT) || p.effects.has(ENUM.EFFECT.GROUNGING)

		
		// if (this.mapId === 2 && p.mapHandler.isSubwayDice()) {
		// 	effects.push("subway")
		// }

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
			crypt_turn: this.cryptTurn(p.turn),
			turn: p.turn,
			stun: noDice,
			ai: p.AI,
			dc: p.diceControl,
			dc_cool: p.diceControlCool,
			adice: additional_dice,
			effects: effects,
			avaliablepos: avaliablepos
		}
	}

	//called when start of every 1p`s turn
	getPlayerVisibilitySyncData():ServerGameEventInterface.PlayerPosSync[] {
		let data:ServerGameEventInterface.PlayerPosSync[] = []

		this.entityMediator.forAllPlayer()(function () {
			data.push({
				alive: !this.dead,
				pos: this.pos,
				turn: this.turn
			})
		})

		return data
	}

	/**
	 * called start of every turn,
	 * record all player`s current position of this turn
	 */
	recordStat() {
		this.entityMediator.forAllPlayer()(function () {
			if (this.mapHandler.isOnMainWay()) {
				this.statistics.addPositionRecord(this.pos)
			} else if (MAP.get(this.mapId).way2_range != undefined) {
				this.statistics.addPositionRecord(
					MAP.get(this.mapId).way2_range.start + (this.pos - MAP.get(this.mapId).way2_range.way_start)
				)
			}
			this.statistics.addMoneyRecord()
		})
	}

	indicateSingleObstacle(player:number,obs:number){
		this.eventEmitter.indicateObstacle({turn:player,obs:obs})
	}
	indicateGlobalObstacleEvent(obs:number,eventName?:string){
		this.eventEmitter.indicateObstacle({turn:-1,obs:obs,globalEventName:eventName})
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

	rollDice(dicenum: number):ServerGameEventInterface.DiceRoll {
		let p: Player = this.thisp()

		// //return if stun
		// if (p.effects.has(ENUM.EFFECT.STUN)) {
		// 	return null
		// }

		//original dice number
		let diceShown = Math.floor(Math.random() * 6) + 1
		let dcused = false
		
		if(CONFIG.dev_settings && CONFIG.dev_settings.dice>0){
			diceShown=CONFIG.dev_settings.dice
			dicenum=CONFIG.dev_settings.dice
		}

		// diceShown=6  //임시

		//주사위컨트롤
		if (dicenum !== null && dicenum !== undefined && dicenum > 0 && p.diceControl) {
			diceShown = dicenum
			p.useDiceControl()
			dcused = true
		}

		//ai 주컨
		if (p.AI && p.AiAgent.willDiceControl()) {
			diceShown = p.AiAgent.getDiceControlDice()
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

		let mapresult=p.mapHandler.onRollDice(moveDistance)

		let overrideMovement=false
		//need to choose between two way
		if (mapresult.type==="ask_way2") {
			if (p.AI) {
			} else {
				this.pendingAction = "ask_way2"
			}
		}
		if(mapresult.type==="subway"){
			moveDistance = mapresult.args[0]
			diceShown=-1
			overrideMovement=true
			//overrided by map handler
		}

		//	console.log("move" + moveDistance)

		
		// if (this.mapId === ENUM.MAP_TYPE.CASINO && p.mapHandler.isSubwayDice()) {
		// 	let subwayData = p.mapHandler.getSubwayDice()
		// }
		let died=false
		//move player
		if(!overrideMovement){
			died = p.moveByDice(moveDistance)

			//dont move if player is killed by mine
			if (died) {
				moveDistance = 0
			}
		}
		return {
			dice: diceShown, //표시된 주사위 숫자
			actualdice: moveDistance, //플레이어 움직일 거리
			currpos: currpos,
			turn: this.thisturn,
			dcused: dcused,
			died: died,
			crypt_turn:this.thisCryptTurn()
		}
	}

	playerForceMove(player: Player, pos: number, ignoreObstacle: boolean, movetype: string) {
		if (!ignoreObstacle) {
			this.entityMediator.forceMovePlayer(player.UEID, pos, movetype)
		} else {
			this.entityMediator.forceMovePlayerIgnoreObstacle(player.UEID, pos, movetype)
		}
		//this.pendingObs = 0 //강제이동시 장애물무시
	}
	//========================================================================================================

	checkPassProj(player: Player, currpos: number, dice: number) {
		let projList = []

		let sortedlist = Array.from(this.passProjectiles.values()).sort((a, b) => a.pos - b.pos)

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
	setPendingObs(obs:number){
		if (SETTINGS.pendingObsList.includes(obs)) {
			if (!this.thisp().AI) {
				this.pendingObs=obs
			}
		}
	}
	hasPendingObs(){
		return this.pendingObs!==0
	}
	resetPendingObs(){
		this.pendingObs=0
	}
	//========================================================================================================

	checkObstacle(delay?:number): number {
		let p = this.thisp()
		this.arriveSquareCallback=null
		if(!delay)
			delay=0

		if(!this.instant)
			this.arriveSquareTimeout=setTimeout(this.onObstacleComplete.bind(this),delay)
	//	p.onBeforeObs()

		//passprojqueue 에 있는 투사체들을 pendingaction 에 적용
		let died = this.applyPassProj()

		if (died) return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE

		//장애물 효과 적용
		let result = p.arriveAtSquare(false)

		// if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.STORE) {
		// //	p.effects.apply(ENUM.EFFECT.SILENT, 1, EFFECT_TIMING.BEFORE_SKILL)
		// 	if (p.AI) {
		// 		p.AiAgent.store()
		// 		result = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		// 	}
		// }
		this.winner = this.thisturn

		if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH) {
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
		}

		//godhand, 사형재판, 납치범 대기중으로 표시
		this.setPendingObs(result)

		
		if(this.instant) this.onObstacleComplete()
		
		return result
	}

	resolveArriveSquareCallback(){
	//	console.log("resolveArriveSquareCallback")
		if(this.arriveSquareCallback!=null){
			this.arriveSquareCallback()
			this.arriveSquareCallback=null
		}
	}


	onObstacleComplete()
	{
	//	console.log("--------------------------------onObstacleComplete")
		this.resolveArriveSquareCallback()
		this.thisp().onAfterObs()
	}

	requestForceMove(player:Player, movetype: string,ignoreObstacle:boolean){
		let delay=SETTINGS.delay_simple_forcemove
		if(movetype=== ENUM.FORCEMOVE_TYPE.LEVITATE) delay=SETTINGS.delay_levitate_forcemove
	//	console.log("--------------------------------requestForceMove")
	//	console.log(this.cycle)
		if(this.cycle===GAME_CYCLE.BEFORE_SKILL.ARRIVE_SQUARE){
		//	console.log("--------------------------------extendtimeout ARRIVE_SQUARE")
		//	console.log(player.name)
			clearTimeout(this.arriveSquareTimeout)
			this.arriveSquareTimeout=setTimeout(this.onObstacleComplete.bind(this),delay)
		}
		else if(this.cycle===GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION_PROGRESS
			 || this.cycle===GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE_PROGRESS){
		//	console.log("--------------------------------extendtimeout PENDING_ACTION")
			//console.log(player.name)
			clearTimeout(this.arriveSquareTimeout)
			this.arriveSquareTimeout=setTimeout(this.resolveArriveSquareCallback.bind(this),delay)
		}

		if(!ignoreObstacle){
			setTimeout(
				() =>player.arriveAtSquare(true),delay-400
			)
		}
	}

	onEffectApply() {
		this.totalEffectsApplied += 1
		return this.totalEffectsApplied % 3
	}

	projectileCooldown() {
		for (let [id, proj] of this.rangeProjectiles.entries()) {
			if (proj.cooldown(this.thisturn)) {
				this.removeRangeProjectileById(id)
			}
		}
		for (let [id, proj] of this.passProjectiles.entries()) {
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
			} else if (pp.name === "dicecontrol") {
				upid = this.dcitem_id
				// pp.removeProj()
				this.dcitem_id = ""
				this.thisp().giveDiceControl()
			} else {
				//died = this.thisp().hitBySkill(pp.damage, pp.name, pp.sourceTurn, pp.action)

				let skillattack = new Util.SkillAttack(pp.damage, pp.name).setOnHit(pp.action)

				died = this.entityMediator.skillAttackAuto(
					this.entityMediator.getPlayer(this.turn2Id(pp.sourceTurn)),
					this.turn2Id(this.thisturn)
				,skillattack)

				upid = pp.UPID
			}

			if (!pp.hasFlag(Projectile.FLAG_NOT_DISAPPER_ON_STEP)) this.removePassProjectileById(upid)

			if (died) break
		}
		this.passProjectileQueue = []
		return died
	}
	getPendingAction():string{
		return this.pendingAction
	}
	//========================================================================================================

	/**
	 * 클라로부터 신의손 정보 받아서 실행시킴
	 * @param {} godhand_info target,location
	 */
	processGodhand(target: number, location: number ) {
		let p = this.pOfTurn(target)
		p.damagedby[this.thisturn] = 3
		this.playerForceMove(p, location, false,  ENUM.FORCEMOVE_TYPE.LEVITATE)
	}
	//========================================================================================================

	//()=>{turn:number,silent:number,cooltime:number[],duration:number[]}
	// skillCheck() {
	// 	return this.getSkillStatus()
	// }
	//========================================================================================================

	aiSkill(callback:Function) {
		AiAgent.aiSkill(this.thisp(),callback)
	}
	simulationAiSkill(){
		AiAgent.simulationAiSkill(this.thisp())
	}
	//========================================================================================================
	applyRangeProjectile(player: Player): boolean {
		if (player.invulnerable) {
			return false
		}
		let ignoreObstacle = false

		for (let proj of this.rangeProjectiles.values()) {
			if (proj.activated && proj.scope.includes(player.pos) && proj.canApplyTo(player)) {
			//	console.log("proj hit" + proj.UPID)

				let skillattack = new Util.SkillAttack(proj.damage, proj.name).setOnHit(proj.action)

				let died = this.entityMediator.skillAttackAuto(
					this.entityMediator.getPlayer(this.turn2Id(proj.sourceTurn)),
					this.turn2Id(player.turn)
				,skillattack)
				//player.hitBySkill(proj.damage, proj.name, proj.sourceTurn, proj.action)

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
		return this.pOfTurn(turn).name
	}
	getNameById(id: string) {
		let p=this.pOfId(id)
		if(!p) return ""
		return p.name
	}
	
	useSkillToTarget(target: number) {
		let p = this.thisp()
		this.entityMediator.skillAttackSingle(p, this.turn2Id(target),p.getSkillDamage(target))

	//	return this.getSkillStatus()
	}
	onSelectSkill(skill:ENUM.SKILL):ServerGameEventInterface.SkillInit{
		return this.thisp().initSkill(skill)
	}
	//========================================================================================================

	/**
	 *
	 * @returns turn,issilent,cooltile,duration,level,isdead
	 */
	getSkillStatus():ServerGameEventInterface.SkillStatus {
		return this.thisp().getSkillStatus()
	}


	//========================================================================================================
	useAreaSkill(pos: number) {
	//	console.log("usearea"+pos)
		this.thisp().usePendingAreaSkill(pos)
	}
	placeSkillProjectile(pos: number) {
		let proj = this.thisp().getSkillProjectile(pos)
		this.placeProjectile(proj, pos)
	}

	placeProjNoSelection(proj: Projectile, pos: number) {
		this.placeProjectile(proj, pos)
	}

	//========================================================================================================

	isAttackableCoordinate(c: number): boolean {
		let coor = this.shuffledObstacles
		if (c < 1 || c >= coor.length || coor[c].obs === -1 || coor[c].obs === 0) {
			return false
		}
		return true
	}
	//========================================================================================================
	getPlaceableCoordinates(start: number, size: number) :number[]{
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
	//========================================================================================================
	placeSubmarine(pos: number) {
		let upid = this.placeProjectile(new ProjectileBuilder(this, "submarine", Projectile.TYPE_PASS).build(), pos)
		this.submarine_id = upid
	}
//========================================================================================================
	placeProjectile(proj: Projectile, pos: number): string {
		let id = this.UPIDGen.generate()
		proj.place(pos, id)

		if (proj instanceof PassProjectile) {
			this.passProjectiles.set(id, proj)
			this.eventEmitter.placePassProj( proj.getTransferData())
		} else if (proj instanceof RangeProjectile) {
			this.rangeProjectiles.set(id, proj)
			this.eventEmitter.placeProj(proj.getTransferData())
		}
		return id
	}
//========================================================================================================
	removeRangeProjectileById(UPID: string) {
		if (!this.rangeProjectiles.has(UPID)) return

		this.rangeProjectiles.get(UPID).remove()
		this.rangeProjectiles.delete(UPID)
		this.eventEmitter.removeProj(UPID)
	}
//========================================================================================================
	removePassProjectileById(UPID: string) {
		if (!this.passProjectiles.has(UPID)) return

		this.passProjectiles.get(UPID).remove()
		this.passProjectiles.delete(UPID)
		this.eventEmitter.removeProj(UPID)
	}
//========================================================================================================
	getGodHandTarget():number[] {
		return this.entityMediator
			.selectAllFrom(EntityFilter.ALL_ALIVE_PLAYER(this.thisp()).excludeUntargetable().notMe())
			.map(function (p: Player) {
				return p.turn
			})
	}

	//========================================================================================================

	/**
	 * 선택 장애물 대기중일 경우 바로 스킬로 안넘어가고 선택지 전송
	 * @returns null if no pending obs,  or return {name,arg}
	 */
	checkPendingObs(): ServerGameEventInterface.PendingObstacle {
		if (this.pendingObs === 0 || this.thisp().dead) return null

		let name = ""
		let argument: number | number[] = -1
		if (this.pendingObs === 21) {
			//신의손 대기중일 경우 바로 스킬로 안넘어가고 신의손 타겟 전송
			let targets = this.getGodHandTarget()
			if (targets.length > 0) {
				name = "server:pending_obs:godhand"
				argument = targets
			} else {
				this.resetPendingObs()
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
		else{
			let result=this.thisp().mapHandler.getPendingObs(this.pendingObs)
			if(!result) return null

			name=result.name
			argument=result.argument
		}
	
		return { name: name, argument: argument }
	}

	//========================================================================================================
	processPendingObs(info: ClientInputEventInterface.PendingObstacle,delay?:number) {
		
		this.arriveSquareCallback=null

		if(!delay)
			delay=0
		if(!this.instant)
			this.arriveSquareTimeout=setTimeout(this.resolveArriveSquareCallback.bind(this),delay)
		
		
		//console.log("onPendingObsComplete"+this.pendingObs)
		//console.log(info)
		if (!info) {
			this.thisp().mapHandler.onPendingObsTimeout(this.pendingObs)
			this.roulleteComplete()
			this.resetPendingObs()
			return
		}
		//타임아웃될 경우
		if(!info || !info.complete) return
		if (this.pendingObs === 0) {
			return
		}
		if (info.type === "roullete") {
			this.roulleteComplete()
		}
		else if (info.type === "godhand") {
			info.objectResult.kind='godhand'
			if (info.complete && info.objectResult.kind==='godhand') {
				this.processGodhand(info.objectResult.target,info.objectResult.location)
			}
		}
		else{
			
			this.thisp().mapHandler.onPendingObsComplete(info)
		}

		this.resetPendingObs()
	}
	//========================================================================================================

	processPendingAction(info: ClientInputEventInterface.PendingAction,delay?:number) {
		//console.log(info)

		
		// if (!info) {
		// 	this.pendingAction = null
		// 	return
		// }
		//타임아웃될 경우
		if(!delay)
			delay=0
		this.arriveSquareCallback=null

		if(!this.instant)
			this.arriveSquareTimeout=setTimeout(this.resolveArriveSquareCallback.bind(this),delay)

		if (!info||!this.pendingAction || !info.complete) {
			this.pendingAction = null
			return
		}
		this.thisp().mapHandler.onPendingActionComplete(info)

		this.pendingAction = null
		
	}
	roulleteComplete() {
		if(this.roullete_result===-1) return
		//	console.log("roullete" + this.pendingObs)

		let p = this.thisp()
		//사형재판
		if (this.pendingObs === 37) {
			ObstacleHelper.trial(p, this.roullete_result)
		}
		//카지노
		else if (this.pendingObs === 38) {
			ObstacleHelper.casino(p, this.roullete_result)
		}

		this.resetPendingObs()
		this.roullete_result = -1
	}

	userCompleteStore(data: ClientInputEventInterface.ItemBought){
		this.pOfTurn(data.turn).inven.playerBuyItem(data)
	}
	//========================================================================================================

	getStoreData(turn: number):ServerGameEventInterface.EnterStore {
		let p = this.pOfTurn(turn)
		return p.inven.getStoreData(1)
	}
	onDestroy(){
		clearTimeout(this.arriveSquareTimeout)
	}
	//========================================================================================================
	getFinalStatistics() {
		this.recordStat()
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

		let sortedplayers = this.entityMediator.allPlayer().sort((a, b) => {
			if (a.turn === this.winner) {
				return -1
			}
			if (b.turn === this.winner) {
				return 1
			} else {
				if (b.kill === a.kill) {
					return a.death - b.death
				} else {
					return b.kill - a.kill
				}
			}
		})

		for (let p of sortedplayers) {
			data.players.push({
				team: p.team,
				name: p.name,
				champ: p.champ_name,
				champ_id: p.champ,
				turn: p.turn,
				stats: p.statistics.stats,
				kda: [p.kill, p.death, p.assist],
				items: p.inven.sortedItemSlot(),
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
	getSummaryStatistics() {
		let gameresult = {
			totalturn: this.totalturn,
			isTeam: this.isTeam,
			map: MAP.get(this.mapId).mapname,
			players: new Array<any>()
		}

		let sortedplayers = this.entityMediator.allPlayer().sort((a, b) => {
			if (a.turn === this.winner) {
				return -Infinity
			}
			if (b.turn === this.winner) {
				return Infinity
			} else {
				if (b.kill === a.kill) {
					return a.death - b.death
				} else {
					return b.kill - a.kill
				}
			}
		})

		for (const [i, p] of sortedplayers.entries()) {
			gameresult.players.push({
				rank: i,
				turn: p.turn,
				champ_id: p.champ,
				kill: p.kill,
				death: p.death,
				assist: p.assist,
				team: p.team
			})
		}
		return gameresult
	}
	getTrainData():GameRecord {
		let g=new GameRecord(this.totalturn)
		for (const p of this.entityMediator.allPlayer()) {
			g.add(p.getTrainIndicator(this.totalturn),p.getCoreItemBuild())
		}
		return g
	}
}

export { Game }
