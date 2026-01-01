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
import Label from '../../../../components/Label'


export default function Deposit(props) {
    const router = useRouter()

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_busRange, _setBusRange] = useState([])
    const [_userCrew, _setUserCrew] = useState([])

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
            title: 'Ritase',
            field: 'ritase',
            customCell: (value, row) => {
                return value
            }
        },
        {
            title: 'Kondektur',
            textAlign: 'left',
            customCell: (value, row) => {
                const kondektur = _userCrew.find(c => c.idUser == row.bus_crew1_id)


                return (
                    <div>
                        <div>{kondektur?.name || '-'}</div>
                    </div>
                )
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
                const amount = Number(value?.payment_amount || 0)

                return (
                    <span style={{ color: amount < 0 ? '#FF0000' : 'inherit' }}>
                        {currency(amount)}
                    </span>
                )
            }
        },
        {
            title: 'Status',
            field: 'setoran',
            textAlign: "center",
            customCell: (value, row) => {

                let data = _statusLabel(value)

                return (
                    <Label
                    activeIndex={true}
                    labels={[
                        {
                            "class": data.class,
                            "title": data.title,
                            "value": true
                        }
                    ]}
                    />
                )
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
                            _saveFilterState()
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
    const [_selectedBus, _setSelectedBus] = useState(null)
    const [_busFilterValue, _setBusFilterValue] = useState('')

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
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
        _restoreFilterState()
    }, [])

    useEffect(() => {
        _getUserCrew()
    }, [])

    useEffect(() => {
        _getData()
    }, [_assignDate, _assignEndDate, _selectedBus])

    function _statusLabel(value){
        let data = {
            class: "primary",
            title: value.status
        }
        
        switch (value?.status) {
            case "CREATED":
                data.title = "Belum Diterima"
                data.class = "danger"
                break
            case "APPROVED":
                data.title = "Selesai"
                data.class = "primary"
                break
            case "PENDING":
                data.title = "Disimpan"
                data.class = "warning"
                break
            default:
                data.title = "-"
                data.class = "secondary"
                break
        }
        
        return data
    }
    

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
            endDate: dateFilter.basicDate(new Date(_assignEndDate)).normal,
            ..._selectedBus && { busId: _selectedBus.id }
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

        } catch (e) {
            popAlert({ message: e.message })
            return []
        }
    }
    async function _getUserCrew() {

        const params = {
            "startFrom": 0,
            "role_id": 19,
            "length": 360,
        }

        try {
            const result = await postJSON('/masterData/userRoleAkses/user/list', params, props.authData.token)

            _setUserCrew(result.data)

        } catch (e) {
            popAlert({ message: e.message })
            return []
        }
    }

    function _saveFilterState() {
        const filterState = {
            assignDate: _assignDate,
            assignEndDate: _assignEndDate,
            selectedBus: _selectedBus,
            busFilterValue: _busFilterValue,
            page: _page,
            paginationConfig: _paginationConfig
        }
        localStorage.setItem('deposit_filter_state', JSON.stringify(filterState))
    }

    function _restoreFilterState() {
        const savedState = localStorage.getItem('deposit_filter_state')
        if (savedState) {
            try {
                const filterState = JSON.parse(savedState)

                _setAssignDate(new Date(filterState.assignDate))
                _setAssignEndDate(new Date(filterState.assignEndDate))
                _setSelectedBus(filterState.selectedBus)
                _setBusFilterValue(filterState.busFilterValue || '')
                _setPage(filterState.page)
                _setPaginationConfig(filterState.paginationConfig)
            } catch (e) {
                console.error('Error restoring filter state:', e)
            }
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
                                            console.log("date")
                                            console.log(date)
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

                                <Col
                                    column={1}
                                    withPadding
                                >
                                    <Input
                                        title="Bus"
                                        placeholder="Pilih Bus"
                                        value={_busFilterValue}
                                        onChange={(value) => _setBusFilterValue(value)}
                                        suggestions={_busRange}
                                        suggestionField="name"
                                        onSuggestionSelect={(bus) => {
                                            _setSelectedBus(bus)
                                            _setBusFilterValue(bus.name || bus.code || '')
                                        }}
                                    />
                                </Col>

                                <Col
                                    column={1}
                                    withPadding
                                    alignEnd
                                    justifyEnd
                                >
                                    {_selectedBus && (
                                        <Button
                                            title="Hapus Filter"
                                            styles={Button.secondary}
                                            onClick={() => {
                                                _setSelectedBus(null)
                                                _setBusFilterValue('')
                                            }}
                                            small
                                        />
                                    )}
                                </Col>
                            </Row>

                        )}
                        columns={__COLUMNS}
                        records={_depositLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ ..._page, length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                    />
                </Card>


            </AdminLayout>
        </Main>
    )

}