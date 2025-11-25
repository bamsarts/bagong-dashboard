import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import { BsEyeFill, BsThreeDotsVertical, BsFillTrashFill } from 'react-icons/bs'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import generateClasses from '../../../../utils/generateClasses'
import Link from 'next/link'
import styles from '../../master-data/traject/traject-list/Trajectlist.module.scss'
import { Col } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import SetoranModal from '../../../../components/SetoranModal'
import Label from '../../../../components/Label'
import ConfirmationModal from '../../../../components/ConfirmationModal'

export default function Setoran(props) {

    const __COLUMNS = [
        {
            title: 'Trayek',
            field: 'traject.name',
            textAlign: "left"
        },
        {
            title: 'Nama Form Setoran',
            field: 'name',
            textAlign: "left"
        },
        {
            title: 'Uraian',
            field: 'desc',
            textAlign: "left"
        },
        {
            title: 'Nominal',
            field: 'amount'
        },
        {
            title: 'Status',
            field: 'is_active',
            customCell: (value) => {
                return (
                    <Label
                        activeIndex={true}
                        labels={[
                            {
                                value: true,
                                title: value ? 'Aktif' : 'Tidak Aktif',
                                class: value ? 'primary' : 'danger'
                            }
                        ]}
                    />
                )
            }
        },
        {
            title: 'Aksi',
            field: "id",
            style: { "position": "relative" },
            customCell: (value, row) => {
                return (
                    <div>
                        <div
                            title={"Aksi"}
                            className={styles.dropdown}
                            onClick={() => {
                                _setDropdown(row.id)
                            }}
                        >
                            <BsThreeDotsVertical />
                        </div>

                        <div
                            style={{ "display": "none" }}
                            className={generateClasses([
                                styles.dropdown_action,
                                "dropdown-item " + row.id
                            ])}
                        >

                            <div
                                className={styles.button_action}
                                onClick={() => {
                                    _toggleModal(true, row)
                                }}
                            >
                                <BsEyeFill />
                                <span>Detail Form</span>
                            </div>

                            <div
                                style={{ "color": "red" }}
                                className={styles.button_action}
                                onClick={() => {
                                    _setFormDelete(row)
                                }}
                            >
                                <BsFillTrashFill />
                                <span>Hapus Form</span>
                            </div>

                        </div>
                    </div>
                )
            }
        }
    ]

    const [_companyLists, _setCompanyLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
    })
    const [_modalVisible, _setModalVisible] = useState(false)
    const [_selectedData, _setSelectedData] = useState({})
    const [_formDelete, _setFormDelete] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {
        _getData(_page)
    }, [])

    function _toggleModal(visible, data = {}) {
        _setModalVisible(visible)
        _setSelectedData(data)
    }

    function _setDropdown(id) {
        const parent = document.getElementsByClassName("dropdown-item " + id)
        if (parent[0].style.display == "none") {
            parent[0].style.display = "flex"
        } else {
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

    async function _getData(pagination = _page) {
        const params = {
            ...pagination,
        }

        try {
            const companyLists = await postJSON('/masterData/setoranDefault/list', params, props.authData.token)
            _setCompanyLists(companyLists)
            _setPaginationConfig({
                recordLength: companyLists.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(companyLists.totalFiltered / pagination.length)
            })
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _deleteForm() {
        _setIsProcessing(true)
        try {
            await postJSON('/masterData/setoranDefault/delete', { id: _formDelete.id }, props.authData.token)
            popAlert({ message: 'Form berhasil dihapus', type: 'success' })
            _setFormDelete({})
            _getData(_page)
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
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
                onDelete={_deleteForm}
                onLoading={_isProcessing}
            />

            <SetoranModal
                visible={_modalVisible}
                closeModal={() => _toggleModal(false)}
                data={_selectedData}
                refresh={() => _getData(_page)}
            />

            <AdminLayout>

                <Card
                    noPadding
                >

                    <Table
                        headerContent={(
                            <Col
                                column={2}
                                withPadding
                            >
                                <Button
                                    title={'Tambah Setoran'}
                                    styles={Button.secondary}
                                    onClick={() => _toggleModal(true)}
                                    small
                                />
                            </Col>
                        )}
                        columns={__COLUMNS}
                        records={_companyLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                    />
                </Card>


            </AdminLayout>
        </Main>
    )

}