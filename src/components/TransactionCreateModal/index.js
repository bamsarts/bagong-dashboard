import { useContext, useEffect, useState } from 'react'
import { BsArrowRight, BsFillExclamationTriangleFill, BsPrinterFill, BsTriangleFill } from 'react-icons/bs'

import AppContext from '../../context/app'
import { API_ENDPOINT, postJSON } from '../../api/utils'

import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Button from '../Button'
import { popAlert } from '../Main'

import { currency, dateFilter } from '../../utils/filters'

import styles from './TransactionCreateModal.module.scss'

TransactionCreateModal.defaultProps = {
    visible : false,
    closeModal : null,
    onCancel : null,
    schedule : null,
    transaction : null,
    penalty: {
        fine: 0,
        amount: 0
    }
}

export default function TransactionCreateModal(props = TransactionCreateModal.defaultProps) {
    
    const appContext = useContext(AppContext)

    const [_isCanceling, _setIsCanceling] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isExpired, _setIsExpired] = useState("")
    const [_timer, _setTimer] = useState("")
    const [_linkRedirectTicket, _setLinkRedirectTicket] = useState("")

    async function _cancelTransaction() {
        _setIsCanceling(true)
        try {
            const result = await postJSON({ url : API_ENDPOINT.ticketOrder + '/dashboard/ticket/cancel/v2' }, {
                partnerBookingCode : props.transaction.partnerBookingCode,
                transactionId : props.transaction.id

            }, appContext.authData.token)

            props.onCancel()
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setIsCanceling(false)
        }
    }

    async function _doPayment() {
        _setIsProcessing(true)
        try {
            const result = await postJSON({ url : API_ENDPOINT.ticketOrder + '/dashboard/transaction/payment' }, {
                bookingCode : props.transaction.bookingCode,
                partnerBookingCode : props.transaction.partnerBookingCode,
                transactionType : props.schedule.trajectTypeCategory,
                transactionId : props.transaction.id

            }, appContext.authData.token)

            if(!result.data){
                popAlert({ message : result.message['id'] })

                setTimeout(() => {
                    window.location.reload()
                }, 3000);
            }else{

                window.open(`/admin/ticket-order/ticket/${props.transaction.transactionType}*${props.transaction.id}?issuer=${props.transaction.orderData.issuer}`,'_blank');
                
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            }
        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setIsProcessing(false)
        }
    }

    function _setDestinationTime(){

        let time = ""

        if(props.schedule.arrivalDate != null){
            time += dateFilter.getFullDate(new Date(props.schedule.arrivalDate))
        }

        if(props.schedule.arrivalTime){
            if(props.schedule.tripDuration !== "00:00:00"){
                time += props.schedule?.arrivalTime.substr(0,5) + " " + props.schedule.arrivalTimeZone + " " + dateFilter.getDurationFromTimeFormat(props.schedule.tripDuration)
            }else {
                time += "-"
            }
        }

        return time
    }

    function _countdown(date){
        var x = setInterval(function() {

            // Get today's date and time
            var now = new Date().getTime();
                
            // Find the distance between now and the count down date
            var distance = date - now;
                
            // Time calculations for days, hours, minutes and seconds
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            let timer = ""

            if(days > 0){
                timer += days + " Hari "
            }

            if(hours > 0){
                timer += hours + " Jam " 
            }

            if(minutes > 0){
                timer += minutes + " Menit "
            }

            if(seconds >= 0){
                timer += seconds + " Detik "
            }

            _setTimer(timer)
            
            // If the count down is over, write some text 
            if (distance < 0) {
                clearInterval(x);
                _setIsExpired("Expired")
            }
        }, 1000);
    }

    useEffect(() => {
        console.log(props.transaction)
        if(props.transaction?.partnerBookingCode){
            _countdown(props.transaction.validUntil)
        }
    }, [props.transaction])

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        large
        centeredContent
        >
            <ModalContent
            header={{
                title : `Transaksi ${props.transaction?.partnerBookingCode}`,
                closeModal : props.closeModal
            }}
            >
                <Row
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
                                    {props.schedule.busName}
                                </h3>
                                <small>
                                    <b>
                                        {props.schedule.busCategoryName}
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
                                        {props.schedule.trajectCode}
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
                                        {props.schedule.originName}
                                    </small>
                                </b>
                                <small
                                style={{
                                    fontSize : '.75rem',
                                    display : 'block'
                                }}
                                >
                                    {dateFilter.getFullDate(new Date(props.schedule.departureDate))} {props.schedule.estimatedTime ? props.schedule.estimatedTime.substr(0,5) + ` ${props.schedule.departureTimeZone == null ? "" : props.schedule.departureTimeZone}` : ""}
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
                                        {props.schedule.destinationName}
                                    </small>
                                </b>
                                <small
                                style={{
                                    fontSize : '.75rem',
                                    textAlign : 'right'
                                }}
                                >
                                    
                                    {
                                        _setDestinationTime()
                                    }
                                    
                                </small>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                
                <Col
                withPadding
                className={styles.passenger_detail}
                >
                    <p>Penumpang</p>

                    <div>
                    
                    {
                        props.transaction?.orderData.passengerDetails.map(function(val, key){
                            return(
                                <div
                                key={key}
                                >
                                    <h6>{val.name}</h6>
                                    <div>
                                        <span>KURSI</span>
                                        <strong>{val.seatNumber}</strong>
                                    </div>
                                </div>
                            )
                        })
                    }   

                    </div>
                </Col>

                <Col
                withPadding
                className={styles.payment_summary}
                marginBottom
                >
                    <Row
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
                                    {currency(props.schedule.fare, 'Rp ')}
                                </b>
                            </small>
                        </Col>
                    </Row>

                    <Row>
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
                                    {props.transaction?.orderData.totalPassenger}
                                </b>
                            </small>
                        </Col>
                    </Row>
                    
                    {
                        props.penalty.amount > 0 && (
                            <Row>
                                <Col>
                                    <small>
                                        Denda Reschedule ({props.penalty.fine}%)
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
                                            -Rp{currency(props.penalty.amount)}
                                        </b>
                                    </small>
                                </Col>
                            </Row>
                        )
                    }
                    

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
                                    {currency((props.transaction?.orderData.totalPassenger * props.schedule.fare) - props.penalty.amount, 'Rp ')}
                                </b>
                            </small>
                        </Col>
                    </Row>
                </Col>

                <Row
                className={styles.payment_method}
                marginBottom
                >
                    <Col>
                        <small>
                            Metode pembayaran yang digunakan
                        </small>
                    </Col>
                    <Col
                    column={3}
                    alignEnd
                    >
                        <b>
                            {props.transaction?.paymentLabel}
                        </b>
                    </Col>
                    <Col
                    column={3}
                    >
                    
                    </Col>
                </Row>
                {
                    props.transaction?.paymentLabel === 'QRIS' && (
                        <div
                        className={styles.qris_wrapper}
                        >
                            <img
                            src={props.transaction.paymentData[0].value}
                            />
                        </div>
                    )
                }

                <Row
                marginBottom
                >
                    <Col
                    column={6}
                    >
                        <small>Batas Waktu Pembayaran</small>

                        <div
                        style={{
                            marginTop: ".5rem"
                        }}
                        >
                            <span>{_timer}</span>
                        </div>

                        <span>{_isExpired}</span>
                    </Col>
                </Row>

                <Row
                className={styles.payment_alert}
                marginBottom
                >
                    <BsFillExclamationTriangleFill
                    color={'orange'}
                    />
                    &nbsp;&nbsp;&nbsp;
                    <p>
                        Silakan selesaikan pembayaran sebelum Cetak Tiket
                    </p>
                </Row>

                <Row
                spaceBetween
                marginBottom
                >
                    <Col
                    column={2}
                    mobileFullWidth
                    withPadding
                    >
                        {/* {
                            !_isProcessing && (
                                <Button
                                title={'Batal'}
                                styles={Button.medium_dark}
                                onProcess={_isCanceling || _isProcessing}
                                onClick={_cancelTransaction}
                                fluidWidth
                                />
                            )
                        } */}
                    </Col>
                    <Col
                    column={2}
                    mobileFullWidth
                    withPadding
                    >
                        <Button
                        title={'Cetak Tiket'}
                        icon={<BsPrinterFill/>}
                        styles={Button.secondary}
                        onProcess={_isProcessing}
                        onClick={_doPayment}
                        fluidWidth
                        />

                        <a
                        href={_linkRedirectTicket}
                        target={"_blank"}
                        style={{
                            display: "none"
                        }}    
                        id={"linkRedirectTicket"}
                        >
                        </a>
                    </Col>
                </Row>

               
               
            </ModalContent>
        </Modal>
    )

}