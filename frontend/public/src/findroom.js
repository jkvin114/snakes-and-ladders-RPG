let SERVER_URL = ""
async function main(url) {
	SERVER_URL = url
	// const socket = io(url, {
	// 	withCredentials: true,
	//     query: { type: "findroom" }
	// })

	// socket.on("connect", function () {
	// 	console.log("socket")
	// })

	$("#refreshbtn").click(function () {
		getRooms()
	})
	$("#password-confirm").click(function () {
		let name = $("#password-window").data("roomname")
		$("#password-window").hide()

		joinRoom(name, $("#password").val())
		$("#password").val("")
	})
	$("#password-cancel").click(function () {
		$("#password-window").hide()
	})
	getRooms()
}
async function joinRoom(name, password) {
	// let res = await fetch(SERVER_URL + "/room/verify_join", {
	// 	method: "POST",
	// 	headers: {
	// 		"Content-Type": "application/json",
	// 	},
	// 	body: JSON.stringify({ roomname: name, password: password, username: sessionStorage.nickName }),
	// })
	AxiosApi.post("/room/verify_join", {
		roomname: name,
		password: password,
		username: "",
	})
		.then((res) => {
			window.location.href = "/match?join=true&roomname=" + name
		})
		.catch((e) => {
			if (e.response.status === 404) {
				alert("the room does not exist")
			} else if (e.response.status === 401) {
				console.log(e.response.data)
				if (e.response.data.message === "password") {
					$("#password-window").data("roomname", name)
					$("#password-window").show()
					if (password !== "") alert("wrong password")
				} else if (e.response.data.message === "login") {
					alert("This room requires login")
				}
			}
		})
}

async function getRooms() {
	$("#loading").show()
	//let rooms = (await (await fetch(SERVER_URL + "/room/hosting")).json()).rooms

	AxiosApi.get("/room/hosting")
		.then((res) => {
			console.log(res)
			let rooms = res.data.rooms
			if (rooms.length === 0) $("#emptyroom").show()
			else $("#emptyroom").hide()
			$("#loading").hide()
			let str = `<div class="divTableRow tablehead">
					<div class="divTableCell">Game Type</div>
					<div class="divTableCell">Room Name</div>
					<div class="divTableCell">Space</div>
				</div>    `
			for (const rm of rooms) {
				str += `
			<div class="divTableRow tablerow oneroom" data-roomname='${rm.name}'>
				<div class="divTableCell">${rm.type}</div>
				<div class="divTableCell">
				${rm.hasPassword ? ' <img src="res/img/ui/lock.png" class="icon-img">' : ""}
				${rm.loginonly ? ' <img src="res/img/ui/confirm.png" class="icon-img">' : ""}
				${rm.name}</div>
				<div class="divTableCell">${rm.hosting}</div>
			</div>`
			}
			$("#table-container").html(str)
			$(".oneroom").off()
			$(".oneroom").click(async function () {
				let name = $(this).data("roomname")
				joinRoom(name, "")
			})
		})
		.catch((e) => console.error(e))
}

function golink(link) {
	window.location.href = link
}
