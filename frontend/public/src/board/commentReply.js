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

	$(".delete_comment").click(function () {
		if (!confirm(LOCALE.msg.confirm_delete)) return

		let value = $(this).val()
		AxiosApi.post("/board/post/reply/delete", { commentId: value })
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

	$(".replyvote").click(function () {
		let type = $(this).data("type")
		let id = $(this).data("id")
		sendVote("reply", type, id, $(this))
	})
	$(".commentvote").click(function () {
		let type = $(this).data("type")
		let id = $(this).data("id")
		sendVote("comment", type, id, $(this))
	})
	$("#commentform").on("submit", writeComment)
}
function writeComment(e) {
	e.preventDefault()
	let commentId = $(this).find("input[name='commentId']").val()
	let content = $(this).find("input[name='content']").val()

	let url = "/board/post/comment/reply"
	AxiosApi.post(url, {
		commentId: commentId,
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
