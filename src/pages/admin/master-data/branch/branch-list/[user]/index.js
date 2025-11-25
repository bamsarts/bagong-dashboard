import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../../api/utils'
import throttle from '../../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import Table from '../../../../../../components/Table'
import { Col, Row } from '../../../../../../components/Layout'
import styles from './User.module.scss'
import { AiOutlineTeam, AiFillDelete, AiOutlineLeft } from 'react-icons/ai'
import Link from 'next/link'
import generateClasses from '../../../../../../utils/generateClasses'
import { useRouter } from 'next/router'
import ConfirmationModal from '../../../../../../components/ConfirmationModal'

export default function BranchUser(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Nama',
            field : 'userName',
            textAlign: 'left'
        },
        {
            title : 'Email',
            field : 'userEmail',
            textAlign: 'left'
        },
        {
            title: 'Username',
            field: 'userUsername'
        },
        {
            title : 'Aksi',
            field : "id",
            minWidth: '50px',
            customCell : (value, row) => {
                return (
                   
                    <div
                    title={"Hapus User"}
                    className={generateClasses([
                        styles.button_action
                    ])}
                    onClick={() => {
                        _updateQuery({
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

    const [_users, _setUsers] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: 'desc'
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_userRanges, _setUserRanges] = useState([])
    const FORM = {
        "userId": "",
        "branchId": router.query.user,
        "user": {
            "title": ""
        },
    }
    const [_form, _setForm] = useState(FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {
        _getData(_page)
        _getUsers()
    }, [])

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

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

        params.branchId = router.query.user
        
        if (query) params.query = query

        try {
            const users = await postJSON('/masterData/branch/user/list', params, props.authData.token)
            _setUsers(users)
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

    async function _getUsers() {
        const params = {
            "startFrom": 0,
            "length": 1060,
            "sortMode": "desc",
            "orderBy": "idUser",
        }
        
        try {
            const user = await postJSON(`/masterData/userRoleAkses/user/list`, params, props.authData.token)
            let userRange = [];
            user.data.forEach(function(val, key){
                userRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setUserRanges(userRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData(){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }

            delete query.user

            const result = await postJSON('/masterData/branch/user/add', query, props.authData.token)
            
            if(result) _getData()
            _setForm(FORM)
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _deleteUser(url){
        _setIsProcessing(true)
        try { 
            let query = {
                "id": _form.id
            }
            
            const res = await postJSON('/masterData/branch/user/delete', query, props.authData.token)
            _getData()
            _setForm(FORM)
            _setIsProcessing(false)
            popAlert({"message": "Berhasil dihapus", "type": "success"})
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }
   
    return (
        <Main>
            
            <ConfirmationModal
            visible={_form?.id}
            closeModal={() => {
                _setForm(FORM)
            }}
            onDelete={_deleteUser}
            onLoading={_isProcessing}
            />

            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href="/admin/master-data/branch/branch-list">
                            <AiOutlineLeft/>
                        </Link>
                        <strong>{router.query.branch}</strong>
                    </div>
                </div>
            }
            >

                <Card
                noPadding
                >
                    <Table
                    headExport={[
                        {
                            title: "Cabang",
                            value: 'branchName'
                        },
                        {
                            title: "Alamat Cabang",
                            value: 'branchAddress'
                        },
                        {
                            title: "Nama",
                            value: 'username'
                        },
                        {
                            title: "Email",
                            value: 'userEmail'
                        },
                        {
                            title: "Username",
                            value: 'userUsername'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_users.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            
                            {
                                _userRanges.length > 0 && (
                                    <>
                                        <Col
                                        column={2}
                                        withPadding
                                        >
                                            <Input
                                            placeholder={'Pilih User'}
                                            value={_form.user.title}
                                            suggestions={_userRanges}
                                            suggestionField={'title'}
                                            onSuggestionSelect={(value) => {
                                                _updateQuery({
                                                    "userId": value.value,
                                                    "user": value
                                                })
                                            }}
                                            />       
                                        </Col>
                                        
                                        <Col
                                        column={2}
                                        withPadding
                                        >
                                            <Row
                                            >
                                                <Button
                                                title={'Tambah User'}
                                                styles={Button.secondary}
                                                onClick={() => {
                                                    _submitData()
                                                }}
                                                small
                                                onProcess={_isProcessing}
                                                />

                                            </Row>
                                            
                                        </Col>
                                    </>
                                )
                            }
                            

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