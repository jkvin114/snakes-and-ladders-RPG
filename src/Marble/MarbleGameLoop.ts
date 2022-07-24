import { sleep,ProtoPlayer,PlayerType } from "../core/Util";
import { Action,ACTION_TYPE } from "./action/Action";
import { ActionSource, ACTION_SOURCE_TYPE } from "./action/ActionSource";
import { DelayedAction, MoveAction, RollDiceAction } from "./action/DelayedAction";
import {MarbleGame } from "./Game"
import { GAME_CYCLE, GAME_CYCLE_NAME } from "./gamecycleEnum"
import { InstantAction, TeleportAction } from "./action/InstantAction";
import { MarbleClientInterface } from "./MarbleClientInterface";
import { AskLoanAction, AskBuildAction, AskBuyoutAction, QueryAction, TileSelectionAction, ObtainCardAction,  LandChangeAction,AskDefenceCardAction, AskAttackDefenceCardAction, AskTollDefenceCardAction } from "./action/QueryAction";
import { ServerPayloadInterface } from "./ServerPayloadInterface";
import { BUILDING } from "./tile/Tile";
import { AttackCard, CARD_NAME, CARD_TYPE, CommandCard, DefenceCard, FortuneCard } from "./FortuneCard";

class EventResult
{   
    data:any
    result:boolean
    constructor(goNextState:boolean){
        this.result=goNextState
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
        map:number,
        playerlist:ProtoPlayer[]
	): MarbleGameLoop {
		return new MarbleGameLoop(rname,new MarbleGame(playerlist,this.name,isTeam,map),isTeam)
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
            
            if(!action.valid || action.type===ACTION_TYPE.EMPTY) {
                console.log("action ignored")
                continue
            }

            if(action instanceof InstantAction){
                this.game.executeAction(action)
                continue
            }
            
            await sleep(500)
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
                await sleep(action.delay)
                this.state.afterDelay()
            }
            else if(action instanceof QueryAction){
                // this.startTimeOut(()=>{})
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
                result=this.state.onUserSelectTile(args[0],args[1],args[2])
                break
            case 'obtain_card':
                result=this.state.onUserConfirmObtainCard(args[0])
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
            case ACTION_TYPE.CHOOSE_ATTACK_POSITION:
            case ACTION_TYPE.CHOOSE_DONATE_POSITION:
                if(action instanceof TileSelectionAction)
                    return new WaitingTileSelection(this.game,action)
                break
            case ACTION_TYPE.OBTAIN_CARD:
                if(action instanceof ObtainCardAction)
                    return new WaitingCardObtain(this.game,action.turn,action.card)
                break
            case ACTION_TYPE.CHOOSE_LAND_CHANGE:
                if(action instanceof LandChangeAction)
                    return new WaitingLandChange(this.game,action.turn,action)
                break
            case ACTION_TYPE.CHOOSE_ATTACK_DEFENCE_CARD_USE:
            case ACTION_TYPE.CHOOSE_TOLL_DEFENCE_CARD_USE:
                if(action instanceof AskDefenceCardAction)
                    return new WaitingDefenceCardUse(this.game,action.turn,action)
                break
        }

