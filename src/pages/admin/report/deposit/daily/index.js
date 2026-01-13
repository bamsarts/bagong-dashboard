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

    /* ================= HELPER ================= */

    function buildGroupedRecords(groups) {
        const result = []

        groups.forEach(group => {
            const rows = group.data_report || []
            if (!rows.length) return

            // Header grup
            result.push({
                __type: 'GROUP',
                title: group.inap || 'NO POOL'
            })

            // Data rows
            result.push(...rows)
        })

        return result
    }

    /* ================= COMPONENT ================= */

    export default function ReportAkap(props) {

        const [_selectedDate, _setSelectedDate] = useState(new Date())
        const [_records, _setRecords] = useState([])
        const [_summary, _setSummary] = useState(null)
        const [_loading, _setLoading] = useState(false)

        const [_trajectRange, _setTrajectRange] = useState([])
        const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
        const [_selectedTraject, _setSelectedTraject] = useState(null)


        const firstRow = _records.find(r => !r.__type)
        /* ================= COLUMNS ================= */

        const __COLUMNS = [
            {
                title: 'NOPOL',
                field: 'bus_name',
                textAlign: 'left',
                customCell: (value, row) => {
                    if (row.__type === 'GROUP') {
                        return (
                            <strong style={{ fontSize: '13px' }}>
                            Bus Inap  {row.title}
                            </strong>
                        )
                    }
                    return value
                }
            },
            {
                title: 'DRIVER',
                field: 'driver',
                textAlign: 'left',
                customCell: (v, r) => r.__type ? '' : v
            },
            {
                title: 'KONDEKTUR',
                field: 'kondektur',
                textAlign: 'left',
                customCell: (v, r) => r.__type ? '' : v
            },
            {
                title: 'KERNET',
                field: 'kernet',
                textAlign: 'left',
                customCell: (v, r) => r.__type ? '' : v
            },
            {
                title: 'RIT KE',
                field: 'list_ritase',
                customCell: (v, r) => r.__type ? '' : v
            },
            {
                title: 'Nama Trayek',
                field: 'traject_name',
                textAlign: 'left',
                customCell: (v, r) => r.__type ? '' : v
            },
            {
                title: 'Pendapatan',
                field: 'total_pendapatan_kotor',
                textAlign: 'right',
                customCell: (v, r) => r.__type ? '' : currency(v || 0)
            },
            {
                title: 'Pengeluaran',
                field: 'total_pengeluaran',
                textAlign: 'right',
                customCell: (v, r) => r.__type ? '' : currency(v || 0)
            },
            {
                title: 'Bonus Kru',
                field: 'bonus_kru',
                textAlign: 'right',
                customCell: (v, r) => r.__type ? '' : currency(v || 0)
            },
            {
                title: 'Pendapatan Bersih',
                field: 'pendapatan_bersih',
                textAlign: 'right',
                customCell: (v, r) => {
                    if (r.__type) return ''
                    return (
                        <span style={{ color: Number(v) < 0 ? '#FF0000' : 'inherit' }}>
                            {currency(v || 0)}
                        </span>
                    )
                }
            },
            {
                title: 'non_tunai',
                field: 'pendapatan_non_tunai',
                textAlign: 'right',
                customCell: (v, r) => r.__type ? '' : currency(v || 0)
            },
            {
                title: 'Setor tunai',
                field: 'setor_tunai',
                textAlign: 'right',
                customCell: (v, r) => r.__type ? '' : currency(v || 0)
            },
            {
                title: 'Solar',
                field: 'solar',
                textAlign: 'right',
                customCell: (v, r) => r.__type ? '' : currency(v || 0)
            },
            {
                title: 'Penerima setoran',
                field: 'approval_setoran',
                textAlign: 'left',
                customCell: (v, r) => r.__type ? '' : v
            }
        ]

        /* ================= DATE PICKER ================= */

        const CustomDatePicker = forwardRef(({ onClick }, ref) => (
            <Input
                title="Tanggal"
                onClick={onClick}
                ref={ref}
                value={dateFilter.getMonthDate(_selectedDate)}
                readOnly
            />
        ))

        /* ================= EFFECT ================= */

        useEffect(() => {
            _getTraject()
        }, [])

        /* ================= API ================= */

        async function _getData() {
            if (!_selectedTraject) {
                popAlert({ message: 'Trayek Harus Dipilih' })
                return
            }

            const params = {
                start_date: dateFilter.basicDate(_selectedDate).normal,
                end_date: dateFilter.basicDate(_selectedDate).normal,
                group_by_pool: true,
                traject_id: _selectedTraject.id
            }

            try {
                _setLoading(true)

                const res = await get(
                    `/data/laporan/setoran/report?${new URLSearchParams(params)}`,
                    props.authData.token
                )

                if (res?.status === 'SUCCESS') {
                    _setRecords(buildGroupedRecords(res.data || []))
                    _setSummary(res.summary || null)
                } else {
                    popAlert({ message: res?.message })
                    _setRecords([])
                    _setSummary(null)
                }
            } catch (e) {
                popAlert({ message: e.message })
            } finally {
                _setLoading(false)
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

        /* ================= RENDER ================= */

        return (
            <Main>
                <AdminLayout>

                    <Card>
                        <Row verticalEnd>
                            <Col column={1} withPadding>
                                <DatePicker
                                    selected={_selectedDate}
                                    onChange={_setSelectedDate}
                                    customInput={<CustomDatePicker />}
                                />
                            </Col>

                            <Col column={2} withPadding>
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

                            <Col column={2} withPadding>
                                <Button
                                    title="Terapkan"
                                    onClick={_getData}
                                    styles={Button.secondary}
                                    small
                                    disabled={_loading}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {_records.length > 0 && (
                        <Card noPadding>
                            <Table
                                headerContent={(
                                    <div 
                                        style={{
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        <Col>
                                            <p>{`LAPORAN SETORAN HARIAN ${firstRow?.traject_name || ''}`}</p>
                                        </Col>
                                        <Col>
                                            <p>{`PERIODE JALAN: ${firstRow?.assign_date || ''}`}</p>
                                        </Col>
                                    
                                    </div>
                                )}
                                records={_records}
                                columns={__COLUMNS}
                                insertColumns={
                                    _summary ? [[
                                        { value: 'JUMLAH', colSpan: 6, textAlign: 'center', },
                                        { value: _summary.grand_total_pendapatan, customCell: currency, textAlign: 'right' },
                                        { value: _summary.grand_total_pengeluaran, customCell: currency, textAlign: 'right'},
                                        { value: _summary.grand_total_bonus_kru, customCell: currency, textAlign: 'right' },
                                        {
                                            value: _summary.grand_pendapatan_bersih,
                                            textAlign: 'right',
                                            customCell: v => (
                                                <span style={{ color: v < 0 ? '#FF0000' : 'inherit' }}>
                                                    {currency(v)}
                                                </span>
                                            )
                                        },
                                        { value: _summary.grand_total_pendapatan_non_tunai, customCell: currency, textAlign: 'right' },
                                        { value: _summary.grand_total_setor_tunai, customCell: currency, textAlign: 'right' },
                                        { value: _summary.grand_total_solar, customCell: currency, textAlign: 'right' },
                                        { value: `${_summary.total_setoran} PP` }
                                    ]] : []
                                }
                            />
                        </Card>
                    )}
                </AdminLayout>
            </Main>
        )
    }
