import { useEffect, useState } from 'react'
import Link from 'next/link'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { AiFillEye, AiFillHdd } from 'react-icons/ai'
import generateClasses from '../../../../../utils/generateClasses'
import styles from './AccessRole.module.scss'
import AccessRoleModal from '../../../../../components/AccessRoleModal'

export default function AccessRole(props) {

    const __COLUMNS = [
        {
            title : 'Kode',
            field : 'kodeGroup'
        },
        {
            title : 'Role',
            field : 'namaGroup'
        },
        {
            title : 'Aksi',
            field : "idAccessModuleGroup",
            customCell : (value, row) => {
                return (
                    <>
                        <Link
                        href={window.location.href+"/"+value}
                        >
                            <div
                            title={"Lihat"}
                            className={generateClasses([
                                styles.button_action
                            ])}
                            >
                                <AiFillEye/>
                            </div>
                        </Link>
                        
                        <div
                        title={"Ubah Role"}
                        className={generateClasses([
                            styles.button_action
                        ])}
                        onClick={() => {
                            _setOpenModal(true)
                            _setIsMenuAccess(true)
                            _setAccessData(row)
                        }}
                        >
                            <AiFillHdd/>
                        </div>

                    </>
                )
            }
        }
    ]

    const [_accessData, _setAccessData] = useState({})
    const [_roleLists, _setRoleLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        sortMode: 'desc',
        orderBy: 'idAccessModuleGroup'
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_openModal, _setOpenModal] = useState(false)
    const [_isMenuAccess, _setIsMenuAccess] = useState(false)

    useEffect(() => {
        _getData(_page)
        _getAccessModuleData()
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

        if (query) params.query = query

        try {
            const roleLists = await postJSON('/masterData/userRoleAkses/aksesModulGrup/list', params, props.authData.token)
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

    async function _getAccessModuleData(){
        let params = {
            startFrom : 0,
            length: 80,
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
    
    return (
        <Main>
            <AccessRoleModal
            visible={_openModal}
            closeModal={() => {
                _setOpenModal(false)
                _setAccessData([])
            }}
            onSuccess={() => {
                _getData()
            }}
            isMenuAccess={_isMenuAccess}
            menuAccessExisting={_accessData}
            />

            <AdminLayout>
        
                <Card
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_roleLists.data}
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
                                title={'Tambah Role'}
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