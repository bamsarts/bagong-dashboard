import { useEffect, useState } from 'react'

import { get, postJSON } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import { Col, Row } from '../../../../components/Layout'
import Table from '../../../../components/Table'
import ReportSalesModal from '../../../../components/ReportSalesModal'
import { currency, dateFilter, role } from '../../../../utils/filters'
import { utils } from 'xlsx'
import { getSessionStorage, setSessionStorage } from '../../../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'
import RevenueReportDisplay from '../../../../components/RevenueReportDisplay'

import { objectToParams } from '../../../../api/utils'

export default function Sales(props) {

    
    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal,
        end : dateFilter.basicDate(new Date()).normal,
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isProcessingDetail, _setIsProcessingDetail] = useState(false)
    const [_counterRange, _setCounterRange] = useState([])
    const [_counter, _setCounter] = useState({
        "title": "",
        "value": ""
    })
    const [_openModalDetail, _setOpenModalDetail] = useState(false)
    const [_salesReportDetail, _setSalesReportDetail] = useState([])
    const [_summary, _setSummary] = useState({
        pnp: 0,
        cash : 0,
        emoney : 0,
        qris : 0,
        debit : 0,
        kredit: 0,
        totalNominal: 0,
        mdr: 0,
        edcBtn: 0,
        edcMandiri: 0,
        edcBca: 0,
        edcBri: 0,
        edcBtn: 0,
        qrisTap: 0,
    })
    const [_rowInfo, _setRowInfo] = useState({})
    const [_isLoaded, _setIsLoaded] = useState(false)
    const [_accessMenu, _setAccessMenu] = useState([])
    const [csvData, setCsvData] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Perform localStorage action
            
            let storage = getLocalStorage("access_menu_damri")
            
            if( storage == null){
                window.location.href = "/sign-in"
            }else{
                const item = JSON.parse(storage)
                _setAccessMenu(item)
            }

            _getCounter()
            _getSalesReport()
        }
    }, [])


    

    useEffect(() => {
       
    },[])

 

    async function _getAllChannelReport() {

        if (!_compareDate(_date.start, _date.end)) {
            popAlert({ message: 'Rentang tanggal maksimal 31 hari', type: 'info' })
            return false
        }

        _setIsProcessing(true)

        let params = {
            companyId: appContext.authData.companyId,
            startDate: _date.start,
            endDate: _date.end,
            dateBy: _selectedType.value
        }

        if (_selectedGroup.title == "Tiket") params.formatReport = "CSV"
        if (appContext.branch?.branchId) params.branchId = appContext.branch.branchId

        try {
            // Since the API returns a file with proper headers, we'll handle it as a blob
            const res = await get(`/laporan/penjualan/harian/export` + _selectedGroup.value + `?${objectToParams(params)}`, appContext.authData.token, true);

            if (_selectedType.title == "Transaksi") {
                _downloadCsv(res, `Transaksi-${_date.start}-s.d-${_date.end}.csv`);

            } else if (_selectedType.title == "Pendapatan Tunai") {
                _downloadCsv(res, `Pendapatan-Tunai-${_date.start}-s.d-${_date.end}.csv`, "cashRevenue")
            } else if (_selectedType.title == "Pendapatan Non Tunai") {
                _downloadCsv(res, `Pendapatan-Non-Tunai-${_date.start}-s.d-${_date.end}.csv`, "cashlessRevenue")
            } else {
                _downloadCsv(res, `Setoran-${_date.start}-s.d-${_date.end}.csv`, "setoran");
            }

            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message: e.message })
            _setIsProcessing(false)
        }
    }
    

     function _downloadCsv(data, fileName, type = "transaction") {
        let template = document.createElement('template')
        let tableExport = "<table>"

        // Define desired columns in the order we want them in the export
        const headerTransaction = ["Transaction ID", "Penyedia Pembayaran", "Date", "Kode Trayek", "Trayek (Master)", "Route", "Origin",
            "Destination", "Bus Name", "Cabang Trayek", "Booking Code", "Departure Date", "Passenger Count",
            "Base Fare", "Total Harga Tiket", "Diskon", "Total Harga Setelah Discount", "MDR", "Payment Method",
            "Channel", "Payment Status", "Status Setoran", "Nomor Rekening", "Nama Rekening"];


        const headerDeposit = ["Transaction ID", "Penyedia Pembayaran", "Date", "Kode Trayek", "Trayek (Master)", "Route", "Origin",
            "Destination", "Bus Name", "Cabang Trayek", "Booking Code", "Tanggal Setoran", "Passenger Count",
            "Base Fare", "Total Harga Tiket", "Diskon", "Total Harga Setelah Discount", "MDR", "Payment Method",
            "Channel"];

        const headerDepositCash = ["Date", "Trayek (Master)", "Route", "Passenger Count", "Tunai", "Fee BIS", "PPN"]

        const headerDepositCashless = ["Date", "Trayek (Master)", "Route", "Passenger Count", "QRIS", "MDR Qris", "Emoney", "MDR Emoney", "Fee BIS", "PPN"]

        let header = headerTransaction

        if (type == "setoran") {
            header = headerDeposit
        } else if (type == "cashRevenue") {
            header = headerDepositCash
        } else if (type == "cashlessRevenue") {
            header = headerDepositCashless
        }

        let translate = {
            "Base Fare": "Harga Tiket",
            "Passenger Count": "Jumlah Penumpang",
            "Cabang Trayek": "Cabang",
            "Origin": "Asal",
            "Destination": "Tujuan",
            "Transaction ID": "Kode Transaksi",
            "Date": "Tanggal Pembelian Tiket",
            "Route": "Rute",
            "Bus Name": "Nopol",
            "Payment Method": "Metode Pembayaran",
            "Booking Code": "Kode Booking",
            "Departure Date": "Tanggal Keberangkatan"
        }


        data = data.split("\n").filter(line => line.trim() !== "");

        if (data.length === 0) return;

        const csvHeader = parseCSVRow(data[0]);

        // Map each desired header to its index in the CSV
        const columnMapping = header.map(h => csvHeader.indexOf(h));

        // Table header
        tableExport += "<tr>";
        header.forEach(h => { tableExport += `<th>${translate[h] || h}</th>`; });
        tableExport += "</tr>";

        // Column indexes we need
        const dateDeparture = csvHeader.indexOf("Date")
        const accAcount = csvHeader.indexOf("Nomor Rekening")
        const dateDeposit = csvHeader.indexOf("Tanggal Setoran")
        const baseFare = csvHeader.indexOf("Base Fare")
        const passenger = csvHeader.indexOf("Passenger Count")
        const paymentMethod = csvHeader.indexOf("Payment Method")
        const depositStatus = csvHeader.indexOf("Status Setoran")
        const accNumber = csvHeader.indexOf("Nomor Rekening")
        const accName = csvHeader.indexOf("Nama Rekening")

        // Handle cashRevenue grouping
        if (type == "cashRevenue") {
            const routeIdx = csvHeader.indexOf("Route");
            const dateIdx = csvHeader.indexOf("Date");
            const paymentTypeIdx = csvHeader.indexOf("Payment Type");
            const totalAfterDiscountIdx = csvHeader.indexOf("Total Harga Setelah Discount");
            const passengerIdx = csvHeader.indexOf("Passenger Count");

            // Group transactions by Date + Route
            const groups = {};

            for (let i = 1; i < data.length; i++) {
                let row = parseCSVRow(data[i]);
                if (row.length < csvHeader.length) continue;

                // Only include "Tunai" payment type
                if (paymentTypeIdx !== -1 && row[paymentTypeIdx] !== "Tunai") {
                    continue;
                }

                const date = row[dateIdx] || "";
                const route = row[routeIdx] || "";
                const groupKey = `${date}|${route}`;
                const trajectMaster = getTrajektNameByAccountNumber(row[accNumber])

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        date: date,
                        route: route,
                        passengerCount: 0,
                        totalTunai: 0,
                        trajectMaster: trajectMaster
                    };
                }

                // Sum passenger count and total after discount
                groups[groupKey].passengerCount += parseInt(row[passengerIdx] || "0", 10);
                groups[groupKey].totalTunai += parseInt(row[totalAfterDiscountIdx] || "0", 10);
            }

            // Output grouped rows
            Object.values(groups).forEach(group => {
                const feeBIS = group.totalTunai * 0.012;
                const ppn = feeBIS * (11 / 111);

                tableExport += "<tr>";
                tableExport += `<td>'${group.date}</td>`;
                 tableExport += `<td>${group.trajectMaster}</td>`;
                tableExport += `<td>${group.route}</td>`;
                tableExport += `<td>${group.passengerCount}</td>`;
                tableExport += `<td>${group.totalTunai}</td>`;
                tableExport += `<td>${feeBIS}</td>`;
                tableExport += `<td>${Math.floor(ppn)}</td>`;
                tableExport += "</tr>";
            });

        } else if (type == "cashlessRevenue") {
            const routeIdx = csvHeader.indexOf("Route");
            const dateIdx = csvHeader.indexOf("Date");
            const paymentTypeIdx = csvHeader.indexOf("Payment Type");
            const paymentMethodIdx = csvHeader.indexOf("Payment Method");
            const totalAfterDiscountIdx = csvHeader.indexOf("Total Harga Setelah Discount");
            const passengerIdx = csvHeader.indexOf("Passenger Count");
            const mdrIdx = csvHeader.indexOf("MDR")

            // Group transactions by Date + Route
            const groups = {};

            for (let i = 1; i < data.length; i++) {
                let row = parseCSVRow(data[i]);
                if (row.length < csvHeader.length) continue;

                // Only include "Non-Tunai" payment type
                if (paymentTypeIdx !== -1 && row[paymentTypeIdx] !== "Non-Tunai") {
                    continue;
                }

                const date = row[dateIdx] || "";
                const route = row[routeIdx] || "";
                const paymentMethod = row[paymentMethodIdx] || "";
                const groupKey = `${date}|${route}`;
                const trajectMaster = getTrajektNameByAccountNumber(row[accNumber])

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        date: date,
                        route: route,
                        passengerCount: 0,
                        qris: 0,
                        emoney: 0,
                        trajectMaster: trajectMaster,
                        mdrQris: 0,
                        mdrEmoney: 0
                    };
                }

                // Sum passenger count
                groups[groupKey].passengerCount += parseInt(row[passengerIdx] || "0", 10);
            

                // Separate by payment method
                const totalAmount = parseInt(row[totalAfterDiscountIdx] || "0", 10);
                const mdr = parseInt(row[mdrIdx] || "0", 10);

                if (paymentMethod.toLowerCase() === "qris") {
                    groups[groupKey].qris += totalAmount;
                    groups[groupKey].mdrQris += mdr
                } else if (paymentMethod.toLowerCase() === "emoney") {
                    groups[groupKey].emoney += totalAmount;
                    groups[groupKey].mdrEmoney += mdr
                }
            }

            // Output grouped rows
            Object.values(groups).forEach(group => {
                const totalCashless = group.qris + group.emoney;
                const feeBIS = totalCashless * 0.012;
                const ppn = feeBIS * (11 / 111);
                const mdrQris = group.qris * 0.007
                const mdrEmoney = group.emoney * 0.02


                tableExport += "<tr>";
                tableExport += `<td>'${group.date}</td>`;
                tableExport += `<td>${group.trajectMaster}</td>`;
                tableExport += `<td>${group.route}</td>`;
                tableExport += `<td>${group.passengerCount}</td>`;
                tableExport += `<td>${group.qris}</td>`;
                tableExport += `<td>${group.mdrQris}</td>`;
                tableExport += `<td>${group.emoney}</td>`;
                tableExport += `<td>${group.mdrEmoney}</td>`;
                tableExport += `<td>${feeBIS}</td>`;
                tableExport += `<td>${Math.floor(ppn)}</td>`;
                tableExport += "</tr>";
            });

        } else {
            // Original logic for transaction and setoran types
            for (let i = 1; i < data.length; i++) {
                let row = parseCSVRow(data[i]);
                if (row.length < csvHeader.length) continue;
                let tempAccNumber = row[accNumber]

                if (dateDeposit !== -1 && type == "setoran") {
                    if (row[dateDeposit] == "-") {
                        continue;
                    }
                }

                if (dateDeparture !== -1) {
                    row[dateDeparture] = "'" + row[dateDeparture]
                }

                if (accAcount !== -1) {
                    row[accAcount] = "'" + row[accAcount]
                }

                row[paymentMethod] = row[paymentMethod] == "qris" ? "QRIS" : capitalizeFirstLetter(row[paymentMethod])

                if (row[paymentMethod] == "Cash") {
                    row[accNumber] = ""
                    row[accName] = ""
                }


                if (depositStatus !== -1) {
                    row[depositStatus] = row[depositStatus] == "Sudah Setoran" ? 'Done' : "Pending"
                }

                // Calculate Total Harga Tiket (Passenger Count * Base Fare)
                let calculatedTotalFare = "";
                if (passenger !== -1 && baseFare !== -1) {
                    const passengerCount = parseInt(row[passenger] || "0", 10);
                    const baseFareValue = parseInt(row[baseFare] || "0", 10);
                    calculatedTotalFare = String(passengerCount * baseFareValue);
                }

                tableExport += "<tr>";
                columnMapping.forEach((idx, colIndex) => {
                    if (header[colIndex] === "Total Harga Tiket") {
                        // This is the "Total Harga Tiket" column that doesn't exist in CSV
                        tableExport += `<td>${calculatedTotalFare}</td>`;
                    } else if (header[colIndex] === "Trayek (Master)") {
                        // This is the "Trayek (Master)" column - get from bank data
                        const trajektName = getTrajektNameByAccountNumber(tempAccNumber);
                        tableExport += `<td>${trajektName}</td>`;
                    } else {
                        tableExport += `<td>${row[idx] ?? ""}</td>`;
                    }
                });
                tableExport += "</tr>";
            }
        }


        tableExport += "</table>"
        template.innerHTML = tableExport

        const wb = utils.table_to_book(template.content.firstChild)
        return writeFile(wb, `${fileName.replace(".csv", "")}.xlsx`)
    }

   

    async function _getSalesReport() {

        setIsLoading(true)
        
         let params = {
            companyId: props.authData.companyId,
            startDate: _date.start,
            endDate: _date.end,
            dateBy: "transaction"
        }

        try {
            const res = await get(
                `/laporan/penjualan/harian/export/csv?${objectToParams(params)}`,
                props.authData.token,
                true
            )
            
            setCsvData(res) // res should be the CSV text
            setIsLoading(false)
        } catch (e) {
            popAlert({ message: e.message })
            setIsLoading(false)
        }
    }

    function _getRole(token){
        let isAllowedMdr = false
        
        if(_accessMenu.length > 0){
            _accessMenu.forEach(function(val, key){
                if(val.menu == "Laporan>PendapatanFee"){
                    isAllowedMdr = val.viewRole
                }
            })
        }
        
        return isAllowedMdr
    }

    async function _getCounter(){
        
        let params = {
            startFrom : 0,
            length: 410,
        }

        try {
            const res = await postJSON(`/masterData/counter/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Counter",
                        value: ""
                    })
                }

                if(props.branch?.branchId){
                    if(val.branchId == props.branch?.branchId){
                        data.push({
                            title: val.name,
                            value: val.id
                        })
                    }
                }else{
                    data.push({
                        title: val.name,
                        value: val.id
                    })
                }
               
            })

            if(res) {
                _setCounterRange(data)
                _setCounter(data[0])
            }

        } catch (e) {
            console.log(e)
        }
    }

    function _compareDate(d1, d2){
        let date1 = new Date(d1)
        date1.setDate(date1.getDate()+7);
        date1 = date1.getTime()
        let date2 = new Date(d2).getTime();
    
        if(date1 >= date2){
            return true
        }else{
            return false
        }
    }


    return (
        <Main>
           
            
            <AdminLayout>
                <Card>
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={3}
                        >

                            <small
                            style={{
                                "font-size": '10px'
                            }}
                            >*Maksimal 1 Minggu</small>


                            <Row>
                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Tanggal Awal'}
                                    type={'date'}
                                    value={_date.start}
                                    onChange={date => _setDate(oldData => {
                                        return {
                                            ...oldData,
                                            start : dateFilter.basicDate(new Date(date)).normal
                                        }
                                    })}
                                    />
                                </Col>
                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Tanggal Akhir'}
                                    type={'date'}
                                    value={_date.end}
                                    min={_date.start}
                                    onChange={date => _setDate(oldData => {
                                        return {
                                            ...oldData,
                                            end : dateFilter.basicDate(new Date(date)).normal
                                        }
                                    })}
                                    />
                                </Col>
                            </Row>
                        </Col>
                       
                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Button
                            title={'Terapkan'}
                            onProcess={_isProcessing}
                            onClick={_getSalesReport}
                            />
                        </Col>
                    </Row>
                </Card>
             
                <Card
                noPadding
                >
                    
                    <RevenueReportDisplay csvData={csvData} isLoading={isLoading} />
                        
                </Card>
                    
            </AdminLayout>
        </Main>
    )

}