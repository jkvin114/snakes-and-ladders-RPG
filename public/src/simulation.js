var SETTING = null
var socket=null
const ip = "http://" + sessionStorage.ip_address

class Setting {
	constructor() {
		this.setting = new SettingStorage()
		this.isTeam = false
		this.characters = new Set()
		this.maps = new Set()
		this.lockedCharacters = new Set()
		this.teamLock = {
			red: new Set(),
			blue: new Set()
		}
		this.playercountSetting = {}
		this.teamSelecting = true
		if (Setting._instance) {
			return Setting._instance
		}
		Setting._instance = this
	}

	toggleTeam() {
		this.isTeam = !this.isTeam
		if (this.isTeam) {
			this.playercountSetting.setting.set(4)
			let idx = this.playercountSetting.index
			$(this.setting.rangeSettingElements[idx]).find(".rangevalue_wrapper .rangevalue").html("4")
			$(this.setting.rangeSettingElements[idx]).children(".rangeup").attr("disabled", true).css("color", "gray")
			$(this.setting.rangeSettingElements[idx]).children(".rangedown").attr("disabled", false).css("color", "white")

			$(".teamlockbtn").css("visibility", "visible")
		} else {
			$(".teamlockbtn").css("visibility", "hidden")

			for (let i = 0; i < $(".charbtnwrapper").length; ++i) {
				this.clearTeamLock(i)
			}
		}
	}
	clearTeamLock(num) {
		let charteams = $(".teamlock").toArray()

		this.teamLock.red.delete(num)
		this.teamLock.blue.delete(num)

		$(charteams[num]).removeClass("red")
		$(charteams[num]).removeClass("blue")
	}
	getTeamLock() {
		return [Array.from(this.teamLock.red), Array.from(this.teamLock.blue)]
	}
}

const chooseLang = function (eng, kor) {
	if (sessionStorage.language === "kor") return kor
	return eng
}
function allowDrop(ev) {
	if (ev.preventDefault) {
		ev.preventDefault()
	}
	return false
}
let draggingElement = null
function onDragStart(ev) {
	ev.target.parentElement.style.opacity = "0.4"
	console.log(ev.target)
	ev.dataTransfer.effectAllowed = "move"
	ev.dataTransfer.setData("text", ev.target.parentElement.id)
	draggingElement = ev.target
}
function onDragEnd(ev) {
	this.style.opacity = "1"
}
function onDrop(ev) {
	ev.preventDefault()
	ev.stopPropagation()
	let id = ev.dataTransfer.getData("text")
	let wrapper = document.getElementById(id)

	if (!wrapper || wrapper.className !== "mapbtnwrapper") return

	document.getElementById("map_pool").appendChild(wrapper)

	wrapper.innerHTML = draggingElement.outerHTML + "<button class='removemap_btn' value=" + id + ">&times;</button>"

	let items = document.querySelectorAll("#map_pool .mapbtnwrapper")
	items.forEach(function (item) {
		console.log(item)
		item.setAttribute("draggable", "false")
		item.style.opacity = "1.0"
	})
	ev.dataTransfer.setData("text", "")

	$(".removemap_btn").off()
	$(".removemap_btn").click(function () {
		let id = $(this).val()
		document.getElementById(id).outerHTML = ""
	})
}
function onReceiveCharacters(request) {
	let characters = JSON.parse(request.responseText).characters
	for (let i = 0; i < characters.length; ++i) {
		let str =
			'<div class="charbtnwrapper" value=' +
			String(i) +
			'><img class="charbtn" draggable="false" src="res/img/character/' +
			characters[i].imgdir +
			'">' +
			'<a class="charname">' +
			characters[i].name +
			"</a>" +
			'<img class="charlock hidden" draggable="false" src="res/img/svg/lock.svg">' +
			'<img class="teamlock" src="res/img/svg/lock.svg"></img>' +
			'<img class="charcheck hidden" draggable="false" src="res/img/ui/confirm.png">' +
			"</div>"

		$("#charbtns").append(str)
	}
	let charchecks = $(".charcheck").toArray()
	let charlocks = $(".charlock").toArray()
	let charteams = $(".teamlock").toArray()

	$(".charbtnwrapper").click(function () {
		let num = Number($(this).attr("value"))

		if ($(this).hasClass("onteamselection")) {
			let selectingTeam = SETTING.teamSelecting ? "red" : "blue"
			let oppositeTeam = !SETTING.teamSelecting ? "red" : "blue"
			//if already has the team
			if ($(charteams[num]).hasClass(selectingTeam)) {
				SETTING.teamLock[selectingTeam].delete(num)
				$(charteams[num]).removeClass(selectingTeam)
			} else {
				//if dont have the team

				// if have opposite team
				if ($(charteams[num]).hasClass(oppositeTeam)) {
					$(charteams[num]).removeClass(oppositeTeam)
					SETTING.teamLock[oppositeTeam].delete(num)
				}
				$(charteams[num]).addClass(selectingTeam)

				SETTING.teamLock[selectingTeam].add(num)
			}
		} else {
			//prevent changing player state while locking team
			if ($(this).hasClass("char_selected")) {
				//on locking character
				$(this).removeClass("char_selected")
				$(this).addClass("char_locked")

				SETTING.lockedCharacters.add(num)
				SETTING.characters.delete(num)

				$(charlocks[num]).show()
				$(charchecks[num]).hide()
			} else if ($(this).hasClass("char_locked")) {
				//on deselecting character

				$(this).removeClass("char_locked")
				$(charlocks[num]).hide()
				SETTING.lockedCharacters.delete(num)

				//deactivete team lock on deselecting character
				SETTING.clearTeamLock(num)
			} else {
				//on selecting character

				$(this).addClass("char_selected")
				SETTING.characters.add(num)
				$(charchecks[num]).show()
			}
		}
	})
}
function onReceiveSimulationSetting(request) {
	let setting = JSON.parse(request.responseText)
	for (let key of Object.keys(setting.matchSetting)) {
		let s = SETTING.setting.add(SettingType.MATCH, key, setting.matchSetting[key])
		if (key === "playerNumber") {
			SETTING.playercountSetting = s
		}
	}

	let request1 = new XMLHttpRequest()
	request1.open("GET", ip + "/resource/gamesetting")

	request1.onload = () => onReceiveGameSetting(request1)
	request1.send()
}

