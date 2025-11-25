import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import styles from './CounterPaymentModal.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import { useRouter } from 'next/router'

const defaultProps = {
    visible : false,
    closeModal : null,
    data: []
}

CounterPaymentModal.defaultProps = defaultProps

export default function CounterPaymentModal(props = defaultProps) {

    const router = useRouter()

    const appContext = useContext(AppContext)
    const FORM = {
        "paymentId": "",
        "counterId": router.query.counter,
        "payment": {
            "title": "",
        }
    }
    const [_form, _setForm] = useState(FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_paymentRange, _setPaymentRange] = useState(props.data)

    const _handleChecked = (position, field, check) => {
       
        let updatePayment = []

        _paymentRange.forEach(function(val, key){
            if(key == position){
                val.checked = check ? false : true
            }
            updatePayment.push(val)
        })

        _setPaymentRange(updatePayment);
    }

    function _submitData(){
        _setIsProcessing(true)

        let promises = []
        _paymentRange.forEach(function(val, key){
            if(val.checked){
                let query = {
                    ..._form
                }

                query.paymentId = val.value
                delete query.payment
    
                const result = postJSON('/masterData/counter/payment/add', query, appContext.authData.token)
                promises.push(result)
            }
        })

        Promise.all(promises)
        .then(function handleData(data){
            popAlert({ message : 'Berhasil disimpan', type : 'success' })
            setTimeout(() => {
                _setForm(FORM)
                props.onSuccess()
                props.closeModal()
                _setIsProcessing(false)
            }, 1000);
        })
        .catch(function handleError(error){
            popAlert({ message : error.message })    
            _setIsProcessing(false)
        })  
    }

    useEffect(() => {
        if(props.data[0]?.value){
            _setPaymentRange(props.data)
        }
    }, [props.data])

    if(props.data[0]?.value){
        return (
            <Modal
            visible={props.visible}
            centeredContent
            >
                <ModalContent
                header={{
                    title: 'Tambah Pembayaran',
                    closeModal: props.closeModal
                }}
                >
                    <div
                    className={styles.container_payment}
                    >
                        {
                            props.data[0]?.value && (
                                props.data.map(function(val, key){
                                    return (
                                        <div
                                        className={styles.item}
                                        >
                                            <Input
                                            withMargin
                                            title={val.title}
                                            type={"checkbox"}
                                            checked={_paymentRange[key]?.checked}
                                            value={_paymentRange[key]?.value}
                                            onChange={(value) => {
                                                _handleChecked(key, value, _paymentRange[key]?.checked)
                                            }}
                                            />
                                        </div>
                                    )
                                  
                                })
                            )
                           
                        }
                    </div>
    
                    <div className={styles.container}>
                        <Button
                        title={'Simpan'}
                        styles={Button.secondary}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                        />
                    </div>
                    
                </ModalContent>
            </Modal>
        )
    }
   
}
