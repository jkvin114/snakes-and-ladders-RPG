import { RoomClientInterface } from "../app"
import SETTINGS = require("../../res/globalsettings.json")

import { Game, GameSetting} from "../Game"
import { GAME_CYCLE } from "./StateEnum"
import { ClientPayloadInterface, ServerPayloadInterface } from "../PayloadInterface"
import { ARRIVE_SQUARE_RESULT_TYPE, INIT_SKILL_RESULT } from "../enum"
import { PlayerType, ProtoPlayer, randInt, sleep } from "../Util"
interface TimeOutState {
	onTimeout(): GameCycleState
	stopTimeout(): void
	extendTimeout(): void
}
abstract class GameCycleState {
	game: Game
	readonly turn: number
	readonly crypt_turn: string
	readonly rname: string
	abstract onCreate(): void
    readonly id:number
	idleTimeout:NodeJS.Timeout
	gameover:boolean
	constructor(game: Game,id:number) {
        this.id=id
		this.gameover=false
		this.game = game
		this.game.setCycle(id)
		this.turn = this.game.thisturn
		this.crypt_turn = this.game.thisCryptTurn()
		this.rname = this.game.rname
		this.idleTimeout=null
		this.onCreate()
		console.log("gamecycle"+id)
	}
	onDestroy(){
		this.clear()
	}
	onUserPressDice(dicenum: number,crypt_turn:string): GameCycleState {
		console.error("invalid request, id:"+this.id)
		return this
	}
	onUserClickSkill(skill: number,crypt_turn:string): ServerPayloadInterface.SkillInit {
		console.error("invalid request, id:"+this.id)

		return null
	}
	onUserBasicAttack(crypt_turn:string): GameCycleState {
		console.error("invalid request, id:"+this.id)

		return this
	}
	onUserChooseSkillTarget(target: number,crypt_turn:string): GameCycleState {
		console.error("invalid request, id:"+this.id)

		return this
	}
	onUserChooseSkillLocation(location: number,crypt_turn:string): GameCycleState {
		console.error("invalid request, id:"+this.id)

		return this
	}
	onUserChooseAreaSkillLocation(location: number,crypt_turn:string): GameCycleState {
		console.error("invalid request, id:"+this.id)

		return this
	}
	onUserStoreComplete(data: ClientPayloadInterface.ItemBought): void {
		
        if(this.id===GAME_CYCLE.GAMEOVER || this.crypt_turn!==data.crypt_turn) return

        this.game.userCompleteStore(data)
	}
	onUserCompletePendingObs(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string): GameCycleState {
		console.error("invalid request")

		return this
	}
	onUserCompletePendingAction(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string): GameCycleState {
		
		console.error("invalid request")

		return this
	}
    timeOut(foo:Function,additional?:Function):number{
        if(this.idleTimeout!=null){
			RoomClientInterface.startTimeout(this.rname, this.game.thisCryptTurn(), SETTINGS.idleTimeout)

            this.idleTimeout=setTimeout(()=>{
                foo()
				if(!additional) additional()
            },SETTINGS.idleTimeout)
        }
		return this.game.thisturn
    }
	clear(){
		if(this.idleTimeout!=null){
			RoomClientInterface.stopTimeout(this.rname, this.game.thisCryptTurn())
			clearTimeout(this.idleTimeout)
		}
			
	}
    onTimeout():GameCycleState{
        return new TurnInitializer(this.game)
    }
	getNext():GameCycleState{
		return this
	}
	getData<T>():T{
		return null
	}
}
class GameInitializer extends GameCycleState{
	static id=GAME_CYCLE.BEFORE_START
	constructor(game:Game){
		super(game,GameInitializer.id)
	}
	static create(mapid: number, rname: string,setting: ClientPayloadInterface.GameSetting,instant:boolean,isTeam:boolean ,playerlist:ProtoPlayer[]):GameInitializer{
		return GameInitializer.createWithSetting(mapid,rname,new GameSetting(setting, instant, isTeam),playerlist)
	}
	static createWithSetting(mapid: number, rname: string,setting: GameSetting, playerlist:ProtoPlayer[]){
		let game = new Game(mapid, rname, setting)
		for (let i = 0; i < playerlist.length; ++i) {
			let team = playerlist[i].team
			let p =playerlist[i]

			if (p.champ === -1) p.champ = randInt(SETTINGS.characters.length)

			if (p.type === PlayerType.PLAYER_CONNECED) {
				game.addPlayer(team, p.champ, p.name)
			} else if (p.type === PlayerType.AI) {
				game.addAI(
					team,
					p.champ,
					SETTINGS.characters[Number(p.champ)].name + "_Bot(" + String(game.totalnum + 1) + "P) "
				)
			}
		}
		return new GameInitializer(game)
	}
	onCreate(): void {
	}
	getNext(): GameCycleState {
		return new TurnInitializer(this.game)
	}
}

