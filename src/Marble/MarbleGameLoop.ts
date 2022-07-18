import { sleep,ProtoPlayer,PlayerType } from "../core/Util";
import { Action,ACTION_TYPE } from "./action/Action";
import { ActionSource, ACTION_SOURCE_TYPE } from "./action/ActionSource";
import { DelayedAction, MoveAction, RollDiceAction } from "./action/DelayedAction";
import {MarbleGame } from "./Game"
import { GAME_CYCLE, GAME_CYCLE_NAME } from "./gamecycleEnum"
import { InstantAction, TeleportAction } from "./action/InstantAction";
import { MarbleClientInterface } from "./MarbleClientInterface";
import { AskLoanAction, AskBuildAction, AskBuyoutAction, QueryAction, TileSelectionAction } from "./action/QueryAction";
import { ServerPayloadInterface } from "./ServerPayloadInterface";
import { BUILDING } from "./tile/Tile";
import e from "cors";

class EventResult
{   
    data:any
    result:boolean
    constructor(success:boolean){
        this.result=success
    }
    setData(data:any){
        this.data=data
        return this
    }
}
const ERROR_STATE=-2
class MarbleGameLoop{
    rname:string
    isTeam:boolean
    game:MarbleGame
    gameOverCallBack:Function
    state:MarbleGameCycleState
    idleTimeout: NodeJS.Timeout
    clientInterface:MarbleClientInterface
	idleTimeoutTurn: number
    loopRunning:boolean
    gameover:boolean
    constructor(rname:string,game:MarbleGame,isTeam:boolean){
        this.rname=rname
        this.game=game
        this.isTeam=isTeam
        this.clientInterface=new MarbleClientInterface(rname)
        this.game.setTurns()
        this.loopRunning=false
        this.gameover=false
    }
    static createLoop(
		rname: string,
		isTeam: boolean,
        playerlist:ProtoPlayer[]
	): MarbleGameLoop {
		return new MarbleGameLoop(rname,new MarbleGame(playerlist,this.name,isTeam),isTeam)
	}
    setClientInterface(ci:MarbleClientInterface){
        this.clientInterface=ci
        this.game.setClientInterface(ci)
    }
    setOnGameOver(gameOverCallBack: Function) {
		this.gameOverCallBack = gameOverCallBack
		return this
	}
    startTurn(){
        this.state=new GameInitializer(this.game).getNext(null)
        this.state.onCreate()
        this.loop()
    }
    onGameOver(winner:number){
        this.gameover=true
        this.gameOverCallBack(winner)
    }
    onDestroy(){
        this.gameover=true
    }
    // /**
	//  * 
	//  * @param cycle 
	//  * @returns should pass
	//  */
	// setGameCycle(cycle: MarbleGameCycleState): boolean {
	// 	if(!this.game) return false
	// 	if (this.state != null) {
	// 		this.state.onDestroy()
	// 		if (this.state.shouldStopTimeoutOnDestroy()) this.stopTimeout()
	// 	}
	// 	this.state = cycle
	// 	if (this.state.shouldPass()) {
	// 		setTimeout(this.startNextTurn.bind(this), 1000)
	// 		return true
	// 	}
	// 	if (this.state.shouldStartTimeoutOnCreate()) {
	// 		this.idleTimeoutTurn = this.startTimeOut(this.state.getOnTimeout())
	// 	}

	// //	console.log("thisgamecycle " + this.state.id)
	// 	return false
	// }
    // async startNextTurn(isTimeout: boolean) {
	// 	if (!this.game) return
	// 	this.stopTimeout()
	// 	this.setGameCycle(this.state.getTurnTerminator())
	// 	await sleep(1000)
	// 	if(!this.game) return
	// 	this.setGameCycle(this.state.getTurnInitializer())
	// 	this.nextGameCycle()
	// }
    stopTimeout(){
        if (this.idleTimeout != null && this.state != null && this.idleTimeoutTurn === this.state.turn) {
			//this.clientInterface.stopTimeout(this.game.thisCryptTurn())
			clearTimeout(this.idleTimeout)
		//	this.idleTimeout = null
		}
    }
    startTimeOut(additional: Function): number {
		if (!this.idleTimeout) {
		//	this.clientInterface.startTimeout(this.game.thisCryptTurn(), SETTINGS.idleTimeout)

			this.idleTimeout = setTimeout(() => {
				if (!this.game) return
		//		this.clientInterface.forceNextturn(this.state.crypt_turn)
			//	this.startNextTurn(true)
				if (additional != null) additional()
			}, 10000)
		}
		return this.game.thisturn
	}

