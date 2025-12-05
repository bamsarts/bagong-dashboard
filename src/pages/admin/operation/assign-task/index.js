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
import AssignTaskModal from '../../../../components/AssignTaskModal'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import { dateFilter } from '../../../../utils/filters'

export default function AssignTask(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Tanggal Penugasan',
            field: 'assign_date',
            textAlign: "left",
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value))
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
            title: 'Driver',
            field: 'bus_crew1_name',
            textAlign: "left",
            customCell: (value, row) => {
                return value + " " +row.schedule_assign_id
            }
        },
        {
            title: 'Kondektur',
            field: 'bus_crew2_name',
            textAlign: "left",
            customCell: (value) => {
                return value
            }
        },
        {
            title: 'Kernet',
            field: 'bus_crew3_name',
            textAlign: "left",
            customCell: (value) => {
                return value
            }
        }
    ]

    const [_assignLists, _setAssignLists] = useState([])
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
            const lists = await postJSON('/data/penugasan/list', params, props.authData.token)
            _setAssignLists(lists)
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

            <AssignTaskModal
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
                                    title={'Tambah Penugasan'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _setModalVisible(true)
                                    }}
                                />
                            </Col>
                        )}
                        columns={__COLUMNS}
                        records={_assignLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                    />
                </Card>


            </AdminLayout>
        </Main>
    )

}