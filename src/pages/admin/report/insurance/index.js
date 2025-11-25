import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import Table from '../../../../components/Table'
import Datepicker from '../../../../components/Datepicker'
import Link from 'next/link'
import { dateFilter, currency } from '../../../../utils/filters'
import { FaRoute, FaUsers } from 'react-icons/fa'
import styles from './Insurance.module.scss'
import generateClasses from '../../../../utils/generateClasses'
import InsuranceModal from '../../../../components/InsuranceModal'
import { AiFillEye } from 'react-icons/ai'

export default function ReportInsurance(props) {

    const __TABLE_HEADERS = [
        [
            { title : 'Tanggal', rowSpan : 2 },
            { title : 'AKAP', colSpan : 2 },
            { title : 'Pemadumoda', colSpan : 2 },
            { title : 'Total Pnp', rowSpan : 2 },
            { title : 'Total Asuransi', rowSpan : 2 },
        ],
        [
            { title : 'Pnp'},
            { title : 'Asuransi' },
            { title : 'Pnp'},
            { title : 'Asuransi' },
        ]
    ]

    const __COLUMNS = [
        {
            title : 'Tanggal',
            field: 'date',
            customCell : (value, record, key) => {
                return dateFilter.getFullDate(new Date(value))
            }
        },
        {
            title : 'Penumpang AKAP',
            field : 'totalPnpIntercity'
        },
        {
            title : 'Nominal AKAP (Rp)',
            field : 'totalPriceIntercity',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title : 'Penumpang Pemadumoda',
            field : 'totalPnpCommuter',
        },
        {
            title : 'Nominal Pemadumoda (Rp)',
            field : 'totalPriceCommuter',
            textAlign: "right",
            customCell : (value) => currency(value)
        },
        {
            field: 'totalPnpCommuter',
            customCell: (value, row) => {
                return currency(value+row.totalPnpIntercity)
            }
        },
        {
            field: 'totalPriceCommuter',
            textAlign: 'right',
            customCell: (value, row) => {
                return currency(value+row.totalPriceIntercity)
            }
        },
        {
            title: 'Aksi',
            field: 'id',
            customCell: (value, row) => {
                return (
                    <div
                    title={"Lihat Detail"}
                    className={generateClasses([
                        styles.button_action,
                        styles.text_red
                    ])}
                    onClick={() => {
                        _setDetailReport(row)
                    }}
                    >
                        <AiFillEye/>
                    </div>
                )
            }
        }
    ]

    const [_date, _setDate] = useState({
        start: dateFilter.basicDate(new Date()).normal,
        end: dateFilter.basicDate(new Date()).normal
    })
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_report, _setReport] = useState([])
    const [_detailReport, _setDetailReport] = useState({})

    async function _getReport() {
        _setIsProcessing(true)
        try {
            const param = {
                companyId: props.authData.companyId,
                startDate: _date.start,
                endDate: _date.end,
                startFrom: 0,
                length: 210
            }
            const res = await postJSON('/laporan/asuransi/list', param, props.authData.token)
            _setReport(res.data)
            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada transaksi asuransi', type : 'info' })
            }
            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    useEffect(() => {
        _getReport()
    }, [])

    return (
        <Main>

            <InsuranceModal
            visible={_detailReport?.date}
            data={_detailReport}
            closeModal={() => {
                _setDetailReport({})
            }}
            />

            <AdminLayout>
                <Card>
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            id={"startDate"}
                            title={"Tanggal Awal"}
                            value={_date.start}
                            onChange={date => _setDate({
                                start: dateFilter.basicDate(new Date(date)).normal,
                                end: _date.end
                            })}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            id={"endDate"}
                            title={"Tanggal Akhir"}
                            value={_date.end}
                            onChange={date => _setDate({
                                start: _date.start,
                                end: dateFilter.basicDate(new Date(date)).normal
                            })}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            title={'Cari Transaksi'}
                            onProcess={_isProcessing}
                            onClick={_getReport}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    _report && (
                        <Card
                        noPadding
                        >
                            <Table
                             fileName={"Transaksi-Asuransi-"+dateFilter.basicDate(new Date(_date.start)).id+"-s.d-"+dateFilter.basicDate(new Date(_date.end)).id}
                             headExport={[
                                {
                                    title: 'Tanggal',
                                    value: 'date'
                                },
                                {
                                    title: 'Pnp AKAP',
                                    value: "totalPnpIntercity"
                                },
                                {
                                    title: 'Nominal AKAP',
                                    value: "totalPriceIntercity"
                                },
                                {
                                    title: 'Pnp Pemadu Moda',
                                    value: "totalPnpCommuter"
                                },
                                {
                                    title: 'Nominal Pemadu Moda',
                                    value: "totalPriceCommuter"
                                },
                                {
                                    title: 'total Pnp',
                                    value: "totalPnpIntercity",
                                    customCell: (value, row) => {
                                        return value + row.totalPnpCommuter;
                                    }
                                },
                                {
                                    title: 'total Nominal',
                                    value: "totalPriceCommuter",
                                    customCell: (value, row) => {
                                        return value + row.totalPriceIntercity;
                                    }
                                }
                            ]}
                            columns={__COLUMNS}
                            records={_report}
                            noPadding
                            tableHeaders={__TABLE_HEADERS}
                            />
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}