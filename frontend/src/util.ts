export function limitString(str?:string,size?:number){
    if(!str) return ""
    if(!size) size=15
   return str.length > 15 ? str?.slice(0,15)+"..":str
}

export function getDateStringDifference(start:number,now:number) {
    const ONE_MINUTE = 60 * 1000; // milliseconds in a minute
    const ONE_HOUR = 60 * ONE_MINUTE; // milliseconds in an hour
    const ONE_DAY = 24 * ONE_HOUR; // milliseconds in a day
  
    const timeDifference = Math.abs(start - now);
  
    const days = Math.floor(timeDifference / ONE_DAY);
    const hours = Math.floor((timeDifference % ONE_DAY) / ONE_HOUR);
    const minutes = Math.floor((timeDifference % ONE_HOUR) / ONE_MINUTE);
    const seconds = Math.floor((timeDifference % ONE_MINUTE) / 1000);
    // Build the result string
    let resultString = '1 second';
    if (days > 0) {
      resultString = `${days} day${days > 1 ? 's' : ''} `;
    }
    else if (hours > 0) {
      resultString = `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    else if (minutes > 0) {
      resultString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    else if (seconds > 0) {
        resultString = `${seconds} second${seconds > 1 ? 's' : ''}`;
      }
    return resultString.trim();
  }
  