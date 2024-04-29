export function limitString(str?: string, size?: number) {
	if (!str) return ""
	if (!size) size = 15
	return str.length > 15 ? str?.slice(0, 15) + ".." : str
}

export function getTimeAgo(start: string) {
	return getDateStringDifference(new Date(start).valueOf(), Date.now())
}

export function getDateStringDifference(start: number, now: number,lang?:string|null) {
	const ONE_MINUTE = 60 * 1000 // milliseconds in a minute
	const ONE_HOUR = 60 * ONE_MINUTE // milliseconds in an hour
	const ONE_DAY = 24 * ONE_HOUR // milliseconds in a day

	const timeDifference = Math.abs(start - now)

	const days = Math.floor(timeDifference / ONE_DAY)
	const hours = Math.floor((timeDifference % ONE_DAY) / ONE_HOUR)
	const minutes = Math.floor((timeDifference % ONE_HOUR) / ONE_MINUTE)
	const seconds = Math.floor((timeDifference % ONE_MINUTE) / 1000)
	// Build the result string
	let resultString = "Just "
	if(lang==="ko") resultString="방금 "
	if (days > 0) {
		resultString = `${days} day${days > 1 ? "s" : ""} `
		if(lang==="ko") resultString=days +"일 "
	} else if (hours > 0) {
		resultString = `${hours} hr${hours > 1 ? "s" : ""} `
		if(lang==="ko") resultString=hours +"시간 "
	} else if (minutes > 0) {
		resultString = `${minutes} min${minutes > 1 ? "s" : ""} `
		if(lang==="ko") resultString=minutes +"분 "
	}
	return resultString.trim()
}

/**
 *
 * @param end inclusive
 * @param start inclusive
 * @returns
 */
export function range(end: number, start?: number): number[] {
	if (!start) start = 0
	let list: number[] = []
	for (let i = start; i <= end; ++i) {
		list.push(i)
	}
	return list
}
export const sleep = (m: any) => new Promise((r) => setTimeout(r, m))
export function addCommas(num: number): string {
	// Convert the number to a string
	let numStr: string = num.toString()

	// Split the string into integer and decimal parts (if any)
	let parts: string[] = numStr.split(".")

	// Add commas to the integer part
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

	// Join the integer and decimal parts (if any)
	return parts.join(".")
}
const ARG_SYNTAX = "%d"

export function lText(locale: any, lkey: string, args?: (string | number)[]) {
	let text = ""
	if (!lkey) return text
	let classes = lkey.split(".")
	if (classes.length === 0 || !locale)return text
	try {
		let translation = locale
		for (const c of classes) {
			if (!translation)return text
			translation = translation[c]
		}
		if (translation) text = translation
	} catch (e) {}
	if (args) {
		for (const arg of args) {
			text = text.replace(ARG_SYNTAX, String(arg))
		}
	}
	return text
}
