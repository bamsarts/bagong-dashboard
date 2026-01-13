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
import AssignmentModal from '../../../../components/AssignmentModal'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import { dateFilter } from '../../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import Input from '../../../../components/Input'

export default function Assignment(props) {
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
            title: 'Kondektur',
            field: 'bus_crew1_name',
            textAlign: "left",
            customCell: (value, row) => {
                return value
            }
        },
        {
            title: 'Driver',
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
        orderBy: "id",
        sortMode: "desc"     
    })
    const [_modalVisible, _setModalVisible] = useState(false)
    const [_selectedData, _setSelectedData] = useState({})
    const [_formDelete, _setFormDelete] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_assignDate, _setAssignDate] = useState(new Date())
    const [_assignEndDate, _setAssignEndDate] = useState(new Date())
    const [_selectedDate, _setSelectedDate] = useState(new Date())
    const [_trajectRange, _setTrajectRange] = useState([])
    const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
    const [_selectedTraject, _setSelectedTraject] = useState(null)
    const [_loading, _setLoading] = useState(false)

    const CustomDatePicker = forwardRef(({ onClick }, ref) => (
        <Input
            title="Tanggal"
            onClick={onClick}
            ref={ref}
            value={dateFilter.getMonthDate(_selectedDate)}
            readOnly
        />
    ))

    useEffect(() => {
        _getData(_page)
        _getTraject()
    }, [])

    function _toggleModal(visible, data = {}) {
        _setModalVisible(visible)
        _setSelectedData(data)
    }


    async function _getData(pagination = _page) {
        const params = {
            ...pagination,
            "startDate": dateFilter.basicDate(new Date(_selectedDate)).normal,
            "endDate": dateFilter.basicDate(new Date(_selectedDate)).normal
        }

        try {
            const lists = await postJSON('/data/penugasan/list', params, props.authData.token)
            _setAssignLists(lists)
            _setPaginationConfig({
                recordLength: lists.totalFiltered,
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

    async function _getTraject() {
        try {
            const res = await postJSON(
                '/masterData/trayekMaster/list',
                { startFrom: 0, length: 360 },
                props.authData.token
            )
            _setTrajectRange(res.data || [])
        } catch (e) {
            popAlert({ message: e.message })
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

            <AssignmentModal
                visible={_modalVisible}
                closeModal={() => _toggleModal(false)}
                data={_selectedData}
                onSuccess={() => _getData(_page)}
            />
            

            <AdminLayout 
                headerContent={(
                    <Button
                        title={'Tambah Penugasan'}
                        styles={Button.secondary}
                        onClick={() => {
                            _setModalVisible(true)
                        }}
                    />
                )}
            >

                <Card
                    noPadding
                >

                    <Row
                        verticalEnd
                        withPadding
                    >
 
                        <Col 
                            column={1} 
                            withPadding
                            mobileFullWidth
                        >
                            <DatePicker
                                selected={_selectedDate}
                                onChange={_setSelectedDate}
                                customInput={<CustomDatePicker />}
                            />
                        </Col>

                        <Col 
                            column={2} 
                            withPadding
                            mobileFullWidth
                        >
                            <Input
                                title="Trayek"
                                value={_trajectFilterValue}
                                onChange={_setTrajectFilterValue}
                                suggestions={_trajectRange}
                                suggestionField="name"
                                onSuggestionSelect={(t) => {
                                    _setSelectedTraject(t)
                                    _setTrajectFilterValue(t.name)
                                }}
                            />
                        </Col>

                        <Col 
                            column={1} 
                            withPadding
                            mobileFullWidth
                        >
                            <Button
                                title="Terapkan"
                                onClick={_getData}
                                styles={Button.secondary}
                                small
                                disabled={_loading}
                            />
                        </Col>
                    </Row>
                    <Table
                        columns={__COLUMNS}
                        records={_assignLists.data}
                        exportToXls={false}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}