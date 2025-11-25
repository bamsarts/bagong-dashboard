import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { postJSON } from '../../../../../../api/utils'
import throttle from '../../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import Table from '../../../../../../components/Table'
import { AiFillEye, AiFillDelete } from 'react-icons/ai'
import generateClasses from '../../../../../../utils/generateClasses'
import styles from '../AccessRole.module.scss'
import AccessRoleModal from '../../../../../../components/AccessRoleModal'
import ConfirmationModal from '../../../../../../components/ConfirmationModal'

export default function DetailAccessRole(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Kode Group',
            field : 'kodeGroup'
        },
        {
            title : 'Nama Group',
            field : 'namaGroup'
        },
        {
            title : 'Nama User',
            field : 'name'
        },
        {
            title : 'Aksi',
            field : "idAccessModuleGroup",
            customCell : (value, row) => {
                return (
                    <div
                    title={"Hapus"}
                    className={generateClasses([
                        styles.button_action
                    ])}
                    onClick={() => {
                        _setOpenModalDelete(true)
                        _setFormDelete({
                            "idAccessModuleGroup": value,
                            "idUser": row.idUser
                        })
                    }}
                    >
                        <AiFillDelete/>
                    </div>
                )
            }
        }
    ]

    const [_roleByUserLists, _setRoleLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
    })
    
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_openModal, _setOpenModal] = useState(false)
    const [_users, _setUsers] = useState([])
    const [_openModalDelete, _setOpenModalDelete] = useState(false)
    const [_formDelete, _setFormDelete] = useState({})
    const [_isProcessingDelete, _setIsProcessingDelete] = useState(false)

    useEffect(() => {
        _getUser()
        _getData(_page)
    }, [])

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        idAccessModuleGroup: ""
    })

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
        const _pathArray = router.asPath.split("/")
        const params = {
            ...pagination,
        }
        params.idAccessModuleGroup = _pathArray[5]
        if (query) params.query = query

        try {
            const roleLists = await postJSON('/masterData/userRoleAkses/aksesModulGrup/userList', params, props.authData.token)
            _setRoleLists(roleLists)
            _setPaginationConfig({
                recordLength : roleLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(roleLists.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getUser(){
        const params = {
            "startFrom": 0,
            "length": 1180,
        }

        try {
            const userLists = await postJSON('/masterData/userRoleAkses/user/list', params, props.authData.token)
            let userRange = []
            userLists.data.forEach(function(val, key){
                userRange.push({
                    "title": val.name,
                    "value": val.idUser
                })
            })
            _setUsers(userRange)
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteUser(){
        _setIsProcessingDelete(true)
       
        try {    
            const res = await postJSON('/masterData/userRoleAkses/aksesModulGrup/userDelete', _formDelete, props.authData.token)
            _getData()
            _setOpenModalDelete(false)
            popAlert({"message": "Berhasil dihapus", "type": "success"})
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessingDelete(false)
        }
    }
    
    return (
        <Main>
            <ConfirmationModal
            visible={_openModalDelete}
            closeModal={() => {
                _setOpenModalDelete(false)
            }}
            onDelete={_deleteUser}
            onLoading={_isProcessingDelete}
            />

            <AccessRoleModal
            isUserRole={true}
            visible={_openModal}
            closeModal={() => _setOpenModal(false)}
            onSuccess={() => {
                _getData()
            }}
            users={_users}
            />

            <AdminLayout>
                <Card
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_roleByUserLists.data}
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
                                title={'Tambah User'}
                                styles={Button.secondary}
                                onClick={() => _setOpenModal(true)}
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