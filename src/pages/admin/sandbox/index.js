import { useEffect, useState, forwardRef } from 'react'

import { postJSON, get, postFormData } from '../../../api/utils'

import Main, { popAlert } from '../../../components/Main'
import AdminLayout from '../../../components/AdminLayout'
import Card from '../../../components/Card'
import Input from '../../../components/Input'
import Table from '../../../components/Table'
import Button from '../../../components/Button'
import Tabs from '../../../components/Tabs'
import { Col, Row } from '../../../components/Layout'
import throttle from '../../../utils/throttle'
import TemplateWaModal from '../../../components/TemplateWaModal'
import { AiFillEye, AiFillDelete } from 'react-icons/ai'
import generateClasses from '../../../utils/generateClasses'
import { dateFilter } from '../../../utils/filters'
import { QRCode } from 'react-qrcode-logo'
import ConfirmationModal from '../../../components/ConfirmationModal'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import styles from '../dashboard/Dashboard.module.scss'
import Seat from '../../../components/Seat'

export default function SanboxNewticket(props) {

    const _FORM = {
        "id": "",
        "nameConfig": "",
        "dataConfig": ""
    }

    const CREDS = {
        "username": "Damribisku",
        "password": "B1sKu@D4mR1\!@\#"
    }

    const ENV = {
        "dev": "https://devapitiket.damri.co.id",
        "prod": "https://apitiket.damri.co.id"
    }

    const __COLUMNS_TEMPLATE = [
        {
            title : 'Kategori',
            field : 'categoryName',
            textAlign: 'left'
        },
        {
            title : 'Template',
            field : 'template',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            style: {
                "minWidth": "100px"
            },
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah"}
                        className={styles.button_action}
                        onClick={() => {
                            _setRowData(row)
                            _setIsOpenModal(true)
                        }}
                        >
                            <AiFillEye/>
                        </div>
                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_SCHEDULE = [
        {
            title: 'Kode Trip',
            field: 'tripcode'
        },
        {
            title : 'Jam Keberangkatan',
            field : 'jam'
        },
        {
            title : 'Waktu Tempuh',
            field : 'durasi',
            customCell : (value, row) => {
                return dateFilter.getEstimatedTime(row.estimasi, value).substring(0, 5) + " "+ row.timezone + " ("+dateFilter.getDurationFromTimeFormat(row.durasi)+")"
            }
        },
        {
            title : 'Harga',
            field : 'harga'
        },
        {
            title : 'Segmentasi',
            field : "kd_segmen",
        },
        {
            title : "",
            field: "bis",
            customCell: (value, row) => {
                return (
                    <Button
                    onProcess={_isProcessing}
                    small
                    title={"Cek Kursi"}
                    onClick={() => {
                        _getStatusSeat(row.jam, row.kd_trayek, value)
                        _updateQuery({
                            "seat": row
                        })
                    }}
                    />
                )
            }
        }
    ]

    const [_detailTicket, _setDetailTicket] = useState({})

    const [_listRoute, _setListRoute] = useState([])
    const [_token, _setToken] = useState("")
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_env, _setEnv] = useState(ENV.prod)
    const [_columnTable, _setColumnTable] = useState(__COLUMNS_TEMPLATE)
    const [_segmentRange, _setSegmentRange] = useState([
        {
            "title": "Bandara",
            "value": "airport"
        },
        {
            "title": "AKAP",
            "value": "akap"
        }
    ])

    let [_statusBooking, _setStatusBooking] = useState({})

    const COLUMN_ORIGIN = [
        {
            title: 'Nama Asal',
            field: 'asal',
            textAlign: "left",
            customCell : (value, row) => {
                return (
                    <>
                        <p>{row.nm_asal}</p>
                        <span>{row.alamat}</span>
                    </>
                    
                )
                
            }
        },
        {
            title : 'Kota',
            field : 'nm_kota'
        },
        {
            title : 'Latitude',
            field : 'latloc'
        },
        {
            title : 'Longitude',
            field : 'longloc',
            customCell : (value, row) => {
                return value
            }
        },
        {
            title : '',
            field : 'asal',
            customCell : (value, row) => {

                if(row.asal != ""){
                    return (
                        <Button
                        onProcess={_isProcessing}
                        small
                        title={"Cari Tujuan"}
                        onClick={() => {
                            _getDestination(value)
                        }}
                        />
                    )           
                }else{
                    return ""
                }
            
            }
        }
    ]

    const COLUMN_DESTINATION = [
        {
            title: 'Nama Tujuan',
            field: 'tujuan',
            textAlign: "left",
            customCell : (value, row) => {
                return (
                    <>
                        <p>{row.nm_tujuan}</p>
                        <span>{row.alamat}</span>
                    </>
                    
                )
                
            }
        },
        {
            title : 'Kota',
            field : 'nm_kota'
        },
        {
            title : 'Latitude',
            field : 'latloc'
        },
        {
            title : 'Longitude',
            field : 'longloc',
            customCell : (value, row) => {
                return value
            }
        }
    ]

    const [_activeIndex, _setActiveIndex] = useState("prod")
    const [_searchQuery, _setSearchQuery] = useState('')
    
    const [_titleModal, _setTitleModal] = useState('Template')
    const [_seatStatus, _setSeatStatus] = useState([])
    const [_listPoint, _setListPoint] = useState([])
    const [_dataSchedule, _setDataSchedule] = useState([])
    const [_form, _setForm] = useState({
        "origin": {
            "nm_asal": ""
        },
        "destination": {
            "nm_tujuan": ""
        },
        "date": new Date(),
        "tripcode": "",
        "dateListRoute": new Date(),
        "seat": {},
        "kd_booking": "",
        "segmentStatusBooking": _segmentRange[0]
    })

    const [_destinationRanges, _setDestinationRanges] = useState([])
    const [_originRanges, _setOriginRanges] = useState([])

    const DatePickerSchedule = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Berangkat"}
            onClick={onClick}
            ref={ref}
            value={_form.date == "" ? "" : dateFilter.getMonthDate(_form.date)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    const DatePickerListRoute = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Berangkat"}
            onClick={onClick}
            ref={ref}
            value={_form.dateListRoute == "" ? "" : dateFilter.getMonthDate(_form.dateListRoute)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    useEffect(() => {   
        _getToken()
    }, [])

    useEffect(() => {

        if(_token){
            _getOrigin()
        }
    }, [_token])

    useEffect(() => {

        if(_form.origin.asal){
            _getDestination()
        }
    }, [_form.origin])

   
    async function _getToken(){
        try {
            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/authtimeout/token&type=formdata&formData="+encodeURIComponent(JSON.stringify(CREDS))
            })

            _setToken(result.data.token)

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getOrigin() {
        
        try {
            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/getAsal&token="+_token+"|no-bearer"
            })

            if(result.data?.status){
                result.data.data.forEach(function(val, key){
                    val.nm_asal = val.asal + " - " + val.nm_asal
                })

                _setOriginRanges(result.data.data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getDestination(origin = ""){
        try {

            const params = {
                "asal": origin || _form.origin.asal
            }

            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/getTujuan&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status){
                result.data.data.forEach(function(val, key){
                    val.nm_tujuan = val.tujuan + " - " + val.nm_tujuan
                })

                _setDestinationRanges(result.data.data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getSchedule(){
        _setIsProcessing(true)
        try {

            const params = {
                "asal": _form.origin.asal,
                "tujuan": _form.destination.tujuan,
                "tanggal": dateFilter.basicDate(_form.date).normal
            }

            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/jadwalDetail&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status){
                _setDataSchedule(result.data.data)
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getPointRoute(){
        
        _setIsProcessing(true)
        
        try {

            const params = {
                "tripcode": _form.tripcode,
                "tanggal": dateFilter.basicDate(_form.dateListRoute).normal
            }

            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/listCourse&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status){
                _setListRoute(result.data.data)
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getListRoute(){
        
        _setIsProcessing(true)
        
        try {

            const params = {
                "tripcode": _form.tripcode,
                "tanggal": dateFilter.basicDate(_form.dateListRoute).normal
            }

            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/listRoute&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status){
                _setListRoute(result.data.data)
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getListRoute(){
        
        _setIsProcessing(true)
        
        try {

            const params = {
                "tripcode": _form.tripcode,
                "tanggal": dateFilter.basicDate(_form.dateListRoute).normal
            }

            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/listRoute&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status){
                _setListRoute(result.data.data)
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }
    
    async function _getStatusSeat(time, traject, codeSchedule){
        
        _setIsProcessing(true)
        
        try {

            const params = {
                "tanggal": dateFilter.basicDate(_form.date).normal,
                "jam": time,
                "trayek": traject,
                "bis": codeSchedule
            }

            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+"/v2_1/api/statusSeat&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status){
                _setSeatStatus(result.data.data)
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getStatusBooking(){
        
        const params = {
            "kd_booking": _form.kd_booking,
        }
        let url = "/v2/airport/statusBooking"

        if(_form.segmentStatusBooking.value == "akap"){
            url = "/v2_1/api/statusBooking"
        }
        
        _setIsProcessing(true)
        
        try {

        
            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+url+"&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status == "error"){
                popAlert({"message": result.data.desc})
            }else{
                _setStatusBooking(result.data.data)
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getDetailTicket(){
        
        const params = {
            "kd_booking": _form.kd_booking,
        }
        let url = "/v2/airport/detailTicket"

        if(_form.segmentStatusBooking.value == "akap"){
            url = "/v2_1/api/detailTicket"
        }
        
        _setIsProcessing(true)
        
        try {

        
            const result = await postJSON({
                url: "/api/api-server-side?url="+_env+url+"&token="+_token+"|no-bearer"+`&type=formdata&formData=${encodeURIComponent(JSON.stringify(params))}`
            })

            if(result.data?.status == "error"){
                popAlert({"message": result.data.desc})
            }else{
                if(result?.data){
                    _setDetailTicket(result.data)
                }else{
                    popAlert({"message": result.message})
                }
            }

        } catch (e) {
            console.log(e)
        } finally {
            _setIsProcessing(false)
        }
    }
    
    return (
        <Main>
        
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    // {
                    //     title : 'Development',
                    //     value : 'dev',
                    //     onClick : () => {
                    //         _setActiveIndex("dev")
                    //     }
                    // },
                    {
                        title : 'Production',
                        value : 'prod',
                        onClick : () => {
                            _setActiveIndex('prod')
                        }
                    }
                ]}
                />
            }
            >  

   

            <Row>
                <Col
                column={4}
                >
                    <Card
                    title="Jadwal AKAP"
                    >

                        <Row
                        verticalCenter
                        marginBottom
                        >
                            <Col
                            column={5}
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                            >
                            
                                <Input
                                withMargin
                                title={'Asal'}
                                placeholder={'Pilih Asal'}
                                value={_form.origin.nm_asal}
                                suggestions={_originRanges}
                                suggestionField={"nm_asal"}
                                onSuggestionSelect={data => {
                                    _updateQuery({
                                        "origin": data
                                    })
                                }}
                                />

                                <Input
                                withMargin
                                title={'Tujuan'}
                                placeholder={'Pilih Tujuan'}
                                value={_form.destination.nm_tujuan}
                                suggestions={_destinationRanges}
                                suggestionField={"nm_tujuan"}
                                onSuggestionSelect={data => {
                                    _updateQuery({
                                        "destination": data
                                    })
                                }}
                                />

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
                                customInput={<DatePickerSchedule/>}
                                />

                            </Col>

                            <Col
                            withPadding
                            column={1}
                            >
                                <Button
                                onProcess={_isProcessing}
                                small
                                title={"Cari"}
                                onClick={() => {
                                    _getSchedule()
                                }}
                                />
                            </Col>
                        </Row>
                        
                        <Row
                        marginBottom
                        >
                            <Table
                            exportToXls={false}
                            columns={__COLUMNS_SCHEDULE}
                            records={_dataSchedule}
                            />
                        </Row>
                        
                        {
                            _seatStatus.length > 0 && (
                                <Row>
                                    <p
                                    style={{
                                        marginBottom: "1rem"
                                    }}
                                    >
                                        Status Kursi {_form.seat.bis + " | " + _form.seat.jam + " | " +_form.seat.kd_trayek }
                                    </p>

                                    <Row
                                    center
                                    >
                                    {
                                        _seatStatus.map((val, key) => {
                                            return (
                                                <Col
                                                key={key}
                                                style={{
                                                    justifyContent : 'center',
                                                    padding : 4,
                                                    flex : 0
                                                }}
                                                ignoreScreenSize>
                                                    <Seat
                                                    size={48}
                                                    visible={true}
                                                    backgroundColor={val.status == "free" ? '#fff' : "grey"}
                                                    number={val.seat}
                                                    color={val.status == "free" ? "#555" : "red"}
                                                    onSelect={() => {
                                                        
                                                    }}
                                                    disabled={true}
                                                    />
                                                </Col>
                                            )
                                        })
                                    }
                                    </Row>
                                </Row>
                            )
                        }
                        

                    </Card>
                </Col>

                <Col
                column={2}
                >
                    <Card
                    title='Daftar Rute'
                    >
                        <Input
                        withMargin
                        title={'Tripcode'}
                        placeholder={'Masukan Tripcode'}
                        value={_form.tripcode}
                        onChange={data => {
                            _updateQuery({
                                "tripcode": data
                            })
                        }}
                        />

                        <DatePicker
                        style={{
                            width: "100%"
                        }}
                        selected={_form.dateListRoute}
                        onChange={(date) => {
                            _updateQuery({
                                "dateListRoute": date
                            })
                        }}
                        customInput={<DatePickerListRoute/>}
                        />

                        <Col
                        marginBottom
                        withPadding
                        >
                            <Button
                            marginLeft
                            onProcess={_isProcessing}
                            small
                            title={"Terapkan"}
                            onClick={() => {
                                _getListRoute()
                                _getPointRoute()
                            }}
                            />
                        </Col>
                        
                        <h3>
                            Rute
                        </h3>

                        {
                                _listRoute.map((val, key) => {
                                return (
                                    <Row
                                    className={styles.traject_container}
                                    >
                                        <Col
                                        ignoreScreenSize
                                        column={1}
                                        style={{
                                            display: "grid"
                                        }}
                                        >
                                            <img src="/assets/icons/origin.svg" width="40"/>
                                            <img src="/assets/icons/destination.svg" width="40"/>
                                        </Col>

                                        <Col
                                        ignoreScreenSize
                                        column={4}
                                        >   
                                            <div>
                                                <span>{val.asal +" - " + val.nm_asal }</span>
                                            </div>
                                            
                                            <span>{val.tujuan + " - " + val.nm_tujuan}</span>
                                        </Col>

                                    </Row>  
                                )
                            }) 
                        }

                         
                        <h3
                        style={{
                            marginTop: "1rem"
                        }}
                        >
                            Poin Lintasan
                        </h3>

                        {
                            _listPoint.map((val, key) => {
                                return (
                                    <Row
                                    className={styles.traject_container}
                                    >
                                        <Col
                                        alignCenter
                                        ignoreScreenSize
                                        column={1}
                                        style={{
                                            display: "grid"
                                        }}
                                        >
                                        <strong>{val.sequence}</strong>
                                        </Col>

                                        <Col
                                        style={{
                                            display: "grid"
                                        }}
                                        ignoreScreenSize
                                        column={4}
                                        >   
                                            <span>{val.point +" - " + val.nm_point }</span>
                                            <span>{val.estimasi + " | " + val.timezone + " | Days Offset " +val.days_offset}</span>
                                        </Col>

                                    </Row>  
                                )
                            }) 
                        }
                    </Card>
                </Col>

                <Col
                column={6}
                >
                    <Card
                    title={"Status Booking Tiket"}
                    >
                        <Row
                        verticalEnd
                        marginBottom
                        >
                            <Input
                            title={'Segmentasi'}
                            placeholder={'Pilih segmentasi'}
                            value={_form.segmentStatusBooking.title}
                            suggestions={_segmentRange}
                            suggestionField={"title"}
                            onSuggestionSelect={data => {
                                _updateQuery({
                                    "segmentStatusBooking": data
                                })
                            }}
                            />

                            <Input
                            title={'Kode Booking'}
                            placeholder={'Masukan kode booking'}
                            value={_form.kd_booking}
                            onChange={data => {
                                _updateQuery({
                                    "kd_booking": data
                                })
                            }}
                            />

                            <Col
                            withPadding
                            marginBottom
                            column={1}
                            >
                                <Button
                                onProcess={_isProcessing}
                                small
                                title={"Cari Booking"}
                                onClick={() => {
                                    _getStatusBooking()
                                    _getDetailTicket()
                                }}
                                />
                            </Col>
                        </Row>
                        
                        {
                            _statusBooking?.st_payment && (
                                <Row
                                >
                                    <Col
                                    withPadding
                                    justifyCenter
                                    >
                                        <h3>Pembayaran</h3>

                                        <span>Kode Booking : {_statusBooking.kd_booking}</span>
                                        <span>Status : {_statusBooking.st_expire}</span>
                                        <span>Booking : {_statusBooking.st_booking}</span>
                                        <span>Payment : {_statusBooking.st_payment}</span>
                                        <span>Expired Time : {_statusBooking.exp_time}</span>
                                    </Col>

                                    {
                                        _detailTicket?.data && (

                                            <>
                                            
                                                <Col
                                                withPadding
                                                justifyCenter
                                                >
                                                    <h3>Perjalanan</h3>
                                                    
                                                    {
                                                        _detailTicket.data.map((val, key) => {
                                                            return (
                                                                <div
                                                                style={{
                                                                    display: "grid"
                                                                }}
                                                                key={key}>
                                                                    <span>Kode Booking : {val.kd_booking}</span>
                                                                    <span>Asal : {val.asal} - {val.nm_asal}</span>
                                                                    <span>Tujuan : {val.tujuan} - {val.nm_tujuan}</span>
                                                                    <span>Bis : {val.bis}</span>
                                                                    <span>Jam : {val.jam}</span>
                                                                    <span>Harga : {val.harga}</span>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                    
                                                </Col>

                                                <Col
                                                withPadding
                                                justifyCenter
                                                >
                                                    <h3>Penumpang</h3>
                                                    
                                                    {
                                                        _detailTicket.penumpang.map((val, key) => {
                                                            return (
                                                                <div
                                                                style={{
                                                                    display: "grid"
                                                                }}
                                                                key={key}>
                                                                    <span>{val.penumpang_nama}</span>
                                                                    <span
                                                                    style={{
                                                                        marginBottom: "1rem"
                                                                    }}
                                                                    >
                                                                        {val.kd_tiket} | Kursi {val.kursi}
                                                                    </span>
                                                                    
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                    
                                                </Col>
                                           </>
                                        )
                                    }
                                   
                                </Row>
                                
                            )
                        }
                    </Card>
                </Col>

               
            </Row>
            
            <Card
            title={"Asal dan Tujuan AKAP"}
            >
                <Row>
                    <Col
                    column={3}
                    >
                        <Table
                        exportToXls={false}
                        columns={COLUMN_ORIGIN}
                        records={_originRanges}
                        />
                    </Col>

                    <Col
                    column={3}
                    >
                        <Table
                        exportToXls={false}
                        columns={COLUMN_DESTINATION}
                        records={_destinationRanges}
                        />
                    </Col>
                </Row>
            </Card>
            
                    
              
           
                         
            </AdminLayout>
        </Main>
    )

}