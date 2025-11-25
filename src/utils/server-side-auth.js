import cookieParser from './cookie'

export function auth(ctx, key = 'token') {
    return cookieParser(ctx.req.headers.cookie)[key]
}

export function redirect(destination = '/', props = {}) {
    return {
        redirect : {
            destination
        },
        props
    }
}