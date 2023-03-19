const ip = "http://" + sessionStorage.ip_address
let table = []
let othertable = []
let itembuildTable = []
let statData = []
let LANG = sessionStorage.language
let itemLists = []
let playerNameLists = []
let toolbarButtons = []
let SETTING = null
let ITEMS = null
function golink(link) {
	window.location.href = link
}
const STATE_GAMES = 0
const STATE_SIMULATION = 1
const STATE_ONEGAME = 2
const STATE_ANALYSIS = 3
const STATE_CHARACTER_ANALYSIS = 4
class InterfaceState {
	constructor() {
		InterfaceState.gamelist_hidden = false
		InterfaceState.gamelist_hidden_smallscreen = true
		InterfaceState.gamelist_maximized = false
		//InterfaceState.page_type = ""
		InterfaceState.page_start = 0
		InterfaceState.page_max = 12
		InterfaceState.current_page = 0
		InterfaceState.page_direction = "next"
		InterfaceState.sidebar_shown = false
		InterfaceState.state = STATE_GAMES
	}
}
const chooseLang = function (kor, eng) {
	if (LANG === "kor") return kor
	return eng
}
function changelang() {
	$(".lang_dropdown").toggle()
}

function onResourceLoad() {
	let params = document.location.href.split("?")[1]
	let query = new URLSearchParams(window.location.search)
	// if (params) requestStatAfterGame(params)

	if ((query.get("type") === "game" || query.get("type") === "simulation") && query.has("statid"))
		requestStatAfterGame(params)
	else if (query.get("page") === "character" && query.has("charid")) setState(STATE_CHARACTER_ANALYSIS)
	else if (query.get("page") === "game") setState(STATE_GAMES)
	else if (query.get("page") === "simulation") setState(STATE_SIMULATION)
	else if (query.get("page") === "analysis") setState(STATE_ANALYSIS)
	else setState(STATE_ANALYSIS)
}
/**
 * set current page state and change overall layout ot page
 * @param {*} state
 */
function setState(state) {
	InterfaceState.state = state
	$(".toolbar_item").hide()
	$(".stat-navbar-btn").removeClass("active")
	$("#analysis").hide()
	switch (state) {
		case STATE_ONEGAME:
			$("#gamelist_wrapper").hide()
			$("#summary-container").hide()
			$("#summary-collapse").hide()
			$("#stat-navbar").hide()
			$("#detail_side").show()

			break
		case STATE_GAMES:
			$("#summary-container").show()
			$("#summary-collapse").show()
			$("#gamelist_wrapper").hide()
			$("#detail_side").show()
			showNormalGamePage()
			$(".intro_game").addClass("active")
			break
		case STATE_SIMULATION:
			$("#summary-container").show()
			$("#summary-collapse").show()
			$("#gamelist_wrapper").show()
			$(toolbarButtons[0]).show()
			$("#detail_side").show()
			$(".intro_simulation").addClass("active")
			$("#holder").hide()
			showSimulationPage()
			break
		case STATE_ANALYSIS:
			$("#summary-container").hide()
			$("#summary-collapse").hide()
			$("#gamelist_wrapper").hide()
			$("#detail_side").hide()
			$("#analysis").show()
			$(".intro_analysis").addClass("active")
			$("#holder").hide()
			showAnalysisPage("recent")
			break
		case STATE_CHARACTER_ANALYSIS:
			$("#summary-container").hide()
			$("#summary-collapse").hide()
			$("#gamelist_wrapper").hide()
			$("#detail_side").hide()
			$(".intro_analysis").addClass("active")
			$("#holder").hide()
			openCharacterAnalysis(window.location.search, true)
			break
	}
}
function openCharacterAnalysis(queryString, full) {
	let query = new URLSearchParams(queryString)
	if (!query.get("page") === "character" || !query.has("charid")) return
}
/**
 * called right after finishing simulation or game
 * used to display immediate results
 * @param {*} params url query string
 */
function requestStatAfterGame(params) {
	setState(STATE_ONEGAME)
	console.log(params)
	$("#main").css("grid-template-columns", "auto")
	$("#overlay").addClass("visible")
	$.get("/stat/result?" + params).done((data) => showStat(data))
}
/**
 * request simulation list as summary
 * @param {*} start
 * @param {*} count
 */
function requestSimulationSummary(start, count) {
	$("#overlay").addClass("visible")
	$.get("/stat/simulation/summary?start=" + start + "&count=" + count).done((data) => onReceiveSimulationSummary(data))
}
/**
 * request gamelist for normal games(not simulation games)
 * @param {*} start
 * @param {*} count
 */
function requestGames(start, count) {
	$("#overlay").addClass("visible")
	$.get("/stat/game?start=" + start + "&count=" + count).done((data) => onReceiveGames(data))
}
// function requestOneSimulationList(id) {
// 	$.get("/stat/simulation/gamelist?statid=" + id).done((data) => onReceiveOneSimulationList(data))
// }

// function requestOneGameInSimulation(id, index) {
// 	$.get("/stat/simulation/game?statid=" + id + "&index=" + index).done((data) =>
// 		onReceiveOneGameInSimulation(data)
// 	)
// }

/**
 * updates page number
 * @param {*} success false if end of page
 */
function onPageResponse(success) {
	if (success) {
	} else {
		if ((InterfaceState.page_direction = "next")) {
			InterfaceState.current_page -= 1
		} else if ((InterfaceState.page_direction = "prev")) {
			InterfaceState.current_page += 1
		}
		$("#overlay").removeClass("visible")
		alert("End of page")
	}
	console.log(InterfaceState.page_direction, InterfaceState.current_page)
	$("#pagenum").html(InterfaceState.current_page + 1)
}

/**
 * called on changing gamelist page
 * on success,update page number and display the gamelist
 * @param {*} data is null if the page ended
 * @returns
 */
function onReceiveGames(data) {
	if (!data) {
		onPageResponse(false)
		return
	}

	onPageResponse(true)
	//InterfaceState.page_type = "games"
	showStat(data)
}

/**
 * check if a character is included in team lock array
 * @param {*} char
 * @param {*} teamlock
 * @returns
 */
function getlockedTeam(char, teamlock) {
	if (teamlock[0].includes(char)) return "red"
	else if (teamlock[1].includes(char)) return "blue"
	else return ""
}
/**
 * displays simulation summary
 * @param {*} data
 */
function onReceiveSimulationSummary(data) {
	if (!data) {
		onPageResponse(false)
		return
	}
	onPageResponse(true)
	//InterfaceState.page_type = "simulations"

	$("#summary").removeClass("hidden")
	$("#intro").hide()
	$("#holder").hide()
	data = JSON.parse(data)
	let str = ""
	for (const s of data) {
		let teamlock = getSetting(s, "teamLock")
		if (!teamlock || teamlock.length === 0) teamlock = [[], []]

		str += `<div class="summary_item summary_to_detail" value=${s.id}><div class="summary_characters">`
		if (s.setting.length > 0) {
			let charpools = getSetting(s, "characterPool")
			if (charpools != null) {
				for (let c of getSetting(s, "characterPool")) {
					str +=
						'<div class="summary_char_icon ' +
						getlockedTeam(c, teamlock) +
						'"><img alt="char" src="' +
						getCharImgUrl(c) +
						'"></div>  '
				}
			}
			let lockedCharacters = getSetting(s, "lockedCharacters")
			if (lockedCharacters != null) {
				for (let c of getSetting(s, "lockedCharacters")) {
					str +=
						'<div class="summary_char_icon locked ' +
						getlockedTeam(c, teamlock) +
						'"><img alt="char" src="' +
						getCharImgUrl(c) +
						'"></div>  '
				}
			}

			str += "</div><div>"

			for (let m of getSetting(s, "mapPool")) {
				str +=
					'<div class="summary_map_icon" title="Map Type: ' +
					getMapName(m) +
					'"><img src="' +
					getMapIconUrl(m) +
					'"></div>  '
			}
			str += "</div><div>"
			if (getSetting(s, "isTeam")) {
				if (getSetting(s, "divideTeamEqually")) {
					str += '<img alt="equal team" src="res/img/ui/equal.png"  title="Divided team equally">'
				} else {
					str += '<img alt="team" src="res/img/ui/team2.png"  title="Team Game">'
				}
			}
			if (getSetting(s, "allowMirrorMatch")) {
				str += '<img alt="mirror" src="res/img/ui/mirror.png"  title="Allowed mirror match" class="invert">'
			}
			str +=
				'</div><div><img alt="count" src="res/img/svg/num.svg"  class="invert" title="Game count">:' +
				s.count +
				'  <img  alt="players" src="res/img/svg/users.svg" class="invert"  title="Player count per game">:'
			if (getSetting(s, "randomizePlayerNumber")) {
				str += "?"
			} else {
				str += getSetting(s, "playerNumber")
			}
			str += "</div></div>"
		} else {
			//if there is no setting stored in data
			str += "</div>" + '<div><img src="res/img/svg/num.svg" class="invert">:' + s.count + "</div></div>"
		}
	}
	for (let i = 0; i < 10; ++i) {
		str += '<div class="summary_item dummy"></div>'
	}
	$("#summary").html(str)
	$(".summary_to_detail").click(function () {
		requestStatById($(this).attr("value"))
	})
	$("#overlay").removeClass("visible")
}

