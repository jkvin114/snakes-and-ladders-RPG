import { sleep } from "../../grpc/test_init"
import { CARD_NAME } from "../FortuneCard"
import type { MarbleGame } from "../Game"
import QueryEventResult from "../QueryEventResult"
import type { AskForceMoveAction } from "../action/QueryAction"
import { GAME_EFFECT } from "../enum"
import { GAME_CYCLE } from "../gamecycleEnum"
import WaitingState from "./WaitingState"

export default class WaitingForceMove extends WaitingState<AskForceMoveAction> {
	static id = GAME_CYCLE.WAITING_FORCEMOVE
	private selectedPos: number
	constructor(game: MarbleGame, action: AskForceMoveAction) {
		super(game, action.turn, WaitingForceMove.id, action)
		this.selectedPos = -1
	}
	onCreate(): void {}

	async runAISelection(): Promise<boolean> {
		let result = await this.playerAgent.chooseForcemove(this.sourceAction.playerPos)
		if (result.result) {
			this.selectedPos = result.playerPos
            this.game.eventEmitter.effect(GAME_EFFECT.FORCEMOVE_SELECT,this.selectedPos)
			await sleep(1000)
			this.onUserPressDice(result.targetDice, result.oddeven)
		}
		return true
	}

	/**
	 * 1. 위치선택 요청 전송
	 */
	sendQueryRequest(): void {
		this.game.eventEmitter.askTileSelection(this.turn, this.sourceAction.playerPos, "forcemove_player")
	}
	/**
	 * 2. 위치 선택
	 * @param pos
	 * @param name
	 * @param result
	 * @returns
	 */
	onUserSelectTile(pos: number, name: string, result: boolean) {
		if (name !== "forcemove_player") return new QueryEventResult(false)
		if (!result) return new QueryEventResult(true)

		this.selectedPos = pos
		let diceinfo = this.game.getDiceData(this.turn)
        this.game.eventEmitter.effect(GAME_EFFECT.FORCEMOVE_SELECT,pos)
		diceinfo.origin = pos
		setTimeout(() => {
            
			this.game.eventEmitter.showDiceBtn(this.turn, diceinfo)
		}, 500)

		return new QueryEventResult(false).setData(pos)
	}
	/**
	 * 3. 주사위 굴림
	 *
	 */
	onUserPressDice(target: number, oddeven: number): QueryEventResult {
		if (this.selectedPos === -1) {
			return new QueryEventResult(false)
		}

		let data = this.game.onSelectForcemove(target, oddeven,this.selectedPos, this.sourceAction)
		this.game.eventEmitter.throwDice(this.turn, data)
		return new QueryEventResult(true).setData(data)
	}
}
