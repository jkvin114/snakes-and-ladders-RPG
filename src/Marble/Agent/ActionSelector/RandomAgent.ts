import { ClientResponseModel as cm} from "../../Model/ClientResponseModel"
import { ServerRequestModel as sm} from "../../Model/ServerRequestModel"
import { chooseRandom } from "../../util"
import { BooleanChoice, BuildChoice, CardChoice, DiceChoice, IslandChoice, TileChoice } from "../ActionChoice"
import { ActionSelector } from "./ActionSelector"

/**
 * select action 100% randomly among all possible actions(even if it is not rational)
 */
export class RandomAgent extends ActionSelector {
	protected chooseBlackholeTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	protected chooseBuyoutTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	protected chooseDonateTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	chooseCardObtain(req: sm.ObtainCardSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(new BooleanChoice().getRandom()))
	}
	protected chooseGodHandBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	chooseBuild(req: sm.LandBuildSelection): Promise<number[]> {
		return new Promise((resolve) => resolve(new BuildChoice().getRandom(req)))
	}
	ChooseDice(req: sm.DiceSelection): Promise<cm.PressDice> {
		return new Promise((resolve) => resolve(new DiceChoice().getRandom(req)))
	}
	chooseLoan(amount: number): Promise<boolean> {
		return new Promise((resolve) => resolve(new BooleanChoice().getRandom()))
	}
	chooseBuyout(req: sm.BuyoutSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(new BooleanChoice().getRandom()))
	}
	protected chooseTravelTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	protected chooseStartBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	protected chooseOlympicTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	protected chooseAttackTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(new TileChoice().getRandom(req)))
	}
	chooseAttackDefenceCard(req: sm.AttackDefenceCardSelection): Promise<cm.UseCard> {
		return new Promise((resolve) => resolve(new CardChoice().getRandom(req)))
	}
	chooseTollDefenceCard(req: sm.TollDefenceCardSelection): Promise<cm.UseCard> {
		return new Promise((resolve) => resolve(new CardChoice().getRandom(req)))
	}
	chooseGodHand(req: sm.GodHandSpecialSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseIsland(req: sm.IslandSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(new IslandChoice().getRandom(req)))
	}
}
