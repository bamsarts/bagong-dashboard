import { useState, useMemo } from 'react'
import Table from './Table'
import { Row, Col } from './Layout'
import Button from './Button'
import { currency } from '../utils/filters'
import { parseCSVRow, groupCashRevenue, groupCashlessRevenue, getRevenueColumns } from '../utils/revenueReportUtils'

/**
 * Revenue Report Display Component
 * Displays CSV data in a filterable table for Tunai and Non-Tunai transactions
 */
export default function RevenueReportDisplay({ csvData, isLoading = false }) {
    const [filterType, setFilterType] = useState('cashRevenue') // 'all', 'cashRevenue', 'cashlessRevenue'

    // Parse CSV data
    const { csvHeader, rows } = useMemo(() => {
        if (!csvData || csvData.length === 0) return { csvHeader: [], rows: [] }

        const csvRows = csvData.split('\n').filter(line => line.trim() !== '')
        if (csvRows.length < 2) return { csvHeader: [], rows: [] }

        const header = parseCSVRow(csvRows[0])
        const parsedRows = []

        for (let i = 1; i < csvRows.length; i++) {
            parsedRows.push(parseCSVRow(csvRows[i]))
        }

        return { csvHeader: header, rows: parsedRows }
    }, [csvData])

    // Group and filter data based on selected type
    const displayData = useMemo(() => {
        if (rows.length === 0) return []

        if (filterType === 'cashRevenue') {
            return groupCashRevenue(rows, csvHeader)
        } else if (filterType === 'cashlessRevenue') {
            return groupCashlessRevenue(rows, csvHeader)
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
                )}
                columns={columns}
                records={displayData}
                isLoading={isLoading}
                fileName={`Laporan-Pendapatan-${filterType}`}
            />
        </div>
    )
}
