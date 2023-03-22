import type { Player } from "../player/player"

import {statuseffect as statuseffect } from "../../res/string_resource.json"
import {statuseffect as statuseffect_kor } from "../../res/string_resource_kor.json"
import * as ENUM from "../data/enum"
import  * as SkillDescription from"../../res/skill_description.json"



export class SkillInfoFactory {
	static readonly LANG_ENG = 0
	static readonly LANG_KOR = 1
	private char: number
	private plyr: Player
	private names: string[]
	private lang: number
	static readonly SKILL_NAME = [
		["Scythe Strike", "Reaping Wind", "Grave Delivery"],
		["Mace Attack", "Tanut", "Strengthen"],
		["Blind Curse", "Phantom Menace", "Poison Bomb"],
		["Claw Strike", "Regeneration", "Burning at the Stake"],
		["Gunfire", "Net Trap", "Target Locked"],
		["Chain Lightning", "Burning Spellbook", "Dark Magic Circle"],
		["Tenacle Strike", "Protective Water", "Predation"],
		["Beak Attack", "Baby Birds", "Phenix Transform"],
		["Sweet Fruit", "Vine Trap", "Root Prison"],
		["Vulnerability Attack","Remote Control","Extraction"]
	]
	static readonly SKILL_NAME_KOR = [
		["절단", "바람 가르기", "태풍"],
		["암흑의 철퇴", "도발", "실버의 갑옷"],
		["실명", "재빠른 이동", "죽음의 독버섯"],
		["양이의 손톱", "양이의 고민", "양이의 불"],
		["원거리 소총", "덫 함정", "저격수의 극장"],
		["직선 번개", "몸체 고정", "마법진 파티"],
		["촉수 채찍", "보호의 물", "블랙홀"],
		["날렵한 부리", "아기새 소환", "불사조 소환"],
		["달콤한 열매", "덩굴 함정", "뿌리 감옥"],
		["취약점 공격","원격 제어","추출"]
	]
	static readonly HOTKEY = ["Q", "W", "R"]

	constructor(char: number, plyr: Player, lang: number) {
		this.plyr = plyr
		this.char = char
		this.names = SkillInfoFactory.SKILL_NAME[char]
		this.lang = lang
		if (lang === SkillInfoFactory.LANG_KOR) {
			this.names = SkillInfoFactory.SKILL_NAME_KOR[char]
		}
	}
	get(){
		return [this.getQ(),this.getW(),this.getUlt()]
	}
	private hotkey(s: number) {
		return SkillInfoFactory.HOTKEY[s]
	}
	private active() {
		return "<br>" + this.chooseLang("[Active]", "[사용시]") + ": "
	}
	private passive() {
		return this.chooseLang("[Passive]", "[기본 지속 효과]") + ": "
	}
	private chooseLang<T>(eng: T, kor: T): T {
		return this.lang === SkillInfoFactory.LANG_KOR ? kor : eng
	}

