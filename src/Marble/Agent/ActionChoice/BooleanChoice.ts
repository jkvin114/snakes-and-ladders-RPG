import ActionChoice from "./ActionChoice";

export default class BooleanChoice<TIn> extends ActionChoice<TIn,boolean>{
    generate(): boolean[] {
        return [true,false]
    }
}
