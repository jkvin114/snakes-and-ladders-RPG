let SERVER_URL = ""
function main(url) {
	SERVER_URL = url
	$("#refresh").click(function () {
		fetchdata()
	})
	fetchdata()
}
async function spectate() {
	let rname = $(this).data("roomname")
	AxiosApi.post("/room/spectate_rpg", { roomname: rname })
		.then((res) => {
			if (res.status === 200) window.location.href = "/rpggame?is_spectator=true"
		})
		.catch((e) => {
			if (e.response.status === 404) alert("the game does not exist")
		})
}

async function resetroom() {
	let rname = $(this).data("roomname")

	AxiosApi.post("/admin/reset_room/" + rname, { roomname: rname })
		.then((res) => {
			if (res.status === 200) {
				fetchdata()
				alert("Room successfully reset")
			}
		})
		.catch((e) => {
			if (e.response.status === 404) alert("the game does not exist")
		})
}
/**
 *  name:this.name,
    running:this.isGameRunning,
    started:this.isGameStarted,
    playerlist:this.playerMatchingState.playerlist,
    hosting:this.hosting,
    type:this.type,
    password:this.password,
    loginonly:this.isLoggedInUserOnly,
    isPublic:this.isPublic


    isLogined:boolean
        userId:string
        username:string
        boardDataId:string
        roomname:string
        turn:number
		ip:string
 * 
 **/

function golink(link) {
	window.location.href = link
}

function healthcheck(data) {
	/*
    0 = disconnected
    1 = connected
    2 = connecting
    3 = disconnecting
    99 = uninitialized
    */
	const statuscodes = new Map()
		.set(0, "Disconnected")
		.set(1, "Connected")
		.set(2, "Connecting")
		.set(3, "Disconnecting")
		.set(99, "Uninitialized")

	$("#ping-db").html(statuscodes.get(data.mongodb))
	if (data.mongodb === 1) {
		$("#ping-db").css("color", "green")
	} else $("#ping-db").css("color", "red")

	if (data.marblegame >= 0) {
		$("#ping-marble").css("color", "green")
		$("#ping-marble").html(`Connected (${data.marblegame}ms)`)
	} else {
		$("#ping-marble").css("color", "red")
		$("#ping-marble").html("Disconnected")
		// if(data.marblegame === -1) $("#ping-marble").html("Error")
		// else if(data.marblegame === -2)
	}
}

async function fetchdata() {
	try {
		const rooms = (await AxiosApi.get("/admin/allrooms")).data // (await (await fetch("/admin/allrooms")).json()).data
		const users = (await AxiosApi.get("/admin/allusers")).data //(await (await fetch("/admin/allusers")).json()).data
		let str = ``
		for (const rm of rooms) {
			let players = ""
			for (const player of rm.playerlist) {
				if (player.type !== "none") players += player.type + ","
			}
			str += `
            <tr>
                <td>${rm.name}</td>
                <td>${rm.type}</td>
                <td>${rm.loginonly}</td>
                <td>${rm.isPublic}</td>
                <td>${players}</td>
                <td>${rm.started}</td>
                <td>${rm.running}</td>
                <td><button class="spectatebtn ${rm.running ? "" : "hidden"}" data-roomname='${
				rm.name
			}'>Spectate</button></td>
                <td><button class="resetbtn" data-roomname='${rm.name}'>RESET</button></td>
             </tr>
            `
		}
		$("#room-table").html(str)
		str = ""
		for (const us of users.sessions) {
			// if (!us.ip) continue
			str += `
            <tr>
                <td>${us.username}</td>
                <td>${us.time}</td>
                <td>${us.isLogined}</td>
                <td>${us.roomname}</td>
                <td>${us.turn}</td>
             </tr>
            `
		}
		$("#user-table").html(str)

		str = ""
		for (const us of users.users) {
			// if (!us.ip) continue
			str += `
            <tr>
                <td>${us.username}</td>
                <td>${us.id}</td>
                <td>${us.lastActive}</td>
                <td>${us.sockets.join(",")}</td>
                <td>${us.sessionIds.join(",")}</td>
				<td>${us.chatRooms.join(",")}</td>
             </tr>
            `
		}
		$("#userstatus-table").html(str)

		$(".spectatebtn").click(spectate)
		$(".resetbtn").click(resetroom)
	} catch (e) {
		console.error(e)
		alert("error")
	}
}
