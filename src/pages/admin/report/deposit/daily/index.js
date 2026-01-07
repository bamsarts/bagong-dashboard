import { useEffect, useState, forwardRef } from 'react'
import { get, postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { dateFilter, currency } from '../../../../../utils/filters'
import Button from '../../../../../components/Button'


export default function ReportAkap(props) {

    const [_selectedDate, _setSelectedDate] = useState(new Date())
    const [_records, _setRecords] = useState([])
    const [_loading, _setLoading] = useState(false)
    const [_summary, _setSummary] = useState(null)

    const [_trajectRange, _setTrajectRange] = useState([])         
    const [_trajectFilterValue, _setTrajectFilterValue] = useState('') 
    const [_selectedTraject, _setSelectedTraject] = useState(null) 
    

    const __COLUMNS = [
        {
            title: 'NOPOL',
            field: 'bus_name',
            textAlign: 'left'
        },
        {
            title: 'DRIVER',
            field: 'driver',
            textAlign: 'left'
        },
        {
            title: 'KONDEKTUR',
            field: 'kondektur',
            textAlign: 'left'
        },
        {
            title: 'KERNET',
            field: 'kernet',
            textAlign: 'left'
        },
        {
            title: 'RIT KE',
            field: 'list_ritase',
            textAlign: 'left'
        },
        {
            title: 'Nama Trayek',
            field: 'traject_name',
            textAlign: 'left'
        },
        {
            title: 'Pendapatan',
            field: 'total_pendapatan',
            textAlign: 'right',
            customCell: (value) => currency(value || 0)
        },
        {
            title: 'Pengeluaran',
            field: 'total_pengeluaran',
            textAlign: 'right',
            customCell: (value) => currency(value || 0)
        },
        {
            title: 'Pendapatan Bersih',
            field: 'pendapatan_bersih',
            textAlign: 'right',
            customCell: (value) => {
                    const amount = Number(value || 0)

                    return (
                        <span style={{ color: amount < 0 ? '#FF0000' : 'inherit' }}>
                            {currency(amount)}
                        </span>
                    )
            }
        },
        {
            title: 'Solar',
            field: 'solar',
            textAlign: 'right',
            customCell: (value) => currency(value || 0)
        },
        {
            title: 'Penerima setoran',
            field: 'approval_setoran',
            textAlign: 'center'
        }
    ]

    const __INSERT_COLUMNS =
    _summary !== null
        ? [
            [
                {
                    value: 'TOTAL',
                    colSpan: 6,
                    textAlign: 'center'
                },
                {
                    value: _summary.grand_total_pendapatan ?? 0,
                    textAlign: 'right',
                    customCell: (val) => currency(val)
                },
                {
                    value: _summary.grand_total_pengeluaran ?? 0,
                    textAlign: 'right',
                    customCell: (val) => currency(val)
                },
                {
                    value: _summary.grand_pendapatan_bersih ?? 0,
                    textAlign: 'right',
                    customCell: (val) => (
                        <span style={{ color: val < 0 ? '#FF0000' : 'inherit' }}>
                            {currency(val)}
                        </span>
                    )
                },
                {
                    value: '' // kolom kosong (misalnya Status)
                },
                {
                    value: `${_records.length} pp`,
                    textAlign: 'center'
                }
            ]
        ]
        : []


    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                title={"Tanggal"}
                onClick={onClick}
                ref={ref}
                value={_selectedDate == "" ? "" : dateFilter.getMonthDate(_selectedDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    useEffect(() => {
        _getTraject()
    }, [])

    async function _getData() {

        if (!_selectedTraject) {
            popAlert({ message: 'Trayek Harus Dipilih' })
            return
        }

        const params = {
            start_date: dateFilter.basicDate(_selectedDate).normal,
            end_date: dateFilter.basicDate(_selectedDate).normal,
            ...(_selectedTraject && { traject_id: _selectedTraject.id }),
        }

        const query = new URLSearchParams(params).toString()

        try {
            _setLoading(true)

            const res = await get(
                `/data/laporan/setoran/report?${query}`,
                props.authData.token
            )

            if (res?.status === 'SUCCESS') {
                _setRecords(res.data || [])
                _setSummary(res.summary || null)
            } else {
                popAlert({ message: res?.message || 'Gagal mengambil data' })
                _setRecords([])
                _setSummary(null)
            }
        } catch (e) {
            popAlert({ message: e?.message || 'Terjadi kesalahan' })
            _setRecords([])
            _setSummary(null)
        } finally {
            _setLoading(false)
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

        } catch (e) {
            popAlert({ message: e.message })
            return []
        }
    }



    return (
        <Main>

            <AdminLayout>
                <Card>
                    <Row verticalEnd>
                        <Col 
                            column={1} 
                            withPadding
                            mobileFullWidth
                        >
                            <DatePicker
                                style={{
                                    width: "100%"
                                }}
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
                                placeholder="Pilih Trayek"
                                value={_trajectFilterValue}
                                onChange={(value) => {
                                    _setTrajectFilterValue(value)
                                    if (!value) _setSelectedTraject(null)
                                }}
                                suggestions={_trajectRange}
                                suggestionField="name"
                                onSuggestionSelect={(trayek) => {
                                    _setSelectedTraject(trayek)
                                    _setTrajectFilterValue(trayek.name)
                                }}
                            />
                        </Col>
                        <Col 
                            column={2} 
                            withPadding
                            mobileFullWidth
                        >
                            
                            <Button
                                title="Terapkan"
                                styles={Button.secondary}
                                onClick={_getData}
                                small
                            />
                        </Col>
                    </Row>

                </Card>

                {_records.length === 0 ?(
                        <></>
                    ) : ( 
                        
                        <Card
                            noPadding
                        >
                            <Table
                                headerContent={(
            
                                    <Row>
                                        <Col 
                                            withPadding
                                            mobileFullWidth
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            <p>
                                                {`LAPORAN SETORAN HARIAN ${
                                                    _records[0]?.traject_name || '-'
                                                }`}
                                            </p>

                                            <p>
                                                {`PERIODE JALAN : ${
                                                    _records[0]?.tanggal_setoran
                                                        ? dateFilter.getMonthDate(
                                                            new Date(_records[0].tanggal_setoran)
                                                        )
                                                        : '-'
                                                }`}
                                            </p>
                                        
                                        </Col>

                                        </Row>

                                )}
                                records={_records}      
                                columns={__COLUMNS}
                                insertColumns={__INSERT_COLUMNS}
                                exportToXls
                                fileName="report-setoran-akap"
                                // showFooter
                            />
                        </Card>
                        
                    ) 
                }
                
            </AdminLayout>
        </Main>
    )
}
