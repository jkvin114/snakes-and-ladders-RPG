import CONFIG from "./../config/config.json"
import SETTINGS = require("../res/globalsettings.json")
import * as ENUM from "./data/enum"
import * as Util from "./core/Util"
import { Projectile, ProjectileBuilder, RangeProjectile, PassProjectile } from "./Projectile"
import { ObstacleHelper } from "./core/Obstacles"
import { AiAgent } from "./AiAgents/AiAgent"
import { SummonedEntity } from "./characters/SummonedEntity/SummonedEntity"
import { Entity } from "./entity/Entity"
import { ClientInputEventFormat, ServerGameEventFormat } from "./data/EventFormat"
import {MAP} from "./MapHandlers/MapStorage"
import { EntityMediator } from "./entity/EntityMediator"
import { Player } from "./player/player"
import { EntityFilter } from "./entity/EntityFilter"
// import { PlayerClientInterface } from "./app"

import { GAME_CYCLE } from "./GameCycle/StateEnum"
import { GameSetting } from "./GameSetting"
import { GameEventObserver } from "./GameEventObserver"
import { GameRecord } from "./TrainHelper"
import { ReplayEventRecords } from "./ReplayEventRecord"
import { PlayerFactory } from "./player/PlayerFactory"
import { SkillAttack } from "./core/skill"
import { GameLevel } from "./MapHandlers/GameMapHandler"
const STATISTIC_VERSION = 3
//version 3: added kda to each category
const crypto = require("crypto")

function encrypt(val: string, key: string):string {
	return crypto
		.createHash("sha512")
		.update(val + key)
		.digest("hex")
}

class Game {
	readonly instant: boolean //readonly: can only assign value in constructor
	readonly rname: string
	readonly mapId: number
	readonly simulation: boolean
	readonly itemLimit: number
	readonly isTeam: boolean
	readonly setting: GameSetting
	
	private PNUM: number
	private CNUM: number
	totalnum: number
	thisturn: number
	// skilldmg: any
	// skillcount: number
	private clientsReady: number
	// nextUPID: number
	private readonly UPIDGen: Util.UniqueIdGenerator
	private readonly UEIDGen: Util.UniqueIdGenerator

	// nextPassUPID: number
	private rangeProjectiles: Map<string, RangeProjectile>
	private passProjectiles: Map<string, PassProjectile>
	private passProjectileQueue: PassProjectile[]
	gameover: boolean
	private winner: number
	private winnerTeam:number

	// private summonedEntityList: Map<string, SummonedEntity>
	
	private totalEffectsApplied: number
	totalturn: number
	private killRecord: {
		pos: number
		turn: number
		killer: Number
		dead: number
	}[]
	// playerSelector: PlayerSelector
	private entityMediator: EntityMediator
	private turnTokens:string[]
	private turnTokenKey: string
	begun:boolean
	private cycle:number
	arriveSquareCallback:Function|null
	private arriveSquareTimeout:NodeJS.Timeout|null
	eventEmitter:GameEventObserver
	disconnectedPlayers:Set<number>
	
