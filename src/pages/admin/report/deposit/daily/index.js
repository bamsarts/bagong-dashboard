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

    import { dateFilter, currency } from '../../../../../utils/filters'
    import ReportDailyModal from '../../../../../components/ReportDailyModal'

    /* ================= HELPER ================= */

    const isGroupRow = row => !!row.__type

    function aggregateBySetoran(rows) {
    const base = { ...rows[0] }

    // Gabungkan ritase → "1 & 2 & 3"
    base.list_ritase = rows
        .map(r => r.list_ritase)
        .filter(v => v !== null && v !== undefined)
        .join(' & ')

    const sumFields = [
        'total_pendapatan_kotor',
        // 'total_pengeluaran',
        'bonus_kru',
        'pendapatan_bersih',
        'pendapatan_non_tunai',
        'setor_tunai',
        // 'solar'
    ]

    sumFields.forEach(field => {
        base[field] = rows.reduce(
        (sum, r) => sum + Number(r[field] || 0),
        0
        )
    })

    return base
    }

    function buildGroupedRecords(groups) {
    const result = []

    groups.forEach(group => {
        const rows = group.data_report || []
        if (!rows.length) return

        // HEADER POOL
        result.push({
        __type: 'GROUP_POOL',
        title: group.inap || 'NO POOL'
        })

        /**
         * STEP 1 → GROUP BY BUS (jaga urutan kemunculan bus)
         */
        const busMap = {}
        const busOrder = []

        rows.forEach(row => {
        const busKey = row.bus_id

        if (!busMap[busKey]) {
            busMap[busKey] = []
            busOrder.push(busKey) // simpan urutan muncul
        }

        busMap[busKey].push(row)
        })

        /**
         * STEP 2 → PROSES PER BUS
         */
        busOrder.forEach(busKey => {
        const busRows = busMap[busKey]

        const dynamicMap = {}
        const dynamicOrder = []

        busRows.forEach(row => {
            let key

            if (row.setoran_id) {
            key = `SETORAN-${row.bus_id}-${row.setoran_id}`
            } else {
            key = `RITASE-${row.bus_id}-${row.list_ritase}`
            }

            if (!dynamicMap[key]) {
            dynamicMap[key] = []
            dynamicOrder.push(key) // simpan urutan ritase asli
            }

            dynamicMap[key].push(row)
        })

        /**
         * STEP 3 → RENDER SESUAI URUTAN ASLI RITASE BUS
         */
        dynamicOrder.forEach(key => {
            result.push(aggregateBySetoran(dynamicMap[key]))
        })
        })
    })

    return result
    }


    /* ================= COMPONENT ================= */

    export default function ReportDaily(props) {
    const [_selectedDate, _setSelectedDate] = useState(new Date())
    const [_records, _setRecords] = useState([])
    const [_summary, _setSummary] = useState(null)
    const [_loading, _setLoading] = useState(false)
    const [_hasFetched, _setHasFetched] = useState(false)

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
    const [_selectedTraject, _setSelectedTraject] = useState(null)

    const [_modalOpen, _setModalOpen] = useState(false)
    const [_selectedRow, _setSelectedRow] = useState(null)

    const firstRow = _records.find(r => !r.__type)

    /* ================= COLUMNS ================= */

    const __COLUMNS = [
        {
        title: 'NOPOL',
        field: 'bus_name',
        textAlign: 'left',
        customCell: (value, row) => {
            if (row.__type === 'GROUP_POOL') {
            return <strong>Pool Inap: {row.title}</strong>
            }

            if (row.__type === 'GROUP_BUS_SETORAN') {
            return (
                <strong>
                Bus: {row.busName} &nbsp;|&nbsp; Setoran #{row.setoranId}
                </strong>
            )
            }

            return value
        }
        },
        {
        title: 'DRIVER',
        field: 'driver',
        customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
        title: 'KONDEKTUR',
        field: 'kondektur',
        customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
        title: 'KERNET',
        field: 'kernet',
        customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
        title: 'RIT KE',
        field: 'list_ritase',
        customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
        title: 'Nama Trayek',
        field: 'traject_name',
        customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
        title: 'Pendapatan',
        field: 'total_pendapatan_kotor',
        textAlign: 'right',
        customCell: (v, r) => isGroupRow(r) ? '' : currency(v || 0)
        },
        {
        title: 'Pengeluaran',
        field: 'total_pengeluaran',
        textAlign: 'right',
        customCell: (v, r) => isGroupRow(r) ? '' : currency(v || 0)
        },
        {
        title: 'Bonus Kru',
        field: 'bonus_kru',
        textAlign: 'right',
        customCell: (v, r) => isGroupRow(r) ? '' : currency(v || 0)
        },
        {
        title: 'Pendapatan Bersih',
        field: 'pendapatan_bersih',
        textAlign: 'right',
        customCell: (v, r) => {
            if (isGroupRow(r)) return ''
            return (
            <span style={{ color: v < 0 ? '#FF0000' : 'inherit' }}>
                {currency(v || 0)}
            </span>
            )
        }
        },
        {
            title: 'Non Tunai',
            field: 'pendapatan_non_tunai',
            textAlign: 'right',
            customCell: (v, r) => isGroupRow(r) ? '' : currency(v || 0)
        },
        {
            title: 'Setor Tunai',
            field: 'setor_tunai',
            textAlign: 'right',
            customCell: (v, r) => isGroupRow(r) ? '' : currency(v || 0)
        },
        {
            title: 'Solar',
            field: 'solar',
            textAlign: 'right',
            customCell: (v, r) => isGroupRow(r) ? '' : currency(v || 0)
        },
        {
            title: 'Penerima Setoran',
            field: 'approval_setoran',
            customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
            title: 'Keterangan',
            field: '',
            customCell: (v, r) => isGroupRow(r) ? '' : v
        },
        {
            title: 'aksi',
            field: '',
            customCell: (v, r) => {
                if (isGroupRow(r)) return ''

                return (
                    <button
                        style={{ cursor: 'pointer' }}
                        onClick={() => _openModal(r)}
                    >
                        Detail
                    </button>
                )
            }
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

    function _openModal(row) {
        if (row.__type) return // jangan buka kalau row group
        _setSelectedRow(row)
        _setModalOpen(true)
    }

    function _closeModal() {
        _setModalOpen(false)
        _setSelectedRow(null)
    }

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
        _setHasFetched(true)

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
            <ReportDailyModal
                visible={_modalOpen}
                closeModal={_closeModal}
                selectedRow={_selectedRow}   // ⬅️ kirim row yang diklik
                onSuccess={_getData}
            />
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

                <Col column={1} withPadding>
                <Input
                    title="Trayek"
                    value={_trajectFilterValue}
                    placeholder="Pilih Trayek"
                    onChange={_setTrajectFilterValue}
                    suggestions={_trajectRange}
                    suggestionField="name"
                    onSuggestionSelect={t => {
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

            <Card noPadding>
            {_loading && (
                <Row center withPadding>
                <Col column={1}>
                    <p style={{ color: 'gray' }}>Loading Data...</p>
                </Col>
                </Row>
            )}

            {!_loading && _records.length > 0 && (
                <Table
                records={_records}
                columns={__COLUMNS}
                headerContent={
                    <div style={{ fontWeight: 'bold' }}>
                    <p>{`LAPORAN SETORAN HARIAN ${firstRow?.traject_name || ''}`}</p>
                    <p>{`PERIODE JALAN: ${firstRow?.assign_date || ''}`}</p>
                    </div>
                }
                />
            )}

            {!_loading && _hasFetched && _records.length === 0 && (
                <Row center withPadding>
                <Col column={1}>
                    <p style={{ color: 'gray' }}>Data Tidak Ditemukan</p>
                </Col>
                </Row>
            )}
            </Card>
        </AdminLayout>
        
        </Main>
    )
    }
