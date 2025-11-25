import { useState, useEffect, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from './TicketListModal.module.scss'
import { dateFilter } from '../../utils/filters'

TicketListModal.defaultProps = {
    visible : false,
    closeModal : null,
    trip : {
    },
    tickets : [],
    refreshData : () => false,
    visibleForm: true,
    visibleTable: true,
    visibleEdit: false,
    visibleReport: false
}

export default function TicketListModal(props = TicketListModal.defaultProps) {

    const appContext = useContext(AppContext)

    const [_ticketNumber, _setTicketNumber] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isValidate, _setIsValidate]= useState(false)

    useEffect(() => {
        console.log(_isValidate)
        console.log(props)
    }, [])

    useEffect(() => {
        if (props.visible) {
            _setInputFocus()
        }
    }, [props.visible])

    function _setInputFocus() {
        document.getElementsByTagName('input')[0].focus()
    }

    async function _validateTicket() {
        _setIsProcessing(true)
        _setIsValidate(true)

        console.log("is validate")
        console.log(_isValidate)

        let parsedTicket = _ticketNumber.split("/tickets/")

        if(parsedTicket.length > 1){
            parsedTicket = parsedTicket[1]
        }else{
            parsedTicket = parsedTicket[0]
        }

        try {
            await postJSON('/keuangan/setoran/commuter/detail/tiket/validasi', { ticket : parsedTicket }, appContext.authData.token)
            popAlert({ message : 'Tiket Valid', type : 'success' })
            props.refreshData(true)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
            _setInputFocus()
            _setTicketNumber('')
            props.refreshData(true)
        }
    }

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : `Tiket`,
                closeModal : props.closeModal
            }}
            >   
                <div className={styles.trip_info}>{props.trip.trajectName}</div>

                {
                    props.visibleForm && (
                        <form
                        style={{
                            position : 'sticky',
                            top : 0,
                            zIndex : 9999,
                            backgroundColor: "#ffff"
                        }}
                        onSubmit={e => {
                            e.preventDefault()
                            _validateTicket()
                        }}
                        action={'.'}
                        >
                            <Row>
                                <Col
                                column={4}
                                withPadding
                                >
                                    <Input
                                    placeholder='Input Manual / Atau Scan QRCode'
                                    onChange={(value) => _setTicketNumber(value)}
                                    value={_ticketNumber}
                                    autoFocus={true}
                                    />
                                </Col>
                                <Col
                                column={2}
                                withPadding
                                >
                                    <Button
                                    title={'Validasi'}
                                    onClick={_validateTicket}
                                    onProcess={_isProcessing}
                                    />
                                </Col>
                            </Row>
                        </form>
                    )
                }
                
                {
                    _isValidate && (
                        <Table
                        columns={[
                            {
                                field : 'name',
                                title : 'Nama',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'phoneNumber',
                                title : 'Telepon',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'ticket',
                                title : 'No.Tiket'
                            },
                            {
                                field : 'bookingCode',
                                title : 'Kode Booking'
                            },
                            {
                                field : 'departureDate',
                                title : 'Tanggal Keberangkatan',
                                customCell : (value) => {
                                    const date = new Date(value)
                                    return dateFilter.getMonthDate(date)
                                }
                            },
                            {
                                field : 'validatedBy',
                                title : 'Petugas'
                            },
                            {
                                field : 'validatedBy',
                                title : 'Status',
                                customCell : (value) => {
                                    if(value != null){
                                        return (
                                            <div
                                            className={styles.label_success}
                                            >
                                                Valid
                                            </div>
                                        )
                                    }else{
                                        return ''
                                    }
                                    
                                }
                            }
                        ]}
                        records={props.tickets}
                        />
                    )
                }

                {
                    props.visibleReport && (
                        <Table
                        headExport={[
                            {
                                title: 'Nama',
                                value: "name"
                            },
                            {
                                title: 'Telepon',
                                value: "phoneNumber"
                            },
                            {
                                title: 'No Tiket',
                                value: 'ticket'
                            },
                            {
                                title: 'Kode Booking',
                                value: "bookingCode"
                            },
                            {
                                title: 'Tanggal Keberangkatan',
                                value: "departureDate"
                            },
                            {
                                title: 'Petugas Setoran',
                                value: "validatedBy"
                            },
                            {
                                title: 'Petugas Loket',
                                value: "officer"
                            },
                            {
                                title: 'Pembayaran',
                                value: "pembayaran"
                            }
                        ]}
                        columns={[
                            {
                                field : 'name',
                                title : 'Nama',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'phoneNumber',
                                title : 'Telepon',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'ticket',
                                title : 'No.Tiket'
                            },
                            {
                                field : 'bookingCode',
                                title : 'Kode Booking'
                            },
                            {
                                field : 'departureDate',
                                title : 'Tanggal Keberangkatan',
                                customCell : (value) => {
                                    const date = new Date(value)
                                    return dateFilter.getMonthDate(date)
                                }
                            },
                            {
                                field : 'validatedBy',
                                title : 'Petugas Setoran'
                            },
                            {
                                field : 'officer',
                                title : 'Petugas Loket'
                            },
                            {
                                field : 'validatedBy',
                                title : 'Status',
                                customCell : (value) => {
                                    if(value != null){
                                        return (
                                            <div
                                            className={styles.label_success}
                                            >
                                                Valid
                                            </div>
                                        )
                                    }else{
                                        return ''
                                    }
                                    
                                }
                            }
                        ]}
                        records={props.tickets}
                        />
                    )
                }

                {
                    props.visibleEdit && (
                        <Table
                        columns={[
                            {
                                field : 'name',
                                title : 'Nama 2',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'phoneNumber',
                                title : 'Telepon',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'ticket',
                                title : 'No.Tiket'
                            },
                            {
                                field : 'bookingCode',
                                title : 'Kode Booking'
                            },
                            {
                                field : 'departureDate',
                                title : 'Tanggal Keberangkatan',
                                customCell : (value) => {
                                    const date = new Date(value)
                                    return dateFilter.getMonthDate(date)
                                }
                            },
                            {
                                field : 'validatedBy',
                                title : 'Petugas'
                            },
                            {
                                field : 'validatedBy',
                                title : 'Status',
                                customCell : (value) => {
                                    if(value != null){
                                        return (
                                            <div
                                            className={styles.label_success}
                                            >
                                                Valid
                                            </div>
                                        )
                                    }else{
                                        return ''
                                    }
                                    
                                }
                            }
                        ]}
                        records={props.tickets}
                        />
                    )
                }
                
            </ModalContent>
        </Modal>
    )

}