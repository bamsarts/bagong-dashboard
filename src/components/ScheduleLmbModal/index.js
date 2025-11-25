import { useState, useEffect, useContext, createRef } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from './ScheduleLmbModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'
import Label from '../Label'
import backgroundColor from '../../styles/sass/background-color.module.scss'
import Seat from '../Seat'
import SwitchButton from '../SwitchButton'
import generateClasses from '../../utils/generateClasses'

ScheduleLmbModal.defaultProps = {
    closeModal : null,
    data: {},
    visible: false
}

export default function ScheduleLmbModal(props = ScheduleTemplateModal.defaultProps) {

    const appContext = useContext(AppContext)

    const [_isProcessing, _setIsProcessing] = useState(false)
    const FORM = {
        "id": "",
        "scheduleType": "",
        "busId": "",
        "busCrew1Id": "",
        "busCrew2Id": "",
        "lmbCode": "",
        "seatAvailable": 0,
        "seatBlockNumber": [],
        "busName": "",
        "busCrew1Name": "",
        "busCrew2Name": "",
        "trajectTracks": [],
        "idLmb": "",
        "busCrewLmb1Name": "",
        "busCrewLmb2Name": "",
        "busCode": "",
        "busCrew1Name": "",
        "busCrew2Name": ""
    }
    const [_form, _setForm] = useState(FORM)
    const [_zoneRanges, _setZoneRanges] = useState([
        {
            title: "WIB",
            value: "WIB"
        },
        {
            title: "WITA",
            value: "WITA"
        },
        {
            title: "WIT",
            value: "WIT"
        }
    ])
    const [_busRanges, _setBusRanges] = useState([])
    const [_crewRanges, _setCrewRanges] = useState([])
    const [_fareTrajectRanges, _setFareTrajectRanges] = useState([])
    const [_errorForm, _setErrorForm] = useState({
        bus: false,
        crew1Name: false,
        crew2Name: false
    })

    const __COLUMNS = [
        {
            title : 'Asal',
            field : 'originName',
            textAlign: 'left'
        },
        {
            title : 'Tujuan',
            field : 'destinationName',
            textAlign: 'left'
        },
        {
            title : 'Tarif',
            field : "fare",
            customCell : (value, row) => {
                return (
                    <div
                    key={row.id}
                    >
                        <Input
                        type={"currency"}
                        withMargin
                        placeholder='Masukan tarif'
                        value={value}
                        onChange={data => _updateTrajectRanges("fare", data, row.id)}
                        />
                    </div>
                )
            }
        },
        {
            title : 'Jam Keberangkatan',
            field : "departureTime",
            customCell : (value, row, key) => {
                return (
                    <div
                    key={row.trajectTrackId}
                    >
                        <Input
                        withMargin
                        placeholder='HH:MM'
                        value={value}
                        onChange={ data => _updateTrajectRanges("departureTime", data, row.id)}
                        />
                    </div>
                   
                )
            }
        },
        
        {
            title : 'Damri Apps',
            field : "isDamriApps",
            customCell : (value, row, key) => {
                return (
                    <SwitchButton
                    checked={value}
                    onClick={ data => _updateTrajectRanges("isDamriApps", !value, row.id)}
                    />
                )
            }
        },
        {
            title : 'Loket',
            field : "isCounter",
            customCell : (value, row, key) => {
                return (
                    <SwitchButton
                    checked={value}
                    onClick={ data => _updateTrajectRanges("isCounter", !value, row.id)}
                    />
                )
            }
        },
        {
            title : 'OTA',
            field : "isOTA",
            customCell : (value, row, key) => {
                return (
                    <SwitchButton
                    checked={value}
                    onClick={ data => _updateTrajectRanges("isOTA", !value, row.id)}
                    />
                )
            }
        }
    ]

    const [_lmbRanges, _setLmbRanges] = useState([])
    const [_seatsLayout, _setSeatsLayout] = useState(null)
    const __seat_wrapper_ref = createRef()
    const [_seatWrapperWidth, _setSeatWrapperWidth] = useState(0)
    const [_selectedSeats, _setSelectedSeats] = useState([])
    const [_availableSeat, _setAvailableSeat] = useState(0)

    async function _submitData() {

        let seats = _selectedSeats
        let filterBlock = 0

        seats.forEach(function(val, key){
            if(parseInt(val) > _form.totalSeat || parseInt(val) <= 0){
                seats.splice(key, 1)
                filterBlock += 1
            }
        })

        console.log(_form)

        let query = {
            ..._form,
            "seatBlockNumber": seats,
        }

        if(_lmbRanges.length > 0){
            query.busCrew1Id = _validateLmb().data.busCrew1Id
            query.busCrew2Id = _validateLmb().data.busCrew2Id
            query.busId = _validateLmb().data.busId
    
            if(!_validateLmb().state){
                popAlert({ message : "Kode Bis / Pengemudi 1 / Pengemudi 2 tidak tersedia" })
                return false
            }
        }
       
        if(query.busId == null){
            query.busId = 0
        }

        if(query.busCrew1Id == null){
            query.busCrew1Id = ""
        }

        if(query.busCrew2Id == null){
            query.busCrew2Id = ""
        }

        if(query.lmbCode == null){
            query.lmbCode = ""
        }

        _fareTrajectRanges.forEach(function(val, key){
            query.trajectTracks.push({
                "trajectTrackId": val.id,
                "fare": parseInt(`${val.fare}`.split(".").join("")),
                "departureTime": val.departureTime,
                "isOTA": val.isOTA,
                "isDamriApps": val.isDamriApps,
                "isCounter": val.isCounter
            })
        })

        console.log(query)

        // return false
        
        delete query.busCrew1Name
        delete query.busCrew2Name
        delete query.busName
        delete query.idLmb
        delete query.busCrewLmb2Name
        delete query.busCrewLmb1Name
        delete query.busCode

        _setIsProcessing(true)

        try {
            await postJSON('/masterData/jadwal/master/update', query, appContext.authData.token)

            popAlert({ message : 'Berhasil disimpan', type : 'success' })
            _updateQuery(FORM)
            props.onSuccess()
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _updateTrajectRanges(name, value, trajectTrackId){
        const editData = _fareTrajectRanges.map((item) =>
            item.id === trajectTrackId && name ? { ...item, [name]: value } : item
        )
        _setFareTrajectRanges(editData)
    }

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getLmb(){
        _setIsProcessing(true)

        const params = {
            "branchId": props.data?.branchId,
            "departureDate": props.data?.departureDate,
            // "branchId": 47,
            // "departureDate": "2023-01-15",
        }
        
        try {
            const lmb = await postJSON(`/masterData/jadwal/master/data`, params, appContext.authData.token)
            // let dummy = [
            //     {
            //         "idLmb": "25939",
            //         "busCode": "5218",
            //         "trajectMasterCode": "KMO-WSB",
            //         "busCrew1Name": "TARONO",
            //         "busCrew2Name": "TASUN"
            //     },
            //     {
            //         "idLmb": "25940",
            //         "busCode": "5235",
            //         "trajectMasterCode": "KMO-WSB",
            //         "busCrew1Name": "HARKOMI",
            //         "busCrew2Name": "SOPARWADI"
            //     },
            //     {
            //         "idLmb": "25941",
            //         "busCode": "5219",
            //         "trajectMasterCode": "WSB-KMO",
            //         "busCrew1Name": "HENDI ADRIANA",
            //         "busCrew2Name": "SUSANTO"
            //     },
            //     {
            //         "idLmb": "25942",
            //         "busCode": "6143",
            //         "trajectMasterCode": "WSB-KMO",
            //         "busCrew1Name": "HENDI ADRIANA",
            //         "busCrew2Name": "SERI SUSANTO"
            //     }
            // ]
            

            // _setLmbRanges(dummy)
            // _setIsProcessing(false)

            
            if(lmb.data.length == 0){
                popAlert({ message : "Data LMB belum tersedia di SIMA Operasi" })
            }else{
                _setLmbRanges(lmb.data)
            }
                        
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getBus(){
        const params = {
            "startFrom": 0,
            "length": 1900,
        }
        
        try {
            const bus = await postJSON(`/masterData/bus/list`, params, appContext.authData.token)
            let busRange = [];
            bus.data.forEach(function(val, key){
                busRange.push({
                    "title": val.code,
                    "value": val.id,
                    ...val
                })
            })
            _setBusRanges(busRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getCrew(){
        const params = {
            "startFrom": 0,
            "length": 1900,
            "role_id": 3
        }
        
        try {
            const crew = await postJSON(`/masterData/userRoleAkses/user/list`, params, appContext.authData.token)
            let crewRange = [];
            crew.data.forEach(function(val, key){
                crewRange.push({
                    "title": val.name,
                    "value": val.id,
                    ...val
                })
            })
            _setCrewRanges(crewRange)
        } catch (e) {
            console.log(e)
        }
    }

    function isValidTime(timeString){
        var pattern = /^(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/;
        
        if(timeString != null){
            if (timeString.match(pattern)){
                return true;
            }else{
                return false
            }
        }else{
            return false
        }        
    }

    function validateTrajectRanges(data, isCurrency){
        let editData = []

        if(data != undefined){
            data.forEach(function(val, key){

                if(val.status){
                    if(isValidTime(val.departureTime)){
                        val.departureTime = val.departureTime.slice(0, -3)
                    }
                    // val.fare = currency(val.fare)
                    editData.push(val)
                }
               
            })
        }
        return editData
    }

    function isDisabledSeat(data){
        let state = true

        if(data == "free" || data == "A"){
            state = false
        }
        return state
    }

    function _selectSeat(seatNumber) {
        let selectedSeats = [..._selectedSeats]
        const currentIndex = selectedSeats.indexOf(seatNumber)
        if (currentIndex >= 0) {
            selectedSeats.splice(currentIndex, 1)
        } else {
            selectedSeats.push(seatNumber)
        }
        _setSelectedSeats(selectedSeats)
    }
    
    function _getSeatBackgroundColor(seat) {
        if (_selectedSeats.indexOf(seat.seatNumber) >= 0) {
            return backgroundColor.secondary
        }
        if (seat.status === 'booked' || seat.type === 'DRIVER') {
            return backgroundColor.medium_dark
        
        }

        if(seat.status === "reserved"){
            return backgroundColor.warning
        }

        if (!seat.status || seat.status === '-') {
            return 'transparent'
        }
        if (seat.status === 'free') {
            return '#fff'
        }
    }

    function _validateLmb(){
        let busFound = false
        let crew1Found = false
        let crew2Found = false
        let data = {
            "state": false,
            "data": {
                "busCrew1Id": "",
                "busCrew2Id": "",
                "busId": 0
            }
        }

        // _updateQuery({
        //     "busCrew1Id": "",
        //     "busCrew2Id": "",
        //     "busId": 0
        // })

        _busRanges.forEach(function(val, key){
            if(val.code == _form.busCode){
                // _updateQuery({
                //     "busId": val.id,
                // })
                data.data.busId = val.id
                busFound = true
            }
        })

        _crewRanges.forEach(function(val, key){
            if(val.name.toLowerCase() == _form.busCrew1Name.toLowerCase()){
                // _updateQuery({
                //     "busCrew1Id": val.id,
                // })

                data.data.busCrew1Id = val.id

                crew1Found = true
            }

            if(val.name.toLowerCase() == _form.busCrew2Name.toLowerCase()){
                // _updateQuery({
                //     "busCrew2Id": val.id,
                // })
                data.data.busCrew2Id = val.id
                crew2Found = true
            }
        })

        _setErrorForm({
            bus: !busFound,
            crew1Name: !crew1Found,
            crew2Name: !crew2Found
        })

        if(busFound && crew2Found && crew2Found){
            data.state = true
        }

        return data
    }
    
    useEffect(() => {
        _getBus()
        _getCrew()

        _setSeatWrapperWidth(document.getElementById('seat_wrapper').offsetWidth)

        const seatWrapper = __seat_wrapper_ref?.current
        if (!seatWrapper) return

        const observer = new ResizeObserver(() => {
            const { width } = seatWrapper.getBoundingClientRect()
            _setSeatWrapperWidth(width)
        })

        observer.observe(seatWrapper)

        return () => {
            observer.disconnect()
        }    
    }, [])

    useEffect(() => {
        // console.log(_form)
    }, [_form])

    useEffect(() => {
        _updateQuery({
            seatAvailable: props.data?.totalSeat-_selectedSeats.length
        })
        _setAvailableSeat(props.data?.totalSeat-_selectedSeats.length)

    }, [_selectedSeats])

    function _mappingLayout(layout){
        let seatArray = new Array()

        layout.split(";").forEach(function(val, key){
            seatArray[key] = new Array()
            val.split(",").forEach(function(i, j){
                let objSeat = {
                    type: "",
                    seatNumber: "",
                    status: "",
                    passenger: ""
                }

                i.split("|").forEach(function(a, b){
                     
                    if(b == 0){
                        objSeat.type = a
                    }else if(b == 1){
                        objSeat.seatNumber = a
                    }else if(b == 2){
                        objSeat.status = a
                    }else{
                        objSeat.passenger = a
                    }
                })
                seatArray[key].push(objSeat)
            })
        })

        _setSeatsLayout(seatArray)
    }

    useEffect(() => {
        if(props.data?.id){
            _setErrorForm({
                bus: false,
                crew1Name: false,
                crew2Name: false
            })
            _getLmb()
            _setFareTrajectRanges(validateTrajectRanges(props.data?.trajectTracks, true))
    
            _updateQuery({
                id: props.data?.id,
                scheduleType: props.data?.trajectTypeCategory,
                "busId": props.data?.busId,
                "busCrew1Id": props.data?.busCrew1Id,
                "busCrew2Id": props.data?.busCrew2Id,
                "lmbCode": props.data?.lmbCode ? props.data.lmbCode : "",
                "seatAvailable": props.data?.seatAvailable,
                "busCode": props.data?.busCode ? props.data.busCode : "",
                "busCrew1Name": props.data?.busCrew1Name ?  props.data.busCrew1Name : '',
                "busCrew2Name": props.data?.busCrew2Name ?  props.data.busCrew2Name : ""
            })

            let dataSeat = []

            if(props.data?.seatBlockNumber != null){
                props.data?.seatBlockNumber.forEach(function(val, key){
                    dataSeat.push(`${val}`)
                })  
                _setAvailableSeat(props.data?.totalSeat-props.data?.seatBlockNumber.length)  
            }else{
                _setAvailableSeat(props.data?.totalSeat)  
            }
            
            _setSelectedSeats(dataSeat)
            _mappingLayout(props.data?.busCategorySeatLayout)
           
        }
       
    }, [props.visible])

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : `Tentukan Tanggal `,
                closeModal : props.closeModal
            }}
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
                    _submitData()
                }}
                action={'.'}
                >
                    <Row>
                        <Col
                        column={1}
                        style={{
                            display: "grid"
                        }}
                        >
                            <small>Tanggal</small>
                            <strong>{dateFilter.getFullDate(new Date(props.data?.departureDate))}</strong>
                        </Col>

                        <Col
                        column={1}
                        style={{
                            display: "grid"
                        }}
                        >
                            <small>Trip</small>
                            <small
                            className={generateClasses([
                                styles.label,
                                props.data?.direction == "PERGI" ? styles.primary : styles.warning
                            ])}
                            >
                                {props.data?.direction}
                            </small>
                        </Col>

                        <Col
                        column={2}
                        style={{
                            display: "grid"
                        }}
                        >
                            <small>Trayek</small>
                            <strong>{props.data?.trajectMasterCode}</strong>
                            <strong>{props.data?.trajectMasterName}</strong>
                            <strong>{props.data?.trajectTypeName}</strong>
                        </Col>

                        <Col
                        column={2}
                        style={{
                            display: "grid"
                        }}
                        >
                            <small>Kelas Bis</small>
                            <strong>{props.data?.busCategoryCode}</strong>
                            <strong>{props.data?.busCategoryName}</strong>
                        </Col>
                    </Row>
                    
                    
                    <Row>
                    
                        <Col
                        column={1}
                        >
                            <Input
                            onError={_errorForm.bus}
                            error={"Kode Bis tidak tersedia"}
                            withMargin
                            title={"Kode Bis"}
                            placeholder={'Pilih Bis'}
                            value={_form.busCode}
                            suggestions={_lmbRanges}
                            suggestionField={'busCode'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "lmbCode": value.idLmb,
                                    "busCode": value.busCode,
                                    "busCrew1Name": value.busCrew1Name,
                                    "busCrew2Name": value.busCrew2Name
                                })
                            }}
                            />
                            
                        </Col>

                        <Col
                        column={1}
                        >
                            <Input
                            onError={_errorForm.crew1Name}
                            error={"Pengemudi 1 tidak tersedia"}
                            disabled
                            withMargin
                            title={"Pengemudi 1"}
                            placeholder={'Pilih Pengemudi 1'}
                            value={_form.busCrew1Name}
                            suggestions={_crewRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "busCrew1Id": value.value,
                                    "busCrew1Name": value.title,
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        >
                            <Input
                            onError={_errorForm.crew2Name}
                            error={"Pengemudi 2 tidak tersedia"}
                            disabled
                            withMargin
                            title={"Pengemudi 2"}
                            placeholder={'Pilih Pengemudi 2'}
                            value={_form.busCrew2Name}
                            suggestions={_crewRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "busCrew2Id": value.value,
                                    "busCrew2Name": value.title,
                                })
                            }}
                            />
                        </Col>

                        {/* <Col
                        column={1}
                        >
                            <Input
                            withMargin
                            title="Kode LMB"
                            placeholder='Masukan kode LMB'
                            onChange={(value) => {
                                _updateQuery({
                                    lmbCode: value
                                })
                            }}
                            value={_form.lmbCode}
                            />
                        </Col> */}

                        <Col
                        column={1}
                        >
                            <Input
                            disabled
                            withMargin
                            title={"LMB"}
                            placeholder={'Pilih LMB'}
                            value={_form.lmbCode}
                            suggestions={_lmbRanges}
                            suggestionField={'busCode'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "lmbCode": value.idLmb,
                                })
                            }}
                            />
                        </Col>
                    </Row>
                    
                    <Table
                    columns={__COLUMNS}
                    records={_fareTrajectRanges}
                    />

                    <h6>Seat</h6>
                    
                    <Row>
                        <Col
                        column={2}
                        style={{
                            display: "grid"
                        }}
                        >
                            <strong>Kapasitas</strong>
                            <small>{props.data?.totalSeat}</small>
                        </Col>

                        <Col
                        column={1}
                        style={{
                            display: "grid"
                        }}
                        >
                            <strong>Terblokir</strong>
                            <small>{_selectedSeats.length}</small>
                        </Col>

                        <Col
                        column={2}
                        style={{
                            display: "grid"
                        }}
                        >
                            <strong>Tersedia</strong>
                            <small>{_availableSeat}</small>
                        </Col>

                        <Col
                        column={1}
                        style={{
                            display: "grid"
                        }}
                        >
                            <strong>Terjual</strong>
                            <small>{props.data?.seatSold == null ? 0 : props.data?.seatSold}</small>
                        </Col>
                    </Row>

                    <Row
                    spaceBetween
                    >
                        <Col
                        column={1}
                        >
                            <div
                            id={'seat_wrapper'}
                            ref={__seat_wrapper_ref}
                            >

                            {
                                _seatsLayout?.map((row, key) => {
                                    return (
                                        <Row
                                        key={key}
                                        center
                                        style={{
                                            flexWrap: 'inherit'
                                        }}
                                        >
                                            {
                                                row.map((col, key2) => {
                                                    return (
                                                        <Col
                                                        key={key2}
                                                        style={{
                                                            justifyContent : 'center',
                                                            padding : 4,
                                                            flex : 0,
                                                        }}
                                                        ignoreScreenSize>
                                                            <Seat
                                                            size={(_seatWrapperWidth / 6) - 4}
                                                            visible={['SEAT', 'DRIVER'].indexOf(col.type) >= 0}
                                                            backgroundColor={_getSeatBackgroundColor(col)}
                                                            number={col.seatNumber}
                                                            color={_selectedSeats.indexOf(col.seatNumber) >= 0 ? '#fff' : '#555'}
                                                            onSelect={() => _selectSeat(col.seatNumber)}
                                                            isBusDriver={col.type === 'DRIVER'}
                                                            disabled={isDisabledSeat(col.status)}
                                                            />
                                                        </Col>
                                                    )
                                                })
                                            }
                                        </Row>
                                    )
                                })
                            }
                            
                            </div>
                        </Col>
                    </Row>

                    <Col
                    column={2}
                    withPadding
                    style={{"marginTop": "3rem"}}
                    >
                        <Button
                        title={'Simpan'}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                        />
                    </Col>



                </form>
                   

            </ModalContent>
        </Modal>
    )

}