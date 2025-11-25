export function setSessionStorage(key, data) {
    return sessionStorage.setItem(key, JSON.stringify(data))
}

export function getSessionStorage(key) {
    let result  = null
    try {
        result = JSON.parse(sessionStorage.getItem(key))
    } catch {}
    return result
}