import type { MarbleGame } from "./Game";
import GameBoardController from "./GameBoardController";
import { MarbleGameMap } from "./GameMap";
import { MarbleGameEventObserver } from "./MarbleGameEventObserver";
import { ServerEventModel } from "../Model/ServerEventModel";
import { ACTION_TYPE, StateChangeAction } from "./action/Action";
import { ActionTrace } from "./action/ActionTrace";
import { TurnStartActionBuilder } from "./action/PackageBuilder";
import { range } from "./util";
const MAP = ["world", "god_hand"]

export default class GameController{
    private readonly state:MarbleGame
	eventEmitter: MarbleGameEventObserver
    private readonly map:GameBoardController
    constructor(game:MarbleGame,mapid:number){
        this.state=game
        this.eventEmitter = new MarbleGameEventObserver(this.state.rname)
        this.map=new GameBoardController(new MarbleGameMap(MAP[mapid % MAP.length]))
    }
    setClientInterface(ci: MarbleGameEventObserver) {
		this.eventEmitter = ci
		this.map.eventEmitter = ci
	}
    setItems(itemSetting: ServerEventModel.ItemSetting) {
		try {
			this.state.mediator.registerAbilities(itemSetting)
		} catch (e) {
			console.error(e)
		}
	}
    setTurns() {
		let turns = range(this.state.playerTotal - 1)
		this.state.mediator.setPlayerTurns(turns)
		// this.mediator.registerAbilities()
	}
    onGameStart() {}
	onTurnStart() {
		if (this.state.over) return
		let lastturn=this.state.thisturn
		this.state.thisturn = this.state.getNextTurn()

		this.state.thisPlayer().onTurnStart()
		// this.map.onTurnStart(this.state.thisturn)
		this.state.pushSingleAction(
			new StateChangeAction(ACTION_TYPE.END_TURN, this.state.thisturn),
			new ActionTrace(ACTION_TYPE.TURN_START)
		)

		let pkg = new TurnStartActionBuilder(this.state, new ActionTrace(ACTION_TYPE.TURN_START), this.state.thisPlayer()).build()

		this.state.thisPlayer().clearPendingAction()
		this.state.pushActions(pkg)

		if (this.state.thisturn < lastturn) {
			this.state.totalturn += 1
			if (this.state.totalturn === 6) this.state.mediator.upgradePlayerAbility()
		}
		if (this.state.checkTurnEnd()) return
	}
    
	incrementTotalBet(amount: number) {
		this.state.totalBet += amount
	}
	runSimpleInstantAction(type: ACTION_TYPE) {
		if (type === ACTION_TYPE.REMOVE_BLACKHOLE) this.eventEmitter.removeBlackHole()
	}

}