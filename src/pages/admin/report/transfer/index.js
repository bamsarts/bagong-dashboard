import { useEffect, useState } from 'react'

import { get } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import { Col, Row } from '../../../../components/Layout'
import Table from '../../../../components/Table'

import { currency, dateFilter } from '../../../../utils/filters'

export default function Transfer(props) {

    const __COLUMNS = [
        {
            title : 'No.',
            field : 'key'
        },
        {
            title : 'Tanggal Transaksi',
            field : 'date'
        },
        {
            title : 'SO Number',
            field : 'soNumber'
        },
        {
            title : 'Kode Produk',
            field : 'code'
        },
        {
            title : 'Jumlah Penumpang',
            field : 'jmlPnp'
        },
        {
            title : 'Emoney',
            field : 'emoney'
        },
        {
            title : 'QRIS',
            field : 'qris'
        },
        {
            title : 'Jumlah Transfer',
            field : 'transferAmount'
        },
        {
            title : 'Tanggal Transfer',
            field : 'qris'
        },
    ]

    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal,
        end : dateFilter.basicDate(new Date()).normal,
    })
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_transferReport, _setTransferReport] = useState(null)
    const [_transferReportSummary, _setTransferReportSummary] = useState(null)

    useEffect(() => {
        if (_transferReport) {
            let summary = {
                jmlPnp : 0,
                emoney : 0,
                qris : 0,
                transferAmount : 0
            }
            _transferReport.forEach(item => {
                item.products.forEach(item2 => {
                    summary.jmlPnp = summary.jmlPnp + item2.jmlPnp
                    summary.emoney = summary.emoney + item2.emoney
                    summary.qris = summary.qris + item2.qris
                })
                summary.transferAmount = summary.transferAmount + item.transferAmount
            })
            _setTransferReportSummary(summary)
        }
    }, [_transferReport])

    async function _getTransferReport() {
        _setIsProcessing(true)
        try {
            const res = await get(`/bumel/laporan/transfer?idPo=${props.company.id}&tglAkhir=${_date.end}&tglAwal=${_date.start}`, props.user.token)
            let result = []
            res.forEach((item, index) => {
                let currentIndex = result.findIndex(i => i.date === item.date)
                if (currentIndex >= 0) {
                    result[currentIndex].products = [...result[currentIndex].products, ...item.products]
                } else {
                    result.push(item)
                }
            })
            let finalResult = result.map(item => {
                let finalItem = {
                    date : item.date,
                    transferAmount : 0,
                    products : []
                }
                item.products.forEach((item2, index) => {
                    let currentIndex = finalItem.products.findIndex(i => i.soNumber === item2.soNumber)
                    if (currentIndex >= 0) {
                        finalItem.products[currentIndex].emoney = finalItem.products[currentIndex].emoney + item2.emoney
                        finalItem.products[currentIndex].qris = finalItem.products[currentIndex].qris + item2.qris
                        finalItem.products[currentIndex].jmlPnp = finalItem.products[currentIndex].jmlPnp + item2.jmlPnp
                    } else {
                        finalItem.products.push(item2)
                    }
                })
                finalItem.products.forEach(item => {
                    finalItem.transferAmount = finalItem.transferAmount + item.emoney + item.qris
                })
                return finalItem
            })
            _setTransferReport(finalResult)
            _setIsProcessing(false)
            if (res.length === 0) {
                popAlert({ message : 'Tidak Ada Data Penjualan', type : 'info' })
            }
        } catch (e) {
            popAlert({ message : e.message })
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
                        column={3}
                        >
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
                            onClick={_getTransferReport}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    _transferReportSummary && (
                        <Card
                        noPadding
                        >
                            <Table
                            columns={__COLUMNS}
                            records={_transferReport}
                            insertColumns={[
                                [
                                    { value : 'Total', colSpan : 4},
                                    { value : _transferReportSummary.jmlPnp },
                                    { value : currency(_transferReportSummary.emoney) },
                                    { value : currency(_transferReportSummary.qris) },
                                    { value : currency(_transferReportSummary.transferAmount) },
                                    { value : '' },
                                ],
                            ]}
                            customRow={(record, key) => {
                                return (
                                    <>
                                        {
                                            record.products.map((product, key2) => {
                                                return (
                                                    <tr
                                                    key={key2}
                                                    >
                                                        {
                                                            key2 === 0 && (
                                                                <>
                                                                    <td
                                                                    rowSpan={record.products.length}
                                                                    >
                                                                        {key + 1}
                                                                    </td>
                                                                    <td
                                                                    rowSpan={record.products.length}
                                                                    >
                                                                        {record.date}
                                                                    </td>
                                                                </>
                                                            )
                                                        }
                                                        <td>
                                                            {'\r' + product.soNumber}
                                                        </td>
                                                        <td>
                                                            {product.code}
                                                        </td>
                                                        <td
                                                        style={{
                                                            textAlign : 'right'
                                                        }}
                                                        >
                                                            {currency(product.jmlPnp)}
                                                        </td>
                                                        <td
                                                        style={{
                                                            textAlign : 'right'
                                                        }}
                                                        >
                                                            {currency(product.emoney)}
                                                        </td>
                                                        <td
                                                        style={{
                                                            textAlign : 'right'
                                                        }}
                                                        >
                                                            {currency(product.qris)}
                                                        </td>
                                                        {
                                                            key2 === 0 && (
                                                                <>
                                                                    <td
                                                                    rowSpan={record.products.length}
                                                                    style={{
                                                                        textAlign : 'right'
                                                                    }}
                                                                    >
                                                                        {currency(record.transferAmount)}
                                                                    </td>
                                                                    <td
                                                                    rowSpan={record.products.length}
                                                                    >
                                                                        {record.transfer_date}
                                                                    </td>
                                                                </>
                                                            )
                                                        }
                                                    </tr>
                                                )
                                            })
                                        }
                                    </>    
                                )
                            }}
                            noPadding
                            />
                        </Card>
                    )
                }
            </AdminLayout>           
        </Main>
    )

}