export interface DisplayData{
    value:number
    lastDayValue:number
    totalCount:number
    currCount:number
    
}
export interface StatData{
    maxVal:number
    minVal:number
    maxChange:number
    minChange:number
}
export interface DayRecord{
    
    date:string,
    value:number,
    diff:number
}