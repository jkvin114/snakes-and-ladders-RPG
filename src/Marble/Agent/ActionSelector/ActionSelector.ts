
import { MarbleGame } from "../../Game";
import { ClientResponseModel } from "../../Model/ClientResponseModel";
import { ServerRequestModel } from "../../Model/ServerRequestModel";
import { MarblePlayer } from "../../Player";
import { ACTION_TYPE } from "../../action/Action";
import GameReader from "../GameReader";
import { PlayerState } from "../Utility/PlayerState";

export abstract class ActionSelector{
    protected readonly state:PlayerState
    protected readonly game:GameReader
    myturn:number

    abstract ChooseDice(req:ServerRequestModel.DiceSelection):Promise<ClientResponseModel.PressDice>
    abstract chooseLoan(amount:number):Promise<boolean>
    abstract chooseBuyout(req:ServerRequestModel.BuyoutSelection):Promise<boolean>
    protected abstract chooseTravelTile(req:ServerRequestModel.TileSelection):Promise<ClientResponseModel.SelectTile>
    protected abstract chooseStartBuildTile(req:ServerRequestModel.TileSelection):Promise<ClientResponseModel.SelectTile>
    protected abstract chooseOlympicTile(req:ServerRequestModel.TileSelection):Promise<ClientResponseModel.SelectTile>
    protected abstract chooseAttackTile(req:ServerRequestModel.TileSelection):Promise<ClientResponseModel.SelectTile>
    protected abstract chooseGodHandBuildTile(req:ServerRequestModel.TileSelection):Promise<ClientResponseModel.SelectTile>
    abstract chooseBuild(req:ServerRequestModel.LandBuildSelection):Promise<number[]>
    abstract chooseCardObtain(req:ServerRequestModel.ObtainCardSelection):Promise<boolean>
    abstract chooseAttackDefenceCard(req:ServerRequestModel.AttackDefenceCardSelection):Promise<ClientResponseModel.UseCard>
    abstract chooseTollDefenceCard(req:ServerRequestModel.TollDefenceCardSelection):Promise<ClientResponseModel.UseCard>
    abstract chooseGodHand(req:ServerRequestModel.GodHandSpecialSelection):Promise<boolean>
    abstract chooseIsland(req:ServerRequestModel.IslandSelection):Promise<boolean>


    constructor(state:PlayerState,game:MarbleGame){
        this.state=state
        this.game=new GameReader(game)
        this.myturn=0
    }
    get myPlayer(){
        return this.game.getPlayer(this.myturn)
    }
    chooseTile(req:ServerRequestModel.TileSelection):Promise<ClientResponseModel.SelectTile>{
        if(req.actionType===ACTION_TYPE.CHOOSE_MOVE_POSITION){
            if(req.source==="travel") return this.chooseTravelTile(req)
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

        return new Promise((resolve)=>resolve({result:false,pos:0,name:""})) 
    }
}