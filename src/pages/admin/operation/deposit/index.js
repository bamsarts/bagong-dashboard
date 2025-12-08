import { useEffect, useState, forwardRef } from 'react'
import { useRouter } from 'next/router'
import { postJSON } from '../../../../api/utils'
import { BsCash } from 'react-icons/bs'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { Col, Row } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import SetoranModal from '../../../../components/SetoranModal'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import { currency, dateFilter } from '../../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";

export default function Deposit(props) {
    const router = useRouter()

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_busRange, _setBusRange] = useState([])

    const __COLUMNS = [
        {
            title: 'Tanggal Penugasan',
            field: 'assign_date',
            textAlign: "left",
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title: 'Trayek',
            field: 'traject_master',
            textAlign: "left",
            customCell: (value, row) => {

                return value.name
            }
        },
        {
            title: 'Bus',
            field: 'bus_id',
            customCell: (value, row) => {
                const bus = _busRange.find(t => t.id === value)
                return bus?.name || bus?.code || '-'
            }
        },
        {
            title: 'Penumpang',
            field: 'setoran',
            customCell: (value, row) => {
                return value.cash_pnp_count + value.non_cash_pnp_count
            }
        },
        {
            title: 'Jumlah Setoran (Rp)',
            field: 'setoran',
            textAlign: "right",
            customCell: (value, row) => {
                return currency(value.payment_amount)
            }
        },
        {
            title: 'Aksi',
            field: "setoran",
            style: { "position": "relative" },
            customCell: (value, row) => {
                return (
                    <Button
                        title={value.status == "CREATED" ? "Setoran" : "Rincian"}
                        icon={value.status == "CREATED" ? <BsCash /> : ''}
                        styles={value.status == "CREATED" ? Button.secondary : Button.primary}
                        onClick={() => {
                            localStorage.setItem("operasional_deposit", JSON.stringify(row))
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
        orderBy: "id",
        sortMode: "desc"
    })
    const [_modalVisible, _setModalVisible] = useState(false)
    const [_selectedData, _setSelectedData] = useState({})
    const [_formDelete, _setFormDelete] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_assignDate, _setAssignDate] = useState(new Date())
    const [_assignEndDate, _setAssignEndDate] = useState(new Date())

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Tanggal Penugasan Awal"}
                onClick={onClick}
                ref={ref}
                value={_assignDate == "" ? "" : dateFilter.getMonthDate(_assignDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

     const CustomEndDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Tanggal Penugasan Akhir"}
                onClick={onClick}
                ref={ref}
                value={_assignEndDate == "" ? "" : dateFilter.getMonthDate(_assignEndDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    useEffect(() => {
        _getTraject()
    }, [])

    useEffect(() => {
        _getData()
    }, [_assignDate, _assignEndDate])

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
            startDate: dateFilter.basicDate(new Date(_assignDate)).normal,
            endDate: dateFilter.basicDate(new Date(_assignEndDate)).normal
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

    async function _getTraject() {

        const params = {
            "companyId": props.authData.companyId,
            "startFrom": 0,
            "length": 360
        }

        try {
            const result = await postJSON('/masterData/trayek/list', params, props.authData.token)

            _setTrajectRange(result.data)

            _getBus()

        } catch (e) {
            popAlert({ message: e.message })
            return []
        }
    }

    async function _getBus() {

        const params = {
            "startFrom": 0,
            "length": 360
        }

        try {
            const result = await postJSON('/masterData/bus/list', params, props.authData.token)

            _setBusRange(result.data)

            _getData(_page)

        } catch (e) {
            popAlert({ message: e.message })
            return []
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

                            <Row>
                                <Col
                                    column={2}
                                    withPadding
                                >
                                    <DatePicker
                                        style={{
                                            width: "100%"
                                        }}
                                        selected={_assignDate}
                                        onChange={(date) => {
                                            _setAssignDate(date)
                                        }}
                                        customInput={<CustomDatePicker />}
                                    />
                                </Col>

                                <Col
                                    column={2}
                                    withPadding
                                >
                                    <DatePicker
                                        style={{
                                            width: "100%"
                                        }}
                                        selected={_assignEndDate}
                                        onChange={(date) => {
                                            _setAssignEndDate(date)
                                        }}
                                        customInput={<CustomEndDatePicker />}
                                    />
                                </Col>
                            </Row>

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