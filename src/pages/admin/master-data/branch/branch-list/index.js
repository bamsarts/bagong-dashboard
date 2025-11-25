import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { Col, Row } from '../../../../../components/Layout'
import BranchModal from '../../../../../components/BranchModal'
import Label from '../../../../../components/Label'
import { dateFilter } from '../../../../../utils/filters'
import styles from './Branch.module.scss'
import { AiFillEye, AiOutlineTeam, AiOutlineEllipsis, AiFillEdit } from 'react-icons/ai'
import Link from 'next/link'
import generateClasses from '../../../../../utils/generateClasses'

export default function Branch(props) {

    const __COLUMNS = [
        {
            title : 'Cabang',
            field : 'name',
            textAlign: 'left'
        },
        {
            title : 'Alamat',
            field : 'address',
            textAlign: 'left'
        },
        {
            title: 'Kode Pos',
            field: 'postalCode'
        },
        {
            title : 'Email',
            field : 'email'
        },
        {
            title : 'Telepon',
            field : 'phoneNumber',
            minWidth: '100px'
        },
        {
            title : 'Fax',
            field : 'fax',
            minWidth: '50px'
        },
        {
            title : 'Kota',
            field : 'cityName',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            minWidth: '50px',
            customCell : (value, row) => {
                return (
                    <div>
                        <div
                        title={"Aksi"}
                        className={styles.dropdown}
                        onClick={() => {
                            _setDropdown(row.id)
                        }}
                        >
                            <AiOutlineEllipsis/>
                        </div>
                        
                        <div
                        style={{"display": "none"}}
                        className={ generateClasses([
                            styles.dropdown_action,
                            "dropdown-item "+row.id
                        ])}
                        >
                            <div
                            title={"Ubah"}
                            className={styles.button_action}
                            onClick={() => {
                                _setIsOpenModal(true)
                                _setForm(row)
                            }}
                            >
                                <AiFillEdit/>
                                <span>Ubah</span>
                            </div>

                            <Link
                            href={window.location.href+"/"+row.id+"?branch="+row.name}
                            >
                                <div
                                title={"Lihat User"}
                                className={generateClasses([
                                    styles.button_action
                                ])}
                                >
                                    <AiOutlineTeam/>
                                    <span>User</span>
                                </div>
                            </Link>
                        </div>
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
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_form, _setForm] = useState({})

    useEffect(() => {
        _getData(_page)
    }, [])

    function _setDropdown(id){
        const parent = document.getElementsByClassName("dropdown-item "+id)
        
        if(parent[0].style.display == "none"){
            parent[0].style.display = "grid"
        }else{
            parent[0].style.display = "none"
        }
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

        if (query) params.query = query

        try {
            const users = await postJSON('/masterData/branch/list', params, props.authData.token)
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

    function _toggleModal(data){
        _setUserCreate(data)
    }

    return (
        <Main>
            <BranchModal
            visible={_isOpenModal}
            closeModal={
                () => {
                    _setIsOpenModal(false)
                    _setForm({})
                }
            }
            data={_form}
            onSuccess={_getData}
            />
            
            <AdminLayout>
                <Card
                noPadding
                >
                    <Table
                    headExport={[
                        {
                            title: "Nama",
                            value: 'name'
                        },
                        {
                            title: "Alamat",
                            value: 'address'
                        },
                        {
                            title: "Email",
                            value: 'email'
                        },
                        {
                            title: "Fax",
                            value: 'fax'
                        },
                        {
                            title: "Latitude",
                            value: 'latitude'
                        },
                        {
                            title: "Longitude",
                            value: 'longitude'
                        },
                        {
                            title: "Kode Pos",
                            value: 'postalCode'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_users.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
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

                            <Col
                            column={2}
                            withPadding
                            >
                                <Row
                                >
                                    <Button
                                    title={'Tambah Cabang'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _setIsOpenModal(true)
                                    }}
                                    small
                                    />

                                </Row>
                                
                            </Col>
                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}