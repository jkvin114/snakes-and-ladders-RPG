async function testGetskill() {
	await SkillParser.init("./../res/locale/game/", "/resource/skill", "ko")
	// SkillParser.MODE = "fillvalue"
	for (let i = 0; i < 10; ++i) {
		for (let j = 0; j < 3; ++j) {
			let desc = SkillParser.parseSkill(i, j)
			$("#test").append(`<div class=skillinfo>${desc}</div><hr>`)
		}
	}
	// SkillParser.populateSkillValues({ Q: 10, W: 40, R: 100 })
}

class SkillParser {
	static EFFECTS
	static LANG = "en"
	static IconPath = "res/img/svg/skillinfo/"
	static MODE = "novalue"
	static descriptions
	static SeparateSection = false
	static SimpleReplaces = [
		{
			formatstr: "currhp",
			iclass: "health",
			icon: "currhp.svg",
			locale: ["Current HP", "현재체력"],
		},
		{
			formatstr: "maxhp",
			iclass: "health",
			icon: "maxhp.png",
			locale: ["Maximum HP", "최대체력"],
		},
		{
			formatstr: "missinghp",
			iclass: "health",
			icon: "missinghp.png",
			locale: ["Missing HP", "잃은체력"],
		},
		{
			formatstr: "target",
			iclass: "emphasize",
			icon: "target.svg",
			locale: ["target", "대상"],
		},
		{
			formatstr: "place",
			iclass: "emphasize",
			icon: "pos.png",
			locale: ["place", "설치"],
		},
		{
			formatstr: "basicattack",
			iclass: "emphasize",
			icon: "basicattack.png",
			locale: ["basic attack", "기본 공격"],
		},
	]
	static ValuedReplaces = [
		{
			formatstr: "heal",
			iclass: "heal",
			icon: "heal.png",
			locale: ["$1 HP", "체력 $1"],
		},
		{
			formatstr: "shield",
			iclass: "shield",
			icon: "shield.svg",
			locale: ["$1 shield", "방어막 $1"],
		},
		{
			formatstr: "radius",
			iclass: "emphasize",
			icon: "around.svg",
			locale: ["within $1 squares", "반경 $1칸 이내"],
		},
		{
			formatstr: "projsize",
			iclass: "emphasize",
			icon: "size.png",
			locale: [` size $1`, `$1칸 크기 `],
		},
		{
			formatstr: "pdmg",
			iclass: "pdmg",
			icon: "pdamage.png",
			locale: [`$1 attack damage`, `$1 물리 피해 `],
		},
		{
			formatstr: "mdmg",
			iclass: "mdmg",
			icon: "mdamage.png",
			locale: [`$1 magic damage`, `$1 마법 피해 `],
		},
		{
			formatstr: "fdmg",
			iclass: "tdmg",
			icon: "fdamage.png",
			locale: [`$1 fixed damage`, `$1 고정 피해 `],
		},
		{
			formatstr: "money",
			iclass: "money",
			icon: "money.png",
			locale: [`$1 gold`, `$1 골드`],
		},
		{
			formatstr: "area",
			iclass: "emphasize",
			icon: "area.png",
			locale: [`Select $1 Squares`, `$1 칸 범위를 선택`],
		},
	]
	/**
	 * fillvalue: fill scaled values with actual numbers
	 * scalevalue: fill scaled values with scale description
	 * undefined/novalue: default. leave scaled values empty => novalue
	 */

	static hotkeys = ["Q", "W", "R"]
	static skills
	static SkillImagePath = "res/img/skill/"
	static localePath

	static chooseLang(en, ko) {
		if (SkillParser.LANG === "ko") return ko
		else return en
	}
	static async init(localepath, datapath, lang) {
		if (datapath !== "") {
			const skilldata = await (await fetch(datapath)).json()
			SkillParser.skills = skilldata
		}
		if (localepath !== "") {
			const data = await (await fetch(localepath + lang + ".json")).json()
			SkillParser.localePath = localepath
			SkillParser.EFFECTS = data.statuseffect_data
			SkillParser.descriptions = data.skills
		}
		SkillParser.LANG = lang
	}
	static updateLocale(lang) {
		SkillParser.LANG = lang
	}
	static parseSkill(charId, skillId) {
		if (!SkillParser.descriptions || !SkillParser.EFFECTS) {
			console.error("SkillParser is not initialized")
			return ""
		}
		return SkillParser.parse(SkillParser.descriptions[charId][skillId], SkillParser.skills[charId][skillId], skillId)
	}

	static populateSkillValues(variables) {
		for (const [k, v] of Object.entries(variables)) {
			$(".skillvalue_" + k).html(v)
		}
	}

