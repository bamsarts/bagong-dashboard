export function checkIsMobile(userAgent) {
    let isMobile = false

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        isMobile = true
    }

    return isMobile
}