    async loop(){
        if(this.loopRunning || this.gameover) 
        {
            console.error("multiple loop instances!")
            return
        }

        this.loopRunning=true
        let repeat=true
        while(repeat){
            

            let action=this.game.nextAction()
            if(!action || this.gameover) {
                this.loopRunning=false
                break
            }
            if(action.type===ACTION_TYPE.GAMEOVER){
                this.loopRunning=false
                this.onGameOver(action.turn)
               
                break
            }
            
            if(!action.valid) {
                console.log("action ignored")
                continue
            }

            if(action instanceof InstantAction){
                this.game.executeAction(action)
                continue
            }
            
            await sleep(700)
            let nextstate=this.state.getNext(action)
            console.log('set state: '+GAME_CYCLE_NAME[nextstate.id])

            if(nextstate.id===ERROR_STATE) {
                this.loopRunning=false
                break
            }

            this.state.onDestroy()
            nextstate.onCreate()
            this.state=nextstate
            if(action instanceof DelayedAction){
                console.log("DelayedAction")
                await sleep(action.delay)
                this.state.afterDelay()
            }
            else if(action instanceof QueryAction){
                // this.startTimeOut(()=>{})
                console.log("QueryAction")
                this.loopRunning=false
                break
            }
            
        }
    }

    onClientEvent(event:string,invoker:number,...args:any[]){
        if(this.gameover) return
        let result=new EventResult(false)
        // if(invoker !== this.state.getInvoker()) return
        args=args[0]
        console.log(args)
        if(args.length===0) return

        switch(event){
            case 'press_dice':
                result=this.state.onUserPressDice(args[0],args[1])
                break
            case 'select_build':
                result=this.state.onUserSelectBuild(args[0])
                break
            case 'select_buyout':
                result=this.state.onUserBuyOut(args[0])
                break
            case 'select_loan':
                result=this.state.onUserConfirmLoan(args[0])
                break
            case 'select_tile':
                result=this.state.onUserSelectTile(args[0],args[1])
                break
        }
        console.log(result)

        if(result.result) this.loop()
        
    }
}

abstract class MarbleGameCycleState {
	readonly turn: number
	readonly crypt_turn: string
	readonly rname: string
	abstract onCreate(): void
	readonly id: number
	gameover: boolean
    game:MarbleGame
    nextAction:any
	constructor(game:MarbleGame ,turn:number,id: number) {
        this.game=game
		this.id = id
		this.gameover = false
		// this.idleTimeout = null
        this.turn=turn
		//console.log("gamecycle" + id)
	}
    init(){

    }
	onDestroy() {
		//	console.log("gamecycle ondestroy" + this.id)
	}
    afterDelay(){

    }
    getInvoker(){
        return this.turn
    }
    getNext(action:Action|null): MarbleGameCycleState {
        if(!action) return new ErrorState(this.game)
        switch(action.type){
            case ACTION_TYPE.END_TURN:
                return new TurnInitializer(this.game)
            case ACTION_TYPE.DICE_CHANCE:
                return new WaitingDice(this.game)
            case ACTION_TYPE.ROLLING_DICE:
                if(action instanceof RollDiceAction)
                    return new ThrowingDice(this.game,action)
                break
            case ACTION_TYPE.WALK_MOVE:
                if(action instanceof MoveAction)
                    return new Moving(this.game,action)
                break
            case ACTION_TYPE.CHOOSE_BUILD:
                if(action instanceof AskBuildAction)
                    return new WaitingBuild(this.game,action)
                break
            case ACTION_TYPE.ASK_BUYOUT:
                if(action instanceof AskBuyoutAction)
                    return new WaitingBuyOut(this.game,action)
                break
            case ACTION_TYPE.TELEPORT:
                if(action instanceof TeleportAction)
                    return new TeleportMoving(this.game,action.source,action.turn,action.pos)
                break
            case ACTION_TYPE.ASK_LOAN:
                if(action instanceof AskLoanAction)
                    return new WaitingLoan(this.game,action)
            case ACTION_TYPE.CHOOSE_BUILD_POSITION:
            case ACTION_TYPE.CHOOSE_MOVE_POSITION:
            case ACTION_TYPE.CHOOSE_OLYMPIC_POSITION:
                if(action instanceof TileSelectionAction)
                    return new WaitingTileSelection(this.game,action)
                            
                break
        }

        console.error("invaild action")

        return new ErrorState(this.game)
    }
	shouldStopTimeoutOnDestroy() {
		return false
	}
	shouldStartTimeoutOnCreate() {
		return false
	}
	shouldPass() {
		return false
	}
    onUserPressDice(target:number,oddeven:number):EventResult{
        return new EventResult(false)
    }
    onUserSelectBuild(builds:number[]){
        return new EventResult(false)
    }
    onUserBuyOut(result:boolean){
        return new EventResult(false)
    }
    onUserConfirmLoan(result:boolean)
    {
        return new EventResult(false)
    }
    onUserConfirmObtainCard(){

    }
    onUserConfirmUseCard()
    {

    }
    onUserSelectTile(pos:number,source:number){
        return new EventResult(false)
    }
    onUserSelectPlayer(){

    }
	
}
class ErrorState extends MarbleGameCycleState{
    static id=ERROR_STATE
    constructor(game: MarbleGame) {
		super(game,0, ErrorState.id)
        this.onCreate()
	}
    onCreate(): void {
        console.error("state error")
    }
}
class GameInitializer extends MarbleGameCycleState{
    static id=-1
    constructor(game: MarbleGame) {
		super(game,0, GameInitializer.id)
        this.onCreate()
	}
    onCreate(): void {
        
    }
    getNext(action: Action|null): MarbleGameCycleState {
        return new TurnInitializer(this.game)
    }
}
class TurnInitializer extends MarbleGameCycleState {
	static id = GAME_CYCLE.START_TURN
	constructor(game: MarbleGame) {
		super(game,game.getNextTurn(), TurnInitializer.id)
	}
	onCreate(): void {
        this.game.onTurnStart()
        this.game.clientInterface.turnStart(this.turn)
    }
}
class ArriveTile extends MarbleGameCycleState{
   
