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
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseBuyoutTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseMoveSpecialTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseDonateTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	chooseCardObtain(req: sm.ObtainCardSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new BooleanChoice().generate())))
	}
	protected chooseGodHandBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	chooseBuild(req: sm.LandBuildSelection): Promise<number[]> {
		return new Promise((resolve) => resolve(chooseRandom(new BuildChoice().generate(req))))
	}
	ChooseDice(req: sm.DiceSelection): Promise<cm.PressDice> {
		return new Promise((resolve) => resolve(chooseRandom(new DiceChoice().generate(req))))
	}
	chooseLoan(amount: number): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new BooleanChoice().generate())))
	}
	chooseBuyout(req: sm.BuyoutSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new BooleanChoice().generate())))
	}
	protected chooseTravelTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseStartBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {


		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseOlympicTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseAttackTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	chooseAttackDefenceCard(req: sm.AttackDefenceCardSelection): Promise<cm.UseCard> {
		return new Promise((resolve) => resolve(chooseRandom(new CardChoice().generate(req))))
	}
	chooseTollDefenceCard(req: sm.TollDefenceCardSelection): Promise<cm.UseCard> {
		return new Promise((resolve) => resolve(chooseRandom(new CardChoice().generate(req))))
	}
	chooseGodHand(req: sm.GodHandSpecialSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseIsland(req: sm.IslandSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new IslandChoice().generate(req))))
	}
}
