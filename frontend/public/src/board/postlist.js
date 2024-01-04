function golink(link) {
	window.location.href = link
}

function main(url) {
	updateLocale("board")
	$(".pagebtn").click(function () {
		let type = $(this).data("displaytype")
		let params = $(this).data("params")
		let username = $(this).data("username")
		switch (type) {
			case "all":
				window.location.href = "/board" + params
				break
			case "user":
				window.location.href = `/board/user/${username}/posts` + params
				break
			case "userlikes":
				window.location.href = `/board/user/${username}/likes` + params
				break
			case "bookmarks":
				window.location.href = `/board/user/${username}/bookmarks` + params
				break
		}
	})
}
