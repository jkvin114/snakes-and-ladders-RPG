sessionStorage.status = null
var MATCH = null
const RANDOM_CHAR_DIR = "res/img/ui/random.png"

const chooseLang = function (eng, kor) {
	if (sessionStorage.language === "kor") return kor
	return eng
}

class PlayerType {
	static SIM_AI = "sim_ai"
	static PLAYER_CONNECTED = "player_connected"
	static PLAYER = "player"
	static AI = "ai"
	static NONE = "none"
}
function onReceiveCharacters(request) {
	let characters = JSON.parse(request.responseText).characters
	MATCH.characterSetting = characters
	$(".champmenu").html(`<img class="champmenu_item" src="${RANDOM_CHAR_DIR}"  value=-1>`)
	$("#character_selection").html(` <div class="champbtn_new random_champ" style="background-color: lightblue;" value=-1>
										<img src="${RANDOM_CHAR_DIR}">
										<div class="champbtn_name">Random</div>
									</div>`)

	for (let i = 0; i < characters.length; ++i) {
		let str = '<div class=champbtn_new style="background-color: '
		str += characters[i].bgcolor
		str += ';" value='
		str += String(i)
		str += '><img src="res/img/character/'
		str += characters[i].imgdir
		str += '"><div class="champbtn_name">'
		str += characters[i].name
		str += "</div></div>"

		$("#character_selection").append(str)

		$(".champmenu").append(
			`<img class="champmenu_item" src="res/img/character/${characters[i].imgdir}"  value=${String(i)}>`
		)
	}

	$(".champmenu img").click(function () {
		let champ = Number($(this).attr("value"))
		MATCH.ui.onAiCharacterSelect(champ)
	})

	$(".champbtn_new").click(function () {
		let champ = Number($(this).attr("value"))
		$(".champbtn_new").addClass("not_selected")
		$(".champbtn_new").removeClass("selected")
		$(this).removeClass("not_selected")
		$(this).addClass("selected")

		ServerConnection.changeChamp(Number(MATCH.myturn), champ)
		MATCH.selectCharacter(champ)
		console.log(champ)
	})
}

function onReceiveGameSetting(request) {
	let setting = JSON.parse(request.responseText)
	if (setting.gameplaySetting) {
		for (let key of Object.keys(setting.gameplaySetting)) {
			MATCH.setting.add(SettingType.GAMEPLAY, key, setting.gameplaySetting[key])
		}
	} else {
		$("#gameplay").hide()
	}
	for (let key of Object.keys(setting.statisticSetting)) {
		MATCH.setting.add(SettingType.STAT, key, setting.statisticSetting[key])
	}
	if (setting.matchSetting) {
		for (let key of Object.keys(setting.matchSetting)) {
			MATCH.setting.add(SettingType.MATCH, key, setting.matchSetting[key])
		}
	} else {
		$("#match").hide()
	}
	MATCH.setting.rangeSettingElements = $(".rangesetting").toArray()

	$(".setting_category input").click(function () {
		let idx = Number($(this).val())
		console.log(idx)

		MATCH.setting.toggleSettings[idx].toggle()
	})
	$(".setting_category .rangedown").click(function () {
		let idx = Number($(this).val())
		console.log(idx)
		if (MATCH.setting.rangeSettings[idx].down()) {
			$(this).attr("disabled", true)
			$(this).css("color", "gray")
		}
		$(MATCH.setting.rangeSettingElements[idx])
			.find(".rangevalue_wrapper .rangevalue")
			.html(MATCH.setting.rangeSettings[idx].getText())

		$(MATCH.setting.rangeSettingElements[idx]).children(".rangeup").attr("disabled", false).css("color", "white")
	})

	$(".setting_category .rangeup").click(function () {
		let idx = Number($(this).val())
		console.log(idx)

		if (MATCH.setting.rangeSettings[idx].up()) {
			$(this).attr("disabled", true)
			$(this).css("color", "gray")
		}
		$(MATCH.setting.rangeSettingElements[idx])
			.find(".rangevalue_wrapper .rangevalue")
			.html(MATCH.setting.rangeSettings[idx].getText())

		$(MATCH.setting.rangeSettingElements[idx]).children(".rangedown").attr("disabled", false).css("color", "white")
	})
	$(".toggleallstat").click(function () {
		if ($(this).prop("checked") == true) {
			for (let set of MATCH.setting.toggleSettings) {
				if (set.type == SettingType.STAT) set.state = true
			}
			$("#statistic .switch input").prop("checked", true)
		} else {
			for (let set of MATCH.setting.toggleSettings) {
				if (set.type == SettingType.STAT) set.state = false
			}
			$("#statistic .switch input").prop("checked", false)
		}
	})
}
function onReceiveRoomList(roomlist) {
	// let roomList = request.responseText
	roomlist = roomlist.split("||")
	console.log(roomlist)
	if (roomlist[0]==="") {
		
	} else {
		let text = ""
		for (let r of roomlist) {
			if (r !== "") {
				text += '<button class="room">' + r + "</button>"
			}
		}
		$("#roombtn").append(text)
		$(".room").click(function () {
			ServerConnection.register($(this).html())
			$("#room").hide()
			$("#rname").html("Room name: " + $(this).html())
		})
	}
}