function onReceiveGameSetting(request) {
	let setting = JSON.parse(request.responseText)
	if (setting.gameplaySetting) {
		for (let key of Object.keys(setting.gameplaySetting)) {
			SETTING.setting.add(SettingType.GAMEPLAY, key, setting.gameplaySetting[key])
		}
	} else {
		$("#gameplay").hide()
	}
	for (let key of Object.keys(setting.statisticSetting)) {
		SETTING.setting.add(SettingType.STAT, key, setting.statisticSetting[key])
	}
	SETTING.setting.rangeSettingElements = $(".rangesetting").toArray()

	$("#teamchoice").click(function () {
		SETTING.toggleTeam()
	})

	$(".setting_category input").click(function () {
		let idx = Number($(this).val())

		SETTING.setting.toggleSettings[idx].toggle()
	})
	$(".setting_category .rangedown").click(function () {
		let idx = Number($(this).val())
		console.log(idx)
		if (SETTING.setting.rangeSettings[idx].down()) {
			$(this).attr("disabled", true)
			$(this).css("color", "gray")
		}
		$(SETTING.setting.rangeSettingElements[idx])
			.find(".rangevalue_wrapper .rangevalue")
			.html(SETTING.setting.rangeSettings[idx].getText())

		$(SETTING.setting.rangeSettingElements[idx]).children(".rangeup").attr("disabled", false).css("color", "white")
	})

	$(".setting_category .rangeup").click(function () {
		let idx = Number($(this).val())
		console.log(idx)

		if (SETTING.setting.rangeSettings[idx].up()) {
			$(this).attr("disabled", true)
			$(this).css("color", "gray")
		}
		$(SETTING.setting.rangeSettingElements[idx])
			.find(".rangevalue_wrapper .rangevalue")
			.html(SETTING.setting.rangeSettings[idx].getText())

		$(SETTING.setting.rangeSettingElements[idx]).children(".rangedown").attr("disabled", false).css("color", "white")
	})
	$(".toggleallstat").click(function () {
		if ($(this).prop("checked") == true) {
			for (let set of SETTING.setting.toggleSettings) {
				if (set.type == SettingType.STAT) set.state = true
			}
			$("#statistic .switch input").prop("checked", true)
		} else {
			for (let set of SETTING.setting.toggleSettings) {
				if (set.type == SettingType.STAT) set.state = false
			}
			$("#statistic .switch input").prop("checked", false)
		}
	})
}