	private static readonly PLAYER_ID_SUFFIX = "P"
	private replayRecord:ReplayEventRecords
	mapHandler:GameLevel
	constructor(mapid: number, rname: string, setting: GameSetting) {
		this.setting = setting
		this.instant = setting.instant
		this.simulation = false
		this.rname = rname
		if (mapid < 0 || mapid > 4) mapid = 0
		this.mapId = mapid //0: 오리지널  1:바다  2:카지노
		this.mapHandler=GameLevel.create(this,this.mapId,setting.shuffleObstacle)
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
		this.winner = -1
		this.winnerTeam=-1
		this.itemLimit = setting.itemLimit
		// this.nextUPID = 1
		// this.nextPassUPID = 1
		// this.summonedEntityList = new Map()
		this.rangeProjectiles = new Map()
		this.passProjectiles = new Map()
		this.passProjectileQueue = []
		this.gameover = false
		this.killRecord = []
		this.totalEffectsApplied = 0 //total number of effects applied until now
		// this.playerSelector = new PlayerSelector(this.isTeam)
		this.UPIDGen = new Util.UniqueIdGenerator(this.rname + "_P")
		this.UEIDGen = new Util.UniqueIdGenerator(this.rname + "_ET")
		this.turnTokenKey = Math.round(new Date().valueOf() * Math.random() * Math.random()) + this.rname
		
		this.turnTokens = []
		for (let i = 0; i < 4; ++i) {
			this.turnTokens.push( encrypt(String(i), this.turnTokenKey).slice(0,8))
		}
		this.arriveSquareTimeout=null
		this.arriveSquareCallback=null

		this.eventEmitter=new GameEventObserver(this.rname)
		this.entityMediator = new EntityMediator(this.isTeam, this.instant, this.rname)
		this.disconnectedPlayers=new Set<number>()

		this.replayRecord=new ReplayEventRecords(setting.replay)
		this.eventEmitter.bindEventRecorder(this.replayRecord)
		this.entityMediator.setClientInterface(this.eventEmitter)
	}
	sendToClient(transfer: Function, ...args: any[]) {
		if (!this.instant) {
			transfer(this.rname, ...args)
		}
		//console.log("sendtoclient",transfer.name)
	}
	setClientInterface(ci:GameEventObserver){
		ci.bindEventRecorder(this.replayRecord)
		this.eventEmitter=ci
		this.entityMediator.setClientInterface(ci)
	}
	onCreate(){
		this.replayRecord.setInitialSetting(this.getInitialSetting())
	}
	retrieveReplayRecord(){
		return this.replayRecord
	}
	thisp(): Player {
		return this.entityMediator.getPlayer(this.turn2Id(this.thisturn))
	}

	pOfTurn(turn: number): Player{
		if(turn<0 || turn>this.totalnum){
			console.trace("Player index out of range at pOfTurn()!")
			turn=0
		}

		return this.entityMediator.getPlayer(this.turn2Id(turn))
	}
	pOfId(id:string){
		return this.entityMediator.getPlayer(id)
	}
	nullablePlayerTurn(player:Player|null){
		if(!player) return -1
		return player.turn
	}
	getPlayerMessageHeader(turn:number){
		return (
			this.pOfTurn(turn)?.name +
				"(" +
				SETTINGS.characters[this.pOfTurn(turn).champ].name +
				")"
		)
	}
	turn2Id(turn: number) {
		return String(turn + 1) + Game.PLAYER_ID_SUFFIX
	}
	id2Turn(id:string):number{
		return Number(id[0])
	}

	getGameTurnToken(turn: number) {
		if(turn<0 || turn>= this.totalnum){
			turn=0
			console.trace("Player index out or range at getGameTurnToken()!")
		}
		return this.turnTokens[turn]
	}
	thisGameTurnToken() {
		return this.turnTokens[this.thisturn]
	}
	isThisTurn(cryptTurn: string) {
		//	console.log(this.turnEncryption.get(this.game.thisturn),cryptTurn)
		return this.turnTokens[this.thisturn] === cryptTurn
	}
	setCycle(cycle:number){
		this.cycle=cycle
	}
	getObstacleAt(pos:number){
		if(pos>=this.mapHandler.obstaclePlacement.length || pos<0) return 0
		return this.mapHandler.obstaclePlacement[pos].obs
	}
	getMoneyAt(pos:number){
		if(pos>=this.mapHandler.obstaclePlacement.length || pos<0) return 0
		return this.mapHandler.obstaclePlacement[pos].money * 10
	}
	//========================================================================================================

	//team:number,char:int,name:str
	addPlayer(team: boolean, char: number, name: string) {
		// console.log("add player " + char + "  " + team)
		let teamValue=Number(team)
		if(!this.isTeam) teamValue=this.totalnum
		let p=this.createPlayer(teamValue,char,name,this.totalnum,false)
		this.entityMediator.register(p,p.UEID)
		// this.playerSelector.addPlayer(p)
		this.PNUM += 1
		this.totalnum += 1
	}
	createPlayer(team: number, char: number, name: string,turn:number,AI:boolean){
		let p = PlayerFactory.create(Number(char), name, turn, team, this, AI)
		p.setMediator(this.entityMediator)
		
		return p
	}
	//========================================================================================================

