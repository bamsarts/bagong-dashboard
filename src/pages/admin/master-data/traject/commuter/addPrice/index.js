import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from '../addTraject/AddTraject.module.scss'
import { BsChevronLeft, BsChevronRight, BsXLg, BsFillPencilFill, BsFillTrashFill } from 'react-icons/bs'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Table from '../../../../../../components/Table'
import { currency, dateFilter } from '../../../../../../utils/filters'
import ConfirmationModal from '../../../../../../components/ConfirmationModal'

export default function AddPrice(props) {
    const router = useRouter()
    const [_locationRange, _setLocationRange] = useState({
        title: "",
        value: ""
    })
    const CONFIG_PARAM = {
        "fare": "",
        "code": "",
        "trackOrder": "1",
        "destinationId": "",
        "originId": "",
        "trajectId": router.query.traject,
        "destination": {
            "title": ""
        },
        "origin": {
            "title": ""
        }
    }
    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_traject, _setTraject] = useState({
        "name": "",
        "code": "",
        "poolName": "",
        "trajectTypeName": ""
    })
    const [_fare, _setFare] = useState([])

    const __COLUMNS = [
        {
            field : 'originName',
            title: 'Asal'
        },
        {
            field : 'destinationName',
            title: 'Tujuan'
        },
        {
            field : 'fare',
            title: 'Tarif (Rp)',
            customCell : (value) => currency(value, '')
        },
        {
            field : 'code',
            title: 'Shortlink Code'
        },
        {
            field : 'id',
            title: 'Aksi',
            style: {"background-color": _form?.id ? 'yellow': 'white'},
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah Tarif"}
                        className={styles.dropdown}
                        onClick={() => {

                            if(_form?.id == row.id){
                                _resetForm()
                            }else{
                                _updateQuery({
                                    ...row,
                                    "origin": {
                                        "title": row.originName,
                                        "value": row.originId
                                    },
                                    "destination": {
                                        "title": row.destinationName,
                                        "value": row.destinationId
                                    },
                                    "fare": currency(row.fare)
                                })
                            }
                        
                        }}
                        >
                            {
                                _form?.id == row.id && (
                                    <BsXLg/>
                                )
                            }

                            {
                                _form?.id != row.id && (
                                    <BsFillPencilFill/>
                                )
                            }
                            
                        </div>

                        <div
                        style={{"color": "red"}}
                        title={"Hapus Tarif"}
                        className={styles.dropdown}
                        onClick={() => {
                            _setFormDelete(row.id)
                        }}
                        >
                            {
                                _form?.id != row.id && (
                                    <BsFillTrashFill/>
                                )
                            }
                            
                        </div>
                    </Row>
                )
            }
        },
    ]

    const [_formDelete, _setFormDelete] = useState("")

    useEffect(() => {
        _getTraject()
        _listFare()
        _getLocation()
    }, [])  

    function _resetForm(){        
        _updateQuery({
            ...CONFIG_PARAM,
            "id": ""
        })
    }

    async function _getLocation() {
        const params = {
            startFrom : 0,
            length : 1560,
            trajectId: router.query.traject
        }
        try {
            const location = await postJSON('/masterData/trayekPoint/list', params, props.authData.token)
            let data = []
            location.data.forEach(function(val, key){
                data.push({
                    "title": val.pointName,
                    "value": val.pointId
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
            delete query.destination
            delete query.origin
            delete query.destinationName
            delete query.destinationCode
            delete query.originName
            delete query.originCode
            delete query.trajectCode
            delete query.trajectName

            if(_form?.id){
                url = "update"
            }else{
                delete query.id
            }

            query.trajectId = router.query.traject
            query.fare = query.fare.split(".").join("")

            const result = await postJSON('/masterData/trayekTrack/'+url, query, props.authData.token)
            
            popAlert({"message": "Berhasil disimpan", "type": "success"})

            _listFare()
            _resetForm()

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    function _sortFare(data){
        data = data.sort((a, b) => {
            return a.trackOrder - b.trackOrder
        });  

        _setFare(data)
    }

    async function _listFare(){
        const params = {
            startFrom : 0,
            length : 1560,
            trajectId: router.query.traject
        }
        try {
            const fare = await postJSON('/masterData/trayekTrack/list', params, props.authData.token)
            
            _sortFare(fare.data)

            if(fare.data.length > 0){
                _updateQuery({
                    trackOrder: fare.data.length+1
                })
            }
            
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _deleteFare(){
        _setIsProcessing(true)
        try{
            
            let query = {
                id: _formDelete
            }

            const result = await postJSON('/masterData/trayekTrack/delete', query, props.authData.token)
            
            popAlert({"message": "Berhasil dihapus", "type": "success"})
            _listFare()
            _setFormDelete("")
        } catch (e){
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <ConfirmationModal
            visible={_formDelete != ""}
            closeModal={() => {
                _setFormDelete("")
            }}
            onDelete={_deleteFare}
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
                        <BsChevronRight/>
                        <a>
                            <span>3</span>
                            <span>Tarif Trayek</span>
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
                                <span>Segmentaasi</span>
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
                    <Row>   
                        
                        <Col
                        column={3}
                        withPadding
                        mobileFullWidth
                        >
                            <h5>{_form?.id ? 'Ubah' : 'Tambah'} Tarif Dasar</h5>

                            <Input
                            marginBottom
                            title={"Asal"}
                            placeholder={'Pilih Asal'}
                            value={_form.origin.title}
                            suggestions={_locationRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _updateQuery({
                                    "origin": data,
                                    "originId": data.value
                                })
                            }}
                            />

                            <Input
                            marginBottom
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

                            <Input
                            marginBottom
                            type={"currency"}
                            title={"Tarif"} 
                            placeholder={'Rp'}
                            value={_form.fare}
                            onChange={(value) => {
                                _updateQuery({
                                    "fare": value
                                })
                            }}
                            />

                            <Input
                            marginBottom
                            title={"Shortlink Code"}
                            placeholder={'Contoh: BOTANI'}
                            value={_form.code}
                            onChange={(value) => {
                                _updateQuery({
                                    "code": value
                                })
                            }}
                            />

                            <Button
                            title={_form?.id ? "Simpan" : 'Tambahkan'}
                            styles={Button.primary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />  
                        </Col>
                        
                        <Col
                        column={3}
                        withPadding
                        mobileFullWidth
                        >
                            <h5>Daftar Tarif Dasar</h5>

                            <div
                            className={styles.route_graph}
                            >
                                <Table
                                exportToXls={false}
                                columns={__COLUMNS}
                                records={_fare}
                                noPadding
                                />
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col
                        column={6}
                        justifyEnd
                        >
                            <Link
                            href={"/admin/master-data/traject/commuter"}
                            >
                                <div
                                style={{"max-width":"10%"}}
                                className={styles.button}
                                >  
                                    <span>Selesai</span>
                                </div>
                            </Link>
                        </Col>
                    </Row>

                </Card>

                
            </AdminLayout>
        </Main>
    )

}