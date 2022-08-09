import { sleep,ProtoPlayer,PlayerType } from "../core/Util";
import { Action,ACTION_TYPE, EmptyAction } from "./action/Action";
import { ActionTrace, ACTION_SOURCE_TYPE } from "./action/ActionTrace";
import { DelayedAction, MoveAction, PullAction, RollDiceAction, TeleportAction } from "./action/DelayedAction";
import {MarbleGame } from "./Game"
import { GAME_CYCLE, GAME_CYCLE_NAME } from "./gamecycleEnum"
import { InstantAction } from "./action/InstantAction";
import { MarbleClientInterface } from "./MarbleClientInterface";
import { AskLoanAction, AskBuildAction, AskBuyoutAction, QueryAction, TileSelectionAction, ObtainCardAction,  LandSwapAction,AskDefenceCardAction, AskAttackDefenceCardAction, AskTollDefenceCardAction, AskGodHandSpecialAction, MoveTileSelectionAction, BlackholeTileSelectionAction } from "./action/QueryAction";
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
    constructor(rname:string,game:MarbleGame,isTeam:boolean,itemSetting:ServerPayloadInterface.ItemSetting){
        this.rname=rname
        this.game=game
        this.isTeam=isTeam
        this.clientInterface=new MarbleClientInterface(rname)
        this.game.setTurns()
        this.game.setItems(itemSetting)
        this.loopRunning=false
        this.gameover=false
    }
    static createLoop(
		rname: string,
		isTeam: boolean,
        map:number,
        playerlist:ProtoPlayer[],
        itemSetting:ServerPayloadInterface.ItemSetting
	): MarbleGameLoop {
		return new MarbleGameLoop(rname,new MarbleGame(playerlist,this.name,isTeam,map),isTeam,itemSetting)
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

    clearPriorityActions(){
        for(const action of this.game.getPriorityActions())
        {
            // let action=this.game.nextAction()
            if(!action) break

            if(action.type===ACTION_TYPE.GAMEOVER){
                this.loopRunning=false
                this.onGameOver(action.turn)
                return
            }

            // 액션 무시
            if(!action.valid || action.type===ACTION_TYPE.EMPTY) {
                console.log("action ignored")
                continue
            }

            //방어된 액션 처리
            if(action.blocked){
                this.game.handleBlockedAction(action)
                continue
            }

            this.game.executeAction(action)
            

        }
    }
    async loop(){
        if(this.loopRunning || this.gameover) 
        {
            console.error("multiple loop instances!")
            return
        }

        this.loopRunning=true
        while(!this.gameover){
            this.clearPriorityActions()
            
            let action=this.game.nextAction()
            if(!action || this.gameover) {
                this.loopRunning=false
                break
            }

            
            
            // 액션 무시
            if(!action.valid || action.type===ACTION_TYPE.EMPTY) {
                console.log("action ignored")
                continue
            }

            //방어된 액션 처리
            if(action.blocked){
                this.game.handleBlockedAction(action)
                continue
            }

            //상태 변화 없이 즉시 실행되는 액션
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
                this.clearPriorityActions()
                await sleep(action.delay)
                this.state.afterDelay()
            }
            else if(action instanceof QueryAction){
                // this.startTimeOut(()=>{})
                this.clearPriorityActions()
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
            case 'confirm_card_use':
                result=this.state.onUserConfirmUseCard(args[0],args[1])
                break
            case 'select_godhand_special':
                result=this.state.onUserSelectGodHandSpecial(args[0])
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
    sourceAction:Action
	constructor(game:MarbleGame ,turn:number,id: number,sourceAction:Action) {
        this.game=game
		this.id = id
        this.sourceAction=sourceAction
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
    getNext(action:Action|null): MarbleGameCycleState {
        if(!action) return new ErrorState(this.game)
        switch(action.type){
            case ACTION_TYPE.END_TURN:
                return new TurnInitializer(this.game,action)
            case ACTION_TYPE.DICE_CHANCE:
            case ACTION_TYPE.DICE_CHANCE_NO_DOUBLE:
                return new WaitingDice(this.game,action)
            case ACTION_TYPE.ROLLING_DICE:
                if(action instanceof RollDiceAction)
                    return new ThrowingDice(this.game,action)
                break
            case ACTION_TYPE.TELEPORT:
                if(action instanceof TeleportAction)
                    return new Teleporting(this.game,action)
                break
            case ACTION_TYPE.WALK_MOVE:
            case ACTION_TYPE.FORCE_WALK_MOVE:
                if(action instanceof MoveAction)
                    return new Moving(this.game,action)
                break
            case ACTION_TYPE.CHOOSE_BUILD:
                if(action instanceof AskBuildAction)
                    return new WaitingBuild(this.game,action)
                break
            case ACTION_TYPE.CHOOSE_GODHAND_SPECIAL:
                if(action instanceof AskGodHandSpecialAction)
                    return new WaitingGodHandSpecial(this.game,action)
                break
            case ACTION_TYPE.ASK_BUYOUT:
                if(action instanceof AskBuyoutAction)
                    return new WaitingBuyOut(this.game,action)
                break
            case ACTION_TYPE.ASK_LOAN:
                if(action instanceof AskLoanAction)
                    return new WaitingLoan(this.game,action)
            case ACTION_TYPE.CHOOSE_MOVE_POSITION:
                if(action instanceof MoveTileSelectionAction)
                    return new WaitingMoveTileSelection(this.game,action)
                 break
            case ACTION_TYPE.CHOOSE_BUILD_POSITION:
            case ACTION_TYPE.CHOOSE_OLYMPIC_POSITION:
            case ACTION_TYPE.CHOOSE_ATTACK_POSITION:
            case ACTION_TYPE.CHOOSE_DONATE_POSITION:
            case ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT:
            case ACTION_TYPE.CHOOSE_BLACKHOLE:
                if(action instanceof TileSelectionAction)
                    return new WaitingTileSelection(this.game,action)
                break
            case ACTION_TYPE.OBTAIN_CARD:
                if(action instanceof ObtainCardAction)
                    return new WaitingCardObtain(this.game,action)
                break
            case ACTION_TYPE.CHOOSE_LAND_CHANGE:
                if(action instanceof LandSwapAction)
                    return new WaitingLandSwap(this.game,action)
                break
            case ACTION_TYPE.CHOOSE_ATTACK_DEFENCE_CARD_USE:
            case ACTION_TYPE.CHOOSE_TOLL_DEFENCE_CARD_USE:
                if(action instanceof AskDefenceCardAction)
                    return new WaitingDefenceCardUse(this.game,action)
                break
            case ACTION_TYPE.PULL:
                if(action instanceof PullAction)
                    return new Pulling(this.game,action)
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
    onUserSelectGodHandSpecial(isBuild:boolean){
        return new EventResult(false)
    }
	
}
class ErrorState extends MarbleGameCycleState{
    static id=ERROR_STATE
    constructor(game: MarbleGame) {
		super(game,0, ErrorState.id,new EmptyAction())
        this.onCreate()
	}
    onCreate(): void {
        console.error("state error")
    }
}
class GameInitializer extends MarbleGameCycleState{
    static id=-1
    constructor(game: MarbleGame) {
		super(game,0, GameInitializer.id,new EmptyAction())
        this.onCreate()
	}
    onCreate(): void {
        this.game.onGameStart()
    }
    getNext(action: Action|null): MarbleGameCycleState {
        return new TurnInitializer(this.game,new EmptyAction())
    }
}
class TurnInitializer extends MarbleGameCycleState {
	static id = GAME_CYCLE.START_TURN
	constructor(game: MarbleGame,sourceAction:Action) {
		super(game,game.getNextTurn(), TurnInitializer.id,sourceAction)
	}
	onCreate(): void {
        this.game.onTurnStart()
        this.game.clientInterface.turnStart(this.turn)
    }
}
class WaitingDice extends MarbleGameCycleState{

    static id = GAME_CYCLE.WAITING_DICE
 //   dice:number[]
    hasDoubleEffect:boolean
    constructor(game:MarbleGame,sourceAction:Action){
        super(game,game.thisturn,WaitingDice.id,sourceAction)
        this.hasDoubleEffect=true
    }
    onCreate(): void {
        this.game.clientInterface.showDiceBtn(this.turn,this.game.getDiceData(this.turn))
    }
    onUserPressDice(target:number,oddeven:number):EventResult{
        let data=this.game.throwDice(target,oddeven,this.sourceAction.source)
        this.game.clientInterface.throwDice(this.turn,data)
  //      this.dice=data.dice
        return new EventResult(true).setData(data)
    }
}
class ThrowingDice extends MarbleGameCycleState{

    static id = GAME_CYCLE.THROWING_DICE
    action:RollDiceAction
    is3double:boolean
    constructor(game:MarbleGame,action:RollDiceAction){
        super(game,game.thisturn,ThrowingDice.id,action)
        this.action=action
        this.is3double=action.is3double
    }
    onCreate(): void {
        //this.game.afterDice(this.dice[0]+this.dice[1])
    }
    afterDelay(): void {
    //     if(this.is3double){
    //        // this.game.onTripleDouble()
    //     }
    //     else{
    //    //     this.game.requestWalkMove(this.action.pos,this.action.dice,this.turn,this.action.source)
    //     }
    // }
    }
}
class Teleporting extends MarbleGameCycleState{
   
    
    sourceAction:TeleportAction
    constructor(game:MarbleGame,sourceAction:TeleportAction){
        super(game,sourceAction.turn,GAME_CYCLE.PLAYER_TELEPORTING,sourceAction)
    }
    onCreate(): void {
        this.game.teleportPlayer(this.turn,this.sourceAction.pos,this.sourceAction.source,this.sourceAction.movetype)
    }
}
class Moving extends MarbleGameCycleState{

    static id = GAME_CYCLE.PLAYER_WALKING
    movetype:ActionTrace
    distance:number
    from:number
    isForceMove:boolean
    sourceAction:MoveAction
    constructor(game:MarbleGame,sourceAction:MoveAction){
        super(game,sourceAction.turn,Moving.id,sourceAction)
        this.movetype=sourceAction.source
        this.distance=sourceAction.distance
        this.from=sourceAction.from
    }
    onCreate(): void {
        this.distance=this.game.walkMovePlayer(this.turn,this.from,this.distance,this.sourceAction.source,this.sourceAction.moveType)
        this.sourceAction.setDistanceDelay(this.distance)
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
        super(game,sourceAction.turn,WaitingBuild.id,sourceAction)
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
        this.game.directBuild(this.turn,builds,this.pos,this.discount,this.sourceAction.source)
        return new EventResult(true).setData(builds)
    }
}
class WaitingLoan extends MarbleGameCycleState{

    static id = GAME_CYCLE.WAITING_LOAN
    amount:number
    receiver:number
    constructor(game:MarbleGame,action:AskLoanAction){
        super(game,action.turn,WaitingLoan.id,action)
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
    sourceAction:AskBuyoutAction
    constructor(game:MarbleGame,sourceAction:AskBuyoutAction){
        super(game,sourceAction.turn,WaitingBuyOut.id,sourceAction)
    }
    
    onCreate(): void {
        this.game.clientInterface.askBuyout(this.turn,this.sourceAction.pos,this.sourceAction.price,this.sourceAction.originalPrice)
    }
    onUserBuyOut(result:boolean): EventResult {
        if(result)
            this.game.attemptDirectBuyout(this.turn,this.sourceAction.pos,this.sourceAction.price,this.sourceAction.source)
        return new EventResult(true)
    }
}
class WaitingTileSelection extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_TILE_SELECTION
    // tiles:number[]
    // type:ACTION_TYPE
    // name:string
    // source:ActionTrace
    sourceAction:TileSelectionAction
    constructor(game:MarbleGame,sourceAction:TileSelectionAction){
        super(game,sourceAction.turn,WaitingTileSelection.id,sourceAction)
        // this.tiles=sourceAction.tiles
        // this.type=sourceAction.type
        // this.name=sourceAction.name
        // this.source=sourceAction.source
    }
    onCreate(): void {
        this.game.clientInterface.askTileSelection(this.turn,this.sourceAction.tiles,this.sourceAction.name)
    }
    onUserSelectTile(pos: number,name:string,result:boolean): EventResult {
        if(name !== this.sourceAction.name) return new EventResult(false)
        if(!result) return new EventResult(true)

        if(this.sourceAction.type === ACTION_TYPE.CHOOSE_BUILD_POSITION){
            this.game.onSelectBuildPosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_OLYMPIC_POSITION){
            this.game.onSelectOlympicPosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_ATTACK_POSITION){
            this.game.onSelectAttackPosition(this.turn,pos,this.sourceAction.source,name)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_DONATE_POSITION){
            this.game.onSelectDonatePosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT){
            this.game.onSelectTileLiftPosition(this.turn,pos,this.sourceAction.source)
        }
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_BLACKHOLE){
            this.game.onSelectBlackholePosition(this.turn,pos,this.sourceAction)
        }
        return new EventResult(true).setData(pos)
    }
}
class WaitingMoveTileSelection extends WaitingTileSelection{
    movetype:number
    constructor(game:MarbleGame,sourceAction:MoveTileSelectionAction){
        super(game,sourceAction)
        this.movetype=sourceAction.moveType
    }
    onUserSelectTile(pos: number,name:string,result:boolean): EventResult {
        if(name !== this.sourceAction.name) return new EventResult(false)
        if(!result) return new EventResult(true)
        this.game.onSelectMovePosition(this.turn,pos,this.movetype,this.sourceAction.source)
        return new EventResult(true).setData(pos)
    }
}
class WaitingCardObtain extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_CARD_OBTAIN
    card:FortuneCard
    constructor(game:MarbleGame,action:ObtainCardAction){
        super(game,action.turn,WaitingCardObtain.id,action)
        this.card=action.card
    }
    onCreate(): void {
        this.game.clientInterface.obtainCard(this.turn,this.card.name,this.card.level,this.card.type)
    }
    onUserConfirmObtainCard(result:boolean): EventResult {
        if(this.card instanceof AttackCard){
            this.game.useAttackCard(this.turn,this.card,this.sourceAction.source)
        }
        else if(this.card instanceof DefenceCard){
             if(result) this.game.saveCard(this.turn,this.card)
        }
        else if(this.card instanceof CommandCard){
            this.game.executeCardCommand(this.turn,this.card,this.sourceAction.source)
        }
        return new EventResult(true).setData(result)
    }

}
class WaitingLandSwap extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_LAND_SWAP
    sourceAction: LandSwapAction
    private myland:number
    constructor(game:MarbleGame,action:LandSwapAction){
        super(game,action.turn,WaitingLandSwap.id,action)
        // this.action=action
        this.myland=-1
    }
    onCreate(): void {
        this.game.clientInterface.askTileSelection(this.turn,this.sourceAction.getTargetTiles(),"land_change_1")
    }
    onUserSelectTile(pos: number,name:string,result:boolean){
        if(name !== "land_change_1" && name!=="land_change_2") return new EventResult(false)
        if(!result) return new EventResult(true)

        //첫번째 도시 선택(상대에게 줄 땅)
        if(name==="land_change_1"){
            this.myland=pos
            setTimeout(()=>{
                this.game.clientInterface.askTileSelection(this.turn,this.sourceAction.getTargetTiles(),"land_change_2")
            },500)
            
            return new EventResult(false)
        }//두번째 도시 선택
        else{
            this.game.onSelectAttackPosition(this.turn,pos,this.sourceAction.source,CARD_NAME.LAND_CHANGE,this.myland)
            return new EventResult(true).setData([this.myland,pos])
        }
    }
}
class WaitingDefenceCardUse extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_DEFENCE_CARD_USE
    sourceAction:AskDefenceCardAction
    constructor(game:MarbleGame,action:AskDefenceCardAction){
        super(game,action.turn,WaitingDefenceCardUse.id,action)
        // this.action=action
    }
    onCreate(): void {
        if(this.sourceAction instanceof AskAttackDefenceCardAction){
            this.game.clientInterface.askAttackDefenceCard(this.turn,this.sourceAction.cardname,this.sourceAction.attackName)
        }
        else if(this.sourceAction instanceof AskTollDefenceCardAction){
            this.game.clientInterface.askTollDefenceCard(this.turn,this.sourceAction.cardname,this.sourceAction.before,this.sourceAction.after)
        }
    }
    onUserConfirmUseCard(result:boolean,cardname:string): EventResult {
        if(this.sourceAction.cardname!==cardname) return new EventResult(false)
        if(result){
            this.game.useDefenceCard(this.turn,this.sourceAction)
        }
        return new EventResult(true)
    }
}

class WaitingGodHandSpecial extends MarbleGameCycleState{
    
    static id = GAME_CYCLE.WAITING_GODHAND_SPECIAL
    sourceAction:AskGodHandSpecialAction
    constructor(game:MarbleGame,action:AskGodHandSpecialAction){
        super(game,action.turn,WaitingGodHandSpecial.id,action)
        // this.action=action
    }
    onCreate(): void {
        this.game.clientInterface.askGodHandSpecial(this.turn,this.sourceAction.canLiftTile)
    }
    onUserSelectGodHandSpecial(isBuild:boolean){
        if(isBuild)
            this.game.chooseGodHandSpecialBuild(this.turn,this.sourceAction.source)
        else
            this.game.chooseGodHandSpecialLiftTile(this.turn,this.sourceAction.source)
        return new EventResult(true)
    }
}
class Pulling extends MarbleGameCycleState{
    
    static id = GAME_CYCLE.PULLING
    sourceAction:PullAction
    constructor(game:MarbleGame,action:PullAction){
        super(game,action.turn,Pulling.id,action)
    }
    onCreate(): void {
        this.game.clientInterface.indicatePull(this.sourceAction.targetTiles)
        this.game.pullPlayers(this.turn,this.sourceAction)
    }
}

export {MarbleGameLoop}