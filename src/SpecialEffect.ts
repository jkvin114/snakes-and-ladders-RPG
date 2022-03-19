import { EffectFactory, ItemEffectFactory } from "./StatusEffect"

import * as ENUM from "./enum"

export namespace SpecialEffect {
	export const OBSTACLE={
		MAGIC_CASTLE_ADAMAGE :{
			name:"magic_castle",
			isgood:true,
			src: "status_effect/magic_castle.png",
			desc: "Additional Damage on skill(0.1AD+0.08AP+0.1extraHP)",
			desc_kor: "스킬 사용시 추가 피해(0.1AD+0.08AP+0.1추가체력)",
		} 
	}
	export const SKILL = {
		ELEPHANT_PASSIVE: {
			isgood:true,
            src:"character/elephant.png",
			name: "elephant_passive",
			desc: "Attack and magic resistance increase based on missing health",
			desc_kor: " 잃은 체력에 비례해 방어력과 마법저항력 증가 "
		},
		ELEPHANT_W: {
			isgood:false,
            src:"skill/2-2.jpg",
			name: "elephant_w",
			desc: "'Tusk Attack's range and damage increases aginst this unit",
			desc_kor: " 이 유닛에 대한 '암흑의 표창' 사정거리와 피해량 증가 "
		},
		ELEPHANT_ULT: {
			isgood:true,
            src:"skill/2-3.jpg",
			name: "elephant_ult",
			desc: "Attack and magic resistance increase, lv1 skill healing doubles",
			desc_kor: "방어력과 마법저항력 증가, Q 회복량 2배"
		},
        MAGICIAN_W: {
			isgood:true,
            src:"skill/6-2.jpg",
			name: "magician_w",
			desc: "Doubles range for all skills for 1 turn, Applies ignite effect on lv1 skill",
			desc_kor: "스킬 사거리 2배, Q 사용시 적중한 적에게 점화 2턴"
		},
        MAGICIAN_W_BURN: {
			isgood:false,
            src:"skill/6-2.jpg",
			name: "magician_w_burn",
			desc: "For every player turn, receives 4(+0.01AP)% of Max HP as fixed damage",
			desc_kor: "매 플레이어 턴마다 최대체력의 4(+0.01AP)% 의 고정 피해"
		},
        BIRD_ULT: {
			isgood:true,
            src:"character/bird_r.png",
			name: "bird_r",
			desc: "Basic attack damage and range increased,  'Baby Bird'`s additional damage doubles,'beak attack' creates an area" +
			" that applies ignite effect to players who step on it",
			desc_kor: "기본공격 피해량 30%증가, 사거리 2 증가, '아기새 소환'의 추가 피해 2배 증가,'날렵한 침' 적중시 " +
			"밟은 적에게 점화 2턴을 주는 영역을 생성"
		},
        BIRD_ULT_BURN: {
			isgood:false,
            src:"effect/flame.png",
			name: "bird_r_burn",
			desc: "For every player turn, receives 3% of Max HP as fixed damage",
			desc_kor: "매 플레이어 턴마다 최대체력의 3% 의 고정 피해"
		},
        DINOSAUR_W_HEAL: {
			isgood:false,
            src:"skill/4-2.jpg",
			name: "dinosaur_w",
			desc: "Heals for 3 turns",
			desc_kor: "3턴에걸쳐 체력 회복"
		},
        GHOST_ULT: {
			isgood:false,
            src:"skill/3-3.jpg",
			name: "ghost_r",
			desc: "Receives magic damage for 3 turns",
			desc_kor: "3턴에걸쳐 마법 피해를 받고 시전자에 가하는 피해가 50% 감소"
		},
        TREE_WITHER: {
			isgood:true,
            src:"character/tree_low_hp.png",
			name: "tree_wither",
			desc: "Unable to heal ally with Lv1 skill, Damage absorbtion 15% increased, LV3 skill root duration increased.",
			desc_kor: "Q 스킬로 아군 화복 불가, 모든 피해 흡혈 15% 증가, 궁극기 속박 지속시간 증가"
		},
        TREE_ULT: {
			isgood:false,
            src:"skill/9-3.jpg",
			name: "tree_ult",
			desc: "Incoming damage from enemies increases by 20%",
			desc_kor: "적에게 받는 피해 20% 증가"
		}
	}
	export const ITEM={
		POWER_OF_MOTHER_NATURE_ABILITY:{
			name:"power_of_mother_nature_speed",
			desc:"Movement speed increases by 1 for 1 turn",
			desc_kor:"1턴간 이동속도 1 증가",
			item_id: ENUM.ITEM.POWER_OF_MOTHER_NATURE
		},WARRIOR_SHIELDSWORD_ABSORB:{
			name:"shieldsword_absorb",
			desc:"30% increased damage absorb",
			desc_kor:"모든피해 흡혈 30% 증가",
			item_id: ENUM.ITEM.WARRIORS_SHIELDSWORD,

		}
		,WARRIOR_SHIELDSWORD_SHIELD:{
			name:"shieldsword_shield",
			desc:"",desc_kor:"",
			item_id: ENUM.ITEM.WARRIORS_SHIELDSWORD,
		}
	}

	export interface DescriptionData {
		type: string
		item_id?: number
		src?: string
		desc: string
		desc_kor: string
		isgood: boolean
	}
	export const Setting = new Map<string, DescriptionData>()
	for (const [k, v] of Object.entries(ITEM)){
		if(v.desc!="")
		Setting.set(v.name,{
			type:"item",
			item_id:v.item_id,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:true
		})
	}
	for (const [k, v] of Object.entries(SKILL)){
		if(v.desc!="")
		Setting.set(v.name,{
			type:"skill",
			src:v.src,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:v.isgood
		})
	}
	for (const [k, v] of Object.entries(OBSTACLE)){
		if(v.desc!="")
		Setting.set(v.name,{
			type:"obstacle",
			src:v.src,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:v.isgood
		})
	}



}
