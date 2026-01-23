import { useEffect, useState } from 'react'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { currency, dateFilter } from '../../../../utils/filters'
import { get, postJSON } from '../../../../api/utils'
import Button from '../../../../components/Button'
import SettlementModal from '../../../../components/SettlementModal'
import Input from '../../../../components/Input'
import { Row, Col } from '../../../../components/Layout'
import PreviewImageModal from '../../../../components/PreviewImageModal'
import Label from '../../../../components/Label'
import { getLocalStorage } from '../../../../utils/local-storage'

export default function Settlement(props) {
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_startDate, _setStartDate] = useState(new Date())
    const [_endDate, _setEndDate] = useState(new Date())
    const [_orderBy, _setOrderBy] = useState('transaction_date')
    const [_startFrom, _setStartFrom] = useState(0)
    const [_length, _setLength] = useState(10)
    const [_showSettlementModal, _setShowSettlementModal] = useState(false)
    const [_selectedSettlement, _setSelectedSettlement] = useState(null)
    const [_trayekMaster, _setTrayekMaster] = useState([])
    const [_roleAccess, _setRoleAccess] = useState(null)
    const [_previewImage, _setPreviewImage] = useState({
        "isOpen": false,
        "url": ""
    })

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
    })

    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[1],
        startFrom: 0,
    })


    let __COLUMNS = [
        {
            title: 'Tanggal Setoran',
            field: 'transaction_date',
            customCell: (value) => dateFilter.convertISO(new Date(value), "date")
        },
        {
            title: 'Trayek',
            field: 'traject_name',
            textAlign: "left",
            customCell: (value, row) => {
                return value
            }
        },
        {
            title: 'Pembayaran',
            field: 'payment_category',
            customCell: (value, row) => {
                return value ? value.toUpperCase() : ''
            },
        },
        {
            title: 'Total Transaksi',
            field: 'transaction_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'MDR',
            field: 'mdr_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Netto Transaksi',
            field: 'net_after_mdr',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Fee',
            field: 'fee_amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Grand Total',
            field: 'odt',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Status',
            field: 'status',
            customCell: (value, row) => {

                let status = _statusPayment(value)

                if (status.title) {
                    return (
                        <Row
                            verticalCenter
                        >

                            <Label
                                activeIndex={true}
                                labels={[
                                    {
                                        "class": status.class,
                                        "title": status.title,
                                        "value": true
                                    }
                                ]}
                            />
                        </Row>
                    )
                } else {
                    return ''
                }
            }
        },
        {
            title: '',
            field: 'settlement_url',
            customCell: (value, record) => {
                return (
                    <Button
                        styles={record.status == "CREATED" ? Button.primary : Button.secondary}
                        small
                        title={record.status == "CREATED" ? 'Rincian' : (record.payment_type == "cash" ? 'Kirim Invoice' : 'Settle')}
                        onProcess={_isProcessing}
                        onClick={() => {
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
        _getTrayekMaster()
        _getSettlement()
    }, [_startDate, _endDate])

    useEffect(() => {
        // Get role access from localStorage
        const accessMenuDamri = getLocalStorage('access_menu_damri')
        if (accessMenuDamri) {
            try {
                const roleData = JSON.parse(accessMenuDamri)
                // Filter for "Keuangan>Settlement" menu
                let settlementRole = roleData.find(role => role.menu === "Keuangan>Settlement")

                if ((settlementRole && settlementRole.updateRole === true) || props.role_id == "2") {

                    _setRoleAccess(true)
                }
            } catch (e) {
                console.error('Error parsing role data:', e)
            }
        }
    }, [])

    async function _getTrayekMaster() {

        let query = {
            startFrom: 0,
            length: 360
        }

        try {
            const res = await postJSON("/data/masterData/trayekMaster/list", query, props.authData.token)
            if (res.data) {
                _setTrayekMaster(res.data)
            }
        } catch (e) {
            console.error('Error fetching trayek master:', e)
        }
    }

    function _statusPayment(data) {
        let status = {
            class: "primary",
            title: data
        }

        switch (data) {
            case "CREATED":
                status.title = "Settlement"
                return status
            default:
                return status;
        }

    }

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
                query: null,
                paymentCategory: "non_tunai"
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
            const res = await postJSON("/data/settlement/add", settlementData, props.authData.token)

            if (res.status == "OK") {
                popAlert({ message: res.message, type: 'success' })
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
                                    fileName={"Settlement-" + dateFilter.basicDate(new Date(_startDate)).normal + "-sd-" + dateFilter.basicDate(new Date(_endDate)).normal}
                                    headerContent={(
                                        <Row>
                                            <Col
                                                column={1}
                                                withPadding
                                            >
                                                <Input
                                                    title="Tanggal Awal"
                                                    type="date"
                                                    value={dateFilter.basicDate(_startDate).normal}
                                                    onChange={(value) => _setStartDate(new Date(value))}
                                                />
                                            </Col>
                                            <Col
                                                column={1}
                                                withPadding
                                            >
                                                <Input
                                                    title="Tanggal Akhir"
                                                    type="date"
                                                    value={dateFilter.basicDate(_endDate).normal}
                                                    onChange={(value) => _setEndDate(new Date(value))}
                                                />
                                            </Col>

                                        </Row>
                                    )}
                                    headExport={[
                                        {
                                            title: 'Tanggal Setoran',
                                            value: 'transaction_date',
                                            customCell: (value) => dateFilter.convertISO(new Date(value), "date")
                                        },
                                        {
                                            title: 'Trayek',
                                            value: 'traject_name',
                                        },
                                        {
                                            title: 'Pembayaran',
                                            value: 'payment_category',
                                        },
                                        {
                                            title: 'Total Transaksi',
                                            value: 'transaction_amount',
                                        },
                                        {
                                            title: 'MDR',
                                            value: 'mdr_amount',
                                        },
                                        {
                                            title: 'Netto Transaksi',
                                            value: 'net_after_mdr',
                                        },
                                        {
                                            title: 'Fee',
                                            value: 'fee_amount',
                                        },
                                        {
                                            title: 'Grand Total',
                                            value: 'odt',
                                        },
                                        {
                                            title: 'Status',
                                            value: 'status',
                                            customCell: (value) => {
                                                return value == "CREATED" ? "Settlement" : "Pending"
                                            }
                                        },
                                        {
                                            title: 'Rekening Bank',
                                            value: 'traject_bank',
                                            customCell: (value) => {

                                                if (value.length > 0) {
                                                    return value[0].bank_name
                                                }
                                            }
                                        },
                                        {
                                            title: 'Nama Rekening',
                                            value: 'traject_bank',
                                            customCell: (value) => {

                                                if (value.length > 0) {
                                                    return value[0].bank_account_name
                                                }
                                            }
                                        },
                                        {
                                            title: 'Nomor Rekening',
                                            value: 'traject_bank',
                                            customCell: (value) => {

                                                if (value.length > 0) {
                                                    return value[0].bank_account_number
                                                }
                                            }
                                        },
                                    ]}
                                    columns={__COLUMNS}
                                    records={_settlement}
                                    noPadding
                                    onPageChange={(page) => {
                                        _setPagination({ ..._page, page: page })
                                    }}
                                    onRecordsPerPageChange={(perPage) => {
                                        _setPagination({ limit: perPage, page: 1 })
                                    }}
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
                    roleAccess={_roleAccess}
                    triggerPreviewImage={(data) => {
                        _setPreviewImage({
                            "isOpen": data.isOpen,
                            "url": data.url
                        })
                    }}
                />

                <PreviewImageModal
                    isOpen={_previewImage.isOpen}
                    onClose={() => {
                        _setPreviewImage({
                            "isOpen": false,
                        })
                    }}
                    imageUrl={_previewImage.url}
                />
            </AdminLayout>
        </Main>
    )

}