import { RoomClientInterface } from "../app"

import { Game } from "../Game"
import { ClientPayloadInterface, ServerPayloadInterface } from "../PayloadInterface"
import * as GAME_CYCLE from "./StateEnum"
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
	constructor(game: Game,id:number) {
        this.id=id
		this.game = game
		this.turn = this.game.thisturn
		this.crypt_turn = this.game.thisCryptTurn()
		this.rname = this.game.rname
		this.onCreate()
	}

	onUserPressDice(dicenum: number,crypt_turn:string): GameCycleState {
		return this
	}
	onUserClickSkill(skill: number,crypt_turn:string): GameCycleState {
		return this
	}
	onUserBasicAttack(crypt_turn:string): GameCycleState {
		return this
	}
	onUserChooseSkillTarget(target: number,crypt_turn:string): GameCycleState {
		return this
	}
	onUserChooseSkillLocation(location: number,crypt_turn:string): GameCycleState {
		return this
	}
	onUserchooseAreaSkillLocation(location: number,crypt_turn:string): GameCycleState {
		return this
	}
	onUserStoreComplete(data: ClientPayloadInterface.ItemBought): void {
        if(this.id===GAME_CYCLE.GAMEOVER || this.crypt_turn!==data.crypt_turn) return

        this.game.userCompleteStore(data)
	}
	onUserCompletePendingObs(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string): GameCycleState {
		return this
	}
	onUserCompletePendingAction(info: ClientPayloadInterface.PendingObstacle,crypt_turn:string): GameCycleState {
		return this
	}
    timeOut(f:Function){
    }
    onTimeout():GameCycleState{
        return new TurnInitializer(this.game)
    }
}

class TurnInitializer extends GameCycleState{
    static id=GAME_CYCLE.BEFORE_OBS.INITIALIZE
    turnUpdateData:ServerPayloadInterface.TurnStart
    constructor(game:Game){
        let turnUpdateData=game.goNextTurn()
        super(game,GameOver.id)
        this.turnUpdateData=turnUpdateData
        RoomClientInterface.updateNextTurn(this.rname, turnUpdateData)
    }
    onCreate(): void {
		if (this.game.thisturn === 0) {
			RoomClientInterface.syncVisibility(this.rname, this.game.getPlayerVisibilitySyncData())
		}
        if(!this.turnUpdateData) return
        
    }
}
class GameOver extends GameCycleState {
	static id = GAME_CYCLE.GAMEOVER
	constructor(game: Game) {
		super(game,GameOver.id)
	}
	onCreate(): void {}
}

class StunDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.STUN
	constructor(game: Game) {
		super(game,StunDice.id)
	}
	onCreate(): void {}
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
		return new ThrowDice(this.game, data.actualdice)
	}
}
class ThrowDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.THROW_DICE
	distance: number
	constructor(game: Game, moveDistance: number) {
		super(game,ThrowDice.id)
		this.distance = moveDistance
	}
	onCreate(): void {}
}
export {GameCycleState}