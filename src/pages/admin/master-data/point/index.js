import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import Button from '../../../../components/Button'
import Tabs from '../../../../components/Tabs'
import { Col, Row } from '../../../../components/Layout'
import throttle from '../../../../utils/throttle'
import PointModal from '../../../../components/PointModal'
import styles from './Point.module.scss'
import { AiFillEye, AiFillDelete } from 'react-icons/ai'
import generateClasses from '../../../../utils/generateClasses'
import ConfirmationModal from '../../../../components/ConfirmationModal'

export default function Point(props) {

    const __COLUMNS_PROVINCE = [
        {
            title : 'Provinsi',
            field : 'provinceName',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah"}
                        className={styles.button_action}
                        onClick={() => {
                            _setTypeModal('provinsi')
                            _setDataPoint(row)
                            _toggleModal(true)
                        }}
                        >
                            <AiFillEye/>
                        </div>

                        <div
                        title={"Hapus"}
                        className={generateClasses([
                            styles.button_action,
                            styles.text_red
                        ])}
                        onClick={() => {
                            _setFormDelete({
                                "id": value
                            })
                        }}
                        >
                            <AiFillDelete/>
                        </div>
                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_CITY = [
        {
            title: 'Provinsi',
            field: 'provinceName'
        },
        {
            title : 'Wilayah',
            field : 'name'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Lihat"}
                        className={styles.button_action}
                        onClick={() => {
                            _setTypeModal('wilayah')
                            _setDataPoint(row)
                            _toggleModal(true)
                        }}
                        >
                            <AiFillEye/>
                        </div>

                        <div
                        title={"Hapus"}
                        className={generateClasses([
                            styles.button_action,
                            styles.text_red
                        ])}
                        onClick={() => {
                            _setFormDelete({
                                "id": value
                            })
                        }}
                        >
                            <AiFillDelete/>
                        </div>
                    </Row>
                    
                )
        }
    }
    ]

    const __COLUMNS_LOCATION = [
        {
            title : 'Kode Lokasi',
            field : 'damriCode'
        },
        {
            title : 'Lokasi',
            field : 'name',
            textAlign: 'left'
        },
        {
            title : 'Alamat',
            field : 'address',
            textAlign: 'left'
        },
        {
            title : 'Cabang',
            field : 'branchId',
            textAlign: 'left',
            customCell: (value, row) => {
                return _branchObject[value]
            }
        },
        {
            title : 'URL Map',
            field : 'url',
            textAlign: 'left',
            customCell: (value, row) => {
                if(value != null){
                    return <a 
                    className={styles.text_primary} 
                    target="_blank"
                    href={value}
                    >
                        {value.length > 36 ? (value.slice(0,35)+"...") : value}
                    </a>
                }else{
                    return ''
                }
                
            }
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Lihat"}
                        className={styles.button_action}
                        onClick={() => {
                            _setTypeModal('lokasi')
                            _setDataPoint(row)
                            _toggleModal(true)
                        }}
                        >
                            <AiFillEye/>
                        </div>
                        
                        <div
                        title={"Hapus"}
                        className={generateClasses([
                            styles.button_action,
                            styles.text_red
                        ])}
                        onClick={() => {
                            _setFormDelete({
                                "id": value
                            })
                        }}
                        >
                            <AiFillDelete/>
                        </div>
                    </Row>
                    
                )
            }
        }
    ]

    const [_provinceLists, _setProvinceLists] = useState([])
    const [_cityLists, _setCityLists] = useState([])
    const [_locationLists, _setLocationLists] = useState([])
    const [_formDelete, _setFormDelete] = useState({})

    let [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_pageProvince, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })
    const [_pageCity, _setPageCity] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })
    const [_pageLocation, _setPageLocation] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })

    const [_activeIndex, _setActiveIndex] = useState(0)
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_locationCreate, _setLocationCreate] = useState(false)
    const [_typeModal, _setTypeModal] = useState('')
    const [_dataPoint, _setDataPoint] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_cityRanges, _setCityRanges] = useState([])
    const [_branchRanges, _setBranchRanges] = useState([])
    const [_branchObject, _setBranchObject] = useState({})

    useEffect(() => {   
        _getProvince(_pageProvince)
        _setActiveIndex('provinsi')
        _getBranch()
    }, [])

    function _setPointToCity(data){
        console.log(data)
        console.log(_cityRanges)
    }   

    function _setPagination(pagination) {
    
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getProvince(pagination)
    }

    function _setPaginationCity(pagination){
        _setPageCity(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getCity(pagination)
    }

    function _setPaginationLocation(pagination){
        _setPageLocation(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getLocation(pagination)
    }
    
    async function _getProvince(pagination, query = '') {
        const params = {
            ...pagination
        }

        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }

        try {
            const pointLists = await postJSON(`/masterData/point/provinsi/list`, params, props.authData.token)
            _setProvinceLists(pointLists)
            _setPaginationConfig({
                recordLength : pointLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(pointLists.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getCity(pagination, query = '') {
        const params = {
            ...pagination
        }

        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }

        try {
            const pointLists = await postJSON(`/masterData/point/wilayah/list`, params, props.authData.token)
            _setCityLists(pointLists)
            _setPaginationConfig({
                recordLength : pointLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(pointLists.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getLocation(pagination, query = '', code = "") {
        const params = {
            ...pagination
        }
        
        if(query && code == "") params.query = query
        if(code != "") params.damriCode = code

        if(query != ""){
            params.startFrom = 0
        }

        try {
            const pointLists = await postJSON(`/masterData/point/lokasi/list`, params, props.authData.token)

            if(pointLists.data.length == 0 && code == ""){
                _getLocation(_pageLocation, query, query)
            }

            _setLocationLists(pointLists)
            _setPaginationConfig({
                recordLength : pointLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(pointLists.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    function _toggleModal(data){
        _setLocationCreate(data)
    }

    async function _deletePoint(){
        _setIsProcessing(true)
       
        try {    
            const res = await postJSON(`/masterData/point/${_activeIndex}/delete`, _formDelete, props.authData.token)
            _getData()
            _setFormDelete({})
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getCityRanges(){
        const params = {
            startFrom: 0,
            length: 1010
        } 

        try {    
            const res = await postJSON(`/masterData/point/wilayah/list`, params, props.authData.token)
            _setCityRanges(res.data)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
        }
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 280
        }
        
        try {
            const branch = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let branchRange = [];
            let branchObject = {}

            branch.data.forEach(function(val, key){
                branchRange.push({
                    "title": val.name,
                    "value": val.id
                })

                branchObject[val.id] = val.name
            })

            _setBranchRanges(branchRange)
            _setBranchObject(branchObject)
        } catch (e) {
            console.log(e)
        }
    }

    function _getData(){
        if(_activeIndex == "provinsi"){
            _getProvince(_pageProvince)
        }else if(_activeIndex == "wilayah"){
            _getCity(_pageCity)
        }else{
            _getLocation(_pageLocation)
        }
    }

    return (
        <Main>
            <PointModal
            visible={_locationCreate}
            closeModal={() => {
                _toggleModal(false)
                _setDataPoint({})
            }}
            branch={_branchRanges}
            typeModal={_typeModal}
            data={_dataPoint}
            onSuccess={() => {
               _getData()
            }}
            />

            <ConfirmationModal  
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({})
            }}
            onDelete={_deletePoint}
            onLoading={_isProcessing}
            />
        
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Provinsi',
                        value : 'provinsi',
                        onClick : () => {
                            _setActiveIndex('provinsi')
                            _getProvince(_pageProvince)

                        }
                    },
                    {
                        title : 'Wilayah',
                        value : 'wilayah',
                        onClick : () => {
                            _setActiveIndex('wilayah')
                            _getCity(_pageCity)
                        }
                    },
                    {
                        title : 'Lokasi',
                        value : 'lokasi',
                        onClick : () => {
                            _setActiveIndex('lokasi')
                            _getLocation(_pageLocation)
                        }
                    },
                ]}
                />
            }
            >  

            {
                _activeIndex == "provinsi" && (
                    <Card
                    noPadding
                    >
                        <Table
                        headerContent={(
                            <Row>
                                <Col
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getData(_page, query), 100)()
                                        }else{
                                            _getProvince(_pageProvince, query)  
                                        }
                                    }}
                                    />
                                </Col>

                                <Col
                                column={2}
                                withPadding
                                >
                                    <Button
                                    title={'Tambah Provinsi'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _toggleModal(true)
                                        _setTypeModal('provinsi')
                                    }}
                                    small
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={__COLUMNS_PROVINCE}
                        records={_provinceLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPagination({ ..._pageProvince, startFrom : (page - 1) * _pageProvince.length })}
                        />
                    </Card>
                )
            }    

            {
                _activeIndex == "wilayah" && (
                    <Card
                    noPadding
                    >
                        <Table
                        headerContent={(
                            <Row>
                                <Col
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getCity(_pageCity, query), 100)()
                                        }else{
                                            _getCity(_pageCity, query)  
                                        }
                                    }}
                                    />
                                    
                                </Col>
                                <Col
                                column={2}
                                withPadding
                                >
                                    <Button
                                    title={'Tambah Wilayah'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _toggleModal(true)
                                        _setTypeModal('wilayah')
                                    }}
                                    small
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={__COLUMNS_CITY}
                        records={_cityLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPaginationCity({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPaginationCity({ ..._pageCity, startFrom : (page - 1) * _pageCity.length })}
                        />
                    </Card>
                )
            }         

            {
                _activeIndex == "lokasi" && (
                    <Card
                    noPadding
                    >
                        <Table
                        headerContent={(
                            <Row>
                                <Col
                                withPadding
                                column={2}
                                >
                                    <Input
                                    withPadding
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getLocation(_pageLocation, query, ""), 100)()
                                        }else{
                                            _getLocation(_pageLocation, query, "")
                                        }
                                    }}
                                    />
                                    
                                </Col>
                                <Col
                                column={2}
                                withPadding
                                >
                                    <Button
                                    title={'Tambah Lokasi'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _toggleModal(true)
                                        _setTypeModal("lokasi")
                                    }}
                                    small
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={__COLUMNS_LOCATION}
                        records={_locationLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPaginationLocation({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPaginationLocation({ ..._pageLocation, startFrom : (page - 1) * _pageLocation.length })}
                        />
                    </Card>
                )
            }         
                            
            </AdminLayout>
        </Main>
    )

}