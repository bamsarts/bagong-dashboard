import { useEffect, createRef, useState } from 'react'

import { BsArrowRight } from 'react-icons/bs'

import { TICKET_ORDER_URL, API_ENDPOINT, get, objectToParams, postJSON } from '../../../../api/utils'
import { getSessionStorage } from '../../../../utils/session-storage'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Seat from '../../../../components/Seat'
import { Col, Row } from '../../../../components/Layout'
import Input from '../../../../components/Input'
import Button from '../../../../components/Button'
import TransactionCreateModal from '../../../../components/TransactionCreateModal'

import generateClasses from '../../../../utils/generateClasses'
import { currency, dateFilter } from '../../../../utils/filters'

import backgroundColor from '../../../../styles/sass/background-color.module.scss'
import styles from '../TicketOrder.module.scss'
import ActivityIndicator from '../../../../components/ActivityIndicator'
import getBank from '../../../../utils/bank'

TicketOrderCreate.SCHEDULE_SELECTED_SESSION = 'SCHEDULE_SELECTED_SESSION'

export default function TicketOrderCreate(props) {

    const PASSENGER_COUNT = [ 1, 2, 3, 4 ]
    const PASSENGER_TITLES = [
        {
            title : 'Tuan',
            value : 'ADULT-MALE'
        },
        {
            title : 'Nyonya',
            value : 'ADULT-FEMALE'
        },
        {
            title : 'Anak Laki-laki',
            value : 'CHILD-MALE'
        },
        {
            title : 'Anak Perempuan',
            value : 'CHILD-FEMALE'
        },
    ]

    const __seat_wrapper_ref = createRef()

    const [_seatWrapperWidth, _setSeatWrapperWidth] = useState(0)
    const [_schedule, _setSchedule] = useState({})
    const [_seatsLayout, _setSeatsLayout] = useState(null)
    const [_totalPassengers, _setTotalPassengers] = useState(1)
    const [_passengers, _setPassengers] = useState(PASSENGER_COUNT.map((seat, index) => {
        return {
            seatNumber : seat,
            name : '',
            gender : '',
            age : '',
            passengerCategory : 'GENERAL',
            phoneNumber : '',
            identity : '',
            title : '' 
        }
    }))
    const [_selectedSeats, _setSelectedSeats] = useState([])
    const [_paymentMethods, _setPaymentMethods] = useState([])
    const [_selectedPaymentMethod, _setSelectedPaymentMethod] = useState(-1)
    const [_isGettingSeatLayout, _setIsGettingSeatLayout] = useState(false)
    const [_isCreatingTransaction, _setIsCreatingTransaction] = useState(false)
    const [_showBalance, _setShowBalance] = useState(false)
    const [_transactionCreateModalVisible, _setTransactionCreateModalVisible] = useState(false)
    const [_transaction, _setTransaction] = useState(null)
    const [_issuerBank, _setIssuerBank] = useState({
        value: "",
        title: ""
    })
    const [_bankRange, _setBankRange] = useState(getBank())

    useEffect(() => {
        console.log(_issuerBank)
    }, [_issuerBank.title])

    useEffect(() => {
        const schedule = getSessionStorage(TicketOrderCreate.SCHEDULE_SELECTED_SESSION)
        console.log("schedule")
        console.log(schedule)
        _setSchedule(schedule)
        _getPaymentMethods()
    }, [])

    useEffect(() => {
        if (_totalPassengers) {
            _setSelectedSeats([])
        }
    }, [_totalPassengers])

    useEffect(() => {
        console.log("seat")
        console.log(_seatsLayout)
    }, [_seatsLayout])
    
    useEffect(() => {
        _setSeatWrapperWidth(document.getElementById('seat_wrapper').offsetWidth)

        const seatWrapper = __seat_wrapper_ref?.current
        if (!seatWrapper) return

        const observer = new ResizeObserver(() => {
            const { width } = seatWrapper.getBoundingClientRect()
            _setSeatWrapperWidth(width)
        })

        observer.observe(seatWrapper)

        return () => {
            observer.disconnect()
        }
        
    }, [])

    useEffect(() => {
        if (_schedule?.busId) {
            _getSeatLayout()
        }
    }, [_schedule])

    useEffect(() => {
        if (_transaction) {
            _setTransactionCreateModalVisible(true)
        }
    }, [_transaction])

    async function _getPaymentMethods() {
        try {
            const result = await get({ url : TICKET_ORDER_URL + '/dashboard/payment/methods' }, props.authData.token)

            _setPaymentMethods(result.data)
        } catch (e) {}
    }

    function _getSeatBackgroundColor(seat) {
        if (_selectedSeats.indexOf(seat.seatNumber) >= 0) {
            return backgroundColor.secondary
        }
        if (seat.status === 'booked' || seat.type === 'DRIVER') {
            return backgroundColor.medium_dark
        
        }

        if(seat.status === "reserved"){
            return backgroundColor.warning
        }

        if (!seat.status || seat.status === '-') {
            return 'transparent'
        }
        if (seat.status === 'free') {
            return '#fff'
        }
    }

    async function _getSeatLayout() {
        const getSeatParams = objectToParams({
            busId : _schedule.busId,
            departureDate : _schedule.departureDate,
            departureTime : _schedule.departureTime,
            trajectId : _schedule.trajectId,
        })

        _setIsGettingSeatLayout(true)
        try {

            //v3 get from self database
            //v2 get from SIMA DAMRI
            //v1 get from OTA DAMRI

            const result = await postJSON({ url : TICKET_ORDER_URL +  `/dashboard/seat?${getSeatParams}` }, null, props.authData.token)
            if (result.data) _setSeatsLayout(result.data)
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setIsGettingSeatLayout(false)
        }         
    }

    function _selectSeat(seatNumber) {
        const totalPassengers = _totalPassengers
        let selectedSeats = [..._selectedSeats]
        const currentIndex = selectedSeats.indexOf(seatNumber)
        if (currentIndex >= 0) {
            selectedSeats.splice(currentIndex, 1)
        } else {
            if (totalPassengers > 1 && _selectedSeats.length >= totalPassengers) {
                popAlert({ message : `Anda memilih maksimal ${totalPassengers} penumpang` })
                return false
            } else {
                if (totalPassengers === 1) {
                    selectedSeats = [seatNumber]
                } else {
                    selectedSeats.push(seatNumber)
                }
            }
        }
        _setSelectedSeats(selectedSeats)
    }

    function _updatePassengersData(key, value = {}) {
        
        let passengers = [..._passengers]
        passengers[key] = {
            ...passengers[key],
            ...value
        }
        _setPassengers(passengers)
    }

    function _isComplete() {
        let isComplete = true
        
        if (_schedule.trajectTypeCategory == 'INTERCITY') {
            if (_selectedSeats.length < _totalPassengers) {
                return false
            }
        }


        const passengers = _passengers.filter((passenger, index) => index < _totalPassengers)
    
        passengers.some(passenger => {
            
            if (!passenger.name || !passenger.phoneNumber || !passenger.title) {
                isComplete = false
                return true
            }
        })

        if(_paymentMethods[_selectedPaymentMethod]?.category == "debit" || _paymentMethods[_selectedPaymentMethod]?.category == "kredit"){
            if(_issuerBank.title == ""){
                isComplete = false
            }
        }

        return isComplete
    }
    
    async function _orderTicket() {
        _setIsCreatingTransaction(true)
        
        let orderData = {
            passengerAddress: "-",
            marks: "-",
            assignType : _schedule.assignType,
            assignCode: _schedule.assignCode,
            arrivalDate : _schedule.arrivalDate,
            arrivalTime : _schedule.arrivalTime,
            arrivalTimeZone : _schedule.arrivalTimeZone,
            departureDate : _schedule.departureDate,
            departureTime : _schedule.departureTime,
            departureTimeZone : _schedule.departureTimeZone,
            busCategoryId : _schedule.busCategoryId,
            busId : _schedule.busId,
            busCategoryType : _schedule.busCategoryType,
            companyId : _schedule.companyId,
            estimatedTime : _schedule.estimatedTime,
            ScheduleId : _schedule.trajectTypeCategory === 'INTERCITY' ? _schedule.intercityScheduleId : _schedule.commuterScheduleId,
            ScheduleDetailId : _schedule.trajectTypeCategory === 'INTERCITY' ? _schedule.intercityScheduleDetailId : _schedule.commuterScheduleDetailId,
            destinationId : _schedule.destinationId,
            originId : _schedule.originId,
            trajectId : _schedule.trajectId,
            trajectTrackId : _schedule.trajectTrackId,
            paymentProviderDetailId : _paymentMethods[_selectedPaymentMethod].paymentProviderDetailId,
            paymentProviderId : _paymentMethods[_selectedPaymentMethod].paymentProviderId,
            totalPassenger : _totalPassengers,
            issuer: _issuerBank.title,
            passengerDetails : _passengers.filter((passenger, index) => index < _totalPassengers).map((item, index) => {
                return {
                    ...item,
                    seatNumber : _schedule.trajectTypeCategory === 'INTERCITY' ? _selectedSeats[index] : null
                }
            })
        }

        if(_schedule.trajectTypeCategory === 'COMMUTER'){
            delete orderData.ScheduleId
            delete orderData.ScheduleDetailId

            orderData.scheduleId = _schedule.commuterScheduleId
            orderData.scheduleDetailId = _schedule.commuterScheduleDetailId
        }



        try {

            //v3 get from self database
            //v2 get from SIMA DAMRI
            //v1 get from OTA DAMRI

            const url = _schedule.trajectTypeCategory === 'INTERCITY' ? '/dashboard/transaction/intercity/create' : '/dashboard/transaction/commuter/create'
            const result = await postJSON({ url : TICKET_ORDER_URL + url }, orderData, props.authData.token)
            if (result.data?.transaction) _setTransaction({
                ...result.data.transaction,
                orderData
            })
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setIsCreatingTransaction(false)
        }
    }

    return (
        <Main>
            {
                _schedule && (
                    <TransactionCreateModal
                    visible={_transactionCreateModalVisible}
                    schedule={_schedule}
                    transaction={_transaction}
                    onCancel={() => {
                        _getSeatLayout()
                        _setTransactionCreateModalVisible(false)
                    }}
                    />
                )
            }
            <AdminLayout
            BreadCrumb={(
                <h3>
                    Data Pemesanan
                </h3>
            )}
            >
                <Row>
                    <Col
                    className={styles.seat_wrapper_column}
                    mobileFullWidth
                    >
                        <Card
                        style={{
                            position : 'sticky',
                            top : 0
                        }}
                        >
                            <div
                            id={'seat_wrapper'}
                            ref={__seat_wrapper_ref}
                            >
                                <Row
                                marginBottom
                                >
                                    <Col>
                                        <b>
                                            Jumlah Penumpang
                                        </b>
                                    </Col>
                                </Row>
                                
                                <Row
                                center
                                verticalCenter
                                marginBottom
                                >
                                    {
                                        PASSENGER_COUNT.map((_schedule, key) => {
                                            return (
                                                <Col
                                                key={key}
                                                justifyCenter
                                                alignCenter
                                                >
                                                    <div
                                                    style={{
                                                        width : (_seatWrapperWidth / 6) - 4,
                                                        height : (_seatWrapperWidth / 6) - 4
                                                    }}
                                                    className={generateClasses([
                                                        styles.passenger_count,
                                                        (_schedule == _totalPassengers) && styles.total_passengers
                                                    ])}
                                                    onClick={() => _setTotalPassengers(_schedule)}
                                                    >
                                                        <b>
                                                            {_schedule}
                                                        </b>
                                                    </div>
                                                </Col>
                                            )
                                        })
                                    }
                                </Row>

                                {/* {
                                    _schedule.
                                } */}

                                {
                                    _schedule.trajectTypeCategory !== 'COMMUTER' && (
                                        <Row
                                        marginBottom
                                        verticalCenter
                                        >
                                            <Col>
                                                <b>
                                                    Pilih {_totalPassengers} Kursi
                                                </b>
                                            </Col>
                                            <Col
                                            alignEnd
                                            >
                                                <small>Kursi tersedia <b>{_schedule?.seatAvailable}</b></small>
                                            </Col>
                                        </Row>
                                    )
                                }


                                {
                                    _isGettingSeatLayout && (
                                        <Col
                                        center
                                        alignCenter
                                        >
                                            <small>
                                                <i>
                                                    Memuat Kursi...
                                                </i>
                                            </small>
                                            <br/>
                                            <ActivityIndicator
                                            dark
                                            />
                                        </Col>
                                    )
                                }
                                
                                {
                                    _seatsLayout?.map((row, key) => {
                                        return (
                                            <Row
                                            key={key}
                                            marginBottom
                                            center
                                            >
                                                {
                                                    row.map((col, key2) => {
                                                        return (
                                                            <Col
                                                            key={key2}
                                                            style={{
                                                                justifyContent : 'center',
                                                                padding : 4,
                                                                flex : 0
                                                            }}
                                                            ignoreScreenSize>
                                                                <Seat
                                                                size={(_seatWrapperWidth / 6) - 4}
                                                                visible={['SEAT','DRIVER'].indexOf(col.type) >= 0}
                                                                backgroundColor={_getSeatBackgroundColor(col)}
                                                                number={col.seatNumber}
                                                                color={_selectedSeats.indexOf(col.seatNumber) >= 0 ? '#fff' : '#555'}
                                                                onSelect={() => _selectSeat(col.seatNumber)}
                                                                isBusDriver={col.type}
                                                                disabled={col.status !== 'free' || col.type === "DRIVER"}
                                                                passenger={col.passenger}
                                                                />
                                                            </Col>
                                                        )
                                                    })
                                                }
                                            </Row>
                                        )
                                    })
                                }
                            </div>
                        </Card>
                    </Col>
                    <Col>
                        <Card
                        noPadding
                        headerContent={(
                            <Row
                            withPadding
                            className={styles.selected_schedule_row}
                            >
                                <Col
                                column={2}
                                className={styles.bus}
                                ignoreScreenSize
                                mobileFullWidth
                                >
                                    <Row
                                    spaceBetween
                                    >
                                        <Col
                                        column={3}
                                        ignoreScreenSize
                                        withPadding
                                        >
                                            <h3>
                                                {_schedule.busName}
                                            </h3>
                                            <small>
                                                <b>
                                                    {_schedule.busCategoryName}
                                                </b>
                                            </small>
                                        </Col>
                                        <Col
                                        column={3}
                                        ignoreScreenSize
                                        withPadding
                                        >
                                            <small>
                                                Trayek
                                            </small>
                                            <small>
                                                <b>
                                                    {_schedule.trajectCode}
                                                </b>
                                            </small>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col
                                column={4}
                                >
                                    <Row
                                    verticalCenter
                                    center
                                    >
                                        <Col
                                        column={2}
                                        ignoreScreenSize
                                        withPadding
                                        >
                                            <p>
                                                <small>
                                                    Asal
                                                </small>
                                            </p>
                                            <b>
                                                <small>
                                                    {_schedule.originName}
                                                </small>
                                            </b>
                                            <small
                                            style={{
                                                fontSize : '.75rem',
                                                display : 'block'
                                            }}
                                            >
                                                {dateFilter.getFullDate(new Date(_schedule.departureDate))} {_schedule.estimatedTime ? _schedule.estimatedTime.substr(0,5) + ` WIB` : null}
                                            </small>
                                        </Col>
                                        <Col
                                        column={2}
                                        ignoreScreenSize
                                        style={{
                                            justifyContent : 'center',
                                            display : 'flex'
                                        }}
                                        withPadding
                                        >
                                            <p>
                                                <BsArrowRight
                                                size={22}
                                                />
                                            </p>
                                        </Col>
                                        <Col
                                        column={2}
                                        ignoreScreenSize
                                        withPadding
                                        alignEnd
                                        >
                                            <p>
                                                <small>
                                                    Tujuan
                                                </small>
                                            </p>
                                            <b
                                            style={{
                                                textAlign : 'end'
                                            }}
                                            >
                                                <small>
                                                    {_schedule.destinationName}
                                                </small>
                                            </b>
                                            <small
                                            style={{
                                                fontSize : '.75rem',
                                                textAlign : 'right'
                                            }}
                                            >
                                                {/* {dateFilter.getFullDate(new Date(_schedule.arrivalDate))} {_schedule.arrivalTime ? _schedule.tripDuration !== '00:00:00' ? `${_schedule.arrivalTime.substr(0,5)} ${_schedule.arrivalTimeZone} (${dateFilter.getDurationFromTimeFormat(_schedule.tripDuration)})` : '-' : null} */}
                                            </small>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        )}
                        >
                            {
                                _passengers.map((passenger, key) => {
                                    if (key < _totalPassengers) {
                                        return (
                                            <Row
                                            key={key}
                                            withPadding
                                            style={{
                                                position : 'relative'
                                            }}
                                            >
                                                {
                                                    (!_selectedSeats[key] && _schedule.trajectTypeCategory !== 'COMMUTER') && (
                                                        <div
                                                        style={{
                                                            position : 'absolute',
                                                            width : '100%',
                                                            height : '100%',
                                                            top : 0,
                                                            left : 0,
                                                            backgroundColor : 'black',
                                                            opacity : .25,
                                                            zIndex : 99,
                                                            display : 'flex',
                                                            alignItems : 'center',
                                                            justifyContent : 'center'
                                                        }}
                                                        >
                                                            <h2
                                                            style={{
                                                                color : 'white'
                                                            }}
                                                            >
                                                                <i>
                                                                    Pilih Kursi
                                                                </i>
                                                            </h2>
                                                        </div>
                                                    )
                                                }
                                                <Col
                                                column={6}
                                                withPadding
                                                >
                                                    <b>
                                                        Penumpang {key + 1}{_selectedSeats[key] ? ` | Kursi ${_selectedSeats[key]}` : ''}
                                                    </b>
                                                </Col>
                                                <Col
                                                column={3}
                                                mobileFullWidth
                                                withPadding
                                                >
                                                    <Input
                                                    title={'Titel Penumpang'}
                                                    value={_passengers[key].title}
                                                    note={'wajib diisi'}
                                                    suggestions={PASSENGER_TITLES}
                                                    onSuggestionSelect={(suggestion) => {
                                                        _updatePassengersData(key, {
                                                            age : suggestion.value.split('-')[0],
                                                            gender : suggestion.value.split('-')[1],
                                                            title : suggestion.title
                                                        })
                                                    }}
                                                    marginBottom
                                                    />
                                                </Col>
                                                <Col
                                                column={3}
                                                mobileFullWidth
                                                withPadding
                                                >
                                                    <Input
                                                    title={`Nama Penumpang`}
                                                    value={_passengers[key].name}
                                                    note={'wajib diisi'}
                                                    capitalize={'words'}
                                                    onChange={name => _updatePassengersData(key, { name })}
                                                    marginBottom
                                                    />
                                                </Col>
                                                <Col
                                                column={3}
                                                mobileFullWidth
                                                withPadding
                                                >
                                                    <Input
                                                    title={'Telepon Penumpang'}
                                                    value={_passengers[key].phoneNumber}
                                                    note={'wajib diisi'}
                                                    type={'tel'}
                                                    onChange={phoneNumber => _updatePassengersData(key, { phoneNumber })}
                                                    marginBottom
                                                    />
                                                </Col>
                                                <Col
                                                column={3}
                                                mobileFullWidth
                                                withPadding
                                                >
                                                    <Input
                                                    title={'NIK Penumpang'}
                                                    value={_passengers[key].identity}
                                                    note={_passengers[key].age === 'CHILD' ? 'opsional' : 'opsional'}
                                                    type={'number'}
                                                    onChange={identity => _updatePassengersData(key, { identity })}
                                                    marginBottom
                                                    />
                                                </Col>
                                            </Row>
                                        )
                                    }
                                })
                            }
                            {/* <div>
                                <pre
                                style={{
                                    overflow : 'scroll',
                                    maxWidth : '300px'
                                }}
                                >
                                    {JSON.stringify(_schedule, null, 2)}
                                </pre>
                            </div> */}

                        </Card>
                        <Card>
                            <Row
                            marginBottom
                            >
                                <b>
                                    Rincian Pembayaran
                                </b>
                            </Row>
                            <Col
                            withPadding
                            className={styles.payment_summary}
                            marginBottom
                            >
                                <Row
                                marginBottom
                                verticalCenter
                                >
                                    <Col>
                                        <small>
                                            Harga Tiket per Penumpang
                                        </small>
                                    </Col>
                                    <Col
                                    justifyEnd
                                    >
                                        <small
                                        style={{
                                            textAlign : 'end'
                                        }}
                                        >
                                            <b>
                                                {currency(_schedule.fare, 'Rp ')}
                                            </b>
                                        </small>
                                    </Col>
                                </Row>
                                <Row
                                marginBottom
                                >
                                    <Col>
                                        <small>
                                            Jumlah Penumpang
                                        </small>
                                    </Col>
                                    <Col
                                    justifyEnd
                                    >
                                        <small
                                        style={{
                                            textAlign : 'end'
                                        }}
                                        >
                                            <b>
                                                {_totalPassengers}
                                            </b>
                                        </small>
                                    </Col>
                                </Row>
                                <Row
                                className={styles.payment_total}
                                >
                                    <Col>
                                        <small>
                                            Total Bayar
                                        </small>
                                    </Col>
                                    <Col
                                    justifyEnd
                                    >
                                        <small
                                        style={{
                                            textAlign : 'end'
                                        }}
                                        >
                                            <b>
                                                {currency(_totalPassengers * _schedule.fare, 'Rp ')}
                                            </b>
                                        </small>
                                    </Col>
                                </Row>
                            </Col>
                            <Row
                            marginBottom
                            >
                                <b>
                                    Pilih Metode Pembayaran
                                </b>
                            </Row>
                            <Row
                            marginBottom
                            >
                                {
                                    _paymentMethods.map((paymentMethod, key) => {
                                        return (
                                            <Col
                                            key={key}
                                            column={3}
                                            withPadding
                                            mobileFullWidth
                                            style={{
                                                display: paymentMethod.name == "full-reschedule" ? "none" : 'block'
                                            }}
                                            >
                                                <div
                                                className={generateClasses([
                                                    styles.payment_method,
                                                    key === _selectedPaymentMethod && styles.selected,
                                                    styles.grid
                                                ])}
                                                onClick={() => {
                                                    _setSelectedPaymentMethod(key)

                                                    if(_paymentMethods[key].category != "debit" && _paymentMethods[key].category != "kredit"){
                                                        _setIssuerBank({
                                                            value: "",
                                                            title: ""
                                                        })
                                                    }
                                                }}
                                                >
                                                    <div
                                                    style={{"display": 'flex'}}
                                                    >
                                                        <img
                                                        src={paymentMethod.imageUrl}
                                                        />
                                                        {
                                                            paymentMethod.category === 'deposit' && (
                                                                <Col> 
                                                                    <small
                                                                    style={{
                                                                        "marginRight": '1rem'
                                                                    }}
                                                                    >
                                                                        Saldo tersedia 
                                                                        <i
                                                                        style={{
                                                                            marginLeft : '1rem'
                                                                        }}
                                                                        onClick={(e) => {
                                                                            _setShowBalance(!_showBalance)
                                                                            if (!e) e = window.event
                                                                            e.cancelBubble = true
                                                                            if (e.stopPropagation) e.stopPropagation()
                                                                        }}
                                                                        >
                                                                            <b>
                                                                                {_showBalance ? 'tutup' : 'lihat'}
                                                                            </b>
                                                                        </i>

                                                                    </small>
                                                                    {
                                                                        _showBalance && (
                                                                            <b>
                                                                                <small>
                                                                                    {currency(paymentMethod.balance, 'Rp ')}
                                                                                </small>
                                                                            </b>
                                                                        )
                                                                    }
                                                                </Col>
                                                            )
                                                        }
                                                        <b>
                                                            {paymentMethod.label}
                                                        </b>
                                                    </div>
                                                    
                                                    {
                                                        (paymentMethod.category == "debit" || paymentMethod.category == "kredit") && (
                                                            <div
                                                            style={{
                                                                "display": key === _selectedPaymentMethod ? '' : 'none'
                                                            }}
                                                            >
                                                                <Input
                                                                withMargin
                                                                placeholder={'Pilih Bank'}
                                                                value={_issuerBank.title}
                                                                suggestions={_bankRange}
                                                                suggestionField={'title'}
                                                                onSuggestionSelect={(value) => {
                                                                    _setIssuerBank(value)
                                                                }}
                                                                />
                                                            </div>
                                                        )
                                                    }

                                                   

                                                </div>
                                            </Col>
                                        )
                                    })
                                }
                            </Row>
                            <Row
                            flexEnd
                            >
                                <Col
                                column={3}
                                withPadding
                                alignEnd
                                >
                                    <Button
                                    title={_isComplete() ? 'Lanjutkan' : 'Lengkapi data penumpang'}
                                    disabled={!_isComplete() || _selectedPaymentMethod < 0}
                                    styles={Button.secondary}
                                    onProcess={_isCreatingTransaction}
                                    tooltip={_selectedPaymentMethod < 0 ? 'Pilih Metode Pembayaran' : false}
                                    onClick={_orderTicket}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </AdminLayout>
        </Main>
    )

}