function submit() {
	let set = SETTING.setting.getSimulationSummary()
	set["mapPool"] = Array.from(SETTING.maps)
	set["characterPool"] = Array.from(SETTING.characters)
	set["lockedCharacters"] = Array.from(SETTING.lockedCharacters)
	set["teamLock"] = SETTING.getTeamLock()

	if (meetSubmitCondition(set)) {
		let count = Number($("#num").val()) + 1
		console.log(set)
		simulationSubmit(set, count, SETTING.isTeam)
		$("#loadingoverlay").show()
	}
}
function submitTrain(){
	let set = SETTING.setting.getSimulationSummary()
	set["mapPool"] = [3]
	set["characterPool"] = [0,1,2,3,4,5,6,7,8]
	set["lockedCharacters"] = []
	set["teamLock"] = SETTING.getTeamLock()

	if (meetSubmitCondition(set)) {
		let count = Number($("#num").val()) + 1
		console.log(set)
		simulationSubmit(set, count, SETTING.isTeam)
		$("#loadingoverlay").show()
	}
}

function meetSubmitCondition(set) {
	let totalchar = set.characterPool.length + set.lockedCharacters.length
	console.log(set.mapPool)
	if (set.mapPool.length === 0) {
		alert(chooseLang("Choose at least one map!", "최소 하나의 맵을 선택하세요"))
		return false
	}
	if (totalchar === 0) {
		alert(chooseLang("Choose at least one character!", "최소 하나의 캐릭터를 선택하세요"))
		return false
	}
	if (set.lockedCharacters.length > set.playerNumber) {
		alert(
			chooseLang(
				"You can only lock at most " + set.playerNumber + " characters!",
				"최대 " + set.playerNumber + "개 캐릭터만 잠글 수 있습니다"
			)
		)
		return false
	}
	if (totalchar <= set.teamLock[0].length || totalchar <= set.teamLock[1].length) {
		alert(chooseLang("You cannot lock all characters to the same team", "모든 캐릭터를 한 팀에 고정할 수 없습니다"))
		return false
	}
	// if(set.teamLock[0].length > 3 || set.teamLock[1].length > 3){
	//     alert(chooseLang("You cannot lock more than 3 characters to the same team",
	//     "한 팀에 고정할 수 있는 캐릭터는 최대 3개입니다"))
	//     return false
	// }
	if (!set.allowMirrorMatch && set.playerNumber > totalchar) {
		alert(
			chooseLang(
				"Choose at least " + set.playerNumber + " characters, or turn on the mirror match",
				"최소  " + set.playerNumber + "개의 캐릭터를 선택하거나 미러전을 허용하세요"
			)
		)
		return false
	}
	if (SETTING.isTeam && set.playerNumber < 4) {
		alert(chooseLang("There should be 4 players for team game", "팀전은 플레이어 4명이 필요합니다"))
		return false
	}
	let count = Number($("#num").val())
	console.log(count)
	if (!count) {
		alert(chooseLang("Enter a number for simulation count", "시뮬레이션 횟수에 숫자를 입력하세요"))
		return false
	}
	if (count > 9999 || count < 1) {
		alert(chooseLang("Simulation count is capped at 9999", "최대 시뮬레이션 횟수는 9999번입니다"))
		return false
	}
	return true
}