/**
 * invoked on clicking one entry in simulation list
 *
 * fetches one whole simulation data by DB id
 * @param {*} id
 */
function requestStatById(id) {
	let xhr = $.get("/stat/simulation?statid=" + id)

	$("#overlay").addClass("visible")
	xhr.done((data) => {
		// window.location.href = "#gamelist"
		//	location.href="#gamelist_wrapper"

		showStat(data)
	})
}
/**
 *1.request global setting json

	2.response

	3-1. if url query leads to a game result, request that single game 

	3-2. otherwise request game list
 */
function requestGlobalSetting() {
	let xhr = $.get("/resource/globalsetting")

	xhr.done((data) => {
		data = JSON.parse(data)
		SETTING = data

		onResourceLoad()
	})
}
/**
 * request item json file. add item tooltip event on response
 * and request global setting afterwards
 */
function requestResource() {
	let xhr = $.get("/resource/item")

	xhr.done((data) => {
		data = JSON.parse(data)
		ITEMS = data.items

		addItemTooltipEvent()
		requestGlobalSetting()
	})
}
/**
 * get item description for tooltip
 * @param {*} item
 * @returns
 */
function getItemDescription(item) {
	let ability = ""
	for (let a of item.ability) {
		let ab = "<a class=ability_name>" + chooseLang(a.type_kor, a.type) + "</a> +" + a.value

		if (a.type === "addMdmg" || a.type === "skillDmgReduction" || a.type === "absorb" || a.type === "obsR") {
			ab += "%"
		}
		ability += ab
		ability += "<br>"
	}
	if (item.unique_effect != null) {
		ability += `<b class=unique_effect_name>[${chooseLang("고유지속효과", "unique passive")}]</b>:
			 ${chooseLang(item.unique_effect_kor, item.unique_effect)}`
		if (item.active_cooltime != null) {
			ability += chooseLang(`(쿨타임 ${item.active_cooltime}턴)`, `(cooltime ${item.active_cooltime} turns)`)
		}
	}
	ability += "<br><br>" + chooseLang("가격: ", "price: ") + "<b class=price>" + String(item.price) + "</b>"
	return ability
}
/**
 * register item tooltip event
 */
function addItemTooltipEvent() {
	$(".item_tooltip").off()
	$(".item_tooltip").mouseenter(function (e) {
		$(".tooltiptext")
			.css({
				visibility: "visible",
			})
			.css($(this).offset())

		if ($(this).offset().left < window.innerWidth / 2) {
			$(".tooltiptext").removeClass("rightside")
			$(".tooltiptext").addClass("leftside")
		} else {
			$(".tooltiptext").removeClass("leftside")
			$(".tooltiptext").addClass("rightside")
		}

		let item = ITEMS[Number($(this).attr("value"))]
		$(".tooltiptext h4").html(chooseLang(item.kor_name, item.name))
		$(".tooltiptext p").html(getItemDescription(item))
	})
	$(".item_tooltip").mouseleave(function (e) {
		$(".tooltiptext").css("visibility", "hidden")
	})
}
function hideDetail() {
	return
	$("#otherstattable").css({ visibility: "collapse" })
	$("#itembuildTable").css({ visibility: "collapse" })
	$("#position_chart").hide()
	$("#money_chart").hide()
	$("#killRecordTable").css({ display: "none" })
}
function updateSimulationGridLayout() {
	if (window.innerWidth > 1300) {
		//$("#main").css("grid-template-columns", "auto 1000px")
	} else {
		//$("#main").css("grid-template-columns", "auto")
	}
}

/**
 * collapse summary section(gamelist/simulationlist) and change button state
 */
function collapseSummary() {
	$("#summary").hide()
	$("#summary_navbar").hide()
	$("#summary-collapse").html("&#9660; expand")
	$("#summary-collapse").data("collapsed", "true")
}
/**
 * expand summary section(gamelist/simulationlist) and change button state
 */
function expandSummary() {
	$("#summary-collapse").html("&#9650; collapse")
	$("#summary-collapse").data("collapsed", "false")
	$("#summary").show()
	$("#summary_navbar").show()
}