class ProtoPlayer {
	constructor(turn) {
		this.type = "none"
		this.name = turn + 1 + "P"
		this.team = true
		this.champ = -1
		this.ready = false
	}
}

class MatchStatus {
	constructor() {
		this.playerlist = this.makePlayerList()
		this.ui = new MatchInterface(this)
		this.teamSelector = new TeamSelector(this)
		this.map = 0
		this.myturn = -1
		this.PNUM = 1
		this.CNUM = 0
		this.quitted = false
		this.ready = false
		this.setting = new SettingStorage()
		this.characterSetting = null
		if (MatchStatus._instance) {
			return MatchStatus._instance
		}
		MatchStatus._instance = this
	}

	makePlayerList() {
		let p = []
		for (let i = 0; i < 4; ++i) {
			p.push(new ProtoPlayer(i))
		}
		p[0].type = PlayerType.PLAYER_CONNECTED
		p[0].ready = true
		return p
	}

	setAsHost(roomname) {

		

		MATCH.playerlist[0].name = sessionStorage.nickName
		MATCH.myturn = 0
		let request = new XMLHttpRequest()
		request.open("GET", ip + "/resource/gamesetting")

		request.onload = () => onReceiveGameSetting(request)
		request.send()

		let request2 = new XMLHttpRequest()
		request2.open("GET", ip + "/resource/globalsetting")

		request2.onload = () => onReceiveCharacters(request2)
		request2.send()

		this.setMyTurn(0)

		this.ui.setAsHost(roomname)

		window.onbeforeunload = function () {
			$.ajax({
				method: 'POST',
				url: '/reset_game'
			})
			// ServerConnection.resetGame()
			MATCH.quitted = true
			return "The room will be reset"
		}
	}

	setAsGuest(roomlist) {
		// let request = new XMLHttpRequest()
		// request.open("GET", ip + "/room/")

		// request.onload = () => 
		// request.send()
		console.log(roomlist)
		onReceiveRoomList(roomlist)
		let request2 = new XMLHttpRequest()
		request2.open("GET", ip + "/resource/globalsetting")

		request2.onload = () => onReceiveCharacters(request2)
		request2.send()

		this.ui.setAsGuest()
		this.teamSelector.setAsGuest()

		window.onbeforeunload = function () {
			
			MATCH.setType("none", MATCH.myturn)
			MATCH.quitted = true
			ServerConnection.guestQuit()
			return true
		}
	}

	onJoinRoom(r) {

		

		sessionStorage.roomName = r
		$("#renew").hide()
		$("#roombtn").hide()
	}
	onKick(turn) {
		if (this.myturn === turn) {
			sessionStorage.status = null
			alert("You have been kicked!")
			window.onbeforeunload = () => {}
			window.location.href = "index.html"
		}
	}
	kickPlayer(v) {
		this.PNUM -= 1
		this.setType("none", v)
		$("#team").attr("disabled", true)
		// $(this.ui.playerkick[v - 1]).hide()
	}
	onGuestRegister(turn, playerlist) {
		console.log("server:registered" + turn)
		$("#Hostingpage").css("visibility", "visible")
		$("#readybtn").show()
		$(".mapbtn").attr("disabled", true)
	//	sessionStorage.turn = turn

		this.updatePlayerList(playerlist)
		this.setMyTurn(turn)
		ServerConnection.sendPlayerList(this.playerlist)
	}
	addAI(turn) {
		this.setType(PlayerType.AI, turn)
		this.CNUM += 1
		if (this.PNUM + this.CNUM === 4) {
			$("#team").attr("disabled", false)
		}
	}
	removeAI(turn) {
		this.CNUM -= 1
		this.setType(PlayerType.NONE, turn)
	}

