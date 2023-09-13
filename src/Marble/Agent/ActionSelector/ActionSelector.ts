
import { CARD_NAME } from "../../FortuneCard";
import { MarbleGame } from "../../Game";
import { ClientResponseModel as cm} from "../../Model/ClientResponseModel";
import { ServerRequestModel  as sm} from "../../Model/ServerRequestModel";
import { ACTION_TYPE } from "../../action/Action";
import GameReader from "../GameReader";
import { PlayerState } from "../Utility/PlayerState";

export abstract class ActionSelector{
    protected readonly state:PlayerState
    protected readonly game:GameReader
    myturn:number

    abstract ChooseDice(req:sm.DiceSelection):Promise<cm.PressDice>
    abstract chooseLoan(amount:number):Promise<boolean>
    abstract chooseBuyout(req:sm.BuyoutSelection):Promise<boolean>
    protected abstract chooseTravelTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseStartBuildTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseOlympicTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseAttackTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseGodHandBuildTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseMoveSpecialTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseDonateTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseBlackholeTile(req:sm.TileSelection):Promise<cm.SelectTile>
    protected abstract chooseBuyoutTile(req:sm.TileSelection):Promise<cm.SelectTile>

    abstract chooseBuild(req:sm.LandBuildSelection):Promise<number[]>
    abstract chooseCardObtain(req:sm.ObtainCardSelection):Promise<boolean>
    abstract chooseAttackDefenceCard(req:sm.AttackDefenceCardSelection):Promise<cm.UseCard>
    abstract chooseTollDefenceCard(req:sm.TollDefenceCardSelection):Promise<cm.UseCard>
    abstract chooseGodHand(req:sm.GodHandSpecialSelection):Promise<boolean>
    abstract chooseIsland(req:sm.IslandSelection):Promise<boolean>


    constructor(state:PlayerState,game:MarbleGame){
        this.state=state
        this.game=new GameReader(game)
        this.myturn=0
    }
    get myPlayer(){
        return this.game.getPlayer(this.myturn)
    }
    chooseTile(req:sm.TileSelection):Promise<cm.SelectTile>{

        if(req.tiles.length===0) return new Promise((resolve)=>resolve({result:false,pos:0,name:""})) 
        
        if(req.actionType===ACTION_TYPE.CHOOSE_MOVE_POSITION){
            return this.chooseTravelTile(req)
            // if(req.source==="travel") 
            // if(req.source===CARD_NAME.GO_SPECIAL)
            //     return this.chooseMoveSpecialTile(req)
        }
        if(req.actionType===ACTION_TYPE.CHOOSE_BUILD_POSITION){
            if(req.source==="start_build") return this.chooseStartBuildTile(req)
            if(req.source==="godhand_special_build") {
                return this.chooseGodHandBuildTile(req)
            }
        }
        if(req.actionType===ACTION_TYPE.CHOOSE_OLYMPIC_POSITION){
            return this.chooseOlympicTile(req)
        }
        if(req.actionType===ACTION_TYPE.CHOOSE_ATTACK_POSITION){
            return this.chooseAttackTile(req)
        }
        if(req.actionType===ACTION_TYPE.CHOOSE_DONATE_POSITION){
            return this.chooseDonateTile(req)
        }
        if(req.actionType===ACTION_TYPE.CHOOSE_BLACKHOLE){
            return this.chooseBlackholeTile(req)
        }
        if(req.actionType===ACTION_TYPE.CHOOSE_BUYOUT_POSITION)
            return this.chooseBuyoutTile(req)

        return new Promise((resolve)=>resolve({result:false,pos:0,name:""})) 
    }
}