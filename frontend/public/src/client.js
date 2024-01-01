const ip = "http://" + sessionStorage.ip_address
var socket
console.log(ip)
let rname = sessionStorage.roomName
socket_connected = false

function connectSocket() {
	socket = io()

	socket.on("connect", function () {
		console.log("connect")
		socket_connected = true

		//only make it visible if this is host
		// $("#Hostingpage.pending").css("visibility", "visible")

		// $("#individual").attr("disabled", false)
		// $("#individual").removeClass("disabled")

		// $("#connection").html("")

		let param = new URLSearchParams(window.location.search)
		if (param.get("join") !== "true") {
			ServerConnection.makeroom()
			MATCH.ui.revealContent()
			MATCH.addAI(1)
		} else {
			let roomname = param.get("roomname")
			$("#rname").html("Room name: " + roomname)
			ServerConnection.register(roomname)
			MATCH.setAsGuest()
		}
	})

	// socket.on("server:create_room", function (roomname) {})
	socket.on("server:to_gamepage", () => {
		window.onbeforeunload = function () {}
		window.location.href = "gamepage.html"
	})
	socket.on("server:to_marble_gamepage", () => {
		window.onbeforeunload = function () {}
		window.location.href = "/marble/gamepage.html"
	})
	socket.on("server:go_teampage", () => {
		MATCH.teamSelector.showTeamPage(true)
	})
	socket.on("server:exit_teampage", () => {
		MATCH.teamSelector.hideTeamPage()
	})
	//for teamselection
	socket.on("server:player_names", (names) => {
		MATCH.teamSelector.setNameAndCharacters(names)
	})
	// socket.on("server:create_room", function (roomName) {
	// 	sessionStorage.roomName = roomName
	// })
	/**
	 * 방장전용
	 * 방이름 존재시 호출
	 */
	socket.on("server:room_name_exist", function (roomName) {
		window.alert("That room name already exists")
		window.onbeforeunload = () => {}

		window.location.href = "/"
	})
	/**
	 * 게스트전용
	 * 방에 참가 완료시 호출
	 */
	socket.on("server:guest_join_room", function (roomname, turn, playerlist) {
		$("#Hostingpage").css("visibility", "visible")
		$(".champchoice").show()
		MATCH.ui.revealContent()
		MATCH.onJoinRoom(roomname)
		rname = roomname

		MATCH.onGuestRegister(turn, playerlist)
		// socket.emit("user:guest_request_status")
		//다음 클라이언트에 연결시 감지할 수 있게함
		// sessionStorage.status = "hosting"
	})

	//team checkbox
	socket.on("server:teams", function (check_status) {
		MATCH.teamSelector.setCheckBox(check_status)
	})

	/**
	 * 게스트 전용
	 * 방장이 킥할시 호출
	 */
	socket.on("server:kick_player", function (turn) {
		MATCH.onKick(turn)
	})

	socket.on("server:update_playerlist", (playerlist) => MATCH.updatePlayerList(playerlist))
	socket.on("server:update_champ", (turn, champ) => {
		console.log(turn, champ)
		MATCH.ui.updateOneCharacter(turn, champ)
	})
	/**
	 * 게스트 전용
	 * requestcard 완료시 호출
	 */
	// socket.on("server:guest_register", (turn, playerlist) => {
	// 	MATCH.onGuestRegister(turn, playerlist)
	// })
	// socket.on('setai',(aiturn)=>setAiTeamselection(aiturn))
	socket.on("server:map", (map) => MATCH.onReceiveMap(map))

	socket.on("server:update_ready", (turn, ready) => MATCH.onReceiveReady(turn, ready))
	/**
	 * 방장이 방 없에면 호출
	 */
	socket.on("server:quit", function () {
		window.onbeforeunload = () => {}
		window.location.href = "/"
	})
	socket.on("server:unavaliable_room", function () {
		alert("The room is unavaliable!")
		window.onbeforeunload = () => {}
		window.location.href = "index.html"
	})
}

class ServerConnection {
	static resetGame = function () {
		socket.emit("user:reset_game", "") //alert(sessionStorage.host)
	}
	static makeroom = function () {
		socket.emit("user:host_create_room")
	}

	static register = function (rname) {
		socket.emit("user:guest_request_register", rname)
	}
	static sendPlayerList = function (list) {
		console.log("sendplayerlist")
		socket.emit("user:update_playerlist", list)
	}
	static kickPlayer = function (turn) {
		socket.emit("user:kick_player", Number(turn))
	}
	// static guestQuit = function () {
	// 	socket.emit("user:guest_quit")
	// }

	static requestNamesForTeamSelection = function () {
		socket.emit("user:request_names")
	}
	static showTeamToGuest = function () {
		socket.emit("user:go_teampage")
	}
	static hideTeamToGuest = function () {
		socket.emit("user:exit_teampage")
	}
	static sendCheckBoxToServer = function (check_status) {
		console.log("checkboc" + check_status)
		socket.emit("user:update_team", check_status)
	}
	static changeChamp = function (turn, champ) {
		console.log(turn, champ)
		socket.emit("user:update_champ", turn, champ)
	}
	static setMap = function (map) {
		socket.emit("user:update_map", map)
	}
	static sendReady = function (turn, ready) {
		socket.emit("user:update_ready", turn, ready)
	}
	static finalSubmit = function (setting, gametype) {
		window.onbeforeunload = () => {}
		if (gametype === "rpg") {
			socket.emit("user:gameready", setting)

			window.location.href = "gamepage.html"
		} else if (gametype === "marble") {
			socket.emit("marble:user:gameready", setting)
			window.location.href = "/marble/gamepage.html"
		}
	}
}
