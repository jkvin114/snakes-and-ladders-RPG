import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { CARD_TYPE } from "../../FortuneCard"
import { ClientResponseModel } from "../../Model/ClientResponseModel"
import { ServerRequestModel } from "../../Model/ServerRequestModel"
import { ISLAND_POS } from "../../mapconfig"
import { TILE_TYPE } from "../../tile/Tile"
import { chooseRandom } from "../../util"
import { BooleanChoice, BuildChoice, CardChoice, DiceChoice, IslandChoice, TileChoice } from "../ActionChoice"
import { ActionSelector } from "./ActionSelector"
import { RandomAgent } from "./RandomAgent"

/**
 * select action among all "rational" actions
 */
export class RationalRandomAgent extends RandomAgent{

	chooseCardObtain(req: ServerRequestModel.ObtainCardSelection): Promise<boolean> {
		let result=true

		//dont save card if player already has angel card
		if(req.type===CARD_TYPE.DEFENCE && this.myPlayer.getSavedCard()===ABILITY_NAME.ANGEL_CARD){
			result=false
		}

		return new Promise((resolve) => resolve(result))
	}

	chooseBuild(req: ServerRequestModel.LandBuildSelection): Promise<number[]> {
        let actions=new BuildChoice().generate(req).filter(b=>b.length>0)
        let a=actions.length===0?[]:chooseRandom(actions)
		return new Promise((resolve) => resolve(a))
	}
	chooseLoan(amount: number): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseBuyout(req: ServerRequestModel.BuyoutSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseTravelTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
        let tiles=new TileChoice().generateNoCancel(req)
        let choices:ClientResponseModel.SelectTile[]=[]

        //exclude island,card, and landmakrs
        for(const tile of tiles){
            if(tile.pos===ISLAND_POS) continue
            if(this.game.tileAt(tile.pos).type===TILE_TYPE.CARD) continue
            if(this.game.tileAt(tile.pos).isLandMark()) continue
			if(this.game.tileAt(tile.pos).type==TILE_TYPE.SIGHT && this.game.tileAt(tile.pos).owner!==-1) continue
            choices.push(tile)
        }
		return new Promise((resolve) => resolve(chooseRandom(choices)))
	}
	protected chooseStartBuildTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseGodHandBuildTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseOlympicTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseAttackTile(req: ServerRequestModel.TileSelection): Promise<ClientResponseModel.SelectTile> {
		return new Promise((resolve) => resolve(chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	chooseAttackDefenceCard(req: ServerRequestModel.AttackDefenceCardSelection): Promise<ClientResponseModel.UseCard> {
		return new Promise((resolve) => resolve({result:true,cardname:req.cardname}))
	}
	chooseTollDefenceCard(req: ServerRequestModel.TollDefenceCardSelection): Promise<ClientResponseModel.UseCard> {
		return new Promise((resolve) => resolve({result:true,cardname:req.cardname}))
	}
	chooseIsland(req: ServerRequestModel.IslandSelection): Promise<boolean> {
        //always escape when avaliable
		return new Promise((resolve) => resolve(req.canEscape))
	}
}
