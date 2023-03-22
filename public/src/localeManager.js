let LOCALE = null

const DEFAULT_LANG = "en"
const updateLocale = async function (page, lang) {
	let la = DEFAULT_LANG
	if (lang === undefined) {
		if (sessionStorage.language === "eng") la = "en"
		else if (sessionStorage.language === "kor") la = "ko"
	} else la = lang
	try {
		LOCALE = await fetch(`/res/locale/${page}/${la}.json`).then((response) => response.json())
		Object.freeze(LOCALE)
		console.log(LOCALE)
	} catch (e) {
		console.error(e)
		return
	}

	document.querySelectorAll("[lkey]").forEach((element) => {
		let key = element.getAttribute("lkey")
		let classes = key.split(".")
		if (classes.length === 0) return

		let translation = LOCALE
		for (const c of classes) {
			translation = translation[c]
		}
		if (translation) element.innerText = translation
	})

	//replacing placeholders
	document.querySelectorAll("[lkey-ph]").forEach((element) => {
		let key = element.getAttribute("lkey-ph")
		let classes = key.split(".")
		if (classes.length === 0) return

		let translation = LOCALE
		for (const c of classes) {
			translation = translation[c]
		}
		if (translation) element.placeholder = translation
	})
}
