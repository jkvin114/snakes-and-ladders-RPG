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
let SERVER_URL = ""
let LOCALE_GAME = {}
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
	showCharacterPage(query.get("version"), query.get("map"), query.get("gametype"), query.get("charid"), false)
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
	$.get(SERVER_URL + "/stat/result?" + params).done((data) => showStat(data))
}
/**
 * request simulation list as summary
 * @param {*} start
 * @param {*} count
 */
function requestSimulationSummary(start, count) {
	$("#overlay").addClass("visible")
	$.get(SERVER_URL + "/stat/simulation/summary?start=" + start + "&count=" + count).done((data) =>
		onReceiveSimulationSummary(data)
	)
}
/**
 * request gamelist for normal games(not simulation games)
 * @param {*} start
 * @param {*} count
 */
function requestGames(start, count) {
	$("#overlay").addClass("visible")
	$.get(SERVER_URL + "/stat/game?start=" + start + "&count=" + count).done((data) => onReceiveGames(data))
}
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
	let xhr = $.get(SERVER_URL + "/stat/simulation?statid=" + id)

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
	let xhr = $.get(SERVER_URL + "/resource/globalsetting")

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
	let xhr = $.get(SERVER_URL + "/resource/item")

	xhr.done((data) => {
		data = JSON.parse(data)
		ITEMS = data.items

		// addItemTooltipEvent()
		requestGlobalSetting()
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
function loadScriptSync(src) {
	var s = document.createElement("script")
	s.src = src
	s.type = "text/javascript"
	s.async = false // <-- this is important
	document.getElementsByTagName("head")[0].appendChild(s)
}

function main(url) {
	loadScriptSync("https://cdn.amcharts.com/lib/4/core.js")
	loadScriptSync("https://cdn.amcharts.com/lib/4/charts.js")
	loadScriptSync("https://cdn.amcharts.com/lib/4/themes/dark.js")

	//wait until amcharts scripts are loaded
	if (!window.am4core) {
		setTimeout(() => main(url), 200)
		return
	}
	SERVER_URL = url

	SkillParser.init("", SERVER_URL + "/resource/skill", currentLocale())
	SkillParser.SeparateSection = true
	updateLocale("stat")
	updateGameLocale()

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
		if (window.innerHeight > 500) return
		// console.log("scroll" + document.getElementById("game_detail").scrollTop)
		if (document.getElementById("game_detail").scrollTop > 0) {
			document.getElementById("root").scrollTo(0, 1000)
		} else {
			document.getElementById("root").scrollTo(0, 0)
		}
	}
	window.onpopstate = function (e) {
		console.log(e)
		if (!e.state && InterfaceState.state === STATE_ANALYSIS) {
			$("#character").addClass("hidden")
			$("#stat-navbar").show()
		} else if (InterfaceState.state === STATE_CHARACTER_ANALYSIS && e.state && e.state.page === "character") {
			showCharacterPage(e.state.version, e.state.map, e.state.gametype, e.state.charId, false, true)
		}
	}
	$("#langbtn").click(function () {
		$(".lang_dropdown").show()
	})

	$(".dropitem").click(function () {
		$(".lang_dropdown").hide()
		let lang = $(this).attr("value")
		sessionStorage.language = lang
		updateLocale("stat")
		updateGameLocale()
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
	$("#character-close-btn").click(function () {
		window.history.back()
		$("#character").addClass("hidden")
		$("#stat-navbar").show()
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
}

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

/*
아이템빌드 (턴)
턴별 위치
킬/데스 맵

*/

//unused
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

	//unused
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
				"<br>version:" + data.version + "<br>Time:" + data.createdAt.slice(0, 16) + "<br>" + LOCALE.avgturn + totalturn
			)
		}

		// $("#simulation_result").html("Simulation average Turn:" + totalturn+", ")
		// if (data.version) {
		// 	$("#simulation_result").append("Server version:" + data.version)
		// }
		// $("#simulation_result").css("font-size", "20px")

		//drawSimulationGraph(winRateList, avgDamageList)
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

function drawSmallGraph(data, graphId) {
	let max = -Infinity
	let smallgraphs = $(".game-detail-graph-players").toArray()
	for (let d of data) {
		max = Math.max(max, d.value)
	}

	let str = ""
	let sorted = data.sort((a, b) => a.turn - b.turn)
	//console.log(sorted)
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
