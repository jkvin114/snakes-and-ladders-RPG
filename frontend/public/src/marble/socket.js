import { debugActionStack } from "./debug_interface.js"
import { GAME, SOLOPLAY, server_url } from "./marble.js"
export class Socket {
	constructor() {
		this.requestSetting
		this.gameReady
		this.clickDice
		this.chooseBuild
		this.chooseBuyout
	}
}
const PREFIX = "marble:user:"
function checkTurn(turn) {
	if (SOLOPLAY) {
		GAME.ui.setTurnIndicator(turn)
		return true
	}
	return GAME.myTurn === turn
}
export function openConnection(isInitial) {
	const socket = io(server_url, {
		autoConnect: true,
		withCredentials: true,
		query: { type: "marblegame" },
	})
	GAME.connection = new Socket()
	let connectionTimeout = null
	const RNAME = sessionStorage.roomName
	console.log("open connection")
	socket.on("connect", function () {
		console.log("game" + isInitial)
		// connectionChecker()
		if (isInitial && !GAME.begun) {
			console.log("game" + isInitial)
			GAME.connection.requestsetting()
			$("#loadingtext").html("REQUESTING GAME DATA..")
		} else if (GAME.begun) {
			console.log("reconnect" + RNAME)
			socket.emit("user:reconnect")
		}
	})
	socket.on("server:initialsetting", function (setting, num, turn) {
		console.log("initialsetting")
		GAME.init(setting, num, turn)
	})

	socket.on("server:nextturn", function (turn) {
		GAME.turnStart(turn)
	})
	socket.on("server:message", function (turn, msg) {
		if (!checkTurn(turn)) return
		GAME.showMessage(msg.val)
	})
	socket.on("server:indicate_defence", function (turn, data) {
		GAME.scene.showDefenceIndicator(data.type, data.pos)
	})
	socket.on("server:show_dice", function (turn, data) {
		if (!checkTurn(turn)) return
		GAME.showDiceBtn(turn, data)
		console.log(data)
	})
	socket.on("server:throwdice", function (turn, data) {
		console.log(turn, data)
		GAME.diceRoll(turn, data)
	})
	socket.on("server:walk_move", function (player, data) {
		console.log(data)
		GAME.playerWalkMove(player, data.from, data.distance, data.movetype)
	})
	socket.on("server:teleport", function (player, data) {
		console.log(data)
		GAME.playerTeleport(player, data.pos, data.movetype)
	})
	socket.on("server:pull", function (turn, data) {
		// console.log("pull")
		console.log(data)
		GAME.scene.indicatePull(data.tiles)
	})
	socket.on("server:buyout", function () {
		console.log("buyout")
		GAME.playsound("buyout")
	})
	socket.on("server:player_effect", function (turn, data) {
		console.log("player_effect")
		console.log(data)
		GAME.playerEffect(turn, data.effect, data.pos, data.status)
	})
	socket.on("server:choose_build", function (player, data) {
		if (!checkTurn(player)) return
		console.log("choose_build")
		GAME.chooseBuild(data.pos, data.builds, data.buildsHave, data.discount, data.avaliableMoney)
	})
	socket.on("server:ask_buyout", function (player, data) {
		if (!checkTurn(player)) return
		console.log(data)
		GAME.chooseBuyout(player, data.pos, data.price, data.originalPrice)
	})
	socket.on("server:ask_island", function (turn, data) {
		if (!checkTurn(turn)) return

		GAME.ui.askIsland(turn, data.canEscape, data.escapePrice)
	})
	socket.on("server:pay", function (turn, data) {
		console.log("pay")
		if (data.payer === data.receiver) return
		GAME.payMoney(data.payer, data.receiver, data.amount, data.type)
	})
	socket.on("server:build", function (player, data) {
		console.log("build")
		GAME.build(data.pos, data.builds, player)
	})
	socket.on("server:set_landowner", function (player, data) {
		console.log("set_landowner")
		GAME.setLandOwner(data.val, player)
	})

	socket.on("server:update_toll", function (turn, data) {
		console.log("update_toll")
		GAME.updateToll(data.pos, data.toll, data.mul)
	})
	socket.on("server:update_multipliers", function (turn, data) {
		console.log("update_multipliers")
		console.log(data)
		GAME.updateMultipliers(data)
	})
	socket.on("server:ask_loan", function (player, amount) {
		if (!checkTurn(player)) return
		console.log("ask_loan")
		GAME.askLoan(amount.val)
	})
	socket.on("server:tile_selection", function (player, data) {
		if (!checkTurn(player)) return
		console.log("tile_selection")
		console.log(data)
		GAME.askTileSelection(data.tiles, data.source)
	})
	socket.on("server:update_money", function (player, money) {
		console.log("update_money")
		GAME.ui.updateMoney(player, money.val)
	})
	socket.on("server:update_olympic", function (turn, pos) {
		console.log("update_olympic")
		console.log(pos)
		GAME.setOlympic(pos.val)
	})
	socket.on("server:obtain_card", function (player, data) {
		console.log("obtain_card")
		console.log(data)
		checkTurn(player)
		GAME.obtainCard(player, data.cardName, data.cardLevel, data.cardType)
	})
	socket.on("server:clear_buildings", function (turn, data) {
		console.log("clear_buildings")
		console.log(data)
		GAME.scene.clearBuildings(data.toremove)
	})
	socket.on("server:remove_building", function (turn, data) {
		console.log("remove_building")
		console.log(data)
		GAME.scene.removeBuildings(data.pos, data.toremove)
	})
	socket.on("server:tile_status_effect", function (turn, data) {
		console.log("tile_status_effect")
		console.log(data)
		GAME.scene.setTileStatusEffect(data.pos, data.name, data.dur)
	})
	socket.on("server:save_card", function (turn, data) {
		console.log("save_card")
		console.log(data)
		GAME.ui.setSavedCard(turn, data.name, data.level)
	})

	socket.on("server:ask_toll_defence_card", function (turn, data) {
		if (!checkTurn(turn)) return
		console.log("ask_toll_defence_card")
		console.log(data)
		GAME.ui.askTollDefenceCard(data.cardname, data.before, data.after)
	})

	socket.on("server:ask_attack_defence_card", function (turn, data) {
		if (!checkTurn(turn)) return
		console.log("ask_attack_defence_card")
		console.log(data)
		GAME.ui.askAttackDefenceCard(data.cardname, data.attackName)
	})
	socket.on("server:ask_godhand_special", function (turn, canlift) {
		if (!checkTurn(turn)) return
		console.log("ask_godhand_special")
		console.log(turn, canlift)
		GAME.ui.showGodHandSpecial(canlift.canLiftTile)
	})
	socket.on("server:ability", function (turn, data) {
		console.log("ability")
		console.log(data)
		GAME.indicateAbility(turn, data.name, data.itemName, data.desc, data.isblocked)
	})
	socket.on("server:blackhole", function (turn, data) {
		console.log("blackhole")
		console.log(data)
		GAME.scene.setBlackhole(data.blackpos, data.whitepos)
	})
	socket.on("server:remove_blackhole", function () {
		GAME.scene.removeBlackHole()
	})
	socket.on("server:modify_land", function (turn, data) {
		console.log("modify_land")
		console.log(data)
		GAME.scene.modifyLand(data.pos, data.type, data.val)
	})
	socket.on("server:tile_state_update", function (turn, change) {
		console.log("tile_state_update")
		console.log(change)
		GAME.scene.setTileState(change)
	})
	socket.on("server:monopoly_alert", function (player, data) {
		console.log("monopoly_alert")
		console.log(data)
		GAME.alertMonopoly(player, data.type, data.pos)
	})
	socket.on("server:bankrupt", function (player) {
		console.log("bankrupt")
		console.log(player)
		GAME.bankrupt(player)
	})
	socket.on("server:gameover_bankrupt", function (player, data) {
		console.log("gameover_monopoly")
		console.log(player)
		GAME.gameoverBankrupt(player, data.scores, data.mul)
	})
	socket.on("server:gameover_monopoly", function (player, data) {
		console.log("gameover_monopoly")
		console.log(data)
		GAME.gameoverMonopoly(player, data.monopoly, data.scores, data.mul)
	})

	socket.on("server:debug_stack", function (turn, stack) {
		debugActionStack(stack.stack)
	})

	GAME.connection.clickDice = function (gage, oddeven) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "press_dice", GAME.myTurn, gage, oddeven)
	}

	GAME.connection.gameReady = function () {
		console.log("start_game")
		socket.emit(PREFIX + "start_game")
	}

	GAME.connection.requestsetting = function () {
		socket.emit(PREFIX + "request_setting")
	}
	GAME.connection.chooseBuild = function (builds) {
		// console.log("choosebuild")
		// console.log(builds)
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "select_build", GAME.myTurn, builds)
	}
	GAME.connection.chooseBuyout = function (result) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "select_buyout", GAME.myTurn, result)
	}
	GAME.connection.chooseLoan = function (result) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "select_loan", GAME.myTurn, result)
	}
	GAME.connection.onTileSelect = function (pos, type, result) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "select_tile", GAME.myTurn, pos, type, result)
	}
	GAME.connection.finishObtainCard = function (result) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "obtain_card", GAME.myTurn, result)
	}
	GAME.connection.finishConfirm = function (result, cardname) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "confirm_card_use", GAME.myTurn, result, cardname)
	}
	GAME.connection.selectGodHandSpecial = function (result) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "select_godhand_special", GAME.myTurn, result)
	}
	GAME.connection.islandChooseComplete = function (isescape) {
		GAME.ui.resetTurnIndicator()
		socket.emit(PREFIX + "select_island", GAME.myTurn, isescape)
	}
}