        console.error("no next action registered")

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
    onUserConfirmObtainCard(result:boolean){
        return new EventResult(false)
    }
    onUserConfirmUseCard(result:boolean,cardname:string)
    {
        return new EventResult(false)
    }
    onUserSelectTile(pos:number,name:string,result:boolean){
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
        return new EventResult(true)
    }
}
class WaitingTileSelection extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_TILE_SELECTION
    tiles:number[]
    type:ACTION_TYPE
    name:string
    source:ActionSource
    constructor(game:MarbleGame,sourceAction:TileSelectionAction){
        super(game,sourceAction.turn,WaitingTileSelection.id)
        this.tiles=sourceAction.tiles
        this.type=sourceAction.type
        this.name=sourceAction.name
        this.source=sourceAction.source
    }
    onCreate(): void {
        this.game.clientInterface.askTileSelection(this.turn,this.tiles,this.name)
    }
    onUserSelectTile(pos: number,name:string,result:boolean): EventResult {
        if(name !== this.name) return new EventResult(false)
        if(!result) return new EventResult(true)

        if(this.type === ACTION_TYPE.CHOOSE_BUILD_POSITION){
            this.game.onSelectBuildPosition(this.turn,pos,this.source)
        }
        else if(this.type===ACTION_TYPE.CHOOSE_MOVE_POSITION){
            this.game.onSelectMovePosition(this.turn,pos,this.source)
        }
        else if(this.type===ACTION_TYPE.CHOOSE_OLYMPIC_POSITION){
            this.game.onSelectOlympicPosition(this.turn,pos,this.source)
        }
        else if(this.type===ACTION_TYPE.CHOOSE_ATTACK_POSITION){
            this.game.onSelectAttackPosition(this.turn,pos,this.source,name)
        }
        else if(this.type===ACTION_TYPE.CHOOSE_DONATE_POSITION){
            this.game.onSelectDonatePosition(this.turn,pos,this.source)
        }
        return new EventResult(true).setData(pos)
    }
}
class WaitingCardObtain extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_CARD_OBTAIN
    card:FortuneCard
    constructor(game:MarbleGame,turn:number,card:FortuneCard){
        super(game,turn,WaitingCardObtain.id)
        this.card=card
    }
    onCreate(): void {
        this.game.clientInterface.obtainCard(this.turn,this.card.name,this.card.level,this.card.type)
    }
    onUserConfirmObtainCard(result:boolean): EventResult {
        if(this.card instanceof AttackCard){
                this.game.useAttackCard(this.turn,this.card)
        }
        else if(this.card instanceof DefenceCard){
             if(result) this.game.saveCard(this.turn,this.card)
        }
        else if(this.card instanceof CommandCard){
            this.game.executeCardCommand(this.turn,this.card)
        }
        return new EventResult(true).setData(result)
    }

}
class WaitingLandChange extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_LAND_CHANGE
    action:LandChangeAction
    myland:number
    constructor(game:MarbleGame,turn:number,action:LandChangeAction){
        super(game,turn,WaitingLandChange.id)
        this.action=action
        this.myland=-1
    }
    onCreate(): void {
        this.game.clientInterface.askTileSelection(this.turn,this.action.getTargetTiles(),"land_change_1")
    }
    onUserSelectTile(pos: number,name:string,result:boolean){
        if(name !== "land_change_1" && name!=="land_change_2") return new EventResult(false)
        if(!result) return new EventResult(true)

        //첫번째 도시 선택(상대에게 줄 땅)
        if(name==="land_change_1"){
            this.myland=pos
            setTimeout(()=>{
                this.game.clientInterface.askTileSelection(this.turn,this.action.getTargetTiles(),"land_change_2")
            },500)
            
            return new EventResult(false)
        }//두번째 도시 선택
        else{
            this.game.onSelectAttackPosition(this.turn,pos,this.action.source,CARD_NAME.LAND_CHANGE,this.myland)
            return new EventResult(true).setData([this.myland,pos])
        }
    }
}
class WaitingDefenceCardUse extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_DEFENCE_CARD_USE
    action:AskDefenceCardAction
    constructor(game:MarbleGame,turn:number,action:AskDefenceCardAction){
        super(game,turn,WaitingDefenceCardUse.id)
        this.action=action
    }
    onCreate(): void {
        if(this.action instanceof AskAttackDefenceCardAction){
            this.game.clientInterface.askAttackDefenceCard(this.turn,this.action.cardname,this.action.attackName)
        }
        else if(this.action instanceof AskTollDefenceCardAction){
            this.game.clientInterface.askTollDefenceCard(this.turn,this.action.cardname,this.action.before,this.action.after)
        }
    }
    onUserConfirmUseCard(result:boolean,cardname:string): EventResult {
        if(this.action.cardname!==cardname) return new EventResult(false)
        if(result && this.action.modifiesAction()){
            this.game.useCard(this.turn,cardname)
            this.game.modifyAction(this.action.modyfingActionId,this.action.onComplete)
        }
            

        return new EventResult(true)
    }
}



export {MarbleGameLoop}