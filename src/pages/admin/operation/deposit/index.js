import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { postJSON } from '../../../../api/utils'
import { BsCash } from 'react-icons/bs'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { Col } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import SetoranModal from '../../../../components/SetoranModal'
import ConfirmationModal from '../../../../components/ConfirmationModal'

export default function Deposit(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Tanggal',
            field: 'date',
            textAlign: "left"
        },
        {
            title: 'Cabang',
            field: 'branch',
            textAlign: "left",
            customCell: (value) => {
                return value.name
            }
        },
        {
            title: 'Segmentasi',
            field: 'traject_type_code',
            textAlign: "left"
        },
        {
            title: 'Trayek',
            field: 'traject_name'
        },
        {
            title: 'Bus',
            field: 'bus_code'
        },
        {
            title: 'Ritase',
            field: 'ritase'
        },
        {
            title: 'Aksi',
            field: "setoran",
            style: { "position": "relative" },
            customCell: (value, row) => {
                return (
                    <Button
                        title={"Setoran"}
                        icon={<BsCash />}
                        styles={Button.primary}
                        onClick={() => {
                            router.push(`/admin/operation/deposit/${value.id}`)
                        }}
                        small
                    />
                )
            }
        }
    ]

    const [_depositLists, _setDepositLists] = useState([])
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
            const lists = await postJSON('/data/setoran/setoranHeader/list', params, props.authData.token)
            _setDepositLists(lists)
            _setPaginationConfig({
                recordLength: lists.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(lists.totalFiltered / pagination.length)
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

                            </Col>
                        )}
                        columns={__COLUMNS}
                        records={_depositLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                    />
                </Card>


            </AdminLayout>
        </Main>
    )

}