function lockTeam(team) {
	if (SETTING.characters.size + SETTING.lockedCharacters.size <= 0) {
		alert(chooseLang("캐릭터를 먼저 선택하세요", "Choose character first"))
		return
	}
	$("#team_overlay").show()
	$(".charbtnwrapper").addClass("onteamselection")
	$("#team_overlay_text").html(
		team
			? chooseLang("레드팀에 고정할 캐릭터 선택", "Select to lock to the red team")
			: chooseLang("블루팀에 고정할 캐릭터 선택", "Select to lock to the blue team")
	)
	SETTING.teamSelecting = team
}

function simulationSubmit(setting,count,isTeam){
	console.log	("submit")
	socket.emit("user:simulationready",setting,count,isTeam)
}
function connectSocket(){

	socket= io(ip)

	socket.on("connect", function () {
		console.log("connected")
	})

	socket.on("server:simulation_progress", function (msg) {
		$("#progress").css("width",(400*msg)+"px")
		console.log("simulation_progress"+msg)
	})
	socket.on("server:simulationover", function (msg) {
		$("#progress").css("width","400px")
		if(msg==='no_stat'){
			$("#loadingtext").html("COMPLETE!")
			setTimeout(()=>window.location.href ='index.html',2000)
			return
		}

		if(msg.split(" ")[0]==='error') onError(msg)
		else
			$("#loadingtext").html("PROCESSING STATISTICS...")
	})
	
	socket.on("server:simulation_stat_ready", function (statid,msg) {
		if(statid==='error'){
			onError(msg)
		}
		else if(statid==='none'){
			$("#loadingtext").html("PROCESSING COMPLETE!")
			setTimeout(()=>window.location.href ='index.html',2000)
		}
		else{
			window.location.href = "statpage.html?type=simulation&statid="+statid

		}
	})
}

function onError(msg){
	$("#loadingtext").html("FATAL ERROR!")
	$("#loadingimg").hide()
	alert("FATAL ERROR! \n"+msg)
	setTimeout(()=>window.location.href ='index.html',2000)
	// setTimeout(()=>window.location.href='index.html')
}
function checkAuth(){
	$.ajax({
        method: 'POST',
        url: '/room/simulation',
		data:{}
    })
    .done(function(data, statusText, xhr){
		let status = xhr.status;
		console.log(status)

		if(status===200){
			$("#matchingpage").css("visibility","visible")
			connectSocket()
			requestResource()
		}

    })
    .fail(function(data, statusText, xhr){
		if(data.status===403){
        	window.location.href="index.html"
		}
		else if(data.status===401){
        	window.location.href="index.html?page=login&redirect=simulation_selection_page.html&"
		}
		else{
			alert("server error")
			window.localStorage.href="index.html"
			
		}
    })
}


function requestResource(){
	let request2 = new XMLHttpRequest()
	request2.open("GET", ip + "/resource/simulationsetting")

	request2.onload = () => onReceiveSimulationSetting(request2)
	request2.send()

	let request3 = new XMLHttpRequest()
	request3.open("GET", ip + "/resource/globalsetting")

	request3.onload = () => onReceiveCharacters(request3)
	request3.send()
}

document.addEventListener("DOMContentLoaded", () => {
	checkAuth()

	SETTING = new Setting()
	let mapchecks = $(".mapcheck").toArray()

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

	$(".mapbtn").click(function () {
		console.log($(this).attr("value"))
		if ($(this).hasClass("map_selected")) {
			$(this).removeClass("map_selected")
			SETTING.maps.delete(Number($(this).attr("value")))
			$(mapchecks[Number($(this).attr("value"))]).hide()
		} else {
			$(this).addClass("map_selected")
			SETTING.maps.add(Number($(this).attr("value")))

			$(mapchecks[Number($(this).attr("value"))]).show()
		}
	})
	$("#quitbtn").click(function () {
		window.location.href = "index.html"
	})
	$("#settingclose").click(function () {
		$("#settingpage").hide()
	})
	$("#setting").click(function () {
		$("#settingpage").show()
	})
	$("#settingpage").hide()
	$("#run_simulation").click(submit)

	$("#team_overlay_exit").click(function () {
		$("#team_overlay").hide()
		$(".charbtnwrapper").removeClass("onteamselection")
		$(".onteamselection").off()
	})
	$("#lockredteam").click(() => lockTeam(true))
	$("#lockblueteam").click(() => lockTeam(false))

})
