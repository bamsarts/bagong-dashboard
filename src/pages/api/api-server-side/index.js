import { API_ENDPOINT, get, objectToParams, postFormData, postJSON } from '../../../api/utils'

function objectToFormData(data = {}) {
    let formData = new FormData()
  
    if (data) {
        for (let key in data) {
            if (data[key]) {
                if (key === 'files[]' && data[key] instanceof Array) {
                    data[key].forEach(item => {
                        if (item.uri) {
                            formData.append(key, {uri : item.uri, type : item.type, name : item.fileName})
                        } else {
                            formData.append(key, item)
                        }
                    })
                } else if (data[key].uri) {
                    formData.append(key, {uri : data[key].uri, type : data[key].type, name : data[key].fileName})
                } else {
                    formData.append(key, data[key])
                }
            }
        }
    }

    return formData
}

function parseJson(response) {
    return new Promise((resolve, reject) => {
        return response.json()
        .then(json => {
            resolve({
                status : response.status,
                ok : response.ok,
                json
            })
        })
        .catch(e => reject(e))
    })
}


export default async function handler(req, res) {
    try {
        let result = ""

        if(req.method == 'POST'){

            if(req.query.type == "formdata"){
                const formData = objectToFormData(JSON.parse(decodeURIComponent(req.query.formData)))

                console.log("qt")
                console.log(req.query)

                const requestOptions = {
                    method: "POST",
                    body: formData,
                    redirect: "follow"
                };

                if (req.query.token) {
                    requestOptions.headers = {
                        "Authorization": req.query.token.split("|no-bearer")[0]
                    };
                }

                result = await new Promise((resolve, reject) => {

                    fetch(req.query.url, requestOptions)
                    .then(parseJson)
                    .then(res => res.ok ? resolve(res.json) : reject(res.json))
                    .catch(e => reject(e))
                })

            }else{
                let formData = ""

                result = await postJSON({ url: req.query.url }, formData, req.query?.token, false)
            
            }
            
        }else{
            result = await get({ url: req.query.url }, false)
        }

        
        res.status(200).json({ data: result })
    } catch (e) {
        res.status(400).json({ message: e.message})
    }
}

