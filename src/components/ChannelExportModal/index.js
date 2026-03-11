import Button from '../Button'
import Modal, { ModalContent } from '../Modal'
import { postJSON, postFormData, objectToParams, get } from '../../api/utils'
import AppContext from '../../context/app'
import { currency, dateFilter, paymentProvider } from '../../utils/filters'
import { useState, useContext, useEffect } from "react";
import { Col, Row } from '../Layout'
import Input from '../Input'
import Main, { popAlert } from '../Main'
import { writeXLSX, utils, writeFile } from 'xlsx'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {}
}

ChannelExportModal.defaultProps = defaultProps

export default function ChannelExportModal(props = defaultProps) {
    const appContext = useContext(AppContext)
    const [_date, _setDate] = useState({
        start: dateFilter.basicDate(new Date()).normal,
        end: dateFilter.basicDate(new Date()).normal
    })
    const [_isProcessing, _setIsProcessing] = useState(false)


    const [_selectedType, _setSelectedType] = useState({
        title: "Transaksi",
        value: "transaction"
    })

    const [_selectedGroup, _setSelectedGroup] = useState({
        title: "Kode booking",
        value: "/csv"
    })

    const [_dateRange, _setDateRange] = useState({
        minDate: "",
        maxDate: dateFilter.basicDate(new Date()).normal
    })

    const [_typeTransaction, _setTypeTransaction] = useState([
        {
            title: "Transaksi",
            value: "transaction"
        },
        {
            title: "Setoran",
            value: "transaction"
        },
        {
            title: "Pendapatan Tunai",
            value: "transaction"
        },
        {
            title: "Pendapatan Non Tunai",
            value: "transaction"
        },
    ])

    const [_groupTransaction, _setGroupTransaction] = useState([
        {
            title: "Kode booking",
            value: "/csv"
        },
        {
            title: "Tiket",
            value: "/tiket/list"
        },
    ])

    const [_dataExport, _setDataExport] = useState([])
    const [_trajectBankData, _setTrajektBankData] = useState([])

    useEffect(() => {
        if (_selectedType.title == "Keberangkatan") {
            _setDateRange({
                "maxDate": ""
            })
        } else {
            _setDateRange({
                "maxDate": dateFilter.basicDate(new Date()).normal
            })
        }

    }, [_selectedType.title])

    // Fetch traject bank data on component mount
    useEffect(() => {
        const fetchTrajektBankData = async () => {
            let params ={
                startFrom: 0,
                length: 360
            }

            try {
                const res = await postJSON(`/masterData/trajectBank/list`, params, appContext.authData.token);
                if (res && res.data) {
                    _setTrajektBankData(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch traject bank data:", e);
            }
        };

        if (appContext.authData?.token) {
            fetchTrajektBankData();
        }
    }, [appContext.authData?.token])

    useEffect(() => {
        console.log(appContext)
    }, [props.visible])

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

    useEffect(() => {
        if (_dataExport.length > 0) {
            document.getElementById("clickExport").click()
        }
    }, [_dataExport])


    /**
     * Parse a CSV row, handling quoted values that may contain commas.
     * @param {string} row - The CSV row string to parse
     * @returns {string[]} - Array of field values
     */
    function parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        // Escaped quote
                        current += '"';
                        i++; // Skip next quote
                    } else {
                        // End of quoted field
                        inQuotes = false;
                    }
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    // Start of quoted field
                    inQuotes = true;
                } else if (char === ',') {
                    // Field separator
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
        }

        // Don't forget the last field
        result.push(current);

        return result;
    }

    function capitalizeFirstLetter(string) {
        // Get the first character and convert to uppercase, then concatenate with the rest of the string
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getTrajektNameByAccountNumber(accountNumber) {
        if (!accountNumber || !_trajectBankData.length) return "";
        const match = _trajectBankData.find(item => item.bank_account_number === String(accountNumber));
        return match ? match["traject_name_alias"] : "";
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

    function _compareDate(d1, d2) {
        let date1 = new Date(d1)
        date1.setDate(date1.getDate() + 32);
        date1 = date1.getTime()
        let date2 = new Date(d2).getTime();

        if (date1 >= date2) {
            return true
        } else {
            return false
        }
    }

    function _triggerClick() {
        console.log("clicker")
    }

    return (
        <Modal
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: "Export semua channel",
                    closeModal: props.closeModal
                }}
            >
                <Row>
                    <Col
                        withPadding
                        marginBottom
                    >
                        <Input
                            title={"Jenis Laporan"}
                            value={_selectedType.title}
                            suggestions={_typeTransaction}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _setSelectedType(value)
                            }}
                        />
                    </Col>

                </Row>


                <small
                    style={{
                        "font-size": '.9rem',
                        "color": "gray",
                        "marginLeft": ".2rem",
                        "marginTop": "1rem"
                    }}
                >
                    Maksimal 31 Hari
                </small>

                <Row>


                    <Col
                        column={3}
                        mobileFullWidth
                        withPadding
                    >
                        <Input
                            max={_dateRange.maxDate}
                            title={'Tanggal Awal'}
                            type={'date'}
                            value={_date.start}
                            onChange={date => _setDate(oldData => {
                                return {
                                    ...oldData,
                                    start: dateFilter.basicDate(new Date(date)).normal
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
                            min={_date.start}
                            max={_dateRange.maxDate}
                            title={'Tanggal Akhir'}
                            type={'date'}
                            value={_date.end}
                            onChange={date => _setDate(oldData => {
                                return {
                                    ...oldData,
                                    end: dateFilter.basicDate(new Date(date)).normal
                                }
                            })}
                        />
                    </Col>
                </Row>

                <Col
                    column={2}
                    withPadding
                    mobileFullWidth
                    style={{
                        marginTop: "1rem"
                    }}
                >
                    <Button
                        styles={Button.success}
                        title={'Unduh'}
                        onProcess={_isProcessing}
                        onClick={_getAllChannelReport}
                    />

                    <div
                        style={{
                            display: "none"
                        }}
                    >
                        <Button
                            id="clickExport"
                            dataExport={_dataExport}
                            headExport={[
                                {
                                    title: 'Kode Booking',
                                    value: 'kode_booking'
                                },
                                {
                                    title: 'Penyedia Pembayaran',
                                    value: 'penyedia_pembayaran',
                                },
                                {
                                    title: 'Tanggal Pembelian',
                                    value: 'tanggal_pembelian',
                                },
                                {
                                    title: 'Kode Trayek',
                                    value: 'kode_trayek'
                                },
                                {
                                    title: 'Trayek',
                                    value: 'trayek',
                                },
                                {
                                    title: 'Asal',
                                    value: 'asal'
                                },
                                {
                                    title: 'Tujuan',
                                    value: 'tujuan',
                                },
                                {
                                    title: 'Segmen',
                                    value: 'segmen',
                                },
                                {
                                    title: 'Harga',
                                    value: 'harga'
                                },
                                {
                                    title: 'Jumlah Penumpang',
                                    value: 'jumlah_penumpang',
                                },
                                {
                                    title: 'Total Harga Setelah Discount',
                                    value: 'total_harga_stl_discount'
                                },
                                {
                                    title: 'Total Asuransi',
                                    value: 'total_asuransi',
                                },
                                {
                                    title: 'Discount',
                                    value: 'discount',
                                },
                                {
                                    title: 'Biaya Transaksi',
                                    value: 'biaya_transaksi'
                                },
                                {
                                    title: 'Total Harga Normal',
                                    value: 'total_harga_normal',
                                },
                                {
                                    title: 'Metode Pembayaran',
                                    value: 'metode_pembayaran'
                                },
                                {
                                    title: 'Tanggal Keberangkatan',
                                    value: 'tanggal_keberangkatan',
                                },
                                {
                                    title: 'Counter',
                                    value: 'counter'
                                },
                                {
                                    title: 'Kode Referensi Transaksi',
                                    value: 'kode_refrensi_transaksi',
                                },
                                {
                                    title: 'Nama Promosi',
                                    value: 'nama_promosi'
                                },
                                {
                                    title: 'Provider Promosi',
                                    value: 'provider_promosi',
                                },
                            ]}
                            styles={Button.success}
                            title={'Unduh'}
                            onClick={_triggerClick}
                        />
                    </div>

                </Col>


            </ModalContent>

        </Modal>
    )
}