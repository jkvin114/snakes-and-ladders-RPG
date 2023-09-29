import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { ServerEventModel as se } from "../Model/ServerEventModel"
import { ServerRequestModel as sm } from "../Model/ServerRequestModel"
import { BUILDING } from "./tile/Tile"
import type { ServerWritableStream } from "@grpc/grpc-js"
import { marblegame } from "../grpc/services/marblegame"
const prefix = "server:"
namespace serverEvents {
	export const NEXTTURN = prefix + "nextturn"
	export const SHOW_DICE = prefix + "show_dice"
	export const THROW_DICE = prefix + "throwdice"
	export const WALK_MOVE = prefix + "walk_move"
	export const TELEPORT = prefix + "teleport"
	export const CHOOSE_BUILD = prefix + "choose_build"
	export const ASK_LOAN = prefix + "ask_loan"
	export const ASK_BUYOUT = prefix + "ask_buyout"
	export const PAY = prefix + "pay"
	export const BUILD = prefix + "build"
	export const MONOPOLY_ALERT = prefix + "monopoly_alert"
	export const BUYOUT = prefix + "buyout"
	export const SET_LANDOWNER = prefix + "set_landowner"
	export const UPDATE_TOLL = prefix + "update_toll"
	export const UPDATE_MULTIPLIERS = prefix + "update_multipliers"
	export const UPDATE_MONEY = prefix + "update_money"
	export const BANKRUPT = prefix + "bankrupt"
	export const GAMEOVER_BANKRUPT = prefix + "gameover_bankrupt"
	export const GAMEOVER_MONOPOLY = prefix + "gameover_monopoly"
	export const ASK_TILE_SELECTION = prefix + "tile_selection"
	export const CLEAR_BUILDINGS = prefix + "clear_buildings"
	export const UPDATE_OLYMPIC = prefix + "update_olympic"
	export const OBTAIN_CARD = prefix + "obtain_card"
	export const SAVE_CARD = prefix + "save_card"
	export const REMOVE_BUILDNIG = prefix + "remove_building"
	export const TILE_STATUS_EFFECT = prefix + "tile_status_effect"
	export const ASK_TOLL_DEFENCE_CARD = prefix + "ask_toll_defence_card"
	export const ASK_ATTACK_DEFENCE_CARD = prefix + "ask_attack_defence_card"
	export const ABILITY = prefix + "ability"
	export const TILE_STATE_UPDATE = prefix + "tile_state_update"
	export const ASK_GODHAND_SPECIAL = prefix + "ask_godhand_special"
	export const PULL = prefix + "pull"
	export const PLAYER_EFFECT = prefix + "player_effect"
	export const BLACKHOLE = prefix + "blackhole"
	export const MODIFY_LAND = prefix + "modify_land"
	export const ASK_ISLAND = prefix + "ask_island"
	export const REMOVE_BLACKHOLE = prefix + "remove_blackhole"
	export const MESSAGE = prefix + "message"
	export const INDICATE_DEFENCE = prefix + "indicate_defence"
	export const SIM_PROGRESS = prefix + "sim_progress"
	export const SIM_OVER = prefix + "sim_over"
	export const DEBUG_STACK = prefix + "debug_stack"
}
export interface GameEventEmitter extends ServerWritableStream<marblegame.String,marblegame.GameEvent>{
}
export class MarbleGameEventObserver {
	private eventEmitter: GameEventEmitter|undefined
	private simulationEventEmitter: GameEventEmitter|undefined
	private rname: string
	constructor(rname: string) {
		this.rname = rname
	}
	registerCallback(callback: GameEventEmitter) {
		//    console.log("registerCallback")
		this.eventEmitter = callback
	}
	registerSimulationCallback(callback: GameEventEmitter) {
		this.simulationEventEmitter = callback
	}
	private emit(type:string,payload:any,player:number=0){
		if(typeof payload === "string" || typeof payload === "number" || typeof payload === "boolean") 
			payload = {val:payload}
		if(payload===null || payload===undefined)
			payload = null
		this.eventEmitter?.write(new marblegame.GameEvent({
			rname:this.rname,
			player:player,
			type:type,
			jsonObj:JSON.stringify(payload)
		}))
	}

	private close(){
		console.log("game over! close stream")
		this.eventEmitter?.end()
	}

