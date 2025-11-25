import { useEffect, useState } from 'react'
import Link from 'next/link'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'
import { useRouter } from 'next/router'
import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { AiOutlineLeft, AiFillDelete, AiOutlineClose, AiOutlineCheck} from 'react-icons/ai'
import generateClasses from '../../../../../utils/generateClasses'
import styles from './Traject.module.scss'
import CounterTrajectModal from '../../../../../components/CounterTrajectModal'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function TrajectCounter(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Cabang',
            field : 'branchName',
            textAlign: 'left'
        },
        {
            title : 'Kode Trayek',
            field : 'trajectCode',
            textAlign: 'left'
        },
        {
            title : 'Nama Trayek',
            field : 'trajectName',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
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
                )
            }
        }
    ]

    const [_accessData, _setAccessData] = useState({})
    const [_userLists, _setUserLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_openModal, _setOpenModal] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formDelete, _setFormDelete] = useState({})
    const FORM = {
        "trajectId": "",
        "counterId": router.query.counter,
        "traject": {
            "title": ""
        },
        "segment": {
            "title": "Pemadumoda",
            "value": "COMMUTER",
        }
    }
    const [_form, _setForm] = useState(FORM)
    const [_trajectRanges, _setTrajectRanges] = useState([]);
    const [_segmentRanges, _setSegmentRanges] = useState([
        {
            "title": "Pemadumoda",
            "value": "COMMUTER"
        },
        {
            "title": "AKAP",
            "value": "INTERCITY"
        }
    ])

    useEffect(() => {
        _getTraject()        
    }, [_form.segment])

    useEffect(() => {
        _getAccessModuleData()
        _getData(_page)
        console.log(router)
    }, [])

    useEffect(() => {
    }, [_accessData])

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }
    
    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }
        params.counterId = router.query.counter

        if (query) params.query = query

        try {
            const users = await postJSON('/masterData/counter/trayek/list', params, props.authData.token)
            _setUserLists(users)
            _setPaginationConfig({
                recordLength : users.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(users.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getAccessModuleData(){
        let params = {
            startFrom : 0,
            length: 690,
        }

        try {
            const res = await postJSON(`/masterData/userRoleAkses/aksesModulData/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                data.push({
                    ...val,
                    addRole: false,
                    viewRole: false,
                    updateRole: false,
                    deleteRole: false
                })
            })

            if(res) {
                _setAccessData(data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _deleteTraject(){
        _setIsProcessing(true)
       
        try {    
            const res = await postJSON('/masterData/counter/trayek/delete', _formDelete, props.authData.token)
            _getData()
            _setFormDelete({})
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
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

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 1000,
            "companyId": props.authData.companyId,
            "categoryName": _form.segment.value
        }
        
        try {
            const traject = await postJSON(`/masterData/trayek/list`, params, props.authData.token)
            let trajectRange = [];
            traject.data.forEach(function(val, key){
                trajectRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setTrajectRanges(trajectRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData(url){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }

            delete query.traject
            delete query.segment

            const result = await postJSON('/masterData/counter/trayek/add', query, props.authData.token)
            
            if(result) _getData()
            _setForm(FORM)
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Main>
           
            <ConfirmationModal
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({})
            }}
            onDelete={_deleteTraject}
            onLoading={_isProcessing}
            />

            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href={"/admin/master-data/counter?refQuery="+router.query.refQuery+"&refPage="+router.query.refPage}>
                            <AiOutlineLeft/>
                        </Link>
                        <strong>{router.query.name}</strong>
                    </div>
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
                            >
                                <Input
                                title={"Segmentasi"}
                                placeholder={'Pilih Segmentasi'}
                                value={_form.segment.title}
                                suggestions={_segmentRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "segment": value
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            column={3}
                            withPadding
                            >
                                <Input
                                title={"Trayek"}
                                placeholder={'Pilih Trayek'}
                                value={_form.traject.title}
                                suggestions={_trajectRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "trajectId": value.value,
                                        "traject": value
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            column={1}
                            withPadding
                            >
                                {/* <Button
                                title={'Tambah Trayek'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _setOpenModal(true)
                                }}
                                small
                                /> */}

                                <Button
                                title={'Tambah Trayek'}
                                styles={Button.secondary}
                                onClick={_submitData}
                                onProcess={_isProcessing}
                                />
                            </Col>

                    </Row>

                </Card>
        
                <Card
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_userLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row
                        verticalEnd
                        >
                    
                            <Col
                            column={2}
                            withPadding
                            >
                                <Input
                                placeholder={'Cari'}
                                value={_searchQuery}
                                onChange={(query) => {
                                    const pagination = {
                                        length : Table.defaultProps.recordsPerPageValues[0],
                                        startFrom : 0
                                    }
                                    _setSearchQuery(query)
                                    if (query.length > 1) {
                                        throttle(() => _getData(pagination, query), 300)()
                                    } else {
                                        _getData(pagination, query)
                                    }
                                    _setPage(pagination)
                                }}
                                />
                            </Col>
                            
                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}