import { GameEventEmitter } from "../sockets/GameEventEmitter"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { ServerEventModel } from "./Model/ServerEventModel"
import { ServerRequestModel } from "./Model/ServerRequestModel"
import { BUILDING } from "./tile/Tile"
const prefix="server:"
const serverEvents={
    NEXTTURN:prefix+"nextturn",
    SHOW_DICE:prefix+"show_dice",
    THROW_DICE:prefix+"throwdice",
    WALK_MOVE:prefix+"walk_move",
    TELEPORT:prefix+"teleport",
    CHOOSE_BUILD:prefix+"choose_build",
    ASK_LOAN:prefix+"ask_loan",
    ASK_BUYOUT:prefix+"ask_buyout",
    PAY:prefix+"pay",
    BUILD:prefix+"build",
    MONOPOLY_ALERT:prefix+"monopoly_alert",
    BUYOUT:prefix+"buyout",
    SET_LANDOWNER:prefix+"set_landowner",
    UPDATE_TOLL:prefix+"update_toll",
    UPDATE_MULTIPLIERS:prefix+"update_multipliers",
    UPDATE_MONEY:prefix+"update_money",
    BANKRUPT:prefix+"bankrupt",
    GAMEOVER_BANKRUPT:prefix+"gameover_bankrupt",
    GAMEOVER_MONOPOLY:prefix+"gameover_monopoly",
    ASK_TILE_SELECTION:prefix+"tile_selection",
    CLEAR_BUILDINGS:prefix+"clear_buildings",
    UPDATE_OLYMPIC:prefix+"update_olympic",
    OBTAIN_CARD:prefix+"obtain_card",
    SAVE_CARD:prefix+"save_card",
    REMOVE_BUILDNIG:prefix+"remove_building",
    TILE_STATUS_EFFECT:prefix+"tile_status_effect",
    ASK_TOLL_DEFENCE_CARD:prefix+"ask_toll_defence_card",
    ASK_ATTACK_DEFENCE_CARD:prefix+"ask_attack_defence_card",
    ABILITY:prefix+"ability",
    TILE_STATE_UPDATE:prefix+"tile_state_update",
    ASK_GODHAND_SPECIAL:prefix+"ask_godhand_special",
    PULL:prefix+"pull",
    PLAYER_EFFECT:prefix+"player_effect",
    BLACKHOLE:prefix+"blackhole",
    MODIFY_LAND:prefix+"modify_land",
    ASK_ISLAND:prefix+"ask_island",
    REMOVE_BLACKHOLE:prefix+"remove_blackhole",
    MESSAGE:prefix+"message",
    INDICATE_DEFENCE:prefix+"indicate_defence",
    SIM_PROGRESS:prefix+"sim_progress",
    SIM_OVER:prefix+"sim_over"

}

export class MarbleGameEventObserver {
	private eventEmitter: GameEventEmitter
    private simulationEventEmitter:GameEventEmitter
	private rname: string
	constructor(rname: string) {
		this.rname = rname
		this.eventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
        this.simulationEventEmitter = (roomname: string, type: string, ...args: unknown[]) => {}
	}
    registerCallback(callback: GameEventEmitter) {
        //    console.log("registerCallback")
            this.eventEmitter = callback
    }
    registerSimulationCallback(callback: GameEventEmitter){
        this.simulationEventEmitter=callback
    }
    simulationProgress(p:number){
        this.simulationEventEmitter(this.rname, serverEvents.SIM_PROGRESS, p)
    }
    simulationOver(status:boolean,data:any){
        this.simulationEventEmitter(this.rname, serverEvents.SIM_OVER, status,data)
    }
    turnStart(turn:number){
        this.eventEmitter(this.rname, serverEvents.NEXTTURN, turn)
    }
    throwDice(player:number,data:ServerEventModel.ThrowDiceData){
        this.eventEmitter(this.rname,serverEvents.THROW_DICE, player,data)
    }
    walkMovePlayer(player:number,from:number,distance:number,movetype:string){
        this.eventEmitter(this.rname, serverEvents.WALK_MOVE, player,from,distance,movetype)
    }
    teleportPlayer(player:number,pos:number,movetype:string){
        this.eventEmitter(this.rname, serverEvents.TELEPORT, player,pos,movetype)
    }

    ///===============================================
    //query requests
    
    showDiceBtn(player:number,data:ServerRequestModel.DiceSelection){
        this.eventEmitter(this.rname, serverEvents.SHOW_DICE, player,data)
    }
    
