import { ClientInterfaceCallback } from "../ClientInterface"
import { ServerPayloadInterface } from "./ServerPayloadInterface"
import { BUILDING } from "./tile/Tile"
const prefix="server:"
const SERVER_EVENTS={
    NEXTTURN:prefix+"nextturn",
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
    showDiceBtn(player:number,data:any){
        this.callback(this.rname, SERVER_EVENTS.NEXTTURN, player,data)
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
    setLandOwner(pos:number,player:number){
        this.callback(this.rname, SERVER_EVENTS.SET_LANDOWNER, pos,player)
    }
    updateToll(pos:number,toll:number,multiplier:number){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_TOLL, pos,toll,multiplier)
    }
    updateMultipliers(change:{pos:number,toll:number,mul:number}[]){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_MULTIPLIERS, change)
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
    changeMoney(player:number,money:number){
        this.callback(this.rname, SERVER_EVENTS.UPDATE_MONEY, player,money)
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