import { useEffect, useContext, useState } from "react";
import AdminLayout from "../AdminLayout";
import Modal, { ModalContent } from "../Modal";
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import { TICKET_ORDER_URL, get, postJSON } from '../../api/utils'
import { currency, dateFilter } from "../../utils/filters";
import styles from './DetailRefundModal.module.scss'
import Button from '../Button'
import Input from '../Input'
import Main, { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null
}


export default function DetailRefundModal(props = defaultProps){
    
    const appContext = useContext(AppContext)
    const [_detailRefund, _setDetailRefund] = useState([])
    const [_isApproveInfo, _setIsApproveInfo] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_insurancePrice, _setInsurancePrice] = useState(0)
    const [_voidAmount, _setVoidAmount] = useState(0)

    useEffect(() => {

        if(props.visible){
            _setIsApproveInfo(false)
            _setDetailRefund([])
            _setInsurancePrice(0)
            _setVoidAmount(0)

            props.data?.group.forEach(function(val, key){
                _getDetailRefund(val.partnerTicket)
            })
        
        }

    }, [props.visible])

    useEffect(() => {
        
        if(props.data?.group){
            if(props.data?.group.length == _detailRefund.length){
                _detailRefund.forEach(function(val, key){
                    _setInsurancePrice(oldData => oldData += val.insurance)
                    _setVoidAmount(oldData => oldData += (val.voidAmount))
                })
            }
        }

       

    }, [_detailRefund])

    useEffect(() => {
        console.log(_detailRefund)
        console.log(props.data)
    }, [_detailRefund, props.data])

    async function _getDetailRefund(ticket){
        
        try {
            const res = await get({
                url: TICKET_ORDER_URL + "/dashboard/refund/detail?ticket="+ticket
            }, appContext.authData.token)

            let data = [..._detailRefund]

            if(res.data.length > 0){

                data.push(res.data[0])

                _setDetailRefund(oldArray => [...oldArray, res.data[0]])

            }
            
        } catch (e){

        }
    }

    async function _sendPushNotif(){
        const params = {
            "userId": props.data?.userId,
            "voidCode":  props.data?.voidCode,
            "idVoidLog": props.data?.id,
            "remark": "Pengembalian dana dengan kode pembatalan: "+props.data?.voidCode+" tidak dapat diproses, silahkan ganti rekening bank tujuan"
        }

        _setIsProcessing(true)

        try {
            const res = await postJSON(`/masterData/broadcast/gantiRekRefundNotif`, params, appContext.authData.token)

        } catch (e) {
            popAlert({ message : e.message })

        } finally {
            _setIsProcessing(false)
            props.onSuccess()
        }
    }

    async function _sendInfoUser(){

        _setIsProcessing(true)

        const params = {
            "remark": "Rekening tujuan mengalami gangguan, silahkan ganti dengan bank lain",
            "ticket": _detailRefund.ticket
        }
        
        try {
            const res = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/remark"
            }, params, appContext.authData.token)

            if(res){
                _sendPushNotif()
            }
            
        } catch (e){
            popAlert({ message : e.message.id })
            _setIsProcessing(false)
        }
    }
    
    return (
        
        <Modal
        visible={props.visible}
        centeredContent
        large
        >

            <ModalContent
            header={{
                title: 'Detail Pengembalian Dana (Refund)',
                closeModal: () => {
                    props.closeModal()
                }
            }}
            >   

                {
                    _detailRefund.length > 0 && (
                        <>
                            <Row
                            className={styles.return_transfer}
                            spaceBetween
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                            
                                <Col
                                column={2}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Nama Penumpang</small>

                                    {
                                        _detailRefund.map(function(val, key){
                                            return (
                                                <div
                                                style={{
                                                    display: "grid"
                                                }}
                                                >
                                                    <span
                                                    style={{
                                                        marginBottom: ".3rem"
                                                    }}
                                                    >
                                                        {val.name}
                                                    </span>

                                                    <small
                                                    style={{
                                                        fontSize: ".8rem"
                                                    }}
                                                    >
                                                        {val.ticket}
                                                    </small>
                                                </div>
                                            )
                                        })
                                    }
                                  
                                </Col>

                                <Col
                                column={4}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Rute</small>
                                    <span>{_detailRefund[0].originName} - {_detailRefund[0].destinationName}</span>
                                </Col>

                                
                            </Row> 

                            <strong>Transfer Pengembalian</strong>

                            <Row
                            className={styles.return_transfer}
                            spaceBetween
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                                <Col
                                column={2}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Nama Pemohon</small>
                                    <span>
                                        {_detailRefund[0].applicantName}
                                    </span>
                                </Col>

                                <Col
                                column={4}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Alasan</small>
                                    <span>
                                        {!props.data?.reason ? 'Lain-lain' : props.data.reason}
                                    </span>
                                </Col>

                            </Row>

                            <Row
                            className={styles.return_transfer}
                            spaceBetween
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                            
                                <Col
                                column={2}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Nama Bank</small>
                                    <span>
                                        {_detailRefund[0].bankName}
                                    </span>
                                </Col>

                                <Col
                                column={2}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>No Rekening</small>
                                    <span>{_detailRefund[0].accountNumber}</span>
                                </Col>

                                <Col
                                column={2}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Pemilik Rekening</small>
                                    <span>{_detailRefund[0].accountName}</span>
                                </Col>
                            </Row> 

                            <strong>Rincian Pengembalian</strong>

                            <Row
                            spaceBetween
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                                <Col
                                column={2}
                                >
                                    <span>Harga Tiket</span>
                                </Col>
                                <Col
                                alignEnd
                                >
                                    <span>
                                        {currency(_detailRefund[0].transactionAmount, "Rp")}
                                        <span> x {_detailRefund.length}</span>

                                    </span>
                                </Col>
                            </Row> 

                            <Row
                            spaceBetween
                            style={{
                                margin: "1rem 0rem",
                                color: "gray"
                            }}
                            >
                                <Col
                                column={2}
                                >
                                    <span>Harga Asuransi</span>
                                </Col>
                                <Col
                                alignEnd
                                >
                                    <span>{currency(_insurancePrice, "Rp")}</span>
                                </Col>
                            </Row> 

                            <Row
                            spaceBetween
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                <Col
                                column={3}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <span>Biaya Refund</span>

                                    <small
                                    style={{
                                        color: "gray"
                                    }}
                                    >
                                        {_detailRefund[0].penalty}% dari harga tiket
                                    </small>
                                </Col>
                                <Col
                                alignEnd
                                >
                                    <span>
                                        -{currency(_detailRefund[0].penaltyValue, "Rp")}
                                        <span> x {_detailRefund.length}</span>
                                    </span>
                                </Col>
                            </Row> 
                            

                            <Row
                            spaceBetween
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                <Col
                                column={3}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <span>Biaya Transfer</span>

                                    <small
                                    style={{
                                        color: "gray"
                                    }}
                                    >
                                        Sudah termasuk PPN
                                    </small>
                                </Col>
                                <Col
                                alignEnd
                                >
                                    <span>
                                        -{currency(props.data?.transferFeeAmount, "Rp")}
                                    </span>
                                </Col>
                            </Row> 


                            <Row
                            spaceBetween
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                <Col
                                column={4}
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <span>Total Pengembalian</span>
                                    <small
                                    style={{
                                        color: "gray"
                                    }}
                                    >
                                        Tidak termasuk Asuransi
                                    </small>
                                </Col>
                                <Col
                                alignEnd
                                >
                                    <span>{currency(_voidAmount-props.data.transferFeeAmount, "Rp")}</span>
                                </Col>
                            </Row> 


                            {
                                (_detailRefund.status == "SUCCESS" && _detailRefund.transferProof) && (
                                    <>

                                        <hr></hr>

                                        <Row
                                        style={{
                                            margin: "1rem 0rem"
                                        }}
                                        >
                                            <Col
                                            column={2}
                                            >
                                                <span>Tanggal Transfer</span>
                                            </Col>
                                            <Col>
                                                <span>{dateFilter.getMonthDate(new Date(_detailRefund.disbursementDate))}</span>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col
                                            column={2}
                                            >
                                                <span>Bukti Transfer</span>
                                            </Col>
                                            <Col>
                                                <a 
                                                style={{
                                                    color: "blue"
                                                }}
                                                href={_detailRefund.transferProof}
                                                target={"_blank"}
                                                >
                                                    Lihat Bukti
                                                </a>
                                            </Col>
                                        </Row>

                                    </>
                                )
                            }

                            
                            {
                                (!props.data.remark && (props.data.faspayStatus == "9" || props.data.faspayStatus == "4")) && (
                                    <Row
                                    withPadding
                                    style={{
                                        border: "1px solid gray",
                                        borderRadius: "10px",
                                    }}
                                    >
                                            <p>Jika terjadi kegagalan sistem dalam proses transfer, Admin bisa melakukan pemberitahuan kepada Pelanggan untuk mengganti rekening bank</p>
                                        
                                            <div
                                            style={{
                                                marginTop: "1rem",
                                                display: "flex"
                                            }}
                                            >
                                                <div
                                                style={{
                                                    width: "50px",
                                                    marginRight: "1rem",
                                                }}
                                                >
                                                    <Input
                                                    type={"checkbox"}
                                                    checked={_isApproveInfo}
                                                    value={""}
                                                    onChange={(value) => {
                                                        _setIsApproveInfo(!_isApproveInfo)
                                                    }}
                                                    />
                                                </div>
                                            
                                                <small>Saya mengerti proses pengembalian dana akan otomatis tertunda hingga pelanggan mengganti rekeningnya</small>
        
        
                                            </div>
        
                                            <Col
                                            alignCenter
                                            >
                                                <Button
                                                disabled={!_isApproveInfo}
                                                small
                                                title={'Kirim Pemberitahuan'}
                                                styles={Button.secondary}
                                                onClick={() => {
                                                    _sendPushNotif()
                                                }}
                                                />
                                            </Col>
                                                
                                    </Row>
                                )
                            }
                           


                            {/* {
                                (_detailRefund.status == "APPROVE" && !_isApproveInfo && !props.data.remark && !props.data.faspayStatus) && (
                                    <div
                                    style={{
                                        marginTop: "1rem"
                                    }}
                                    >
                                        <Button
                                        title={'Transfer Refund'}
                                        styles={Button.primary}
                                        onClick={() => {
                                            props.onTransfer()
                                        }}
                                        />
                                    </div>
                                )
                            } */}
                        </>
                    )
                }

            </ModalContent>

        </Modal>
    )
}