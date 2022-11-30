interface TurnPayloadInterface {
	turn: number
}
interface CryptedPayloadInterface extends TurnPayloadInterface {
	crypt_turn: string
}
export namespace ServerGameEventInterface {
	export interface initialSetting {
		playerSettings: {
			turn: number
			team: boolean
			HP: number
			MaxHP: number
			name: string
			champ: number
			champ_name: string
			recommendedItem: number[],
			skillScale:object,
			isLoggedIn:boolean
		}[]
		isTeam: boolean
		gameSettings: Object
		map:number,
		shuffledObstacles: number[]
	}
	export interface LocationTargetSelector {
		kind?: "location"
		pos: number
		range: number
		size: number
	}
	export interface PlayerTargetSelector {
		kind?: "target"
		targets: number[]
	}
	export interface SkillInit extends CryptedPayloadInterface {
		type: number
		data: LocationTargetSelector | PlayerTargetSelector | null
		skill: number
	}
	
	//replay
	export interface SkillStatus extends TurnPayloadInterface {
		cooltime: number[]
		duration: number[] //remaining duration/full duration
		cooltimeratio: number[] //remaining cooltime/full cooltime
		level: number
		basicAttackCount:number
		canBasicAttack:boolean
		canUseSkill:boolean
	}
	//replay
	export interface skillTrajectory {
		from: number
		to: number
		type: string
		delay: number
	}
	export interface TurnStart extends CryptedPayloadInterface {
		stun: boolean
		dc: boolean //dice control avalibility
		dc_cool: number //dice control cooltime left
		adice: number //total additional dice
		effects: string[] //dice-modifying status effects
		avaliablepos: number[] //avaliable positions(maximum 6, for dice control)
		ai: boolean //temporary, dont need in client
	}
	//replay
	export interface PlayerPosSync {
		alive: boolean
		pos: number
		turn: number
	}
	//replay
	export interface DiceRoll extends CryptedPayloadInterface {
		dice: number //dice number shown
		actualdice: number //actual distance to move
		currpos: number //position before move
		turn: number
		dcused: boolean //dice control used
		died: boolean //whether player died immediately after throwing dice(mine)
	}
	export interface PendingObstacle {
		name: string
		argument: number | number[]
	}
	//replay
	export interface NormalEffect extends TurnPayloadInterface {
		effect: number
		num: number //indicator number
	}
	//replay
	export interface PassProjectile {
		name: string
		scope: number[]
		UPID: string
		stopPlayer: boolean
		owner: number
		trajectorySpeed: number
	}
	//replay
	export interface RangeProjectile {
		scope: number[]
		UPID: string
		owner: number
		name: string
		trajectorySpeed: number
	}
	//replay
	export interface SummonedEntity {
		sourceTurn: number
		pos: number
		UEID: string
		name: string
	}
	export interface EnterStore {
		item: number[]
		money: number
		token: number
		life: number
		lifeBought: number
		recommendeditem: number[]
		itemLimit: number
		priceMultiplier: number
	}
	//replay
	export interface Death extends TurnPayloadInterface {
		killer: number
		location: number
		isShutDown: boolean
		killerMultiKillCount: number
	}
	export interface Obstacle extends TurnPayloadInterface {
		obs: number
		globalEventName?:string
	}
	export interface ObstacleEffect extends TurnPayloadInterface {
		pos: number
		type: number
	}
	//replay
	export interface Shield extends TurnPayloadInterface {
		turn: number
		shield: number
		change: number
		indicate: boolean
	}
	//replay
	export interface HPChange extends TurnPayloadInterface {
		change: number
		currhp: number
		currmaxhp: number
		currshield:number
	}
	//replay
	export interface Heal extends HPChange {
		type: string
	}
	//replay
	export interface Damage extends HPChange {
		source: number
	}
	//replay
	export interface Victim {
		pos: number
		flags: string[]
		damage: number
	}
	//replay
	export interface Attack {
		targets: Victim[]
		source: number
		visualeffect: string
		sourcePos:number
		// trajectorySpeed:number
	}
}

export namespace ClientInputEventInterface {
	export interface GameSetting {
		itemLimit: number
		extraResistanceAmount: number
		additionalDiceAmount: number
		useAdditionalLife: boolean
		legacyAA:boolean
		diceControlItemFrequency: number
		shuffleObstacle: boolean
		winByDecision:boolean
		shuffleTurns:boolean

		killRecord: boolean
		itemRecord: boolean
		positionRecord: boolean
		moneyRecord: boolean
		summaryOnly: boolean
		replay:boolean
	}

	export interface SimulationSetting {
		mapPool: number[]
		allowMirrorMatch: boolean
		characterPool: number[]
		lockedCharacters: number[]
		teamLock: number[][]

		playerNumber: number
		randomizePlayerNumber: boolean
		randomizeGameSetting: boolean
		randomizePlayerNames: boolean
		divideTeamEqually: boolean
		gameSetting: GameSetting

		killRecord: boolean
		itemRecord: boolean
		positionRecord: boolean
		moneyRecord: boolean
		summaryOnly: boolean
		replay:boolean
	}
	interface GodHandResult {
		kind: "godhand"
		target: number
		location: number
	}
	export interface SubwayResult {
		kind: "subway"
		type: number
		price: number
	}
	export interface TokenStoreResult {
		kind: "tokenstore"
		token: number
		money: number
	}
	export interface PendingObstacle{
		type: string
		complete: boolean
		result?: boolean
		objectResult?: GodHandResult | TokenStoreResult | SubwayResult
	}
	export interface PendingAction{
		type: string
		result: number | boolean
		complete: boolean
	}
	export interface ItemBought extends CryptedPayloadInterface {
		item: number[]
		moneyspend: number
		tokenbought: number
		tokenprice: number
		life: number
	}
}
