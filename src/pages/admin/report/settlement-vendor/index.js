import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import Table from '../../../../components/Table'
import Datepicker from '../../../../components/Datepicker'
import { dateFilter, currency } from '../../../../utils/filters'
import { utils, writeFile } from 'xlsx'

export default function SettlementVendor(props) {

    const __COLUMNS = [
        {
            title: 'Penyedia Pembayaran',
            field: 'payment_provider_name',
        },
        {
            title: 'Pembayaran',
            field: 'payment_provider_detail_name',
            customCell: (value, row) => {
                return value == "emoney" ? "Emoney" : value.toUpperCase() 
            }
        },
        {
            title: 'Jumlah Transaksi',
            field: 'transactionCount',
            textAlign: "center"
        },
        {
            title: 'Total Penumpang',
            field: 'totalPassengers',
            textAlign: "center"
        },
        {
            title: 'Nominal',
            field: 'totalAmount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'MDR',
            field: 'totalMdr',
            textAlign: "right",
            customCell: (value) => currency(value)
        },
        {
            title: 'Nett Nominal',
            field: 'netAmount',
            textAlign: "right",
            customCell: (value) => currency(value)
        }
    ]

    const [_date, _setDate] = useState({
        start: dateFilter.basicDate(new Date()).normal,
        end: dateFilter.basicDate(new Date()).normal
    })
    const [_paymentProviderId, _setPaymentProviderId] = useState([2, 3])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_report, _setReport] = useState([])
    const [_reportXlsx, _setReportXlsx] = useState([])

    async function _getReport(id) {
        _setIsProcessing(true)
        try {
            const param = {
                companyId: props.authData.companyId,
                startDate: _date.start,
                endDate: _date.end,
                paymentProviderId: id
            }

            const res = await postJSON('/laporan/dashboard/data/settlement/list', param, props.authData.token)

            updateReport(res.summary)
            _setReportXlsx(prev => [...prev, ...(res.transactions || [])])

            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message: e.message })
        }
    }
    
    function _downloadTransactionsCsv(transactions, fileName) {
        // Transform transactions data into worksheet format
        const worksheetData = transactions.map(transaction => ({
            'Penyedia Pembayaran': transaction.payment_provider_name,
            'Pembayaran': transaction.payment_provider_detail_name == "emoney" ? "Emoney" : value.toUpperCase(),
            'Master Trayek': transaction.traject_bank_name_alias,
            'Tanggal Transaksi': dateFilter.basicDate(new Date(transaction.created_at)).normalId,
            'Harga Tiket': parseFloat(transaction.amount),
            'Penumpang': transaction.quantity,
            'Diskon': transaction.discount ? parseFloat(transaction.discount) : 0,
            'Total Harga Tiket Setelah Diskon': parseFloat(transaction.total_amount) - parseFloat(transaction.discount ? transaction.discount : 0),
            'MDR': transaction.mdr,
            'Total Setelah Biaya MDR': (parseFloat(transaction.total_amount) - transaction.mdr)
        }));

        // Create workbook and worksheet
        const wb = utils.book_new();
        const ws = utils.json_to_sheet(worksheetData);

        // Add worksheet to workbook
        utils.book_append_sheet(wb, ws, 'Settlement Transactions');

        // Write file
        return writeFile(wb, fileName);
    }

    function updateReport(data = []) {
        _setReport(oldQuery => {
            return [
                ...oldQuery,
                ...data
            ]
        })
    }


    useEffect(() => {
        
        

        _setReport([]) // Clear previous data on mount
        _setReportXlsx([])
        _paymentProviderId.forEach(id => {
            _getReport(id)
        });

    }, [_date.start, _date.end]) // Re-fetch when dates change

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
                                    _setReport([]) // Clear previous data
                                    _setReportXlsx([])
                                    _paymentProviderId.forEach(id => {
                                        _getReport(id)
                                    });
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
                                    _downloadTransactionsCsv(_reportXlsx, `Settlement-penyedia-${_date.start}-s.d-${_date.end}.xlsx`)
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