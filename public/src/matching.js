sessionStorage.status = null
var MATCH = null
const RANDOM_CHAR_DIR = "res/img/ui/random.png"

const chooseLang = function (eng, kor) {
	if (sessionStorage.language === "ko") return kor
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
	$("#character_selection").html(`<div class=champbtn_new value=-1>
		<div>
			<img src="${RANDOM_CHAR_DIR}"  style="background-color:white;" >
		</div>
		<div class="champbtn_name">Random</div>
	</div>`)
	let str = ""
	let str2 = ""
	for (let i = 0; i < characters.length; ++i) {
		str += `<div class=champbtn_new value=${String(i)}>
				<div>
					<img src="res/img/character/illust/${characters[i].illustdir}"" >
				</div>
				<div class="champbtn_name">${characters[i].name}</div>
			</div>`

		str2 += `<img class="champmenu_item" src="res/img/character/illust/${characters[i].illustdir}"  value=${String(i)}>`
	}
	$("#character_selection").append(str)
	$(".champmenu").append(str2)
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

		$(MATCH.setting.rangeSettingElements[idx])
			.children(".settingvalue")
			.children(".rangeup")
			.attr("disabled", false)
			.css("color", "white")
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

		$(MATCH.setting.rangeSettingElements[idx])
			.children(".settingvalue")
			.children(".rangedown")
			.attr("disabled", false)
			.css("color", "white")
	})
	$(".toggleallstat").click(function () {
		if ($(this).prop("checked")) {
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
	if (roomlist[0] === "") {
	} else {
		let text = ""
		for (let r of roomlist) {
			if (r !== "") {
				text += '<button class="room">' + r + "</button>"
			}
		}
		$("#roombtn").append(text)
		$(".room").click(function () {
			joinRoom($(this).html())
		})
	}
}

function joinRoom(roomname) {
	ServerConnection.register(roomname)
	$("#room").hide()
	$("#rname").html("Room name: " + roomname)
}

class ProtoPlayer {
	constructor(turn) {
		this.type = "none"
		this.name = turn + 1 + "P"
		this.team = true
		this.champ = -1
		this.ready = false
		this.userClass = 0
	}
}

class MatchStatus {
	constructor() {
		let param = new URLSearchParams(window.location.search)
		if (param.has("gametype")) {
			if (param.get("gametype") === "marble") this.gametype = param.get("gametype")
			else this.gametype = "rpg"
		} else this.gametype = "rpg"

		this.playerlist = this.makePlayerList()
		this.ui = new MatchInterface(this, this.gametype)
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
		this.playerlist[0].name = sessionStorage.nickName
		this.myturn = 0
		let request = new XMLHttpRequest()
		request.open("GET", "/resource/gamesetting")

		request.onload = () => onReceiveGameSetting(request)
		request.send()

		let request2 = new XMLHttpRequest()
		request2.open("GET", "/resource/globalsetting")

		request2.onload = () => onReceiveCharacters(request2)
		request2.send()

		this.setMyTurn(0)

		this.ui.setAsHost(roomname)

		// window.onbeforeunload =  () =>{
		// 	$.ajax({
		// 		method: 'POST',
		// 		url: '/reset_game'
		// 	})
		// 	// ServerConnection.resetGame()
		// 	this.quitted = true
		// 	return "The room will be reset"
		// }
	}

	setAsGuest() {
		// let request = new XMLHttpRequest()
		// request.open("GET", ip + "/room/")

		// request.onload = () =>
		// request.send()
		// console.log(roomlist)
		// onReceiveRoomList(roomlist)
		let request2 = new XMLHttpRequest()
		request2.open("GET", "/resource/globalsetting")

		request2.onload = () => onReceiveCharacters(request2)
		request2.send()

		this.ui.setAsGuest()
		this.teamSelector.setAsGuest()
	}

	onJoinRoom(r) {
		sessionStorage.roomName = r
		$("#renew").hide()
		$("#roombtn").hide()
	}
	onKick(turn) {
		if (this.myturn === turn) {
			sessionStorage.status = null
			alert(LOCALE.kick)
			ServerConnection.guestQuit()
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
		console.log("setType")
		console.log(this.playerlist)
		//this.updatePlayerList(this.playerlist)
		ServerConnection.sendPlayerList(this.playerlist)
	}

	/**
	 * change player list of client
	 * @param {} players
	 * @param {*} turnchange
	 */
	updatePlayerList(players) {
		if (this.quitted) {
			//window.onbeforeunload = () => {}
			window.location.href = "index.html"
		}
		if (!players) {
			return
		}
		// if (turnchange && turnchange.indexOf(this.myturn) !== this.myturn) {
		// 	// sessionStorage.turn = turnchange.indexOf(this.myturn)
		// 	this.myturn = turnchange.indexOf(this.myturn)
		// }
		this.setMyTurn(this.myturn)

		this.playerlist = players

		this.PNUM = this.playerlist.reduce(function (num, val) {
			if (val.type === PlayerType.PLAYER_CONNECTED) {
				num += 1
			}
			return num
		}, 0)

		//console.log("myturn"+this.myturn)
		console.log(players)

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
					console.log(this.playerlist[i].name)
					$(this.ui.playercard[i]).find(".iname").html(this.playerlist[i].name)
					if (this.playerlist[i].userClass === 1) {
						$(this.ui.playercard[i]).addClass("logined")
					} else {
						$(this.ui.playercard[i]).removeClass("logined")
					}

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
					if (this.myturn === 0) {
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
				alert(i + 1 + "P " + LOCALE.error.not_ready)
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
		this.playerlist[turn].ready = ready
		if (ready) $(this.ui.playercard[turn]).addClass("ready")
		else {
			$(this.ui.playercard[turn]).removeClass("ready")
		}
	}
	selectCharacter(champ) {
		this.playerlist[Number(this.myturn)].champ = champ
	}

	startIndividual() {
		if (this.PNUM + this.CNUM < 2) {
			alert(LOCALE.error.oneplayer)
		} else if (this.playerlist.some((c) => c.type === PlayerType.PLAYER)) {
			alert(LOCALE.error.players)
		} else if (!this.checkReady()) {
			return
		} else {
			window.onbeforeunload = function () {}
			if (this.gametype === "rpg") {
				ServerConnection.finalSubmit(this.setting.getSummary(), this.gametype)
			} else if (this.gametype === "marble") {
				ServerConnection.finalSubmit(
					{
						randomCount: Number($("#marble-item-random-count").val()),
						items: this.ui.marbleItemState,
					},
					this.gametype
				)
			}
			// ServerConnection.finalSubmit(this.setting.getSummary(),this.gametype)
		}
	}

	showTeamSelection() {
		if (this.playerlist.some((c) => c.type === "player")) {
			alert(LOCALE.error.players)
		} else if (this.PNUM + this.CNUM < 4) {
			alert(LOCALE.error.team_not_4)
		} else if (!this.checkReady()) {
			return
		} else {
			$("#Hostingpage").css("display", "none")
			ServerConnection.showTeamToGuest()
			this.teamSelector.showTeamPage(false)
			ServerConnection.requestNamesForTeamSelection()
		}
	}
	validateTeamSubmit() {
		if (this.playerlist.some((c) => c.type === "player")) {
			alert(LOCALE.error.players)
			return false
		} else if (this.PNUM + this.CNUM < 4) {
			alert(LOCALE.error.team_not_4)
			return false
		} else if (!this.checkReady()) {
			return false
		} else {
			return true
		}
	}
}

class MatchInterface {
	constructor(match, gametype) {
		this.match = match
		this.gametype = gametype
		if (this.gametype === "marble") this.setAsMarble()
		else $("#marble-item").hide()
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

		this.marbleItemState = []
		this.marbleItemPresets = []
		if (MatchInterface._instance) {
			return MatchInterface._instance
		}
		MatchInterface._instance = this
	}
	revealContent() {
		$("#Hostingpage.pending").css("visibility", "visible")

		$("#individual").attr("disabled", false)
		$("#individual").removeClass("disabled")

		$("#connection").html("")
	}

	setAsMarble() {
		$(".mapbtn").hide()
		$(".mapbtn-marble").show()
		$("#setting").hide()
		$("#team").hide()
		$(".mapbtn-marble").click(function () {
			MATCH.map = Number($(this).val())
			ServerConnection.setMap(MATCH.map)
		})
		$("#marble-item").show()
		fetch("/resource/marble_items").then((response) => {
			response.json().then((result) => {
				let str = ""
				for (const item of result) {
					this.marbleItemState.push({
						selected: false,
						locked: false,
						code: item.code,
					})
					let level = "common"
					if (item.cost > 1) level = "rare"
					if (item.cost > 3) level = "epic"
					if (item.cost >= 5) level = "legendary"
					if (item.cost > 7) level = "ancient"

					str += `
					<div id="marble-item-${item.code}" class="marble-item ${level}" data-cost=${item.cost} data-code=${item.code}>
						<div>
							<div class="marble-item-header">
								<div class='marble-item-name ${item.name.length > 7 ? "small" : ""}'>${item.name}</div>
								<div class="marble-item-status">
									<img src="res/img/ui/confirm.png" class="marble-item-select">
									<img src="res/img/ui/lock.png" class="marble-item-lock">
								</div>
							</div>
							<div class=marble-item-text>
								${item.desc}
							</div>
						</div>
					</div>`
				}
				$("#marble-item-page-content").html(str)

				$(".marble-item").click(function () {
					let code = $(this).data("code")
					let state = MATCH.ui.marbleItemState[code]
					if (!state.selected && !state.locked) {
						MATCH.ui.setMarbleItemStatus(code, 1)
					} else if (state.selected && !state.locked) {
						MATCH.ui.setMarbleItemStatus(code, 2)
					} else {
						MATCH.ui.setMarbleItemStatus(code, 0)
					}
				})
			})
		})

		fetch("/resource/marble_item_presets").then((response) => {
			response.json().then((result) => {
				let str = ""
				console.log(result)
				for (const [i, preset] of result.entries()) {
					let locked = preset.items.reduce((prev, curr) => (curr === 2 ? prev + 1 : prev))
					let selected = preset.items.reduce((prev, curr) => (curr === 1 ? prev + 1 : prev))

					this.marbleItemPresets.push(preset)
					str += `<option value="${i}">${preset.name}[고정:${locked},선택:${preset.randomCount}/${selected}]</option>`
				}
				$("#marble-item-preset").append(str)
				$("#marble-item-preset").change(function () {
					let index = $(this).val()

					MATCH.ui.onPresetChange(index)
				})
			})
		})

		$("#save-preset").click(() => {
			this.saveMarbleItemPreset()
		})
	}

	saveMarbleItemPreset() {
		let name = $("#save-preset-name").val()
		if (!name || name === "") return
		let items = []
		let randcount = Number($("#marble-item-random-count").val())

		if (this.marbleItemPresets.some((preset) => preset.name === name)) {
			alert("프리셋 이름 중복!")
			return
		}

		for (const item of this.marbleItemState) {
			if (item.selected) items.push(1)
			else if (item.locked) items.push(2)
			else items.push(0)
		}
		console.log(items)

		$.ajax({
			method: "POST",
			url: "/resource/marble_item_presets",
			data: {
				name: name,
				items: items,
				randcount: randcount,
			},
		})
	}
	onPresetChange(idx) {
		if (idx === "empty") {
			for (let i = 0; i < this.marbleItemState.length; ++i) {
				this.setMarbleItemStatus(i, 0)
			}
			return
		}
		let count = this.marbleItemPresets[idx].randomCount
		$("#marble-item-random-count").val(count)
		for (const [i, itemstatus] of this.marbleItemPresets[idx].items.entries()) {
			this.setMarbleItemStatus(i, itemstatus)
		}
	}
	/**
	 *
	 * @param {*} status 0:none, 1:selected, 2:locked
	 */
	setMarbleItemStatus(itemcode, status) {
		let state = this.marbleItemState[itemcode]
		let elem = $("#marble-item-" + itemcode)
		state.selected = false
		state.locked = false
		$("#marble-item-" + itemcode).removeClass("selected")
		$("#marble-item-" + itemcode).removeClass("locked")

		if (status === 1) {
			state.selected = true
			$("#marble-item-" + itemcode).addClass("selected")
		} else if (status === 2) {
			$("#marble-item-" + itemcode).addClass("locked")
			state.locked = true
		}
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
		// $("#map_choice a").hide()
		$(this.mapbtn[0]).show()
	}

	showAiCharacterList(turn, pos) {
		console.log(pos)
		$(".champmenu").css(pos).css({ visibility: "visible" }).show()
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
		let src =
			champ < 0 ? "res/img/ui/random.png" : "res/img/character/illust/" + this.match.characterSetting[champ].illustdir

		$(this.aichamp[turn]).attr("src", src)
		$(this.playerchamp[turn]).attr("src", src)
		this.match.playerlist[turn].champ = champ
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
	initButtons() {
		for (let i = 0; i < 4; ++i) {
			if (!this.canChange(i)) {
				$(this.redcheckbox[i]).addClass("disabled")
				$(this.bluecheckbox[i]).addClass("disabled")
			}
		}
	}

	setAsGuest() {
		$("#team").hide()
		$("#submitTeam").hide()
		$("#back").hide()
		// this.initButtons()
	}

	showTeamPage(isforguest) {
		$("#Hostingpage").hide()
		this.initButtons()
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
			//	alert(chooseLang("You cannot change other player`s team", "다른 플레이어의 팀은 바꿀 수 없습니다"))
			return false
		}

		if (this.match.myturn !== 0 && this.match.playerlist[i].type === "ai") {
			//	alert(chooseLang("Only a host can change computer`s team", "방장만 컴퓨터의 팀을 바꿀 수 있습니다"))

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
	setNameAndCharacters(playernames) {
		for (let i = 0; i < playernames.length; ++i) {
			let c = this.match.playerlist[i].champ
			$(this.champimgs[i]).attr(
				"src",
				c < 0 ? RANDOM_CHAR_DIR : "res/img/character/illust/" + this.match.characterSetting[c].illustdir
			)

			$(this.names[i]).html(playernames[i].name)
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
			if (!this.match.validateTeamSubmit()) return

			if (this.check_status.some((c) => c === null)) {
				alert(LOCALE.error.team_incomplete)
			} else if (this.check_status.every((c) => c) || this.check_status.every((c) => !c)) {
				alert(LOCALE.error.team_same)
			} else {
				if (this.match.gametype === "rpg") {
					ServerConnection.finalSubmit(this.match.setting.getSummary(), this.match.gametype)
				} else if (this.match.gametype === "marble") {
					ServerConnection.finalSubmit(
						{
							randomCount: Number($("#marble-item-random-count").val()),
							items: this.match.marbleItemState,
						},
						this.match.gametype
					)
				}
			}
		}
	}
}
function auth() {
	$.ajax({
		method: "POST",
		url: "/room/matching",
		data: {},
	})
		.done(function (data, statusText, xhr) {
			let status = xhr.status
			console.log(status)

			if (status === 200) {
				MATCH.setAsHost(data)
			}

			connectSocket()
		})
		.fail(function (data, statusText, xhr) {
			if (data.status == 307) {
				alert("You are already in a game")
				window.location.href = "index.html"
				return
			}
			if (data.status === 401) {
				alert("Invalid access!")
				window.location.href = "index.html"
			}

			// if (data.status === 404) {
			// 	alert(chooseLang("There are no rooms to enter", "입장 가능한 방이 없습니다"))
			// 	window.location.href = "index.html"
			// }
		})
}

$(document).ready(function () {
	if (!sessionStorage.language) {
		sessionStorage.language = "eng"
	}

	$("#toggle_fullscreen").click(() => {
		console.log($(this).data("on"))
		if (!$(this).data("on")) {
			document.documentElement.requestFullscreen()
			$(this).data("on", true)
		} else {
			document.exitFullscreen()
			$(this).data("on", false)
		}
	})

	MATCH = new MatchStatus()
	auth()
	updateLocale("matching")
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
			$(this).removeClass("active")
		} else {
			$(this).addClass("active")
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

	$(".aichamp").click(function () {
		if ($(this).hasClass("disabled")) return
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
			alert(LOCALE.error.team_not_4)
		} else if (check_status.every((c) => c === 0) || check_status.every((c) => c === 1)) {
			alert(LOCALE.error.team_same)
		} else {
			finalSubmit(this.setting.getSummary(), num)
		}
	})

	$("#settingclose").click(function () {
		$("#settingpage").hide()
		$("#overlay").hide()
		// console.log(MATCH.setting.getSummary())
	})
	$("#setting").click(function () {
		$("#settingpage").show()
		$("#overlay").show()
	})
	$("#settingpage").hide()
	$("#back").click(function () {
		ServerConnection.hideTeamToGuest()
		$("#TeamSelectpage").hide()
		$("#Hostingpage").show()
	})
	$("#marble-item-page").hide()
	// $("#marble-item").hide()

	$("#marble-item-close").click(function () {
		$("#marble-item-page").hide()
		$("#overlay").hide()
		// console.log(MATCH.setting.getSummary())
	})
	$("#marble-item").click(function () {
		$("#marble-item-page").show()
		$("#overlay").show()
	})
	// window.onbeforeunload = function () {
	// 	// this.setType("none", this.myturn)
	// 	// this.quitted = true
	// 	// ServerConnection.guestQuit()

	// 	return ""
	// }
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
