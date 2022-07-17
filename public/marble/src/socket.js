import { GAME } from "./marble.js"
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
    socket.on("server:nextturn", function (turn,data) {
		GAME.showDiceBtn(turn,data)
		console.log(data)
	})
    socket.on("server:throwdice", function (turn,data) {
        console.log("throwdice")
		console.log(turn,data)
		GAME.diceRoll(data)
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
    socket.on("server:choose_build", function (pos,player,builds,buildsHave,discount,avaliableMoney) {
        console.log("choose_build")
		console.log(player,pos,discount)
        console.log(builds)
		GAME.chooseBuild(pos,builds,buildsHave,discount,avaliableMoney)
	})
    socket.on("server:ask_buyout", function (player,pos,price,originalPrice) {
		console.log(player,pos,price,originalPrice)
		GAME.chooseBuyout(player,pos,price,originalPrice)
	})
    socket.on("server:pay", function (payer,receiver,amount) {
        console.log("pay")
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
        console.log("ask_loan")
		console.log(player,amount)
		GAME.askLoan(amount)
	})
	
	socket.on("server:update_money", function (player,money) {
        console.log("update_money")
		console.log(player,money)
		GAME.ui.updateMoney(player,money)
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
		socket.emit(PREFIX+"select_build",GAME.myTurn,builds)
	}
	GAME.connection.chooseBuyout=function(result){
		socket.emit(PREFIX+"select_buyout",GAME.myTurn,result)
	}
	GAME.connection.chooseLoan=function(result){
		socket.emit(PREFIX+"select_loan",GAME.myTurn,result)
	}
}