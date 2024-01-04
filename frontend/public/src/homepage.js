const names = [
	"Annonymous",
	"Illuminati",
	"Challenger",
	"Iron",
	"Grandmaster",
	"NoobMaster",
	"Newbie",
	"Hacker",
	"Luke",
	"Leia",
	"Anakin",
	"Rey",
	"Finn",
	"Harry",
	"Obi-Wan",
	"Hermione",
	"HanSolo",
	"Chewbacca",
	"Windu",
	"Palpatine",
	"Grogu",
	"Ron",
	"Malfoy",
	"Voldemote",
	"Dumbledore",
	"Hagrid",
	"Hedwig",
	"Snape",
	"Gandalf",
	"Saruman",
	"Frodo",
	"Sam",
	"Marry",
	"Pippin",
	"Legolas",
	"Gimli",
	"Bormir",
	"Sauron",
	"Stark",
	"Steve",
	"Peter",
	"Natasha",
	"Clint",
	"Bruce",
	"Gamora",
	"Drax",
	"Groot",
	"Thanos",
	"Thor",
	"Loki",
	"Wanda",
	"Odin",
	"Yangyi",
	"Gorae",
	"Creed",
	"Silver",
	"Jean",
	"Timo",
	"Jellice",
	"Faker",
	"Undefined",
	"Null",
	"NAN",
]

function golink(link) {
	window.location.href = link
}

let SERVER_URL = ""

async function main(server_url) {
	SERVER_URL = server_url
	let query = new URLSearchParams(window.location.search)
	if (query.get("top500movies") === "true") {
		window.location.port = 3000
		return
	}
	try {
		let response = await axios.post(SERVER_URL + "/room/home")
		if (response.data.config) {
			if (response.data.config.board) $("#postbtn").show()
			if (response.data.config.simulation) $("#simulation").show()
			if (response.data.config.marble) $("#marble").show()
		}
		if (response.data.reconnect) {
			showReconnectBtn()
		}
		$("footer").html(` <a>version: ${response.data.version}</a>, <a>patch: ${response.data.patch}</a>
		<br><a>Created by Yejoon Jung, jkvin114@gmail.com</a>`)
		if (response.data.config && !sessionStorage.language) updateLocale("home", response.data.config.defaultLocale)
		else updateLocale("home")
	} catch (e) {
		console.log(e)
		throw Error("Service Unavaliable! " + e)
		// alert("Service")
	}
	//checks if user is also maintaing login status in server
	if (localStorage.getItem("username") != null && sessionStorage.getItem("jwt")) {
		let response = await axios.post(
			SERVER_URL + "/user/current",
			{},
			{
				headers: { Authorization: `Bearer ${sessionStorage.getItem("jwt")}` },
			}
		)
		if (response.data === "") {
			localStorage.removeItem("username")
			localStorage.removeItem("loggedin")
			window.location.reload()
			return
		}
	}

	$("#firstpage").show()
	let page = document.location.href.match(/page=([^&]+)/)
	if (page && page[1] === "login") {
		//  delete sessionStorage.username
	} else if (localStorage.getItem("username") != null) {
		setAsLogin(localStorage.getItem("username"))
	}

	$("input[name='ip']").val(window.location.href.split("://")[1].split("/")[0])

	$("#langbtn").click(function () {
		$(".lang_dropdown").toggle()
	})

	$(".dropitem").click(function () {
		$(".lang_dropdown").hide()
		let lang = $(this).attr("value")
		sessionStorage.language = lang
		updateLocale("home", lang)
		//	window.location.reload()
	})
	$("#quitbtn").click(function () {
		try {
			android.quit()
		} catch (e) {}
	})

	window.onbeforeunload = function (e) {}
	$("#postbtn").click(() => (window.location.href = "/board"))
	/*
	$("#loginform").submit(function (e) {
		e.preventDefault()

		let username = $(this).find("input[name='username']").val()
		let password = $(this).find("input[name='password']").val()
		if (username === "" || password === "") {
			// alert("")
			return
		}
		$(".input_alert").html("")

		axios
			.post(SERVER_URL + "/user/login", { username: username, password: password })
			.then(function (res) {
				let status = res.status
				if (res.data === "username") {
					$(".input_alert.login_id").html(LOCALE.error.username)
				} else if (res.data === "password") {
					$(".input_alert.login_pw").html(LOCALE.error.password)
				} else if (status === 200) {
					let redirect = document.location.href.match(/redirect=([^&]+)/)
					setAsLogin(username)
					if (redirect) {
						window.location.href = redirect[1]
					}
					//  alert("Logged in")
				}
			})
			.catch(function (e) {
				alert("server error" + e)
			})
	})

	$("#registerform").submit(function (e) {
		e.preventDefault()

		$(".input_alert").html("")
		let username = $(this).find("input[name='username']").val()
		let password = $(this).find("input[name='password']").val()
		let password2 = $(this).find("input[name='password2']").val()
		let email = $(this).find("input[name='email']").val()
		if (username === "" || password === "" || password2 === "" || email === "") {
			// alert("Empty")
			return
		}
		if (password !== password2) {
			$(".input_alert.register_pw").html(LOCALE.error.password)
			return
		}
		if (email.match(/[^@]+@[^.]+\.[a-z]+/) == null) {
			$(".input_alert.register_email").html(LOCALE.error.email)
			return
		}

		let data = { username: username, password: password, email: email }

		$.ajax({
			method: "POST",
			url: SERVER_URL + "/user/register",
			data: data,
		})
			.done(function (res, statusText, xhr) {
				let status = xhr.status
				console.log(res)
				console.log(statusText)
				console.log(xhr)

				if (status === 200) {
					alert("Registered")
					window.location.href = "/?page=login"
				}
			})
			.fail(function (res, statusText, xhr) {
				console.log(res)
				console.log(res.responseText)
				console.log(xhr.status)

				let status = res.status
				if (status === 400) {
					if (res.responseText === "username") {
						$(".input_alert.register_id").html(LOCALE.error.username_length)
					} else if (res.responseText === "password") {
						$(".input_alert.register_pw").html(LOCALE.error.password_condition)
					} else if (res.responseText === "duplicate username") {
						$(".input_alert.register_id").html(LOCALE.error.username_duplicate)
					}
				} else {
					alert("server error, status:" + status)
				}
			})
	})
	*/
}

