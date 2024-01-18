socket = io()

socket.on("connect", function () {
	console.log("connected")
})

socket.on("server:sim_progress", function (msg) {
	$("#progress").css("width", 400 * msg + "px")
	$("#progresstext").html(Math.floor(msg * 100) + "%")
	//console.log("simulation_progress"+msg)
})
socket.on("server:sim_over", function (status, data) {
	$("#progress").css("width", 400 + "px")
	$("#progresstext").html("100%")
	alert(status)
	let wins = [0, 0, 0, 0]
	let wintypes = new Map()
	let totalturn = 0
	for (const win of data) {
		wins[win.winner] += 1

		if (wintypes.has(win.winType)) wintypes.set(win.winType, wintypes.get(win.winType) + 1)
		else wintypes.set(win.winType, 1)
		totalturn += win.totalturn
	}
	// $("#result").html(String(wins) + "<br>" + String(wintypes) + "<br>" + "avg turn:" + totalturn / data.length)
	let str = ""
	for (let i = 0; i < wins.length; ++i) {
		str += `${i + 1}P: ${wins[i]}/${data.length} wins<br>`
	}
	for (const [type, count] of wintypes.entries()) {
		str += `${type}: ${count}/${data.length} <br>`
	}
	str += "avg turn:" + totalturn / data.length
	$("#result").html(str)

	// $("#result").html(data)
})

$("#run").click(function () {
	socket.emit("user:marble_simulation_ready", Number($("#count").val()), true)
})