    static id = GAME_CYCLE.ARRIVE_TILE
    pos:number
    turn: number
    constructor(game:MarbleGame,pos:number,turn:number){
        super(game,turn,TurnInitializer.id)
        this.pos=pos
    }
    onCreate(): void {
        
    }
}
class ArriveBuildableTile extends ArriveTile{
    constructor(game:MarbleGame,pos:number,turn:number){
        super(game,pos,turn)
    }
}
class ArriveSpecialTile extends ArriveTile{

}
class ArriveCardTile extends ArriveTile{

}
class ArriveCornerTile extends ArriveTile{

}
class ArriveMyLand extends ArriveBuildableTile{
    constructor(game:MarbleGame,pos:number,turn:number){
        super(game,pos,turn)
    }
}
class ArriveBlackHole extends ArriveTile
{
    
}
class ArriveEnemyLand extends ArriveBuildableTile{
    constructor(game:MarbleGame,pos:number,turn:number){
        super(game,pos,turn)
        this.onCreate()
    }
    onCreate(): void {
       // this.nextAction=this.game.getNextAction(this.turn,)
    }
   
}
class WaitingDice extends MarbleGameCycleState{

    static id = GAME_CYCLE.WAITING_DICE
    dice:number[]
    constructor(game:MarbleGame){
        super(game,game.thisturn,WaitingDice.id)
    }
    onCreate(): void {
        this.game.clientInterface.showDiceBtn(this.turn,this.game.getDiceData(this.turn))
    }
    onUserPressDice(target:number,oddeven:number):EventResult{
        let data=this.game.throwDice(target,oddeven)
        this.game.clientInterface.throwDice(this.turn,data)
        this.dice=data.dice
        return new EventResult(true).setData(data)
    }
}
class ThrowingDice extends MarbleGameCycleState{

    static id = GAME_CYCLE.THROWING_DICE
    action:RollDiceAction
    is3double:boolean
    constructor(game:MarbleGame,action:RollDiceAction){
        super(game,game.thisturn,ThrowingDice.id)
        this.action=action
        this.is3double=action.is3double
    }
    onCreate(): void {
        //this.game.afterDice(this.dice[0]+this.dice[1])
    }
    afterDelay(): void {
        if(this.is3double){
            this.game.onTripleDouble()
        }
        else{
            this.game.requestWalkMove(this.action.pos,this.action.dice,this.turn,this.action.source)
        }
    }
}
class Moving extends MarbleGameCycleState{

