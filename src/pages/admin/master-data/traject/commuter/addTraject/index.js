import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from './AddTraject.module.scss'
import { BsChevronLeft } from 'react-icons/bs'
import Label from '../../../../../../components/Label'
import { useRouter } from 'next/router'
import { setConfig } from 'next/config'
import Link from 'next/link'

export default function AddTraject(props) {

    const router = useRouter()
    const [_locationRange, _setLocationRange] = useState({
        title: "",
        value: ""
    })

    const [_trajectTypeRange, _setTrajectTypeRange] = useState({
        title: "",
        value: ""
    })

    const [_poolRange, _setPoolRange] = useState({
        title: "",
        value: ""
    })

    const [_branchRange, _setBranchRange] = useState({
        title: "",
        value: ""
    })

    const CONFIG_PARAM = {
        "code": "",
        "name": "",
        "companyId": props.authData.companyId,
        "destinationId": "",
        "originId": "",
        "duration": "",
        "isOnline": "",
        "trajectTypeId": "",
        "poolId": "",
        "branchId": "",
        "isAirport": "",
        "asOta": "",
        "origin": {
            "title": ""
        },
        "destination": {
            "title": ""
        },
        "trajectType": {
            "title": ""
        },
        "pool": {
            "title": ""
        },
        "branch": {
            "title": ""
        },
        "purchaseOverTime": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_activeTraject, _setActiveTraject] = useState(1)
    const [_isAirport, _setIsAirport] = useState(1)
    const [_isOta, _setIsOta] = useState(1)
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {

        if(router.query?.id){
            if(_checkLocalStorage()?.id){
                _updateQuery({
                    ..._checkLocalStorage(),
                    "purchaseOverTime": _checkLocalStorage()?.purchaseTimeLimitInMinutes
                })
                _setActiveTraject(_checkLocalStorage().isOnline)
                _setIsAirport(_checkLocalStorage().isAirport)
                _setIsOta(_checkLocalStorage().asOta)
            }
        }

        _getLocation()
        _getTrajectType()
        _getPool()
        _getBranch()
       
    }, [])  

    function _checkLocalStorage(){
        let data = localStorage.getItem("traject_damri")
        
        if(data != null){
            const dataParse = JSON.parse(data)

            if(dataParse.id == router.query.id){
                data = dataParse
            }

            return data
        }else{
            return false
        }

    }

    async function _getTrajectType() {
        const params = {
            companyId : props.companyId,
            startFrom : 0,
            length : 470,
        }
        try {
            const type = await postJSON('/masterData/trayekType/list', params, props.authData.token)
            let data = []

            type.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id
                })

                if(val.id == _checkLocalStorage().trajectTypeId){
                    _updateQuery({
                        trajectType : {
                            "title": val.name,
                            "value": val.id
                        }
                    })
                }
            })
           
            _setTrajectTypeRange(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getLocation() {
        const params = {
            startFrom : 0,
            length : 1560,
        }
        try {
            const location = await postJSON('/masterData/point/lokasi/list', params, props.authData.token)
            let data = []
            location.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id
                })

                if(val.id == _checkLocalStorage().destinationId){
                    _updateQuery({
                        destination : {
                            "title": val.name,
                            "value": val.id
                        }
                    })
                }

                if(val.id == _checkLocalStorage().originId){
                    _updateQuery({
                        origin : {
                            "title": val.name,
                            "value": val.id
                        }
                    })
                }
            })
            _setLocationRange(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }
    
    async function _getPool() {
        const params = {
            startFrom : 0,
            length : 1560,
        }
        try {
            const pool = await postJSON('/masterData/branch/pool/list', params, props.authData.token)
            let data = []
            pool.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id
                })

                if(val.id == _checkLocalStorage().poolId){
                    _updateQuery({
                        pool : {
                            "title": val.name,
                            "value": val.id
                        }
                    })
                }
            })
            _setPoolRange(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getBranch() {
        const params = {
            startFrom : 0,
            length : 1560,
        }
        try {
            const branch = await postJSON('/masterData/branch/list', params, props.authData.token)
            let data = []
            branch.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id
                })

                if(val.id == _checkLocalStorage().branchId){
                    _updateQuery({
                        branch : {
                            "title": val.name,
                            "value": val.id
                        }
                    })
                }
            })
            _setBranchRange(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitData(url){
        _setIsProcessing(true)
                       
        try{
            let query = {
                ..._form
            }
            let url = "add"
            delete query.pool
            delete query.trajectType
            delete query.destination
            delete query.origin
            delete query.branch

            query.companyId = props.authData.companyId

            if(router.query?.id){
                url = "update"
                delete query.destinationName
                delete query.branchName
                delete query.destinationCode
                delete query.originCode
                delete query.orignName
                delete query.poolName
                delete query.trajectTypeCode
                delete query.trajectTypeName
                delete query.trajectTypeCategory
                delete query.purchaseTimeLimitInMinutes
            }
            
            const result = await postJSON('/masterData/trayek/'+url, query, props.authData.token)
            
            popAlert({"message": "Berhasil disimpan", "type": "success"})

            setTimeout(() => {
                if(router.query?.id){
                    window.location.href = "/admin/master-data/traject/commuter"
                }else{
                    window.location.href = "/admin/master-data/traject/commuter/addRoute?traject="+result.data.id+"&code="+result.data.code
                }
            }, 1000);

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Main>
            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href="/admin/master-data/traject/commuter/">
                            <BsChevronLeft/>
                        </Link>
                        <strong>{router.query?.id ? 'Ubah ' : 'Tambah '} Trayek</strong>
                    </div>
                    <aside>
                        <div>
                            <span>1</span>
                            <span>Nama Trayek</span>
                        </div>
                    </aside>
                </div>
            }
            >
                <Card
                >    
                    <Row
                    verticalEnd
                    >   
                        
                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={"Kode Trayek"}
                            placeholder={'GBR-BSH'}
                            value={_form.code}
                            onChange={(value) => {
                                _updateQuery({
                                    "code": value
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={3}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={"Nama Trayek"}
                            placeholder={'Soekarno Hatta International Airport - Stasiun Gambir'}
                            value={_form.name}
                            onChange={(value) => {
                                _updateQuery({
                                    "name": value
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={"Cabang"}
                            placeholder={'Pilih Cabang'}
                            value={_form.branch.title}
                            suggestions={_branchRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "branchId": data.value,
                                    "branch": data
                                })
                            }}
                            />
                        </Col>


                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={"Asal"}
                            placeholder={'Pilih Asal'}
                            value={_form.origin.title}
                            suggestions={_locationRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "originId": data.value,
                                    "origin": data
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={"Tujuan"}
                            placeholder={'Pilih Tujuan'}
                            value={_form.destination.title}
                            suggestions={_locationRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "destinationId": data.value,
                                    "destination": data
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={"Segmentasi"}
                            placeholder={'Pilih Segmentasi'}
                            value={_form.trajectType.title}
                            suggestions={_trajectTypeRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "trajectTypeId": data.value,
                                    "trajectType": data
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={"Pool"}
                            placeholder={'Pilih Pool'}
                            value={_form.pool.title}
                            suggestions={_poolRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "poolId": data.value,
                                    "pool": data
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >   
                            <div
                            className={styles.container}
                            >
                                <div
                                className={styles.activate_container}
                                >
                                    <span
                                    className={styles.mb_1}
                                    >
                                        Aktivasi Trayek
                                    </span>
                                    
                                    <Label
                                    activeIndex={_activeTraject}
                                    labels={[
                                        {
                                            class: "warning",
                                            title: 'Non Aktif',
                                            value: false,
                                            onClick : () => {
                                                _setActiveTraject(false)
                                                _updateQuery({
                                                    "isOnline": false
                                                })
                                            }
                                        },
                                        {
                                            class: "primary",
                                            title: 'Aktif',
                                            value: true,
                                            onClick : (value) => {
                                                _setActiveTraject(true)
                                                _updateQuery({
                                                    "isOnline": true
                                                })
                                            }
                                        }
                                    ]}
                                    />
                                </div>
                            </div>
                            
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >   
                            <div
                            className={styles.container}
                            >
                                <div
                                className={styles.activate_container}
                                >
                                    <span
                                    className={styles.mb_1}
                                    >
                                        Bandara
                                    </span>
                                    
                                    <Label
                                    activeIndex={_isAirport}
                                    labels={[
                                        {
                                            class: "warning",
                                            title: 'Tidak',
                                            value: false,
                                            onClick : () => {
                                                _setIsAirport(false)
                                                _updateQuery({
                                                    "isAirport": false
                                                })
                                            }
                                        },
                                        {
                                            class: "primary",
                                            title: 'Ya',
                                            value: true,
                                            onClick : () => {
                                                _setIsAirport(true)
                                                _updateQuery({
                                                    "isAirport": true
                                                })
                                            }
                                        }
                                    ]}
                                    />
                                </div>
                            </div>
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >   
                            <div
                            className={styles.container}
                            >
                                <div
                                className={styles.activate_container}
                                >
                                    <span
                                    className={styles.mb_1}
                                    >
                                        OTA
                                    </span>
                                    
                                    <Label
                                    activeIndex={_isOta}
                                    labels={[
                                        {
                                            class: "warning",
                                            title: 'Tidak',
                                            value: false,
                                            onClick : () => {
                                                _setIsOta(false)
                                                _updateQuery({
                                                    "asOta": false
                                                })
                                            }
                                        },
                                        {
                                            class: "primary",
                                            title: 'Ya',
                                            value: true,
                                            onClick : () => {
                                                _setIsOta(true)
                                                _updateQuery({
                                                    "asOta": true
                                                })
                                            }
                                        }
                                    ]}
                                    />
                                </div>
                            </div>
                            
                        </Col>

                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            type={"number"}
                            title={"Durasi"}
                            placeholder={'Dalam menit'}
                            value={_form.duration}
                            onChange={(value) => {
                                _updateQuery({
                                    "duration": value
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            type={"number"}
                            title={"Pembelian batas waktu"}
                            placeholder={'Dalam menit'}
                            value={_form.purchaseOverTime}
                            onChange={(value) => {
                                _updateQuery({
                                    "purchaseOverTime": value
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={5}
                        mobileFullWidth
                        withPadding
                        justifyEnd
                        >
                            <Button
                            title={'Simpan dan Lanjutkan'}
                            styles={Button.secondary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />  
                        </Col>
                    </Row>
                </Card>

                
            </AdminLayout>
        </Main>
    )

}