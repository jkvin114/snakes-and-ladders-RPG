import { EffectFactory, ItemEffectFactory } from "./StatusEffect"
import { Creed } from "./characters/Creed"
import { name } from "./characters/Bird"
import { Silver } from "./characters/Silver"
import { Jean } from "./characters/Jean"
import { Jellice } from "./characters/Jellice"
import { Gorae } from "./characters/Gorae"
import { Timo } from "./characters/Timo"
import { Yangyi } from "./characters/Yangyi"
import { SkillDamage } from "./Util"

export namespace SpecialEffect {
	export const SKILL = {
		REAPER_Q: {
			name: "reaper_q"
		},
		REAPER_ULT: {
			name: "reaper_r"
		},
		ELEPHANT_PASSIVE: {
			name: "elephant_passive",
			desc: "Attack and magic resistance increase based on missing health",
			desc_kor: " 잃은 체력에 비례해 방어력과 마법저항력 증가 "
		},
		ELEPHANT_W: {
			name: "elephant_w",
			desc: "'Tusk Attack's range and damage increases aginst this unit",
			desc_kor: " 이 유닛에 대한 '암흑의 표창' 사정거리와 피해량 증가 "
		},
		ELEPHANT_ULT: {
			name: "elephant_ult",
			desc: "Attack and magic resistance increase, lv1 skill healing doubles",
			desc_kor: "방어력과 마법저항력 증가, Q 회복량 2배"
		},
        MAGICIAN_W: {
			name: "magician_w",
			desc: "Doubles range for all skills for 1 turn, Applies ignite effect on lv1 skill",
			desc_kor: "스킬 사거리 2배, Q 사용시 적중한 적에게 점화 2턴"
		},
        MAGICIAN_W_BURN: {
			name: "magician_w_burn",
			desc: "For every player turn, receives 4(+0.01AP)% of Max HP as fixed damage",
			desc_kor: "매 플레이어 턴마다 최대체력의 4(+0.01AP)% 의 고정 피해"
		},
        BIRD_ULT: {
			name: "bird_r",
			desc: "Basic attack damage and range increased,  'Baby Bird'`s additional damage doubles,'beak attack' creates an area" +
			" that applies ignite effect to players who step on it",
			desc_kor: "기본공격 피해량 30%증가, 사거리 2 증가, '아기새 소환'의 추가 피해 2배 증가,'날렵한 침' 적중시 " +
			"밟은 적에게 점화 2턴을 주는 영역을 생성"
		},
        BIRD_ULT_BURN: {
			name: "bird_r_burn",
			desc: "For every player turn, receives 3% of Max HP as fixed damage",
			desc_kor: "매 플레이어 턴마다 최대체력의 3% 의 고정 피해"
		},
        DINOSAUR_W_HEAL: {
			name: "dinosaur_w",
			desc: "Heals for 3 turns",
			desc_kor: "3턴에걸쳐 체력 회복"
		},
        GHOST_ULT: {
			name: "ghost_r",
			desc: "Receives magic damage for 3 turns",
			desc_kor: "3턴에걸쳐 마법 피해를 받음"
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
		.set(EffectFactory.MAGIC_CASTLE_ADAMAGE, {
			type: "obstacle",
			src: "status_effect/magic_castle.png",
			desc: "Additional Damage on skill(0.1AD+0.08AP+0.1extraHP)",
			desc_kor: "스킬 사용시 추가 피해(0.1AD+0.08AP+0.1추가체력)",
			isgood: true
		})
		.set(ItemEffectFactory.POWER_OF_MOTHER_NATURE_ABILITY, {
			type: "item",
			item_id: 18,
			desc: "Movement speed increases by 1 for 1 turn",
			desc_kor: "1턴간 이동속도 1 증가",
			isgood: true
		})
        .set(SKILL.ELEPHANT_PASSIVE.name,{
            type:"skill",
            src:"character/elephant.png",
            desc:SKILL.ELEPHANT_PASSIVE.desc,
            desc_kor:SKILL.ELEPHANT_PASSIVE.desc_kor,
            isgood:true
        })
        .set(SKILL.ELEPHANT_W.name,{
            type:"skill",
            src:"skill/2-2.jpg",
            desc:SKILL.ELEPHANT_W.desc,
            desc_kor:SKILL.ELEPHANT_W.desc_kor,
            isgood:false
        })
        .set(SKILL.ELEPHANT_ULT.name,{
            type:"skill",
            src:"skill/2-3.jpg",
            desc:SKILL.ELEPHANT_ULT.desc,
            desc_kor:SKILL.ELEPHANT_ULT.desc_kor,
            isgood:true
        })
        .set(SKILL.MAGICIAN_W.name,{
            type:"skill",
            src:"skill/6-2.jpg",
            desc:SKILL.MAGICIAN_W.desc,
            desc_kor:SKILL.MAGICIAN_W.desc_kor,
            isgood:true
        })
        .set(SKILL.MAGICIAN_W_BURN.name,{
            type:"skill",
            src:"skill/6-2.jpg",
            desc:SKILL.MAGICIAN_W_BURN.desc,
            desc_kor:SKILL.MAGICIAN_W_BURN.desc_kor,
            isgood:false
        })
        .set(SKILL.BIRD_ULT.name,{
            type:"skill",
            src:"character/bird_r.png",
            desc:SKILL.BIRD_ULT.desc,
            desc_kor:SKILL.BIRD_ULT.desc_kor,
            isgood:true
        })
        .set(SKILL.BIRD_ULT_BURN.name,{
            type:"skill",
            src:"effect/flame.png",
            desc:SKILL.BIRD_ULT_BURN.desc,
            desc_kor:SKILL.BIRD_ULT_BURN.desc_kor,
            isgood:false
        })
        .set(SKILL.DINOSAUR_W_HEAL.name,{
            type:"skill",
            src:"skill/4-2.jpg",
            desc:SKILL.DINOSAUR_W_HEAL.desc,
            desc_kor:SKILL.DINOSAUR_W_HEAL.desc_kor,
            isgood:true
        })
        .set(SKILL.GHOST_ULT.name,{
            type:"skill",
            src:"skill/3-3.jpg",
            desc:SKILL.GHOST_ULT.desc,
            desc_kor:SKILL.GHOST_ULT.desc_kor,
            isgood:false
        })
}
