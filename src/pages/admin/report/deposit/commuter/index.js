import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import DepositModal from '../../../../../components/DepositModal'
import Table from '../../../../../components/Table'
import Datepicker from '../../../../../components/Datepicker'
import Tabs from '../../../../../components/Tabs'

import { dateFilter, currency } from '../../../../../utils/filters'

export default function Deposit(props) {

    const __COLUMNS = [
        {
            title : 'No.',
            customCell : (value, record, key) => {
                return key + 1
            }
        },
        {
            title : 'Produk (Bus)',
            field : 'busName'
        },
        {
            title : 'Crew',
            field : 'busCrewName',
        },
        {
            title : 'Total Penumpang',
            field : 'totalPnp'
        },
        {
            title : 'Total Setoran',
            field : 'totalAmount',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            title : 'Tanggal Setoran',
            field : 'dateDeposit',
            customCell : (value) => {
                const date = new Date(value)
                return dateFilter.getFullDate(date)
            }
        },
        {
            title : 'Tanggal Transaksi',
            field : 'dateTransaction',
            customCell : (value) => {
                const date = new Date(value)
                return dateFilter.getFullDate(date)
            }
        },
        {
            field : 'busId',
            customCell : (value, row) => {
                return (
                    <Button
                    title={'Rincian'}
                    styles={Button.warning}
                    onClick={() => _getDepositById(row)}
                    onProcess={value === _isGettingDeposit}
                    small
                    />
                )
            }
        }
    ]

    const __COLUMNS_OTA = [
        {
            title : 'No.',
            customCell : (value, record, key) => {
                return key + 1
            }
        },
        {
            title : 'Produk (Bus)',
            field : 'busName'
        },
        {
            title : 'Total Penumpang',
            field : 'totalPnp'
        },
        {
            title : 'Total Setoran',
            field : 'totalAmount',
            customCell : (value) => currency(value, 'Rp ')
        },
        {
            field : 'busId',
            customCell : (value, row) => {
                return (
                    <Button
                    title={'Rincian'}
                    styles={Button.warning}
                    onClick={() => {
                        // _getDepositById(row)
                        console.log(row)
                        _setTitleModal(row)
                        _setSelectedDepositOta(row)
                        _setIsOpenModal(true)
                    }}
                    onProcess={value === _isGettingDeposit}
                    small
                    />
                )
            }
        }
    ]

    const [_date, _setDate] = useState(dateFilter.basicDate(new Date()).normal)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDeposit, _setIsGettingDeposit] = useState(false)
    const [_deposits, _setDeposits] = useState(null)
    const [_depositsOta, _setDepositsOta] = useState(null)
    const [_selectedDepositOta, _setSelectedDepositOta] = useState(null)
    const [_selectedDeposit, _setSelectedDeposit] = useState(null)
    const [_titleModal, _setTitleModal] = useState({})
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_activeIndex, _setActiveIndex] = useState("NONOTA")

    async function _getDeposits() {
        _setIsProcessing(true)
        _setDeposits(null)
        try {
            const param = {
                companyId: props.authData.companyId,
                date: _date
            }

            const paramOta = {
                endDate: _date,
                length: 600,
                orderBy: "id",
                sortMode: "desc",
                startDate: _date,
                startFrom: 0,
                status: "boarding"
            }

            const res = await postJSON('/laporan/setoran/commuter/v2/list', param, props.authData.token)
            const resOta = await postJSON('/keuangan/transaksi/commuter/boarding/v2/ota/list', paramOta, props.authData.token)

            _setDeposits(res.data)
            _setDepositsOta(resOta.data)
            _groupOta(resOta.data)

            if (res.data.length === 0 && resOta.data.length === 0) {
                popAlert({ message : 'Tidak ada setoran', type : 'info' })
            }
            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    function _groupOta(data){
        const groupByCategory = data.reduce((group, product) => {
            const { busName } = product;
            group[busName] = group[busName] ?? [];
            group[busName].push(product);
            return group;
        }, {});

        let result = []

        Object.keys(groupByCategory).forEach(key => {
            let pnp = 0
            let deposit = 0

            groupByCategory[key].forEach(function(val, key){
                pnp += val.totalPnp
                deposit += val.totalAmount
            })
            
            result.push({
                "busName": key,
                "totalPnp": pnp,
                "totalAmount": deposit,
                "data": groupByCategory[key]
            })
        });

        _setDepositsOta(result)
    }

    async function _getDepositById(row) {
        _setIsGettingDeposit(row.busId)
        _setSelectedDeposit(null)
        _setTitleModal(row)
      
        try {
            const param = {
                companyId: props.authData.companyId,
                busId: row.busId,
                date: row.dateTransaction
            }
            const deposit = await postJSON(`/laporan/setoran/commuter/v2/detail`, param, props.authData.token)
            _setSelectedDeposit(deposit)
            _setIsGettingDeposit(false)
            _setIsOpenModal(true)
        } catch (e) {
            _setIsGettingDeposit(false)
        }
    }

    return (
        <Main>
            <DepositModal
            visible={_isOpenModal}
            closeModal={() => _setSelectedDeposit(null)}
            user={props.user}
            deposit={_selectedDeposit}
            titleModal={_titleModal}
            company={props.company}
            showCommuterModal={(value) => {
                _setIsOpenModal(value)
            }}
            closeModal={() => _setIsOpenModal(false)}
            depositOta={_selectedDepositOta}
            activeIndex={_activeIndex}
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
                            <span>Transaksi</span>

                            <div
                            style={{"marginTop": "1rem"}}
                            >
                                <Tabs
                                activeIndex={_activeIndex}
                                tabs={[
                                    {
                                        title : 'Non OTA',
                                        value : 'NONOTA',
                                        onClick : () => {
                                            _setActiveIndex('NONOTA')
                                        }
                                    },
                                    {
                                        title : 'OTA',
                                        value : 'OTA',
                                        onClick : () => {
                                            _setActiveIndex('OTA')
                                        }
                                    },
                                ]}
                                />
                            </div>
                            
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            value={_date}
                            onChange={date => _setDate(dateFilter.basicDate(new Date(date)).normal)}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            title={'Cari Setoran'}
                            onProcess={_isProcessing}
                            onClick={_getDeposits}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    (_deposits && _depositsOta) && (
                        <Card
                        noPadding
                        >
                            {
                                _activeIndex == "NONOTA" && (
                                    <Table
                                    headExport={[
                                        {
                                            title: 'Kode Bus',
                                            value: "busName"
                                        },
                                        {
                                            title: 'Crew',
                                            value: "busCrewName"
                                        },
                                        {
                                            title: 'Total Penumpang',
                                            value: "totalPnp"
                                        },
                                        {
                                            title: 'Total Setoran',
                                            value: 'totalAmount'
                                        },
                                        {
                                            title: 'Tanggal Setoran',
                                            value: "dateDeposit"
                                        },
                                        {
                                            title: 'Tanggal Transaksi',
                                            value: "dateTransaction"
                                        },
                                        {
                                            title: 'Petugas',
                                            value: "driver"
                                        },
                                        {
                                            title: 'Total Pembayaran Cash',
                                            value: "cash"
                                        },
                                        {
                                            title: 'Total Pembayaran Emoney',
                                            value: "emoney"
                                        },
                                        {
                                            title: 'Total Pembayaran QRIS',
                                            value: "qris"
                                        },
                                        {
                                            title: 'Total Pembayaran Debit',
                                            value: "debit"
                                        },
                                        {
                                            title: 'Total Pembayaran Kredit',
                                            value: "kredit"
                                        }
                                    ]}
                                    columns={__COLUMNS}
                                    records={_deposits}
                                    noPadding
                                    />
                                )
                            }

                            {
                                _activeIndex == "OTA" && (
                                    <Table
                                    columns={__COLUMNS_OTA}
                                    records={_depositsOta}
                                    noPadding
                                    />
                                )
                            }
                            
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}