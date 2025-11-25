import { useState, useEffect } from 'react'

import { postJSON } from '../../../../../api/utils'

import AdminLayout from '../../../../../components/AdminLayout'
import Main, { popAlert } from '../../../../../components/Main'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import Input from '../../../../../components/Input'
import Button from '../../../../../components/Button'
import IntercityDepositModal from '../../../../../components/IntercityDepositModal'

import { currency, dateFilter } from '../../../../../utils/filters'

export default function IntercityDeposit(props) {

    const [_params, _setParams] = useState({
        date : dateFilter.basicDate(new Date()).normal
    })

    const [_deposits, _setDeposits] = useState(null)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDepositDetail, _setIsGettingDepositDetail] = useState(false)
    const [_depositDetail, _setDepositDetail] = useState(null)

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
            const result = await postJSON('/keuangan/setoran/akap/list', params, props.authData.token)
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
            date : _params.date
        }

        try {
            const result = await postJSON('/keuangan/setoran/akap/detail', params, props.authData.token)
            _setIsGettingDepositDetail(null)
            _setDepositDetail({
                ...record,
                history : result.data
            })
        } catch (e) {
            popAlert({ message : e.message['id'] })
            _setIsGettingDepositDetail(null)
        }
    }

    const __COLUMNS = [
        {
            title : 'Code',
            field : 'busName'
        },
        {
            title : 'Driver',
            field : 'driver'
        },
        {
            title : 'Jumlah Penumpang',
            field : 'totalPnp'
        },
        {
            title : 'Jumlah Setoran',
            field : 'totalAmount',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : '',
            customCell : (value, record, index) => {
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
    ]

    return (
        <Main>
            <IntercityDepositModal
            visible={_depositDetail !== null}
            deposit={_depositDetail}
            user={props.authData}
            closeModal={() => _setDepositDetail(null)}
            onSuccess={_getData}
            />
            <AdminLayout>
                <Card>
                    <Row>
                        <Col
                        column={2}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={'Tanggal'}
                            type={'date'}
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