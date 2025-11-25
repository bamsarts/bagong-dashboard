import { useState, useEffect, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from './ReportSalesModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'
import generateClasses from '../../utils/generateClasses'

ReportSalesModal.defaultProps = {
    visible : false,
    closeModal : null,
    rowInfo : {},
    report: [],
}

export default function ReportSalesModal(props = ReportSalesModal.defaultProps) {

    const appContext = useContext(AppContext)

    useEffect(() => {
       
    }, [])

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : ``,
                closeModal : props.closeModal
            }}
            >   
                <Row>
                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div className={styles.border_right}>
                            <span>Counter</span>
                            <strong>{props.rowInfo.counterName}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div className={styles.border_right}>
                            <span>Tanggal</span>
                            <strong>{dateFilter.getMonthDate(new Date(props.rowInfo.dateTransaction))}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div className={styles.border_right}>
                            <span>Total Nominal</span>
                            <strong>{currency(props.rowInfo.totalAmount, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div className={styles.border_right}>
                            <span>Status Transaksi</span>
                            <strong>{props.rowInfo.status ? 'Selesai' : 'Belum Selesai'}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div className={styles.border_right}>
                            <span>Sudah Disetor</span>
                            <strong>{props.report.totalTrxDeposit}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div className={styles.border_right}>
                            <span>Belum Disetor</span>
                            <strong>{props.report.totalTrxNotDeposit}</strong>    
                        </div> 
                    </Col>
                </Row>

                <Table
                columns={[
                    {
                        field : 'originName',
                        title : 'Asal',
                        textAlign: 'left',
                        customCell : (value) => {
                            return value || '-'
                        }
                    },
                    {
                        field : 'destinationName',
                        title : 'Tujuan',
                        textAlign: 'left',
                    },
                    {
                        field : 'ticket',
                        title : 'Tiket',
                        textAlign: 'left',
                    },
                    {
                        field : 'baseFare',
                        title : 'Harga Tiket (Rp)',
                        textAlign: 'right',
                        customCell : (value) => currency(value, '')
                    },
                    {
                        field : 'pembayaran',
                        title : 'Metode Bayar',
                    },
                    {
                        field : 'pembayaranDetail',
                        title : 'Bank',
                        textAlign: 'left',
                        customCell: (value) => value == null ? '-' : value
                    },
                    {
                        field : 'depositAt',
                        title : 'Tanggal Setoran',
                        customCell : (value) => {
                            if(value != null){
                                const date = new Date(value)
                                return dateFilter.getMonthDate(date)
                            }else{
                                return ''
                            }
                        }
                    },
                    {
                        field : 'officer',
                        title : 'Petugas'
                    },
                    {
                        field : 'busName',
                        title : 'Kode Bus',
                        customCell : (value) => {
                            return value || '-'
                        }
                    },
                    {
                        field : 'busCrewName',
                        title : 'Crew',
                        customCell : (value) => {
                            return value || '-'
                        }
                    }
                ]}
                records={props.report.data}
                />
                  
            </ModalContent>
        </Modal>
    )

}