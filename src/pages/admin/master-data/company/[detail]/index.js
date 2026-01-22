import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import { AiFillEye } from 'react-icons/ai'
import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Table from '../../../../../components/Table'
import styles from './CompanyDetail.module.scss'
import generateClasses from '../../../../../utils/generateClasses'
import Link from 'next/link'
import { Row, Col } from '../../../../../components/Layout'
import Input from '../../../../../components/Input'
import Button from '../../../../../components/Button'
import ConfirmationModal from '../../../../../components/ConfirmationModal'
import { AiFillDelete, AiOutlineWallet, AiOutlineLeft } from 'react-icons/ai'
import TopupUserModal from '../../../../../components/TopupUserModal'
import { useRouter } from 'next/router'

export default function CompanyDetail(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Nama Pengguna',
            field: 'userName',
            textAlign: 'left'
        },
        {
            title: 'Username',
            field: 'userUsername',
            textAlign: 'left'
        },
        {
            title: 'Email',
            field: 'userEmail',
            textAlign: 'left'
        },
        {
            title: 'Bisa Topup',
            field: 'isTopup',
            customCell: (value) => {
                return value ? 'Ya' : 'Tidak'
            }
        },
        {
            title: 'Aksi',
            field: "id",
            customCell: (value, row) => {
                return (
                    <Row>
                        <div
                            title={"Hapus"}
                            className={generateClasses([
                                styles.button_action
                            ])}
                            onClick={() => {
                                _setOpenModalDelete(true)
                                _setFormDelete({
                                    "id": value,
                                })
                            }}
                        >
                            <AiFillDelete />
                        </div>

                        <div
                            title={"Topup"}
                            className={generateClasses([
                                styles.button_action
                            ])}
                            onClick={() => {
                                _setRowData(row)
                            }}
                        >
                            <AiOutlineWallet />
                        </div>
                    </Row>
                )
            }
        }
    ]

    const __FORM = {
        "companyId": router.query.detail,
        "userId": "",
        "isTopup": false,
        "user": {
            "title": ""
        }
    }

    const [_companyDetailLists, _setCompanyDetailLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: 'id',
        sortMode: 'desc',
        companyId: router.query.detail
    })
    const [_userRange, _setUserRange] = useState([])
    const [_form, _setForm] = useState(__FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_checked, _setChecked] = useState(false)
    const [_openModalDelete, _setOpenModalDelete] = useState(false)
    const [_formDelete, _setFormDelete] = useState({
        "id": ""
    })
    const [_dataRowData, _setRowData] = useState({})

    useEffect(() => {
        _getData(_page)
        _getUsers()
    }, [])

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }

    async function _getData(pagination = _page) {
        const params = {
            ...pagination,
        }

        try {
            const companyDetailLists = await postJSON('/masterData/company/user/list', params, props.authData.token)
            _setCompanyDetailLists(companyDetailLists)
            _setPaginationConfig({
                recordLength: companyDetailLists.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(companyDetailLists.totalFiltered / pagination.length)
            })
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getUsers() {
        const params = {
            "startFrom": 0,
            "length": 1090
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

            _setUserRange(userRange)
        } catch (e) {
            console.log(e)
        }
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitUser() {

        _setIsProcessing(true)

        try {
            let query = {
                ..._form
            }

            delete query.user

            const result = await postJSON('/masterData/company/user/add', query, props.authData.token)

            _setForm(__FORM)
            _setChecked(false)
            popAlert({ "message": "Berhasil ditambahkan", "type": "success" })
            _getData()
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    const handleChange = () => {
        _setChecked(!_checked);
        _updateQuery({
            "isTopup": !_checked
        })
    };

    async function _deleteUser() {
        _setIsProcessing(true)

        try {
            const res = await postJSON('/masterData/company/user/delete', _formDelete, props.authData.token)
            _getData()
            _setOpenModalDelete(false)
            popAlert({ "message": "Berhasil dihapus", "type": "success" })
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <TopupUserModal
                data={_dataRowData}
                closeModal={() => {
                    _setRowData({})
                }}
            />

            <ConfirmationModal
                visible={_openModalDelete}
                closeModal={() => {
                    _setOpenModalDelete(false)
                }}
                onDelete={_deleteUser}
                onLoading={_isProcessing}
            />

            <AdminLayout
                headerContent={
                    <div className={styles.header_content}>
                        <div>
                            <a href="/admin/master-data/company">
                                <AiOutlineLeft />
                            </a>
                            <strong>{router.query.company}</strong>
                        </div>
                    </div>
                }
            >
                <Card
                    noPadding
                >
                    <Table
                        columns={__COLUMNS}
                        records={_companyDetailLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                        headerContent={
                            <Row
                                verticalEnd
                            >
                                <Col
                                    column={2}
                                    withPadding
                                    mobileFullWidth
                                >
                                    <Input
                                        title={"Pengguna"}
                                        placeholder={'Pilih Pengguna'}
                                        value={_form.user.title}
                                        suggestions={_userRange}
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
                                    column={1}
                                    withPadding
                                >
                                    <Input
                                        title={"Bisa Topup"}
                                        type={"checkbox"}
                                        checked={_checked}
                                        value={_form.isTopup}
                                        onChange={(value) => {
                                            handleChange()
                                        }}
                                    />
                                </Col>

                                <Col
                                    column={1}
                                    withPadding
                                >
                                    <Button
                                        title={'Tambahkan'}
                                        styles={Button.secondary}
                                        onClick={() => {
                                            _submitUser()
                                        }}
                                        onProcess={_isProcessing}
                                        small
                                    />
                                </Col>
                            </Row>
                        }
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}