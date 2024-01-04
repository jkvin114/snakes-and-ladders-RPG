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
		$.ajax({
			method: "POST",
			url: url + "/board/post/" + type + "/delete",
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
}

function golink(link) {
	window.location.href = link
}