function showReconnectBtn() {
	$("#join").hide()
	// $("input").hide()
	$("#simulation").hide()
	$("#spectate").hide()
	$("#open_create_room").hide()
	$("#reconnect").show()
	$("#create_room_open").hdie()
}
function chooseLang(eng, kor) {
	return sessionStorage.language === "kor" ? kor : eng
}

function mypage() {
	window.location.href = "/user/"
}

function setAsLogin(username) {
	localStorage.setItem("username", username)
	localStorage.setItem("loggedIn", true)
	console.log(username)
	$(".page").hide()

	$("#firstpage").show()
	$("#input-username").hide()
	$(".input_alert").html("")
	$("#loginbtn").hide()
	$("#mypagebtn").show()
	$("input[name='nickname']").val(username)
	$("#logged_in_username p").html("Welcome, <b id='myname'>" + username + "</b>")
}

function redirectFromUrlIfPossible() {
	// let redirect = document.location.href.match(/redirect=([^&]+)/)
	// console.log(redirect)
	// if (redirect) {
	// 	window.location.href = redirect[1]
	// }
}

function logout() {
	localStorage.removeItem("username")
	localStorage.removeItem("loggedIn")
	$.ajax({
		method: "POST",
		url: SERVER_URL + "/user/logout",
	}).done(() => {
		alert("Logged out")
		window.location.reload()
	})

	// alert("Logged out")
	// $("#loginbtn").show()
	// $("#logoutbtn").hide()
	// $("input[name='nickname']" ).val("")
}
function open_firstpage() {
	window.location.href = "/"
}
function open_login() {
	window.location.href = "/login"
}
function open_signup() {
	$(".page").hide()

	$("#signuppage").css("display", "inline-block")
}
function open_createroom() {
	$("#field").css("display", "inherit")
	$("#buttons").hide()
	// $("#simulation").hide()
	$("#lowbtns").hide()
	$("#ip_area").hide()
	$("#title").hide()
	//  $("#input-username").hide()
}
function close_createroom() {
	$("#field").css("display", "none")
	$("#buttons").show()
	// $("#simulation").show()
	$("#lowbtns").show()
	$("#title").show()
	// $("#input-username").show()

	// $("#ip_area").show()
}
function createroom(isMarble) {
	console.log("create room")
	let roomName = $("input[name='room_name']").val()
	let password = $("input[name='room_password']").val()
	let isprivate = $("input[name='room_private']").prop("checked")
	let loggedinOnly = $("input[name='room_loggedin_only']").prop("checked")

	// if(!r || r===""){
	//   r="room_"+String(Math.floor(Math.random()*1000000))
	// }
	// sessionStorage.roomName=r
	if (!roomName) {
		roomName = ""
	}

	let n = $("input[name='nickname']").val()
	if (!n || n === "") {
		let l = names.length - 1
		n = names[Math.floor(Math.random() * l)]
		n += String(Math.floor(Math.random() * 10))
	}

	sessionStorage.ip_address = $("input[name='ip']").val()
	sessionStorage.nickName = n
	// sessionStorage.turn=0
	// sessionStorage.host="true"
	// window.location.href="matching.html"

	$.ajax({
		method: "POST",
		url: SERVER_URL + "/room/create",
		data: {
			roomname: roomName,
			username: n,
			type: isMarble ? "marble" : "rpg",
			password: password,
			isPrivate: isprivate,
			loggedinOnly: loggedinOnly,
		},
	})
		.done(function (data, statusText, xhr) {
			let status = xhr.status
			console.log(status)

			if (status == 201) {
				window.location.href = "matching.html?gametype=" + (isMarble ? "marble" : "rpg")
			}
			if (status == 307) {
				window.location.href = "gamepage.html"
			}
		})
		.fail(function (data, statusText, xhr) {
			// console.log(data)
			if (data.status == 400) {
				alert(LOCALE.error.roomname_duplicate)
			}
			if (data.status == 500) {
				alert("Service unavaliable")
			}
		})
}

function toStatpage() {
	// sessionStorage.ip_address = $("input[name='ip']").val()

	window.location.href = "/stat"
}
// function changelang(){
//   if(sessionStorage.language==="eng"){
//     sessionStorage.language="kor"
//     alert("Changed to Korean")
//     // $("#changelang").html("Change to English")
//   }
//   else{
//     sessionStorage.language="eng"
//     alert("Changed to English")
//     // $("#changelang").html("Change to Korean")
//   }

// }

function tolocalhost() {
	$("input[name='ip']").val("127.0.0.1:4000")
}

function join() {
	let n = $("input[name='nickname']").val()
	if (!n || n === "") {
		let l = names.length
		n = names[Math.floor(Math.random() * l)]
		n += String(Math.floor(Math.random() * 10))
	}

	sessionStorage.nickName = n
	window.location.href = "/find_room"
}
function simulation() {
	let r = "simulation_" + String(Math.floor(Math.random() * 1000000))

	sessionStorage.ip_address = $("input[name='ip']").val()

	window.location.href = "simulation_selection_page.html"
}
// function toGamepage() {
// 	window.location.href = "gamepage.html"
// }