function prevPage() {
	if (InterfaceState.current_page === 0) {
		return
	}
	InterfaceState.page_direction = "prev"
	InterfaceState.current_page -= 1
	if (InterfaceState.state === STATE_SIMULATION) {
		requestSimulationSummary(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
	} else if (InterfaceState.state === STATE_GAMES) {
		requestGames(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
	}
}
function nextPage() {
	InterfaceState.page_direction = "next"
	InterfaceState.current_page += 1
	if (InterfaceState.state === STATE_SIMULATION) {
		requestSimulationSummary(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
	} else if (InterfaceState.state === STATE_GAMES) {
		requestGames(InterfaceState.current_page * InterfaceState.page_max, InterfaceState.page_max)
	}
}
function showSimulationPage() {
	console.log("showSimulationPage")
	InterfaceState.current_page = 0
	$("#pagenum").html("1")
	$(".intro_simulation").addClass("active")
	$(".intro_game").removeClass("active")
	// setState(STATE_SIMULATION)
	// $("#sidebar").css({left:"-50%"})
	requestSimulationSummary(0, InterfaceState.page_max)
	//$("#summary_navbar").show()
	expandSummary()
}
function showNormalGamePage() {
	InterfaceState.current_page = 0
	$("#pagenum").html("1")
	// setState(STATE_GAMES)
	requestGames(0, InterfaceState.page_max)
	//	window.scrollTo(0,0)
	$(".intro_simulation").removeClass("active")
	$(".intro_game").addClass("active")
	// $("#sidebar").css({left:"-50%"})
	//$("#summary_navbar").show()
	expandSummary()
}

function onSimulationGameListShow() {
	collapseSummary()
	$("#gamelist_wrapper").show()
	$(".toolbar_item").hide()
	if (window.innerWidth < 900) {
		// $(toolbarButtons[2]).show()
	} else {
		$(toolbarButtons[0]).show()
	}
}
function onGameListShow() {
	$("#summary").removeClass("hidden")
}
function onGameDetailShow() {
	collapseSummary()
	$("#detail_side").show()

	$(".toolbar_item").hide()
	if (InterfaceState.state === STATE_SIMULATION) {
		if (window.innerWidth < 900) {
			$(toolbarButtons[2]).show()
			$("#gamelist_wrapper").hide()
		} else {
			$(toolbarButtons[0]).show()
		}
	} else {
		$("#gamelist_wrapper").hide()
	}
}
async function showAnalysisPage(version) {
	$("#overlay").addClass("visible")
	try {
		let maps = await (await fetch(`/stat/eval/list/map/${version}`)).json()
		console.log(maps)
		let versions = await (await fetch(`/stat/eval/list/version`)).json()
		let str = ' <li class="dropdown-item version-item" data-version="recent">Recent</li>'
		for (const v of versions.versions) {
			str += ` <li class="dropdown-item version-item" data-version="${v}">${v}</li>`
		}
		$("#version-dropdown").html(str)

		str = ""
		let map = ""
		for (const m of maps.maps) {
			if (map === "") map = m
			str += `
			<div class="character-table-mapbtn ${
				map === m ? "selected" : ""
			}" id="mapbtn-${m}" data-map="${m}" data-version="${version}">
				<img src="${getMapIconUrl(m)}">
				<a>${m}</a>
			</div>`
		}
		$("#character-table-maps").html(str)
		$(".version-item").click(function () {
			showAnalysisPage($(this).data("version"))
			$(".version-dropdown-btn").html("&#9660;" + $(this).data("version"))
		})
		$(".character-table-mapbtn").click(function () {
			$(".character-table-mapbtn").removeClass("selected")
			$(this).addClass("selected")
			showAnalysisTable($(this).data("version"), $(this).data("map"))
		})

		showAnalysisTable(version, map)
	} catch (e) {
		console.error(e)
		$("#overlay").removeClass("visible")
		return
	}
}

async function showAnalysisTable(version, map) {
	let data

	try {
		data = await (await fetch(`/stat/eval/${map}/${version}`)).json()
	} catch (e) {
		console.error(e)
		$("#overlay").removeClass("visible")
		return
	}

	let str = ""
	for (let i = 0; i < SETTING.characters.length; ++i) {
		str += `
		<div class="character-list-card">
			<div class="card-charimg">
				<img src="${getCharImgUrl(i)}">
			</div>
			<b>${SETTING.characters[i].name}</b>
		</div>`
	}
	$("#character-list").html(str)

	function charDataList() {
		let list = []
		for (let i = 0; i < SETTING.characters.length; ++i) {
			list.push({
				id: i,
				total: 0,
				wins: 0,
				winrate: -1,
			})
		}
		return list
	}
	let characters = new Map()
	//0~length: total wins, length~2*length: total games
	characters.set("2P", charDataList())
	characters.set("3P", charDataList())
	characters.set("4P", charDataList())
	characters.set("TEAM", charDataList())

	let metadata = new Map()
	metadata.set("2P", [0, 0]) //[totalgame,totalturn]
	metadata.set("3P", [0, 0])
	metadata.set("4P", [0, 0])
	metadata.set("TEAM", [0, 0])

	for (const eval of data) {
		let arr = metadata.get(eval.gameType)
		arr[0] += eval.count
		arr[1] += eval.averageTotalTurn * eval.count

		metadata.set(eval.gameType, arr)

		for (const char of eval.characters) {
			characters.get(eval.gameType)[char.charId].total += char.count
			characters.get(eval.gameType)[char.charId].wins += char.wins
		}

		// break
	}

	for (const [key, val] of characters.entries()) {
		let arr = metadata.get(key)
		if (arr[0] > 0) arr[1] = Math.round(arr[1] / arr[0])
		else {
			$("#character-table-" + key).html("No data")

			$("#character-table-totalgames-" + key).html("-")
			$("#character-table-avgturns-" + key).html("-")
			continue
		}
		$("#character-table-totalgames-" + key).html(arr[0])
		$("#character-table-avgturns-" + key).html(arr[1])

		for (let i = 0; i < SETTING.characters.length; ++i) {
			if (val[i].total > 0) {
				val[i].winrate = val[i].wins / val[i].total
			}
		}
		let sorted = val.sort((a, b) => b.winrate - a.winrate)
		let s = ""
		sorted.forEach((element, i) => {
			s += `
			<div class="character-winrate-card">
				<div>
					<span class="table-char-rank ${i > 2 ? (i > 6 ? "bronze" : "silver") : ""}">${i + 1}</span>
					<div class="table-charimg">
						<img src="${getCharImgUrl(element.id)}">
					</div>
					<b class="table-charname">${SETTING.characters[element.id].name}</b>
				</div>
				<div class="winrate">
					<b>${Math.round(element.winrate * 100)}%</b><br>
					<b class="subtext">${element.wins}/${element.total} games</b>
				</div>
			</div>`
		})

		$("#character-table-" + key).html(s)
	}

	$("#overlay").removeClass("visible")
}
$(window).on("load", function () {})
$(document).ready(function () {
	itemLists = $(".itemlist").toArray()
	playerNameLists = $(".playername").toArray()
	table = $(".statTableRow").toArray()
	othertable = $(".otherTableRow").toArray()
	itembuildTable = $(".itembuildTableRow").toArray()
	toolbarButtons = $(".toolbar_item").toArray()
	$(".toolbar_item").hide()
	let is = new InterfaceState()
	$("#stattable").hide()
	$("#detailbtn_container").hide()
	// $("#summary_navbar").hide()

	requestResource()
	document.getElementById("game_detail").onscroll = function () {
		// console.log("scroll" + document.getElementById("game_detail").scrollTop)
		if (document.getElementById("game_detail").scrollTop > 150) {
			document.getElementById("root").scrollTo(0, 1000)
		} else {
			document.getElementById("root").scrollTo(0, 0)
		}
	}

	$("#langbtn").click(function () {
		$(".lang_dropdown").show()
	})

	$(".dropitem").click(function () {
		$(".lang_dropdown").hide()
		let lang = $(this).attr("value")
		LANG = lang
	})
	$("#summary-collapse").click(function () {
		let collapsed = $(this).data("collapsed")
		if (collapsed === "true") {
			expandSummary()
		} else {
			collapseSummary()
		}
	})
	$(toolbarButtons[0]).click(function () {
		$("#gamelist_wrapper").hide()
		$(this).hide()
		$(toolbarButtons[1]).show()
	})
	$(toolbarButtons[1]).click(function () {
		$("#gamelist_wrapper").show()
		$(this).hide()
		$(toolbarButtons[0]).show()
	})
	$(toolbarButtons[2]).click(function () {
		$("#gamelist_wrapper").show()
		$("#detail_side").hide()
		$(this).hide()
	})
	// $(".dropitem").click(function(){
	// 	$(".lang_dropdown").hide()
	// 	let lang=$(this).attr("value")
	// 	LANG=lang
	//   })

	$("#toggle_fullscreen").click(() => {
		//	console.log($(this).data("on"))
		if (!$(this).data("on")) {
			document.documentElement.requestFullscreen()
			$(this).data("on", true)
		} else {
			document.exitFullscreen()
			$(this).data("on", false)
		}
	})

	$(".intro_simulation").click(() => (window.location.search = "page=simulation"))
	$(".intro_game").click(() => (window.location.search = "page=game"))
	$(".intro_analysis").click(() => (window.location.search = "page=analysis"))

	$(".quit").click(function () {
		window.location.href = "index.html"
	})
	$(".reset").click(function () {
		window.location.href = "/statpage.html"
	})
	$("#gotop").click(function () {
		location.href = "#"
	})
	$(".prevpage").click(prevPage)
	$(".nextpage").click(nextPage)

	// $("#togglelist").click(function () {
	// 	if (InterfaceState.gamelist_hidden) {
	// 		$("#gamelist_wrapper").show()
	// 		updateSimulationGridLayout()
	// 		if (window.innerWidth > 1300) {
	// 			$(this).css("right", "1000px")

	// 		}
	// 		InterfaceState.gamelist_hidden = false
	// 	} else {
	// 		$("#gamelist_wrapper").hide()
	// 		$(this).css("left", "0")
	// 		InterfaceState.gamelist_hidden = true
	// 	}
	// })
	$("#show-holder").click(function () {
		$("#holder").toggle()
	})

	//for small screen
	$("#listhidebtn").click(function () {
		if (!InterfaceState.gamelist_hidden_smallscreen) {
			$("#gamelist_wrapper").css("height", "320px")
			$(this).css("transform", "rotate(270deg)")
			//window.location.href = "#main_start"
			InterfaceState.gamelist_hidden_smallscreen = true
		} else {
			$("#gamelist_wrapper").css("height", "100%")
			$(this).css("transform", "rotate(90deg)")

			InterfaceState.gamelist_hidden_smallscreen = false
		}
	})
	$("#maximize_list_btn").click(function () {
		if (InterfaceState.gamelist_maximized) {
			updateSimulationGridLayout()
			InterfaceState.gamelist_maximized = false
			$(this).attr("src", "res/img/svg/maximize.svg")
		} else {
			$("#main").css("grid-template-columns", "auto")

			InterfaceState.gamelist_maximized = true
			$(this).attr("src", "res/img/svg/push.svg")
			$(this).css("transform", "rotate(180deg)")
		}
	})
	$(".detailbtn").click(function () {
		if ($(this).hasClass("active")) {
			hideDetail()
			$(this).removeClass("active")
			return
		}
		let v = $(this).val()
		hideDetail()
		$(".detailbtn").removeClass("active")
		$(this).addClass("active")
		switch (Number(v)) {
			case 1:
				$("#otherstattable").css({ visibility: "visible" })
				break
			case 2:
				$("#itembuildTable").css({ visibility: "visible" })
				break
			case 3:
				$("#killRecordTable").css({ display: "inline-block" })
				break
			case 4:
				$("#position_chart").show()
				break
			case 5:
				$("#money_chart").show()
				break
		}
	})

	let holder = document.getElementById("holder")

	holder.ondragover = function () {
		this.className = "hover"
		return false
	}
	holder.ondragend = function () {
		this.className = ""
		return false
	}
	holder.ondrop = function (e) {
		this.className = ""
		e.preventDefault()

		let file = e.dataTransfer.files[0],
			reader = new FileReader()
		reader.onload = function (event) {
			try {
				showStat(event.target.result)
			} catch (e) {
				console.error(e)
				alert("invaild file!")
			}
		}
		reader.readAsText(file)

		return false
	}
	$("#sidebarbtn").click(function () {
		if (InterfaceState.sidebar_shown) {
			InterfaceState.sidebar_shown = false
			$("#sidebar").animate({ left: -150 }, 200)
		} else {
			$("#sidebar").animate({ left: 0 }, 200)
			InterfaceState.sidebar_shown = true
		}
	})
	$("#close_sidebar").click(function () {})
})

/**
 * DEPRICATED
 */
function setItem(num, list, names) {
	let str = ""
	for (let i = 0; i < list.length; ++i) {
		if (list[i] > 0) {
			str += names[i] + "x" + list[i] + "    "
		}
	}
	$(".itemlist").append(num + 1 + "P Items have: " + str + "<br>")
}

function convertCountToItemSlots(items, isZeroIndex) {
	let itemslot = []
	for (let i = 0; i < items.length; ++i) {
		for (let j = 0; j < items[i]; ++j) {
			itemslot.push(isZeroIndex ? i : i - 1)
		}
	}
	return itemslot
}
/**
 * set player table`s item list
 * @param {*} turn
 * @param {*} item
 */
function setItemList(turn, item, isZeroIndex) {
	//console.log(turn)
	let text = ""
	if (item.length > 20) {
		item = convertCountToItemSlots(item, isZeroIndex)
	}
	let i = 0
	for (let it of item) {
		i += 1
		if (it === -1) {
			text += "<div class='toast_itemimg'><img alt='empty' src='res/img/store/emptyslot.png'> </div>"
		} else {
			text +=
				"<div class='toast_itemimg item_tooltip' value=" +
				it +
				"><img alt='item' src='res/img/store/items.png' style='margin-left: " +
				-1 * it * 100 +
				"px'; > </div>"
		}
		if (i > 0 && i % 6 === 0) text += "<br>"
	}

	$(itemLists[turn]).html("<div class=itemlist_container>" + text + "</div>")
}
/**
 *
 * @param {*} rank
 * @param {*} data
 * @returns player name of the rank(index)
 */
function getPlayerName(rank, data) {
	if (data.players[rank].name == null) {
		return ""
	} else {
		return data.players[rank].name
	}
}
/**
 * get character img url for each character
 * @param {*} champ_id
 * @returns
 */
function getCharImgUrl(champ_id) {
	if (champ_id === undefined) return ""
	return "res/img/character/illust/" + SETTING.characters[champ_id].illustdir
}
function getMapIconUrl(map_id) {
	if (map_id === 0 || map_id === "default") {
		return "res/img/map_thumbnail/default_icon.jpg"
	}
	if (map_id === 1 || map_id === "ocean") {
		return "res/img/map_thumbnail/ocean_icon.jpg"
	}
	if (map_id === 2 || map_id === "casino") {
		return "res/img/map_thumbnail/casino_icon.jpg"
	}
	if (map_id === 3 || map_id === "rapid") {
		return "res/img/map_thumbnail/rapid_icon.jpg"
	}
	if (map_id === 4 || map_id === "train") {
		return "res/img/ui/setting.png"
	}
}
function getMapName(map_id) {
	if (map_id === 0 || map_id === "default") {
		return "Default"
	}
	if (map_id === 1 || map_id === "ocean") {
		return "Ocean"
	}
	if (map_id === 2 || map_id === "casino") {
		return "Casino"
	}
	if (map_id === 3 || map_id === "rapid") {
		return "Rapid"
	}
	if (map_id === 4 || map_id === "train") {
		return "Train"
	}
}
function getChampImgofTurn(data, turn) {
	if (turn === -1) return "res/img/ui/obstacle.png"
	for (let p of data.players) {
		if (p.turn === turn) return getCharImgUrl(p.champ_id)
	}
	return ""
}

function writeTrainStats(totalturn, playerdata) {
	str = `${playerdata.name}<br> 데스당 피해량: ${Math.floor(playerdata.stats[2] / Math.max(playerdata.death, 0.5))}
	<br> 턴당 피해감소량: ${Math.floor(playerdata.stats[7] / totalturn)}
	<br> 피해감소율: ${playerdata.stats[7] / (playerdata.stats[7] + playerdata.stats[0])}<br>
	골드당 피해량: ${playerdata.stats[2] / playerdata.stats[4]}<br>
	골드당 피해감소량: ${playerdata.stats[7] / playerdata.stats[4]}<br>
	골드당 회복량: ${playerdata.stats[3] / playerdata.stats[4]}<br>`
	$("#train_detail p").append(str)
	$("#train_detail").show()
}

function drawKillRecord(data) {
	//if there is no record
	if (data.killRecord.length === 0) {
		$(".detailbtn:nth-child(3)").hide()
		return
	} //<b>&#10140;</b>
	let count = 1
	$(".detailbtn:nth-child(3)").show()
	let turn = data.killRecord[0].turn
	let str = "<div class='killframewrapper'>"
	for (let k of data.killRecord) {
		if (k.turn !== turn) {
			str += "<b>" + chooseLang("턴 ", "Turn ") + String(turn) + "</b>" + "</div>"
			turn = k.turn
			if (count % 12 === 0) str += "<br>"
			count += 1
			str += "<div class='killframewrapper'>"
		}
		str +=
			"<div class='killframe'><div class='charframe'><img alt='char' src='" + getChampImgofTurn(data, k.killer) + "'>"
		if (k.killer >= 0) {
			str += "<b class='charframetxt'>" + (k.killer + 1) + "P</b>"
		} else {
			str += "<b class='charframetxt'>EX</b>"
		}
		str +=
			"</div><img alt='char' src='res/img/ui/basicattack.png'><div class='charframe2'><img src='" +
			getChampImgofTurn(data, k.dead) +
			"'><b class='charframetxt'>" +
			(k.dead + 1) +
			"P</b></div></div><br>"
	}

	str += "<b>" + chooseLang("턴 ", "Turn ") + String(turn) + "</b>" + "</div>"

	$("#killRecordContent").html(str)
}

/*
아이템빌드 (턴)
턴별 위치
킬/데스 맵

*/
function getSetting(game, setting) {
	if (!game || !game.setting || game.setting.length === 0 || !game.setting[0].name) return null
	let s = game.setting.filter((s) => s.name === setting)
	if (s && s.length > 0) return s[0].value
	return null
}

function drawSimulationGraph(winRateList, avgDamageList) {
	am4core.createFromConfig(
		{
			type: "XYChart",
			data: avgDamageList,
			titles: [
				{
					text: chooseLang("평균 딜량", "Average Damage Dealt"),
					fontSize: 30,
					fill: "white",
				},
			],
			xAxes: [
				{
					type: "CategoryAxis",
					dataFields: {
						category: "category",
					},
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 10,
						},
						grid: {
							template: {
								disabled: true,
							},
						},
						minGridDistance: 20,
					},
				},
			],
			yAxes: [
				{
					type: "ValueAxis",
					min: 0,
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 15,
						},
						maxLabelPosition: 1,
						grid: {
							template: {
								disabled: true,
							},
						},
					},
				},
			],
			series: [
				{
					bullets: [
						{
							type: "LabelBullet",
							label: {
								text: "{value}",
								fontSize: 15,
								fill: "white",
								truncate: false,
								hideOversized: false,
								dy: 15,
							},
						},
					],
					type: "ColumnSeries",
					columns: {
						fill: "#6593F5",
						width: "50%",
						stroke: "none",
					},
					dataFields: {
						valueY: "value",
						categoryX: "category",
					},
				},
			],
		},
		document.getElementById("avgdamageGraph")
	)

	am4core.createFromConfig(
		{
			titles: [
				{
					text: chooseLang("승리횟수", "Wins"),
					fontSize: 30,
					fill: "white",
				},
			],
			type: "PieChart",
			data: winRateList,
			series: [
				{
					slices: {
						stroke: "#4a2abb",
						strokeWidth: 2,
						strokeOpacity: 1,
					},
					ticks: {
						stroke: "white",
						fill: "white",
						strokeWidth: "3px",
					},
					labels: {
						fontSize: "1.3vw",
						fill: "white",
						maxWidth: 200,
						wrap: true,
					},
					type: "PieSeries",
					dataFields: {
						value: "value",
						category: "category",
					},
				},
			],
			radius: "70%",
			innerRadius: "30%",
		},
		document.getElementById("winrateGraph")
	)
}
function showGameList(data) {
	updateSimulationGridLayout()
	$("#simulation_detail").show()
	statData = data.stat
	if (statData.length <= 0) {
		alert("empty statistics")
		return
	}

	//only simulation
	if (!data.isGamelist) {
		$("#holder").hide()
		let wins = [0, 0, 0, 0]
		let kdas = [
			{ kill: 0, death: 0, assist: 0 },
			{ kill: 0, death: 0, assist: 0 },
			{ kill: 0, death: 0, assist: 0 },
			{ kill: 0, death: 0, assist: 0 },
		]
		let avgDamageList = []
		let avgKdaList = []
		let winRateList = []
		let dealamt = [0, 0, 0, 0]
		let str = ""
		let totalkills = []
		let totalturn = 0
		for (let s of data.stat) {
			totalturn += s.totalturn

			let onegamekill = 0
			for (let i = 0; i < s.players.length; ++i) {
				if (i === 0) {
					wins[s.players[i].turn] += 1
				}
				dealamt[s.players[i].turn] += s.players[i].stats[2]

				for (let j = 0; j < 3; ++j) {
					if (j === 0) {
						kdas[s.players[i].turn].kill += s.players[i].kda[j]
						onegamekill += s.players[i].kda[j]
					}
					if (j === 1) {
						kdas[s.players[i].turn].death += s.players[i].kda[j]
					}
					if (j === 2) {
						kdas[s.players[i].turn].assist += s.players[i].kda[j]
					}
				}
			}
			totalkills.push(onegamekill)
		}
		// console.table(kdas)
		kdas.map(function (k) {
			k.kill /= data.count
			k.death /= data.count
			k.assist /= data.count
		})
		let plist = Array.from(data.stat[0].players)

		plist.sort((a, b) => a.turn - b.turn)
		for (let i = 0; i < plist.length; ++i) {
			avgDamageList.push({
				category: plist[i].name,
				value: Math.floor(dealamt[i] / data.count),
			})
			avgKdaList.push({
				category: plist[i].name,
				k: Math.floor(100 * kdas[i].kill) / 100,
				d: Math.floor(100 * kdas[i].death) / 100,
				a: Math.floor(100 * kdas[i].assist) / 100,
			})
			winRateList.push({
				category: plist[i].name,
				value: wins[i],
			})
		}

		totalturn /= data.count

		$("#simulation_info")
			.html("")
			.append("Count:" + statData.length)
		if (data.version != null && data.createdAt != null) {
			$("#simulation_info").append(
				"<br>version:" + data.version + "<br>Time:" + data.createdAt.slice(0, 16) + "<br>Average turn:" + totalturn
			)
		}

		// $("#simulation_result").html("Simulation average Turn:" + totalturn+", ")
		// if (data.version) {
		// 	$("#simulation_result").append("Server version:" + data.version)
		// }
		// $("#simulation_result").css("font-size", "20px")

		drawSimulationGraph(winRateList, avgDamageList)
	} else {
		//on receive game list
		$("#simulation_detail").hide()
	}

	let string = ""
	for (let i = 0; i < statData.length; ++i) {
		string += '<div class="onegame_container" onclick=showonestat(' + String(i) + ")>"

		for (let j = 0; j < 4; ++j) {
			if (j == 0 || j == 2) string += "<div>"

			if (j < statData[i].players.length) {
				let p = statData[i].players[j]
				let teamstr = ""
				if (statData[i].isTeam && p.team === true) teamstr = "red"
				else if (statData[i].isTeam && p.team === false) teamstr = "blue"
				string +=
					'<div class="character"><div class="charimg list_charimg ' +
					'"><img alt="char" src="' +
					getCharImgUrl(p.champ_id) +
					'"></div><a class="charkda ' +
					teamstr +
					'">' +
					p.kda[0] +
					"/" +
					p.kda[1] +
					"/" +
					p.kda[2] +
					"</a></div>"
			} else {
				string += "<div></div>"
			}
			if (j == 1 || j == 3) string += "</div>"
		}
		string += ""
		if (statData[i].map_data != null) {
			string +=
				'<div><div class="gameinfo"><img alt="map" class="detail_map_icon" title="Map Type: ' +
				getMapName(statData[i].map_data.name) +
				'" src="' +
				getMapIconUrl(statData[i].map_data.name) +
				'"></div>'
		}
		string +=
			'<div class="gameinfo"><img alt="turns" src="res/img/svg/dice.svg" class="icon" title="total turns">' +
			statData[i].totalturn +
			"</div>"
		if (statData[i].replay != null)
			string +=
				'<div class="gameinfo"><img alt="replay" src="res/img/svg/play.svg" class="icon" title="Replay avaliable"></div>'

		string += "</div></div>"

		if (statData[i].setting != null && statData[i].setting.length > 0 && statData[i].setting[0].name != null) {
			// string +=
			// 	'<img src="res/img/svg/shopping-cart.svg" class="icon" title="item limit">:' +
			// 	getSetting(statData[i], "itemLimit") +
			// 	"<br>"
			// if (getSetting(statData[i], "shuffleObstacle")) {
			// 	string += '<img src="res/img/svg/shuffle.svg" class="icon" title="shuffled obstacles">'
			// }
			// if (getSetting(statData[i], "coldGame")) {
			// 	string += '<img src="res/img/ui/finish-flag.png" class="icon" title="use decision by win">'
			// }
			// if (getSetting(statData[i], "useAdditionalLife")) {
			// 	string += '<img src="res/img/svg/heart.svg" class="icon" title="additional life avaliable">'
			// }
		}

		// string +=
		// 	'<img src="res/img/svg/zoom-in.svg" class="show_detail" ' +
		// 	"></div></div>"
	}
	for (let i = 0; i < 10; ++i) {
		string += '<div class="onegame_container dummy"></div>'
	}

	//simulation gamelist
	if (!data.isGamelist) {
		$("#gamelist_side").html(string + `<div class="tall-dummy"></div>`)

		onSimulationGameListShow()
	} else {
		//gamelist
		$("#summary").html(string)
		onGameListShow()
	}
	$("#overlay").removeClass("visible")
}

