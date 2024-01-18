/**
     * 
	export interface GameStatus {
		playerSettings: {
			turn: number
			team: boolean
			name: string
			champ: number
			kill:number
			death:number
			assist:number
		}[]
		roomname:string
		map:number
		isTeam: boolean
		totalturns:number
	}
     */
let setting = null
function getCharImgUrl(champ_id) {
	if (champ_id === undefined || !setting) return ""
	return "res/img/character/illust/" + setting.characters[champ_id].illustdir
}
function golink(link) {
	window.location.href = link
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
function genTable(game) {
	let tables = `
    <div class="divTableRow tablehead">
        <div class="divTableCell">
           
        </div>
        <div class="divTableCell">Name</div>
        <div class="divTableCell">KDA</div>
        <div class="divTableCell">Pos</div>
    </div>`
	for (const p of game.playerSettings) {
		tables += `
        <div class="divTableRow tablerow ${game.isTeam ? (p.team ? "red" : "blue") : ""}">
            <div class="divTableCell charcell">
                <div class="charimg list_charimg"><img src="${getCharImgUrl(p.champ)}"></div>
            </div>
            <div class="divTableCell namecell">${p.name}</div>
            <div class="divTableCell">${p.kill}/${p.death}/${p.assist}</div>
            <div class="divTableCell">${p.pos}</div>
        </div>`
	}

	return tables
}
async function refreshGame(rname) {
	let game = await (await fetch(SERVER_URL + "/room/rpg_game/" + rname)).json()
	if (!game) {
		alert("Game does not exist")
		return
	}
	$("#table_" + rname).html(genTable(game))
}

async function getlist() {
	let games = await (await fetch(SERVER_URL + "/room/all_rpg_games")).json()
	let str = ""
	if (games.games.length === 0) $("#title").html("There are no games currently playing")

	for (const game of games.games) {
		let champs = ""

		for (const p of game.playerSettings) {
			champs += ` <div class="charimg list_charimg ${
				game.isTeam ? (p.team ? "red" : "blue") : ""
			}"><img src="${getCharImgUrl(p.champ)}"></div>`
		}

		str += `
            <div class="onegame-container">
                <div class="game-summary">
                    <div class="game-summary-content">
                        <div class="footer">
                            <img class="refreshgame" data-roomname="${
															game.roomname
														}" src="res/img/svg/refresh.svg"  title="refresh">
                            ${game.roomname}
                        </div>
                        <div>
                            ${champs}
                        </div>
                        <div>
                            <div class="summary_map_icon"><img src="${getMapIconUrl(game.map)}"></div>
                            <div class="summary_map_icon"><img src="res/img/svg/skillinfo/cooltime.svg"></div>:${
															game.totalturns
														}T
                            <button class="purple-btn spectate-btn" data-roomname="${
															game.roomname
														}">${"Spectate"}</button>
                        </div>
                    </div>
                    <div class="toggle-detail" data-toggles="${game.roomname}">
                        <img src="res/img/svg/chevron-down.svg">
                    </div>
                </div>
                <div class="game-detail hidden" id="detail_${game.roomname}">
                    <div class="detail-table">
                        <div class="divTable" >
                            <div class="divTableBody"  id="table_${game.roomname}">
                                ${genTable(game)}
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    `
	}
	$("#container").html(str)

	$(".spectate-btn").off()
	$(".toggle-detail").off()

	$(".spectate-btn").click(async function () {
		let rname = $(this).data("roomname")
		let res = await fetch(SERVER_URL + "/room/spectate_rpg", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ roomname: rname }),
		})
		if (res.status === 404) {
			alert("the game does not exist")
		} else if (res.status === 200) {
			window.location.href = "/rpggame?is_spectator=true"
		}
	})
	$(".toggle-detail").click(function () {
		let rname = $(this).data("toggles")
		$("#detail_" + rname).toggle()
		$(this).toggleClass("open")
	})
	$(".refreshgame").click(function () {
		let rname = $(this).data("roomname")
		refreshGame(rname)
	})
}
let SERVER_URL = ""

async function main(url) {
	SERVER_URL = url
	setting = await (await fetch(SERVER_URL + "/resource/globalsetting")).json()

	getlist()
	$("#refreshbtn").click(function () {
		getlist()
	})
}