class TurnInitializer extends GameCycleState{
    static id=GAME_CYCLE.BEFORE_OBS.INITIALIZE
    turnUpdateData:ServerPayloadInterface.TurnStart
    constructor(game:Game){
        let turnUpdateData=game.goNextTurn()
        super(game,TurnInitializer.id)
        this.turnUpdateData=turnUpdateData
        RoomClientInterface.updateNextTurn(this.rname, turnUpdateData)
    }
    onCreate(): void {
		if (this.game.thisturn === 0) {
			RoomClientInterface.syncVisibility(this.rname, this.game.getPlayerVisibilitySyncData())
		}
        // if(!this.turnUpdateData) return
    }
	getNext(): GameCycleState {
		if (this.turnUpdateData == null) return this

		this.onDestroy()
		if (!this.turnUpdateData.ai && !this.turnUpdateData.stun) {
			return new WaitingDice(this.game)
		}
		if (this.turnUpdateData.ai && !this.turnUpdateData.stun) {
			return new AiThrowDice(this.game)
		}
		if(this.turnUpdateData.stun){
			return new StunDice(this.game)
		}
	}
}
class StunDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.STUN
	constructor(game: Game) {
		super(game,StunDice.id)
	}
	onCreate(): void {}
	getNext(): GameCycleState {
		this.onDestroy()
		return new ArriveSquare(this.game)
	}
}
class WaitingDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.WAITING_DICE
	constructor(game: Game) {
		super(game,WaitingDice.id)
	}
	
	onCreate(): void {}
	onUserPressDice(dicenum: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return
		
		let data = this.game.rollDice(dicenum)
		this.onDestroy()
		return new ThrowDice(this.game, data)
	}
}
class ThrowDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.THROW_DICE
	diceData: ServerPayloadInterface.DiceRoll
	constructor(game: Game, diceData: ServerPayloadInterface.DiceRoll) {
		super(game,ThrowDice.id)
		this.diceData = diceData
	}
	getData<T>(): T {
		return this.diceData as unknown as T
	}
	onCreate(): void {}
	getNext(): GameCycleState {
		return new ArriveSquare(this.game)
	}
}
class ArriveSquare extends GameCycleState{
	static id = GAME_CYCLE.BEFORE_SKILL.ARRIVE_SQUARE
	static INITIAL_DELAY=600
	result:number
	