    chooseBuild(player:number,req:ServerRequestModel.LandBuildSelection){
       // pos:number,player:number,builds:ServerRequestModel.buildAvaliability[],buildsHave:BUILDING[],discount:number,money:number){
        this.eventEmitter(this.rname, serverEvents.CHOOSE_BUILD,req.pos,player,req.builds,req.buildsHave,req.discount,req.money)
    }
    askLoan(player:number,amount:number){
        this.eventEmitter(this.rname, serverEvents.ASK_LOAN, player,amount)
    }
    askBuyout(player:number,pos:number,price:number,originalPrice:number){
        this.eventEmitter(this.rname, serverEvents.ASK_BUYOUT, player,pos,price,originalPrice)
    }
    askTileSelection(turn:number,tiles:number[],source:string){
        this.eventEmitter(this.rname, serverEvents.ASK_TILE_SELECTION, turn,tiles,source)
    }
    askAttackDefenceCard(turn:number,cardname:string,attackName:string){
        this.eventEmitter(this.rname, serverEvents.ASK_ATTACK_DEFENCE_CARD, turn,cardname,attackName)
    }
    askTollDefenceCard(turn:number,cardname:string,before:number,after:number){
        this.eventEmitter(this.rname, serverEvents.ASK_TOLL_DEFENCE_CARD, turn,cardname,before,after)
    }
    askGodHandSpecial(turn:number,canLiftTile:boolean){
        this.eventEmitter(this.rname,serverEvents.ASK_GODHAND_SPECIAL,turn,canLiftTile)
    }
    askIsland(turn:number,canEscape:boolean,escapePrice:number){
        this.eventEmitter(this.rname,serverEvents.ASK_ISLAND,turn,canEscape,escapePrice)
    }

    //================================
    setLandOwner(pos:number,player:number){
        this.eventEmitter(this.rname, serverEvents.SET_LANDOWNER, pos,player)
    }
    updateToll(pos:number,toll:number,multiplier:number){
        this.eventEmitter(this.rname, serverEvents.UPDATE_TOLL, pos,toll,multiplier)
    }
    updateMultipliers(change:{pos:number,toll:number,mul:number}[]){
        this.eventEmitter(this.rname, serverEvents.UPDATE_MULTIPLIERS, change)
    }
    setOlympic(pos:number){
        this.eventEmitter(this.rname, serverEvents.UPDATE_OLYMPIC, pos)
    }
    setSavedCard(turn:number,name:string,level:number){
        this.eventEmitter(this.rname, serverEvents.SAVE_CARD, turn,name,level)
    }
    ability(turn:number,name:ABILITY_NAME,itemName:string,desc:string,isblocked:boolean){
        this.eventEmitter(this.rname, serverEvents.ABILITY, turn,name,itemName,desc,isblocked)
    }
    indicatePull(tiles:number[]){
        this.eventEmitter(this.rname, serverEvents.PULL, tiles)
    }
    setPlayerEffect(turn:number,effect:string,pos:number,status:boolean){
        this.eventEmitter(this.rname,serverEvents.PLAYER_EFFECT,turn,effect,pos,status)
    }
    createBlackHole(blackpos:number,whitepos:number){
        this.eventEmitter(this.rname,serverEvents.BLACKHOLE,blackpos,whitepos)
    }
    removeBlackHole(){
        this.eventEmitter(this.rname,serverEvents.REMOVE_BLACKHOLE)

    }
    modifyLand(pos:number,type:string,val:number){
        this.eventEmitter(this.rname,serverEvents.MODIFY_LAND,pos,type,val)
    }
    /**
     * 
     * @param payer 
     * @param receiver -1 if it pays to the bank
     * @param amount 
     */
    payMoney(payer:number,receiver:number,amount:number,type:string)
    {
        this.eventEmitter(this.rname, serverEvents.PAY, payer,receiver,amount,type)
    }
    build(pos:number,builds:BUILDING[],player:number){
        this.eventEmitter(this.rname, serverEvents.BUILD, pos,builds,player)
    }
    monopolyAlert(player:number,type:number,pos:number[]){
        this.eventEmitter(this.rname, serverEvents.MONOPOLY_ALERT, player,type,pos)
    }
    buyout(player:number,pos:number){
        this.eventEmitter(this.rname, serverEvents.BUYOUT, player,pos)
    }
    obtainCard(player:number,cardname:string,cardLevel:number,cardType:number){
        this.eventEmitter(this.rname, serverEvents.OBTAIN_CARD, player,cardname,cardLevel,cardType)
    }
    changeMoney(player:number,money:number){
        this.eventEmitter(this.rname, serverEvents.UPDATE_MONEY, player,money)
    }
    clearBuildings(toremove:number[]){
        this.eventEmitter(this.rname, serverEvents.CLEAR_BUILDINGS, toremove)
    }
    removeBuilding(toremove:number[],pos:number){
        this.eventEmitter(this.rname, serverEvents.REMOVE_BUILDNIG, pos,toremove)
    }
    setStatusEffect(pos:number,name:string,dur:number){
        this.eventEmitter(this.rname, serverEvents.TILE_STATUS_EFFECT, pos,name,dur)
    }
    setTileState(change:ServerEventModel.tileStateChange){
        this.eventEmitter(this.rname, serverEvents.TILE_STATE_UPDATE, change)
    }
    sendMessage(player:number,message:string){
        this.eventEmitter(this.rname, serverEvents.MESSAGE, player,message)
    }
    indicateDefence(type:string,pos:number){
        this.eventEmitter(this.rname, serverEvents.INDICATE_DEFENCE, type,pos)
    }
    bankrupt(player:number)
    {
        this.eventEmitter(this.rname, serverEvents.BANKRUPT, player)
    }
    gameOverWithMonopoly(player:number,monopoly:number,scores:number[],mul:number)
    {
        this.eventEmitter(this.rname, serverEvents.GAMEOVER_MONOPOLY, player,monopoly,scores,mul)
    }
    gameoverWithBankrupt(player:number,scores:number[],mul:number)
    {
        this.eventEmitter(this.rname, serverEvents.GAMEOVER_BANKRUPT, player,scores,mul)
    }
}