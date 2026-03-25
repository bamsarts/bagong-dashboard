import { currency, dateFilter } from "./filters"

/**
 * Parse CSV row handling quoted values
 */
export function parseCSVRow(row) {
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

/**
 * Group cash revenue data (Tunai)
 */
export function groupCashRevenue(data, csvHeader, trajectBank) {
    const groups = {}
    const routeIdx = csvHeader.indexOf('Route')
    const dateIdx = csvHeader.indexOf('Date')
    const paymentTypeIdx = csvHeader.indexOf('Payment Type')
    const totalAfterDiscountIdx = csvHeader.indexOf('Total Harga Setelah Discount')
    const passengerIdx = csvHeader.indexOf('Passenger Count')
    const accNumber = csvHeader.indexOf('Nomor Rekening')

    data.forEach(row => {
        // Filter only Tunai payment type
        if (paymentTypeIdx !== -1 && row[paymentTypeIdx] !== 'Tunai') {
            return
        }

        const date = row[dateIdx] || ''
        const route = row[routeIdx] || ''
        const groupKey = `${date}|${route}`
        const trajectMaster = getTrajektNameByAccountNumber(row[accNumber], trajectBank)

        if (!groups[groupKey]) {
            groups[groupKey] = {
                date: date,
                route: route,
                trajectMaster: trajectMaster,
                passengerCount: 0,
                totalTunai: 0,
            }
        }

        groups[groupKey].passengerCount += parseInt(row[passengerIdx] || '0', 10)
        groups[groupKey].totalTunai += parseInt(row[totalAfterDiscountIdx] || '0', 10)
    })

    return Object.values(groups).map(group => ({
        ...group,
        feeBIS: group.totalTunai * 0.012,
        ppn: Math.ceil((group.totalTunai * 0.012) * (11 / 111)),
    }))
}

/**
 * Group cashless revenue data (Non-Tunai)
 */
export function groupCashlessRevenue(data, csvHeader, trajectBank) {
    const groups = {}
    const routeIdx = csvHeader.indexOf('Route')
    const dateIdx = csvHeader.indexOf('Date')
    const paymentTypeIdx = csvHeader.indexOf('Payment Type')
    const paymentMethodIdx = csvHeader.indexOf('Payment Method')
    const totalAfterDiscountIdx = csvHeader.indexOf('Total Harga Setelah Discount')
    const passengerIdx = csvHeader.indexOf('Passenger Count')
    const mdrIdx = csvHeader.indexOf('MDR')
    const accNumber = csvHeader.indexOf('Nomor Rekening')

    data.forEach(row => {
        // Filter only Non-Tunai payment type
        if (paymentTypeIdx !== -1 && row[paymentTypeIdx] !== 'Non-Tunai') {
            return
        }

        const date = row[dateIdx] || ''
        const route = row[routeIdx] || ''
        const paymentMethod = row[paymentMethodIdx] || ''
        const groupKey = `${date}|${route}`
        const trajectMaster = getTrajektNameByAccountNumber(row[accNumber], trajectBank)

        if (!groups[groupKey]) {
            groups[groupKey] = {
                date: date,
                route: route,
                trajectMaster: trajectMaster,
                passengerCount: 0,
                qris: 0,
                emoney: 0,
                mdrQris: 0,
                mdrEmoney: 0,
            }
        }

        const totalAmount = parseInt(row[totalAfterDiscountIdx] || '0', 10)
        const mdr = parseInt(row[mdrIdx] || '0', 10)

        groups[groupKey].passengerCount += parseInt(row[passengerIdx] || '0', 10)

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
            ppn: Math.ceil((totalCashless * 0.012) * (11 / 111)),
        }
    })
}

/**
 * Get traject name alias by account number from trajectBank data
 * @param {string} accNumber - Bank account number to search for
 * @param {Array} trajectBank - Array of traject bank records
 * @returns {string} traject_name_alias or '-' if not found
 */
export function getTrajektNameByAccountNumber(accNumber, trajectBank) {
    if (!accNumber || !trajectBank || !Array.isArray(trajectBank)) {
        return '-'
    }

    const record = trajectBank.find(item => item.bank_account_number === accNumber)
    return record?.traject_name_alias || '-'
}

/**
 * Get column configuration based on report type
 */
export function getRevenueColumns(type) {
    const baseColumns = [
        {
            title: 'Tanggal',
            field: 'date',
            textAlign: 'left',
            customCell: (value) => {
                return dateFilter.basicDate(new Date(value)).normalId
            }
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
                title: 'Tunai',
                field: 'totalTunai',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'Fee BIS',
                field: 'feeBIS',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'PPn',
                field: 'ppn',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
        ]
    } else if (type === 'cashlessRevenue') {
        return [
            ...baseColumns,
            {
                title: 'QRIS',
                field: 'qris',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'MDR QRIS',
                field: 'mdrQris',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'E-Money',
                field: 'emoney',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'MDR E-Money',
                field: 'mdrEmoney',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'Fee BIS',
                field: 'feeBIS',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
            {
                title: 'PPn',
                field: 'ppn',
                textAlign: 'right',
                customCell: (value) => currency(value),
            },
        ]
    }

    return baseColumns
}

/**
 * Format value as currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value)
}
