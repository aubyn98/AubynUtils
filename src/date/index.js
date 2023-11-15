function _formatNormalize(formatter) {
  if (typeof formatter === 'function') return formatter
  if (typeof formatter !== 'string') throw new TypeError('formatter must be a string')
  if (formatter === 'date') formatter = 'yyyy-MM-dd'
  else if (formatter === 'datetime') formatter = 'yyyy-MM-dd HH:mm:ss'
  const formatterFunc = dateInfo => {
    const { yyyy, MM, dd, HH, mm, ss, ms } = dateInfo
    return formatter.replaceAll('yyyy', yyyy).replaceAll('MM', MM).replaceAll('dd', dd).replaceAll('HH', HH).replaceAll('mm', mm).replaceAll('ss', ss).replaceAll('ms', ms)
  }
  return formatterFunc
}

export function getDate(date = new Date(), formatter = 'date', isPad = true) {
  if (typeof date === 'number' || typeof date === 'string') date = new Date(date)
  formatter = _formatNormalize(formatter)
  const dataInfo = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds()
  }
  dataInfo.yyyy = dataInfo.year.toString()
  dataInfo.MM = dataInfo.month.toString()
  dataInfo.dd = dataInfo.date.toString()
  dataInfo.HH = dataInfo.hour.toString()
  dataInfo.mm = dataInfo.minute.toString()
  dataInfo.ss = dataInfo.second.toString()
  dataInfo.ms = dataInfo.millisecond.toString()
  function _pad(prop, len) {
    dataInfo[prop] = dataInfo[prop].padStart(len, '0')
  }
  if (isPad) {
    _pad('yyyy', 4)
    _pad('MM', 2)
    _pad('dd', 2)
    _pad('HH', 2)
    _pad('mm', 2)
    _pad('ss', 2)
    _pad('ms', 3)
  }
  return formatter(dataInfo)
}

export function dateFormat(str) {
  return str.replace(
    /([0-9]{0,4})[^0-9]*([0-9]{0,2})[^0-9]*([0-9]{0,2}).*/,
    (m, $1, $2, $3) => {
      $1 = $1.length == 4 ? $1 + '-' : $1
      if ($2.length) {
        $2 = $2 > 12 ? '12' : $2 == 0 ? '01' : $2
        $2 = $2.padStart(2, '0') + '-'
      }
      if ($3.length) {
        const year = Number($1.slice(0, 4))
        const month = Number($2.slice(0, 2))
        const maxDate =
          month == 12
            ? new Date(year + 1, 0, 0).getDate()
            : new Date(year, month, 0).getDate()
        $3 = $3.padStart(2, '0')
        $3 = $3 > maxDate ? maxDate.toString() : $3 == 0 ? '01' : $3
      }
      return $1 + $2 + $3
    }
  )
}