	private nameTitle(s: number) {
		return `[${this.hotkey(s)}] {${this.names[s]}}  <cool>
		${this.plyr.cooltime_list[s]}${this.chooseLang(" turns", "턴")}</>${this.range(s)}<br>`
	}
	private cooltime() {
		return `<cool>${this.chooseLang("cooltime", "쿨타임")}</>`
	}
	private nameDesc(s: number) {
		return `<skill><skillimg${this.char + 1}-${s + 1}>${this.names[s]}</>`
	}
	private lowerbound(str: string) {
		return `<lowerbound>${str}</>`
	}
	private upperbound(str: string) {
		return `<upperbound>${str}</>`
	}
	private up(str: string) {
		return `<up>${str}</>`
	}
	private down(str: string) {
		return `<down>${str}</>`
	}
	private stat(str: string) {
		return `<stat>${str}</>`
	}
	private range(s: number) {
		if (this.plyr.skill_ranges[s] === 0) return ""
		return this.rangeNum(this.plyr.skill_ranges[s])
	}
	private currHp() {
		return `<currHP>${this.chooseLang(" current HP", " 현재체력")}</>`
	}
	private maxHP() {
		return `<maxHP>${this.chooseLang(" maximum HP", " 최대체력")}</>`
	}
	private missingHp() {
		return `<missingHP>${this.chooseLang(" missing HP", " 잃은체력")}</>`
	}
	private rangeNum(r: number) {
		return `<range>${this.chooseLang("Range: ", "사정거리: ")}${r} ${this.chooseLang("", "칸 ")}</>`
	}
	private rangeStr() {
		return `<range>${this.chooseLang("Range", "사정거리")}</>`
	}
	private area(s: number) {
		return `<area>${this.chooseLang(`Select ${s} Squares`, s + "칸 범위를 선택")}</>`
	}
	private mDmg(d: number | string, scaleType?: string) {
		if (scaleType == null) {
			return `<mdmg>${d}${this.chooseLang(" magic damage", "의 마법 피해")}</>`
		}
		return `<mdmg>${this.scaledValue(d,scaleType)}${this.chooseLang(" magic damage", "의 마법 피해")}</>`
	}
	private scaledValue(d: number | string,scale:string){
		return `<scale${scale}>${d}</>`
	}
	private pDmg(d: number | string, scaleType?: string) {
		if (scaleType == null) {
			return `<pdmg>${d}${this.chooseLang(" attack damage", "의 물리 피해")}</>`
		}
		return `<pdmg>${this.scaledValue(d,scaleType)}${this.chooseLang(" attack damage", "의 물리 피해")}</>`
	}
	private tDmg(d: number | string, scaleType?: string) {
		if (scaleType == null) {
			return `<tdmg>${d}${this.chooseLang(" fixed damage", "의 고정 피해")}</>`
		}
		return `<tdmg>${this.scaledValue(d,scaleType)}${this.chooseLang(" fixed damage", "의 고정 피해")}</>`
	}