	constructor(game:Game){
		super(game,ArriveSquare.id)
	}
	onCreate(): void {
		this.result = this.game.checkObstacle(ArriveSquare.INITIAL_DELAY)
		if(this.result===ARRIVE_SQUARE_RESULT_TYPE.FINISH){
			this.gameover=true
		}
	}
	getNext(): GameCycleState {
		if(this.game.thisp().AI){
			if(this.game.instant){
				return new AiSimulationSkill(this.game)
			}
			else{
				return new AiSkill(this.game)
			}
		}
		else{
			let obs=this.game.checkPendingObs()
			if(!obs){
				let action=this.game.getPendingAction()
				if(!action || this.game.thisp().dead){
					return new WaitingSkill(this.game)
				}
				return new PendingAction(this.game,action)
			}
			return new PendingObstacle(this.game,obs)
		}
	}
	getData<T>(): T {
		return this.result as unknown as T
	}
	getArriveSquarePromise(): Promise<unknown>{
		if(this.result===ARRIVE_SQUARE_RESULT_TYPE.NONE){
			return sleep(0)
		}

		return new Promise<void>((resolve)=>{			
			this.game.arriveSquareCallback=resolve
		})
	}
}
class AiThrowDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.AI_THROW_DICE
	dice:ServerPayloadInterface.DiceRoll
	constructor(game: Game) {
		super(game,AiThrowDice.id)
	}
	onCreate(): void {
		this.dice = this.game.rollDice(-1)

	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new ArriveSquare(this.game)
	}
	getData<T>(): T {
		return this.dice as unknown as T
	}
}


class AiSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.AI_SKILL
	constructor(game: Game) {
		super(game,AiSkill.id)
	}
	onCreate(): void {
	}
	useSkill(): Promise<unknown>{
		return new Promise((resolve)=>{
			this.game.aiSkill(resolve)
		})
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new TurnInitializer(this.game)
	}
}
class AiSimulationSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.AI_SKILL
	constructor(game: Game) {
		super(game,AiSkill.id)
	}
	onCreate(): void {
	}
	useSkill(){
		this.game.simulationAiSkill()
	}
	getNext(): GameCycleState {
		this.onDestroy()
		return new TurnInitializer(this.game)
	}
}

class PendingObstacle extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_OBSTACLE
    obs:ServerPayloadInterface.PendingObstacle
    idleTimeout:NodeJS.Timeout
	constructor(game: Game,obs:ServerPayloadInterface.PendingObstacle) {
		super(game,PendingObstacle.id)
        this.obs=obs
		RoomClientInterface.sendPendingObs(this.rname, this.obs)
	}
	onCreate(): void {
        
    }
    timeOut(foo:Function){
        return super.timeOut(foo,()=>this.game.processPendingObs(null))
    }

    onUserCompletePendingObs(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string): GameCycleState {
        if(crypt_turn!==this.crypt_turn) return this
        
        this.game.processPendingObs(info)

        return this.getNext()
    }
    getNext(): GameCycleState {
        let action=this.game.getPendingAction()

        this.onDestroy()
        if (!action || this.game.thisp().dead) {
            return new WaitingSkill(this.game)
        }
        else{
            return new PendingAction(this.game,action)
        }
    }
}

class PendingAction extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_SKILL.PENDING_ACTION
    action:string
    idleTimeout:NodeJS.Timeout

	constructor(game: Game,action:string) {
		super(game,PendingAction.id)
        this.action=action
		this.send()
	}
    timeOut(foo:Function){
        return super.timeOut(foo,()=>this.game.processPendingAction(null))
    }
	onCreate(): void {
       
    }
	send(){
		 if (this.action === "submarine") {
            RoomClientInterface.sendPendingAction(this.rname, "server:pending_action:submarine", this.game.thisp().pos)
        }
        if (this.action === "ask_way2") {
            RoomClientInterface.sendPendingAction(this.rname, "server:pending_action:ask_way2", 0)
        }
	}
    onUserCompletePendingAction(info: ClientPayloadInterface.PendingAction,crypt_turn:string): GameCycleState {
        if(crypt_turn!==this.crypt_turn) return this
        this.onDestroy()
        this.game.processPendingAction(info)

        return new WaitingSkill(this.game)
    }
}


