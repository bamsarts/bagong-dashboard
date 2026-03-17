import { useState, useMemo } from 'react'
import Table from './Table'
import { Row, Col } from './Layout'
import Button from './Button'
import { currency } from '../utils/filters'

export default function RevenueReportTable({ data, isLoading }) {
    const [filterType, setFilterType] = useState('all') // 'all', 'cashRevenue', 'cashlessRevenue'

    // Parse CSV data and group by type
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return []

        const csvRows = data.split('\n').filter(line => line.trim() !== '')
        if (csvRows.length < 2) return []

        const csvHeader = parseCSVRow(csvRows[0])
        const rows = []

        for (let i = 1; i < csvRows.length; i++) {
            const row = parseCSVRow(csvRows[i])
            if (row.length < csvHeader.length) continue

            const rowObj = {}
            csvHeader.forEach((header, idx) => {
                rowObj[header] = row[idx] || ''
            })
            rows.push(rowObj)
        }

        return rows
    }, [data])

    // Group and filter data based on type
    const groupedData = useMemo(() => {
        if (filterType === 'cashRevenue') {
            return groupCashRevenue(processedData)
        } else if (filterType === 'cashlessRevenue') {
            return groupCashlessRevenue(processedData)
        }
        return processedData
    }, [processedData, filterType])

    const columns = getColumnsForType(filterType)

    return (
        <div>
            <Row style={{ marginBottom: '20px' }}>
                <Col column={12}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                            title="Semua Transaksi"
                            styles={filterType === 'all' ? Button.primary : Button.secondary}
                            onClick={() => setFilterType('all')}
                            small
                        />
                        <Button
                            title="Tunai"
                            styles={filterType === 'cashRevenue' ? Button.primary : Button.secondary}
                            onClick={() => setFilterType('cashRevenue')}
                            small
                        />
                        <Button
                            title="Non-Tunai"
                            styles={filterType === 'cashlessRevenue' ? Button.primary : Button.secondary}
                            onClick={() => setFilterType('cashlessRevenue')}
                            small
                        />
                    </div>
                </Col>
            </Row>

            <Table
                columns={columns}
                data={groupedData}
                isLoading={isLoading}
                fileName={`Laporan-Pendapatan-${filterType}`}
            />
        </div>
    )
}

function parseCSVRow(row) {
    const result = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < row.length; i++) {
        const char = row[i]
        if (char === '"') {
            insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    result.push(current.trim())
    return result
}

function groupCashRevenue(data) {
    const groups = {}

    data.forEach(row => {
        // Filter only Tunai payment type
        if (row['Payment Type'] && row['Payment Type'] !== 'Tunai') {
            return
        }

        const date = row['Date'] || ''
        const route = row['Route'] || ''
        const groupKey = `${date}|${route}`
        const accNumber = row['Nomor Rekening'] || ''

        if (!groups[groupKey]) {
            groups[groupKey] = {
                date: date,
                route: route,
                trajectMaster: getTrajektNameByAccountNumber(accNumber),
                passengerCount: 0,
                totalTunai: 0,
            }
        }

        groups[groupKey].passengerCount += parseInt(row['Passenger Count'] || '0', 10)
        groups[groupKey].totalTunai += parseInt(row['Total Harga Setelah Discount'] || '0', 10)
    })

    return Object.values(groups).map(group => ({
        ...group,
        feeBIS: group.totalTunai * 0.012,
        ppn: Math.floor((group.totalTunai * 0.012) * (11 / 111)),
    }))
}

function groupCashlessRevenue(data) {
    const groups = {}

    data.forEach(row => {
        // Filter only Non-Tunai payment type
        if (row['Payment Type'] && row['Payment Type'] !== 'Non-Tunai') {
            return
        }

        const date = row['Date'] || ''
        const route = row['Route'] || ''
        const paymentMethod = row['Payment Method'] || ''
        const groupKey = `${date}|${route}`
        const accNumber = row['Nomor Rekening'] || ''

        if (!groups[groupKey]) {
            groups[groupKey] = {
                date: date,
                route: route,
                trajectMaster: getTrajektNameByAccountNumber(accNumber),
                passengerCount: 0,
                qris: 0,
                emoney: 0,
                mdrQris: 0,
                mdrEmoney: 0,
            }
        }

        const totalAmount = parseInt(row['Total Harga Setelah Discount'] || '0', 10)
        const mdr = parseInt(row['MDR'] || '0', 10)

        groups[groupKey].passengerCount += parseInt(row['Passenger Count'] || '0', 10)

        if (paymentMethod.toLowerCase() === 'qris') {
            groups[groupKey].qris += totalAmount
            groups[groupKey].mdrQris += mdr
        } else if (paymentMethod.toLowerCase() === 'emoney') {
            groups[groupKey].emoney += totalAmount
            groups[groupKey].mdrEmoney += mdr
        }
    })

    return Object.values(groups).map(group => {
        const totalCashless = group.qris + group.emoney
        return {
            ...group,
            feeBIS: totalCashless * 0.012,
            ppn: Math.floor((totalCashless * 0.012) * (11 / 111)),
        }
    })
}

function getTrajektNameByAccountNumber(accNumber) {
    // Implement based on your bank data mapping
    // This is a placeholder
    return accNumber || '-'
}

function getColumnsForType(type) {
    const baseColumns = [
        {
            title: 'Tanggal',
            field: 'date',
            textAlign: 'left',
        },
        {
            title: 'Trayek (Master)',
            field: 'trajectMaster',
            textAlign: 'left',
        },
        {
            title: 'Rute',
            field: 'route',
            textAlign: 'left',
        },
        {
            title: 'Jumlah Penumpang',
            field: 'passengerCount',
            textAlign: 'right',
        },
    ]

    if (type === 'cashRevenue') {
        return [
            ...baseColumns,
            {
                title: 'Tunai (Rp)',
                field: 'totalTunai',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'Fee BIS (Rp)',
                field: 'feeBIS',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'PPN (Rp)',
                field: 'ppn',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
        ]
    } else if (type === 'cashlessRevenue') {
        return [
            ...baseColumns,
            {
                title: 'QRIS (Rp)',
                field: 'qris',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'MDR QRIS (Rp)',
                field: 'mdrQris',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'E-Money (Rp)',
                field: 'emoney',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'MDR E-Money (Rp)',
                field: 'mdrEmoney',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'Fee BIS (Rp)',
                field: 'feeBIS',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'PPN (Rp)',
                field: 'ppn',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
        ]
    }

    return baseColumns
}