	private baseDmg(s: number) {
		return this.plyr.getSkillBaseDamage(s)
	}
	private heal(amt: number, scaleType?: string) {
		if (scaleType == null) {
			let txt = `<heal>${amt}</>`
			return this.chooseLang("heals " + txt + " HP", txt + "의 체력을 회복")
		}

		let txt = `<heal>${this.scaledValue(amt,scaleType)}</>`
		return this.chooseLang(`heals ${txt} HP`, `${txt}의 체력을 회복`)
	}
	private money(amt: number|string) {
		return `<money>${this.chooseLang("$"+amt, amt+"원")}</>`
	}
	private shield(amt: number, scaleType?: string) {
		if (scaleType == null) {
			let txt = `<shield>${amt}</>`
			return this.chooseLang("gains " + txt + " shield", txt + "의 보호막 획득")
		}
		let txt = `<shield>${this.scaledValue(amt,scaleType)}</>`

		return this.chooseLang(`gains ${txt} shield`, `${txt}의 보호막 획득`)
	}
	private skillAmt(key: string): number {
		return this.plyr.getSkillAmount(key)
	}
	private proj(name: string) {
		return this.chooseLang(`<proj>Places </> a ${name}`, `${name} <proj>설치</>`)
	}
	private projsize(size: number) {
		return `<projsize>${this.chooseLang(` size ${size}`, `${size}칸 크기 `)}</>`
	}
	// projsizeStr(size:number){
	// 	return `<projsize>${this.chooseLang("Size of","")}${size}${this.chooseLang("","칸 크기")} </>`
	// }
	private getEffectHeader(e: number) {
		let str = this.chooseLang(statuseffect[e], statuseffect_kor[e])
		try {
			if (str[0] === "{") {
				let name = str.match(/\{(.+)\}/)
				if(!name) return `<badeffect${e}>??`
				return `<badeffect${e}>` + name[1]
			} else {
				let name = str.match(/\[(.+)\]/)
				if(!name) return`<goodeffect${e}>??`
				return `<goodeffect${e}>` + name[1]
			}
		} catch (e) {
			console.error(e)
			return ""
		}
	}
	private effectNoDur(e: number) {
		return this.getEffectHeader(e) + "</>"
	}
	private effect(e: number, dur: number) {
		return this.chooseLang(this.effectEng(e, dur), this.effectKor(e, dur))
	}
	private effectEng(e: number, dur: number) {
		return `${this.getEffectHeader(e)} ${dur} ${dur > 1 ? "turns" : "turn"} </>`
	}
	private effectKor(e: number, dur: number) {
		return `${this.getEffectHeader(e)} ${dur} 턴</>`
	}
	private duration(d: number) {
		return `<duration>${d}${this.chooseLang(d > 1 ? " turns" : " turn", "턴")}</>`
	}
	private radius(r: number) {
		return `<radius>${this.chooseLang(`within ${r} squares`, `반경 ${r}칸 이내`)}</>`
	}
	private radiusStr(r: string) {
		return `<radius>${this.chooseLang(`within ${r} squares`, `반경 ${r}칸 이내`)}</>`
	}
	private basicattack() {
		return `<basicattack>${this.chooseLang(`basic attack`, `기본 공격`)}</>`
	}
	// private target() {
	// 	return `<target>${this.chooseLang(`target`, `대상`)}</>`
	// }
	private get target(){
		return  `<target>${this.chooseLang(`target`, `대상`)}</>`
	}
	private emp(s: string) {
		return `<emp>` + s + "</>"
	}
	private convert(data:string[],skill:ENUM.SKILL){
		let str:string=SkillDescription.eng[this.char].skills[skill]
		str=this.nameTitle(skill)+str
		str=str.replace("<$target>",this.target)
		str=str.replace("<$currhp>",this.currHp())
		str=str.replace("<$passive>",this.passive())
		str=str.replace("<$active>",this.active())
		str=str.replace("<$cool>",this.cooltime())
		for(let i=1;i<=data.length;++i){
			str=str.replace(/<d>/,data[i-1])
		}
		for(let i=0;i<3;++i){
			str=str.replace(`<$skill${i}>`,this.nameDesc(i))
		}
		return str
	}
	private getQ() {
		if (this.lang === SkillInfoFactory.LANG_KOR) return this.getQKor()

		let str
		const s = 0
		const hotkey = this.hotkey(s)
		let data:string[]=[]
		switch (this.char) {
			case 1:
				data=[
					this.mDmg(this.baseDmg(s), hotkey),
					this.heal(this.skillAmt("qheal")),
					this.rangeNum(this.skillAmt("w_qrange")),
					this.tDmg(this.skillAmt("w_qdamage"), "w_qdamage")
				]
				break
			case 0:
				data=[
					this.pDmg(this.baseDmg(s), hotkey),this.down("half")
				]
				break
			case 2:
				data=[
					this.mDmg(this.baseDmg(s), hotkey),this.effect(ENUM.EFFECT.BLIND, 1)
				]
				break
			case 3:
				data=[
					this.pDmg(this.baseDmg(s), hotkey),this.radius(4),this.down("spend 5%")
				]
				break
			case 4:
				data=[
					this.pDmg(this.baseDmg(s), hotkey),this.effectNoDur(ENUM.EFFECT.ROOT),
					this.effectNoDur(ENUM.EFFECT.GROUNGING),
					this.rangeNum(this.skillAmt("q_root_arange")),
					this.pDmg("50%")
				]
				break
			case 5:
				data=[
					this.mDmg(this.baseDmg(s), hotkey),
					this.radiusStr(`front ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_front")},
				back ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_back")}`)
				]
				break
			case 6:
				data=[
					this.proj("tenacle"),this.projsize(2),this.mDmg(this.baseDmg(s), hotkey)
				]
				break
			case 7:
				data=[
					this.mDmg(this.baseDmg(s), hotkey),this.money(20)
				]
				break
			case 8:
				data=[
					this.lowerbound("lower than 40%"),this.stat("damage absorbtion"),this.up("35% increases"),
					this.area(3),this.mDmg(this.baseDmg(s), hotkey),this.heal(this.skillAmt("qheal"), "qheal"),this.shield(this.skillAmt("qshield"), "qshield")
				]
				break
			case 9:
				data=[
					this.pDmg(this.baseDmg(s)+"+("+this.skillAmt("stack_damage")+"x total stacks)",hotkey),
					this.money("stack x 3"),
				]
					break
			default:
				str = ""
		}
		return this.convert(data,s)
	}
	private getQKor() {
		let str
		const s = 0
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 1:
				str =
					this.nameTitle(s) +
					`
				사용시 ${this.target}에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입힌 후 ${this.heal(this.skillAmt("qheal"))}
				, <br>${this.nameDesc(1)} ${this.emp("표식")}이 있는 상대에게는 ${this.rangeNum(this.skillAmt("w_qrange"))}
				${this.tDmg(this.skillAmt("w_qdamage"), "w_qdamage")}를 추가로 입힘`
				break
			case 0:
				str =
					this.nameTitle(s) +
					`${this.target}에게 ${this.pDmg(this.baseDmg(s), hotkey)}를 입힘
				.${this.emp("두 번")} 시전 가능, 두번째 사용시 ${this.down("50%의 피해")}를 입힘`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.target +
					`에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.effect(ENUM.EFFECT.BLIND, 1)} 부여`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.radius(4) +
					`의 적에게 ${this.pDmg(this.baseDmg(s), hotkey)}를 입힘
				(${this.currHp()}의 ${this.down("5% 소모")},
				대상이 2명 이상이면 피해량 감소`
				break
			case 4:
				str =
					this.nameTitle(s) +
					this.target +
					`에게 총을 발사해 
				${this.pDmg(this.baseDmg(s), hotkey)}를 입힘, ${this.effectNoDur(ENUM.EFFECT.ROOT)} 혹은 ${this.effectNoDur(ENUM.EFFECT.GROUNGING)}
				상태인 대상 적중 시 ${this.nameDesc(s) + "" + this.cooltime() + this.emp(" 2턴")}을 돌려받음`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`사용시 ${this.radiusStr(`앞 ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_front")},
				뒤 ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_back")}`)} 
				대상들에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입힘"`
				break
			case 6:
				str =
					this.nameTitle(s) +
					this.projsize(2) +
					`의 ${this.proj("촉수")}해
				 밟은 적에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입힘`
				break
			case 7:
				str =
					this.nameTitle(s) +
					this.target +
					`을 공격해
				${this.mDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.money(20)}을 빼앗음.`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`체력이 ${this.lowerbound("40% 미만")}이면 ${this.emp("시든 나무")} 상태 돌입, 
				${this.emp("시든 나무")} 상태에선 ${this.nameDesc(s)} 로 아군 회복이 불가하지만
				 ${this.stat("모든 피해 흡혈")}이 ${this.up("35% 증가")}함` +
					this.active() +
					this.area(3) +
					`해 그 안에 있는 적들에게 
				${this.mDmg(this.baseDmg(s), hotkey)}를 입히고
				 아군은 ${this.heal(this.skillAmt("qheal"), "qheal")}시키고 ${this.shield(this.skillAmt("qshield"), "qshield")}`
				break
			case 9:
				str =
					this.nameTitle(s) +
					this.target +
					`을 공격해 ${this.pDmg(this.baseDmg(s)+"+("+this.skillAmt("stack_damage")+"x 총 중첩)",hotkey)}를 입히고 
					${this.money("1중첩당 3")}를 빼앗음. 적중시 해당 대상에 대한 ${this.emp("'취약점' 중첩")}을 획득. 
					${this.emp("취약점 중첩")} 하나당 대상에 대한 피해량 영구 증가
					`
				break
			default:
				str = ""
		}
		return str
	}
	private getW() {
		if (this.lang === SkillInfoFactory.LANG_KOR) return this.getWKor()
		let str
		const s = 1
		const hotkey = this.hotkey(s)

		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`${this.proj("Wind")} with ${this.projsize(3)} that blows away enemies who step on it by ${this.down("4 squares backwards")} and
					deals ${this.mDmg(this.baseDmg(s), hotkey)}`
				break
			case 1:
				str =
					this.nameTitle(s) +
					`Leaves a ${this.emp("mark")} to a ${this.target} and applies ${this.effect(ENUM.EFFECT.CURSE, 1)}`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.passive() +`If you have`+
					this.effectNoDur(ENUM.EFFECT.INVISIBILITY) +
					` effect, deals additional (30% of target\`s ${this.missingHp()}) ${this.mDmg("")} for ${this.nameDesc(ENUM.SKILL.Q)}.
				 ${this.active()} Receives ${this.effect(
						ENUM.EFFECT.INVISIBILITY,
						1
					)}.`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.passive() +
					` ${this.up("Movement speed +1")} if you are in behind of all players
				${this.active()}${this.heal(this.skillAmt("wheal")*3, "wheal")} total for ${this.duration(3)} ,
				 receives ${this.effectNoDur(ENUM.EFFECT.SLOW)} effect while healing.`
				break
			case 4:
				str =
					this.nameTitle(s) +
					` ${this.proj("trap")} of ${this.projsize(3) } that applies ${this.effect(ENUM.EFFECT.GROUNGING, 1)}
					 to the enemy who steps on it`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`Gain ${this.effect(ENUM.EFFECT.ROOT, 1)} and ${this.shield(50)}. ${this.rangeStr()} of ${
						this.nameDesc(0) + " and " + this.nameDesc(2)
					} ${this.up("doubles")}.
				 Applies ${this.effect(
						ENUM.EFFECT.IGNITE,
						2
					)} if you use ${this.nameDesc(0)}. It damages targets by ${this.scaledValue(this.emp(String(this.baseDmg(1)))+"%",hotkey)}
                     of ${this.maxHP()} as ${this.tDmg("")} for every player turn,`
				break
			case 6:
				str =
					this.nameTitle(s) +
					`Deals ${this.mDmg(this.baseDmg(s), hotkey)} and applies ${this.effect(ENUM.EFFECT.SLOW,1)} to enemies ${this.radius(3)}.
				 and you ${this.shield(this.skillAmt("wshield"), "wshield")}`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("Duration")}: ${this.duration(2)}, Receives ${this.effect(
						ENUM.EFFECT.SPEED,
						1
					)} on use. 
				 ${this.basicattack()} deals additional ${this.mDmg(this.skillAmt("w_aa_adamage"), "w_aa_adamage")}, 
				 ${this.nameDesc(0)} deals additional ${this.mDmg(this.skillAmt("w_q_adamage"), "w_q_adamage")}
				 and applies ${this.effect(ENUM.EFFECT.ROOT, 1)} `
				break
			case 8:
				str =
					this.nameTitle(s) +
					`${this.proj("vine")} of ${this.projsize(1)} that ${this.emp("stops")} player who passes it,
				  allies will receive ${this.effect(ENUM.EFFECT.SPEED, 1)}`
				break
				case 9:
					str =
					this.nameTitle(s) +this.passive()+`Deals additional  ${this.mDmg(this.baseDmg(s),hotkey)} on ${this.basicattack()}. 
					`+this.active()+
					`Select a ${this.target } and forcibly moves ${this.emp("2+(1 for 3 vulnerability stacks)squares")} backwards and applies ${this.effect(ENUM.EFFECT.CURSE, 1)}.
					`
					break
				
			default:
				return ""
		}
		return str
	}
	private getWKor() {
		let str
		const s = 1
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`,맞은 적에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.down("4칸 뒤로")} 이동시키는 ${this.projsize(3)}의 ${this.proj("토네이도")}`
				break
			case 1:
				str =
					this.nameTitle(s) +
					`사용시 ${this.target}에게 ${this.emp("표식")}을 남기고 ${this.effect(ENUM.EFFECT.CURSE, 1)} 부여`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.passive() +
					this.effectNoDur(ENUM.EFFECT.INVISIBILITY) +
					` 상태에서 ${this.nameDesc(ENUM.SKILL.Q)}사용시 
				대상의 ${this.missingHp()}의 ${this.mDmg("30%")}를 추가로 입힘 ${this.active()}${this.effect(
						ENUM.EFFECT.INVISIBILITY,
						1
					)}.`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.passive() +
					`모든 상대보다 뒤쳐져 있으면 ${this.up("이동 속도 +1")}
				${this.active()}${this.duration(3)}에 걸쳐 ${this.heal(this.skillAmt("wheal")*3, "wheal")},
				 회복 중엔 ${this.effectNoDur(ENUM.EFFECT.SLOW)}에 걸림.`
				break
			case 4:
				str =
					this.nameTitle(s) +
					this.projsize(3) +
					`의 ${this.proj("덫")}해
				 밟은 적에게 ${this.effect(ENUM.EFFECT.GROUNGING, 1)} 부여`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`사용시 ${this.effect(ENUM.EFFECT.ROOT, 1)}, ${this.shield(50)} 후 ${
						this.nameDesc(0) + " 와 " + this.nameDesc(2)
					}의 ${this.rangeStr()}  ${this.up("2배 증가")},
				${this.nameDesc(0)} 사용시 적중한 적에게 ${this.effect(
						ENUM.EFFECT.IGNITE,
						2
					)}을 부여해 매 플레이어 턴마다 ${this.maxHP()}의 ${this.tDmg(this.scaledValue(this.baseDmg(1),hotkey)+"%")} 를 입힘`
				break
			case 6:
				str =
					this.nameTitle(s) +
					this.radius(3) +
					`의 적에게 ${this.mDmg(this.baseDmg(s), hotkey)}를
				 입히고 ${this.effect(ENUM.EFFECT.SLOW,1)} 부여. 자신은 ${this.shield(this.skillAmt("wshield"), "wshield")}`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("지속시간")}: ${this.duration(2)}, 사용시 ${this.effect(
						ENUM.EFFECT.SPEED,
						1
					)}을 받고, 지속시간 중에 
				${this.basicattack()}시 ${this.mDmg(this.skillAmt("w_aa_adamage"), "w_aa_adamage")},
				 ${this.nameDesc(0)} 사용시 ${this.mDmg(this.skillAmt("w_q_adamage"), "w_q_adamage")}
				 를 추가로 입히고 ${this.effect(ENUM.EFFECT.ROOT, 1)} `
				break
			case 8:
				str =
					this.nameTitle(s) +
					`지나가는 플레이어를 ${this.emp("멈추는")} ${this.projsize(1)}의 ${this.proj("덩굴")},
				 덩굴에 걸린 플레이어는 해당 칸의 효과를 받음, 아군은 ${this.effect(ENUM.EFFECT.SPEED, 1)} 부여`
				break
			case 9:
				str =
					this.nameTitle(s) +this.passive()+`${this.basicattack()}시 ${this.mDmg(this.baseDmg(s),hotkey)}를 추가로 입힘. 
					`+this.active()+
					this.target +
					`을 선택해 뒤로 ${this.emp("2+(취약점 중첩 3당 1)칸")} 만큼 ${this.emp("강제이동")} 시키고 ${this.effect(ENUM.EFFECT.CURSE, 1)} 부여.
					`
				break
			default:
				return ""
		}
		return str
	}
	private getUlt() {
		if (this.lang === SkillInfoFactory.LANG_KOR) return this.getUltKor()
		let str
		const s = 2
		const hotkey = this.hotkey(s)

		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`${this.emp("Teleports")} to a  ${this.target} and deals ${this.pDmg(this.baseDmg(s), hotkey)} and ${this.shield(70)}.
				Damage decreases by 30% if the target is ${this.emp("in front")} of you.`
				break
			case 1:
				str =
					this.nameTitle(s) +
					this.passive() +
					`${this.stat("Attack and magic resistance")} ${this.up("increases by 0~60")} based on your ${this.missingHp()} 
				${this.active()} For ${this.duration(4)},  ${this.stat("Attack and magic resistance")} ${this.up(
						"increases by " + this.skillAmt("r_resistance")
					)}, ${this.shield(this.skillAmt("rshield"),"rshield")},and gains ${this.effect(ENUM.EFFECT.SPEED,1)
					}. Heal amount of ${this.nameDesc(ENUM.SKILL.Q)} ${this.up("doubles")}, and ${this.rangeStr()} ${this.up("increase by 4")}`
				break
			case 2:
				str =
					this.nameTitle(s) +
					`${this.proj("Poison bomb")} of ${this.projsize(4)}. Enemy who step on it gets
				${this.effectNoDur(ENUM.EFFECT.SLOW)} and receives ${this.mDmg(this.baseDmg(s) * 3,hotkey)} for ${this.duration(3)}. `
				break
			case 3:
				str =
					this.nameTitle(s) +
					`Deals ${this.pDmg(this.baseDmg(s) + `(+ 50% of target\s ${this.missingHp()})`, hotkey)} to a ${this.target}.
					${this.cooltime()} of ${this.nameDesc(s)} ${this.emp("resets")} if you killed the enemy.`
				break
			case 4:
				str =
					this.nameTitle(s) +
					
					` Selects a ${this.target}, Automatically attacks the target ${this.emp("3 times")} for ${this.duration(3)}, 
					dealing ${this.pDmg(this.baseDmg(s), hotkey)} each and ${this.shield(80)}.
				(Deals ${this.tDmg(this.baseDmg(s))} for 3rd attack, can\`t move while shooting)<br>
				After use, you gains ${this.effect(ENUM.EFFECT.DOUBLEDICE, 1)}.`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`${this.proj("Magic circle")} of ${this.projsize(3)} that deals ${this.mDmg(this.baseDmg(s), hotkey)} and applies 
				${this.effect(ENUM.EFFECT.SILENT, 1)} to enemy who step on it. Can use ${this.emp("3 times")}.`
				break
			case 6:
				str =
					this.nameTitle(s) +
					`Deals ${this.tDmg(this.baseDmg(s), hotkey)} to a ${this.target},
				Your ${this.maxHP() + this.up("increases by 50")} if you killed the target.`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("Duration")}: ${this.duration(4)},${this.shield(70)}, ${this.stat("Basic attack range")} ${this.up("+2")}, 
				${this.basicattack()} deals additional ${this.pDmg(this.skillAmt("r_aa_adamage"), "r_aa_adamage")}.
				 Additional damage of ${this.nameDesc(1)} ${this.up("doubles")}, and 
				 ${this.nameDesc(0)} creates an area of ${this.projsize(3)}. If enemy step on it,
				  they receive ${this.effect(ENUM.EFFECT.IGNITE, 2)}`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`Summons ${this.emp("Plant monster")} on every skill use.
				${this.emp("Plant monster")} lives for ${this.duration(this.skillAmt("plant_lifespan"))} and deals 
				${this.mDmg(this.skillAmt("plantdamage"), "plantdamage")} to enemies ${this.radius(
						1
					)}. Enemy ${this.basicattack()} will kill the ${this.emp("Plant monster")}s.` +
					this.active() +
					` Deals ${this.mDmg(this.baseDmg(s), hotkey)} to a ${this.target} and applies 
				 ${this.effect(ENUM.EFFECT.ROOT, 1)}.(2 turns if you are ${this.emp("Withered Tree")} state)
				,and increases all incoming damage by ${this.up("20%")},
				 Also, all ${this.emp("Plant monster")}s move toward a target.`
				break
				
			case 9:
				str =
					this.nameTitle(s) +
					`Imitates ultimate(lv3 skill) of ${this.target} and steals ${this.emp(this.skillAmt("r_steal_base")+"+(total vulnerability stacks x "+this.skillAmt("r_steal")+")%")} of targets attack power and magic power for 2 turns.
					 Reusing this skill will use the imitated skill.`
				break
			default:
				return ""
		}
		return str
	}
	private getUltKor() {
		let str
		const s = 2
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`사용시 ${this.target}에게 ${this.emp("즉시 이동")}해 ${this.pDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.shield(70)}.
				자신보다 ${this.emp("앞에 있는 상대")}에게는 70%의 피해를 입힘`
				break
			case 1:
				str =
					this.nameTitle(s) +
					this.passive() +
					this.missingHp() +
					`에 비례해 ${this.stat("방어력과 마법저항력")} ${this.up("0~60 증가")} 
				${this.active()} ${this.duration(4)}간  ${this.stat("방어력과 마법저항력")}이 ${this.up(
						"+" + this.skillAmt("r_resistance")
					)},
				${this.shield(this.skillAmt("rshield"),"rshield")}, ${this.nameDesc(ENUM.SKILL.Q)} ${this.up("회복량 2배")}`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.projsize(4) +
					`의 ${this.proj("독버섯")}. 밟은 적은 ${this.duration(3)}에 걸쳐 
				${this.effectNoDur(ENUM.EFFECT.SLOW)}에 걸리고 ${this.mDmg(this.baseDmg(s) * 3, hotkey)}를 받음`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.target +
					`에게 ${this.pDmg(this.baseDmg(s) + `+ 대상 ${this.missingHp()}의 50%`, hotkey)}를 입힘,
				대상 처치시${this.nameDesc(s)} ${this.cooltime()} ${this.emp("초기화")}`
				break
			case 4:
				str =
					this.nameTitle(s) +
					this.target+
					` 고정 후 ${this.duration(3)} 동안 ${this.emp("최대 3번")}
				 발사해 각각${this.pDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.shield(80)}.
				(3번째에는 ${this.tDmg(this.baseDmg(s))}를 입힘, 사용중에는 움직일 수 없음)<br>
				발사 후에는 ${this.effect(ENUM.EFFECT.DOUBLEDICE, 1)}을 받음`
				break
			case 5:
				str =
					this.nameTitle(s) +
					this.projsize(3) +
					`의 ${this.proj("번개")}, 밟은 적은 ${this.mDmg(this.baseDmg(s), hotkey)}를 받고
				${this.effect(ENUM.EFFECT.SILENT, 1)} 부여. ${this.emp("총 3번")} 시전할 수 있음`
				break
			case 6:
				str =
					this.nameTitle(s) +
					this.target +
					`에게 ${this.tDmg(this.baseDmg(s), hotkey)}를 입힘,
				대상 처치시 ${this.maxHP() + this.up("50 증가")}`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("지속시간")}: ${this.duration(4)},${this.shield(70)}. 지속시간 중에 
					${this.stat("기본공격 사거리")}가 ${this.up("2 증가")}하고 ${this.basicattack()}시 
				${this.pDmg(this.skillAmt("r_aa_adamage"), "r_aa_adamage")}를 추가로 입힘.
				 또한 ${this.nameDesc(1)}의 추가 피해가 ${this.up("2 배 증가")}하고
				 ${this.nameDesc(0)} 적중 시 밟은 적에게 ${this.effect(ENUM.EFFECT.IGNITE, 2)}
				 을 주는 ${this.projsize(3)}의 영역을 그 자리에 생성함`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`스킬 사용시 사용한 자리에 ${this.emp("식충식물")} 소환, <br>
				${this.emp("식충식물")}은 ${this.duration(this.skillAmt("plant_lifespan"))}간 유지되며 매 턴마다 ${this.radius(
						1
					)}의 적에게
				 ${this.mDmg(this.skillAmt("plantdamage"), "plantdamage")}를 입히고 적이 ${this.basicattack()}시 사라짐` +
					this.active() +
					`${this.target}에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입히고
				 ${this.effect(ENUM.EFFECT.ROOT, 1)}.(${this.emp("시든 나무")} 상태이면 2턴)
				,또한 이 상태에서 아군이 가하는 피해 ${this.up("20% 증가")},
				 이때 맵에 있는 모든 ${this.emp("식충식물")}이 대상 주변으로 이동됨`
				break
			case 9:
				str =
					this.nameTitle(s) +this.target+
					`의 궁극기(레벨 3 스킬)를 빼앗고 대상 공격력과 주문력의 ${this.emp(this.skillAmt("r_steal_base")+"+(총 취약점 중첩 x "+this.skillAmt("r_steal")+")%")}
					를 ${this.up("2턴간 훔침")}.
					 스킬을 재시전하면 빼앗은 스킬이 사용됨.`
				break
			default:
				return ""
		}
		return str
	}
}
