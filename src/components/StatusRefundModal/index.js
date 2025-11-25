import { useContext, useEffect, useState } from 'react'

import { TICKET_ORDER_URL, API_ENDPOINT, get, objectToParams, postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Tabs from '../Tabs'
import Table from '../Table'
import { currency, dateFilter } from '../../utils/filters'
import { popAlert } from '../Main'
import { Col, Row } from '../Layout'
import ActivityIndicator from '../ActivityIndicator'
import Input from '../Input'
import { FaRust } from 'react-icons/fa'

StatusRefundModal.defaultProps = {
    visible: false,
    closeModal: null,
    data: [],
    responseTransfer: []
}

export default function StatusRefundModal(props = StatusRefundModal.defaultProps){
 
    const [_dataTransfer, _setDataTransfer] = useState([])

    useEffect(() => {
        if(props.data.length > 0 && props.data){
            _setDataTransfer(props.data)
        }
    }, [props.data])
    
    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        extraLarge
        centeredContent
        >

            <ModalContent
            header={{
                title : 'Status Transfer Dana',
                closeModal : props.closeModal
            }}
            >

                <Table
                columns={[
                    {
                        title : 'Tiket',
                        field : 'partnerTicket',
                    },
                    {
                        title : 'No Rekening',
                        field : 'accountNumber',
                    },
                    {
                        title : 'Nama Rekening',
                        field : 'accountName',
                    },
                    {
                        title: 'Bank',
                        field: 'bankName'
                    },
                    {
                        title: 'Keterangan',
                        field: 'message'
                    },
                ]}
                records={_dataTransfer}
                />

            </ModalContent>
        </Modal>
    )
}