$(document).ready(async function () {
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
})
async function joinRoom(name, password) {
	let res = await fetch("/room/verify_join", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ roomname: name, password: password, username: sessionStorage.nickName }),
	})

	if (res.status === 404) {
		alert("the room does not exist")
	} else if (res.status === 401) {
		let msg = await res.json()
		console.log(msg)
		if (msg.message === "password") {
			$("#password-window").data("roomname", name)
			$("#password-window").show()
			if (password !== "") alert("wrong password")
		} else if (msg.message === "login") {
			alert("This room requires login")
		}
	} else if (res.status === 200) {
		// alert("verified")
		window.location.href = "/matching.html?join=true&roomname=" + name
	}
}

async function getRooms() {
	$("#loading").show()
	let rooms = (await (await fetch("/room/hosting")).json()).rooms

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
}

function golink(link) {
	window.location.href = link
}
