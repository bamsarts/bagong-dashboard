let lastTime = 0

export default function throttle(func, timeFrame) {
    return function(...args) {
        let now = new Date().getTime()
        if (now - lastTime >= timeFrame) {
            func(...args)
            lastTime = now
        }
    }
}