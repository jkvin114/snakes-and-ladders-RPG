import { roundToNearest } from "../../../util"
import type GameState from "../GameState"
import { PlayerState } from "../PlayerState"
import TileState from "../TileState"
import StateVectorizer from "./StateVectorizer"

export default class TileFocusVectorizer extends StateVectorizer {
	vectorizeGame(state: GameState): number[] {
		return [state.totalturn, roundToNearest(state.totalBet/1000000,-2),...this.vectorizeTile(state.tiles)]
	}

    private vectorizeTile(tiles:TileState[]):number[]{

        let list:number[]=[]
        tiles.forEach(t=>list.push(
            t.owner,
            roundToNearest(t.toll/1000000,-2),
            Number(t.isLandmark),
        ))
        return list
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
			state.monopolyState.colorMonopolies
		]
	}
}
