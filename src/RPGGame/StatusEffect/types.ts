import type { Damage } from "../core/Damage"
import type { Player } from "../player/player"

export interface OnDamageFunction {
	(damage: Damage, owner: Player, data: number[]): Damage
}


export interface OnHPBelowThresholdFunction {
	(damage: number, owner: Player, data: number[]): void
}


export interface onHitFunction {
	(this: Player, target: Player, damage: Damage, data: number[]): Damage
}


export interface ConditionFunction {
	(owner: Player, target: Player): boolean
}

export interface TickActionFunction {
	(this: Player): boolean
}

