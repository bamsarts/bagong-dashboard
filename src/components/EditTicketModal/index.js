import { useState, useEffect, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from '../TicketListModal/TicketListModal.module.scss'
import { dateFilter } from '../../utils/filters'

EditTicketModal.defaultProps = {
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

export default function EditTicketModal(props = EditTicketModal.defaultProps) {

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : `Edit Tiket`,
                closeModal : props.closeModal
            }}
            >   
                <div className={styles.trip_info}>{props.trip.trajectName}</div>
                
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
                        field : 'pembayaran',
                        title : 'Metode Bayar'
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

                <div
                className={styles.text_center}
                >
                    {
                        !props.tickets[0]?.trip && (
                            <span>Memuat Data</span>
                        )
                    }
                </div>

            </ModalContent>
        </Modal>
    )

}