export default function debounce(func, delay) {
    let timeout
    return function() {
        const context = this
        const args = arguments

        clearTimeout(timeout)

        timeout = setTimeout(() => {
            timeout = null
            func.apply(context, args)
        }, delay)

        if (!delay) func.apply(context, args)
    }
}