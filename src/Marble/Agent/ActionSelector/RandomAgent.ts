import { ClientResponseModel } from "../../Model/ClientResponseModel"
import { ServerRequestModel } from "../../Model/ServerRequestModel"
import { chooseRandom } from "../../util"
import { BooleanChoice, BuildChoice, CardChoice, DiceChoice, IslandChoice, TileChoice } from "../ActionChoice"
import { ActionSelector } from "./ActionSelector"

/**
 * select action 100% randomly among all possible actions(even if it is not rational)
 */
export class RandomAgent extends ActionSelector {
	chooseCardObtain(req: ServerRequestModel.ObtainCardSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new BooleanChoice().generate())))
	}
	protected chooseGodHandBuildTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	chooseBuild(req: ServerRequestModel.LandBuildSelection): Promise<number[]> {
		return new Promise((resolve) => resolve(chooseRandom(new BuildChoice().generate(req))))
	}
	ChooseDice(req: ServerRequestModel.DiceSelection): Promise<ClientResponseModel.PressDice> {
		return new Promise((resolve) => resolve(chooseRandom(new DiceChoice().generate(req))))
	}
	chooseLoan(amount: number): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new BooleanChoice().generate())))
	}
	chooseBuyout(req: ServerRequestModel.BuyoutSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new BooleanChoice().generate())))
	}
	protected chooseTravelTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseStartBuildTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		console.log("startbuild")

		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseOlympicTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	protected chooseAttackTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generate(req))))
	}
	chooseAttackDefenceCard(req: ServerRequestModel.AttackDefenceCardSelection): Promise<ClientResponseModel.UseCard> {
		return new Promise((resolve) => resolve(chooseRandom(new CardChoice().generate(req))))
	}
	chooseTollDefenceCard(req: ServerRequestModel.TollDefenceCardSelection): Promise<ClientResponseModel.UseCard> {
		return new Promise((resolve) => resolve(chooseRandom(new CardChoice().generate(req))))
	}
	chooseGodHand(req: ServerRequestModel.GodHandSpecialSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseIsland(req: ServerRequestModel.IslandSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(chooseRandom(new IslandChoice().generate(req))))
	}
}
