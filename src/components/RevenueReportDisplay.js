import { useState, useMemo } from 'react'
import Table from './Table'
import { Row, Col } from './Layout'
import { currency } from '../utils/filters'
import { parseCSVRow, groupCashRevenue, groupCashlessRevenue, getRevenueColumns } from '../utils/revenueReportUtils'
import Label from './Label'

/**
 * Revenue Report Display Component
 * Displays CSV data in a filterable table for Tunai and Non-Tunai transactions
 */
export default function RevenueReportDisplay({ csvData, isLoading = false, trajectBank = [], date = {} }) {
    const [filterType, setFilterType] = useState('cashRevenue') // 'all', 'cashRevenue', 'cashlessRevenue'
    const [fileName, setFileName] = useState("Laporan-Pendapatan-Tunai-" + date.start + "-s.d-" + date.end)

    // Parse CSV data
    const { csvHeader, rows } = useMemo(() => {
        if (!csvData || csvData.length === 0) return { csvHeader: [], rows: [] }

        const csvRows = csvData.split('\n').filter(line => line.trim() !== '')
        if (csvRows.length < 2) return { csvHeader: [], rows: [] }

        const header = parseCSVRow(csvRows[0])
        const parsedRows = []
        const dateIdx = header.indexOf('Date')
        const startDate = date.start ? new Date(date.start) : null
        const endDate = date.end ? new Date(date.end) : null

        for (let i = 1; i < csvRows.length; i++) {
            const row = parseCSVRow(csvRows[i])

            // Filter by date range if date indices exist and date range is provided
            if (dateIdx !== -1 && startDate && endDate) {
                const rowDate = new Date(row[dateIdx])
                if (rowDate < startDate || rowDate > endDate) {
                    continue
                }
            }

            parsedRows.push(row)
        }

        return { csvHeader: header, rows: parsedRows }
    }, [csvData, date])

    // Group and filter data based on selected type
    const displayData = useMemo(() => {
        if (rows.length === 0) return []

        if (filterType === 'cashRevenue') {
            return groupCashRevenue(rows, csvHeader, trajectBank)
        } else if (filterType === 'cashlessRevenue') {
            return groupCashlessRevenue(rows, csvHeader, trajectBank)
        }

        return rows
    }, [rows, csvHeader, filterType])

    const columns = getRevenueColumns(filterType)

    return (
        <div>


            {/* Data Table */}
            <Table
                headerContent={(
                    <Row>
                        <Col column={6}>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                                <Label
                                    labels={[
                                        {
                                            title: "Tunai",
                                            value: 'cashRevenue',
                                            class: filterType === 'cashRevenue' ? 'primary' : 'warning',
                                            onClick: () => {
                                                setFilterType('cashRevenue')
                                                setFileName("Laporan-Pendapatan-Tunai-" + date.start + "s.d" + date.end)
                                            }
                                        },
                                        {
                                            title: "Non-Tunai",
                                            value: 'cashlessRevenue',
                                            class: filterType === 'cashlessRevenue' ? 'primary' : 'warning',
                                            onClick: () => {
                                                setFilterType('cashlessRevenue')
                                                setFileName("Laporan-Pendapatan-Non-Tunai-" + date.start + "s.d" + date.end)
                                            }
                                        }
                                    ]}
                                    activeIndex={filterType}
                                />
                            </div>
                        </Col>
                    </Row>
                )}
                columns={columns}
                records={displayData}
                isLoading={isLoading}
                fileName={fileName}
            />
        </div>
    )
}
