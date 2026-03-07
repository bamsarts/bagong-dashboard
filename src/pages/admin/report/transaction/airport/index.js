import { useState } from 'react'

import { get } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import { Col, Row } from '../../../../../components/Layout'
import { currency, dateFilter } from '../../../../../utils/filters'
import styles from './Airport.module.scss'
import Datepicker from '../../../../../components/Datepicker'
import { BsChevronRight } from 'react-icons/bs'
import ReportAirportModal from '../../../../../components/ReportAirportModal'

export default function Sales(props) {
    const [_date, _setDate] = useState({
        start: dateFilter.basicDate(new Date()).normal,
        end: dateFilter.basicDate(new Date()).normal,
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_summary, _setSummary] = useState({
        total_buses: 0,
        total_penugasan: 0,
        total_transactions: 0,
        total_passengers: 0,
        total_amount: 0,
    })
    const [_openModalDetail, _setOpenModalDetail] = useState(false)
    const [_detailData, _setDetailData] = useState({})
    const [_detailTransactions, _setDetailTransactions] = useState([])
    const [_isLoadingDetail, _setIsLoadingDetail] = useState(false)

    async function _getSalesReportDetail(busData) {
        _setIsLoadingDetail(true)
        _setDetailData(busData)

        const params = new URLSearchParams({
            companyId: props.authData.companyId,
            busId: busData.bus_id,
            startDate: _date.start,
            endDate: _date.end,
            dateBy: 'transaction',
            paymentStatus: 'PAID',
            startFrom: 0,
            length: 370,
            sortBy: 'created_at',
            sortMode: 'desc'
        })

        try {
            const res = await get(`/data/laporan/monitoring/transactions/by-bus/detail?${params}`, props.authData.token)

            _setDetailTransactions(res.data || [])
            _setIsLoadingDetail(false)

            if (!res.data || res.data.length === 0) {
                popAlert({ message: 'Tidak ada detail transaksi', type: 'info' })
            }
        } catch (e) {
            popAlert({ message: e.message })
            _setIsLoadingDetail(false)
        }
    }

    async function _getSalesReport() {
        _setIsProcessing(true)

        const params = new URLSearchParams({
            companyId: props.authData.companyId,
            startDate: _date.start,
            endDate: _date.end,
            dateBy: 'transaction',
            paymentStatus: 'PAID',
            startFrom: 0,
            length: 1000,
            sortBy: 'bus_name',
            sortMode: 'desc'
        })

        try {
            const res = await get(`/data/laporan/monitoring/transactions/by-bus?${params}`, props.authData.token)

            _setSalesReport(res.data || [])
            _setSummary(res.summary || {
                total_buses: 0,
                total_penugasan: 0,
                total_transactions: 0,
                total_passengers: 0,
                total_amount: 0,
            })
            _setIsProcessing(false)

            if (!res.data || res.data.length === 0) {
                popAlert({ message: 'Tidak ada penjualan', type: 'info' })
            }
        } catch (e) {
            popAlert({ message: e.message })
            _setIsProcessing(false)
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
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Datepicker
                                id={"datePickerStart"}
                                title={"Tanggal Awal"}
                                value={_date.start}
                                onChange={value => {
                                    _setDate(oldData => {
                                        return {
                                            ...oldData,
                                            start: dateFilter.basicDate(new Date(value)).normal
                                        }
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Datepicker
                                id={"datePickerEnd"}
                                title={"Tanggal Akhir"}
                                value={_date.end}
                                onChange={value => {
                                    _setDate(oldData => {
                                        return {
                                            ...oldData,
                                            end: dateFilter.basicDate(new Date(value)).normal
                                        }
                                    })
                                }}
                            />
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

                <Card>
                    <Row>

                        <Col
                            column={1}
                            withPadding
                        >
                            <div
                                className={styles.total_trx}
                            >
                                <span>Total Bus</span>
                                <strong>{_summary.total_buses}</strong>
                            </div>
                        </Col>

                        <Col
                            column={1}
                            withPadding
                        >
                            <div
                                className={styles.total_trx}
                            >
                                <span>Total Penugasan</span>
                                <strong>{_summary.total_penugasan}</strong>
                            </div>
                        </Col>

                        <Col
                            column={1}
                            withPadding
                        >
                            <div
                                className={styles.total_trx}
                            >
                                <span>Total Transaksi</span>
                                <strong>{_summary.total_transactions}</strong>
                            </div>
                        </Col>

                        <Col
                            column={1}
                            withPadding
                        >
                            <div
                                className={styles.total_trx}
                            >
                                <span>Total Penumpang</span>
                                <strong>{currency(_summary.total_passengers)}</strong>
                            </div>
                        </Col>

                        <Col
                            column={1}
                            withPadding
                        >
                            <div
                                className={styles.total_trx}
                            >
                                <span>Total Penjualan</span>
                                <strong>{currency(_summary.total_amount)}</strong>
                            </div>
                        </Col>

                        <Col
                            column={1}
                            mobileFullWidth
                            style={{ "display": "grid" }}
                        >
                            <div style={{ "margin": "auto" }}>
                                <Button
                                    title={'Export Xlsx'}
                                    styles={Button.success}
                                    headExport={[
                                        {
                                            title: 'Bus Name',
                                            value: 'bus_name'
                                        },
                                        {
                                            title: 'Bus Code',
                                            value: 'bus_code',
                                        },
                                        {
                                            title: 'Tanggal',
                                            value: 'date',
                                        },
                                        {
                                            title: 'Ritase',
                                            value: 'ritase'
                                        },
                                        {
                                            title: 'Total Transaksi',
                                            value: 'total_transactions'
                                        },
                                        {
                                            title: 'Total Penumpang',
                                            value: 'total_passengers'
                                        },
                                        {
                                            title: 'Total Penjualan',
                                            value: 'amount',
                                        },
                                    ]}
                                    dataExport={_salesReport}
                                    titleExport={"Laporan_Bus_" + _date.start + "_sd_" + _date.end + ".xlsx"}
                                />
                            </div>

                        </Col>
                    </Row>
                </Card>

                <div
                    className={styles.item_container}
                >
                    {
                        _salesReport.map((val, key) => {
                            return (
                                <div
                                    key={key}
                                    className={styles.column}
                                >
                                    <Row
                                        spaceBetween
                                    >
                                        <small>{dateFilter.getMonthDate(new Date(val.date))}</small>
                                        <small>Ritase {val.ritase}</small>
                                    </Row>



                                    <div
                                        className={styles.title}
                                        onClick={() => {
                                            _setOpenModalDetail(true)
                                            _getSalesReportDetail(val)
                                        }}
                                    >
                                        <strong>{val.bus_name}</strong>
                                        <div>
                                            <BsChevronRight />
                                        </div>
                                    </div>

                                    <Row>
                                        <Col
                                            column={3}
                                            style={{
                                                "display": "grid"
                                            }}
                                        >
                                            <small>Penumpang</small>
                                            <span>{val.total_passengers}</span>
                                        </Col>

                                        <Col
                                            column={3}
                                            style={{
                                                "display": "grid"
                                            }}
                                        >
                                            <small>Penjualan</small>
                                            <span>{currency(val.amount)}</span>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        })
                    }

                </div>

                <ReportAirportModal
                    visible={_openModalDetail}
                    closeModal={() => _setOpenModalDetail(false)}
                    busInfo={_detailData}
                    transactions={_detailTransactions}
                    isLoading={_isLoadingDetail}
                />


            </AdminLayout>
        </Main>
    )

}