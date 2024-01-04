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
		let value = $(this).val()
		$.ajax({
			method: "POST",
			url: backend_url + "/board/post/reply/delete",
			data: { commentId: value },
		})
			.done(function (data, statusText, xhr) {
				let status = xhr.status
				window.location.reload()
			})
			.fail(function (data, statusText, xhr) {
				alert("error")
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
}
function sendVote(kind, type, id, elem) {
	let vote_count = $(elem).children(".vote_count").eq(0)

	$.ajax({
		method: "POST",
		url: backend_url + "/board/" + kind + "/vote",
		data: { id: id, type: type },
	})
		.done((data, statusText, xhr) => {
			let status = xhr.status
			if (status == 200) {
				if (data.change === 0) alert(type === "up" ? LOCALE.already_like : LOCALE.already_dislike)
				else $(vote_count).html(Number($(vote_count).html()) + data.change)

				if (data.change === 1) {
					$(elem).addClass("active")
				} else if (data.change === -1) {
					$(elem).removeClass("active")
				}
			}
		})
		.fail((data, statusText, xhr) => {
			if (data.status == 401) {
				alert("Login required")
			}
		})
}
