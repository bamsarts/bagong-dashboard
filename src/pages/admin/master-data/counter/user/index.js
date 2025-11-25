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
import { AiFillEye, AiOutlineLeft, AiOutlineClose, AiOutlineCheck, AiFillDelete} from 'react-icons/ai'
import generateClasses from '../../../../../utils/generateClasses'
import styles from './User.module.scss'
import CounterUserTrajectModal from '../../../../../components/CounterUserTrajectModal'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function UserCounter(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Petugas',
            field : 'userName',
            textAlign: 'left'
        },
        {
            title : 'Bisa Lihat',
            field : 'isVew',
            customCell: (value) => {
                if(value == true){
                    return <AiOutlineCheck/> 
                }else{
                    return <AiOutlineClose/>
                }
            }
        },
        {
            title : 'Bisa Tambah',
            field : 'isAdd',
            customCell: (value) => {
                if(value == true){
                    return <AiOutlineCheck/> 
                }else{
                    return <AiOutlineClose/>
                }
            }
        },
        {
            title : 'Bisa Cancel',
            field : 'isCancel',
            customCell: (value) => {
                if(value == true){
                    return <AiOutlineCheck/> 
                }else{
                    return <AiOutlineClose/>
                }
            }
        },
        {
            title : 'Bisa Reschedule',
            field : 'isReschedule',
            customCell: (value) => {
                if(value == true){
                    return <AiOutlineCheck/> 
                }else{
                    return <AiOutlineClose/>
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
                        title={"Ubah Akses"}
                        className={generateClasses([
                            styles.button_action
                        ])}
                        onClick={() => {
                            _setOpenModal(true)
                            _setAccessData(row)
                        }}
                        >
                            <AiFillEye/>
                        </div> 

                        <div
                        title={"Hapus Petugas"}
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
    const [_isMenuAccess, _setIsMenuAccess] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formDelete, _setFormDelete] = useState({
        "id": ""
    })

    useEffect(() => {
        _getAccessModuleData()
        _getData(_page)
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
            const users = await postJSON('/masterData/counter/user/list', params, props.authData.token)
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
            length: 420,
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

    async function _deleteUser(){
        _setIsProcessing(true)
       
        try {    
            const _form = {
               ..._formDelete
            }

            const res = await postJSON('/masterData/counter/user/delete', _form, props.authData.token)

            _getData(_page)
            _setFormDelete({
                "id": ""
            })
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }
    
    return (
        <Main>

            <ConfirmationModal
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({
                    "id": ""
                })
            }}
            onDelete={_deleteUser}
            onLoading={_isProcessing}
            />

            <CounterUserTrajectModal
            visible={_openModal}
            closeModal={() => {
                _setOpenModal(false)
                _setAccessData({})
            }}
            onSuccess={() => {
                _getData()
            }}
            data={_accessData}
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
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_userLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
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
                            <Col
                            column={2}
                            withPadding
                            >
                                <Button
                                title={'Tambah Petugas'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _setOpenModal(true)
                                    _setIsMenuAccess(false)
                                    _setAccessData({})
                                }}
                                small
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