function showStat(data) {
	$("#intro").hide()
	//$("#holder").hide()
	$("#main").removeClass("hidden")
	data = JSON.parse(data)
	$("#detail_side").hide()
	if (!data.multiple) {
		$("#gamelist_wrapper").css("height", "0")
		$("#gamelist_wrapper").addClass("collapse")
		$("#holder").hide()

		$(".simulationGraph").hide()
		showSingleStat(data)
	} else {
		showGameList(data)
		return
	}
}

const randomHex = (length) =>
	("0".repeat(length) + Math.floor(Math.random() * 16 ** length).toString(16)).slice(-length)

function drawSmallGraph(data, graphId) {
	let max = -Infinity
	let smallgraphs = $(".game-detail-graph-players").toArray()
	for (let d of data) {
		max = Math.max(max, d.value)
	}

	let str = ""
	let sorted = data.sort((a, b) => a.turn - b.turn)
	console.log(sorted)
	let widths = new Map()
	for (const player of sorted) {
		let id = randomHex(4)
		widths.set(id, 100 * (player.value / max))
		str += `
		<div class="game-detail-graph-oneplayer">
			<div class="game-detail-graph-name">
				<b>${player.turn + 1}P</b><img alt="char" src="${getCharImgUrl(player.champ)}">
			</div>
			<div class="game-detail-graph-value">
				<div class="game-detail-graph-amount" id='${id}'"></div>
				<b>${player.value}</b>
			</div>
		</div> 
		`
	}

	$(smallgraphs[graphId]).html(str)
	for (const [id, val] of widths.entries()) {
		$("#" + id).animate({ width: val + "%" }, 1000)
	}
}

