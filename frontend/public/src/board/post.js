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
		let value = $(this).val()
		$.ajax({
			method: "POST",
			url: backend_url + "/board/post/comment/delete",
			data: { commentId: value },
		})
			.done(function (data, statusText, xhr) {
				let status = xhr.status
				if (status == 200) {
					window.location.reload()
				}
			})
			.fail(function (data, statusText, xhr) {
				if (data.status == 401) {
					alert("unauthorized")
				} else {
					alert("error")
				}
			})
	})
	$(".delete_post").click(function () {
		if (!confirm("Are you sure you want to delete?")) return

		let value = $(this).data("id")
		$.ajax({
			method: "POST",
			url: backend_url + "/board/post/delete",
			data: { id: value },
		})
			.done(function (data, statusText, xhr) {
				let status = xhr.status
				if (status == 201) {
					window.location.href = "/board/"
				}
			})
			.fail(function (data, statusText, xhr) {
				if (data.status == 401) {
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
		$.ajax({
			method: "POST",
			url: backend_url + "/board/bookmark",
			data: { id: $(this).data("postid") },
		})
			.done((data, statusText, xhr) => {
				let status = xhr.status
				if (status == 200) {
					if (data.change === 1) {
						$(this).addClass("active")
						$(this).removeClass("inactive")
					} else if (data.change === -1) {
						$(this).addClass("inactive")
						$(this).removeClass("active")
					}
				}
			})
			.fail((data, statusText, xhr) => {
				if (data.status == 401) {
					alert("Login required")
				}
			})
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
				if (data.change === 0) alert(`You already ${type === "up" ? "down" : "up"}voted.`)
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
