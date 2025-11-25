import { useState, useEffect } from 'react'

import { postJSON } from '../../../../../api/utils'

import AdminLayout from '../../../../../components/AdminLayout'
import Main, { popAlert } from '../../../../../components/Main'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import Input from '../../../../../components/Input'
import Button from '../../../../../components/Button'

import { currency, dateFilter } from '../../../../../utils/filters'

export default function ReportTransactionCommuter(props) {

    const [_params, _setParams] = useState({
        startDate : dateFilter.basicDate(new Date()).normal,
        endDate : dateFilter.basicDate(new Date()).normal
    })

    const [_transcations, _setTransactions] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_traject, _setTraject] = useState({
        title: "",
        value: ""
    })

    const [_trajectRanges, _setTrajectRanges] = useState([])
    
    useEffect(() => {
        _getData()
        _getTraject()
    }, [])

    function _updateQuery(data = {}) {
        _setParams(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getData() {
        _setIsProcessing(true)

        let params = {
            companyId : props.authData.companyId,
            startFrom : 0,
            length: 140,
            orderBy: "created_at",
            sortMode: "desc",
            startDate: _params.startDate,
            endDate: _params.endDate
        }

        if(_traject.value != "") params.trajectId = _traject.value

        try {
            const result = await postJSON('/laporan/transaksi/commuter/list', params, props.authData.token)
            
            if (result) _setTransactions(result.data)
        } catch (e) {
            
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getTraject() {

        let params = {
            companyId : props.authData.companyId,
            startFrom : 0,
            length: 60,
        }

        try {
            const result = await postJSON('/masterData/trayek/commuter/list', params, props.authData.token)
            let data = []
            result.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Trayek",
                        value: ""
                    })
                }
                data.push({
                    title: val.name,
                    value: val.id
                })
            })

            if (result) _setTrajectRanges(data)
            _setTraject(data[0])
        } catch (e) {
            
        } finally {
            _setIsProcessing(false)
        }
    }

    const __TABLE_HEADERS = [
        [
            { title : 'Tanggal', rowSpan : 2 },
            { title : 'Jumlah Penumpang', rowSpan : 2 },
            { title : 'Jumlah Transaksi', rowSpan : 2 },
            { title : 'Tunai', colSpan : 2 },
            { title : 'E-Money', colSpan : 2 },
            { title : 'QRIS', colSpan : 2 },
            { title : 'Debit', colSpan : 2 },
            { title : 'Kredit', colSpan : 2 },
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
        ]
    ]

    const __COLUMNS = [
        {
            field : 'dateTransaction',
            customCell : (value) => dateFilter.getMonthDate(new Date(value))
        },
        {
            field : 'totalPnp'
        },
        {
            field : 'totalAmount',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : 'pnpCash'
        },
        {
            field : 'cash',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : 'pnpEmoney'
        },
        {
            field : 'emoney',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : 'pnpQris'
        },
        {
            field : 'qris',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : 'pnpDebit'
        },
        {
            field : 'debit',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : 'pnpKredit'
        },
        {
            field : 'kredit',
            customCell : (value) => currency(value, 'Rp ')
        }
    ]

    return (
        <Main>
            <AdminLayout>
                <Card>
                    <Row>
                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={'Tanggal Awal'}
                            type={'date'}
                            value={_params.startDate}
                            onChange={value => _updateQuery({ startDate : dateFilter.basicDate(new Date(value)).normal })}
                            />
                        </Col>

                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={'Tanggal Akhir'}
                            type={'date'}
                            value={_params.endDate}
                            onChange={value => _updateQuery({ endDate : dateFilter.basicDate(new Date(value)).normal })}
                            />
                        </Col>

                        <Col
                        column={2}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={'Trayek'}
                            placeholder={'Semua Trayek'}
                            value={_traject.title}
                            suggestions={_trajectRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _setTraject(data)
                                return false
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        style={{
                            display : 'flex',
                            justifyContent  : 'flex-start',
                            alignItems : 'flex-end',
                        }}
                        >
                            <Button
                            title={'Cari Transaksi'}
                            fluidWidth
                            onClick={_getData}
                            onProcess={_isProcessing}
                            />
                        </Col>
                    </Row>
                </Card>

                <Card
                noPadding
                >
                    <Table
                    tableHeaders={__TABLE_HEADERS}
                    columns={__COLUMNS}
                    records={_transcations}
                    noPadding
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}