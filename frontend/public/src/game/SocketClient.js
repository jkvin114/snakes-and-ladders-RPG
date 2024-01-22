const CONNECTION_TIMEOUT = 2000
import { GAME, server_url, CONNECTION_TYPE } from "./GameMain.js"
// import { calculatePrize,randomObs } from "./roulette.js"
export class GameClient {
	constructor() {
		this.requestsetting
		// this.startSimulation
		this.setupComplete
		this.pressDice
		this.checkObstacle
		this.obsComplete
		this.goNextTurn
		this.getSkill
		this.basicAttack
		this.sendTarget
		this.sendTileLocation
		this.resetGame
		this.sendGodHandInfo
		this.sendStoreData
		this.sendMessageToServer
		this.sendSubmarineDest
		this.reloadGame
		this.turnRoullete
		this.roulleteComplete
		this.selectionComplete
		this.sellTokenComplete
		this.extendTimeout
	}
}

export function openConnection(isInitial) {
	console.log("openconnection")
	const socket = io(server_url, {
		autoConnect: true,
		withCredentials: true,
		query: { type: CONNECTION_TYPE },
	})
	GAME.connection = new GameClient()
	let connectionTimeout = null
	// const RNAME = sessionStorage.roomName

	function connectionChecker() {
		connectionTimeout = setTimeout(GAME.onDisconnect.bind(GAME), CONNECTION_TIMEOUT)
		socket.emit("connection_checker")
	}

	socket.on("connection_checker", function () {
		//	console.log("connection checked"+RNAME)

		clearTimeout(connectionTimeout)
		connectionTimeout = setTimeout(connectionChecker, CONNECTION_TIMEOUT * 2)
	})

	socket.on("connect", function () {
		console.log("game" + isInitial)
		connectionChecker()
		if (isInitial && !GAME.begun) {
			console.log("game" + isInitial)
			GAME.connection.requestsetting()
			console.log("reqeust setting")
			$("#loadingtext").html("REQUESTING GAME DATA..")
		} else if (GAME.begun) {
			// console.log("reconnect" + RNAME)
			socket.emit("user:reconnect")
			console.log(GAME.scene.players)
		}
		GAME.connection.requestItemStatus()
	})

	socket.on("server:initialsetting", function (setting, turn, cturn) {
		console.log("initialsetting")
		GAME.init(setting, turn, cturn)
	})
	socket.on("server:item_status", function (items) {
		GAME.setItemStatus(items)
	})
	socket.on("server:nextturn", function (t) {
		if (t == null) return
		GAME.startTurn(t)
	})
	socket.on("server:prediction", function (data) {
		if (data == null) return
		GAME.ui.showPrediction(data.probs, data.diffs)
	})
	socket.on("server:rolldice", function (dice) {
		if (dice == null) return
		// console.log("rolldice")
		GAME.rollDice(dice)
	})
	// socket.on("server:hp", function (val) {
	// 	if (val == null) return
	// 	console.log("changehp" + val.showTrajectory + " " + val.willRevive + " " + val.turn)
	// 	GAME.scene.hpChanger.enqueueHpChange(val)
	// })

	socket.on("server:damage", function (val) {
		if (val == null) return
		GAME.animateDamage(val)

		// GAME.scene.hpChanger.enqueueHpChange(val)
	})

	socket.on("server:heal", function (val) {
		if (val == null) return
		GAME.animateHeal(val)
	})

	socket.on("server:shield", function (val) {
		if (val == null) return
		GAME.changeShield(val)
	})

	socket.on("server:money", function (val) {
		if (val == null) return
		// console.log("money", val)
		GAME.updateMoney(val)
	})
	socket.on("server:status_effect", function (val) {
		if (val == null) return

		GAME.giveEffect(val.effect, val.turn, val.num)
	})
	socket.on("server:special_effect", function (val) {
		if (val == null) return

		GAME.applySpecialEffect(val.turn, val.name, val.data, val.sourcePlayer)
	})
	socket.on("server:visual_effect", function (data) {
		if (data == null) return
		GAME.scene.showEffect(data.pos, data.type, 0, data.source)
	})
	// socket.on("server:obstacle_effect", function (data) {
	// 	if (data== null) return
	// 	GAME.scene.showEffect(data.pos, data.type,0,-1)
	// })
	socket.on("server:teleport_pos", function (val) {
		if (val == null) return
		GAME.teleportPlayer(val)
	})
	socket.on("server:smooth_teleport", function (val) {
		if (val == null) return
		//	console.log(val)
		GAME.smoothTeleport(val.turn, val.pos, val.distance)
	})
	socket.on("server:skills", function (status) {
		if (!GAME.ismyturn || status == null) {
			return
		}
		GAME.onSkillAvaliable(status)
	})
	socket.on("server:skill_data", function (result) {
		if (result == null || GAME.crypt_turn !== result.crypt_turn) return
		GAME.onReceiveTarget(result)
	})
	socket.on("server:used_skill", function (status) {
		if (status == null) return
		GAME.onSkillAvaliable(status)
	})

	socket.on("server:create_projectile", function (proj) {
		if (proj == null) return
		// console.log("create_projectile")
		// console.log(proj)
		GAME.scene.placeProj(proj)
	})

	socket.on("server:create_passprojectile", function (data) {
		if (data == null) return
		GAME.scene.placePassProj(data)
	})
	socket.on("server:create_entity", function (entity) {
		if (entity == null) return
		//		console.log(proj.UPID)
		GAME.scene.summonEntity(entity)
	})

	socket.on("server:delete_projectile", function (UPID) {
		if (UPID == null) return
		//	console.log("upid"+UPID)
		GAME.scene.destroyProj(UPID)
	})
	socket.on("server:delete_entity", function (UEID, isKilled) {
		if (UEID == null) return
		//	console.log("upid"+UEID+" "+isKilled)
		GAME.scene.removeEntity(UEID, isKilled)
	})
	socket.on("server:pending_obs:godhand", function (targets) {
		if (GAME.ismyturn || !targets) {
			GAME.onReceiveGodhandTarget(targets)
		}
	})

	socket.on("server:death", function (info) {
		if (info == null) return
		// GAME.scene.hpChanger.saveDieData(info)
		GAME.onPlayerDie(info.turn, info.location, info.killer, info.isShutDown, info.killerMultiKillCount, info.damages)
	})
	socket.on("server:attack", function (info) {
		if (info == null) return
		GAME.scene.showAttackEffect(info)
	})
	socket.on("server:skill_trajectory", function (info) {
		if (info == null) return
		GAME.scene.animateTrajectory(info.to, info.from, info.type, info.delay)
	})
	socket.on("server:area_effect", function (info) {
		if (info == null) return
		GAME.showAreaEffect(info)
	})
	socket.on("server:range_warn_hit", function (info) {
		if (info == null) return
		GAME.scene.onBeforeRangeWarnHit(info)
	})
	socket.on("server:respawn", function (data) {
		if (data.turn == null) return
		GAME.playerRespawn(data.turn, data.respawnPos, data.isRevived)
	})
	socket.on("server:store", function (info) {
		if (info == null) return
		GAME.arriveStore(info.turn, info.storeData)
	})
	socket.on("server:sync_player_visibility", function (data) {
		if (data == null) return
		GAME.syncPlayerVisibility(data)
	})

	socket.on("server:receive_message", function (source, msg) {
		if (msg == null) return
		GAME.receiveMessage(source, msg)
	})
	socket.on("reload_response", function (stun) {
		// $(dicebtn[0]).show()
	})

	socket.on("server:pending_obs:trial", function (num) {
		if (num == null) return

		GAME.spinRoullete("court", num)
	})
	socket.on("server:pending_obs:casino", function (num) {
		if (num == null) return
		GAME.spinRoullete("casino", num)
	})

	socket.on("server:pending_obs:kidnap", function () {
		if (!GAME.ismyturn || !GAME.ui) {
			return
		}
		GAME.ui.showSelection("obs", "kidnap")
	})

	socket.on("server:pending_obs:threaten", function () {
		if (!GAME.ismyturn || !GAME.ui) {
			return
		}
		GAME.ui.showSelection("obs", "threaten")
	})
	socket.on("server:pending_obs:sell_token", function (token) {
		if (!GAME.ismyturn || token == null) {
			return
		}
		GAME.storeStatus.onReceiveSellTokenData(token)
	})

	socket.on("server:pending_obs:subway", function (prices) {
		if (!GAME.ismyturn || prices == null || !GAME.ui) {
			return
		}
		GAME.ui.showSubwaySelection(prices)
	})

	socket.on("server:pending_action:ask_way2", function () {
		if (!GAME.ismyturn || !GAME.ui) {
			return
		}
		GAME.ui.showSelection("action", "ask_way2")
	})
	socket.on("server:pending_action:submarine", function (pos) {
		if (!GAME.ismyturn || pos == null) {
			return
		}
		GAME.showRangeTiles(pos, 16, 0, "submarine")
	})

	socket.on("server:turn_roullete", function () {
		if (!GAME.ismyturn) {
			//	calculatePrize()
		}
	})
	socket.on("server:update_other_data", function (data) {
		if (data.type == null) return
		///	console.log(data)
		GAME.onReceiveChangeData(data.type, data.turn, data.amt)
	})
	socket.on("server:update_skill_info_single", function (data) {
		if (GAME.myturn !== data.turn || data.turn == null || !GAME.ui) {
			return
		}
		// console.log(data.info_eng)
		GAME.ui.updateSkillInfoSingle(data.charId, data.skillId, data.toChange)
	})
	socket.on("server:update_skill_values", function (data) {
		// console.log(data)
		if (GAME.myturn !== data.turn || data.turn == null || !GAME.ui) {
			return
		}
		console.log(data.values)
		GAME.ui.updateSkillValues(data.values)
	})
	socket.on("server:start_timeout_countdown", function (crypt_turn, time) {
		if (GAME.crypt_turn !== crypt_turn || crypt_turn == null || !GAME.ui) {
			return
		}
		GAME.ui.timeoutStart(time)
	})
	socket.on("server:stop_timeout_countdown", function (crypt_turn) {
		if (GAME.crypt_turn !== crypt_turn || crypt_turn == null || !GAME.ui) {
			return
		}
		GAME.ui.timeoutStop()
	})

	socket.on("server:force_nextturn", function (crypt_turn) {
		if (GAME.crypt_turn !== crypt_turn || crypt_turn == null) {
			return
		}
		//alert("forcenextturn")
		GAME.hideEveryWindow()
	})

	socket.on("server:indicate_obstacle", function (data) {
		//	console.log("obs_notification"+turn)
		if (data.turn == null) {
			return
		}
		GAME.onIndicateObstacle(data)
	})
	socket.on("server:indicate_item", function (data) {
		if (!data) return
		GAME.onIndicateItem(data.turn, data.item)
	})
	socket.on("server:quit", function (quitter) {
		if (GAME.myturn === quitter) {
			return
		}
		//window.onbeforeunload = () => alert("someone left the GAME!")
		window.location.href = "/"
	})
	socket.on("server:gameover", function (winner) {
		console.log("gameover")
		GAME.onGameOver(winner)
	})
	socket.on("server:game_stat_ready", function (statid) {
		setTimeout(() => {
			window.onbeforeunload = () => {}
			if (statid === "" || GAME.is_spectator) window.location.href = "/"
			else window.location.href = "/stat?type=game&statid=" + statid
		}, 4000)
	})

	GAME.connection.requestsetting = function () {
		socket.emit("user:requestsetting")
	}
	GAME.connection.requestItemStatus = function () {
		socket.emit("user:request_item_status")
	}
	// GAME.connection.startSimulation = function () {
	// 	socket.emit("user:start_game", this.rname)
	// }
	GAME.connection.setupComplete = function () {
		socket.emit("user:start_game")
		socket.emit("user:reconnect")
	}
	GAME.connection.update = function (type, data) {
		socket.emit("user:update", type, data)
	}
	GAME.connection.sendChat = function (turn, text) {
		socket.emit("user:chat", turn, text)
	}
	GAME.connection.pressDice = function (dicenum) {
		socket.emit("user:press_dice", GAME.crypt_turn, dicenum)
	}
	GAME.connection.checkObstacle = function () {
		socket.emit("user:arrive_square")
	}
	GAME.connection.obsComplete = function () {
		socket.emit("user:obstacle_complete")
	}
	GAME.connection.goNextTurn = function () {
		socket.emit("user:nextturn", GAME.crypt_turn)
	}

	GAME.connection.getSkill = function (s) {
		// console.log("getskill " + s)
		socket.emit("user:get_skill_data", GAME.crypt_turn, s)
	}
	GAME.connection.basicAttack = function () {
		socket.emit("user:basicattack", GAME.crypt_turn)
	}
	GAME.connection.sendTarget = function (t) {
		//	console.log("target " + t)
		GAME.endSelection()
		socket.emit("user:chose_target", GAME.crypt_turn, t)
	}
	GAME.connection.sendTileLocation = function (location) {
		GAME.endSelection()
		socket.emit("user:chose_location", GAME.crypt_turn, location)
	}
	GAME.connection.sendAreaSkillLocation = function (location) {
		GAME.endSelection()
		socket.emit("user:chose_area_skill_location", GAME.crypt_turn, location)
	}
	GAME.connection.resetGame = function () {
		GAME.scene = null

		//socket.emit("user:reset_game")
		GAME = null
	}
	GAME.connection.sendGodHandInfo = function (info) {
		GAME.endSelection()
		socket.emit("user:complete_obstacle_selection", GAME.crypt_turn, info)
	}

	GAME.connection.sendStoreData = function (data) {
		socket.emit("user:store_data", data)
	}

	GAME.connection.sendSubmarineDest = function (data) {
		socket.emit("user:complete_action_selection", GAME.crypt_turn, data)
	}
	GAME.connection.sendSubwayType = function (data) {
		socket.emit("user:complete_obstacle_selection", GAME.crypt_turn, data)
	}

	GAME.connection.reloadGame = function () {
		socket.emit("user:reload_game")
	}
	GAME.connection.turnRoullete = function () {
		socket.emit("user:turn_roullete")
	}

	GAME.connection.roulleteComplete = function () {
		socket.emit("user:complete_obstacle_selection", GAME.crypt_turn, { type: "roullete", complete: true })
	}

	GAME.connection.selectionComplete = function (type, data) {
		if (type === "action") {
			socket.emit("user:complete_action_selection", GAME.crypt_turn, data)
		} else if (type === "obs") {
			socket.emit("user:complete_obstacle_selection", GAME.crypt_turn, data)
		}
	}

	GAME.connection.sellTokenComplete = function (data) {
		// console.log("onTokenSellComplete")

		socket.emit("user:complete_obstacle_selection", GAME.crypt_turn, data)
	}
	GAME.connection.extendTimeout = function () {
		socket.emit("user:extend_timeout")
	}
	GAME.connection.reconnect = function () {
		socket.emit("user:reconnect")
	}
}
