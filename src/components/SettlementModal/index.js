import { useState } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import Button from '../Button'
import { dateFilter } from '../../utils/filters'

const defaultProps = {
    visible: false,
    onClose: () => {},
    onSubmit: () => {},
    isProcessing: false,
    initialData: null
}

SettlementModal.defaultProps = defaultProps

export default function SettlementModal(props = defaultProps) {
    const [formData, setFormData] = useState({
        companyId: props.initialData?.company_id || '',
        trajectId: props.initialData?.traject_id || '',
        paymentType: props.initialData?.payment_type || '',
        transactionDate: props.initialData?.transaction_date ? dateFilter.basicDate(new Date(props.initialData.transaction_date)).normal : dateFilter.basicDate(new Date()).normal,
        transactionAmount: props.initialData?.transaction_amount || 0,
        transferDate: dateFilter.basicDate(new Date()).normal,
        transferAmount: 0,
        paymentProofLink: ''
    })

    const handleInputChange = (value, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = () => {
        const submitData = {
            companyId: parseInt(formData.companyId),
            trajectId: parseInt(formData.trajectId),
            paymentType: formData.paymentType,
            transactionDate: formData.transactionDate,
            transactionAmount: parseFloat(formData.transactionAmount),
            transferDate: formData.transferDate,
            transferAmount: parseFloat(formData.transferAmount),
            paymentProofLink: formData.paymentProofLink
        }
        props.onSubmit(submitData)
    }

    const handleClose = () => {
        setFormData({
            companyId: '',
            trajectId: '',
            paymentType: '',
            transactionDate: dateFilter.basicDate(new Date()).normal,
            transactionAmount: 0,
            transferDate: dateFilter.basicDate(new Date()).normal,
            transferAmount: 0,
            paymentProofLink: ''
        })
        props.onClose()
    }

    return (
        <Modal
            visible={props.visible}
            onBackdropClick={handleClose}
            large
        >
            <ModalContent
                header={{
                    title: 'Settlement Form',
                    closeModal: handleClose
                }}
                actions={[
                    <Button
                        key="cancel"
                        title="Cancel"
                        onClick={handleClose}
                        disabled={props.isProcessing}
                    />,
                    <Button
                        key="submit"
                        title="Submit Settlement"
                        onClick={handleSubmit}
                        onProcess={props.isProcessing}
                    />
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        title="Company ID"
                        field="companyId"
                        type="number"
                        value={formData.companyId}
                        onChange={handleInputChange}
                        placeholder="Enter company ID"
                        required
                    />
                    
                    <Input
                        title="Traject ID"
                        field="trajectId"
                        type="number"
                        value={formData.trajectId}
                        onChange={handleInputChange}
                        placeholder="Enter traject ID"
                        required
                    />
                    
                    <Input
                        title="Payment Type"
                        field="paymentType"
                        value={formData.paymentType}
                        onChange={handleInputChange}
                        placeholder="Enter payment type"
                        required
                    />
                    
                    <Input
                        title="Transaction Date"
                        field="transactionDate"
                        type="date"
                        value={formData.transactionDate}
                        onChange={handleInputChange}
                        required
                    />
                    
                    <Input
                        title="Transaction Amount"
                        field="transactionAmount"
                        type="number"
                        value={formData.transactionAmount}
                        onChange={handleInputChange}
                        placeholder="Enter transaction amount"
                        required
                    />
                    
                    <Input
                        title="Transfer Date"
                        field="transferDate"
                        type="date"
                        value={formData.transferDate}
                        onChange={handleInputChange}
                        required
                    />
                    
                    <Input
                        title="Transfer Amount"
                        field="transferAmount"
                        type="number"
                        value={formData.transferAmount}
                        onChange={handleInputChange}
                        placeholder="Enter transfer amount"
                        required
                    />
                    
                    <Input
                        title="Payment Proof Link"
                        field="paymentProofLink"
                        value={formData.paymentProofLink}
                        onChange={handleInputChange}
                        placeholder="Enter payment proof link"
                        required
                    />
                </div>
            </ModalContent>
        </Modal>
    )
}