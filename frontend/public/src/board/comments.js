function main(url) {
	updateLocale("board")
	const sortOptions = $("sortoption").toArray()
	let query = new URLSearchParams(window.location.search)
	if (!query.has("sortby") || query.get("sortby") === "new") $("#sort").val("new")
	else if (query.get("sortby") === "old") $("#sort").val("old")
	else if (query.get("sortby") === "upvote") $("#sort").val("upvote")

	$("#sort").change(function () {
		window.location.href = window.location.href.split("?")[0] + "?sortby=" + $(this).val()
	})
	$(".pagebtn").click(function () {
		window.location.href = $(this).val()
	})
	$(".delete_comment").click(function () {
		if (!confirm(LOCALE.msg.confirm_delete)) return

		let value = $(this).val()
		let type = $(this).data("type")
		AxiosApi.post("/board/post/" + type + "/delete", { commentId: value })
			.then((res) => window.location.reload())
			.catch((e) => alert("error"))
	})
}

function golink(link) {
	window.location.href = link
}
