import { GAME, SOLOPLAY } from "./marble.js"
export class Socket{
    constructor(){
        this.requestSetting
        this.gameReady
		this.clickDice
		this.chooseBuild
		this.chooseBuyout
    }
}
const PREFIX="marble:user:"
function checkTurn(turn){
	if(SOLOPLAY) return true
	return GAME.myTurn===turn
}
export function openConnection(isInitial){
    const socket = io("http://" + sessionStorage.ip_address)
	GAME.connection = new Socket()
	let connectionTimeout=null
	const RNAME = sessionStorage.roomName
    console.log("open connection")
    socket.on("connect", function () {
		console.log("game"+isInitial)
		// connectionChecker()
		if(isInitial && !GAME.begun){
			console.log("game"+isInitial)
			GAME.connection.requestsetting()
			$("#loadingtext").html("REQUESTING GAME DATA..")
		}
		else if(GAME.begun){
			console.log("reconnect"+RNAME)
			socket.emit("user:reconnect")
		}
	})
    socket.on("server:initialsetting", function (setting,num,turn) {
		console.log("initialsetting")
		GAME.init(setting,num,turn)
	})
	socket.on("server:nextturn", function (turn) {
		GAME.turnStart(turn)
	})
    socket.on("server:show_dice", function (turn,data) {
		if(!checkTurn(turn)) return
		GAME.showDiceBtn(turn,data)
		console.log(data)
	})
    socket.on("server:throwdice", function (turn,data) {
        console.log("throwdice")
		console.log(turn,data)
		GAME.diceRoll(turn,data)
	})
    socket.on("server:walk_move", function (player,from,distance) {
        console.log("walk_move")
		console.log(player,distance)
		GAME.playerWalkMove(player,from,distance)
	})
    socket.on("server:teleport", function (player,pos) {
		console.log(player,pos)
		GAME.playerTeleport(player,pos)
	})
	socket.on("server:pull", function (tiles) {
        console.log("pull")
		console.log(tiles)
		GAME.scene.indicatePull(tiles)
	})
    socket.on("server:choose_build", function (pos,player,builds,buildsHave,discount,avaliableMoney) {
		if(!checkTurn(player)) return
        console.log("choose_build")
		console.log(player,pos,discount)
        console.log(builds)
		GAME.chooseBuild(pos,builds,buildsHave,discount,avaliableMoney)
	})
    socket.on("server:ask_buyout", function (player,pos,price,originalPrice) {
		if(!checkTurn(player)) return
		console.log(player,pos,price,originalPrice)
		GAME.chooseBuyout(player,pos,price,originalPrice)
	})
    socket.on("server:pay", function (payer,receiver,amount) {
        console.log("pay")
		if(payer===receiver) return
		console.log(payer,receiver,amount)
		GAME.payMoney(payer,receiver,amount)
	})
    socket.on("server:build", function (pos,builds,player) {
        console.log("build")
		console.log(pos,builds,player)
		GAME.build(pos,builds,player)
	})
	socket.on("server:set_landowner", function (pos,player) {
        console.log("set_landowner")
		console.log(pos,player)
		GAME.setLandOwner(pos,player)
	})
	socket.on("server:update_toll", function (pos,toll,mul) {
        console.log("update_toll")
		console.log(pos,toll,mul)
		GAME.updateToll(pos,toll,mul)
	})
	socket.on("server:update_multipliers", function (changes) {
        console.log("update_multipliers")
		console.log(changes)
		GAME.updateMultipliers(changes)
	})
	socket.on("server:ask_loan", function (player,amount) {
		if(!checkTurn(player)) return
        console.log("ask_loan")
		console.log(player,amount)
		GAME.askLoan(amount)
	})
	socket.on("server:tile_selection", function (player,tiles,source) {
		if(!checkTurn(player)) return
        console.log("tile_selection")
		console.log(player,tiles,source)
		GAME.askTileSelection(tiles,source)
	})
	socket.on("server:update_money", function (player,money) {
        console.log("update_money")
		console.log(player,money)
		GAME.ui.updateMoney(player,money)
	})
	socket.on("server:update_olympic", function (pos) {
        console.log("update_olympic")
		console.log(pos)
		GAME.setOlympic(pos)
	})
	socket.on("server:obtain_card", function (player,name,level,type) {
        console.log("obtain_card")
		console.log(name,level,type)
		GAME.obtainCard(player,name,level,type)
	})
	socket.on("server:clear_buildings", function (positions) {
        console.log("clear_buildings")
		console.log(positions)
		GAME.scene.clearBuildings(positions)
	})
	socket.on("server:remove_building", function (pos,toremove) {
        console.log("remove_building")
		console.log(pos,toremove)
		GAME.scene.removeBuildings(pos,toremove)
	})
	socket.on("server:tile_status_effect", function (pos,name,dur) {
        console.log("tile_status_effect")
		console.log(pos,name,dur)
		GAME.scene.setTileStatusEffect(pos,name,dur)
	})
	socket.on("server:save_card", function (turn,name,level) {
        console.log("save_card")
		console.log(turn,name,level)
		GAME.ui.setSavedCard(turn,name,level)
	})
	socket.on("server:ask_toll_defence_card", function (turn,cardname,before,after) {
		if(!checkTurn(turn)) return
        console.log("ask_toll_defence_card")
		console.log(turn,cardname,before,after)
		GAME.ui.askTollDefenceCard(cardname,before,after)
	})

	socket.on("server:ask_attack_defence_card", function (turn,cardname,attackName) {
		if(!checkTurn(turn)) return
        console.log("ask_attack_defence_card")
		console.log(turn,cardname,attackName)
		GAME.ui.askAttackDefenceCard(cardname,attackName)
	})
	socket.on("server:ask_godhand_special", function (turn,canlift) {
		if(!checkTurn(turn)) return
        console.log("ask_godhand_special")
		console.log(turn,canlift)
		GAME.ui.showGodHandSpecial(canlift)
	})
	socket.on("server:ability", function (turn,name,itemName,desc,isblocked) {
        console.log("ability")
		console.log(turn,name,itemName,desc,isblocked)
		GAME.indicateAbility(turn,name,itemName,desc,isblocked)
	})
	
	socket.on("server:tile_state_update", function (change) {
        console.log("tile_state_update")
		console.log(change)
		GAME.scene.setTileState(change)
	})
	socket.on("server:monopoly_alert", function (player,type,pos) {
        console.log("monopoly_alert")
		console.log(player,type,pos)
		GAME.alertMonopoly(player,type,pos)
	})
	socket.on("server:bankrupt", function (player) {
        console.log("bankrupt")
		console.log(player)
		GAME.bankrupt(player)
	})
	socket.on("server:gameover_bankrupt", function (player) {
        console.log("gameover_monopoly")
		console.log(player)
		GAME.gameoverBankrupt(player)
	})
	socket.on("server:gameover_monopoly", function (player,monopoly) {
        console.log("gameover_monopoly")
		console.log(player,monopoly)
		GAME.gameoverMonopoly(player,monopoly)
	})

	GAME.connection.clickDice=function(gage,oddeven){
		socket.emit(PREFIX+"press_dice",GAME.myTurn,gage,oddeven)
	}

    GAME.connection.gameReady=function(){
        console.log("start_game")
        socket.emit(PREFIX+"start_game")
    }

    GAME.connection.requestsetting = function () {
		socket.emit(PREFIX+"request_setting")
	}
	GAME.connection.chooseBuild=function(builds){
		console.log("choosebuild")
		console.log(builds)
		socket.emit(PREFIX+"select_build",GAME.myTurn,builds)
	}
	GAME.connection.chooseBuyout=function(result){
		socket.emit(PREFIX+"select_buyout",GAME.myTurn,result)
	}
	GAME.connection.chooseLoan=function(result){
		socket.emit(PREFIX+"select_loan",GAME.myTurn,result)
	}
	GAME.connection.onTileSelect=function(pos,type,result){
		socket.emit(PREFIX+"select_tile",GAME.myTurn,pos,type,result)
	}
	GAME.connection.finishObtainCard=function(result){
		socket.emit(PREFIX+"obtain_card",GAME.myTurn,result)
	}
	GAME.connection.finishConfirm=function(result,cardname){
		socket.emit(PREFIX+"confirm_card_use",GAME.myTurn,result,cardname)
	}
	GAME.connection.selectGodHandSpecial=function(result){
		socket.emit(PREFIX+"select_godhand_special",GAME.myTurn,result)
	}
}