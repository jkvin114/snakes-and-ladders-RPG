import { Action, ACTION_TYPE, EmptyAction } from "./action/Action"
import type { ActionTrace } from "./action/ActionTrace"
import { RollDiceAction, TeleportAction, MoveAction, PullAction } from "./action/DelayedAction"
import { AskBuildAction, AskGodHandSpecialAction, AskBuyoutAction, AskLoanAction, MoveTileSelectionAction, TileSelectionAction, ObtainCardAction, LandSwapAction, AskDefenceCardAction, AskIslandAction, AskAttackDefenceCardAction, AskTollDefenceCardAction } from "./action/QueryAction"
import { FortuneCard, AttackCard, DefenceCard, CommandCard, CARD_NAME } from "./FortuneCard"
import type { MarbleGame } from "./Game"
import { GAME_CYCLE } from "./gamecycleEnum"
import { EventResult } from "./MarbleGameLoop"
import type{ ServerPayloadInterface } from "./ServerPayloadInterface"
import type{ BUILDING } from "./tile/Tile"

export abstract class MarbleGameCycleState {
    static readonly ERROR_STATE=-2
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
            case ACTION_TYPE.CHOOSE_BUYOUT_POSITION:
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
            case ACTION_TYPE.CHOOSE_ISLAND:
                if(action instanceof AskIslandAction)
                    return new WaitingIsland(this.game,action)
                break
            case ACTION_TYPE.PULL:
                if(action instanceof PullAction)
                    return new Pulling(this.game,action)
                break
        }

        console.error("no next action registered")

        return new ErrorState(this.game)
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
    onUserSelectIsland(escape:boolean){
        return new EventResult(false)
    }
    onUserSelectGodHandSpecial(isBuild:boolean){
        return new EventResult(false)
    }
	
}
class ErrorState extends MarbleGameCycleState{
    constructor(game: MarbleGame) {
		super(game,0, MarbleGameCycleState.ERROR_STATE,new EmptyAction())
        this.onCreate()
	}
    onCreate(): void {
        console.error("state error")
    }
}
export class GameInitializer extends MarbleGameCycleState{
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
        this.game.eventEmitter.turnStart(this.turn)
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
        this.game.eventEmitter.showDiceBtn(this.turn,this.game.getDiceData(this.turn))
    }
    onUserPressDice(target:number,oddeven:number):EventResult{
        let data=this.game.throwDice(target,oddeven,this.sourceAction)
        this.game.eventEmitter.throwDice(this.turn,data)
  //      this.dice=data.dice
        return new EventResult(true).setData(data)
    }
}
class ThrowingDice extends MarbleGameCycleState{

    static id = GAME_CYCLE.THROWING_DICE
    sourceAction:RollDiceAction
    constructor(game:MarbleGame,action:RollDiceAction){
        super(game,game.thisturn,ThrowingDice.id,action)
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
        this.game.eventEmitter.chooseBuild(this.turn,this.pos,this.builds,this.buildsHave,this.discount,this.availableMoney)
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
        this.game.eventEmitter.askLoan(this.turn,this.amount)
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
        this.game.eventEmitter.askBuyout(this.turn,this.sourceAction.pos,this.sourceAction.price,this.sourceAction.originalPrice)
    }
    onUserBuyOut(result:boolean): EventResult {
        if(result)
            this.game.attemptDirectBuyout(this.turn,this.sourceAction.pos,this.sourceAction.price,this.sourceAction.source)
        return new EventResult(true)
    }
}
class WaitingTileSelection extends MarbleGameCycleState{
    static id = GAME_CYCLE.WAITING_TILE_SELECTION
    sourceAction:TileSelectionAction
    constructor(game:MarbleGame,sourceAction:TileSelectionAction){
        super(game,sourceAction.turn,WaitingTileSelection.id,sourceAction)
    }
    onCreate(): void {
        this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.tiles,this.sourceAction.name)
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
        else if(this.sourceAction.type===ACTION_TYPE.CHOOSE_BUYOUT_POSITION){
            this.game.onSelectBuyoutPosition(this.turn,pos,this.sourceAction)
        }
        return new EventResult(true).setData(pos)
    }
}
class WaitingMoveTileSelection extends WaitingTileSelection{
    movetype:string
    sourceAction:MoveTileSelectionAction
    constructor(game:MarbleGame,sourceAction:MoveTileSelectionAction){
        super(game,sourceAction)
        this.movetype=sourceAction.moveType
    }
    onCreate(): void {
        this.game.setMovableTiles(this.sourceAction)
        super.onCreate()
    }
    onUserSelectTile(pos: number,name:string,result:boolean): EventResult {
        if(name !== this.sourceAction.name) return new EventResult(false)
        if(!result) return new EventResult(true)
        this.game.onSelectMovePosition(this.turn,pos,this.sourceAction)
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
        this.game.eventEmitter.obtainCard(this.turn,this.card.name,this.card.level,this.card.type)
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
        this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.getTargetTiles(),"land_change_1")
    }
    onUserSelectTile(pos: number,name:string,result:boolean){
        if(name !== "land_change_1" && name!=="land_change_2") return new EventResult(false)
        if(!result) return new EventResult(true)

        //첫번째 도시 선택(상대에게 줄 땅)
        if(name==="land_change_1"){
            this.myland=pos
            setTimeout(()=>{
                this.game.eventEmitter.askTileSelection(this.turn,this.sourceAction.getTargetTiles(),"land_change_2")
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
            this.game.eventEmitter.askAttackDefenceCard(this.turn,this.sourceAction.cardname,this.sourceAction.attackName)
        }
        else if(this.sourceAction instanceof AskTollDefenceCardAction){
            this.game.eventEmitter.askTollDefenceCard(this.turn,this.sourceAction.cardname,this.sourceAction.before,this.sourceAction.after)
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
        this.game.eventEmitter.askGodHandSpecial(this.turn,this.sourceAction.canLiftTile)
    }
    onUserSelectGodHandSpecial(isBuild:boolean){
        if(isBuild)
            this.game.chooseGodHandSpecialBuild(this.turn,this.sourceAction.source)
        else
            this.game.chooseGodHandSpecialLiftTile(this.turn,this.sourceAction.source)
        return new EventResult(true)
    }
}
class WaitingIsland extends MarbleGameCycleState{
    
    static id = GAME_CYCLE.WAITING_ISLAND
    sourceAction: AskIslandAction;
    constructor(game:MarbleGame,action:AskIslandAction){
        super(game,action.turn,WaitingIsland.id,action)
    }
    onCreate(): void {
        this.game.eventEmitter.askIsland(this.turn,this.sourceAction.canEscape,this.sourceAction.escapePrice)
    }
    onUserSelectIsland(paid:boolean){
        this.game.attemptIslandEscape(paid,this.turn,this.sourceAction.source,this.sourceAction.escapePrice)
        // if(isEscape)
        //     // this.game.chooseGodHandSpecialBuild(this.turn,this.sourceAction.source)
        // else
            // this.game.chooseGodHandSpecialLiftTile(this.turn,this.sourceAction.source)
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
        this.game.eventEmitter.indicatePull(this.sourceAction.targetTiles)
        this.game.pullPlayers(this.turn,this.sourceAction)
    }
}