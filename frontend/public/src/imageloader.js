//temporary function to load server images from raw html and ejs files
function loadImg() {
	let elems = document.querySelectorAll(".uploaded-image")
	for (const e of elems) {
		let src = e.dataset.src
		if (!src) continue
		e.src = server_url + "/resource/image/" + src
	}

	let elems2 = document.querySelectorAll(".uploaded-profile-image")
	for (const e of elems2) {
		let src = e.dataset.src
		if (!src) continue
		e.src = server_url + "/resource/profileimage/" + src
	}
}
loadImg()
