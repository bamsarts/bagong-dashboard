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
    initialData: null,
    roleAccess: null
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
        paymentProofLink: '',
        trajectMasterId: props.initialData?.traject_master_id || '',
    })

    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [showImageDetail, setShowImageDetail] = useState(false)
    const [showTransactionTable, setShowTransactionTable] = useState(false)

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
                // trajectId: parseInt(formData.trajectId),
                trajectMasterId: parseInt(formData.trajectMasterId),
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
            trajectMasterId: '',
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

            if (props.initialData?.status != "CREATED") {
                if (props.initialData?.payment_type == "cash") {
                    transfer = props.initialData?.fee_amount
                } else {
                    transfer = props.initialData?.odt
                }
            }

            setFormData({
                companyId: props.initialData?.company_id || '',
                trajectId: props.initialData?.traject_id || '',
                trajectMasterId: props.initialData?.traject_master_id || '',
                paymentType: props.initialData?.payment_type || props.initialData?.payment_category || '',
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
            <div style={{ minWidth: showTransactionTable ? "90%" : "40%", transition: "min-width 0.3s ease" }} className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`}>

                <ModalContent
                    header={{
                        title: 'Settlement',
                        closeModal: handleClose
                    }}
                    actions={[

                    ]}
                >
                    <Row>

                        {showTransactionTable && props.initialData?.transaction_list && props.initialData.transaction_list.length > 0 && (
                            <Col
                                withPadding
                                column={showTransactionTable ? 4 : 6}
                            >

                                <div style={{
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.85rem'
                                    }}>
                                        <thead style={{
                                            backgroundColor: '#e0e0e0',
                                            position: 'sticky',
                                            top: 0
                                        }}>
                                            <tr>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Rute</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Pembayaran</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #ccc' }}>Penumpang</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #ccc' }}>Harga Tiket</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #ccc' }}>Total</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ccc' }}>Status</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Tanggal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.initialData.transaction_list.map((transaction, index) => (
                                                <tr
                                                    key={transaction.id || index}
                                                    style={{
                                                        backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5',
                                                        borderBottom: '1px solid #eee'
                                                    }}
                                                >
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <div style={{ fontWeight: '500' }}>{transaction.traject_code}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{transaction.traject_name}</div>
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <span style={{
                                                            backgroundColor: transaction.payment_category === 'non_tunai' ? '#e3f2fd' : '#fff3e0',
                                                            color: transaction.payment_category === 'non_tunai' ? '#1976d2' : '#f57c00',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {transaction.payment_provider_label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{transaction.quantity}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{currency(transaction.amount)}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>{currency(transaction.total_amount)}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            backgroundColor: transaction.payment_status === 'PAID' ? '#e8f5e9' : '#ffebee',
                                                            color: transaction.payment_status === 'PAID' ? '#2e7d32' : '#c62828',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {transaction.payment_status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                                                        {dateFilter.convertISO(new Date(transaction.created_at), "fulldate", true)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                            </Col>

                        )}


                        <Col
                            withPadding
                            column={showTransactionTable ? 2 : 6}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: "0 .5rem" }}>

                                <Row spaceBetween style={{ alignItems: 'center' }}>
                                    <Button
                                        small
                                        title={showTransactionTable ? 'Tutup' : 'Lihat Transaksi'}
                                        onClick={() => setShowTransactionTable(!showTransactionTable)}
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                    />
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
                                    <span>Fee</span>
                                    <strong>{currency(String(props.initialData?.fee_amount), "Rp")}</strong>
                                </Row>

                                <Row

                                    spaceBetween
                                >
                                    <span>MDR</span>
                                    <strong>{currency(String(props.initialData?.mdr_amount), "Rp")}</strong>
                                </Row>

                                {
                                    props.initialData?.transfer_date && (
                                        <Row

                                            spaceBetween
                                        >
                                            <span>Tanggal Transfer</span>
                                            <strong>{dateFilter.getMonthDate(new Date(props.initialData?.transfer_date))}</strong>
                                        </Row>
                                    )
                                }

                                <Row>

                                </Row>

                                {props.initialData?.traject_bank && props.initialData.traject_bank.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#f0f7ff',
                                        border: '1px solid #b3d4fc',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <div style={{
                                            fontWeight: '600',
                                            marginBottom: '0.75rem',
                                            color: '#1976d2',
                                            fontSize: '0.9rem'
                                        }}>
                                            Informasi Rekening
                                        </div>
                                        {props.initialData.traject_bank.map((bank, index) => (
                                            <div key={bank.id || index} style={{
                                                backgroundColor: '#fff',
                                                borderRadius: '6px',
                                                padding: '0.75rem',
                                                marginBottom: index < props.initialData.traject_bank.length - 1 ? '0.5rem' : 0,
                                                border: '1px solid #e3e3e3'
                                            }}>
                                                <Row spaceBetween style={{ marginBottom: '0.25rem' }}>
                                                    <span style={{ color: '#666', fontSize: '0.85rem' }}>Bank</span>
                                                    <strong style={{ color: '#333', fontSize: '0.9rem' }}>{bank.bank_name}</strong>
                                                </Row>
                                                <Row spaceBetween style={{ marginBottom: '0.25rem' }}>
                                                    <span style={{ color: '#666', fontSize: '0.85rem' }}>Atas Nama</span>
                                                    <strong style={{ color: '#333', fontSize: '0.9rem' }}>{bank.bank_account_name}</strong>
                                                </Row>
                                                <Row spaceBetween>
                                                    <span style={{ color: '#666', fontSize: '0.85rem' }}>No. Rekening</span>
                                                    <strong style={{ color: '#333', fontSize: '0.9rem', letterSpacing: '0.5px' }}>{bank.bank_account_number}</strong>
                                                </Row>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {
                                    props.roleAccess && (
                                        <Input
                                            title={"Tanggal " + (formData.paymentType == "cash" ? "Invoice" : 'Transfer')}
                                            field="transferDate"
                                            type="date"
                                            value={formData.transferDate}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    )
                                }

                                <Input
                                    disabled={!props.roleAccess}
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

                                    {
                                        props.roleAccess && (
                                            <input
                                                field="paymentProofFile"
                                                type="file"
                                                onChange={handleFileChange}
                                                placeholder="Select payment proof image"
                                                accept=".jpeg, .jpg, .png, .pdf"
                                                required
                                            />
                                        )
                                    }


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

                                {props.roleAccess && (
                                    <Button
                                        key="submit"
                                        title={(props.initialData?.status == "CREATED" ? 'Ubah' : 'Simpan')}
                                        onClick={handleSubmit}
                                        onProcess={props.isProcessing || isUploading}
                                        styles={Button.secondary}
                                    />
                                )}
                            </div>
                        </Col>
                    </Row>


                </ModalContent>

            </div>


        </div>
    )
}