	simulationProgress(p: number) {
		this.emit( serverEvents.SIM_PROGRESS, p)
	}
	simulationOver(status: boolean, data: any) {
		this.emit( serverEvents.SIM_OVER, status, data)
	}   

	turnStart(turn: number) {
		this.emit(serverEvents.NEXTTURN,null, turn)
	}
	throwDice(player: number, data: se.ThrowDiceData) {
		this.emit(serverEvents.THROW_DICE, data,player)
	}
	walkMovePlayer(player: number, from: number, distance: number, movetype: string) {
        const payload:se.PlayerWalkMove={
            from:from,distance:distance,movetype:movetype
        }

		this.emit(  serverEvents.WALK_MOVE, payload,player)
	}
	teleportPlayer(player: number, pos: number, movetype: string) {
        const payload:se.PlayerTeleport={
            pos:pos,movetype:movetype
        }
		this.emit(  serverEvents.TELEPORT, payload,player)
	}

	///==============================================================
	//query requests

	showDiceBtn(player: number, data: sm.DiceSelection) {
		this.emit(  serverEvents.SHOW_DICE, data,player)
	}

	chooseBuild(player: number, req: sm.LandBuildSelection) {
		// pos:number,player:number,builds:ServerRequestModel.buildAvaliability[],buildsHave:BUILDING[],discount:number,money:number){
		this.emit(
			 
			serverEvents.CHOOSE_BUILD,req,player
		)
	}
	askLoan(player: number, amount: number) {
		this.emit(  serverEvents.ASK_LOAN, player, amount)
	}
	askBuyout(player: number, pos: number, price: number, originalPrice: number) {
        const payload:sm.BuyoutSelection={
            pos:pos,price:price,originalPrice:originalPrice
        }
		this.emit(  serverEvents.ASK_BUYOUT, payload,player)
	}
	askTileSelection(player: number, tiles: number[], source: string) {
        const payload:sm.TileSelection={
            tiles:tiles,source:source
        }

		this.emit(  serverEvents.ASK_TILE_SELECTION, payload,player)
	}
	askAttackDefenceCard(player: number, cardname: string, attackName: string) {
		const payload:sm.AttackDefenceCardSelection={
            cardname:cardname,attackName:attackName
        }
        this.emit(  serverEvents.ASK_ATTACK_DEFENCE_CARD, payload,player)
	}
	askTollDefenceCard(player: number, cardname: string, before: number, after: number) {
        const payload:sm.TollDefenceCardSelection={
            cardname:cardname,before:before,after:after
        }
		this.emit(  serverEvents.ASK_TOLL_DEFENCE_CARD, payload,player)
	}
	askGodHandSpecial(player: number, canLiftTile: boolean) {
        const payload:sm.GodHandSpecialSelection={
            canLiftTile:canLiftTile
        }
		this.emit(  serverEvents.ASK_GODHAND_SPECIAL, payload,player)
	}
	askIsland(player: number, canEscape: boolean, escapePrice: number) {
        const payload:sm.IslandSelection={
            canEscape:canEscape,escapePrice:escapePrice
        }
		this.emit(  serverEvents.ASK_ISLAND, payload,player)
	}

