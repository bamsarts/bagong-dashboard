import FormData from 'form-data'

export const API_ENDPOINT = {
    development: 'https://uat.damri.bisku.id:8080',
    // development2 : 'http://103.172.24.140:3000',
    // production : 'http://103.172.24.140:3030',
    development2: 'http://103.132.239.124:3000',
    developmentBackup: 'http://139.59.223.142:3030',
    production: 'https://api-damri-dashboard.bisku.id',
    productionBackup: 'https://api2-damri-dashboard.bisku.id', //production backup
    local: 'http://192.168.70.70:8080',
    ticketOrder: 'http://uat.damri.bisku.id:8585', //dev
    //ticketOrderProd: "https://api-karcis-damri-dashboard.bisku.id",
    ticketOrderProd: "https://api3-dashboard.damri.bisku.id",
    settlement: 'http://uat.damri.bisku.id:8484', //dev
    settlementProd: 'http://karcis.damri.bisku.id', //live
    // ticketOrder: 'https://api-damri-dashboard.bisku.id:2443', //live
    // ticketOrder : 'http://project-damri-redirect-to-localhost.loca.lt',
    productionApps: 'http://api.damri.bisku.id',
    productionAppsCk: 'https://api.damri.ck.bisku.top',
    devCk: 'https://app.damri.bisku.id:3030',
    staging: 'https://app.damri.bisku.id:5000',
    cache_all: ['http://103.217.227.11:6262', 'http://103.217.227.11:7272', 'http://103.217.227.11:8282'],
    web_damri_dev: "http://103.158.252.98:1038",
    web_damri_prod: "https://damri.co.id",
    bucket: "https://cdn.bisku.net/damri",
    dev_coreticket: "https://core-ticketing.bisku.id"
}

export const BASE_URL = API_ENDPOINT.dev_coreticket
export const SETTLEMENT_URL = API_ENDPOINT.settlement
export const CACHE_URL = API_ENDPOINT.development
export const DAMRI_APPS_URL = API_ENDPOINT.development
export const TICKET_ORDER_URL = API_ENDPOINT.ticketOrder
export const WEB_DAMRI = API_ENDPOINT.web_damri_dev
export const BUCKET = API_ENDPOINT.bucket

const pathReroute = ["/user/", "/member/", "/public/", "/masterData/"]

function parseJson(response) {
    return new Promise((resolve, reject) => {
        return response.json()
            .then(json => {
                resolve({
                    status: response.status,
                    ok: response.ok,
                    json
                })
            })
            .catch(e => reject(e))
    })
}

function parseText(response) {
    return new Promise((resolve, reject) => {
        return response.text()
            .then(json => {
                resolve({
                    status: response.status,
                    ok: response.ok,
                    json
                })
            })
            .catch(e => reject(e))
    })
}

function objectToFormData(data = {}) {
    let formData = new FormData()

    if (data) {
        for (let key in data) {
            if (data[key]) {
                if (key === 'files[]' && data[key] instanceof Array) {
                    data[key].forEach(item => {
                        if (item.uri) {
                            formData.append(key, { uri: item.uri, type: item.type, name: item.fileName })
                        } else {
                            formData.append(key, item)
                        }
                    })
                } else if (data[key].uri) {
                    formData.append(key, { uri: data[key].uri, type: data[key].type, name: data[key].fileName })
                } else {
                    formData.append(key, data[key])
                }
            }
        }
    }

    return formData
}

export function objectToParams(object = {}) {
    let objectToArray = []

    for (const key in object) {
        if (object[key] !== null) {
            if (object[key] instanceof Array) {
                object[key] = JSON.stringify(object[key])
            }
            objectToArray.push(`${key}=${object[key]}`)
        }
    }

    return objectToArray.join('&')
}

export function get(url, token) {
    return new Promise((resolve, reject) => {


        const headers = {
            'Content-Type': 'application/json'
        }

        if (token) headers['Authorization'] = `Bearer ${token}`

        let finalUrl = url.url ? url.url : BASE_URL + url

        // Insert "/data/" if url starts with any pathReroute
        if (!url.url && pathReroute.some(path => url.startsWith(path))) {
            finalUrl = BASE_URL + "/data" + url
        }

        fetch(finalUrl, {
            headers,
            method: 'GET'
        })
            .then(parseJson)
            .then(res => res.ok ? resolve(res.json) : reject(res.json))
            .catch(e => reject(e))
    })
}

export function postJSON(url, data, token, csv = false, method = "POST") {
    return new Promise((resolve, reject) => {

        const headers = {
            'Content-Type': 'application/json'
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
            if (token.includes("|no-bearer")) headers['Authorization'] = token.split("|no-bearer")[0]
        }

        let finalUrl = url.url ? url.url : BASE_URL + url

        // Insert "/data/" if url starts with any pathReroute
        if (!url.url && pathReroute.some(path => url.startsWith(path))) {
            finalUrl = BASE_URL + "/data" + url
        }

        fetch(finalUrl, {
            headers,
            method: method,
            body: JSON.stringify(data)
        })
            .then(csv ? parseText : parseJson)
            .then(res => res.ok ? resolve(res.json) : reject(res.json))
            .catch(e => reject(e))
    })
}

export function postFormData(url, data, token) {

    const headers = {}

    if (token) headers['Authorization'] = `Bearer ${token}`

    return new Promise((resolve, reject) => {

        fetch(url.url ? url.url : BASE_URL + url, {
            headers,
            method: 'POST',
            body: objectToFormData(data),
        })
            .then(parseJson)
            .then(res => res.ok ? resolve(res.json) : reject(res.json))
            .catch(e => reject(e))


    })
}

export function uploadFile(url, data, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.responseText ? JSON.parse(xhr.responseText) : reject({ message: 'Terjadi Kesalahan' }))
            } else {
                reject(xhr.responseText ? JSON.parse(xhr.responseText) : reject({ message: 'Terjadi Kesalahan' }))
            }
        }

        xhr.onerror = () => {
            reject(xhr.responseText ? JSON.parse(xhr.responseText) : reject({ message: 'Terjadi Kesalahan' }))
        }

        xhr.upload.onprogress = onProgress

        xhr.open('POST', BASE_URL + url)

        const formData = objectToFormData(data)

        xhr.send(formData)
    })
}

export async function getPageData() {
    let products = []
    let aboutUs = {}
    let mainWorkshop = {}

    try {
        const res = await get('/product-classes/list-options')
        products = res.map(item => {
            return {
                href: `/product/${item.class_uid}`,
                products: item.product,
                title: item.class
            }
        })

    } catch (e) { }

    try {
        aboutUs = await get('/about-us')
    } catch (e) { }

    try {
        mainWorkshop = await get('/workshops/main-workshop')
    } catch (e) { }

    return {
        navbar: {
            products
        },
        aboutUs,
        mainWorkshop
    }
}

export async function clearCache() {
    const data = {
        url: DAMRI_APPS_URL + "/cache/cacheable/all"
    }

    const result = await get(data, false)
}
