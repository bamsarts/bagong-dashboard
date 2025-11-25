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
import UserModal from '../../../../../components/UserModal'
import Label from '../../../../../components/Label'
import { dateFilter } from '../../../../../utils/filters'
import styles from './User.module.scss'
import { AiFillEye } from 'react-icons/ai'
import { FaChessBishop, FaVolleyballBall } from 'react-icons/fa'
import ConfirmationModal from '../../../../../components/ConfirmationModal'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'
import generateClasses from '../../../../../utils/generateClasses'
import { AiOutlineTeam, AiFillDelete, AiOutlineLeft } from 'react-icons/ai'
import Tabs from '../../../../../components/Tabs'
import QRCodeModal from '../../../../../components/QRCodeModal'

export default function User(props) {

    const __COLUMNS = [
        {
            title: 'Nama',
            field: 'name'
        },
        {
            title: 'Username',
            field: 'username'
        },
        {
            title: 'Email',
            field: 'email'
        },
        {
            title: 'Telepon',
            field: 'phoneNumber'
        },
        {
            title: 'Status',
            field: 'isBanned',
            customCell: (value) => {

                return (
                    <Label
                        activeIndex={true}
                        labels={[
                            {
                                "class": value ? 'danger' : 'primary',
                                "title": value ? 'Diblokir' : 'Aktif',
                                "value": true
                            }
                        ]}
                    />
                )
            }
        },
        {
            title: 'Role',
            field: 'roleId',
            customCell: (value) => {
                const role = _roleRange.find(r => r.value === value)
                return role ? role.title : '-'
            }
        },
        {
            title: 'Login Terakhir',
            field: 'lastLogin',
            customCell: (value) => {
                if (value != null) {
                    return dateFilter.convertISO(value)
                } else {
                    return ''
                }
            }
        },
        {
            title: 'Aksi',
            field: "id",
            customCell: (value, row) => {
                return (
                    <div
                        title={"Lihat"}
                        className={styles.button_action}
                        onClick={() => {
                            _setForm(row)
                            _toggleModal(true)
                        }}
                    >
                        <AiFillEye />
                    </div>
                )
            }
        }
    ]

    const __COLUMNS_USER_BRANCH = [
        {
            title: 'Nama',
            field: 'userName',
            textAlign: 'left'
        },
        {
            title: 'Email',
            field: 'userEmail',
            textAlign: 'left'
        },
        {
            title: 'Username',
            field: 'userUsername'
        },
        {
            title: 'Aksi',
            field: "id",
            minWidth: '50px',
            customCell: (value, row) => {
                return (
                    <Row
                        spaceEvenly
                    >
                        {/* 
                        <div
                        title={"Ubah User"}
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
                        </div> */}

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
                            <AiFillDelete />
                        </div>

                    </Row>
                )
            }
        }
    ]

    const [_users, _setUsers] = useState([])
    const [_usersBranch, _setUserBranch] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_paginationConfigUserBranch, _setPaginationConfigUserBranch] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "idUser",
        sortMode: 'desc'
    })

    const [_pageUserBranch, _setPageUserBranch] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "id",
        sortMode: 'desc'
    })

    const [_searchQuery, _setSearchQuery] = useState('')
    const [_userCreate, _setUserCreate] = useState(false)
    const [_form, _setForm] = useState({})
    const [_isImport, _setIsImport] = useState(false)
    const [_role, _setRole] = useState([])
    const [_roleRange, _setRoleRange] = useState([])
    const [_roleSelected, _setRoleSelected] = useState({
        "title": "Semua Role",
        "value": ""
    })
    const [_userDelete, _setUserDelete] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_accessFeature, _setAccessFeature] = useState({
        customer: false,
    })

    const [_userRanges, _setUserRanges] = useState([])

    const FORM_USER_TO_BRANCH = {
        "userId": "",
        "branchId": props.branch?.branchId,
        "user": {
            "title": ""
        },
    }

    const [_activeIndex, _setActiveIndex] = useState("masterUser")

    const [_formUserToBranch, _setFormUserToBranch] = useState(FORM_USER_TO_BRANCH)

    const [_tabsData, _setTabsData] = useState([

    ])
    const [_showQRModal, _setShowQRModal] = useState(false)

    useEffect(() => {
        console.log(props)
        _checkAccessFeature()

    }, [])

    useEffect(() => {
        if (!props.branch?.branchId) {
            _getData(_page)
        }
    }, [_roleSelected])

    useEffect(() => {

        // _getData(_page)

        if (props.branch?.branchId) {
            _setActiveIndex("userBranch")
            _getUsers()
            _getUserBranch(_pageUserBranch)
        } else {
            _getData(_page)
        }

    }, [_accessFeature.customer])

    function _updateQueryUserToBranch(data = {}) {
        _setFormUserToBranch(oldQuery => {
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

    function _setPaginationUserBranch(pagination) {
        _setPageUserBranch(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getUserBranch(pagination)
    }


    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        if (query) params.query = query
        if (_roleSelected.value != "") params.role_id = _roleSelected.value

        try {
            const users = await postJSON('/masterData/userRoleAkses/user/list', params, props.authData.token)
            const customerAccess = _checkAccessFeature().customer

            _setUsers(users)
            _setRole(users.roleData)
            _setPaginationConfig({
                recordLength: users.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(users.totalFiltered / pagination.length)
            })

            let role = []
            users.roleData.forEach(function (val, key) {

                if (key == 0) {
                    role.push({
                        "title": "Semua Role",
                        "value": ""
                    })
                }

                if (customerAccess && val.name == "ROLE_USER") {
                    role.push({
                        "title": val.name,
                        "value": val.id
                    })
                }

                if (val.name != "ROLE_USER") {
                    role.push({
                        "title": val.name,
                        "value": val.id
                    })
                }

            })

            _setRoleRange(role)
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getUserBranch(pagination = _pageUserBranch, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        params.branchId = props.branch?.branchId

        if (query) params.query = query

        try {
            const users = await postJSON('/masterData/branch/user/list', params, props.authData.token)
            _setUserBranch(users)
            _setPaginationConfigUserBranch({
                recordLength: users.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(users.totalFiltered / pagination.length)
            })
        } catch (e) {
            popAlert({ message: e.message })
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
            user.data.forEach(function (val, key) {
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

    async function _checkUserExist(username) {

        const params = {
            length: 1,
            startFrom: 0,
            orderBy: "idUser",
            sortMode: 'desc',
            query: username
        }

        try {
            const users = await postJSON('/masterData/userRoleAkses/user/list', params, props.authData.token)

            if (users.data.length > 0) {
                if (users.data[0].username == username) {

                }
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    function validateRole() {
        //ROLE ACCESS
        // 1. USER
        // 2. ADMIN
        // 3. CREW
        // 4. OWNER 
        // 5. FINANCE 
        // 6. MARKETING 
        // 7. AUDITOR 
        // 8. CASHIER 
        // 9. COUNTER 
        // 10. OPERATION 
        // 11. PARTNER
        // 12. ADMIN CABANG
        // 13. ADMIN PUSAT
        return props?.role_id | props.roleId
    }

    async function _updateAccessFeature(data = {}) {
        _setAccessFeature(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _checkAccessFeature() {
        if (typeof window !== 'undefined') {
            let access = {
                customer: false
            }

            if (validateRole() == "2") {
                access.customer = true

            }

            return access
        }
    }

    function _toggleModal(data) {
        _setUserCreate(data)
    }

    // function _setRoleToUser(row){
    //     let user = {
    //         ...row
    //     }

    //     _role.forEach(function(val, key){
    //         if(row.roleId == val.value){
    //             user.role.title = val.title
    //             user.role.value = val.value
    //         }
    //     })

    //     return user
    // }

    async function _deleteUser() {
        _setIsProcessing(true)
        let query = {
            "idUser": _form.idUser
        }

        try {
            const result = postJSON("/masterData/userRoleAkses/user/delete", query, props.authData.token)

            if (result) _setUserDelete(false)

            _setForm({})
            popAlert({ "message": "Berhasil dihapus", "type": "success" })
            setTimeout(() => {
                _getData()
            }, 1000);
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _submitUserToBranch() {
        _setIsProcessing(true)
        try {
            let query = {
                ..._formUserToBranch
            }

            delete query.user

            const result = await postJSON('/masterData/branch/user/add', query, props.authData.token)

            if (result) _getUserBranch()
            _setForm(FORM_USER_TO_BRANCH)
            popAlert({ "message": "Berhasil disimpan", "type": "success" })

        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <QRCodeModal
            visible={_showQRModal}
            closeModal={() => _setShowQRModal(false)}
            userData={{
                name: _form.name,
                id: _form.id
            }}
            />

            <UserModal
                visible={_userCreate}
                closeModal={
                    () => {
                        _toggleModal(false)
                        _setForm({})
                    }
                }
                data={_form}
                onSuccess={_getData}
                isImport={_isImport}
                roleRange={_role}
                onDelete={() => {
                    _setUserDelete(true)
                    _toggleModal(false)
                }}
            />

            <ConfirmationModal
                visible={_userDelete}
                closeModal={() => {
                    _setUserDelete(false)
                }}
                onDelete={_deleteUser}
                onLoading={_isProcessing}
            />

            <AdminLayout
                headerContent={
                    <Tabs
                        activeIndex={_activeIndex}
                        tabs={[
                            {
                                title: 'Master User',
                                value: 'masterUser',
                                onClick: () => {
                                    _setActiveIndex('masterUser')
                                    _getData(_page)
                                }
                            },
                            {
                                title: 'Pengguna Cabang',
                                value: 'userBranch',
                                isHide: !props.branch?.branchId,
                                onClick: () => {
                                    _setActiveIndex('userBranch')
                                    _getUserBranch()
                                }
                            }
                        ]}
                    />
                }
            >

                {
                    _activeIndex == "masterUser" && (

                        <Card
                            noPadding
                        >
                            <Table
                                isLoading={_isProcessing}
                                exportToXls={false}
                                headExport={[
                                    {
                                        title: "Nama",
                                        value: 'name'
                                    },
                                    {
                                        title: "Username",
                                        value: 'username'
                                    },
                                    {
                                        title: "Email",
                                        value: 'email'
                                    },
                                    {
                                        title: "No Telepon",
                                        value: 'phoneNumber'
                                    },
                                    {
                                        title: "Status",
                                        value: 'isBanned'
                                    },
                                    {
                                        title: "Gagal Login",
                                        value: 'failCount'
                                    },
                                    {
                                        title: "Login Terakhir",
                                        value: 'lastLogin'
                                    }
                                ]}
                                columns={__COLUMNS}
                                records={_users.data}
                                config={_paginationConfig}
                                onRecordsPerPageChange={perPage => _setPagination({ ..._page, length: perPage, startFrom: 0 })}
                                onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                                headerContent={(
                                    <Row>
                                        <Col
                                            column={2}
                                            withPadding
                                            mobileFullWidth
                                        >
                                            <Input
                                                placeholder={'Cari'}
                                                value={_searchQuery}
                                                onChange={(query) => {
                                                    const pagination = {
                                                        length: Table.defaultProps.recordsPerPageValues[0],
                                                        startFrom: 0
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
                                            style={
                                                {
                                                    "flex": "auto",
                                                    "max-width": "100%"
                                                }
                                            }
                                        >
                                            <Row
                                            >
                                                <Button
                                                    title={'Tambah User'}
                                                    styles={Button.secondary}
                                                    onClick={() => {
                                                        _toggleModal(true)
                                                        _setIsImport(false)
                                                    }}
                                                    small
                                                />

                                                <Button
                                                    title={'Import User'}
                                                    styles={Button.success}
                                                    onClick={() => {
                                                        _toggleModal(true)
                                                        _setIsImport(true)
                                                    }}
                                                    small
                                                    marginLeft
                                                />

                                            </Row>
                                        </Col>

                                        <Col
                                            column={2}
                                            mobileFullWidth
                                            withPadding
                                        >
                                            <Input
                                                placeholder={'Semua Role'}
                                                value={_roleSelected.title}
                                                suggestions={_roleRange}
                                                suggestionField={'title'}
                                                onSuggestionSelect={(value) => {
                                                    _setRoleSelected(value)
                                                }}
                                            />
                                        </Col>


                                    </Row>
                                )}
                            />
                        </Card>

                    )
                }

                {
                    _activeIndex == "userBranch" && (

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
                                columns={__COLUMNS_USER_BRANCH}
                                records={_usersBranch.data}
                                config={_paginationConfigUserBranch}
                                onRecordsPerPageChange={perPage => _setPaginationUserBranch({ ..._pageUserBranch, length: perPage, startFrom: 0 })}
                                onPageChange={page => _setPaginationUserBranch({ ..._pageUserBranch, startFrom: (page - 1) * _pageUserBranch.length })}
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
                                                            value={_formUserToBranch.user.title}
                                                            suggestions={_userRanges}
                                                            suggestionField={'title'}
                                                            onSuggestionSelect={(value) => {
                                                                _updateQueryUserToBranch({
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
                                                                title={'Tambah User Lama '}
                                                                styles={Button.secondary}
                                                                onClick={() => {
                                                                    _submitUserToBranch()
                                                                }}
                                                                small
                                                                onProcess={_isProcessing}
                                                            />

                                                        </Row>

                                                    </Col>
                                                </>
                                            )
                                        }


                                        {/* <Col
                                    column={2}
                                    withPadding
                                    >
                                        <Button
                                        title={'Tambah User Baru'}
                                        styles={Button.primary}
                                        onClick={() => {
                                            _toggleModal(true)
                                            _setIsImport(false)
                                        }}
                                        small
                                        />
                                    </Col> */}


                                        <Col
                                            column={2}
                                            withPadding
                                        >
                                            <Input
                                                placeholder={'Cari'}
                                                value={_searchQuery}
                                                onChange={(query) => {
                                                    const pagination = {
                                                        length: Table.defaultProps.recordsPerPageValues[0],
                                                        startFrom: 0
                                                    }
                                                    _setSearchQuery(query)
                                                    if (query.length > 1) {
                                                        throttle(() => _getData(pagination, query), 1300)()
                                                    } else {
                                                        _getData(pagination, query)
                                                    }
                                                    _setPageUserBranch(pagination)
                                                }}
                                            />
                                        </Col>

                                    </Row>
                                )}
                            />
                        </Card>


                    )
                }
            </AdminLayout>
        </Main>
    )

}