	/**
	 * set my turn
	 * @param {} turn
	 */
	setMyTurn(turn) {
		this.myturn = turn
		$(".connected").removeClass("mycard")
		$(this.ui.playercard[turn]).addClass("mycard")
		if (this.myturn === 0) {
			return
		}
		console.log("myturn" + turn)

	//	sessionStorage.turn = this.myturn
		// card[turn] = PlayerType.PLAYER_CONNECTED
	}

	/**
	 * send type change to server
	 * @param {} type
	 * @param {*} turn
	 */
	setType(type, turn) {
		this.playerlist[turn].type = type
		console.log("setType" + this.playerlist[turn])
		//this.updatePlayerList(this.playerlist)
		ServerConnection.sendPlayerList(this.playerlist)
	}

	/**
	 * change player list of client
	 * @param {} players
	 * @param {*} turnchange
	 */
	updatePlayerList(players, turnchange) {
		
		if (this.quitted) {
			//window.onbeforeunload = () => {}
			window.location.href = "index.html"
		}
		if (!players) {
			return
		}
		if (turnchange && turnchange.indexOf(this.myturn) !== this.myturn) {
			// sessionStorage.turn = turnchange.indexOf(this.myturn)
			this.myturn = turnchange.indexOf(this.myturn)
		}
		this.setMyTurn(this.myturn)

		this.playerlist = players

		this.PNUM = this.playerlist.reduce(function (num, val) {
			if (val.type === PlayerType.PLAYER_CONNECTED) {
				num += 1
			}
			return num
		}, 0)

		//console.log("myturn"+this.myturn)
		//console.log(players)

		//card=cards
		// $(".kick_player").hide()

		for (let i = 0; i < this.playerlist.length; ++i) {
			$(this.ui.aicard[i]).addClass("hidden")
			$(this.ui.waitingcard[i]).addClass("hidden")
			$(this.ui.playercard[i]).addClass("hidden")
			$(this.ui.addai[i]).addClass("hidden")
			this.ui.updateOneCharacter(i, this.playerlist[i].champ)
		//	console.log(this.playerlist[i].type)
			switch (this.playerlist[i].type) {
				case PlayerType.SIM_AI:
					$(this.ui.playercard[i]).removeClass("hidden")
					break
				case PlayerType.PLAYER_CONNECTED:
					$(this.ui.playercard[i]).removeClass("hidden")
					$(this.ui.playercard[i]).children("p").html(this.playerlist[i].name)
					if (i > 0 && this.myturn === 0) {
						$(this.ui.playerkick[i - 1]).removeClass("hidden")
					}
					break
				case PlayerType.PLAYER:
					$(this.ui.waitingcard[i]).removeClass("hidden")
					break
				case PlayerType.AI:
					$(this.ui.aicard[i]).removeClass("hidden")
					break
				case PlayerType.NONE:
					if (this.myturn===0) {
						$(this.ui.addai[i]).removeClass("hidden")
					}
					break
			}
		}
	}

	/**
	 * 방장전용
	 * 모든플레이어 레디했는지 체크
	 */
	checkReady() {
		for (let i = 0; i < 4; ++i) {
			if (this.playerlist[i].type === PlayerType.PLAYER_CONNECTED && !this.playerlist[i].ready) {
				alert(i + 1 + "P is not ready")
				return false
			}
		}
		return true
	}
	onReceiveMap(map) {
		if (this.myturn !== 0 && sessionStorage.host !== "simulation") {
			$(".mapbtn").hide()
			$(this.ui.mapbtn[Number(map)]).show()
		}
	}
	onReceiveReady(turn, ready) {
		console.log(turn + "ready" + ready)
		this.playerlist[turn].ready = ready
	}
	selectCharacter(champ) {
		this.playerlist[Number(this.myturn)].champ = champ
	}

	startIndividual() {
		if (this.PNUM + this.CNUM < 2 || this.playerlist.some((c) => c.type === PlayerType.PLAYER)) {
			alert("Please check players")
		} else if (!this.checkReady()) {
			return
		} else {

			window.onbeforeunload = function () {}
			ServerConnection.finalSubmit(this.setting.getSummary())
		}
	}

