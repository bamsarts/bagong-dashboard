import { useState, useEffect } from 'react'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import styles from './ReportAirportModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'
import Input from '../Input'

ReportAirportModal.defaultProps = {
    visible: false,
    closeModal: null,
    busInfo: {},
    transactions: [],
    isLoading: false
}

export default function ReportAirportModal(props = ReportAirportModal.defaultProps) {

    const [_search, _setSearch] = useState("")
    const [_summary, _setSummary] = useState({
        totalTransactions: 0,
        totalPassengers: 0,
        totalAmount: 0,
        cash: 0,
        other: 0
    })
    const [_defaultTransactions, _setDefaultTransactions] = useState([])
    const [_filteredTransactions, _setFilteredTransactions] = useState([])

    useEffect(() => {
        if (props.transactions && props.transactions.length > 0) {
            
            let data = []
            console.log(props.busInfo)

            // Calculate summary
            let totalAmount = 0
            let cash = 0
            let other = 0

            props.transactions.forEach(transaction => {
                let date = transaction.tanggal_transaksi.split("T")

                if((parseInt(transaction.ritase) == parseInt(props.busInfo.ritase)) && date[0] == props.busInfo.date){
                    const amount = parseInt(transaction.harga_akhir) || 0
                    totalAmount += amount
                    
                    if (transaction.metode_pembayaran === 'cash') {
                        cash += amount
                    } else {
                        other += amount
                    }

                    data.push(transaction)
                }
                
            })

            _setDefaultTransactions(data)
            _setFilteredTransactions(data)

            _setSummary({
                totalTransactions: data.length,
                totalPassengers: props.transactions.length, // Each transaction represents one passenger
                totalAmount,
                cash,
                other
            })
        } else {
            _setDefaultTransactions([])
            _setFilteredTransactions([])
            _setSummary({
                totalTransactions: 0,
                totalPassengers: 0,
                totalAmount: 0,
                cash: 0,
                other: 0
            })
        }
    }, [props.transactions])

    useEffect(() => {
        if (_search !== "") {
            if (_defaultTransactions.length === 0) {
                _setDefaultTransactions(_filteredTransactions)
            }

            const filtered = _defaultTransactions.filter(transaction =>
                transaction.nomor_tiket?.toLowerCase().includes(_search.toLowerCase()) ||
                transaction.nama_penumpang?.toLowerCase().includes(_search.toLowerCase()) ||
                transaction.transaction_id?.toLowerCase().includes(_search.toLowerCase())
            )

            _setFilteredTransactions(filtered)
        } else {
            _setFilteredTransactions(_defaultTransactions)
        }
    }, [_search, _defaultTransactions])

    return (
        <Modal
            visible={props.visible}
            onBackdropClick={props.closeModal}
            centeredContent
            extraLarge
        >
            <ModalContent
                header={{
                    title: `Detail Transaksi - ${props.busInfo.bus_name || 'Bus'}`,
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
                            <span>Bus</span>
                            <strong>{props.busInfo.bus_name || '-'}</strong>
                        </div>
                    </Col>

                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Trayek</span>
                            <strong>{_filteredTransactions[0]?.trayek || '-'}</strong>
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
                            <span>Non-Tunai</span>
                            <strong>{currency(_summary.other, 'Rp')}</strong>
                        </div>
                    </Col>

                    
                    <Col
                        column={1}
                        withPadding
                        className={styles.detail_modal}
                    >
                        <div>
                            <span>Total Transaksi</span>
                            <strong>{_summary.totalTransactions}</strong>
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
                        fileName={`Detail-Transaksi-${props.busInfo.bus_name}-${dateFilter.basicDate(new Date()).normal}`}
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
                                        title={`Cari Tiket/Penumpang`}
                                        value={_search}
                                        onChange={value => {
                                            _setSearch(value)
                                        }}
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={[
                            {
                                field: 'tanggal_transaksi',
                                title: 'Tanggal Transaksi',
                                customCell: (value, row) => {
                                    return dateFilter.convertISO(new Date(value), "fulldate", true)
                                }
                            },
                            {
                                field: 'nomor_tiket',
                                title: 'Nomor Tiket',
                                textAlign: 'left',
                                minWidth: '150px',
                                headCol: {
                                    backgroundColor: "#fff",
                                    position: "sticky",
                                    left: "0px",
                                    zIndex: "100",
                                    minWidth: "150px",
                                },
                                style: {
                                    backgroundColor: "#fff",
                                    position: "sticky",
                                    left: "0px",
                                    zIndex: "100",
                                    minWidth: "150px",
                                    maxWidth: "150px",
                                },
                            },
                            {
                                field: 'nama_penumpang',
                                title: 'Nama Penumpang',
                                textAlign: 'left',
                                minWidth: '120px'
                            },
                            {
                                field: 'ritase',
                                title: 'Ritase',
                                textAlign: 'left',
                                customCell: (value) => value === '0' ? '-' : value
                            },
                            {
                                field: 'asal',
                                title: 'Asal',
                                textAlign: 'left'
                            },
                            {
                                field: 'tujuan',
                                title: 'Tujuan',
                                textAlign: 'left'
                            },
                            {
                                field: 'tanggal_keberangkatan',
                                title: 'Tanggal Keberangkatan',
                                customCell: (value) => dateFilter.getMonthDate(new Date(value))
                            },
                            {
                                field: 'jam_keberangkatan',
                                title: 'Jam Keberangkatan',
                                textAlign: 'center'
                            },
                            {
                                field: 'harga',
                                title: 'Harga',
                                customCell: (value) => currency(value),
                                textAlign: 'right'
                            },
                            {
                                field: 'metode_pembayaran',
                                title: 'Metode Pembayaran',
                                textAlign: 'center'
                            },
                            {
                                field: 'status_pembayaran',
                                title: 'Status Pembayaran',
                                textAlign: 'center',
                                customCell: (value) => (
                                    <span className={value === 'PAID' ? styles.status_paid : styles.status_unpaid}>
                                        {value}
                                    </span>
                                )
                            },
                            {
                                field: 'waktu_boarding',
                                title: 'Waktu Bording',
                                textAlign: 'center'
                            }
                        ]}
                        headExport={[
                            {
                                title: "Tanggal Transaksi",
                                value: "tanggal_transaksi",
                                customCell: (value) => dateFilter.convertISO(new Date(value), "fulldate", true)
                            },
                            {
                                title: "Nomor Tiket",
                                value: "nomor_tiket"
                            },
                            {
                                title: "Nama Penumpang",
                                value: "nama_penumpang"
                            },
                            {
                                title: "No. Telepon",
                                value: "nomor_telepon"
                            },
                            {
                                title: "Asal",
                                value: "asal"
                            },
                            {
                                title: "Tujuan",
                                value: "tujuan"
                            },
                            {
                                title: "Tanggal Keberangkatan",
                                value: "tanggal_keberangkatan"
                            },
                            {
                                title: "Jam Keberangkatan",
                                value: "jam_keberangkatan"
                            },
                            {
                                title: "Harga",
                                value: "harga"
                            },
                            {
                                title: "Diskon",
                                value: "diskon"
                            },
                            {
                                title: "Harga Akhir",
                                value: "harga_akhir"
                            },
                            {
                                title: "Metode Pembayaran",
                                value: "metode_pembayaran"
                            },
                            {
                                title: "Status Pembayaran",
                                value: "status_pembayaran"
                            },
                            {
                                title: "Status Boarding",
                                value: "status_boarding"
                            }
                        ]}
                        insertExport={[
                            {
                                title: "Bus",
                                value: props.busInfo.bus_name
                            },
                            {
                                title: "Total Transaksi",
                                value: _summary.totalTransactions
                            },
                            {
                                title: "Total Penjualan",
                                value: _summary.totalAmount
                            },
                            {
                                title: "Tunai",
                                value: _summary.cash
                            },
                            {
                                title: "Non-Tunai",
                                value: _summary.other
                            }
                        ]}
                        records={_filteredTransactions}
                    />
                </div>

                {
                    props.isLoading && (
                        <div
                            style={{
                                "textAlign": "center",
                                "padding": "20px"
                            }}
                        >
                            <span>Memuat data transaksi...</span>
                        </div>
                    )
                }

                {
                    !props.isLoading && _filteredTransactions.length === 0 && (
                        <div
                            style={{
                                "textAlign": "center",
                                "padding": "20px"
                            }}
                        >
                            <span>Tidak ada data transaksi</span>
                        </div>
                    )
                }

            </ModalContent>
        </Modal>
    )

}