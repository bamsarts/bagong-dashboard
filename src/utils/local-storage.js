export function setLocalStorage(key, data) {
    return localStorage.setItem(key, JSON.stringify(data))
}

export function getLocalStorage(key) {
    let result  = null
    try {
        result = JSON.parse(localStorage.getItem(key))
    } catch {}
    return result
}