	//=====================================================
	setLandOwner(pos: number, player: number) {

		this.emit(  serverEvents.SET_LANDOWNER, pos, player)
	}
	updateToll(pos: number, toll: number, multiplier: number) {
        const payload:se.Toll={
            pos:pos,
            toll:toll,multiplier:multiplier
        }
		this.emit(  serverEvents.UPDATE_TOLL, payload)
	}
	updateMultipliers(change: { pos: number; toll: number; mul: number }[]) {
        for(const ch of change){
            const payload:se.Multiplier={
                pos:ch.pos,toll:ch.toll,mul:ch.mul
            }
			this.emit(  serverEvents.UPDATE_MULTIPLIERS, payload)
        }
		
	}
	setOlympic(pos: number) {
		this.emit(  serverEvents.UPDATE_OLYMPIC, pos)
	}
	setSavedCard(player: number, name: string, level: number) {
        const payload:se.CardSave={
            name:name,level:level
        }
		this.emit(  serverEvents.SAVE_CARD, payload,player)
	}
	ability(player: number, name: ABILITY_NAME, itemName: string, desc: string, isblocked: boolean) {
		const payload:se.Ability={
            name:name,itemName:itemName,desc:desc,isblocked:isblocked
        }
        this.emit(  serverEvents.ABILITY, payload,player)
	}
	indicatePull(tiles: number[]) {
        const payload:se.Pull={
            tiles:tiles
        }
		this.emit(  serverEvents.PULL, payload)
	}
	setPlayerEffect(player: number, effect: string, pos: number, status: boolean) {
        const payload:se.PlayerEffect={
            effect:effect,pos:pos,status:status
        }
		this.emit(  serverEvents.PLAYER_EFFECT, payload,player)
	}
	createBlackHole(blackpos: number, whitepos: number) {
        const payload:se.BlackHole={
            blackpos:blackpos,whitepos:whitepos
        }
		this.emit(  serverEvents.BLACKHOLE, payload)
	}
	removeBlackHole() {
		this.emit( serverEvents.REMOVE_BLACKHOLE,null)
	}
	modifyLand(pos: number, type: string, val: number) {
        const payload:se.LandModify={
            pos:pos,type:type,val:val
        }
		this.emit(  serverEvents.MODIFY_LAND, payload)
	}
	/**
	 *
	 * @param payer
	 * @param receiver -1 if it pays to the bank
	 * @param amount
	 */
	payMoney(payer: number, receiver: number, amount: number, type: string) {
        const payload:se.Payment={
            payer:payer,receiver:receiver,amount:amount,type:type
        }
		this.emit(  serverEvents.PAY, payload)
	}
	build(pos: number, builds: BUILDING[], player: number) {
        const payload:se.Build={
            pos:pos,builds:builds
        }
		this.emit(  serverEvents.BUILD, payload,player)
	}
	monopolyAlert(player: number, type: number, pos: number[]) {
        const payload:se.MonopolyAlert={
            type:type,pos:pos
        }
		this.emit(  serverEvents.MONOPOLY_ALERT, payload,player)
	}
	buyout(player: number, pos: number) {

		this.emit(  serverEvents.BUYOUT, pos,player)
	}
	obtainCard(player: number, cardname: string, cardLevel: number, cardType: number) {
        const payload:se.CardObtain={
            cardLevel:cardLevel,cardName:cardname,cardType:cardType
        }
		this.emit(  serverEvents.OBTAIN_CARD, payload,player)
	}
	changeMoney(player: number, money: number) {
        
		this.emit(  serverEvents.UPDATE_MONEY, money, player)
	}
	clearBuildings(toremove: number[]) {
        const payload:se.ClearBuildings={
            toremove:toremove
        }
		this.emit(  serverEvents.CLEAR_BUILDINGS, payload)
	}
	removeBuilding(toremove: number[], pos: number) {
        const payload:se.RemoveBuilding={
            toremove:toremove,pos:pos
        }
		this.emit(  serverEvents.REMOVE_BUILDNIG, payload)
	}
	setStatusEffect(pos: number, name: string, dur: number) {
        const payload:se.TileEffect={
            pos:pos,name:name,dur:dur
        }
		this.emit(  serverEvents.TILE_STATUS_EFFECT, payload)
	}
	setTileState(change: se.tileStateChange) {
		this.emit(  serverEvents.TILE_STATE_UPDATE, change)
	}
	sendMessage(player: number, message: string) {
		this.emit(  serverEvents.MESSAGE,message, player )
	}
	indicateDefence(type: string, pos: number) {
        const payload:se.Defence={
            type:type,pos:pos
        }
		this.emit(  serverEvents.INDICATE_DEFENCE, payload)
	}
	bankrupt(player: number) {
		this.emit(  serverEvents.BANKRUPT, player)
	}
	gameOverWithMonopoly(player: number, monopoly: number, scores: number[], mul: number) {
        const payload:se.MonopolyWin={
            monopoly:monopoly,scores:scores,mul:mul
        }
		this.emit(  serverEvents.GAMEOVER_MONOPOLY, payload,player)
		this.close()
	}
	gameoverWithBankrupt(player: number, scores: number[], mul: number) {
        const payload:se.BankruptWin={
            scores:scores,mul:mul
        }
		this.emit(  serverEvents.GAMEOVER_BANKRUPT, payload,player)
		this.close()
	}

	//debug==================================

	debugActionStack(stack: any) {
        const payload:se.ActionStack_debug={
            stack:stack
        }
		this.emit(  serverEvents.DEBUG_STACK, payload)
	}
}
