import { useEffect, useState, forwardRef } from 'react'
import { get, postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import Button from '../../../../../components/Button'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { currency, dateFilter } from '../../../../../utils/filters'

/* ================= HELPERS ================= */

const formatRp = (value = 0) => {
    const num = Number(value) || 0
    const isNegative = num < 0
    const absValue = Math.abs(num)

    return `${isNegative ? '-' : ''}Rp${currency(absValue)}`
}

/* RECORD PER BUS (AMBIL MURNI DARI BE) */
function buildCalendarRecords(apiData = [], daysInMonth = 31) {
    return apiData.map((bus, index) => {
        const row = {
            no: index + 1,
            bus_name: bus.bus_name,
            inap: bus.traject_parent || '-'
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const daily = bus.daily_data?.[day]
            row[`day_${day}`] = Number(daily?.pendapatan_bersih) || 0
        }

        return row
    })
}

/* KOLOM DINAMIS */
function buildDayColumns(daysInMonth) {
    const columns = [
        { title: 'No', field: 'no', textAlign: 'center' },
        { title: 'No Polisi', field: 'bus_name', textAlign: 'left' },
        // { title: 'INAP', field: 'inap', textAlign: 'center' }
    ]

    for (let day = 1; day <= daysInMonth; day++) {
        columns.push({
            title: String(day),
            field: `day_${day}`,
            textAlign: 'right',
            customCell: v => {
                const num = Number(v) || 0
                return (
                    <span style={{ color: v < 0 ? '#FF0000' : 'inherit', }}>
                        {formatRp(num)}
                    </span>
                )
            }
        })
    }

    return columns
}


/* HITUNG TOTAL PERTANGGAL (MANUAL DI FE) */
function calculateDailySummary(records = [], daysInMonth = 31) {
    const summary = {}

    for (let day = 1; day <= daysInMonth; day++) {
        let total = 0

        records.forEach(row => {
            total += Number(row[`day_${day}`]) || 0
        })

        summary[day] = total
    }

    return summary
}

/* SUMMARY ROW UNTUK INSERTCOLUMNS */
function buildDailySummaryInsert(dailySummary = {}, daysInMonth = 31) {
    const cells = [
        {
            value: 'JUMLAH',
            colSpan: 2,
            textAlign: 'center',
            customCell: () => (
            <span style={{ fontWeight: 'bold' }}>
                JUMLAH
            </span>
        )
        }
    ]

    for (let day = 1; day <= daysInMonth; day++) {
        const val = Number(dailySummary[day]) || 0

        cells.push({
            value: val,
            textAlign: 'right',
            customCell: v => {
                const num = Number(v) || 0
                return (
                    <span style={{ color: v < 0 ? '#FF0000' : 'inherit', fontWeight: 'bold' }}>
                        {formatRp(num)}
                    </span>
                )
            }
        })
    }

    return [cells]
}


/* ================= COMPONENT ================= */

export default function ReportMonthly(props) {

    const [_selectedDate, _setSelectedDate] = useState(new Date())
    const [_records, _setRecords] = useState([])
    const [_columns, _setColumns] = useState([])
    const [_dailySummary, _setDailySummary] = useState(null)
    const [_reportInfo, _setReportInfo] = useState(null)

    const [_loading, _setLoading] = useState(false)
    const [_hasFetched, _setHasFetched] = useState(false)

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
    const [_selectedTraject, _setSelectedTraject] = useState(null)

    /* ===== CUSTOM MONTH PICKER ===== */
    const CustomMonthPicker = forwardRef(({ onClick }, ref) => (
        <Input
            title="Bulan"
            onClick={onClick}
            ref={ref}
            value={dateFilter.getMonthDate(_selectedDate)}
            readOnly
        />
    ))

    useEffect(() => {
        _getTrajectList()
    }, [])

    /* ================= API ================= */

    async function _getData() {
        if (!_selectedTraject) {
            popAlert({ message: 'Trayek Harus Dipilih' })
            return
        }

        const d = new Date(_selectedDate)

        const params = {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            traject_id: _selectedTraject.id
        }

        try {
            _setLoading(true)
            _setHasFetched(true)

            const res = await get(
                `/data/laporan/setoran/report/monthly?${new URLSearchParams(params)}`,
                props.authData.token
            )

            if (res?.status === 'SUCCESS') {
                const reportInfo = res.data.report_info
                const apiData = res.data.data || []

                const records = buildCalendarRecords(
                    apiData,
                    reportInfo.days_in_month
                )

                const dailySummary = calculateDailySummary(
                    records,
                    reportInfo.days_in_month
                )

                _setReportInfo(reportInfo)
                _setColumns(buildDayColumns(reportInfo.days_in_month))
                _setRecords(records)
                _setDailySummary(dailySummary)
            } else {
                popAlert({ message: res?.message })
                _setRecords([])
                _setDailySummary(null)
            }
        } catch (e) {
            popAlert({ message: e.message })
            _setRecords([])
            _setDailySummary(null)
        } finally {
            _setLoading(false)
        }
    }

    async function _getTrajectList() {
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

    /* ================= RENDER ================= */

    return (
        <Main>
            <AdminLayout>

                {/* FILTER */}
                <Card>
                    <Row verticalEnd>

                        <Col column={1} withPadding>
                            <Input
                                title="Trayek"
                                placeholder= "Pilih Trayek"
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
                        <Col column={1} withPadding>
                            <DatePicker
                                selected={_selectedDate}
                                onChange={_setSelectedDate}
                                dateFormat="MM/yyyy"
                                showMonthYearPicker
                                customInput={<CustomMonthPicker />}
                            />
                        </Col>

                        <Col column={2} withPadding>
                            <Button
                                title="Terapkan"
                                onClick={_getData}
                                styles={Button.secondary}
                                small
                                disabled={_loading || !_selectedTraject}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* RESULT */}
                <Card noPadding>

                    {_loading && (
                        <Row center withPadding>
                            <p style={{ color: 'gray' }}>Loading Data...</p>
                        </Row>
                    )}

                    {!_loading && _records.length > 0 && (
                        <Table
                            headerContent={(
                                <div style={{ textAlign: 'left', fontWeight: 'bold' }}>
                                    <p>
                                        {`PERIODE ${_reportInfo?.month_name?.toUpperCase() || ''} ${_reportInfo?.year || ''}`}
                                    </p>
                                </div>
                            )}
                            records={_records}
                            columns={_columns}
                            insertColumns={
                                _dailySummary
                                    ? buildDailySummaryInsert(
                                          _dailySummary,
                                          _reportInfo?.days_in_month || 31
                                      )
                                    : []
                            }
                        />
                    )}

                    {!_loading && _hasFetched && _records.length === 0 && (
                        <Row center withPadding>
                            <p style={{ color: 'gray' }}>Data Tidak Ditemukan</p>
                        </Row>
                    )}

                </Card>

            </AdminLayout>
        </Main>
    )
}
