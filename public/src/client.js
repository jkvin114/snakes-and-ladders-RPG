const ip = "http://" + sessionStorage.ip_address
var socket 
console.log(ip)
let rname = sessionStorage.roomName
socket_connected = false

function connectSocket(){
	socket= io(ip)

	socket.on("connect", function () {
		console.log("connect")
		socket_connected = true
		// if (sessionStorage.turn === "0" && sessionStorage.host === "true") {
		// 	console.log("create")
		// 	$("#Hostingpage").css("visibility","visible")
		// 	ServerConnection.makeroom(sessionStorage.roomName, sessionStorage.nickName, false)
		// }
		// if (sessionStorage.host === "simulation") {
		// 	console.log("create simulation")
		// 	$("#Hostingpage").css("visibility","visible")
		// 	ServerConnection.makeroom(sessionStorage.roomName, "host", true)
		// }

		// $("#Hostingpage").css("visibility","visible")

		//only make it visible if this is host
		$("#Hostingpage.pending").css("visibility","visible")

		$("#individual").attr("disabled", false)
		$("#individual").removeClass("disabled")
		
		$("#connection").html("")
		ServerConnection.makeroom()
	})


	socket.on('server:create_room',function(roomname){

	})
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
	socket.on("server:create_room", function (roomName) {
		sessionStorage.roomName = roomName
	})
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
	socket.on("server:join_room", function (roomname) {
		$("#Hostingpage").css("visibility","visible")
		$(".champchoice").show()
		MATCH.onJoinRoom(roomname)
		rname=roomname
	
		socket.emit("user:request_players")
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
	
	socket.on("server:update_playerlist", (playerlist, turnchange) => MATCH.updatePlayerList(playerlist, turnchange))
	socket.on("server:update_champ",(turn,champ)=>{
		console.log(turn,champ)
		MATCH.ui.updateOneCharacter(turn,champ)
	})
	/**
	 * 게스트 전용
	 * requestcard 완료시 호출
	 */
	socket.on("server:guest_register", (turn, playerlist) => {
		MATCH.onGuestRegister(turn,playerlist)
	})
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
	socket.on("server:room_full", function () {
		alert("The room is full!")
		window.onbeforeunload = () => {}
		window.location.href = "index.html"
	})
	
	

}



class ServerConnection{


	static resetGame=function() {
		socket.emit("user:reset_game", "") //alert(sessionStorage.host)
	}
	static makeroom=function() {
		socket.emit("user:host_connect")
	}
	
	static register=function(rname) {
		socket.emit("user:register", rname)
	}
	static sendPlayerList=function(list) {
		console.log("sendplayerlist")
		socket.emit("user:update_playerlist", list)
	}
	static kickPlayer=function(turn) {
		socket.emit("user:kick_player",Number(turn))
	}
	static guestQuit=function() {
		socket.emit("user:guest_quit")
	}

	static requestNames=function() {
		socket.emit("user:request_names")
	}
	static showTeamToGuest=function() {
		socket.emit("user:go_teampage")
	}
	static hideTeamToGuest=function() {
		socket.emit("user:exit_teampage")
	}
	static sendCheckBoxToServer=function(check_status) {
		console.log("checkboc" + check_status)
		socket.emit("user:update_team", check_status)
	}
	static changeChamp=function(turn, champ) {
		console.log(turn,champ)
		socket.emit("user:update_champ", turn, champ)
	}
	static setMap=function(map) {
		socket.emit("user:update_map", map)
	}
	static sendReady=function(turn,ready) {
		socket.emit("user:update_ready",turn, ready)
	}
	static finalSubmit=function(setting,gametype) {
		window.onbeforeunload = () => {}
		if(gametype==='rpg'){
			socket.emit("user:gameready",setting)

			window.location.href = "gamepage.html"
		}
		else if(gametype==='marble'){
			socket.emit("marble:user:gameready")

			window.location.href = "/marble/gamepage.html"
		}
		
		
	}
	
}