	showTeamSelection() {
		if (this.playerlist.some((c) => c.type === "player")) {
			alert("Please check players")
		} else if (this.PNUM + this.CNUM < 4) {
			alert("there should be 4 players for team game")
		} else if (!this.checkReady()) {
			return
		} else {
			$("#Hostingpage").css("display", "none")
			ServerConnection.showTeamToGuest()
			this.teamSelector.showTeamPage(false)
			ServerConnection.requestNames()
		}
	}
}

class MatchInterface {
	constructor(match) {
		this.match = match

		this.switch_player = $(".toplayer").toArray()
		this.switch_ai = $(".toai").toArray()
		this.playercard = $(".connected").toArray()
		this.waitingcard = $(".waiting").toArray()
		this.playerkick = $(".kick_player").toArray()
		this.aicard = $(".aicard").toArray()
		this.addai = $(".addai").toArray()
		this.mapbtn = $(".mapbtn").toArray()
		this.aichamp = $(".aichamp").toArray()
		this.playerchamp = $(".playerchamp").toArray()

		this.aiCharacterListOwner = 0
		this.aiCharacterListShown = false

		if (MatchInterface._instance) {
			return MatchInterface._instance
		}
		MatchInterface._instance = this
	}

	setAsHost(roomname) {
		$("#Hostingpage").addClass("pending")
		$(".me p").html(sessionStorage.nickName)
		$("#rname").html("Room name: " + roomname)

		$(".mapbtn").click(function () {
			$(".mapbtn").removeClass("selected")
			$(".mapbtn").addClass("not_selected")

			$(this).removeClass("not_selected")
			$(this).addClass("selected")
			MATCH.map = Number($(this).attr("value"))
			ServerConnection.setMap(MATCH.map)
		})
	}
	setAsGuest() {
		$("#Hostingpage").css("visibility", "hidden")
		$(".aichamp").addClass("disabled")
		$("#room").show()
		$(".toplayer").hide()
		$(".toai").hide()
		$(".addai").hide()
		$(".kick_player").hide()
		$(".kick").hide()
		$(".mapbtn").hide()
		$("#individual").hide()
		$("#setting").hide()
		$("#map_choice a").hide()
		$(this.mapbtn[0]).show()
	}

	showAiCharacterList(turn, pos) {
		console.log(pos)
		$(".champmenu")
		.css(pos)
			.css({visibility: "visible" })
			.show()
		this.aiCharacterListOwner = turn
		let _this = this
		setTimeout(() => (_this.aiCharacterListShown = true), 100)
	}

	hideAiCharacterList() {
		if (this.aiCharacterListShown) {
			this.aiCharacterListOwner = 0
			this.aiCharacterListShown = false
			$(".champmenu").css("visibility", "hidden")
		}
	}
	onAiCharacterSelect(champ) {
		ServerConnection.changeChamp(this.aiCharacterListOwner, champ)
		this.match.playerlist[this.aiCharacterListOwner].champ = champ

		$(".champmenu").css("visibility", "hidden")
		this.aiCharacterListShown = false
		this.aiCharacterListOwner = 0
	}

	updateOneCharacter(turn, champ) {
		console.log(turn, champ)
		let src = champ < 0 ? "res/img/ui/random.png" : "res/img/character/" + this.match.characterSetting[champ].imgdir

		$(this.aichamp[turn]).attr("src", src)
		$(this.playerchamp[turn]).attr("src", src)
	}
}

class TeamSelector {
	constructor(match) {
		this.match = match
		this.redcheckbox = $(".teamchoice.red").toArray()
		this.bluecheckbox = $(".teamchoice.blue").toArray()
		this.container = $(".teamchoice").toArray()
		this.names = $(".name > a").toArray()
		this.champimgs = $(".teamchamp").toArray()
		this.redchecks = $(".redcheck").toArray()
		this.bluechecks = $(".bluecheck").toArray()
		this.check_status = [null, null, null, null]
		if (TeamSelector._instance) {
			return TeamSelector._instance
		}
		TeamSelector._instance = this
	}

	setAsGuest() {
		$("#team").hide()
		$("#submitTeam").hide()
		$("#back").hide()
	}

