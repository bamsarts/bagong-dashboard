import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import styles from './TopupDetailModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import Datepicker from '../Datepicker'
import { dateFilter, currency } from '../../utils/filters'
import { Col, Row } from '../Layout'

const defaultProps = {
    visible : false,
    closeModal : null,
    data: {}
}

TopupDetailModal.defaultProps = defaultProps

export default function TopupDetailModal(props = defaultProps) {

    return (
        <Modal
        visible={props.data?.id}
        centeredContent
        >
            <ModalContent
            header={{
                title: "Detail Topup",
                closeModal: props.closeModal
            }}
            >   
                <div
                className={styles.container}
                >
                    <div>
                        <strong>Nominal</strong>
                        <span>
                            Rp{currency(props.data.amountTotal)}
                        </span>
                    </div>
                    <div>
                        <strong>Bank Pengirim</strong>
                        <aside>
                            <span>{props.data.originAccBank}</span>
                            <span>
                                {props.data.originAccName} - {props.data.originAccNumber}
                            </span>
                        </aside>
                    </div>
                    <div>
                        <strong>Bank Penerima</strong>
                        <aside>
                            <span>{props.data.destinationAccBank}</span>
                            <span>
                                {props.data.destinationAccName} - {props.data.destinationAccNumber}
                            </span>
                        </aside>
                    </div>

                    {
                        props.data.evidenceOfTransfer != null && (
                            <div>
                                <strong>Bukti Pembayaran</strong>
                                <a 
                                target="_blank" 
                                href={props.data.evidenceOfTransfer}
                                >
                                    Download
                                </a>
                            </div>
                        )
                    }
                    

                    {
                        props.data.dateApproved != null && (
                            <>
                                <div>
                                    <strong>Nominal Disetujui</strong>
                                    <span>
                                        Rp{currency(props.data.amountApproved)}
                                    </span>
                                </div>
                                <div>
                                    <strong>Tanggal Disetujui</strong>
                                    <span>
                                        {dateFilter.getFullDate(new Date(props.data.dateApproved))}
                                    </span>
                                </div>
                            </>
                        )
                    }
                </div>
                

            </ModalContent>
        </Modal>
    )
}
