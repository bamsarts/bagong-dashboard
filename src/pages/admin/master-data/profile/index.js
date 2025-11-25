import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/AdminLayout'
import Main, { popAlert } from '../../../../components/Main'
import { Col, Row } from '../../../../components/Layout'
import ProfileCard from '../../../../components/ProfileCard'
import { postJSON, get, TICKET_ORDER_URL, API_ENDPOINT } from '../../../../api/utils'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import Button from '../../../../components/Button'

export default function Profile(props) {

    const [_profile, _setProfile] = useState([]);
    const [_pic, _setPic] = useState([]);
    const [_accountNumber, _setAccountNumber] = useState([]);
    const [_profileUser, _setProfileUser] = useState([])
    const __PROPERTY_ACCOUNT_NUMBER = ["code","account","name"]; 
    const __TRANS_PROPERTY_ACCOUNT_NUMBER = ["Kode Bank","Rekening","Nama Pemilik"];
    const __INDEX_ACCOUNT_NUMBER = [1,2,3]; 
    const __PROPERTY_PROFILE_USER = ["name","username","email",'usernameSimaDamri']; 
    const __TRANS_PROPERTY_PROFILE_USER = ["Nama","Username","Email",'Username SIMA Damri'];
    const __INDEX_PROFILE_USER = [1,2,3,4]; 
    const CONFIG_PARAM = {
        "usernameSimaDamri": "",
        "passwordSimaDamri": "",
    }
    const CACHE_CONFIG_PARAM = {
        "host": "103.150.120.142",
        "ports": "8282,8284,8285,8286"
    }
    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_cacheForm, _setCacheForm] = useState(CACHE_CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isConnectSimaDamri, _setIsConnectSimaDamri] = useState({
        status: false,
        text: ""
    })

    const CACHE_RANGE = [
        {
            "title": "Cacheable",
            "link": "https://automation.rapid.bisku.id/webhook/clear-cache",
            "endpoint": "cacheable_all"
        },
        {
            "title": "Intercity",
            "link": "https://automation.rapid.bisku.id/webhook/clear-cache",
            "endpoint": "intercity_data"
        },
        {
            "title": "Commuter",
            "link": "https://automation.rapid.bisku.id/webhook/clear-cache",
            "endpoint": "commuter_data"
        },
        {
            "title": "Payment",
            "link": "https://automation.rapid.bisku.id/webhook/clear-cache",
            "endpoint": "payment_data"
        }
    ]


    useEffect(() => {
        _setProfile(objectToArray(props.company[1].value.data, null));
        _setPic(objectToArray(props.company[1].value.head, null));
        _setAccountNumber(objectToArray(props.company[1].value.bank, "accountNumber"));
        _getProfile()
    }, [])

    function sortProperty(data, type){
        let word = ["name","phoneNumber","email", "telp", "code", "address","account"];
        let translateWord = ["Nama PO", "Telepon", "Email", "Telepon","Kode PO","Alamat"];
        let indexSort = [1,2,3,5,4,6];

        if(type == "accountNumber"){
            word = __PROPERTY_ACCOUNT_NUMBER;
            translateWord = __TRANS_PROPERTY_ACCOUNT_NUMBER;
            indexSort = __INDEX_ACCOUNT_NUMBER;

        }else if(type == "profileUser"){
            word = __PROPERTY_PROFILE_USER;
            translateWord = __TRANS_PROPERTY_PROFILE_USER;
            indexSort = __INDEX_PROFILE_USER;

        }

        return {
            "name": translateWord[word.indexOf(data)],
            "index": indexSort[word.indexOf(data)]
        }
    }

    function objectToArray(data, type){
        const propertyName = Object.keys(data);
        const propertyValue = Object.values(data);
        let result = [];
        propertyName.forEach(function(val, key){
            let resultSort = sortProperty(val, type);
            if(resultSort.name != undefined){
                result.push({
                    ...resultSort,
                    "value": propertyValue[key]
                })
            }
        })

        result = result.sort((a, b) => {
            return a.index - b.index;
        })

        return result;
    }

    async function _getProfile(){
        try {
            const profile = await get('/user/profile', props.authData.token)
            _setProfileUser(objectToArray(profile.data, "profileUser"));

            if(profile.data.usernameSimaDamri != null){
                _checkStatusSima()
            }
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _updateCacheQuery(data = {}){
        _setCacheForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _saveCredentials(){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }
    
            const result = await postJSON('/user/setSimaDamri', query, props.authData.token)
            
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            _getProfile()
            _updateQuery(CONFIG_PARAM)
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _checkStatusSima(){
        try{
            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/schedule/v2?category=INTERCITY&date=2024-05-28&originId=2&destinationId=69"
            }, null, props.authData.token) 

            _setIsConnectSimaDamri({
                text: "Berhasil terhubung dengan SIMA DAMRI",
                status: true
            })

        } catch (e){
            _setIsConnectSimaDamri({
                status: false,
                text: e.message.id
            })
        }
    }

    async function _clearCache(link, type){
        _setIsProcessing(true)
        try {
            const ports = _cacheForm.ports.split(',').map(port => parseInt(port.trim()));
            const payload = {
                endpoint_type: type, //intercity, cacheable_all
                host: _cacheForm.host,
                ports: ports
            };

            const result = await postJSON({
                url: link
            }, payload, props.authData.token);
            
            popAlert({ message: "Cache berhasil dibersihkan", type: "success" });
        } catch (e) {
            popAlert({ message: e.message || "Gagal membersihkan cache" });
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>
            <AdminLayout/>
            <Row>
                <Col
                column={3}
                >
        
                    <ProfileCard
                    title={'Pengguna'}
                    content={_profileUser}
                    isConnectSimaDamri={_isConnectSimaDamri}
                    />


                    {
                        props.role_id != "9" && (
                            <ProfileCard
                            title={'Data PO'}
                            content={_profile}
                            />            
                        )
                    }
                    
                </Col>

                <Col
                column={3}
                >
                    <Card>
                        <div style={{"marginBottom": "1rem"}}>
                            <strong>
                                Kredensial SIMA DAMRI
                            </strong>
                        </div>
                    
                        <Input
                        marginBottom
                        title={"Username"}
                        placeholder={'Masukan Username'}
                        value={_form.usernameSimaDamri}
                        onChange={(value) => {
                            _updateQuery({
                                "usernameSimaDamri": value
                            })
                        }}
                        />

                        <Input
                        marginBottom
                        type={"password"}
                        title={"Password"}
                        placeholder={'Masukan Password'}
                        value={_form.passwordSimaDamri}
                        onChange={(value) => {
                            _updateQuery({
                                "passwordSimaDamri": value
                            })
                        }}
                        />

                        <Button
                        title={'Simpan'}
                        styles={Button.primary}
                        onClick={_saveCredentials}
                        onProcess={_isProcessing}
                        />  
                    </Card>

                    {
                        props.role_id == "2" && (
                            <Card>
                                <div style={{"marginBottom": "1rem"}}>
                                    <strong>
                                        Clear Cache
                                    </strong>
                                </div>

                                <Input
                                marginBottom
                                title={"Host"}
                                placeholder={'Masukan Host (contoh: 103.150.120.142)'}
                                value={_cacheForm.host}
                                onChange={(value) => {
                                    _updateCacheQuery({
                                        "host": value
                                    })
                                }}
                                />

                                <Input
                                marginBottom
                                title={"Ports"}
                                placeholder={'Masukan Ports (contoh: 8282,8284,8285,8286)'}
                                value={_cacheForm.ports}
                                onChange={(value) => {
                                    _updateCacheQuery({
                                        "ports": value
                                    })
                                }}
                                />

                                <Row>
                                {
                                    CACHE_RANGE.map((val, key) => {
                                        return (
                                            <Col
                                            withPadding
                                            key={key}
                                            >
                                                <Button
                                                title={val.title}
                                                styles={Button.secondary}
                                                onClick={() => {
                                                    _clearCache(val.link, val.endpoint)
                                                }}
                                                onProcess={_isProcessing}
                                                />  
                                            </Col>
                                        )
                                    })
                                }
                                </Row>
                            </Card>
                        )
                    }

                    {
                        props.role_id != "9" && (
                            <>
                                {/* <ProfileCard
                                title={'Person in Charge (PIC)'}
                                content={_pic}
                                /> */}

                                <ProfileCard
                                title={'Data Rekening'}
                                content={_accountNumber}
                                />
                            </>
                        )
                    }
                </Col>
            </Row>
        </Main>
    )

}