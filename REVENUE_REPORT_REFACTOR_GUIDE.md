# Revenue Report Refactor Guide

## Overview
This refactor converts the export-only CSV logic into a filterable table display component that shows Tunai (cash) and Non-Tunai (cashless) transactions separately.

## New Files Created

### 1. `src/utils/revenueReportUtils.js`
Utility functions for processing revenue data:
- `parseCSVRow()` - Parse CSV rows handling quoted values
- `groupCashRevenue()` - Group and aggregate Tunai transactions
- `groupCashlessRevenue()` - Group and aggregate Non-Tunai transactions
- `getRevenueColumns()` - Get table column configuration based on type
- `getTrajektNameByAccountNumber()` - Map account numbers to traject names

### 2. `src/components/RevenueReportDisplay.js`
Main display component with:
- Filter buttons for Tunai, Non-Tunai, and All transactions
- Dynamic table columns based on selected filter
- Automatic data grouping and aggregation
- Currency formatting

## Usage Example

```jsx
import RevenueReportDisplay from '../../../../components/RevenueReportDisplay'

// In your component:
const [csvData, setCsvData] = useState('')
const [isLoading, setIsLoading] = useState(false)

// After fetching CSV data from API:
async function _getAllChannelReport() {
    setIsLoading(true)
    
    try {
        const res = await get(
            `/laporan/penjualan/harian/export${_selectedGroup.value}?${objectToParams(params)}`,
            appContext.authData.token,
            true
        )
        
        setCsvData(res) // res should be the CSV text
        setIsLoading(false)
    } catch (e) {
        popAlert({ message: e.message })
        setIsLoading(false)
    }
}

// In your JSX:
<RevenueReportDisplay csvData={csvData} isLoading={isLoading} />
```

## Data Structure

### Cash Revenue (Tunai) - Type: "cashRevenue"
Columns displayed:
- Tanggal (Date)
- Trayek (Master) - Route name
- Rute (Route)
- Jumlah Penumpang (Passenger Count)
- Tunai (Rp) - Total cash amount
- Fee BIS (Rp) - 1.2% fee
- PPN (Rp) - Tax (11/111 of fee)

### Cashless Revenue (Non-Tunai) - Type: "cashlessRevenue"
Columns displayed:
- Tanggal (Date)
- Trayek (Master) - Route name
- Rute (Route)
- Jumlah Penumpang (Passenger Count)
- QRIS (Rp) - QRIS payment amount
- MDR QRIS (Rp) - QRIS merchant discount rate
- E-Money (Rp) - E-Money payment amount
- MDR E-Money (Rp) - E-Money merchant discount rate
- Fee BIS (Rp) - 1.2% fee
- PPN (Rp) - Tax (11/111 of fee)

## Key Changes from Original Code

### Before (Export Only)
```javascript
function _downloadCsv(data, fileName, type = "transaction") {
    // Complex logic mixing data processing with HTML generation
    // Only output to Excel file
}
```

### After (Display + Export)
```javascript
// Separated concerns:
// 1. Data processing (revenueReportUtils.js)
// 2. Display logic (RevenueReportDisplay.js)
// 3. Table component handles export

<RevenueReportDisplay csvData={csvData} isLoading={isLoading} />
```

## Benefits

1. **Reusable** - Utility functions can be used elsewhere
2. **Maintainable** - Clear separation of concerns
3. **Testable** - Pure functions for data processing
4. **User-Friendly** - View data before exporting
5. **Flexible** - Easy to add more filters or columns

## Customization

### Add More Filters
Edit `RevenueReportDisplay.js` to add more filter buttons:
```jsx
<Button
    title="Custom Filter"
    styles={filterType === 'custom' ? Button.primary : Button.secondary}
    onClick={() => setFilterType('custom')}
    small
/>
```

### Update Traject Mapping
Edit `getTrajektNameByAccountNumber()` in `revenueReportUtils.js`:
```javascript
export function getTrajektNameByAccountNumber(accNumber) {
    const trajectMap = {
        '1234567890': 'Jakarta - Bandung',
        '0987654321': 'Bandung - Yogyakarta',
        // ... more mappings
    }
    return trajectMap[accNumber] || accNumber || '-'
}
```

### Modify Calculations
Update fee and tax calculations in grouping functions:
```javascript
// Current: 1.2% fee, 11/111 tax
const feeBIS = group.totalTunai * 0.012
const ppn = feeBIS * (11 / 111)

// Customize as needed
```

## Integration Steps

1. Copy `src/utils/revenueReportUtils.js` to your project
2. Copy `src/components/RevenueReportDisplay.js` to your project
3. Update `getTrajektNameByAccountNumber()` with your actual mapping
4. Import and use in your sales report page
5. Remove old `_downloadCsv()` function or keep for backward compatibility
