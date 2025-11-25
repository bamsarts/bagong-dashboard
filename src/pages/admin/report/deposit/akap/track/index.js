import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import { Col, Row } from '../../../../../../components/Layout'
import DepositModal from '../../../../../../components/DepositModal'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import { useRouter } from 'next/router'

import { dateFilter, currency } from '../../../../../../utils/filters'

export default function ReportAkapTrack(props) {
    
    const router = useRouter()

    const __TABLE_HEADERS = [
        [
            { title : 'Dari', rowSpan : 2 },
            { title : 'Ke', rowSpan : 2 },
            { title : 'Tarif', rowSpan : 2 },
            { title : 'Tunai', colSpan : 2 },
            { title : 'E-Money', colSpan : 2 },
            { title : 'QRIS', colSpan : 2 },
            { title : 'Debit', colSpan : 2 },
            { title : 'Kredit', colSpan : 2 },
            { title : 'Deposit', colSpan : 2 },
        ],
        [
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
        ]
    ]

    const __COLUMNS = [
        {
            field : 'originName',
            textAlign: 'left'
        },
        {
            field : 'destinationName',
            textAlign: 'left'
        },
        {
            field : 'baseFare',
            textAlign: 'right',
            customCell: (value, record, key) => currency(value, '')
        },
        {
            field : 'pnpCash',
        },
        {
            field : 'cash',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'pnpEmoney',
        },
        {
            field : 'emoney',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'pnpQris',
        },
        {
            field : 'qris',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'pnpDebit',
        },
        {
            field : 'debit',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'pnpKredit',
        },
        {
            field : 'kredit',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'pnpDeposit',
        },
        {
            field : 'deposit',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
    ]

    const [_date, _setDate] = useState(dateFilter.basicDate(new Date()).normal)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDeposit, _setIsGettingDeposit] = useState(false)
    const [_deposits, _setDeposits] = useState(null)
    const [_selectedDeposit, _setSelectedDeposit] = useState(null)
    const [_titleModal, _setTitleModal] = useState({})
    const [_isOpenModal, _setIsOpenModal] = useState(false)

    async function _getDeposits() {
        _setIsProcessing(true)
        _setDeposits(null)
        try {
            const param = {
                companyId: props.authData.companyId,
                date: router.query.date,
                busId: router.query.detail,
            }
            const res = await postJSON('/laporan/setoran/akap/detail', param, props.authData.token)
            _setDeposits(res.data)
            if (res.data.length === 0) {
                popAlert({ message : 'Tidak Ada Data Setoran', type : 'info' })
            }
            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    useEffect(() => {
        console.log(router)
        _getDeposits()
    }, [])

    return (
        <Main>
        
            <AdminLayout>
                {
                    _deposits && (
                        <Card
                        noPadding
                        >
                            <Table
                             headExport={[
                                {
                                    title: 'Dari',
                                    value: "originName"
                                },
                                {
                                    title: 'Ke',
                                    value: "destinationName"
                                },
                                {
                                    title: 'Tarif',
                                    value: "baseFare"
                                },
                                {
                                    title: 'Penumpang Tunai',
                                    value: 'pnpCash'
                                },
                                {
                                    title: 'Nominal Tunai',
                                    value: "cash"
                                },
                                {
                                    title: 'Penumpang Emoney',
                                    value: "pnpEmoney"
                                },
                                {
                                    title: 'Nominal Emoney',
                                    value: "emoney"
                                },
                                {
                                    title: 'Penumpang Qris',
                                    value: "pnpQris"
                                },
                                {
                                    title: 'Qris',
                                    value: "qris"
                                },
                                {
                                    title: 'Penumpang Debit',
                                    value: "pnpDebit"
                                },
                                {
                                    title: 'Debit',
                                    value: "debit"
                                },
                                {
                                    title: 'Penumpang Kredit',
                                    value: "pnpKredit"
                                },
                                {
                                    title: 'Kredit',
                                    value: "kredit"
                                }
                            ]}
                            columns={__COLUMNS}
                            tableHeaders={__TABLE_HEADERS}
                            records={_deposits}
                            noPadding
                            />
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}