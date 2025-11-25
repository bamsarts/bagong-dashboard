import { useEffect, useState, useContext, forwardRef } from "react"
import { get, postJSON, TICKET_ORDER_URL, postFormData } from "../../api/utils"
import Modal, { ModalContent } from '../Modal'
import { popAlert } from '../Main'
import { Col, Row } from '../Layout'
import AppContext from '../../context/app'
import Button from '../Button'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import Input from '../Input'
import { dateFilter } from '../../utils/filters'
import { AiOutlineClose } from 'react-icons/ai'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

export default function TransferRefundModal(props = defaultProps){

    const CONFIG_PARAM = {
        "date": "",
        "id": "",
        "ticket": "",
        "transferProof": ""
    }

    const FORM_MEDIA = {
        "title": "",
        "file": ""
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_formMedia, _setFormMedia] = useState(FORM_MEDIA)
    const [_detailRefund, _setDetailRefund] = useState({})
    const appContext = useContext(AppContext)
    const [_isProcessing, _setIsProcessing] = useState(false)

    const CustomDatePicker = forwardRef(({ onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Transfer"}
            onClick={onClick}
            ref={ref}
            value={_form.date == "" ? "" : dateFilter.getMonthDate(new Date(_form.date))}
            />

            {
                _form.date != "" && (
                    <div
                    style={{
                        display: "flex",
                        position: "absolute",
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _updateQuery({
                            "date": ""
                        })
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    useEffect(() => {
        if(props.visible){
            _getDetailRefund()    

            _updateQuery({
                "id": props.data.voidRefId,
                "ticket": props.data.ticket
            })
        }

    }, [props.visible])

    useEffect(() => {
        console.log(_form)

    }, [_form])

    async function _uploadMedia(){

        if(_formMedia.file == ""){
            _submitPayment({
                link: ""
            })
            return false
        }

        _setIsProcessing(true)
        try{
            const query = {
                ..._formMedia
            }

            query.title = _detailRefund.ticket

         
            const result = await postFormData("/masterData/media/image/upload", {
                ...query
            }, appContext.authData.token)

            if(result) {
                _getMedia()
            }
            
        }catch(e){
            popAlert({ message : e.message })      
            _setIsProcessing(false) 
        } finally{
        }
    }

    async function _submitPayment(media){

        const query = {
            ..._form
        }

        _setIsProcessing(true)
        try{
           
            query.transferProof = media.link

            if (query.date != "") query.date = dateFilter.basicDate(new Date(query.date)).normal

            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/payment"
            }, query, appContext.authData.token)

            if(result) {
                _setFormMedia(FORM_MEDIA)
                document.getElementById("form").reset()
                props.onSuccess()
            }
            
        }catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _getMedia(){

        try{
            const query = {
                length: 1,
                orderBy: "id",
                sortMode: "desc",
                startFrom: 0
            }

            const result = await postJSON("/masterData/media/image/list", {
                ...query
            }, appContext.authData.token)

            if (result){
                _submitPayment(result.data[0])
            }
        
        } catch (e){

        }
    }

    async function _getDetailRefund(){
        try {
            const res = await get({
                url: TICKET_ORDER_URL + "/dashboard/refund/detail?ticket="+props.data.ticket
            }, appContext.authData.token)
            
            _setDetailRefund(res.data[0])

        } catch (e){

        }
    }

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    // async function _getMediaBusCategory(){
    //     try {
    //         const media = await get('/masterData/bus/kategori/image/'+props.data?.id, appContext.authData.token)
    //         _setMediaCategories(media.data)
    //     } catch (e) {
    //         popAlert({ message : e.message })
    //     } 
    // }


    return (
        <Modal
        visible={props.visible}
        centeredContent
        large
        >

            <ModalContent
            header={{
                title: 'Transfer pengembalian dana (Refund)',
                closeModal: () => {
                    props.closeModal()
                },
            }}
            >   
                {
                    _detailRefund?.ticket && (
                        <>
                            <strong>Data Penumpang</strong>

                            <Row
                            spaceBetween
                            withPadding
                            >
                                <div
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Nama</small>
                                    <span
                                    style={{
                                        marginTop: ".5rem"
                                    }}
                                    >{_detailRefund.name}</span>
                                </div>

                                <div
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>Nomor Telepon</small>
                                    <span
                                    style={{
                                        marginTop: ".5rem"
                                    }}
                                    >
                                        {_detailRefund.phoneNumber}
                                    </span>
                                </div>

                                <div
                                style={{
                                    display: "grid"
                                }}
                                >
                                    <small>NIK</small>
                                    <span
                                    style={{
                                        marginTop: ".5rem"
                                    }}
                                    >{_detailRefund.identity}</span>
                                </div>
                            </Row>

                            <Row>

                                <Col>
                                    <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    selected={_form.date}
                                    onChange={(date) => {
                                        _updateQuery({
                                            "date": date
                                        })
                                    }}
                                    customInput={<CustomDatePicker/>}
                                    />
                                </Col>

                                <Col>
                                    <div
                                    style={{"margin": "1rem 0rem 0rem 0rem"}}
                                    >
                                        Bukti Transfer
                                    </div>

                                    <form
                                    id={"form"}
                                    style={{"padding": ".5rem"}}
                                    >
                                        <input
                                        style={{"width": "100%"}}
                                        type={'file'}
                                        accept={'.png, .jpg, .jpeg'}
                                        onChange={(e) => {

                                            _setFormMedia(oldQuery => {
                                                return {
                                                    ...oldQuery,
                                                    "file": e.target.files[0]
                                                }
                                            })
                                        
                                        }}
                                        />
                                    </form>
                                </Col>
                                
                            </Row>
                            
                                        
                            <Col
                            style={{
                                marginTop: "1rem"
                            }}
                            >
                                <Button
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _uploadMedia()
                                }}
                                onProcess={_isProcessing}
                                />
                            </Col>        
                            


                        </>
                    )
                }

            </ModalContent>

        </Modal>
    )
}