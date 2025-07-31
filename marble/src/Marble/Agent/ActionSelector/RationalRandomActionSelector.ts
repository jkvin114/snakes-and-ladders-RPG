import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { CARD_TYPE } from "../../FortuneCard"
import { ClientResponseModel as cm } from "../../../Model/ClientResponseModel"
import { ServerRequestModel as sm } from "../../../Model/ServerRequestModel"
import { ISLAND_POS } from "../../mapconfig"
import { TILE_TYPE } from "../../tile/Tile"
import { BooleanChoice, BuildChoice, CardChoice, DiceChoice, IslandChoice, TileChoice } from "../ActionChoice"
import { ActionSelector } from "./ActionSelector"
import { RandomAgent } from "./RandomAgent"

/**
 * select action among all "rational" actions
 */
export class RationalRandomAgent extends RandomAgent{

	chooseForcemove(playerPos: number[]): Promise<cm.SelectForcemove> {
		return new Promise((resolve) => resolve({result:false,targetDice:2,oddeven:0,playerPos:-1}))
	}

	chooseCardObtain(req: sm.ObtainCardSelection): Promise<boolean> {
		let result=true

		//dont save card if player already has angel card
		if(req.type===CARD_TYPE.DEFENCE && this.myPlayer.getSavedCard()===ABILITY_NAME.ANGEL_CARD){
			result=false
		}

		return new Promise((resolve) => resolve(result))
	}
	chooseLandSwap(mylands: number[], enemyLands: number[]): Promise<cm.SelectLandSwap> {
		return new Promise((resolve) => resolve({result:false,enemyLand:-1,myland:-1}))
	}
	chooseBuild(req: sm.LandBuildSelection): Promise<number[]> {
        let actions=new BuildChoice().generate(req).filter(b=>b.length>0)
        let a=actions.length===0?[]:this.game.rand.chooseRandom(actions)
		return new Promise((resolve) => resolve(a))
	}
	chooseLoan(amount: number): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseBuyout(req: sm.BuyoutSelection): Promise<boolean> {
		return new Promise((resolve) => resolve(true))
	}
	chooseMoveTileFor(req: sm.TileSelection): Promise<cm.SelectTile> {
        let tiles=new TileChoice().generateNoCancel(req)
        let choices:cm.SelectTile[]=[]

        //exclude island,card, and landmakrs
        for(const tile of tiles){
            if(tile.pos===ISLAND_POS) continue
            if(this.game.tileAt(tile.pos).type===TILE_TYPE.CARD) continue
            if(this.game.tileAt(tile.pos).isLandMark()) continue
			if(this.game.tileAt(tile.pos).type==TILE_TYPE.SIGHT && this.game.tileAt(tile.pos).owner!==-1) continue
            choices.push(tile)
        }
		if(choices.length===0) return super.chooseMoveTileFor(req)
		
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(choices)))
	}
	protected chooseStartBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseGodHandBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseOlympicTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseAttackTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseBlackholeTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(new TileChoice().generateNoCancel(req))))
	}
	protected chooseBuyoutTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		return new Promise((resolve) => resolve(this.game.rand.chooseRandom(new TileChoice().generateNoCancel(req))))
	}

	chooseAttackDefenceCard(req: sm.AttackDefenceCardSelection): Promise<cm.UseCard> {
		return new Promise((resolve) => resolve({result:true,cardname:req.cardname}))
	}
	chooseTollDefenceCard(req: sm.TollDefenceCardSelection): Promise<cm.UseCard> {
		return new Promise((resolve) => resolve({result:true,cardname:req.cardname}))
	}
	chooseIsland(req: sm.IslandSelection): Promise<boolean> {
        //always escape when avaliable
		return new Promise((resolve) => resolve(req.canEscape))
	}
}
