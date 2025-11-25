export default function cookieParser(cookie, key = '') {

    const initialCookies = {
        token : null,
        role : null
    }

    if (cookie) {
        const cookieItems = cookie.split(';')
    
        let result = {}
    
        cookieItems.some(item => {
            const splitedItem = item.split('=')
            
            if (key === splitedItem[0].trim()) {
                result = splitedItem[1]
                return true
            } else {
                const splitedItem = item.split('=')
                result[`${splitedItem[0].trim()}`] = splitedItem[1]
                return false
            }
    
        })
    
        return result ? result : initialCookies
    } else {
        return initialCookies
    }

}

export function setCookie(key, value, lifeSpanInDay = 2) {

    const expiryDay = new Date()
    expiryDay.setTime(expiryDay.getTime() + (lifeSpanInDay * ( 24 * 60 * 60 * 1000 )))

    document.cookie = `${key}=${value};expires=${expiryDay.toUTCString()};path=/`
}

export function deleteCookie(key) {
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

export function resetCookie(cookie) {
    let cookies = cookieParser(cookie)
    for (const key in cookies) {
        deleteCookie(key)        
    }
}