	showTeamPage(isforguest) {
		$("#Hostingpage").hide()
		if (isforguest && sessionStorage.host === "true") return
		$(this.names[this.match.myturn]).addClass("teamselection_me")

		//	window.onbeforeunload = function () {}
		$("#TeamSelectpage").show()
	}
	hideTeamPage() {
		$("#TeamSelectpage").hide()
	//	$(this.names[this.match.myturn]).addClass("teamselection_me")

		//	window.onbeforeunload = function () {}
		$("#Hostingpage").show()
	}
	canChange(i) {
		if (i !== this.match.myturn && this.match.playerlist[i].type !== "ai") {
			alert(chooseLang("You cannot change other player`s team", "다른 플레이어의 팀은 바꿀 수 없습니다"))
			return false
		}

		if (this.match.myturn!==0 && this.match.playerlist[i].type === "ai") {
			alert(chooseLang("Only a host can change computer`s team", "방장만 컴퓨터의 팀을 바꿀 수 있습니다"))

			return false
		}
		return true
	}

	setCheckBox(check) {
		this.check_status = check
		for (let i = 0; i < check.length; ++i) {
			if (check[i] === false) {
				$(this.bluecheckbox[i]).addClass("not_chosen")
				$(this.redcheckbox[i]).removeClass("not_chosen")
				$(this.bluechecks[i]).hide()
				$(this.redchecks[i]).show()
			} else if (check[i] === true) {
				$(this.redcheckbox[i]).addClass("not_chosen")
				$(this.bluecheckbox[i]).removeClass("not_chosen")
				$(this.bluechecks[i]).show()
				$(this.redchecks[i]).hide()
			}
		}
	}
	setNameAndCharacters(nicknames) {
		for (let i = 0; i < nicknames.length; ++i) {
			let c = this.match.playerlist[i].champ
			$(this.champimgs[i]).attr(
				"src",
				c < 0 ? RANDOM_CHAR_DIR : "res/img/character/" + this.match.characterSetting[c].imgdir
			)

			$(this.names[i]).html(nicknames[i])
		}
	}

	selectRed(turn) {
		if (!this.canChange(turn)) return
		this.check_status[turn] = false

		ServerConnection.sendCheckBoxToServer(this.check_status)
	}

	selectBlue(turn) {
		if (!this.canChange(turn)) return
		this.check_status[turn] = true

		ServerConnection.sendCheckBoxToServer(this.check_status)
	}

	submit() {
		if (this.match.myturn === 0) {
			if (this.check_status.some((c) => c === null)) {
				alert("Every player must select teams!!")
			} else if (this.check_status.every((c) => c) || this.check_status.every((c) => !c)) {
				alert("You must divide teams!!")
			} else {
				ServerConnection.finalSubmit(this.match.setting.getSummary())
			}
		}
	}
}

