import { useState, useEffect } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import Button from '../Button'
import { currency, dateFilter } from '../../utils/filters'
import styles from './SettlementModal.module.scss'
import { BUCKET } from '../../api/utils'
import { Row, Col } from '../Layout'

const defaultProps = {
    visible: false,
    onClose: () => { },
    onSubmit: () => { },
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

    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [showImageDetail, setShowImageDetail] = useState(false)

    const handleInputChange = (value, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleFileChange = (event, field) => {
        const file = event.target.files[0]
        if (file) {
            // Validate file type (only images)
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file only')
                return
            }
            setSelectedFile(file)

            // Create preview URL
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleSubmit = async () => {
        try {
            let paymentProofLink = formData.paymentProofLink

            // If there's a selected file, upload it first
            if (selectedFile) {
                setIsUploading(true)
                const uploadResult = await _uploadS3(selectedFile, 'payment-proofs')
                if (uploadResult && uploadResult.key) {
                    paymentProofLink = BUCKET + uploadResult.key
                }
                setIsUploading(false)
            }

            const submitData = {
                companyId: parseInt(formData.companyId),
                trajectId: parseInt(formData.trajectId),
                paymentType: formData.paymentType,
                transactionDate: formData.transactionDate,
                transactionAmount: parseFloat(formData.transactionAmount),
                transferDate: formData.transferDate,
                transferAmount: parseFloat(formData.transferAmount),
                paymentProofLink: paymentProofLink
            }

            props.onSubmit(submitData)
        } catch (error) {
            console.error('Error submitting settlement:', error)
            setIsUploading(false)
        }
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
        setSelectedFile(null)
        // Clean up preview URL to prevent memory leaks
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        props.onClose()
    }

    async function _uploadS3(file, folder = "") {
        setIsUploading(true)

        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", folder)

            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            return data

        } catch (e) {
            console.error('Upload error:', e.message)
            alert('Upload failed: ' + e.message)
            throw e
        } finally {
            setIsUploading(false)
        }
    }

    useEffect(() => {
        if (props.visible) {
            
            let transfer = props.initialData?.transfer_amount

            if(props.initialData?.status != "CREATED"){
                if(props.initialData?.payment_type == "cash"){
                    transfer = props.initialData?.fee_amount
                }else{
                    transfer = props.initialData?.odt
                }
            }

            setFormData({
                companyId: props.initialData?.company_id || '',
                trajectId: props.initialData?.traject_id || '',
                paymentType: props.initialData?.payment_type || '',
                transactionDate: props.initialData?.transaction_date ? dateFilter.basicDate(new Date(props.initialData.transaction_date)).normal : dateFilter.basicDate(new Date()).normal,
                transactionAmount: props.initialData?.transaction_amount || 0,
                transferDate: dateFilter.basicDate(new Date()).normal,
                transferAmount: transfer,
                paymentProofLink: props.initialData?.payment_proof_link
            })

            setSelectedFile(null)
            setPreviewUrl(props.initialData?.payment_proof_link)
        }
    }, [props.visible])

    // Cleanup effect for preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])


    return (
        <div className={styles.modal_wrapper}>
            <div
                className={`${styles.backdrop} ${props.visible ? styles.visible : ''}`}
                onClick={props.closeModal}
            />
            <div style={{ minWidth: "40%" }} className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`}>

                <ModalContent
                    header={{
                        title: 'Settlement',
                        closeModal: handleClose
                    }}
                    actions={[
                        <Button
                            key="submit"
                            title={(props.initialData?.status == "CREATED" ? 'Ubah' : 'Simpan')}
                            onClick={handleSubmit}
                            onProcess={props.isProcessing || isUploading}
                        />
                    ]}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: "0 .5rem" }}>

                        <Row
                        
                        spaceBetween
                        >
                            <span>Pembayaran</span>
                            <strong>{formData.paymentType.toUpperCase()}</strong>
                        </Row>

                        <Row
                        
                        spaceBetween
                        >
                            <span>Total Transaksi</span>
                            <strong>{currency(formData.transactionAmount, "Rp")}</strong>
                        </Row>

                        <Row
                        
                        spaceBetween
                        >
                            <span>Tanggal {formData.paymentType == "cash" ? "Invoice" : 'Transfer'}</span>
                            <strong>{dateFilter.getMonthDate(new Date(formData.transactionDate))}</strong>
                        </Row>
                        

                        <Input
                            title={"Tanggal " + (formData.paymentType == "cash" ? "Invoice" : 'Transfer')}
                            field="transferDate"
                            type="date"
                            value={formData.transferDate}
                            onChange={handleInputChange}
                            required
                        />

                        <Input
                            title={"Nilai " + (formData.paymentType == "cash" ? "Invoice" : 'Transfer')}
                            field="transferAmount"
                            type="number"
                            value={formData.transferAmount}
                            onChange={handleInputChange}
                            placeholder="Masukkan nominal"
                            required
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span>
                                Bukti {(formData.paymentType == "cash" ? "Invoice" : 'Transfer')}
                            </span>

                            <input
                                field="paymentProofFile"
                                type="file"
                                onChange={handleFileChange}
                                placeholder="Select payment proof image"
                                accept=".jpeg, .jpg, .png, .pdf"
                                required
                            />

                            <div>
                                {previewUrl && (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        backgroundColor: '#f9f9f9'
                                    }}>
                                        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                                            Preview:
                                        </div>
                                        <img
                                            src={previewUrl}
                                            alt="Payment proof preview"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '200px',
                                                objectFit: 'contain',
                                                borderRadius: '4px',
                                                border: '1px solid #eee',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => props.triggerPreviewImage({
                                                "isOpen": true,
                                                "url": previewUrl
                                            })}
                                            title="Click to view full size"
                                        />
                                    </div>
                                )}
                            </div>
                            
                        </div>
                    </div>
                </ModalContent>
            
            </div>

            
        </div>
    )
}