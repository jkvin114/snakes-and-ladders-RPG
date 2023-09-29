$(document).ready(async function () {
	let data = await fetch("/stat/marble/all")
	const stats = await data.json()
	console.log(stats)
	let html = ""
	for (const game of stats.reverse()) {
		html += drawOneGameStat(game)
	}
	$("#stat-container").html(html)
})
function getWinType(win) {
	let wintype = "파산"
	if (win === "triple") wintype = "트리플 독점"
	if (win === "line") wintype = "라인 독점"
	if (win === "sight") wintype = "관광지 독점"
	return wintype
}
function getMapName(map) {
	if (map === "god_hand") return "신의손"
	return "월드맵"
}

function drawOneGameStat(stats) {
	const winner = stats.players[stats.winner]

	let winnerhtml = `
    <div class="stat-player winner">
        <div class="stat-player-name">
            <img src="res/trophy.svg">${winner.name ? winner.name : stats.winner + 1 + "P"}</div>
        <div class="stat-player-score">${winner.score}</div>
        <div>
            <div class="stat-player-detail-btn" data-game=${stats._id} data-player=${
		stats.winner
	}><img src="res/zoom-in.svg"></div>
        </div>
    </div>`
	let loserhtml = ""
	for (let i = 0; i < stats.players.length; ++i) {
		if (i === stats.winner) continue
		const player = stats.players[i]
		loserhtml += `
        <div class="stat-player">
            <div class="stat-player-name">
                ${player.name ? player.name : i + 1 + "P"}</div>
            <div class="stat-player-score">${player.score}</div>
            <div>
                <div class="stat-player-detail-btn" data-game=${
									stats._id
								} data-player=${i}><img src="res/zoom-in.svg"></div>
            </div>
        </div>`
	}
	for (let i = stats.players.length; i < 4; ++i) {
		loserhtml += `
        <div class="stat-player">
            <div class="stat-player-name">
                &nbsp;</div>
            <div class="stat-player-score"> &nbsp;</div>
            <div>
            </div>
        </div>`
	}

	let html = `<div class="stat-game">
        <div class="stat-win">
            ${getWinType(stats.winType)} 승리
            <a style="color:white;">${getMapName(stats.map)}</a>
            <a>${new Date(stats.createdAt).toLocaleString()}</a>
        </div>
        <div class="stat-player-container">
            ${winnerhtml}
            ${loserhtml}
        </div>
    </div>`
	return html
}