	/**
	 *
	 * @param {*} locale locale json
	 * @param {*} data skill data json
	 * @param {*} i skill id : 0~2
	 */
	static parse(locale, data, i) {
		if (!this.MODE) this.MODE = "novalue"
		// this.MODE = "fillvalue"
		let header =
			`<i class='braket'>[${this.hotkeys[i]}]</i><i class='skill_name'>[${locale.name}]&emsp; </i>` +
			(this.SeparateSection ? "<hr>" : "<br>") +
			`<i class='cooltime'><img src='${this.IconPath}cooltime.svg'>${this.chooseLang("cooltime", "쿨타임")}: ${
				data.cool
			} ${this.chooseLang("turns", "턴")}</i>`
		if (data.range !== undefined) {
			header += `<i class='range'>&ensp;<img src='${this.IconPath}range.png'>${this.chooseLang(
				"Range: ",
				"사정거리: "
			)}${data.range} ${this.chooseLang("", "칸 ")}</i>`
		}
		if (data.dur !== undefined) {
			header += `<i class='emphasize'>&ensp;<img src='${this.IconPath}duration.png'>${this.chooseLang(
				"Duration: ",
				"지속시간: "
			)}${data.dur} ${this.chooseLang("turns", "턴 ")}</i>`
		}
		header += this.SeparateSection ? "<hr>" : "<br>"

		let desc = header + locale.desc
		const fixedvalues = desc.matchAll(/\(fv:([a-zA-Z_-]+)\)/g)
		for (const fv of fixedvalues) {
			// console.log(fv[1])
			if (data.fixedvalues[fv[1]] === undefined) {
				desc = desc.replaceAll(`(fv:${fv[1]})`, "?")
			} else {
				desc = desc.replaceAll(`(fv:${fv[1]})`, data.fixedvalues[fv[1]])
			}
		}
		const scaledvalues = desc.matchAll(/\(sv:([a-zA-Z_-]+)\)/g)
		for (const sv of scaledvalues) {
			// console.log(fv[1])
			const key = sv[1]
			desc = desc.replaceAll(
				`(sv:${key})`,
				"<i class='scaled_value skillvalue_" +
					key +
					"' value=" +
					key +
					">" +
					(this.MODE === "fillvalue" ? "?" : "") +
					"</i>"
			)
		}

		desc = desc.replace(/\^{(.+?)}/g, "<i class='emphasize_simple'>$1</i>")
		desc = desc.replace(/\+{(.+?)}/g, "<i class='up'><img src='" + this.IconPath + "up.png'>$1</i>")
		desc = desc.replace(/\-{(.+?)}/g, "<i class='down'><img src='" + this.IconPath + "down.png'>$1</i>")
		desc = desc.replace(
			"{active}",
			`${this.SeparateSection ? "<hr>" : "<br>"}<i class='braket'>[${this.chooseLang("On Use", "사용시")}]</i>`
		)
		desc = desc.replaceAll("{passive}", `<i class='braket'>[${this.chooseLang("Passive", "기본 지속 효과")}]</i>`)
		desc = desc.replace(/{skillvalue:(.+)}/g, `<i class='skillvalue_$1'></i>`)

		if (!this.EFFECTS) {
			desc = desc.replace(/{effect:[0-9]+}/, "?")
		} else {
			const effects = desc.matchAll(/{effect:([0-9]+)}/g)
			for (const ef of effects) {
				const id = Number(ef[1].slice(0, 2))
				const dur = Number(ef[1].slice(2, 4))
				const thiseffect = this.EFFECTS[id]
				let toreplace = "<i class='badeffect info_effect' value='" + id + "'>"
				if (thiseffect.good) {
					toreplace = "<i class='goodeffect info_effect' value='" + id + "'>"
				}
				if (dur === 0) desc = desc.replaceAll(`{effect:${ef[1]}}`, toreplace + `${thiseffect.name}</i>`)
				else
					desc = desc.replaceAll(
						`{effect:${ef[1]}}`,
						toreplace + `${thiseffect.name} ${dur} ${this.chooseLang(dur > 1 ? "turns" : "turn", "턴")}</i>`
					)
			}
		}
		if (!this.skills) desc = desc.replace(/{skill:[0-9]+}/, "?")
		else {
			const skills = desc.matchAll(/{skill:([0-9]+)}/g)
			for (const sk of skills) {
				// console.log(sk[1])
				const charId = Number(sk[1].slice(0, 2))
				const skillId = Number(sk[1].slice(2, 3))
				// console.log(charId, skillId)
				const skill_name = this.descriptions[charId - 1][skillId - 1].name
				const img = this.SkillImagePath + charId + "-" + skillId + ".jpg"

				let toreplace = `<img class='info_skillimg' src='${img}'><i class='skill_name_desc'>${skill_name}</i>`
				desc = desc.replaceAll(`{skill:${sk[1]}}`, toreplace)
			}
		}

		for (const repl of this.SimpleReplaces) {
			desc = desc.replaceAll(
				`{${repl.formatstr}}`,
				`<i class='${repl.iclass}'><img src='${this.IconPath + repl.icon}'> ${this.chooseLang(...repl.locale)}</i>`
			)
		}
		for (const repl of this.ValuedReplaces) {
			let reg = new RegExp("{" + repl.formatstr + ":(.+?)}", "g")
			desc = desc.replace(
				reg,
				`<i class='${repl.iclass}'><img src='${this.IconPath + repl.icon}'> ${this.chooseLang(...repl.locale)}</i>`
			)
		}

		desc = desc.replace(/(?![^<>]+>)(\d+)(?!\d)/g, "<b>$1</b>") //wraps all numbers that is not a tag attribute
		return desc
	}
}
