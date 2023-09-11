import { roundToNearest } from "../../../util"
import type GameState from "../GameState"
import { PlayerState } from "../PlayerState"
import StateVectorizer from "./StateVectorizer"

export default class SimpleVectorizer extends StateVectorizer {
	vectorizeGame(state: GameState): number[] {
		return [state.totalturn, roundToNearest(state.totalBet/1000000,-2)]
	}
	vectorizePlayer(state: PlayerState): number[] {
		return [
			roundToNearest(state.money/1000000,-2),
			roundToNearest(state.totalAsset/1000000,-2) ,
			roundToNearest(state.totalToll/1000000,-2),
			state.landmarks,
			state.lands,
			Number(state.canLoan),
			Number(state.retired),
			state.monopolyState.colorMonopolies,
			...state.stats,
		]
	}
}
