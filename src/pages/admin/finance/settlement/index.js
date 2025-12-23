import { useEffect, useState } from 'react'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { currency, dateFilter } from '../../../../utils/filters'
import { API_ENDPOINT, get, postJSON, SETTLEMENT_URL } from '../../../../api/utils'
import Button from '../../../../components/Button'
import SettlementModal from '../../../../components/SettlementModal'

export default function Settlement(props) {
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_startDate, _setStartDate] = useState(new Date("2025-12-05"))
    const [_endDate, _setEndDate] = useState(new Date())
    const [_orderBy, _setOrderBy] = useState('transaction_date')
    const [_startFrom, _setStartFrom] = useState(0)
    const [_length, _setLength] = useState(10)
    const [_showSettlementModal, _setShowSettlementModal] = useState(false)
    const [_selectedSettlement, _setSelectedSettlement] = useState(null)

    let __COLUMNS = [
        {
            title: 'Tanggal Transaksi',
            field: 'transaction_date',
            customCell: (value) => dateFilter.convertISO(new Date(value), "date")
        },
        {
            title: 'Company ID',
            field: 'company_id',
        },
        {
            title: 'Traject ID',
            field: 'traject_id',
        },
        {
            title: 'Tipe Pembayaran',
            field: 'payment_type',
        },
        {
            title: 'Jumlah Transaksi',
            field: 'transaction_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'MDR Amount',
            field: 'mdr_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Net After MDR',
            field: 'net_after_mdr',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Fee Amount',
            field: 'fee_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'ODT',
            field: 'odt',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Debt Amount',
            field: 'debt_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Status',
            field: 'status',
        },
        {
            title: 'Opsi',
            field: 'settlement_url',
            customCell: (value, record) => {
                return (
                    <Button
                    title={'Settle'}
                    onProcess={_isProcessing}
                    onClick={ () => {
                        _setSelectedSettlement(record)
                        _setShowSettlementModal(true)
                    }}
                    />
                )
            }
        }
    ]

    const [_settlement, _setSettlement] = useState([])

    useEffect(() => {
        _getSettlement()
    }, [])


    async function _getSettlement() {
        try {
            // Build query parameters
            const params = {
                startDate: dateFilter.basicDate(_startDate).normal,
                endDate: dateFilter.basicDate(_endDate).normal,
                orderBy: _orderBy,
                startFrom: _startFrom.toString(),
                length: _length.toString(),
                sortMode: "desc",
                query: null
            }

            const res = await postJSON("/data/settlement/list", params, props.authData.token)
            
            if (res.data.length === 0) {
                popAlert({ message: 'Tidak ada data settlement', type: 'info' })
                _setSettlement([])
            } else {
                _setSettlement(res.data)
            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _submitSettlement(settlementData) {
        _setIsProcessing(true)
        try {
            const res = await postJSON("/data/settlement/create", settlementData, props.authData.token)
            
            if (res.success) {
                popAlert({ message: 'Settlement berhasil dibuat', type: 'success' })
                _setShowSettlementModal(false)
                _setSelectedSettlement(null)
                _getSettlement() // Refresh the data
            } else {
                popAlert({ message: res.message || 'Gagal membuat settlement' })
            }

        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>
            <AdminLayout>
                {
                    _settlement && (
                        <>
                            <Card
                                noPadding
                            >
                                <Table
                                    headExport={[
                                        {
                                            title: 'Tanggal Transaksi',
                                            value: 'transaction_date',
                                            customCell: (value) => dateFilter.convertISO(new Date(value), "date")
                                        },
                                        {
                                            title: 'Company ID',
                                            value: 'company_id',
                                        },
                                        {
                                            title: 'Traject ID',
                                            value: 'traject_id',
                                        },
                                        {
                                            title: 'Tipe Pembayaran',
                                            value: 'payment_type',
                                        },
                                        {
                                            title: 'Jumlah Transaksi',
                                            value: 'transaction_amount',
                                        },
                                        {
                                            title: 'Net After MDR',
                                            value: 'net_after_mdr',
                                        },
                                        {
                                            title: 'ODT',
                                            value: 'odt',
                                        },
                                    ]}
                                    columns={__COLUMNS}
                                    records={_settlement}
                                    noPadding
                                />
                            </Card>
                        </>
                    )
                }
                
                <SettlementModal
                    visible={_showSettlementModal}
                    onClose={() => {
                        _setShowSettlementModal(false)
                        _setSelectedSettlement(null)
                    }}
                    onSubmit={_submitSettlement}
                    isProcessing={_isProcessing}
                    initialData={_selectedSettlement}
                />
            </AdminLayout>
        </Main>
    )

}