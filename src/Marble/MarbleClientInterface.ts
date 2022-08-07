import { ClientInterfaceCallback } from "../ClientInterface"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { ServerPayloadInterface } from "./ServerPayloadInterface"
import { BUILDING } from "./tile/Tile"
const prefix="server:"
const SERVER_EVENTS={
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
}

export class MarbleClientInterface {
	callback: ClientInterfaceCallback
    callback_simulation:ClientInterfaceCallback
	rname: string
	constructor(rname: string) {
		this.rname = rname
		this.callback = (roomname: string, type: string, ...args: unknown[]) => {}
        this.callback_simulation = (roomname: string, type: string, ...args: unknown[]) => {}
	}
    registerCallback(callback: ClientInterfaceCallback) {
        //    console.log("registerCallback")
            this.callback = callback
    }
    turnStart(turn:number){
        this.callback(this.rname, SERVER_EVENTS.NEXTTURN, turn)
    }
    showDiceBtn(player:number,data:any){
        this.callback(this.rname, SERVER_EVENTS.SHOW_DICE, player,data)
    }
    throwDice(player:number,data:any){
        this.callback(this.rname,SERVER_EVENTS.THROW_DICE, player,data)
    }
    walkMovePlayer(player:number,from:number,distance:number){
        this.callback(this.rname, SERVER_EVENTS.WALK_MOVE, player,from,distance)
    }
    teleportPlayer(player:number,pos:number){
        this.callback(this.rname, SERVER_EVENTS.TELEPORT, player,pos)
    }
    chooseBuild(pos:number,player:number,builds:ServerPayloadInterface.buildAvaliability[],buildsHave:BUILDING[],discount:number,money:number){
        this.callback(this.rname, SERVER_EVENTS.CHOOSE_BUILD,player,pos,builds,buildsHave,discount,money)
    }
    askLoan(player:number,amount:number){
        this.callback(this.rname, SERVER_EVENTS.ASK_LOAN, player,amount)
    }
    askBuyout(player:number,pos:number,price:number,originalPrice:number){
        this.callback(this.rname, SERVER_EVENTS.ASK_BUYOUT, player,pos,price,originalPrice)
    }
    askTileSelection(turn:number,tiles:number[],source:string){
        this.callback(this.rname, SERVER_EVENTS.ASK_TILE_SELECTION, turn,tiles,source)
    }
    askAttackDefenceCard(turn:number,cardname:string,attackName:string){
        this.callback(this.rname, SERVER_EVENTS.ASK_ATTACK_DEFENCE_CARD, turn,cardname,attackName)
    }
    askTollDefenceCard(turn:number,cardname:string,before:number,after:number){
        this.callback(this.rname, SERVER_EVENTS.ASK_TOLL_DEFENCE_CARD, turn,cardname,before,after)
    }
    askGodHandSpecial(turn:number,canLiftTile:boolean){
        this.callback(this.rname,SERVER_EVENTS.ASK_GODHAND_SPECIAL,turn,canLiftTile)
    }
    setLandOwner(pos:number,player:number){
        this.callback(this.rname, SERVER_EVENTS.SET_LANDOWNER, pos,player)
    }
    updateToll(pos:number,toll:number,multiplier:number){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_TOLL, pos,toll,multiplier)
    }
    updateMultipliers(change:{pos:number,toll:number,mul:number}[]){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_MULTIPLIERS, change)
    }
    setOlympic(pos:number){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_OLYMPIC, pos)
    }
    setSavedCard(turn:number,name:string,level:number){
        this.callback(this.rname, SERVER_EVENTS.SAVE_CARD, turn,name,level)
    }
    ability(turn:number,name:ABILITY_NAME,itemName:string,desc:string,isblocked:boolean){
        this.callback(this.rname, SERVER_EVENTS.ABILITY, turn,name,itemName,desc,isblocked)
    }
    indicatePull(tiles:number[]){
        this.callback(this.rname, SERVER_EVENTS.PULL, tiles)
    }
    /**
     * 
     * @param payer 
     * @param receiver -1 if it pays to the bank
     * @param amount 
     */
    payMoney(payer:number,receiver:number,amount:number)
    {
        this.callback(this.rname, SERVER_EVENTS.PAY, payer,receiver,amount)
    }
    build(pos:number,builds:BUILDING[],player:number){
        this.callback(this.rname, SERVER_EVENTS.BUILD, pos,builds,player)
    }
    monopolyAlert(player:number,type:number,pos:number[]){
        this.callback(this.rname, SERVER_EVENTS.MONOPOLY_ALERT, player,type,pos)
    }
    buyout(player:number,pos:number){
        this.callback(this.rname, SERVER_EVENTS.BUYOUT, player,pos)
    }
    obtainCard(player:number,cardname:string,cardLevel:number,cardType:number){
        this.callback(this.rname, SERVER_EVENTS.OBTAIN_CARD, player,cardname,cardLevel,cardType)
    }
    changeMoney(player:number,money:number){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_MONEY, player,money)
    }
    clearBuildings(toremove:number[]){
        this.callback(this.rname, SERVER_EVENTS.CLEAR_BUILDINGS, toremove)
    }
    removeBuilding(toremove:number[],pos:number){
        this.callback(this.rname, SERVER_EVENTS.REMOVE_BUILDNIG, pos,toremove)
    }
    setStatusEffect(pos:number,name:string,dur:number){
        this.callback(this.rname, SERVER_EVENTS.TILE_STATUS_EFFECT, pos,name,dur)
    }
    setTileState(change:ServerPayloadInterface.tileStateChange){
        this.callback(this.rname, SERVER_EVENTS.TILE_STATE_UPDATE, change)
    }
    bankrupt(player:number)
    {
        this.callback(this.rname, SERVER_EVENTS.BANKRUPT, player)
    }
    gameOverWithMonopoly(player:number,monopoly:number)
    {
        this.callback(this.rname, SERVER_EVENTS.GAMEOVER_MONOPOLY, player,monopoly)
    }
    gameoverWithBankrupt(player:number)
    {
        this.callback(this.rname, SERVER_EVENTS.GAMEOVER_BANKRUPT, player)
    }
}