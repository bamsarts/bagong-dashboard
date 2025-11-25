import { useContext, useEffect, useState } from 'react'

import { TICKET_ORDER_URL, API_ENDPOINT, get, objectToParams, postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Tabs from '../Tabs'
import Table from '../Table'
import { currency, dateFilter } from '../../utils/filters'
import { popAlert } from '../Main'
import { Col, Row } from '../Layout'
import Button from '../Button'
import ActivityIndicator from '../ActivityIndicator'
import Input from '../Input'

TransactionHistoryModal.defaultProps = {
    visible : false,
    closeModal : null,
    transactionPending : []
}

export default function TransactionHistoryModal(props = TransactionHistoryModal.defaultProps) {

    const appContext = useContext(AppContext)
    const today = dateFilter.basicDate(new Date()).normal
    const [_selectedDate, _setSelectedDate] = useState({
        "startDate": today,
        "endDate": today
    })
    const [_activeIndex, _setActiveIndex] = useState('PENDING')
    const [_payIndex, _setPayIndex] = useState(-1)
    const [_cancelingIndex, _setCancelingIndex] = useState(-1)
    const [_creatingIndex, _setCreatingIndex] = useState(-1)
    const [_transactionHistory, _setTransactionHistory] = useState({
        PENDING : [],
        PAID : []
    })
    const [_isGettingData, _setIsGettingData] = useState(false)

    useEffect(() => {
        if (props.visible) {
            if (_activeIndex !== 'PENDING') _setActiveIndex('PENDING')
            _getTransactionHistory()
        }
    }, [props.visible])

    useEffect(() => {
        if (props.visible) {
            _getTransactionHistory(_activeIndex)
        }
    }, [_activeIndex, _selectedDate.startDate, _selectedDate.endDate])

    async function _getTransactionHistory(status = 'PENDING') {
        _setIsGettingData(true)
        const query = {
            startDate : _selectedDate.startDate,
            endDate : _selectedDate.endDate,
            paymentStatus : status
        }

        try {
            const result = await get({ url : TICKET_ORDER_URL + `/dashboard/transaction?${objectToParams(query)}` }, appContext.authData.token)
            _setTransactionHistory(oldData => {
                oldData[status] = result.data
                return oldData
            })
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setIsGettingData(false)
        }
    }

    async function _cancelTransaction(transaction, index) {
        _setCancelingIndex(index)
        try {
            await postJSON({ url : TICKET_ORDER_URL + '/dashboard/ticket/cancel' }, {
                partnerBookingCode : transaction.partnerBookingCode,
                transactionId : transaction.id
            }, appContext.authData.token)
            popAlert({ message : 'Transaksi berhasil dibatalkan', type : 'success' })
            _getTransactionHistory()
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setCancelingIndex(-1)
        }
    }

    async function _payTransaction(transaction, index) {
        _setPayIndex(index)
        try {
            await postJSON({ url : TICKET_ORDER_URL + '/dashboard/transaction/payment' }, {
                partnerBookingCode : transaction.partnerBookingCode,
                transactionId : transaction.id,
                bookingCode : transaction.bookingCode,
                transactionType : transaction.transactionType,

            }, appContext.authData.token)
            popAlert({ message : 'Transaksi berhasil dibayarkan', type : 'success' })
            _getTransactionHistory()
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setPayIndex(-1)
        }
    }

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        extraLarge
        centeredContent
        >
            <ModalContent
            header={{
                title : 'Riwayat Transaksi',
                closeModal : props.closeModal
            }}
            >
                <Row>
                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    >   
                        <div style={{"marginBottom": "1rem"}}>
                            <span>Status</span>
                        </div>

                        <Tabs
                        activeIndex={_activeIndex}
                        tabs={[
                            {
                                title : 'Tertunda',
                                value : 'PENDING',
                                onClick : () => {
                                    _setActiveIndex('PENDING')
                                }
                            },
                            {
                                title : 'Terbayar',
                                value : 'PAID',
                                onClick : () => {
                                    _setActiveIndex('PAID')
                                }
                            },
                        ]}
                        />
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    >
                        <Input
                        title={'Tanggal Awal'}
                        type={'date'}
                        max={today}
                        value={_selectedDate.startDate}
                        onChange={date => _setSelectedDate({
                            "startDate": dateFilter.basicDate(new Date(date)).normal,
                            "endDate": _selectedDate.endDate
                        })}
                        />
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    >
                        <Input
                        title={'Tanggal Akhir'}
                        type={'date'}
                        max={today}
                        value={_selectedDate.endDate}
                        onChange={date => _setSelectedDate({
                            "startDate": _selectedDate.startDate,
                            "endDate": dateFilter.basicDate(new Date(date)).normal
                        })}
                        />
                    </Col>
                </Row>

                {
                    !_isGettingData 
                    ? (
                        <Table
                        columns={[
                            {
                                title : 'Waktu Transaksi',
                                field : 'createdAt',
                                customCell : (value) => {
                                    return dateFilter.basicDate(new Date(value)).normal + ', ' + dateFilter.getTime(new Date(value))
                                }   
                            },
                            {
                                title : 'Trayek',
                                field : 'code'
                            },
                            {
                                title : 'Kode Booking',
                                field : 'partnerBookingCode'
                            },
                            {
                                title: 'Penumpang',
                                field: 'passengerName'
                            },
                            {
                                title : 'Jumlah Penumpang',
                                field : 'quantity'
                            },
                            {
                                title : 'Total Bayar',
                                field : 'totalAmount',
                                customCell : (value) => currency(value, 'Rp ')
                            },
                            {
                                title: 'Pembayaran',
                                field: 'paymentMethod'
                            },
                            {
                                title : 'Aksi',
                                field : 'id',
                                customCell : (value, row, index) => {
                                    return (
                                        <Row>
                                            {
                                                (_activeIndex === 'PENDING' && row.paymentMethod == "Cash") && (
                                                    <>
                                                        <Button
                                                        small
                                                        title={'Bayar'}
                                                        styles={Button.primary}
                                                        marginLeft
                                                        onProcess={_payIndex === index}
                                                        onClick={() => _payTransaction(row, index)}
                                                        />
                                                    </>
                                                )
                                            }
                                            {
                                                (_activeIndex === 'PENDING') && (
                                                    <>
                                                        <Button
                                                        small
                                                        title={'Batalkan'}
                                                        styles={Button.error}
                                                        marginLeft
                                                        onProcess={_cancelingIndex === index}
                                                        onClick={() => _cancelTransaction(row, index)}
                                                        />
                                                    </>
                                                )
                                            }
                                            {
                                                (_activeIndex === 'PAID') && (
                                                    <>
                                                        <Button
                                                        small
                                                        title={'Cetak'}
                                                        styles={Button.secondary}
                                                        onClick={() => {
                                                            window.open(`/admin/ticket-order/ticket/${row.transactionType}*${row.id}`)
                                                        }}
                                                        marginLeft
                                                        />
                                                    </>
                                                )
                                            }
                                        </Row>
                                    )
                                }
                            },
                        ]}
                        records={_transactionHistory[_activeIndex]}
                        />
                    )
                    : (
                        <Col
                        withPadding
                        column={6}
                        alignCenter
                        >
                            <small>
                                <i>
                                    Memuat data..
                                </i>
                            </small>
                            <br/>
                            <ActivityIndicator
                            dark
                            />
                        </Col>
                    )
                }
            </ModalContent>
        </Modal>
    )

}