/**
 * only called from selecting one of simulation games
 * @param {*} n
 */
function showonestat(n) {
	$("#holder").hide()
	showSingleStat(statData[n])
}

function multiKillText(count) {
	let multiKillText = ""
	if (count >= 2) {
		multiKillText = chooseLang("더블킬", "Double kill")
	}
	if (count >= 3) {
		multiKillText = chooseLang("트리플킬", "Triple kill")
	}
	if (count >= 4) {
		multiKillText = chooseLang("쿼드라킬", "Quadra kill")
	}
	if (count >= 5) {
		multiKillText = chooseLang("펜타킬", "Penta kill")
	}
	return multiKillText
}

/**
 * display single game data
 * @param {*} data
 */
function showSingleStat(data) {
	$("#overlay").addClass("visible")
	onGameDetailShow()
	let damagetakenC_graph = []
	let damagetakenO_graph = []
	let damagedealt_graph = []
	let heal_graph = []
	let gold_graph = []
	let kda_graph = []
	let damageabsorbed_graph = []
	let position_list = []
	let money_list = []
	let respawnpos_list = []
	let visiblePlayerNames = []
	let ranks = $(".rank").toArray()
	$(table[3]).show()
	$(table[4]).show()
	$(othertable[3]).show()
	$(othertable[4]).show()
	$(itembuildTable[2]).show()
	$(itembuildTable[3]).show()
	$(".detailbtn:nth-child(1)").html(chooseLang("상세 통계", "Details"))
	$(".detailbtn:nth-child(2)").html(chooseLang("아이템 빌드", "Item Build"))
	$(".detailbtn:nth-child(3)").html(chooseLang("킬/데스", "Kill/Death"))
	$(".detailbtn:nth-child(4)").html(chooseLang("위치", "Position"))
	$(".detailbtn:nth-child(5)").html(chooseLang("돈", "Money"))
	let smallGraphTypes = $(".game-detail-graph-type").toArray()
	$(smallGraphTypes[0]).html(chooseLang("입힌 피해량", "Damage Dealt"))
	$(smallGraphTypes[1]).html(chooseLang("플레이어에게 받은 피해", "Damage From Players"))
	$(smallGraphTypes[2]).html(chooseLang("장애물에게 받은 피해", "Damage From Obstacle"))
	$(smallGraphTypes[3]).html(chooseLang("회복량", "Heal Amount"))
	$(smallGraphTypes[4]).html(chooseLang("획득한 돈", "Money Earned"))
	$(smallGraphTypes[5]).html(chooseLang("피해 감소량", "Damage Reduced"))
	let gameDetailValues = $(".game-detail-value").toArray()
	$("#train_detail").hide()
	$("#stattable").show()
	// $("#detailbtn_container").show()
	if (!data.replay || data.replay === "") {
		$("#replay").hide()
	} else {
		$("#replay").show()
		$("#replay-btn").click(() => {
			window.location.href = "gamepage.html?isreplay=true&replayid=" + data.replay
		})
	}
	$("#train_detail p").html("")
	let isLegacy = false

	if (data.version >= 2) {
		$(".detailbtn:nth-child(4)").show()
		$(".detailbtn:nth-child(5)").show()
		if (data.players[0].positionRecord.length === 1) {
			$("#position_chart").hide()
			$(".detailbtn:nth-child(4)").hide()
		}
		if (data.players[0].moneyRecord.length === 1) {
			$("#money_chart").hide()
			$(".detailbtn:nth-child(5)").hide()
		}
		for (let i = 0; i < data.players[0].positionRecord.length; ++i) {
			let pos = {
				category: i,
				value1: -10,
				value2: -10,
				value3: -10,
				value4: -10,
			}
			for (let j = 0; j < data.players.length; ++j) {
				let p = data.players[j].positionRecord[i]
				pos["value" + String(j + 1)] = p
			}

			position_list.push(pos)
		}
		for (let i = 0; i < data.players[0].moneyRecord.length; ++i) {
			let money = {
				category: i,
				value1: -1000,
				value2: -1000,
				value3: -1000,
				value4: -1000,
			}
			for (let j = 0; j < data.players.length; ++j) {
				let p = data.players[j].moneyRecord[i]
				money["value" + String(j + 1)] = p
			}

			money_list.push(money)
		}

		if (data.map_data != null) {
			for (let i = 1; i < data.map_data.respawn.length; ++i) {
				let value = data.map_data.respawn[i]
				if (value > data.map_data.finish) {
					break
				} else {
					respawnpos_list.push({
						value: value,
						label: {
							text: String(value),
							fill: "#ffffff",
						},
						grid: {
							strokeOpacity: 1,
							stroke: "#707070",
							strokeWidth: 1,
						},
					})
				}
			}
			respawnpos_list.push({
				value: data.map_data.finish,
				label: {
					text: String(data.map_data.finish),
					fill: "#ffffff",
				},
				grid: {
					strokeOpacity: 1,
					stroke: "#707070",
					strokeWidth: 1,
				},
			})
		}
		$(".player-data-container").remove()
		$(".tall-dummy-gamedetail").remove()
		for (let i = 0; i < data.players.length; ++i) {
			// $(itembuildTable[i]).children(".itembuildTableName").html(data.players[i].name)
			const p = data.players[i]
			//if there is no record
			let itemstr = ""
			if (p.itemRecord.length > 0) {
				$(".detailbtn:nth-child(2)").show()
				let turn = p.itemRecord[0].turn
				itemstr = "<a class='itemrecord-text'>" + turn + chooseLang("턴", "T") + "</a><div class='itemrecord-item'>"
				for (let item of p.itemRecord) {
					if (item.turn !== turn) {
						itemstr +=
							"</div><a class='itemrecord-text'>&#10140;  " +
							item.turn +
							chooseLang("턴", "T") +
							"</a><div class='itemrecord-item'>"
						turn = item.turn
					}
					for (let j = 0; j < item.count; ++j) {
						itemstr +=
							"<div class='toast_itemimg_itembuild item_tooltip' value=" +
							item.item_id +
							"><img alt='item' src='res/img/store/items.png' style='margin-left: " +
							-1 * item.item_id * 100 +
							"px'; > </div>"
					}
				}
				itemstr += "</div>"
			} else {
				$(".detailbtn:nth-child(2)").hide()
			}

			// $(".itembuildTableContent").html(str)
			let teamstr = ""
			if (data.isTeam) {
				teamstr = `<b class='player-data-header-team ${p.team ? "red" : "blue"}'>${p.team ? "Red" : "Blue"} Team</b>`
			}
			let str = `
			<div class="player-data-container">
				<div class="player-data-header"> 
					<img alt='char' src="${getCharImgUrl(p.champ_id)}">
					<b>${p.name}</b>
					${teamstr}
				</div>
				<div class="player-data-content"> 
					<div class="player-data-otherstat">
						<div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name"> ${chooseLang("소모한 돈", "Money Spent")}: </b><b class="otherstat-value">${p.stats[5]} </b>
							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name"> ${chooseLang("빼앗긴 돈", "Money Taken")}: </b><b class="otherstat-value">${p.stats[6]} </b>

							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name"> ${chooseLang("부활한 횟수", "Revived")}: </b><b class="otherstat-value">${p.stats[8]} </b>
							</div>
						</div>
						<div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name"> ${chooseLang("강제이동", "Forcemoved")}: </b><b class="otherstat-value">${p.stats[9]} </b>
							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name"> ${chooseLang("기본공격 횟수", "Basic attack")}: </b><b class="otherstat-value">${
				p.stats[10]
			} </b>
							</div>
							<div class="player-data-otherstat-item">
								<b class="otherstat-name"> ${chooseLang("처형당한 횟수", "Executed")}: </b><b class="otherstat-value">${
				p.stats[11]
			} </b>
							</div>
						</div>
					</div>
					${
						itemstr === ""
							? ""
							: `
						<div class="player-data-label">${chooseLang("아이템 빌드", "Item Build")}</div>
						<div class="itembuildTableContent">
							${itemstr}
						</div>
					`
					}
				</div>
			</div>
			`
			$("#game_detail_content").append(str)
			// $(".toast_itemimg_itembuild").css({
			// 	margin: "-30px",
			// 	width: "100px",
			// 	overflow: "hidden",
			// 	height: "100px",
			// 	display: "inline-block",
			// 	transform: "scale(0.4)",
			// 	"vertical-align": "middle"
			// })

			//player-detail-content
		}
		$("#game_detail_content").append(`<div class="tall-dummy tall-dummy-gamedetail"></div>`)

		drawKillRecord(data)
		// $("#detailbtn_container").show()
		$(gameDetailValues[0]).html(data.totalturn)
		$(gameDetailValues[2]).html(getMapName(data.map_data.name))

		let itemlimit = getSetting(data, "itemLimit")
		$(gameDetailValues[3]).html(!itemlimit ? 6 : itemlimit)
		let coldGame = getSetting(data, "coldGame")
		$(gameDetailValues[4]).html(!coldGame ? chooseLang("미사용", "Disabled") : chooseLang("사용", "Enabled"))
		let useAdditionalLife = getSetting(data, "useAdditionalLife")
		$(gameDetailValues[5]).html(!useAdditionalLife ? chooseLang("미사용", "Disabled") : chooseLang("사용", "Enabled"))
		// $("#game_resulttext").html("Total turn:" + data.totalturn + ", Map: "+getMapName(data.map_data.name))
	} else {
		$("#game_resulttext").html("Total turn:" + data.totalturn)
		$("#detailbtn_container").hide()
		isLegacy = true
	}

	if (data.players.length < 4) {
		$(table[4]).hide()
		// $(othertable[4]).hide()
		// $(itembuildTable[3]).hide()
	}
	if (data.players.length < 3) {
		$(table[3]).hide()
		// $(othertable[3]).hide()
		// $(itembuildTable[2]).hide()
	}

	if (data.isTeam && data.players[0].team === true) {
		$(gameDetailValues[1]).html("Red Team")

		// $("#resulttext").html("Blue Team Victory!")
	} else if (data.isTeam !== null && data.players[0].team === false) {
		// $("#resulttext").html("Red Team Victory!")
		$(gameDetailValues[1]).html("Blue Team")
	} else {
		$(gameDetailValues[1]).html(data.players[0].name)
		$("#resulttext").html("")
	}

	let dataList = $(".statTableCell").toArray()
	$(".statTableCell").removeClass("red")
	$(".statTableCell").removeClass("blue")
	let winner_team = true
	for (let i = 0, k = 0; i < data.players.length; ++i, k += 5) {
		if (data.map_data != null && data.map_data.name === "train") {
			writeTrainStats(data.totalturn, data.players[i])
		}

		let p = data.players[i]
		visiblePlayerNames.push(p.turn + 1 + "P(" + p.champ + ")")

		setItemList(i, p.items, data.version >= 2)

		let charstr = '<div class="charimg table_charimg '

		//팀전
		if (data.isTeam) {
			if (p.team) {
				charstr += "red"
				$(dataList[k + 2]).addClass("red")
				$(dataList[k + 3]).addClass("red")
			} else {
				charstr += "blue"
				$(dataList[k + 2]).addClass("blue")
				$(dataList[k + 3]).addClass("blue")
			}

			if (i === 0) {
				winner_team = p.team
			}
			if (p.team !== winner_team) {
				charstr += " lose_team"
				$(ranks[i]).html("LOSE")
			} else {
				$(ranks[i]).html("WIN")
			}
		} else {
			//개인전
			$(ranks[i]).html(i + 1)
			if (i === 0) {
				$(ranks[i]).html("<img class=winimg src='res/img/svg/trophy.svg'>")
				// charstr += " winner"
			} else if (i === 1) $(ranks[i]).html("2<sup>nd</sup>")
			else if (i === 2) $(ranks[i]).html("3<sup>rd</sup>")
			else $(ranks[i]).html("4<sup>th</sup>")
		}

		charstr += '"><img alt="char" src="' + getCharImgUrl(p.champ_id) + '"></div>'

		$(dataList[k + 1]).html(charstr)
		$(dataList[k + 2]).html(p.name)
		$(dataList[k + 3]).html(
			p.kda[0] +
				"/" +
				p.kda[1] +
				"/" +
				p.kda[2] +
				(multiKillText(p.bestMultiKill) === ""
					? ""
					: " <br><b class='multikill-text'>" + multiKillText(p.bestMultiKill) + "</b>")
		)

		kda_graph.push({
			category: p.turn + 1 + "P(" + p.champ + ")",
			k: (p.kda[0] + p.kda[2]) / Math.max(1, p.kda[1]),
		})
		for (let j = 0; j < p.stats.length; ++j) {
			//$(dataList[k + j + 4]).html(p.stats[j])

			let graphData = {
				turn: p.turn,
				champ: p.champ_id,
				value: p.stats[j],
			}
			switch (j) {
				case 0:
					damagetakenC_graph.push(graphData)
					break
				case 1:
					damagetakenO_graph.push(graphData)
					break
				case 2:
					damagedealt_graph.push(graphData)
					break
				case 3:
					heal_graph.push(graphData)
					break
				case 4:
					gold_graph.push(graphData)
					break
				case 7:
					damageabsorbed_graph.push(graphData)
					break
			}
		}
	}

	$(".game-detail-graph-amount").css("width", "0")
	drawSmallGraph(damagedealt_graph, 0)
	drawSmallGraph(damagetakenC_graph, 1)
	drawSmallGraph(damagetakenO_graph, 2)
	drawSmallGraph(heal_graph, 3)
	drawSmallGraph(gold_graph, 4)
	drawSmallGraph(damageabsorbed_graph, 5)

	// let otherDataList = $(".otherTableCell").toArray()

	// for (let i = 0, k = 0; i < data.players.length; ++i, k += 7) {
	// 	let p = data.players[i]
	// 	if (p.stats.length < 9) continue

	// 	$(otherDataList[k]).html(p.name)

	// 	$(otherDataList[k + 1]).html(p.stats[5])
	// 	$(otherDataList[k + 2]).html(p.stats[6])
	// 	$(otherDataList[k + 3]).html(p.stats[8])
	// 	$(otherDataList[k + 4]).html(p.stats[9])
	// 	$(otherDataList[k + 5]).html(p.stats[10])
	// 	$(otherDataList[k + 6]).html(p.stats[11])
	// }
	addItemTooltipEvent()
	$(".itemlist").css("font-size", "20px")
	am4core.createFromConfig(
		{
			type: "XYChart",
			data: kda_graph,
			legend: {
				position: "bottom",
				labels: {
					textDecoration: "none",
					fill: "#ffffff",
				},
			},
			titles: [
				{
					text: "KDA Score",
					fontSize: 30,
					fill: "white",
				},
			],
			xAxes: [
				{
					type: "CategoryAxis",
					dataFields: {
						category: "category",
					},
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 10,
						},
						grid: {
							template: {
								disabled: true,
							},
						},
						minGridDistance: 20,
					},
				},
			],
			yAxes: [
				{
					type: "ValueAxis",
					min: 0,
					renderer: {
						labels: {
							fill: "#ffffff",
							fontSize: 15,
						},
						maxLabelPosition: 1.2,
						grid: {
							template: {
								disabled: true,
							},
						},
					},
				},
			],
			series: [
				{
					name: "KDA",
					bullets: [
						{
							type: "LabelBullet",
							label: {
								text: "{k}",
								fontSize: 10,
								fill: "white",
								truncate: false,
								dy: 10,
							},
						},
					],
					type: "ColumnSeries",
					columns: {
						width: "25",
						fill: "#6593F5",
						stroke: "none",
					},
					dataFields: {
						valueY: "k",
						categoryX: "category",
					},
				},
				// {
				// 	name: "Death",
				// 	bullets: [
				// 		{
				// 			type: "LabelBullet",
				// 			label: {
				// 				text: "{d}",
				// 				fontSize: 10,
				// 				fill: "white",
				// 				truncate: false,
				// 				dy: 10
				// 			}
				// 		}
				// 	],
				// 	type: "ColumnSeries",
				// 	columns: {
				// 		width: "60%",
				// 		fill: "#fc5060",
				// 		stroke: "none"
				// 	},
				// 	dataFields: {
				// 		valueY: "d",
				// 		categoryX: "category"
				// 	}
				// },
				// {
				// 	name: "Assist",
				// 	bullets: [
				// 		{
				// 			type: "LabelBullet",
				// 			label: {
				// 				text: "{a}",
				// 				fontSize: 10,
				// 				fill: "white",
				// 				truncate: false,
				// 				dy: 10
				// 			}
				// 		}
				// 	],
				// 	type: "ColumnSeries",
				// 	columns: {
				// 		width: "60%",
				// 		fill: "#32cd32",
				// 		stroke: "none"
				// 	},
				// 	dataFields: {
				// 		valueY: "a",
				// 		categoryX: "category"
				// 	}
				// }
			],
		},
		document.getElementById("kdaGraph")
	)

	let position_chart = {
		legend: {
			position: "bottom",
			labels: {
				textDecoration: "none",
				fill: "#ffffff",
				// text: "[bold {stroke}]{name}[/]",
			},
		},
		titles: [
			{
				text: chooseLang("위치", "Positions"),
				fontSize: 30,
				fill: "white",
			},
		],
		type: "XYChart",
		data: position_list,
		xAxes: [
			{
				type: "CategoryAxis",
				dataFields: {
					category: "category",
				},
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 10,
					},
					grid: {
						template: {
							disabled: true,
						},
					},
					minGridDistance: 20,
				},
			},
		],
		yAxes: [
			{
				axisRanges: respawnpos_list,
				min: 0,
				type: "ValueAxis",
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 20,
						template: {
							disabled: true,
						},
					},
					maxLabelPosition: 1,
					grid: {
						template: {
							disabled: true,
						},
					},
				},
			},
		],
		series: [
			{
				type: "LineSeries",
				name: "",
				fill: "#0077b6",
				stroke: "#0077b6",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 2,
									height: 2,
									horizontalCenter: "middle",
									verticalCenter: "middle",
								},
							],
						},
					],
					template: {
						type: "Bullet",
						fill: "#0077b6",
					},
				},
				dataFields: {
					valueY: "value1",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#d54a48",
				stroke: "#d54a48",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 2,
									height: 2,
									horizontalCenter: "middle",
									verticalCenter: "middle",
								},
							],
						},
					],
					template: {
						type: "Bullet",
						fill: "#d54a48",
					},
				},
				dataFields: {
					valueY: "value2",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#72cc50",
				stroke: "#72cc50",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 2,
									height: 2,
									horizontalCenter: "middle",
									verticalCenter: "middle",
								},
							],
						},
					],
					template: {
						type: "Bullet",
						fill: "#72cc50",
					},
				},
				dataFields: {
					valueY: "value3",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#fff989",
				stroke: "#fff989",
				bullets: {
					values: [
						{
							children: [
								{
									type: "Circle",
									width: 2,
									height: 2,
									horizontalCenter: "middle",
									verticalCenter: "middle",
								},
							],
						},
					],
					template: {
						type: "Bullet",
						fill: "#fff989",
					},
				},
				dataFields: {
					valueY: "value4",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
		],
	}

	let money_chart = {
		legend: {
			position: "bottom",
			labels: {
				textDecoration: "none",
				fill: "#ffffff",
				// text: "[bold {stroke}]{name}[/]",
			},
		},
		titles: [
			{
				text: chooseLang("돈 획득", "Money Obtain"),
				fontSize: 30,
				fill: "white",
			},
		],
		type: "XYChart",
		data: money_list,
		xAxes: [
			{
				type: "CategoryAxis",
				dataFields: {
					category: "category",
				},
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 10,
					},
					grid: {
						template: {
							disabled: true,
						},
					},
					minGridDistance: 25,
				},
			},
		],
		yAxes: [
			{
				min: 0,
				type: "ValueAxis",
				renderer: {
					labels: {
						fill: "#ffffff",
						fontSize: 13,
					},
					maxLabelPosition: 1,
					grid: {},
					minGridDistance: 25,
				},
			},
		],
		series: [
			{
				type: "LineSeries",
				name: "",
				fill: "#0077b6",
				stroke: "#0077b6",
				bullets: {},
				dataFields: {
					valueY: "value1",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#d54a48",
				stroke: "#d54a48",
				bullets: {},
				dataFields: {
					valueY: "value2",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#72cc50",
				stroke: "#72cc50",
				bullets: {},
				dataFields: {
					valueY: "value3",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
			{
				type: "LineSeries",
				name: "",
				fill: "#fff989",
				stroke: "#fff989",
				bullets: {},
				dataFields: {
					valueY: "value4",
					categoryX: "category",
				},
				sequencedInterpolation: false,
				sequencedInterpolationDelay: 100,
			},
		],
	}
	for (let i = 0; i < 4; ++i) {
		position_chart.series[i].name = visiblePlayerNames[i]
	}
	for (let i = 0; i < 4; ++i) {
		money_chart.series[i].name = visiblePlayerNames[i]
	}
	am4core.createFromConfig(position_chart, document.getElementById("position_chart"))
	am4core.createFromConfig(money_chart, document.getElementById("money_chart"))
	// location.href = "#game_detail_content"
	document.getElementById("game_detail").scrollTo(0, 0)
	$("#game_detail").show()
	//document.getElementById("game_detail").scrollIntoView();
	setTimeout(() => $("#overlay").removeClass("visible"), 400)
}