$(document).ready(function () {
	if(!sessionStorage.language){
		sessionStorage.language='kor'
	}

	$("#toggle_fullscreen").click(()=>{
		console.log($(this).data("on"))
		if(!$(this).data("on")){
		  
		  document.documentElement.requestFullscreen()
		  $(this).data("on",true)
		}
		else {
		  document.exitFullscreen()
		  $(this).data("on",false)
		}
	  })

	MATCH = new MatchStatus()


	$.ajax({
        method: 'POST',
        url: '/room/matching',
		data:{}
    })
    .done(function(data, statusText, xhr){
		let status = xhr.status;
		console.log(status)
		

		if(status===201){
			MATCH.setAsHost(data)
		}
		else if(status===200){
			MATCH.setAsGuest(data)
		}
		connectSocket()

    })
    .fail(function(data, statusText, xhr){
		console.log(data)
		console.log(xhr)
		console.log(statusText)

		if(data.status===401){
			alert(chooseLang("unauthorized","잘못된 접근입니다"))
        	window.location.href="index.html"
		}

		if(data.status===404){
			alert(chooseLang("There are no rooms to enter", "입장 가능한 방이 없습니다"))
			window.location.href = "index.html"
		}
      
    })


	$("#TeamSelectpage").hide()

	

	// console.log(sessionStorage.host)
	// if (!socket_connected) {
	// 	//$("#Hostingpage").css("visibility", "hidden")
	// }

	// if (sessionStorage.host === "true") {
		
	// }

	// if (sessionStorage.host === "false") {
		
	// }

	// if (sessionStorage.host === "simulation") {
	// 	$("#rname").html("시뮬레이션")
	// 	$("#simulation_input").show()
	// 	$(".champbtn").hide()
	// 	$(".toplayer").hide()
	// 	$("#instant").show()
	// }

	$("#quitbtn").click(function () {
		// $.ajax({
		// 	method: 'POST',
		// 	url: '/reset_game'
		// })
		
		// // ServerConnection.resetGame()
		 window.location.href = "index.html"
	})
	$("#readybtn").click(function () {
		if (MATCH.ready) {
			$(this).css("background-color", "darkgrey")
		} else {
			$(this).css("background-color", "#ff5656")
		}
		MATCH.ready = !MATCH.ready
		ServerConnection.sendReady(MATCH.myturn, MATCH.ready)
	})

	$(".addai").click(function () {
		//sessionStorage.status = "hosting"
		let v = Number($(this).attr("value"))
		MATCH.addAI(v)
	})
	$(".kick").click(function () {
		let v = Number($(this).attr("value"))

		MATCH.removeAI(v)
		$("#team").attr("disabled", true)
	})

	$(".kick_player").click(function () {
		let v = Number($(this).val())
		ServerConnection.kickPlayer(v)
		MATCH.kickPlayer(v)
	})

	if (!socket_connected) {
		$("#individual").attr("disabled", true)
	}
	$("#individual").click(function () {
		console.log("startgame")
		MATCH.startIndividual()
	})

	$("#instant").click(function () {
		return
		let num = Number($("#num").val())
		if (!num) {
			num = 0
		}
		num += 1

		// champlist.map(function(a){
		//   return !a ? 0:a
		//   })
		if (PNUM + CNUM < 2) {
			alert("Please check players")
		} else {
			window.onbeforeunload = function () {}
			ServerConnection.finalSubmit(this.setting.getSummary(), num)
		}
	})

	$(".aichamp")
		.not(".disabled")
		.click(function () {
			let turn = Number($(this).attr("value"))
			let pos = $(this).offset()
			MATCH.ui.showAiCharacterList(turn, pos)
		})

	$(document).click(function () {
		MATCH.ui.hideAiCharacterList()
	})

	$(".toplayer").click(function () {
		MATCH.CNUM -= 1
		MATCH.setType("player", $(this).attr("value"))
	})

	$(".toai").click(function () {
		MATCH.addAI($(this).attr("value"))
	})

	//teamselection ==========================================================================================

	// if (sessionStorage.host === "false") {
	// 	$("#team").hide()
	// 	$("#submitTeam").hide()
	// }

	$("#team").click(function () {
		console.log("startgame team")
		//sessionStorage.isTeamSelection = true
		MATCH.showTeamSelection()
	})

	// if(aiturn.length!==0) {setAI(aiturn)}

	$(".teamchoice.red").on("click", function () {
		let turn = Number($(this).attr("value"))
		MATCH.teamSelector.selectRed(turn)
	})
	$(".teamchoice.blue").on("click", function () {
		let turn = Number($(this).attr("value"))
		MATCH.teamSelector.selectBlue(turn)
	})

	$("#submitTeam").click(function () {
		MATCH.teamSelector.submit()
	})

	$("#submitTeamInstant").click(function () {
		let num = Number($("#num").val())
		if (!num) {
			num = 0
		}
		num += 1

		if (check_status.some((c) => c === null)) {
			alert("Every player must select teams!!")
		} else if (check_status.every((c) => c === 0) || check_status.every((c) => c === 1)) {
			alert("You must divide teams!!")
		} else {
			finalSubmit(this.setting.getSummary(), num)
		}
	})

	$("#settingclose").click(function () {
		$("#settingpage").hide()
		// console.log(MATCH.setting.getSummary())
	})
	$("#setting").click(function () {
		$("#settingpage").show()
	})
	$("#settingpage").hide()

	$("#back").click(function () {
		ServerConnection.hideTeamToGuest()
		$("#TeamSelectpage").hide()
		$("#Hostingpage").show()
	})
})

// 게스트 표시(방장만)
// function showGuest(turn){

//   if(sessionStorage.turn==="0"){
//     addplayer(turn)
//     $(playerkick[turn-1]).show()
//   }

// }
// function addplayer(i){
//   PNUM+=1
//   setType('player_connected',i)

//   if(PNUM+CNUM===4){
//     $("#team").attr("disabled",false)
//   }
// }
