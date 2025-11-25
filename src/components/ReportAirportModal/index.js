import { useState, useEffect, useContext } from 'react'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import styles from './ReportAirportModal.module.scss'
import { dateFilter, currency, paymentProvider } from '../../utils/filters'
import generateClasses from '../../utils/generateClasses'
import { TbRefresh } from 'react-icons/tb'
import { postJSON, SETTLEMENT_URL } from '../../api/utils'
import { popAlert } from '../Main'
import Input from '../Input'
import { getLocalStorage, setLocalStorage } from '../../utils/local-storage'

ReportAirportModal.defaultProps = {
    visible: false,
    closeModal: null,
    rowInfo: {},
    report: [],
    role: ""
}

export default function ReportAirportModal(props = ReportAirportModal.defaultProps) {

    const [_search, _setSearch] = useState("")
    const [_summary, _setSummary] = useState({
        totalPnp: 0,
        totalAmount: 0,
        repeatTicket: 0,
        emoney: 0,
        debit: 0,
        credit: 0,
        cash: 0,
        QRIS: 0,
        kredit: 0,
        EDCBankBNI: 0,
        EDCBankMandiri: 0,
        EDCBankBCA: 0,
        EDCBankBRI: 0,
        EDCBankBTN: 0,
        QrisTap: 0
    })
    const [_defaultReport, _setDefaultReport] = useState([])
    const [_report, _setReport] = useState([])
    const [_access, _setAccess] = useState({
        "resetPrint": props.role == "2" ? false : true
    })

    useEffect(() => {

        if (props.report?.data) {
            // Filter duplicate transactionId from props.report.data
            const uniqueData = props.report.data.filter((item, index, self) =>
                index === self.findIndex(t => t.ticket === item.ticket)
            )
            _setReport(uniqueData)

            let totalAmount, totalPnp
            let data = uniqueData
            let repeatTicket = 0

            totalAmount = 0
            totalPnp = data.length

            if (data.length > 0) {

                let payment = {
                    emoney: 0,
                    credit: 0,
                    debit: 0,
                    credit: 0,
                    QRIS: 0,
                    cash: 0,
                    kredit: 0,
                    EDCBankBNI: 0,
                    EDCBankMandiri: 0,
                    EDCBankBCA: 0,
                    EDCBankBRI: 0,
                    EDCBankBTN: 0,
                    QrisTap: 0
                }

                data.forEach(item => {
                    totalAmount += item.amountTransactionDetail
                    payment[item.pembayaran.replace(/\s/g, '')] += item.amountTransactionDetail

                    if (item.printCount > 1) {
                        repeatTicket += 1
                    }
                })

                _setSummary({
                    totalPnp,
                    totalAmount,
                    repeatTicket,
                    ...payment
                })
            }

            if (typeof window !== 'undefined') {
                // Perform localStorage action

                let storage = getLocalStorage("access_menu_damri")

                if (storage == null) {
                    window.location.href = "/sign-in"
                } else {
                    const item = JSON.parse(storage)
                    item.forEach(function (val, key) {
                        if (val.menu == "Laporan>Transaksi>Penjualan Bandara") {
                            _setAccess({
                                "resetPrint": !val.updateRole
                            })
                        }
                    })
                }
            }
        }

    }, [props.report])


    useEffect(() => {
        if (_search != "") {
            if (_defaultReport.length == 0) {
                _setDefaultReport(_report)
            }

            let suggestions = [..._report].filter(suggestion =>
                suggestion.ticket != null ? suggestion.ticket.toLowerCase().includes(_search.toLowerCase()) : ""
            )

            if (suggestions.length > 0) {
                _setReport(suggestions)
            } else {
                let dataBooking = []

                _report.forEach(function (val, key) {
                    if (val.bookingCode.toLowerCase() == _search.toLocaleLowerCase()) {
                        dataBooking.push(val)
                    }
                })

                _setReport(dataBooking)

            }

        } else {
            _setReport(_defaultReport)
        }
    }, [_search])

    async function _resetPrintCount(ticket) {

        try {
            const url = "/print-count/reset/" + ticket
            const res = await postJSON({ url: "/api/api-server-side?url=" + SETTLEMENT_URL + url }, "", "")

            if (res) {
                popAlert({ message: 'Berhasil reset print count', type: 'success' })
            }

        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Modal
            visible={props.visible}
            onBackdropClick={props.closeModal}
            centeredContent
            extraLarge
        >
            <ModalContent
                header={{
                    title: ``,
                    closeModal: props.closeModal
                }}
            >
                <Row>
                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Petugas</span>
                            <strong>{props.rowInfo.userName}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Total Penumpang</span>
                            <strong>{currency(_summary.totalPnp)}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Cetak Berulang</span>
                            <strong>{_summary.repeatTicket} Tiket</strong>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Debit</span>
                            <strong>{currency(_summary.debit, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Kredit</span>
                            <strong>{currency((_summary.credit + _summary.kredit), 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>QRIS</span>
                            <strong>{currency(_summary.QRIS, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Emoney</span>
                            <strong>{currency(_summary.emoney, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Tunai</span>
                            <strong>{currency(_summary.cash, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>QRIS Tap</span>
                            <strong>{currency(_summary.QrisTap, 'Rp')}</strong>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BNI</span>
                            <strong>{currency(_summary.EDCBankBNI, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BRI</span>
                            <strong>{currency((_summary.EDCBankBRI), 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank Mandiri</span>
                            <strong>{currency(_summary.EDCBankMandiri, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BCA</span>
                            <strong>{currency(_summary.EDCBankBCA, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BTN</span>
                            <strong>{currency(_summary.EDCBankBTN, 'Rp')}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Total Penjualan</span>
                            <strong>{currency(_summary.totalAmount, 'Rp')}</strong>
                        </div>
                    </Col>
                </Row>

                <div className={styles.table_container}>
                    <Table
                        fileName={"Penjualan-bandara-" + props.rowInfo.userName + "-tgl-" + props.rowInfo.dateTransaction}
                        headerContent={(
                            <Row
                                verticalEnd
                            >
                                <Col
                                    column={2}
                                    withPadding
                                    mobileFullWidth
                                >
                                    <Input
                                        title={`Cari Tiket`}
                                        value={_search}
                                        onChange={ticket => {
                                            _setSearch(ticket)
                                        }}
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={[
                            {
                                field: 'dateTransaction',
                                title: 'Tanggal',
                                customCell: (value) => dateFilter.convertISO(new Date(value), "date")
                            },
                            {
                                field: 'dateTransaction',
                                title: 'Waktu',
                                customCell: (value) => dateFilter.convertISO(new Date(value), "time")
                            },
                            {
                                field: 'originName',
                                title: 'Asal',
                                textAlign: 'left',
                                customCell: (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field: 'destinationName',
                                title: 'Tujuan',
                                textAlign: 'left'
                            },
                            {
                                field: 'bookingCode',
                                title: 'Kode Booking',
                                textAlign: 'left'
                            },
                            {
                                field: 'ticket',
                                title: 'Tiket',
                                textAlign: 'left',
                                minWidth: '120px',
                                headCol: {
                                    backgroundColor: "#fff",
                                    position: "sticky",
                                    left: "0px",
                                    zIndex: "100",
                                    minWidth: "120px",
                                },
                                style: {
                                    backgroundColor: "#fff",
                                    position: "sticky",
                                    left: "0px",
                                    zIndex: "100",
                                    minWidth: "120px",
                                    maxWidth: "120px",
                                },
                            },
                            {
                                field: 'phoneNumber',
                                title: 'No Telpon Pembeli',
                                textAlign: 'left'
                            },
                            {
                                field: 'name',
                                title: 'Nama Pembeli',
                                minWidth: '90px',
                                textAlign: 'left'
                            },
                            {   //beforeChange baseFare
                                field: 'amountTransactionDetail',
                                title: 'Harga Tiket (Rp)',
                                customCell: (value) => currency(value),
                                textAlign: 'right',
                                minWidth: '90px',
                            },
                            {
                                field: 'pembayaran',
                                title: 'Metode Bayar',
                                minWidth: '90px',
                            },
                            {
                                field: 'paymentProviderId',
                                title: 'Penyedia Pembayaran',
                                minWidth: '90px',
                                customCell: (value) => paymentProvider(value)
                            },
                            {
                                field: 'pembayaranDetail',
                                title: 'Bank',
                                textAlign: 'left',
                                minWidth: '70px',
                                customCell: (value) => value == null ? '-' : value,
                            },
                            {
                                field: 'departureDate',
                                title: 'Tanggal Keberangkatan',
                                customCell: (value) => {
                                    if (value != null) {
                                        const date = new Date(value)
                                        return dateFilter.getMonthDate(date)
                                    } else {
                                        return ''
                                    }
                                }
                            },
                            // {
                            //     field : 'scanAt',
                            //     title : 'Tanggal Validasi',
                            //     minWidth: '120px',
                            //     customCell : (value) => {
                            //         if(value != null){
                            //             const date = new Date(value)
                            //             return dateFilter.getMonthDate(date)
                            //         }else{
                            //             return ''
                            //         }
                            //     }
                            // },
                            {
                                field: 'printCount',
                                title: 'Jumlah Cetak',
                                minWidth: '70px',
                                customCell: (value, row) => {
                                    return (
                                        <Col
                                            alignCenter
                                            style={{
                                                cursor: "pointer"
                                            }}
                                        >
                                            <span className={styles.count_circle}>{parseInt(value) > 2 ? 2 : value}</span>

                                            {
                                                row.reprintAt && (
                                                    <span>{dateFilter.convertISO(new Date(row.reprintAt), "date") + dateFilter.convertISO(new Date(row.reprintAt), "time")}</span>
                                                )
                                            }
                                        </Col>
                                    )
                                }
                            },
                            {
                                title: 'Reset Print',
                                field: 'ticket',
                                minWidth: '60px',
                                hide: _access.resetPrint,
                                customCell: (value, row) => {

                                    return (
                                        <div
                                            title={"Reset Print Count"}
                                            className={generateClasses([
                                                styles.button_action,
                                                styles.text_warning
                                            ])}
                                            onClick={() => {
                                                _resetPrintCount(row.ticket)
                                            }}
                                        >
                                            <TbRefresh />
                                        </div>
                                    )
                                }
                            }
                        ]}
                        headExport={[
                            {
                                title: "Tanggal",
                                value: "dateTransaction",
                                customCell: (value) => dateFilter.convertISO(new Date(value), "date")
                            },
                            {
                                title: "Waktu",
                                value: "dateTransaction",
                                customCell: (value) => dateFilter.convertISO(new Date(value), "time")
                            },
                            {
                                title: "Asal",
                                value: "originName",
                            },
                            {
                                title: "Tujuan",
                                value: "destinationName",
                            },
                            {
                                title: "Kode Booking",
                                value: "bookingCode",
                            },
                            {
                                title: "Tiket",
                                value: "ticket",
                            },
                            {
                                title: "Harga Tiket",
                                value: "baseFare",
                            },
                            {
                                title: "Metode Pembayaran",
                                value: "pembayaran",
                            },
                            {
                                value: 'paymentProviderId',
                                title: 'Penyedia Pembayaran',
                                customCell: (value) => paymentProvider(value)
                            },
                            {
                                value: 'pembayaranDetail',
                                title: 'Bank',
                                customCell: (value) => value == null ? '-' : value,
                            },
                            {
                                value: 'departureDate',
                                title: 'Tanggal Keberangkatan',
                                customCell: (value) => {
                                    if (value != null) {
                                        const date = new Date(value)
                                        return dateFilter.getMonthDate(date)
                                    } else {
                                        return ''
                                    }
                                }
                            },
                            {
                                title: "Jumlah Cetak",
                                value: "printCount",
                                customCell: (value) => {
                                    return parseInt(value) > 2 ? 2 : value
                                }
                            },
                        ]}
                        insertExport={[
                            {
                                title: "Petugas",
                                value: props.rowInfo.userName
                            },
                            {
                                title: "Debit",
                                value: _summary.debit
                            },
                            {
                                title: "Kredit",
                                value: _summary.credit + _summary.kredit
                            },
                            {
                                title: "QRIS",
                                value: _summary.QRIS
                            },
                            {
                                title: "Emoney",
                                value: _summary.emoney
                            },
                            {
                                title: "Tunai",
                                value: _summary.cash
                            },
                            {
                                title: "Total Penjualan",
                                value: _summary.totalAmount
                            },
                            {
                                title: "Total Penumpang",
                                value: _summary.totalPnp
                            },
                            {
                                title: "Cetak Berulang",
                                value: _summary.repeatTicket
                            }
                        ]}
                        records={_report}
                    />
                </div>

                {
                    !_report && (
                        <div
                            style={{
                                "text-align": "center"
                            }}
                        >
                            <span>Memuat data..</span>
                        </div>
                    )
                }


            </ModalContent>
        </Modal>
    )

}