export class WaitingSkill extends GameCycleState {
	static id = GAME_CYCLE.SKILL.WAITING_SKILL
	canUseSkill:boolean
	canUseBasicAttack:boolean
	skillInit:ServerPayloadInterface.SkillInit
	constructor(game: Game) {
		super(game,WaitingSkill.id)
        this.idleTimeout=null
		this.canUseSkill=true
	}
	onCreate(): void {
		let status = this.game.getSkillStatus()
		this.canUseSkill=status.canUseSkill
		this.canUseBasicAttack=(status.basicAttackCount>0)
		// console.log(status)
		if(!this.shouldPass())
			RoomClientInterface.setSkillReady(this.rname, status)
	}
	shouldPass(){
		return !this.canUseSkill && !this.canUseBasicAttack
	}
	onUserClickSkill(skill: number,crypt_turn:string): ServerPayloadInterface.SkillInit {
        if(this.crypt_turn!==crypt_turn) return null
		
		this.skillInit=this.game.onSelectSkill(skill - 1)
		return this.skillInit
	}
	onUserBasicAttack(crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this

		this.game.thisp().basicAttack()
		this.onDestroy()
		return new WaitingSkill(this.game)
	}
	getNext(): GameCycleState {
		if(this.shouldPass()) return this

		switch(this.skillInit.type){
			case INIT_SKILL_RESULT.NO_COOL:
			case INIT_SKILL_RESULT.NOT_LEARNED:
			case INIT_SKILL_RESULT.NO_TARGETS_IN_RANGE:
				return this
			case INIT_SKILL_RESULT.NON_TARGET :
			case INIT_SKILL_RESULT.ACTIVATION:
				this.onDestroy()		
				return new WaitingSkill(this.game)
			case INIT_SKILL_RESULT.TARGTING:
				this.onDestroy()		
				return new WaitingTarget(this.game,this.skillInit)
			case INIT_SKILL_RESULT.PROJECTILE:
				this.onDestroy()
				return new WaitingLocation(this.game,this.skillInit)
			case INIT_SKILL_RESULT.AREA_TARGET:
				this.onDestroy()		
				return new WaitingAreaTarget(this.game,this.skillInit)
			default: return this
		}
	}
}
abstract class WaitingSkillResult extends GameCycleState {
    initSkillResult:ServerPayloadInterface.SkillInit
    idleTimeout:NodeJS.Timeout
	constructor(game: Game,id:number,result:ServerPayloadInterface.SkillInit) {
		super(game,id)
        this.initSkillResult=result
	}
	
	

}

class WaitingTarget extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_TARGET

	constructor(game: Game,result:ServerPayloadInterface.SkillInit) {
		super(game,WaitingTarget.id, result)
	}
	onCreate(): void {}
	onUserChooseSkillTarget(target: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this
        
		if (target > 0) {
			this.game.useSkillToTarget(target)
		}
		this.onDestroy()		
		return new WaitingSkill(this.game)
	}
}
class WaitingLocation extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_LOCATION

	constructor(game: Game,result:ServerPayloadInterface.SkillInit) {
		super(game,WaitingLocation.id,result)
	}
	onCreate(): void {}
	onUserChooseSkillLocation(location: number,crypt_turn:string): GameCycleState {
        if(this.crypt_turn!==crypt_turn) return this
		if (location > 0) {
			this.game.placeSkillProjectile(location)
		}
		this.onDestroy()		
		return new WaitingSkill(this.game)
	}
}
class WaitingAreaTarget extends WaitingSkillResult {
	static id = GAME_CYCLE.SKILL.WAITING_AREA_TARGET

	constructor(game: Game,result:ServerPayloadInterface.SkillInit) {
		super(game,WaitingAreaTarget.id,result)
	}
	onCreate(): void {}
	onUserChooseAreaSkillLocation(location: number,crypt_turn:string): GameCycleState {
		console.log("usearea"+crypt_turn)

		if(this.crypt_turn!==crypt_turn) return this
        if (location > 0) {
			this.game.useAreaSkill(location)
		}
		this.onDestroy()		
		return new WaitingSkill(this.game)
	}
}
export {PendingObstacle,PendingAction}
export {AiThrowDice,AiSkill,AiSimulationSkill}
export {GameInitializer,GameCycleState,TurnInitializer,WaitingDice,ThrowDice,ArriveSquare}