import Button from '../Button'
import Modal, { ModalContent } from '../Modal'
import { postJSON, postFormData } from '../../api/utils'
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
        title: "Pembelian",
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
            title: "Pembelian",
            value: "transaction"
        },
        {
            title: "Keberangkatan",
            value: "departure"
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
            typeTransaction: _selectedType.value
        }

        if (_selectedGroup.title == "Tiket") params.formatReport = "CSV"
        if (appContext.branch?.branchId) params.branchId = appContext.branch.branchId

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/harian` + _selectedGroup.value, params, appContext.authData.token, true)

            if (_selectedGroup.title == "Tiket") {
                _downloadCsvTicket(res, `Transaksi-${_selectedType.title}-${_selectedGroup.title}-${_date.start}-s.d-${_date.end}.csv`);
            } else {
                _downloadCsv(res, `Transaksi-${_selectedType.title}-${_selectedGroup.title}-${_date.start}-s.d-${_date.end}.csv`);
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

    function _downloadCsvTicket(data, fileName) {
        let template = document.createElement('template');
        let tableExport = "<table>";
        const header = ["kode_booking", "penyedia_pembayaran", "tanggal_pembelian", "kode_trayek", "segmen",
            "harga", "total_harga_stl_discount", "total_asuransi", "discount",
            "biaya_transaksi", "metode_pembayaran",
            "tanggal_keberangkatan", "jam_keberangkatan", "counter", "nama_cabang",
            "kode_refrensi_transaksi", "ticket", "nama_promosi", "provider_promosi"];

        data = data.split("\n").filter(line => line.trim() !== "");
        if (data.length === 0) return;

        const csvHeader = data[0].split(",");
        const headerSet = new Set(header);
        const keepIndexes = csvHeader.map((col, idx) => headerSet.has(col) ? idx : -1).filter(idx => idx !== -1);

        // Table header
        tableExport += "<tr>";
        header.forEach(h => { tableExport += `<th>${h}</th>`; });
        tableExport += "</tr>";

        // Column indexes we need
        const kodeBookingIdx = csvHeader.indexOf("kode_booking");
        const discountIdx = csvHeader.indexOf("discount")
        const counterIdx = csvHeader.indexOf("counter")
        const mdrIdx = csvHeader.indexOf("biaya_transaksi")
        const afterDiscountIdx = csvHeader.indexOf("total_harga_stl_discount")
        const priceFareIdx = csvHeader.indexOf("harga")
        const ticket = csvHeader.indexOf("ticket")

        // 1) Count rows per booking
        const bookingCounts = {};
        for (let i = 1; i < data.length; i++) {
            const row = data[i].split(",");
            if (row.length < csvHeader.length) continue;
            const kb = row[kodeBookingIdx];
            if (!kb) continue;
            bookingCounts[kb] = (bookingCounts[kb] || 0) + 1;
        }

        // Track how many rows we've emitted per booking (for remainder distribution)
        const bookingSeen = {};

        // 2) Emit rows with prorated biaya_transaksi
        for (let i = 1; i < data.length; i++) {
            let row = data[i].split(",");
            if (row.length < csvHeader.length) continue;

            // added single quotes
            if (ticket !== -1 && row[ticket]) {
                row[ticket] = "'"+row[ticket]
            }

            if (counterIdx !== -1) {

                if (row[counterIdx] === "api.damri.bisku.id" || row[counterIdx] === "api.damri.ck.bisku.top" || row[counterIdx] === "null") row[counterIdx] = "DAMRI Apps"

                if (row[counterIdx] === "web.damri.bisku.id") row[counterIdx] = "Web Reservasi"

            }

            const kb = row[kodeBookingIdx];

            // Prorate discount by booking count
            if (kb) {
                const totalRows = bookingCounts[kb] || 1;
                const currentRowIndex = bookingSeen[kb] || 0;
                let totalDiscount = 0

                if (discountIdx !== -1) {
                    const original = parseInt(row[discountIdx] || "0", 10);
                    // Base share + spread remainder to the first `remainder` rows
                    const base = Math.floor(original / totalRows);
                    const remainder = original % totalRows;
                    // Give +1 to the first `remainder` rows
                    const adjustedValue = currentRowIndex < remainder ? base + 1 : base;
                    row[discountIdx] = String(adjustedValue);
                    totalDiscount = adjustedValue
                }

                if (priceFareIdx !== -1) {
                    const originalPriceFare = parseInt(row[priceFareIdx] || "0", 10);
                    const basePriceFare = Math.floor(originalPriceFare - totalDiscount)
                    row[afterDiscountIdx] = String(basePriceFare)
                }

                if (mdrIdx !== -1) {
                    const originalMdr = parseInt(row[mdrIdx] || "0", 10)
                    const baseMdr = Math.floor(originalMdr / totalRows);
                    const remainderMdr = originalMdr % totalRows;
                    // Give +1 to the first `remainder` rows
                    const adjustedMdr = currentRowIndex < remainderMdr ? baseMdr + 1 : baseMdr;
                    row[mdrIdx] = String(adjustedMdr)
                }

                bookingSeen[kb] = (bookingSeen[kb] || 0) + 1;

            }


            // Ensure last two optional columns blank if present
            if (row.length > 1) row[row.length - 2] = "";
            if (row.length > 0) row[row.length - 1] = "";

            tableExport += "<tr>";
            keepIndexes.forEach(idx => { tableExport += `<td>${row[idx] ?? ""}</td>`; });
            tableExport += "</tr>";
        }

        tableExport += "</table>";
        template.innerHTML = tableExport;

        const wb = utils.table_to_book(template.content.firstChild);
        return writeFile(wb, `${fileName.replace(".csv", "")}.xlsx`);
    }

    function _downloadCsv(data, fileName) {
        let template = document.createElement('template')
        let tableExport = "<table>"

        const header = ["kode_booking", "penyedia_pembayaran", "tanggal_pembelian", "kode_trayek", "trayek",
            "asal", "tujuan", "segmen", "harga",
            "jumlah_penumpang", "total_harga_stl_discount",
            "total_asuransi", "discount", "biaya_transaksi", "total_harga_normal",
            "metode_pembayaran", "tanggal_keberangkatan", "jam_keberangkatan", "counter", "nama_cabang", "kode_refrensi_transaksi",
            "nama_promosi", "provider_promosi"];

        data = data.split("\n").filter(line => line.trim() !== "");

        if (data.length === 0) return;

        const csvHeader = data[0].split(",");
        const headerSet = new Set(header);
        const keepIndexes = csvHeader.map((col, idx) => headerSet.has(col) ? idx : -1).filter(idx => idx !== -1);

        // Table header
        tableExport += "<tr>";
        header.forEach(h => { tableExport += `<th>${h}</th>`; });
        tableExport += "</tr>";

        // Column indexes we need
        const counterIdx = csvHeader.indexOf("counter")
        const mdrIdx = csvHeader.indexOf("biaya_transaksi")

        for (let i = 1; i < data.length; i++) {
            let row = data[i].split(",")
            if (row.length < csvHeader.length) continue;

            if (counterIdx !== -1) {

                if (row[counterIdx] === "api.damri.bisku.id" || row[counterIdx] === "api.damri.ck.bisku.top" || row[counterIdx] === "null") row[counterIdx] = "DAMRI Apps"

                if (row[counterIdx] === "web.damri.bisku.id") row[counterIdx] = "Web Reservasi"
            }

            if (mdrIdx !== -1) {
                row[mdrIdx] = parseInt(row[mdrIdx] || "0", 10)
            }

            row[row.length - 2] = ""
            row[row.length - 1] = ""

            tableExport += "<tr>";
            keepIndexes.forEach(idx => { tableExport += `<td>${row[idx] ?? ""}</td>`; });
            tableExport += "</tr>";
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
                            title={"Berdasarkan Tanggal"}
                            value={_selectedType.title}
                            suggestions={_typeTransaction}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _setSelectedType(value)
                            }}
                        />
                    </Col>

                    <Col
                        withPadding
                        marginBottom
                    >
                        <Input
                            title={"Group"}
                            value={_selectedGroup.title}
                            suggestions={_groupTransaction}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _setSelectedGroup(value)
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