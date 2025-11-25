import { useEffect, useState } from 'react'

import { postJSON, get } from '../../../api/utils'

import Main, { popAlert } from '../../../components/Main'
import AdminLayout from '../../../components/AdminLayout'
import Card from '../../../components/Card'
import Input from '../../../components/Input'
import Table from '../../../components/Table'
import Button from '../../../components/Button'
import Tabs from '../../../components/Tabs'
import { Col, Row } from '../../../components/Layout'
import throttle from '../../../utils/throttle'
import TemplateWaModal from '../../../components/TemplateWaModal'
import styles from './ModuleWhatsapp.module.scss'
import { AiFillEye, AiFillDelete } from 'react-icons/ai'
import generateClasses from '../../../utils/generateClasses'
import { dateFilter } from '../../../utils/filters'
import { QRCode } from 'react-qrcode-logo'
import ConfirmationModal from '../../../components/ConfirmationModal'

export default function ModulWhatsapp(props) {

    const _FORM = {
        "id": "",
        "nameConfig": "",
        "dataConfig": ""
    }

    const __COLUMNS_TEMPLATE = [
        {
            title : 'Kategori',
            field : 'categoryName',
            textAlign: 'left'
        },
        {
            title : 'Template',
            field : 'template',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            style: {
                "minWidth": "100px"
            },
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah"}
                        className={styles.button_action}
                        onClick={() => {
                            _setRowData(row)
                            _setIsOpenModal(true)
                        }}
                        >
                            <AiFillEye/>
                        </div>
                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_CATEGORY = [
        {
            title: 'Nama',
            field: 'name'
        },
        {
            title : 'Deskpripsi',
            field : 'description'
        },
        {
            title : 'Tanggal Diubah',
            field : 'last_modified_at',
            customCell : (value, row) => {
                return dateFilter.getFullDate(new Date(value))
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
                            _setRowData(row)
                            _setIsOpenModal(true)
                        }}
                        >
                            <AiFillEye/>
                        </div>
                    </Row>
                    
                )
        }
    }
    ]

    const __COLUMNS_INBOX = [
        {
            title: 'Pengirim',
            field: 'sender'
        },
        {
            title : 'Pesan',
            field : 'text'
        },
        {
            title : 'Penerima',
            field : 'receiver'
        },
        {
            title : 'Tanggal Diubah',
            field : 'last_modified_at',
            customCell : (value, row) => {
                return value
            }
        },
        {
            title : 'Tanggal Dibuat',
            field : 'created_at',
            customCell : (value, row) => {
                return value
            }
        }
    
    ]

    const [_formConfig, _setFormConfig] = useState(_FORM)
    const [_templateLists, _setTemplateLists] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formDelete, _setFormDelete] = useState({})
    const [_columnTable, _setColumnTable] = useState(__COLUMNS_TEMPLATE)
    const PAGING = {
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    }

    let [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_pageTemplate, _setPageTemplate] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })
    
    const [_pageCategory, _setPageCategory] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })

    const [_activeIndex, _setActiveIndex] = useState("status")
    const [_searchQuery, _setSearchQuery] = useState('')
    
    const [_titleModal, _setTitleModal] = useState('Template')
    const [_categoryRanges, _setCategoryRanges] = useState([])
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_rowData, _setRowData] = useState({})
    const [_waConfig, _setWaConfig] = useState({})
    const [_form, _setForm] = useState({
        "receiver": "",
        "text": ""
    })

    const [_isOpenModalConfirmation, _setIsOpenModalConfirmation] = useState()

    useEffect(() => {   
        _getWaConfig()
        _getCategory()
        _getWaList()
    }, [])

    function _setPointToCity(data){
        console.log(data)
        console.log(_cityRanges)
    }   

    function _setPagination(pagination) {
        
        _setPageTemplate(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })

        _getWaTemplate(pagination)
    }

    
    async function _getWaTemplate(pagination, query = '') {
        const params = {
            ...pagination
        }

        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }

        if(_activeIndex.split("-").length > 1){
            params.type = _activeIndex.split("-")[1]
        }

        try {
            const waTemplate = await postJSON(`/masterData/${_activeIndex.split("-")[0]}/list`, params, props.authData.token)
            _setTemplateLists(waTemplate.data)
            _setPaginationConfig({
                recordLength : waTemplate.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(waTemplate.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getCategory() {
        const params = {
            "startFrom": 0,
            "length": 280,
            "orderBy": "id",
            "sortMode": "desc"
        }
        
        try {
            const category = await postJSON(`/masterData/waCategory/list`, params, props.authData.token)
            
            _setCategoryRanges(category.data)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getWaConfig(){
        _setIsProcessing(true)
        try {
            const config = await get(`/masterData/waMessage/config`, props.authData.token)
            
            _setWaConfig(config.data)
            _setIsProcessing(false)
        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    async function _getWaList(){
        _setIsProcessing(true)
        try {
            const config = await get(`/masterData/waMessage/config/list`, props.authData.token)
            
            config.data.forEach(function(val, key){
                if(val.name_config == "wa_number"){
                    _setFormConfig({
                        "id": val.id,
                        "nameConfig": val.name_config,
                        "dataConfig": val.data_config
                    })
                }
            })

            _setIsProcessing(false)
        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    async function _sendWa(){
        
        _setIsProcessing(true)
        
        let query  = {
            ..._form,
        }

        try{
            
            const result = await postJSON('/masterData/waMessage/send', query, props.authData.token)
            
            popAlert({"message": "Berhasil terkirim", "type": "success"})

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _updateWaConfig(){
        
        _setIsProcessing(true)
        
        let query  = {
            ..._formConfig
        }

        try{
            
            const result = await postJSON('/masterData/waMessage/config/update', query, props.authData.token)
            
            popAlert({"message": "Berhasil diubah", "type": "success"})

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _logoutWa(){
        

        _setIsProcessing(true)

        try{
            
            const result = await get('/masterData/waMessage/logout', props.authData.token)
            
            if(result) {
                popAlert({ message: "Berhasil keluar", type: "success"})
                _getWaConfig()
                _setIsOpenModalConfirmation(false)
            }

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
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

    function _getData(){
        if(_activeIndex == "waTemplate"){
            _getWaTemplate(_pageTemplate)
        }else if(_activeIndex == "wilayah"){
            _getCity(_pageCity)
        }else{
            _getLocation(_pageLocation)
        }
    }

    useEffect(() => {

        if(_activeIndex == "status"){
            _getWaConfig()
        }else{
            _setPagination({ ..._pageTemplate, startFrom : 0 })
        }
    }, [_activeIndex])



    return (
        <Main>
            <TemplateWaModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
                _setRowData({})
            }}
            data={_rowData}
            category={_categoryRanges}
            onSuccess={() => {
                _getWaTemplate(_pageTemplate)
            }}
            typeModal={_activeIndex}
            titleModal={_titleModal}
            />

            <ConfirmationModal
            title={"Konfirmasi Logout"}
            content={""}
            buttonRightTitle={"Ya"}
            visible={_isOpenModalConfirmation}
            closeModal={() => {
                _setIsOpenModalConfirmation(false)
            }}
            onDelete={_logoutWa}
            onLoading={_isProcessing}
            />

        
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Status',
                        value : 'status',
                        onClick : () => {
                            _setActiveIndex("status")
                        }
                    },
                    {
                        title : 'Template',
                        value : 'waTemplate',
                        onClick : () => {
                            _setColumnTable(__COLUMNS_TEMPLATE)
                            _setActiveIndex('waTemplate')
                            _setTitleModal("Template")
                        }
                    },
                    {
                        title : 'Kategori',
                        value : 'waCategory',
                        onClick : () => {
                            _setColumnTable(__COLUMNS_CATEGORY)
                            _setActiveIndex('waCategory')
                            _setTitleModal("Kategori")
                        }
                    },
                    {
                        title : 'Kotak Masuk',
                        value : 'waMessage-1',
                        onClick : () => {
                            _setColumnTable(__COLUMNS_INBOX)
                            _setActiveIndex('waMessage-1')
                        }
                    },
                    {
                        title : 'Kotak Keluar',
                        value : 'waMessage-0',
                        onClick : () => {
                            _setColumnTable(__COLUMNS_INBOX)
                            _setActiveIndex('waMessage-0')
                        }
                    },
                ]}
                />
            }
            >  

            {
                (_activeIndex == "status") && (

                    <Row>
                        <Col
                        column={3}
                        >
                            <Card>

                                <Row
                                spaceBetween
                                marginBottom
                                >
                                    <Col
                                    column={4}
                                    style={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                    >
                                        <span
                                        style={{
                                            marginRight: "1rem"
                                        }}
                                        >
                                            WA Center
                                        </span>

                                        <Input
                                        type={"text"}
                                        title={``}
                                        value={_formConfig.dataConfig}
                                        onChange={no => {
                                            _setFormConfig( oldQuery => {
                                                return {
                                                    ...oldQuery,
                                                    "dataConfig": no
                                                }
                                            })
                                        }}
                                        />

                                        <Button
                                        styles={Button.success}
                                        marginLeft
                                        onProcess={_isProcessing}
                                        small
                                        title={"Ubah"}
                                        onClick={() => {
                                            _updateWaConfig()
                                        }}
                                        />      
                                       
                                    </Col>

                                    <Col
                                    alignEnd
                                    column={2}
                                    >
                                        <Button
                                        onProcess={_isProcessing}
                                        small
                                        title={"Refresh"}
                                        onClick={() => {
                                            _getWaConfig()
                                        }}
                                        />
                                    </Col>
                                </Row>
                               
                                <Row>
                                    <Col
                                    column={3}
                                    >         
                                        {
                                            _waConfig.client_status && (
                                                <p
                                                className={generateClasses([
                                                    styles.label,
                                                    _waConfig.client_status == 200 ? styles.green : '' 
                                                ])}
                                                >
                                                    {_waConfig.client_status == 500 ? 'Belum ' : ''} Terhubung
                                                </p>
                                            )
                                        }
                                    </Col>

                                    <Col
                                    column={3}
                                    alignEnd
                                    >
                                        <Button
                                        styles={Button.secondary}
                                        onProcess={_isProcessing}
                                        small
                                        title={"Logout"}
                                        onClick={() => {
                                            _setIsOpenModalConfirmation(true)
                                        }}
                                        />
                                        
                                    </Col>
                                </Row>

                               

                                {
                                    _waConfig?.qr_code && (
                                        <Col
                                        style={{
                                            marginTop: "3rem"
                                        }}
                                        alignCenter
                                        >
                                            <QRCode
                                            value={`${_waConfig.qr_code}`}
                                            ecLevel={'L'}
                                            size={300}
                                            fgColor={'#000'}
                                            removeQrCodeBehindLogo={true}
                                            style={{
                                                marginBottom : '1rem',
                                            }}
                                            />

                                            <strong>Scan QR untuk menghubungkan</strong>

                                            <ol>
                                                <li>Buka aplikasi Whatsapp di smartphone Anda</li>
                                                <li>Ketuk Menu di Android, atau Pengaturan di Iphone</li>
                                                <li>Ketuk "Perangkat tertaut" lalu "Tautkan perangkat"</li>
                                                <li>Arahkan telepon Anda pada layar untuk memindai kode QR</li>
                                            </ol>
                                        </Col>
                                    )
                                }
                               
                            </Card>
                        </Col>

                        <Col
                        column={3}
                        >   
                            <Card>
                                <p
                                style={{
                                    margin: "0rem 0rem 1rem .5rem"
                                }}
                                >
                                    Kirim pesan WhatsApp
                                </p>

                                <Input
                                withMargin
                                placeholder={"62812XXX"}
                                title={"No Tujuan"}
                                value={_form.receiver}
                                onChange={(value) => {
                                    _updateQuery({
                                        "receiver": value
                                    })
                                }}
                                />

                                <Input
                                multiline={3}
                                withMargin
                                title={"Pesan"}
                                value={_form.text}
                                onChange={(value) => {
                                    _updateQuery({
                                        "text": value
                                    })
                                }}
                                />

                                <Col
                                style={{
                                    margin: "1rem .5rem"
                                }}
                                withPadding
                                >
                                    <Button
                                    disabled={!_form?.receiver}
                                    title={'Kirim'}
                                    styles={Button.secondary}
                                    onClick={_sendWa}
                                    onProcess={_isProcessing}
                                    />
                                </Col>
                                
                            </Card>
                        </Col>
                    </Row>
                    
                )
            }

            {
                _activeIndex != "status" && (
                    
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
                                
                                {
                                    (_activeIndex == "waCategory" || _activeIndex == "waTemplate") && (
                                        <Col
                                        column={2}
                                        withPadding
                                        >
                                            <Button
                                            title={'Tambah '+_titleModal}
                                            styles={Button.secondary}
                                            onClick={() => {
                                                _setIsOpenModal(true)
                                            }}
                                            small
                                            />
                                        </Col>
                                    )
                                }
                                
                            </Row>
                        )}
                        columns={_columnTable}
                        records={_templateLists}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPagination({ ..._pageTemplate, startFrom : (page - 1) * _pageTemplate.length })}
                        />
                    </Card>

                )
            }
              

                         
            </AdminLayout>
        </Main>
    )

}