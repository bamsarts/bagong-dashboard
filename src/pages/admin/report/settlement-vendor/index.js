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
import generateClasses from '../../../../utils/generateClasses'
import InsuranceModal from '../../../../components/InsuranceModal'
import { AiFillEye } from 'react-icons/ai'
import { writeXLSX, utils, writeFile } from 'xlsx'

export default function SettlementVendor(props) {

    const webApp = ["web.damri.bisku.id"]
    const mobileApp = ["uat.damri.bisku.id", "8080.ilham.dev", "api.damri.bisku.id", "api.damri.ck.bisku.top"]

    const __COLUMNS = [
        {
            title: 'Channel',
            field: 'counter',
            customCell: (value, row) => {


                // Validate if data comes from webApp or mobileApp
                if (webApp.includes(value)) {
                    return "Web Reservasi"
                } else if (mobileApp.includes(value)) {
                    return "DAMRI Apps"
                } else {
                    return value // Return original value if not found in either array
                }
            }
        },
        {
            title: 'Penyedia',
            field: 'provider_name',
        },
        {
            title: 'Pembayaran',
            field: 'metode_pembayaran',
            textAlign: "left"
        },
        {
            title: 'Tanggal Pembelian',
            field: 'tanggal',
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title: 'Nominal',
            field: 'total_transaksi',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'MDR',
            field: 'biaya_mdr',
            textAlign: "right"
        },
        {
            title: 'Nett Nominal',
            field: 'total_setelah_mdr',
            textAlign: "right",
            customCell: (value) => currency(value)
        }
    ]

    const [_date, _setDate] = useState({
        start: dateFilter.basicDate(new Date()).normal,
        end: dateFilter.basicDate(new Date()).normal
    })
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_report, _setReport] = useState([])

    async function _getReport(type = "LIST") {
        _setIsProcessing(true)
        try {
            const param = {
                startDate: _date.start,
                endDate: _date.end,
                typeResponse: type
            }
            const res = await postJSON('/laporan/dashboard/data/settlement/list', param, props.authData.token, type == "CSV" ? true : false)

            if (type == "CSV") {
                _downloadCsv(res, `Settlement-penyedia-${_date.start}-s.d-${_date.end}.csv`);
            } else {
                _setReport(res.data)
            }

            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message: e.message })
        }
    }

    function _downloadCsv(data, fileName) {
        let template = document.createElement('template')
        let tableExport = "<table>"

        data = data.split("\n")
        let headerRow = null
        let counterColumnIndex = -1

        data.forEach(function (val, key) {
            let row = val.split(",")

            // Find the counter column index from header row
            if (key === 0) {
                headerRow = row
                counterColumnIndex = row.findIndex(header => header.toLowerCase().includes('counter') || header.toLowerCase().includes('channel'))
            }

            tableExport += "<tr>"

            row.forEach(function (i, j) {
                let cellValue = i

                // Transform counter column values if this is the counter column and not the header row
                if (j === counterColumnIndex && key > 0) {
                    if (webApp.includes(cellValue)) {
                        cellValue = "Web Reservasi"
                    } else if (mobileApp.includes(cellValue)) {
                        cellValue = "DAMRI Apps"
                    }
                }

                tableExport += "<td>" + cellValue + "</td>"
            })

            tableExport += "</tr>"

        })

        tableExport += "</table>"
        template.innerHTML = tableExport

        const wb = utils.table_to_book(template.content.firstChild)
        return writeFile(wb, `${fileName.replace(".csv", "")}.xlsx`)
    }

    useEffect(() => {
        _getReport("LIST")
    }, [])

    return (
        <Main>

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
                                title={'Cari Settlement'}
                                onProcess={_isProcessing}
                                onClick={() => {
                                    _getReport("LIST")
                                }}
                            />
                        </Col>

                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Button
                                styles={Button.success}
                                title={'Export Xls'}
                                onProcess={_isProcessing}
                                onClick={() => {
                                    _getReport("CSV")
                                }}
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
                                exportToXls={false}
                                columns={__COLUMNS}
                                records={_report}
                                noPadding
                            />
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}