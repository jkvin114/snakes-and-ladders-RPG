import { CHARACTER, ITEM } from "../../data/enum";

export enum GameType{
    P2="2P",P3="3P",P4="4P",TEAM="TEAM"
}
export enum MapName{
    DEFAULT="default",OCEAN="ocean",CASINO="casino",RAPID="rapid",TRAIN="train",
}
export const EVAL_VERSION=2
/**
 * version 2: added patchVersion 
 */


export interface characterIndex<T>{
    for:T,count:number,wins:number
}
export interface ICharacterEval{
    gameType:GameType,
    mapName:MapName,
    version:number,
    serverVersion:string,
    patchVersion:string,
    charId:CHARACTER,
    opponents:characterIndex<CHARACTER>[],
    duos:characterIndex<CHARACTER>[],
    items:characterIndex<ITEM>[],
    itembuilds:characterIndex<string>[],
    count:number,
    wins:number,
    scores:{name:string,average:number,winAverage:number}[]
}