function golink(link) {
	window.location.href = link
}
function goLoginPage() {
	golink("/login?redirect=" + window.location.pathname)
}

let backend_url = ""
function main(url) {
	backend_url = url
	updateLocale("board")

	$("#postlistbtn").click(() => {
		window.location.href = "/board"
	})

	$(".delete_comment").click(function () {
		if (!confirm(LOCALE.msg.confirm_delete)) return

		let value = $(this).val()
		AxiosApi.post("/board/post/comment/delete", { commentId: value })
			.then((res) => {
				if (res.status == 200) {
					window.location.reload()
				}
			})
			.catch((e) => {
				if (e.response.status == 401) {
					alert("unauthorized")
				} else {
					alert("error")
				}
			})
	})
	$(".delete_post").click(function () {
		if (!confirm(LOCALE.msg.confirm_delete)) return

		let value = $(this).data("id")
		AxiosApi.post("/board/post/delete", { id: value })
			.then((res) => {
				if (res.status == 200) {
					window.location.href = "/board/"
				}
			})
			.catch((e) => {
				if (e.response.status == 401) {
					alert("unauthorized")
				} else {
					alert("error")
				}
			})
	})
	$(".postvote").click(function () {
		let type = $(this).data("type")
		let id = $(this).data("id")
		sendVote("post", type, id, $(this))
	})
	$(".commentvote").click(function () {
		let type = $(this).data("type")
		let id = $(this).data("id")
		sendVote("comment", type, id, $(this))
	})
	$(".bookmark").click(function () {
		AxiosApi.post("/board/bookmark", { id: $(this).data("postid") })
			.then((res) => {
				if (res.status == 200) {
					if (res.data.change === 1) {
						$(this).addClass("active")
						$(this).removeClass("inactive")
					} else if (res.data.change === -1) {
						$(this).addClass("inactive")
						$(this).removeClass("active")
					}
				}
			})
			.catch((e) => {
				if (e.response.status == 401) {
					alert("Login required")
				}
			})
	})
	$("#commentform").on("submit", writeComment)
}

function writeComment(e) {
	e.preventDefault()
	let postUrl = $(this).find("input[name='postUrl']").val()
	let postId = $(this).find("input[name='postId']").val()
	let content = $(this).find("input[name='content']").val()

	let url = "/board/post/comment"
	AxiosApi.post(url, {
		postUrl: postUrl,
		postId: postId,
		content: content,
	})
		.then((res) => {
			window.location.reload()
		})
		.catch((e) => {
			console.log(e)
			if (e.response.status === 401) alert("unauthorized")

			throw Error(e)
		})
}
function sendVote(kind, type, id, elem) {
	let vote_count = $(elem).children(".vote_count").eq(0)
	AxiosApi.post("/board/" + kind + "/vote", { id: id, type: type })
		.then((res) => {
			const data = res.data
			if (res.status == 200) {
				if (data.change === 0) alert(`You already ${type === "up" ? "down" : "up"}voted.`)
				else $(vote_count).html(Number($(vote_count).html()) + data.change)
				if (data.change === 1) {
					$(elem).addClass("active")
				} else if (data.change === -1) {
					$(elem).removeClass("active")
				}
			}
		})
		.catch((e) => {
			if (e.response.status == 401) {
				alert("Login required")
			}
		})
}
