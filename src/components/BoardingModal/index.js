import { useEffect, useState, useContext, useTransition } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { Row, Col } from '../Layout'
import { popAlert } from '../Main'
import TicketListModal from '../TicketListModal'
import EditTicketModal from '../EditTicketModal'
import Input from '../Input'
import Tabs from '../Tabs'

import { AiFillEdit } from 'react-icons/ai'

import { currency, dateFilter } from '../../utils/filters'
import ActivityIndicator from '../ActivityIndicator'

import styles from './BoardingModal.module.scss'

const defaultProps = {
    visible : false,
    onSuccess : null,
    closeModal : null,
    deposit : {
        detail : null
    },
    costs : null,
    crews : [],
    showCommuterModal: null,
    bus: [],
    date: {}
}

BoardingModal.defaultProps = defaultProps

export default function BoardingModal(props = defaultProps) {

    const appContext = useContext(AppContext)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_crews, _setCrews] = useState({
        title: "",
        value: ""
    })
    const [_bus, _setBus] = useState({
        title: "",
        value: ""
    })

    const [_ritRanges, _setRitRanges] = useState([])
    const [_rit, _setRit] = useState({})
    const [_ticketNumber, _setTicketNumber] = useState("")
    const [_resultValidateTicket, _setResultValidateTicket] = useState([])
    const [_resultValidateTicketOta, _setResultValidateTicketOta] = useState([])
    const [_isLoadData, _setIsLoadData] = useState(false)
    const [_tableHeader, _setTableHeader] = useState("")
    const [_formFindTicket, _setFormFindTicket] = useState({
        startFrom: 0,
        sortMode: "desc",
        orderBy: 'id',
        length: 1,
        status: 'boarding',
        startDate: dateFilter.basicDate(new Date()).normal,
        endDate: dateFilter.basicDate(new Date()).normal
    })
    const [_activeIndex, _setActiveIndex] = useState("NONOTA")
 
    async function _boardingTicket() {
        _setIsProcessing(true)
        let ticketNumber = _ticketNumber.toLowerCase()
        let isOta = ticketNumber.split("ota-")
        let parsedTicket = ""
        let urlOta = ""

        if(isOta.length > 1){
            parsedTicket = isOta[1]
            urlOta = "ota/"

        }else{
            parsedTicket = ticketNumber.split("&tickets&")

            if(parsedTicket.length > 1){
                parsedTicket = parsedTicket[1]
            }else{
                parsedTicket = ticketNumber.split("/tickets/")
    
                if(parsedTicket.length > 1){
                    parsedTicket = parsedTicket[1]
                }else{
                    parsedTicket = parsedTicket[0]
                }
            }
        }
        
        let query = {
            ticket: parsedTicket,
            busId: _bus.value,
            trip: _rit.value,
            crewId: _crews.value
        }

        try {
            await postJSON(`/keuangan/transaksi/commuter/boarding/v3/${urlOta}submit`, query, appContext.authData.token)
            
            if(isOta.length > 1){
                _findTicket(parsedTicket, "ota/")
            }else{
                _validateTicket(parsedTicket)
            }
            
        } catch (e) {
            if(e.message == "Invalid ID / Sudah Boarding"){
                if(isOta.length > 1){
                    _findTicket(parsedTicket, "ota/")
                }else{
                    _validateTicket(parsedTicket)
                }
            }else{
                popAlert({ message : _validateErrorMessage(e)})
            }
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _validateTicket(ticket) {
        _setIsProcessing(true)

        try {
            await postJSON('/keuangan/setoran/commuter/detail/tiket/validasi', { ticket : ticket }, appContext.authData.token)
           
            _findTicket(ticket)
        } catch (e) {
            popAlert({ message : _validateErrorMessage(e) })
            _setIsLoadData(false)
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _findTicket(ticket, ota = "") {
        _setIsProcessing(true)

        let query = {
            ..._formFindTicket,
            query: ticket,
        }

        try {
            _setIsLoadData(true)
            const data = await postJSON(`/keuangan/transaksi/commuter/boarding/v2/${ota}list`, query, appContext.authData.token)

            if(data.data.length > 0){
                if(ota == ""){
                    _setActiveIndex("NONOTA")
                    _setResultValidateTicket(oldData => [...oldData, data.data[0]])
                }else{
                    _setActiveIndex("OTA")
                    _setResultValidateTicketOta(oldData => [...oldData, data.data[0]])
                }
            }
            if(data) _setIsLoadData(false)

            popAlert({ message : 'Tiket '+ticket+' Tervalidasi di Bis '+_bus.title, type : 'success' })
            _setTicketNumber('')

        } catch (e) {
            popAlert({ message : _validateErrorMessage(e) })
            _setIsLoadData(false)
        } finally {
            _setIsProcessing(false)
            _setInputFocus()
        }
    }

    function _setInputFocus() {
        document.getElementById('ticket').focus()
    }

    function _validateErrorMessage(e){
        let errMessage = ""
        if(e.message?.details){
            errMessage = e.message.details[0].message
        }else{
            errMessage = e.message
        }
        return errMessage
    }

    function _updateFormFindTicket(data = {}){
        _setFormFindTicket(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    useEffect(() => {
        if(props.date?.startDate){
            let yesterday = new Date(props.date.startDate)

            if(props.date.startDate == props.date.endDate){
                yesterday.setDate(yesterday.getDate()-1)
            }

            _setTableHeader("Transaksi tiket tanggal "+dateFilter.getMonthDate(yesterday)+" s.d. "+dateFilter.getMonthDate(new Date(props.date.endDate)))
            
            _updateFormFindTicket({
                startDate: dateFilter.basicDate(yesterday).normal,
                endDate: dateFilter.basicDate(new Date(props.date.endDate)).normal
            })
        }
    }, [props.date])

    useEffect(() => {
        let rits = []
        for(let i = 1; i <= 10; i++){
            rits.push({
                "title": `${i}`,
                "value": `${i}`
            })
        }
        _setRitRanges(rits)
        _setInputFocus()
    }, [])

    function _clearForm(){
        _setCrews({})
        _setBus({})
        _setRit({})
        _setTicketNumber("")
    }
    
    return (
        <>
            <Modal
            visible={props.visible}
            onBackdropClick={() => {
                props.closeModal
                _clearForm()
            }}
            extraLarge
            centeredContent
            >
                <ModalContent
                header={{
                    title : `Validasi Tiket`,
                    closeModal : () => {
                        props.closeModal()
                        _clearForm()
                    }
                }}
                >
                    <Row>
                        <Col
                        column={1}
                        withPadding
                        >
                            <Input
                            title={"Crew"}
                            placeholder={'Crew'}
                            value={_crews.title}
                            suggestions={props.crews}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _setCrews(data)
                                return false
                            }}
                            />
                            
                        </Col>
                        <Col
                        column={1}
                        withPadding
                        >
                            <Input
                            title={"Bus"}
                            placeholder={'Bus'}
                            value={_bus.title}
                            suggestions={props.bus}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _setBus(data)
                                return false
                            }}
                            />
                            
                        </Col>
                        <Col
                        column={1}
                        withPadding
                        >
                            <Input
                            title={"Ritase Ke"}
                            placeholder={'Rit'}
                            value={_rit.title}
                            suggestions={_ritRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _setRit(data)
                                return false
                            }}
                            />
                        </Col>
                        <Col
                        column={2}
                        withPadding
                        >
                            <form
                            style={{
                                position : 'sticky',
                                top : 0,
                                zIndex : 9999,
                                backgroundColor: "#ffff"
                            }}
                            onSubmit={e => {
                                e.preventDefault()
                                _boardingTicket()
                            }}
                            action={'.'}
                            >
                                <Row
                                verticalEnd
                                >
                                    <Col
                                    column={4}
                                    // withPadding
                                    >
                                        <Input
                                        id={"ticket"}
                                        title={"Tiket"}
                                        placeholder='Input Manual / Atau Scan QRCode'
                                        onChange={(value) => _setTicketNumber(value)}
                                        value={_ticketNumber}
                                        autoFocus={true}
                                        className={"tiket_input"}
                                        />
                                    </Col>
                                    <Col
                                    column={2}
                                    withPadding
                                    >
                                        
                                        <Button
                                        title={'Validasi'}
                                        onClick={_boardingTicket}
                                        onProcess={_isProcessing}
                                        />

                                    </Col>
                                </Row>
                            </form>
                            
                        </Col>
                    </Row>

                    {
                        _isLoadData && (
                            <Col
                            center
                            alignCenter
                            style={{
                                marginTop: '1rem'
                            }}
                            >
                                <small>
                                    <i>
                                        Memuat data...
                                    </i>
                                </small>
                                <br/>
                                <ActivityIndicator
                                dark
                                />
                            </Col>
                        )
                    }
                    
                    <Table
                    headerContent={
                        <Row>
                            <Col
                            column={2}
                            withPadding
                            >
                                <Tabs
                                activeIndex={_activeIndex}
                                tabs={[
                                    {
                                        title : 'Non OTA',
                                        value : 'NONOTA',
                                        onClick : () => {
                                            _setActiveIndex('NONOTA')
                                        }
                                    },
                                    {
                                        title : 'OTA',
                                        value : 'OTA',
                                        onClick : () => {
                                            _setActiveIndex('OTA')
                                        }
                                    },
                                ]}
                                />

                            </Col>

                            <Col
                            column={3}
                            withPadding
                            >
                                <p>{_tableHeader}</p>
                            </Col>

                        </Row>   
                    }
                    style={{
                        "min-height": "30rem"
                    }}
                    columns={[
                        {
                            field : 'ticket',
                            title : 'Ticket',
                            customCell : (value) => {
                                return value || '-'
                            }
                        },
                        {
                            field : 'busName',
                            title : 'Bus'
                        },
                        {
                            field : 'trajectName',
                            title : 'Trayek'
                        },
                        {
                            field : 'trip',
                            title : 'Ritase Ke',
                            customCell : (value) => {
                                return value
                            }
                        },
                        {
                            field : 'payment',
                            title : _activeIndex == "OTA" ? 'Channel' : 'Pembayaran'
                        },
                        {
                            field : 'baseFare',
                            title : 'Harga Tiket',
                            customCell : (value) => {
                                return currency(value)
                            }
                        },
                        {
                            field : 'boarding_at',
                            title : 'Tanggal',
                            customCell : (value) => {
                                return value == null ? '' : dateFilter.convertISO(value)
                            }
                        },
                    ]}
                    records={_activeIndex == "OTA" ? _resultValidateTicketOta : _resultValidateTicket}
                    />
                </ModalContent>
            </Modal>
        </>
    )

}