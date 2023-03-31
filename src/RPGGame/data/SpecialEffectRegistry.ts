import * as ENUM from "./enum"
import { items } from "../../../res/item_new.json"

export namespace SpecialEffect {
	export const OBSTACLE={
		MAGIC_CASTLE_ADAMAGE :{
			name:"magic_castle",
			isgood:true,
			src: "status_effect/magic_castle.png",
			desc: "Additional <d1> true damage for all skill",
			desc_kor: "스킬 사용시 <d1>의 추가 피해를 입힘",
		}
	}
	export const SKILL = {
		ELEPHANT_PASSIVE: {
			isgood:true,
            src:"character/knight.png",
			name: "elephant_passive",
			desc: "Attack and magic resistance increase based on missing health",
			desc_kor: " 잃은 체력에 비례해 방어력과 마법저항력 증가 "
		},
		ELEPHANT_W: {
			isgood:false,
            src:"skill/2-2.jpg",
			name: "elephant_w",
			desc: "'Mace Attack's range and damage increases aginst this unit",
			desc_kor: " 이 유닛에 대한 '암흑의 철퇴' 사정거리와 피해량 증가 "
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
			desc: "For every player turn, takes <d1>% of Max HP as fixed damage",
			desc_kor: "매 플레이어 턴마다 최대체력의 <d1>% 의 고정 피해"
		},
        BIRD_W: {
			isgood:true,
            src:"skill/8-2.jpg",
			name: "bird_w",
			desc: "Additional damage on basic attack and [Beak attack]",
			desc_kor: "기본 공격과 [날렵한 부리] 사용시 추가 피해"
		},BIRD_ULT: {
			isgood:true,
            src:"skill/8-3.jpg",
			name: "bird_r",
			desc: "Basic attack damage and range increased<br>'Baby Bird'`s additional damage doubles<br>'beak attack' creates an area" +
			" that applies ignite effect to players who step on it",
			desc_kor: "기본공격 피해량 30%증가<br> 사거리 2 증가<br>'아기새 소환'의 추가 피해 2배 증가<br>'날렵한 부리' 적중시 " +
			"밟은 적에게 점화 2턴을 주는 영역을 생성"
		},
        BIRD_ULT_BURN: {
			isgood:false,
            src:"effect/flame.png",
			name: "bird_r_burn",
			desc: "For every player turn, takes 3% of Max HP as fixed damage",
			desc_kor: "매 플레이어 턴마다 최대체력의 3% 의 고정 피해"
		},
        DINOSAUR_W_HEAL: {
			isgood:true,
            src:"skill/4-2.jpg",
			name: "dinosaur_w",
			desc: "Heals for 3 turns",
			desc_kor: "3턴에걸쳐 체력 회복"
		},
        GHOST_ULT: {
			isgood:false,
            src:"skill/3-3.jpg",
			name: "ghost_r",
			desc: "Takes magic damage for 3 turns",
			desc_kor: "3턴에걸쳐 마법 피해를 받고 시전자에 가하는 피해가 50% 감소"
		},
        TREE_WITHER: {
			isgood:true,
            src:"character/tree_low_hp.png",
			name: "tree_wither",
			desc: "Unable to heal ally with Lv1 skill, Damage absorbtion 35% increased, LV3 skill root duration increased.",
			desc_kor: "Q 스킬로 아군 회복 불가, 모든 피해 흡혈 35% 증가, 궁극기 속박 지속시간 증가"
		},
        TREE_ULT: {
			isgood:false,
            src:"skill/9-3.jpg",
			name: "tree_ult",
			desc: "Incoming damage from enemies increases by 20%",
			desc_kor: "적에게 받는 피해 20% 증가"
		},
        HACKER_ULT_ENEMY: {
			isgood:false,
            src:"skill/10-3.jpg",
			name: "hacker_ult_enemy",
			desc: "Attack damage and ability power decreased by <d1>%",
			desc_kor: "공격력과 주문력 <d1>% 감소"
		},
        HACKER_ULT: {
			isgood:true,
            src:"skill/10-3.jpg",
			name: "hacker_ult",
			desc: "Attack damage increased by <d1>, ability power increased by <d2>",
			desc_kor: "공격력 <d1> 증가, 주문력 <d2> 증가"
		}
	}
	export const ITEM={
		POWER_OF_MOTHER_NATURE_ABILITY:{
			name:"power_of_mother_nature_speed",
			desc:"Movement speed increased by 1",
			desc_kor:"이동속도 1 증가",
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
	const ITEM_PASSIVE=[
		{
			desc:"Additional magic damage on attack",
			desc_kor:"공격시 추가 마법 피해를 입힘",
			item_id: ENUM.ITEM.ANCIENT_SPEAR,
		}
		,{
			desc:"Additional magic damage on attack",
			desc_kor:"공격시 추가 마법 피해를 입힘",
			item_id: ENUM.ITEM.SPEAR,
		}
		,{
			desc:"Additional fixed damage on attack",
			desc_kor:"공격시 추가 고정 피해를 입힘",
			item_id: ENUM.ITEM.CROSSBOW_OF_PIERCING,
		}
		,{
			desc:"Maximum HP increases on attack",
			desc_kor:"공격시 최대체력 영구 증가",
			item_id: ENUM.ITEM.FULL_DIAMOND_ARMOR,
		}
		,{
			desc:"Deals additional magic damage on next attack (spend stacks)<hr>current stacks:<d1><br>additional damage:<d2>",
			desc_kor:"다음 공격시 충전량을 소모해 추가 마법 피해<hr>현재 충전량:<d1><br>추가 마법 피해:<d2>",
			item_id: ENUM.ITEM.DAGGER,
		}
		,{
			desc:"Deals additional magic damage on next skill attack (spend stacks)<hr>current stacks:<d1><br>additional damage:<d2>",
			desc_kor:"다음 스킬 공격시 충전량을 소모해 추가 마법 피해<hr>현재 충전량:<d1><br>추가 마법 피해:<d2>",
			item_id: ENUM.ITEM.STAFF_OF_JUDGEMENT,
		}
		,{
			desc:"Deals additional magic damage on next basic attack with increased range (spend stacks)<hr>current stacks:<d1><br>additional damage:<d2><br>additional range:<d3>",
			desc_kor:"다음 기본공격시 사정거리 증가, 충전량을 소모해 추가 마법 피해<hr>현재 충전량:<d1><br>추가 마법 피해:<d2><br>추가 사정거리:<d3>",
			item_id: ENUM.ITEM.FLAIL_OF_JUDGEMENT,
		}
	]

	export interface DescriptionData {
		type: string
		item_id?: number
		src?: string
		desc: string
		desc_kor: string
		isgood: boolean
	}
	export const Namespace = new Map<string, DescriptionData>()
	for (const [k, v] of Object.entries(ITEM)){
		if(v.desc!="")
		Namespace.set(v.name,{
			type:"item",
			item_id:v.item_id,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:true
		})
	}
	for (const v of ITEM_PASSIVE){
		if(v.desc!="")
		Namespace.set(items[v.item_id].name,{
			type:"item",
			item_id:v.item_id,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:true
		})
	}
	for (const [k, v] of Object.entries(SKILL)){
		if(v.desc!="")
		Namespace.set(v.name,{
			type:"skill",
			src:v.src,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:v.isgood
		})
	}
	for (const [k, v] of Object.entries(OBSTACLE)){
		if(v.desc!="")
		Namespace.set(v.name,{
			type:"obstacle",
			src:v.src,
			desc:v.desc,
			desc_kor:v.desc_kor,
			isgood:v.isgood
		})
	}



}
