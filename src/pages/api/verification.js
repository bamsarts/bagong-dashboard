import { API_ENDPOINT, get, objectToParams, postFormData, postJSON, BASE_URL } from '../../api/utils'


export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const { type, phone, token } = req.query

        if (!type || !phone || !token) {
            return res.status(400).json({ message: 'Missing required parameters' })
        }
        const bearerToken = process.env.TOKEN_WA

        const response = await fetch(BASE_URL + "/wabot/verification/submit/"+type+"/"+phone+"/"+token, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
            }
        })

        const data = await response.json()

        if (!response.ok) {
            return res.status(response.status).json(data)
        }

        res.status(200).json({ data })
    } catch (e) {
        res.status(500).json({ message: e.message || 'Internal server error' })
    }
}