    static id = GAME_CYCLE.PLAYER_WALKING
    movetype:ActionSource
    distance:number
    from:number
    constructor(game:MarbleGame,sourceAction:MoveAction){
        super(game,sourceAction.turn,Moving.id)
        this.movetype=sourceAction.source
        this.distance=sourceAction.distance
        this.from=sourceAction.from
    }
    onCreate(): void {
        this.game.clientInterface.walkMovePlayer(this.turn,this.from,this.distance)
        this.game.movePlayer(this.turn,this.distance,this.movetype)
    }
}
class TeleportMoving extends MarbleGameCycleState{
    movetype:ActionSource
    pos:number
    static id = GAME_CYCLE.PLAYER_TELEPORTING
    constructor(game:MarbleGame,movetype:ActionSource,turn:number,pos:number){
        super(game,turn,TeleportMoving.id)
        this.movetype=movetype
        this.pos=pos
    }
    onCreate(): void {
        this.game.clientInterface.teleportPlayer(this.turn,this.pos)
        this.game.teleportPlayer(this.turn,this.pos,this.movetype)
    }
    
}
class WaitingBuild extends MarbleGameCycleState{

    static id = GAME_CYCLE.WAITING_BUILD
    builds:ServerPayloadInterface.buildAvaliability[]
    pos:number
    discount:number
    availableMoney:number
    buildsHave:BUILDING[]
    constructor(game:MarbleGame,sourceAction:AskBuildAction){
        super(game,sourceAction.turn,WaitingBuild.id)
        this.builds=sourceAction.builds
        this.pos=sourceAction.pos
        this.discount=sourceAction.discount
        this.availableMoney=sourceAction.availableMoney
        this.buildsHave=sourceAction.buildsHave
    }
    onCreate(): void {
        this.game.clientInterface.chooseBuild(this.turn,this.pos,this.builds,this.buildsHave,this.discount,this.availableMoney)
    }
    onUserSelectBuild(builds: BUILDING[]): EventResult {
        this.game.directBuild(this.turn,builds,this.pos,this.discount)
        return new EventResult(true).setData(builds)
    }
}
class WaitingLoan extends MarbleGameCycleState{

    static id = GAME_CYCLE.WAITING_LOAN
    amount:number
    receiver:number
    constructor(game:MarbleGame,action:AskLoanAction){
        super(game,action.turn,WaitingLoan.id)
        this.amount=action.amount
        this.receiver=action.receiver
    }
    onCreate(): void {
        this.game.clientInterface.askLoan(this.turn,this.amount)
    }
    onUserConfirmLoan(result: boolean): EventResult {
        this.game.onConfirmLoan(this.turn,this.receiver,this.amount,result)
        return new EventResult(true).setData(result)
    }
}
class WaitingBuyOut extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_BUYOUT
    pos:number
    price:number
    originalPrice:number
    constructor(game:MarbleGame,sourceAction:AskBuyoutAction){
        super(game,sourceAction.turn,WaitingBuyOut.id)
        this.pos=sourceAction.pos
        this.price=sourceAction.price
        this.originalPrice=sourceAction.originalPrice
    }
    getInvoker(): number {
        return this.turn
    }
    onCreate(): void {
        this.game.clientInterface.askBuyout(this.turn,this.pos,this.price,this.originalPrice)
    }
    onUserBuyOut(result:boolean): EventResult {
        if(result)
            this.game.attemptDirectBuyout(this.turn,this.pos,this.price)
        return new EventResult(result)
    }
}
class WaitingTileSelection extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_TILE_SELECTION
    tiles:number[]
    type:ACTION_TYPE
    source:ActionSource

    constructor(game:MarbleGame,sourceAction:TileSelectionAction){
        super(game,sourceAction.turn,WaitingTileSelection.id)
        this.tiles=sourceAction.tiles
        this.type=sourceAction.type
        this.source=sourceAction.source
    }
    onCreate(): void {
        this.game.clientInterface.askTileSelection(this.turn,this.tiles,this.source.eventType)
    }
    onUserSelectTile(pos: number,source:number): EventResult {
        if(source !== this.source.eventType) return new EventResult(false)

        if(this.type === ACTION_TYPE.CHOOSE_BUILD_POSITION){
            this.game.onSelectBuildPosition(this.turn,pos,this.source)
        }
        else if(this.type===ACTION_TYPE.CHOOSE_MOVE_POSITION){
            this.game.onSelectMovePosition(this.turn,pos,this.source)
        }
        else if(this.type===ACTION_TYPE.CHOOSE_OLYMPIC_POSITION){
            this.game.onSelectOlympicPosition(this.turn,pos,this.source)
        }
        return new EventResult(true).setData(pos)
    }
}
class WaitingCardUse extends MarbleGameCycleState{
    onCreate(): void {
        throw new Error("Method not implemented.")
    }

}
class PayingToll extends MarbleGameCycleState{
    onCreate(): void {
        throw new Error("Method not implemented.")
    }

}



export {MarbleGameLoop}