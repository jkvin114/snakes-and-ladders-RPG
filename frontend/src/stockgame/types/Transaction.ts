export default interface Transaction{
    type:"BUY"|"SELL"
    money:number
    shares:number
    date:string
    profit?:number
    price:number
    time:number
}