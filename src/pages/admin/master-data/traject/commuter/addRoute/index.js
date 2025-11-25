import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from '../addTraject/AddTraject.module.scss'
import { BsChevronLeft, BsXLg, BsChevronRight, BsArrowRight, BsFillPencilFill, BsFillArchiveFill } from 'react-icons/bs'
import { useRouter } from 'next/router'
import Link from 'next/link'
import generateClasses from '../../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../../components/ConfirmationModal'

export default function AddTraject(props) {
    const router = useRouter()
    const [_locationRange, _setLocationRange] = useState({
        title: "",
        value: ""
    })

    const [_cityRange, _setCityRange] = useState({
        title: "",
        value: ""
    })

    const CONFIG_PARAM = {
        "address": "",
        "estimatedTime": "",
        "latitude": "",
        "longitude": "",
        "pointOrder": "1",
        "trajectId": router.query.traject,
        "url": "",
        "pointId": "",
        "location": {
            "title": ""
        },
        "city": {
            "title": ""
        }
    }
    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_route, _setRoute] = useState([])
    const [_traject, _setTraject] = useState({
        "name": "",
        "code": "",
        "poolName": "",
        "trajectTypeName": ""
    })
    const [_pointOrder, _setPointOrder] = useState(1)
    const [_isEdit, _setIsEdit] = useState(false)
    const [_formDelete, _setFormDelete] = useState("")

    useEffect(() => {
        // _getCity()
        _getLocation()
        _getTraject()
        _listRoute()
    }, [])  

    async function _getCity() {
        const params = {
            startFrom : 0,
            length : 470,
        }
        try {
            const city = await postJSON('/masterData/point/wilayah/list', params, props.authData.token)
            let data = []
            city.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id
                })
            })
           
            _setCityRange(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getLocation(idCity = "") {
        const params = {
            startFrom : 0,
            length : 3800,
            // cityId: idCity
        }
        try {
            const location = await postJSON('/masterData/point/lokasi/list', params, props.authData.token)
            let data = []
            location.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id,
                    ...val
                })
            })
            _setLocationRange(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }
    
    async function _getTraject() {
        const params = {
            startFrom : 0,
            length : 1,
            query: router.query.code
        }

        try {
            const traject = await postJSON('/masterData/trayek/list', params, props.authData.token)
            
            if(traject.data.length > 0){
                _setTraject(traject.data[0])
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
    
    async function _submitData(url){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }
            let url = "add"
            
            if(_form?.id){
                url = "update"
                delete query.estimated_time
                delete query.pointAddress
                delete query.pointName
                delete query.trajectName
                delete query.trajectCode
            }else{
                delete query.id
            }

            delete query.location
            delete query.city
            delete query.title
            delete query.value
            delete query.cityId
            delete query.damriCode
            delete query.name
            delete query.specialRegions
            delete query.branchId
            delete query.provinceId

            query.trajectId = router.query.traject
            
            if(query.latitude == null || query.longitude == null){
                popAlert({"message": "Longitude/latitude belum terisi, silahkan input di Menu Point > Lokasi", "type": "error"})
                return false
            }

            if(query.address == null){
                popAlert({"message": "Detail lokasi belum terisi, silahkan input di Menu Point > Lokasi", "type": "error"})
                return false
            }

            const result = await postJSON('/masterData/trayekPoint/'+url, query, props.authData.token)
            
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            _listRoute()
            _resetForm()
            
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    function _resetForm(){
        let data = CONFIG_PARAM
        data.pointOrder = _pointOrder
        
        _updateQuery({
            ...data,
            "id": ""
        })
    }

    function _sortRoute(data){
        data = data.sort((a, b) => {
            return a.pointOrder - b.pointOrder
        });  

        _setRoute(data)
    }

    async function _listRoute(){
        const params = {
            startFrom : 0,
            length : 1560,
            trajectId: router.query.traject
        }

        try {
            const route = await postJSON('/masterData/trayekPoint/list', params, props.authData.token)
            
            _sortRoute(route.data)

            if(route.data.length > 0){
                _updateQuery({
                    pointOrder: route.data.length+1
                })
                _setPointOrder(route.data.length+1)
            }
            
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _deleteRoute(){
        _setIsProcessing(true)
        try{
            
            let query = {
                id: _formDelete
            }

            const result = await postJSON('/masterData/trayekPoint/delete', query, props.authData.token)
            
            popAlert({"message": "Berhasil dihapus", "type": "success"})
            _listRoute()
            _setFormDelete("")
        } catch (e){
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        _updateQuery({})
    }, [_form.address])

    return (
        <Main>

            <ConfirmationModal
            visible={_formDelete != ""}
            closeModal={() => {
                _setFormDelete("")
            }}
            onDelete={_deleteRoute}
            onLoading={_isProcessing}
            />

            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <a href="/admin/master-data/traject/commuter/">
                            <BsChevronLeft/>
                        </a>
                        <strong>Tambah Trayek</strong>
                    </div>
                    <aside>
                        <a>
                            <span>1</span>
                            <span>Nama Trayek</span>
                        </a>
                        <BsChevronRight/>
                        <a>
                            <span>2</span>
                            <span>Arah Lintasan</span>
                        </a>
                    </aside>
                </div>
            }
            >
                <Card>
                    <Row>
                        
                        <Col
                        column={3}
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                <span>Nama Trayek</span>
                                <strong>{_traject.name}</strong>
                            </div>
                        </Col>

                        <Col
                        column={1}
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                <span>Kode Trayek</span>
                                <strong>{_traject.code}</strong>
                            </div>
                        </Col>

                        <Col
                        column={1}
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                <span>Segmentasi</span>
                                <strong>{_traject.trajectTypeName}</strong>
                            </div>
                        </Col>

                        <Col
                        column={1}
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                <span>Pool</span>
                                <strong>{_traject.poolName}</strong>
                            </div>
                        </Col>
                        
                    </Row>
                </Card>

                <Card
                >    
                    <Row
                    >   
                        
                        <Col
                        column={3}
                        withPadding
                        mobileFullWidth
                        >
                            <h5>{_form?.id ? "Ubah" : 'Tambah'} Lintasan</h5>
                                                        
                            {/* <Input
                            marginBottom
                            title={"Wilayah"}
                            placeholder={'Pilih Wilayah'}
                            value={_form.city.title}
                            suggestions={_cityRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "city": data
                                })
                                _getLocation(data.value)
                            }}
                            /> */}

                            <Input
                            marginBottom
                            title={"Lokasi"}
                            placeholder={'Pilih Lokasi'}
                            value={_form.location.title}
                            suggestions={_locationRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                let temp = data
                                delete temp.id
                                delete temp.pointOrder

                                _updateQuery({
                                    "pointId": data.value,
                                    "location": data,
                                    ...temp
                                })
                            }}
                            />

                            <Input
                            disabled
                            marginBottom
                            multiline={3}
                            title={"Detail Lokasi"}
                            placeholder={'Jl. Pengadegan, No 12, Jakarta Selatan'}
                            value={_form.address}
                            onChange={(value) => {
                                _updateQuery({
                                    "address": value
                                })
                            }}
                            />

                            <Input
                            disabled
                            marginBottom
                            title={"URL Map"}
                            placeholder={'https://goo.gl/maps/7a3sbWx2ucJJF7Eq5'}
                            value={_form.url}
                            onChange={(value) => {
                                _updateQuery({
                                    "url": value
                                })
                            }}
                            />

                            <Input
                            disabled
                            marginBottom
                            title={"Longitude"}
                            placeholder={'-6.247872239803799'}
                            value={_form.longitude}
                            onChange={(value) => {
                                _updateQuery({
                                    "longitude": value
                                })
                            }}
                            />

                            <Input
                            disabled
                            marginBottom
                            title={"Latitude"}
                            placeholder={'106.84830318571751'}
                            value={_form.latitude}
                            onChange={(value) => {
                                _updateQuery({
                                    "latitude": value
                                })
                            }}
                            />

                            <Input
                            type={"number"}
                            marginBottom
                            title={"Waktu Estimasi"}
                            placeholder={'Dalam menit'}
                            value={_form.estimatedTime}
                            onChange={(value) => {
                                _updateQuery({
                                    "estimatedTime": value
                                })
                            }}
                            />

                            <Input
                            max={parseInt(_pointOrder)}
                            type={"number"}
                            marginBottom
                            title={"Point Order"}
                            placeholder={''}
                            value={_form.pointOrder}
                            onChange={(value) => {
                                _updateQuery({
                                    "pointOrder": value
                                })
                            }}
                            />

                        </Col>
                        
                        <Col
                        column={3}
                        withPadding
                        mobileFullWidth
                        >
                            <h5>Grafik Lintasan</h5>

                            <div
                            className={styles.route_graph}
                            >

                                {
                                    _route.map((val, key) => {
                                        return (
                                            <aside>
                                                {
                                                    key != 0 && (
                                                        <BsArrowRight/>
                                                    )
                                                }
                                                <div>
                                                    <span>{val.pointName}</span>

                                                    <i
                                                    style={{"right": "15%"}}
                                                    title={"Ubah"}
                                                    className={generateClasses([
                                                        styles.button_action,
                                                        (_form?.id == val.id) && styles.active
                                                    ])}
                                                    onClick={(el) => {
                                                        
                                                        if(_form?.id == val.id){
                                                            _resetForm()
                                                        }else{
                                                            _updateQuery({
                                                                ...val,
                                                                "location": {
                                                                    "title": val.pointName,
                                                                    "value": val.pointId
                                                                },
                                                                "estimatedTime": val.estimated_time
                                                            })
                                                        }
                                                          
                                                    }}
                                                    >
                                                        {
                                                            _form?.id != val.id && (
                                                                <BsFillPencilFill/>
                                                            )
                                                        }

                                                        {
                                                            _form?.id == val.id && (
                                                                <BsXLg/>
                                                            )
                                                        }
                                                        
                                                    </i>

                                                    <i
                                                    style={{"color": "red"}}
                                                    title={"Hapus"}
                                                    className={generateClasses([
                                                        styles.button_action,
                                                    ])}
                                                    onClick={(el) => {

                                                        _setFormDelete(val.id)

    
                                                    }}
                                                    >
                                                        {
                                                            _form?.id != val.id && (
                                                                <BsFillArchiveFill/>
                                                            )
                                                        }

                                                        
                                                    </i>
                                                </div>
                                            </aside>
                                        )
                                    })
                                }
                                
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col
                        column={1}
                        >
                            <Button
                            title={_form?.id ? 'Simpan' : 'Tambahkan'}
                            styles={Button.primary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />  
                        </Col>
                        <Col
                        column={5}
                        justifyEnd
                        >
                            <Link
                            href={router.asPath.replace("addRoute","addPrice")}
                            >
                                <div
                                className={styles.button}
                                >  
                                    <span>Selanjutnya</span>
                                </div>
                            </Link>
                        </Col>
                    </Row>
                    
                </Card>

                
            </AdminLayout>
        </Main>
    )

}