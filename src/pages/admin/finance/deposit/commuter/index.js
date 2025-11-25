import { useState, useEffect } from 'react'

import { postJSON } from '../../../../../api/utils'

import AdminLayout from '../../../../../components/AdminLayout'
import Main, { popAlert } from '../../../../../components/Main'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import Input from '../../../../../components/Input'
import Button from '../../../../../components/Button'
import CommuterDepositModal from '../../../../../components/CommuterDepositModal'
import Datepicker from '../../../../../components/Datepicker'

import { currency, dateFilter } from '../../../../../utils/filters'

export default function CommuterDeposit(props) {

    const [_params, _setParams] = useState({
        date : dateFilter.basicDate(new Date()).normal
    })

    const [_deposits, _setDeposits] = useState(null)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDepositDetail, _setIsGettingDepositDetail] = useState(false)
    const [_depositDetail, _setDepositDetail] = useState(null)
    const [_isOpenModal, _setIsOpenModal] = useState(false)

    useEffect(() => {
        _getData()
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
        _setIsGettingDepositDetail(null)
        let params = {
            companyId : props.authData.companyId,
            date : _params.date,
        }

        try {
            const result = await postJSON('/keuangan/setoran/commuter/v2/list', params, props.authData.token)
            if (result.data.length === 0) {
                popAlert({ message : 'Tidak Ada Transaksi' })
            }
            if (result) _setDeposits(result.data)
        } catch (e) {
            
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _openSalesRecord(record, index) {
        _setIsGettingDepositDetail(index)
    
        let params = {
            companyId : props.authData.companyId,
            busId : record.busId,
            date : _params.date,
            userId: record.userId
        }

        try {
            const result = await postJSON('/keuangan/setoran/commuter/v2/detail', params, props.authData.token)
            _setIsGettingDepositDetail(null)
            _setDepositDetail({
                ...record,
                history : result.data
            })
            _setIsOpenModal(true)
        } catch (e) {
            popAlert({ message : e.message })
            _setIsGettingDepositDetail(null)
        }
    }

    const __TABLE_HEADERS = [
        [
            { title : 'Bus', rowSpan : 2 },
            { title : 'Crew', rowSpan : 2 },
            { title : 'Total Pnp', rowSpan : 2 },
            { title : 'Total Setoran', rowSpan : 2 },
            { title : 'Tunai', colSpan : 2 },
            { title : 'E-Money', colSpan : 2 },
            { title : 'QRIS', colSpan : 2 },
            { title : 'Debit', colSpan : 2 },
            { title : 'Kredit', colSpan : 2 },
            { title : '', rowSpan : 2 },
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
            field : 'busName'
        },
        {
            field : 'driver'
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
        },
        {
            field : '',
            customCell : (value, record, index) => {
                if(record.busId != null){
                    return (
                        <Button
                        title={'Rincian'}
                        styles={Button.warning}
                        onClick={() => _openSalesRecord(record, index)}
                        onProcess={_isGettingDepositDetail === index}
                        small
                        />
                    )
                }
                
            }
        }
    ]

    return (
        <Main>
            <CommuterDepositModal
            visible={_isOpenModal}
            deposit={_depositDetail}
            user={props.authData}
            closeModal={() => _setIsOpenModal(false)}
            onSuccess={_getData}
            showCommuterModal={(value) => {
                _setIsOpenModal(value)
            }}
            />
            <AdminLayout>
                <Card>
                    <Row>
                        <Col
                        column={2}
                        withPadding
                        mobileFullWidth
                        >
                            <Datepicker
                            title={"Tanggal Awal"}
                            value={_params.date}
                            onChange={value => _updateQuery({ date : dateFilter.basicDate(new Date(value)).normal })}
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
                            title={'Terapkan'}
                            fluidWidth
                            onClick={_getData}
                            onProcess={_isProcessing}
                            />
                        </Col>
                    </Row>
                </Card>

                {
                    _deposits && (
                        <Card
                        noPadding
                        >
                            <Table
                            tableHeaders={__TABLE_HEADERS}
                            columns={__COLUMNS}
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