	//team:number,char:str,name:str
	addAI(team: boolean, char: number, name: string) {
		// console.log("add ai " + char + "  " + team)
		let teamValue=Number(team)
		if(!this.isTeam) teamValue=this.totalnum
		
		let p=this.createPlayer(teamValue,char,name,this.totalnum,true)
		this.entityMediator.register(p,p.UEID)
		// this.playerSelector.addPlayer(p)
		this.CNUM += 1
		this.totalnum += 1
	}
	getTeamAsBool(team:number):boolean{
		return team===0
	}
	getInitialSetting():ServerGameEventFormat.initialSetting {
		let setting= []
		for (let p of this.entityMediator.allPlayer()) {
			setting.push({
				turn: p.turn,
				team: this.getTeamAsBool(p.team),
				HP: p.HP,
				isLoggedIn:p.isLoggedIn,
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
			map:this.mapId,
			playerSettings: setting,
			gameSettings: this.setting.getInitialSetting(),
			shuffledObstacles: this.mapHandler.obstaclePlacement.map((obs)=>obs.obs)
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
		if(!this.begun)
			this.onGameStart()
		return true
	}
	onGameStart(){
		for(const p of this.entityMediator.allPlayer()){
			p.onGameStart()
			if(p.AI) this.eventEmitter.message(this.getPlayerMessageHeader(p.turn),p.AiAgent.gameStartMessage)
		}
	}
	//========================================================================================================

	user_update(turn:number,type:string,data:any){
		if(type==='auto_store'){
			this.pOfTurn(turn).setAutoBuy(data)
		}
	}

	getDiceControlPlayer() {
		const bias = 1.5

		let firstplayer = this.entityMediator.selectBestOneFrom(EntityFilter.ALL_PLAYER(this.thisp()),function () {
			return this.pos
		})
		if(!firstplayer) return

		return Util.chooseWeightedRandom(
			this.entityMediator.allPlayer().map((p) => {
				return firstplayer.pos * bias - p.pos
			})
		)
	} //50 30 20   :   25  45  55    : 20%, 36%, 44%

	

	/**
	 * 킬을 해서 추가주사위 던지면 80%로 앞1~ 8칸이내에 주컨아이템 소환
	 * @param turn
	 */
	summonDicecontrolItemOnkill(turn: number) {
		this.mapHandler.summonDicecontrolItemOnkill(turn)
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
		this.mapHandler.resetPendingObs()
		this.mapHandler.setPendingAction = null
		let p = this.thisp()
		this.entityMediator.onTurnEnd(this.thisturn)
		p.onMyTurnEnd()
	}
	onOneMoreDice(p:Player){
		p.onMyTurnStart()
	//	console.log("ONE MORE DICE")
		p.oneMoreDice = false
		p.effects.onOneMoreDice()
		this.summonDicecontrolItemOnkill(p.turn)
		p.adice = 0
	}
	onPlayerChangePos(turn:number){
		let secondLevel=this.entityMediator.getSecondPlayerLevel()
		// console.log("onPlayerChangePos"+secondLevel)
		if(this.setting.winByDecision){
			let finishpos=this.mapHandler.setFinishPos(secondLevel)
			if(finishpos!==-1) this.eventEmitter.update("finish_pos",turn,finishpos)
		}
	}
	getNextTurn(){
		return (this.thisturn+1) % this.totalnum
	}
	goNextTurn():ServerGameEventFormat.TurnStart|null {
		if (this.gameover) {
			return null
		}
		
		//console.log(this.replayRecord)
		this.entityMediator.forAllPlayer(function () {
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

			// this.summonDicecontrolItem()
			this.projectileCooldown()
			this.mapHandler.onTurnStart(this.thisturn)
			if (this.thisturn <= lastturn) {
			//	console.log(`turn ${this.totalturn}===========================================================================`)

				this.totalturn += 1
				if (this.totalturn >= 30 && this.totalturn % 10 === 0) {
					this.entityMediator.forAllPlayer(function () {
						this.ability.addExtraResistance((this.game.totalturn / 10) * 2 * this.game.setting.extraResistanceAmount)
					})
				}
				this.recordStat()

				//잠수함, 1턴 일때만 소환
				// if (this.mapId === ENUM.MAP_TYPE.OCEAN) {
				// 	this.summonSubmarine()
				// }
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

		let avaliablepos: number[] = []
		if (p.diceControl) {
			avaliablepos = p.getPossiblePosList()
		}
		//	console.log("avliablepos" + avaliablepos)
		return {
			crypt_turn: this.getGameTurnToken(p.turn),
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
	getPlayerVisibilitySyncData():ServerGameEventFormat.PlayerPosSync[] {
		let data:ServerGameEventFormat.PlayerPosSync[] = []

		this.entityMediator.forAllPlayer(function () {
			data.push({
				alive: !this.dead,
				pos: this.pos,
				turn: this.turn
			})
		})

		return data
	}
	isFinishPosition(pos:number){
		return this.mapHandler.isFinishPos(pos)
	}
	/**
	 * called start of every turn,
	 * record all player`s current position of this turn
	 */
	recordStat() {
		this.entityMediator.forAllPlayer(function (this:Player) {
			this.addStatisticRecord()
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

	rollDice(dicenum: number):ServerGameEventFormat.DiceRoll {
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
				this.mapHandler.setPendingAction = "ask_way2"
			}
		}
		if(mapresult.type==="subway"){
			if(mapresult.args)
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
		const data= {
			dice: diceShown, //표시된 주사위 숫자
			actualdice: moveDistance, //플레이어 움직일 거리
			currpos: currpos,
			turn: this.thisturn,
			dcused: dcused,
			died: died,
			crypt_turn:this.thisGameTurnToken()
		}
		this.eventEmitter.rollDice(data)
		return data
		
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
	/**
	 * if obstacle is one of pending obstacle and player is not AI, 
	 * save the obs as pending obs
	 * @param obs 
	 */
	setPendingObs(obs:number){
		if (SETTINGS.pendingObsList.includes(obs)) {
			if (!this.thisp().AI) {
				this.mapHandler.setPendingObs=obs
			}
		}
	}
	//========================================================================================================

	/**
	 * 1-1. normal: set arriveSquareTimeout to call onObstacleComplete() after delay
	 * 1-2. simulation: call onObstacleComplete() immediately after this method
	 * 2. apply pass projectile
	 *  2-1. if died, return ARRIVE_SQUARE_RESULT_TYPE.DEATH
	 * 3. make the player arrive at square and ger effect
	 *  3-1. if game finished, return ARRIVE_SQUARE_RESULT_TYPE.FINISH
	 * 4. save pending obstacle if applicable
	 * 
	 * @param delay 
	 * @returns ARRIVE_SQUARE_RESULT_TYPE or obstacle id
	 */
	arriveAtSquare(delay?:number): number {
		let p = this.thisp()
		this.arriveSquareCallback=null
		if(!delay)
			delay=0

		if(!this.instant)
			this.arriveSquareTimeout=setTimeout(this.onObstacleComplete.bind(this),delay)
	//	p.onBeforeObs()

		//passprojqueue 에 있는 투사체들을 pendingaction 에 적용
		let died = this.applyPassProj()

		if (died) return ENUM.ARRIVE_SQUARE_RESULT_TYPE.DEATH

		//장애물 효과 적용
		let result = p.arriveAtSquare(false)

		// if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.STORE) {
		// //	p.effects.apply(ENUM.EFFECT.SILENT, 1, EFFECT_TIMING.BEFORE_SKILL)
		// 	if (p.AI) {
		// 		p.AiAgent.store()
		// 		result = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		// 	}
		// }

		if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH) {
			this.winner = this.thisturn
			this.winnerTeam=this.thisp().team
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

	/**
	 * resolve arriveSquareCallback and take player onAfterObs() action
	 */
	onObstacleComplete()
	{
	//	console.log("--------------------------------onObstacleComplete")
		this.resolveArriveSquareCallback()
		this.thisp().onAfterObs()
	}
	/**
	 * extends arriveSquareTimeout time
	 * 
	 * if the movement doesn`t ignore obstacle, make player arrive at the square after some delay
	 * @param player 
	 * @param movetype 
	 * @param ignoreObstacle 
	 */
	requestForceMove(player:Player, movetype: string,ignoreObstacle:boolean){
		let delay=SETTINGS.delay_simple_forcemove
		if(movetype=== ENUM.FORCEMOVE_TYPE.LEVITATE) delay=SETTINGS.delay_levitate_forcemove
		if(movetype==ENUM.FORCEMOVE_TYPE.WALK) delay=SETTINGS.delay_walk_forcemove
	//	console.log("--------------------------------requestForceMove")
	//	console.log(this.cycle)
		if(this.cycle===GAME_CYCLE.BEFORE_SKILL.ARRIVE_SQUARE){
			if(this.arriveSquareTimeout)
			clearTimeout(this.arriveSquareTimeout)
			//call onAfterObs() of the player afterwards
			this.arriveSquareTimeout=setTimeout(this.onObstacleComplete.bind(this),delay)
		}
		else if(this.cycle===GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION_PROGRESS
			 || this.cycle===GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE_PROGRESS){
			if(this.arriveSquareTimeout)
			clearTimeout(this.arriveSquareTimeout)
			//do not call onAfterObs() of the player
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
	 * 1.for all projectiles in passprojectile queue to current turn player:
	 * 	1-1.save as pending action or receive effect immediately
	 * 	1-2.remove projectiles if possible
	 *  1-3. break if player died
	 * 
	 */
	applyPassProj() {
		let died = false
		for (let pp of this.passProjectileQueue) {
			let upid = this.mapHandler.applyPassProj(pp.name)
			if (upid===""){
				//died = this.thisp().hitBySkill(pp.damage, pp.name, pp.sourceTurn, pp.action)

				if(pp.sourcePlayer){
					let skillattack = new SkillAttack(pp.damage, pp.name,-1,pp.sourcePlayer).setOnHit(pp.action)
					died = this.entityMediator.skillAttackAuto(
						pp.sourcePlayer,
						this.turn2Id(this.thisturn)
					,skillattack)
				}

				upid = pp.UPID
			}

			if (!pp.hasFlag(Projectile.FLAG_NOT_DISAPPER_ON_STEP)) this.removePassProjectileById(upid)

			if (died) break
		}
		this.passProjectileQueue = []
		return died
	}
	getPendingAction():string|null{
		return this.mapHandler.getPendingAction
	}
	//========================================================================================================

	/**
	 * 클라로부터 신의손 정보 받아서 실행시킴
	 * @param {} godhand_info target,location
	 */
	processGodhand(target: number, location: number ) {
		let p = this.pOfTurn(target)
		p.markDamageFrom(this.thisturn)
		this.playerForceMove(p, location, false,  ENUM.FORCEMOVE_TYPE.LEVITATE)
	}
	//========================================================================================================


	aiSkill(callback:Function) {
		this.thisp().aiSkill(callback)
	}
	simulationAiSkill(){
		this.thisp().simulationAiSkill()
	}
	//========================================================================================================
	/**
	 * 
	 * @param player 
	 * @returns true if player should ignore obstacle under it
	 */
	applyRangeProjectile(player: Player): boolean {
		if (player.invulnerable) {
			return false
		}
		let ignoreObstacle = false

		for (let proj of this.rangeProjectiles.values()) {
			if (proj.activated && proj.scope.includes(player.pos) && proj.canApplyTo(player)) {
			//	console.log("proj hit" + proj.UPID)
				let died=false
				if(proj.sourcePlayer){
					let skillattack = new SkillAttack(proj.damage, proj.name,-1,proj.sourcePlayer).setOnHit(proj.action)
					died= this.entityMediator.skillAttackAuto(
						proj.sourcePlayer,
						this.turn2Id(player.turn)
					,skillattack)
				}
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
		let damage=p.getSkillDamage(this.pOfTurn(target),p.pendingSkill)
	
		if(!damage) return
		this.entityMediator.skillAttackSingle(damage.source, this.turn2Id(target),damage)

	//	return this.getSkillStatus()
	}
	onSelectSkill(skill:ENUM.SKILL):ServerGameEventFormat.SkillInit{
		return this.thisp().initSkill(skill)
	}
	//========================================================================================================

	/**
	 *
	 * @returns turn,issilent,cooltile,duration,level,isdead
	 */
	getSkillStatus():ServerGameEventFormat.SkillStatus {
		return this.thisp().getSkillStatus()
	}


	//========================================================================================================
	useAreaSkill(pos: number) {
	//	console.log("usearea"+pos)
		this.thisp().usePendingAreaSkill(pos)
	}
	placeSkillProjectile(pos: number) {
		let proj = this.thisp().getSkillProjectile(pos)
		if(!proj) return
		this.placeProjectile(proj, pos)
	}

	placeProjNoSelection(proj: Projectile, pos: number) {
		this.placeProjectile(proj, pos)
	}

	//========================================================================================================

	isAttackableCoordinate(c: number): boolean {
		let coor = this.mapHandler.obstaclePlacement
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

		this.rangeProjectiles.get(UPID)?.remove()
		this.rangeProjectiles.delete(UPID)
		this.eventEmitter.removeProj(UPID)
	}
//========================================================================================================
	removePassProjectileById(UPID: string) {
		if (!this.passProjectiles.has(UPID)) return

		this.passProjectiles.get(UPID)?.remove()
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
	checkPendingObs(): ServerGameEventFormat.PendingObstacle|null {
		return this.mapHandler.checkPendingObs(this.thisp())
	}

	//========================================================================================================
	processPendingObs(info: ClientInputEventFormat.PendingObstacle|null,delay?:number) {
		
		this.arriveSquareCallback=null

		if(!delay)
			delay=0
		if(!this.instant)
			this.arriveSquareTimeout=setTimeout(this.resolveArriveSquareCallback.bind(this),delay)
		
		this.mapHandler.processPendingObs(this.thisp(),info,delay)
	}
	//========================================================================================================

	processPendingAction(info: ClientInputEventFormat.PendingAction|null,delay?:number) {
		
		//타임아웃될 경우
		if(!delay)
			delay=0
		this.arriveSquareCallback=null

		if(!this.instant)
			this.arriveSquareTimeout=setTimeout(this.resolveArriveSquareCallback.bind(this),delay)
		this.mapHandler.processPendingAction(this.thisp(),info,delay)
		
	}
	userCompleteStore(data: ClientInputEventFormat.ItemBought){
		this.pOfTurn(data.turn).inven.playerBuyItem(data)
	}
	//========================================================================================================

	getStoreData(turn: number):ServerGameEventFormat.EnterStore {
		let p = this.pOfTurn(turn)
		return p.inven.getStoreData(1)
	}
	onDestroy(){
		if(this.arriveSquareTimeout)
			clearTimeout(this.arriveSquareTimeout)
		this.gameover=true
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
			replay:"",
			setting: this.setting.getSummary()
		}
		
		data.replay=null

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
				team: this.getTeamAsBool(p.team),
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
				team: this.getTeamAsBool(p.team)
			})
		}
		return gameresult
	}
	getTrainData():GameRecord {
		let g=new GameRecord(this.totalturn)
		for (const p of this.entityMediator.allPlayer()) {
			let ind=p.getTrainIndicator(this.totalturn)
			if(p.team===this.winnerTeam) ind.isWinner=true

			g.add(ind,p.getCoreItemBuild())
		}
		return g
	}
}

export { Game }
