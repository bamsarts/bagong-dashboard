export const dateConfig = {
  monthNames : [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ],
  monthNamesShort : [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ],
  monthNamesShortEn : [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames : [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'
  ],
  dayNamesShort : [
    'Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'
  ],
  dayNamesShortEn : [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ]
}

const today = new Date()
const thisMonth = today.getMonth()
const thisYear = today.getFullYear()

const getTimezone = () => {
  const now = today
  const offset = now.getTimezoneOffset()

  const H = offset > 0 ? Math.floor(offset/60) : Math.round(offset/60)
  const hh = H > 0 
    ? H < 10 ? '-0' + H : '-' + H 
    : (H * -1) < 10 ? '+0' + (H * -1) : '+' + (H * -1)
  
  const M = offset > 0 ? offset % 60 : offset % 60 * -1
  const mm = M < 10 ? '0' + M : M
  
  let timezone
  
  switch (now.getHours() - now.getUTCHours()) {
    case 7 :
      timezone = 'WIB'
      break;
      case 8 :
      timezone = 'WITA'
      break;
      case 9 :
      timezone = 'WIT'
      default:
      timezone = ' '
      break;
  }

  return {
    isoTimezone : `${hh}:${mm}`,
    timezone
  }

}

const getFullDate = (date) => {
  const day = dateConfig.dayNames[date.getDay()]
  const dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
  const mm = dateConfig.monthNames[date.getMonth()]
  const yyyy = date.getFullYear()
  
  return `${day}, ${dd} ${mm} ${yyyy}`
}

const getMonthDate = (date) => {
  const day = dateConfig.dayNames[date.getDay()]
  const dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
  const mm = dateConfig.monthNames[date.getMonth()]
  const yyyy = date.getFullYear()
  
  return `${dd} ${mm} ${yyyy}`
}

const getTime = (date) => {
  const hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
  const MM = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()

  return `${hh}:${MM}`
}

const basicDate = (date, separator = "-") => {
  const dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
  const mm = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
  const yyyy = date.getFullYear()

  return {
    noSpace : `${yyyy}${mm}${dd}`,
    normal : `${yyyy}${separator}${mm}${separator}${dd}`,
    id: `${dd}${separator}${mm}${separator}${yyyy}`,
    normalId:  `${dd}/${mm}/${yyyy}`
  }
}

const parseShortDate = (date) => {
  return {
    day : dateConfig.dayNamesShortEn[date.getDay()],
    date : date.getDate(),
    month : dateConfig.monthNamesShortEn[date.getMonth()],
    monthNumber : date.getMonth(),
    year : date.getFullYear()
  }
}

const setDate = (date = today, numOfDays)  => {
  date.setDate(date.getDate() + numOfDays)
  return date
}

const thisMonthDateRange = (month = thisMonth) => {
  return {
    startDate : basicDate(new Date(thisYear, month, 1)).normal,
    endDate : basicDate(new Date(thisYear, month + 1, 0)).normal
  }
}

const thisYearDateRange = (year = thisYear) => {
  return {
    startDate : basicDate(new Date(year, 0, 1)).normal,
    endDate : basicDate(new Date(year, 11, 31)).normal
  }
}

const convertISO = (date, type = "fulldate") => {
  let fullDate = new Date(date)

  if(type == "fulldate"){
    return getMonthDate(fullDate)+" "+getTime(fullDate)
  }else if(type == "date"){
    return getMonthDate(fullDate)
  }else{
    return getTime(fullDate)
  }
}

const getDurationFromTimeFormat = (time = '00:00', devider = ':', lang = 'id') => {
  const splitedTime = time.split(devider)
  const hours = parseInt(splitedTime[0])
  const minutes = parseInt(splitedTime[1])
  return `${hours}${lang === 'id' ? 'j' : 'h'}${minutes > 0 ? ` ${minutes}${lang === 'id' ? 'm' : 'm'}` : ''}`
}

const minToDays = (totalMinutes) => {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return {
      "Day": days,
      "Hour": hours,
      "Minute": minutes
  }
}

// Convert time in H[:mm[:ss]] format to seconds
function timeToSecs(time) {
  let [h, m, s] = time.split(':');
  return h*3600 + (m|0)*60 + (s|0)*1;
}

// Convert seconds to time in H:mm:ss format
function secsToTime(seconds) {
  return new Date(seconds * 1000).toISOString().substring(11, 16)
}

const getEstimatedTime = (start, duration) => {
  return secsToTime(timeToSecs(start) + timeToSecs(duration));
}

const dateFilter = {
  basicDate,
  getFullDate,
  getMonthDate,
  getTime,
  getTimezone,
  parseShortDate,
  setDate,
  thisMonthDateRange,
  thisYearDateRange,
  convertISO,
  getDurationFromTimeFormat,
  minToDays,
  getEstimatedTime
}

export default dateFilter