import { useState, useEffect, useContext, createRef } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from './ScheduleTemplateModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'
import Label from '../Label'
import backgroundColor from '../../styles/sass/background-color.module.scss'
import Seat from '../Seat'
import SwitchButton from '../SwitchButton'

ScheduleTemplateModal.defaultProps = {
    closeModal: null,
    data: {},
    visible: false
}

export default function ScheduleTemplateModal(props = ScheduleTemplateModal.defaultProps) {

    const appContext = useContext(AppContext)

    const [_isProcessing, _setIsProcessing] = useState(false)
    const FORM = {
        "code": "",
        "branchId": "",
        "trajectTypeId": "",
        "trajectMasterId": "",
        "busCategoryId": "",
        "isPulang": true,
        "isPergi": true,
        "seatAvailable": 0,
        "trajectTypeName": "",
        "trajectTracks": [],
        "category": "",
        "branchName": "",
        "trajectMasterName": "",
        "busCategoryName": "",
        "classBus": "",
        "totalSeat": "",
        "seatLayout": null
    }
    const [_form, _setForm] = useState(FORM)
    const [_formTemp, _setFormTemp] = useState({})
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_segmentRanges, _setSegmentRanges] = useState([]);
    const [_trajectRanges, _setTrajectRanges] = useState([]);
    const [_busCategoryRanges, _setBusCategoryRanges] = useState([]);
    const [_activeTrip, _setActiveTrip] = useState(1)
    const [_seatsLayout, _setSeatsLayout] = useState(null)
    const [_selectedSeats, _setSelectedSeats] = useState([])
    const [_seatWrapperWidth, _setSeatWrapperWidth] = useState(0)
    const __seat_wrapper_ref = createRef()
    const [_fareTrajectRanges, _setFareTrajectRanges] = useState([]);
    const [_availableSeat, _setAvailableSeat] = useState(0)
    const [_bulkInputs, _setBulkInputs] = useState({
        fare: "",
        duration: "",
        departureTime: "",
        departureTimezone: "WIB"
    })

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

    const __COLUMNS = [
        {
            title: 'Asal',
            field: 'originName',
            textAlign: 'left'
        },
        {
            title: 'Tujuan',
            field: 'destinationName',
            textAlign: 'left'
        },
        {
            title: (
                <div>
                    <div>Tarif</div>
                    <Input
                        type={"currency"}
                        withMargin
                        placeholder='Isi semua'
                        value={_bulkInputs.fare}
                        onChange={data => {
                            _setBulkInputs(prev => ({ ...prev, fare: data }))
                            _applyBulkUpdate('fare', data)
                        }}
                    />
                </div>
            ),
            field: "fare",
            customCell: (value, row) => {
                return (
                    <div
                        key={row.id}
                    >
                        <Input
                            type={"currency"}
                            withMargin
                            placeholder='Masukan tarif'
                            value={value}
                            onChange={data => _updateFormTrajectTrack("fare", data, row.id)}
                        />
                    </div>
                )
            }
        },
        {
            title: (
                <div>
                    <div>Durasi Perjalanan</div>
                    <Row verticalCenter>
                        <Input
                            type={"number"}
                            withMargin
                            placeholder='Isi semua'
                            value={_bulkInputs.duration}
                            onChange={data => {
                                _setBulkInputs(prev => ({ ...prev, duration: data }))
                                _applyBulkUpdate('duration', data)
                            }}
                        />
                        <span>Menit</span>
                    </Row>
                </div>
            ),
            field: "duration",
            customCell: (value, row) => {
                return (
                    <Row
                        verticalCenter
                    >
                        <Input
                            type={"number"}
                            withMargin
                            placeholder='Dalam menit'
                            value={value}
                            onChange={data => _updateFormTrajectTrack("duration", data, row.id)}
                        />

                        <span>Menit</span>
                    </Row>

                )
            }
        },
        {
            title: (
                <div>
                    <div>Jam Keberangkatan</div>
                    <Input
                        withMargin
                        placeholder='HH:MM'
                        value={_bulkInputs.departureTime}
                        onChange={data => {
                            _setBulkInputs(prev => ({ ...prev, departureTime: data }))
                            _applyBulkUpdate('departureTime', data)
                        }}
                    />
                </div>
            ),
            field: "departureTime",
            customCell: (value, row, key) => {
                return (
                    <div
                        key={row.trajectTrackId}
                    >
                        <Input
                            withMargin
                            placeholder='HH:MM'
                            value={value}
                            onChange={data => _updateFormTrajectTrack("departureTime", data, row.id)}
                        />
                    </div>

                )
            }
        },
        {
            title: (
                <div>
                    <div>Zona Waktu</div>
                    <Label
                        activeIndex={_bulkInputs.departureTimezone}
                        labels={_zoneRanges.map(zone => ({
                            class: "primary",
                            title: zone.title,
                            value: zone.value,
                            onClick: () => {
                                _setBulkInputs(prev => ({ ...prev, departureTimezone: zone.value }))
                                const updatedData = _fareTrajectRanges.map((item) => ({
                                    ...item,
                                    departureTimezone: zone.value
                                }))
                                _setFareTrajectRanges(updatedData)
                            }
                        }))}
                    />
                </div>
            ),
            field: "departureTimezone",
            customCell: (value, row, key) => {

                return (
                    <div
                        key={key}
                    >
                        <Label
                            activeIndex={value}
                            labels={_zoneRanges.map(zone => ({
                                class: "primary",
                                title: zone.title,
                                value: zone.value,
                                onClick: () => {
                                    _updateFormTrajectTrack("departureTimezone", zone.value, row.id)
                                }
                            }))}
                        />
                    </div>
                )
            }
        },
        {
            title: (
                <div>
                    <div>Aktivasi</div>
                    <SwitchButton
                        checked={_fareTrajectRanges.every(item => item.status)}
                        onClick={() => {
                            const allActive = _fareTrajectRanges.every(item => item.status)
                            const updatedData = _fareTrajectRanges.map((item) => ({
                                ...item,
                                status: !allActive
                            }))
                            _setFareTrajectRanges(updatedData)
                        }}
                    />
                </div>
            ),
            field: 'status',
            customCell: (value, row, key) => {
                return (
                    <SwitchButton
                        checked={value}
                        onClick={data => _updateFormTrajectTrack("status", !value, row.id)}
                    />
                )
            }
        }
    ]

    const [_formTrajectTrack, _setFormTrajectTrack] = useState([])
    const [_isChangeFareTraject, _setIsChangeFareTraject] = useState(false)
    const [_isChangeTraject, _setIsChangeTraject] = useState(false)

    useEffect(() => {
        if (_form.trajectMasterName != "") {
            let isLoad = false

            if (_form.isPergi) {
                if (_form?.pergiTrajectId != _formTemp.trajectMasterPergiTrajectId) {
                    isLoad = true
                }
            } else {
                if (_form?.pulangTrajectId != _formTemp.trajectMasterPulangTrajectId) {
                    isLoad = true
                }
            }

            if (isLoad) {
                _getFareTraject()
            } else {
                _getFareTrajectTemporary()
            }
        }
    }, [_isChangeFareTraject])

    function _getFareTrajectTemporary() {
        let data = []
        props.data.trajectTracks.forEach(function (val, key) {

            if (isValidTime(val.departureTime)) {
                val.departureTime = val.departureTime.slice(0, -3)
            }

            data.push({
                "id": val.id,
                "fare": currency(val.fare),
                "duration": val.duration,
                "departureTime": val.departureTime,
                "departureTimezone": val.departureTimezone,
                "originName": val.originName,
                "destinationName": val.destinationName,
                "status": val.status
            })
        })
        _setFareTrajectRanges(data)
    }

    useEffect(() => {
        if (_form.trajectTypeName != "") {
            _getTraject()
        }
    }, [_form.trajectTypeName])

    useEffect(() => {
        _updateQuery({
            seatAvailable: _form?.totalSeat - _selectedSeats.length
        })
        _setAvailableSeat(_form?.totalSeat - _selectedSeats.length)

    }, [_selectedSeats])


    function _getSeatBackgroundColor(seat) {
        if (_selectedSeats.indexOf(seat.seatNumber) >= 0) {
            return backgroundColor.secondary
        }
        if (seat.status === 'booked' || seat.type === 'DRIVER') {
            return backgroundColor.medium_dark

        }

        if (seat.status === "reserved") {
            return backgroundColor.warning
        }

        if (!seat.status || seat.status === '-') {
            return 'transparent'
        }
        if (seat.status === 'free') {
            return '#fff'
        }
    }

    async function _submitData() {

        let urlTarget = "update"
        let seats = _selectedSeats
        let filterBlock = 0

        seats.forEach(function (val, key) {
            if (parseInt(val) > _form.totalSeat || parseInt(val) <= 0) {
                seats.splice(key, 1)
                filterBlock += 1
            }
        })

        let query = {
            ..._form,
            "seatBlockNumber": seats,
        }

        if (query.isPergi && query.isPulang) {
            popAlert({ message: 'Trip belum dipilih' })
            return false
        }

        if (!props.data.id) {
            urlTarget = "add"
            delete query.id
        }

        query.seatAvailable += filterBlock

        delete query.busCategoryName
        delete query.trajectMasterName
        delete query.branchName
        delete query.category
        delete query.trajectTypeName
        delete query.seatLayout
        delete query.totalSeat
        delete query.classBus
        delete query.pergiTrajectId
        delete query.pulangTrajectId

        query.trajectTracks = []
        _fareTrajectRanges.forEach(function (val, key) {
            if (val.status) {
                query.trajectTracks.push({
                    "trajectTrackId": val.id,
                    "fare": parseInt(`${val.fare}`.split(".").join("")),
                    "duration": parseInt(val.duration),
                    "departureTime": val.departureTime,
                    "departureTimezone": val.departureTimezone
                })
            }

        })

        _setIsProcessing(true)

        try {
            await postJSON('/masterData/jadwal/template/' + urlTarget, query, appContext.authData.token)

            popAlert({ message: 'Berhasil disimpan', type: 'success' })
            _updateQuery(FORM)
            props.onSuccess()
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _updateFormTrajectTrack(name, value, trajectTrackId) {
        const editData = _fareTrajectRanges.map((item) =>
            item.id === trajectTrackId && name ? { ...item, [name]: value } : item
        )
        _setFareTrajectRanges(editData)
    }

    function _applyBulkUpdate(field, value) {
        if (!value && value !== 0) return

        const updatedData = _fareTrajectRanges.map((item) => ({
            ...item,
            [field]: value
        }))

        console.log("uda")
        console.log(updatedData)
        _setFareTrajectRanges(updatedData)
    }

    async function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 300
        }

        try {
            const branch = await postJSON(`/masterData/branch/list`, params, appContext.authData.token)
            let branchRange = [];
            branch.data.forEach(function (val, key) {
                branchRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setBranchRanges(branchRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getSegmentation() {
        const params = {
            "startFrom": 0,
            "length": 300
        }

        try {
            const segment = await postJSON(`/masterData/trayekType/list`, params, appContext.authData.token)
            let segmentRange = [];
            segment.data.forEach(function (val, key) {
                segmentRange.push({
                    "title": val.name,
                    "value": val.id,
                    ...val
                })
            })
            _setSegmentRanges(segmentRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 750,
            "trajectTypeId": `${_form.trajectTypeId}`
        }

        try {
            const traject = await postJSON(`/masterData/trayekMaster/list`, params, appContext.authData.token)
            let trajectRange = [];
            traject.data.forEach(function (val, key) {
                trajectRange.push({
                    "title": "(" + val.code + ") " + val.name,
                    "value": val.id,
                    ...val
                })
            })
            _setTrajectRanges(trajectRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getBusCategory() {
        const params = {
            "startFrom": 0,
            "length": 750,
        }

        try {
            const busCategory = await postJSON(`/masterData/bus/kategori/list`, params, appContext.authData.token)
            let busCategoryRange = [];
            busCategory.data.forEach(function (val, key) {
                busCategoryRange.push({
                    "title": val.code + " (" + val.name + ")",
                    "value": val.id,
                    ...val
                })
            })
            _setBusCategoryRanges(busCategoryRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getFareTraject() {
        const params = {
            "startFrom": 0,
            "length": 750,
        }

        params.trajectId = _form.isPergi ? _form.pergiTrajectId : _form.pulangTrajectId

        try {
            const fareTraject = await postJSON(`/masterData/trayekTrack/list`, params, appContext.authData.token)
            let data = []
            fareTraject.data.forEach(function (val, key) {
                data.push({
                    "id": val.id,
                    "fare": val.fare,
                    "duration": 0,
                    "departureTime": "",
                    "departureTimezone": "",
                    "originName": val.originName,
                    "destinationName": val.destinationName,
                    "status": true
                })
            })
            _setFareTrajectRanges(fareTraject.data)
        } catch (e) {
            console.log(e)
        }
    }

    function isDisabledSeat(data) {
        let state = true

        if (data == "free" || data == "A") {
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

    useEffect(() => {
        _getBranch()
        _getSegmentation()
        _getBusCategory()

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
        if (props.data?.id) {

            _setFormTemp(props.data)

            _updateQuery({
                "code": props.data.code,
                "branchId": props.data.branchId,
                "trajectTypeId": props.data.trajectTypeId,
                "trajectMasterId": props.data.trajectMasterId,
                "busCategoryId": props.data.busCategoryId,
                "isPulang": props.data.isPulang,
                "isPergi": props.data.isPergi,
                "seatAvailable": props.data.seatAvailable,
                "trajectTypeName": props.data.trajectTypeName,
                "trajectTracks": props.data.trajectTracks,
                "category": props.data.trajectTypeCategory,
                "branchName": props.data.branchName,
                "trajectMasterName": props.data.trajectMasterName,
                "busCategoryName": props.data.busCategoryCode + " (" + props.data.busCategoryName + ")",
                "seatLayout": props.data.busCategorySeatLayout,
                "totalSeat": props.data.busCategoryTotalSeat,
                "classBus": props.data.busCategoryName,
                "id": props.data.id
            })

            _getFareTrajectTemporary()
            _setActiveTrip(props.data.isPulang)

            let dataSeat = []
            props.data.seatBlockNumber.forEach(function (val, key) {
                if (val > 0) {
                    dataSeat.push(`${val}`)
                }
            })
            _setSelectedSeats(dataSeat)
            _setAvailableSeat(props.data.seatAvailable)

        } else {

            _updateQuery(FORM)
            _setSelectedSeats([])
            // _setAvailableSeat(0)
            _setActiveTrip(1)
            _setSeatsLayout(null)
            _setFareTrajectRanges([])
            _updateQuery({
                seatAvailable: 0
            })
        }

    }, [props.data])

    function isValidTime(timeString) {
        var pattern = /^(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/;

        if (timeString != null) {
            if (timeString.match(pattern)) {
                return true;
            } else {
                return false
            }
        } else {
            return false
        }

    }

    return (
        <Modal
            visible={props.visible}
            onBackdropClick={props.closeModal}
            centeredContent
            extraLarge
        >
            <ModalContent
                header={{
                    title: (props.data?.id ? 'Ubah' : 'Tambah') + ` Jadwal Template `,
                    closeModal: props.closeModal
                }}
            >
                <form
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 9999,
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
                            column={2}
                        >
                            <Input
                                maxLength={11}
                                withMargin
                                title="Kode Jadwal Keberangkatan"
                                placeholder='Masukan kode jadwal'
                                onChange={(value) => {
                                    _updateQuery({
                                        code: value.replace(" ", "")
                                    })
                                }}
                                value={_form.code}
                            />

                            <Col
                                withPadding
                                column={6}
                            >
                                <div
                                    className={styles.form_item}
                                >
                                    <p
                                        className={styles.mb_1}
                                    >
                                        Trip
                                    </p>

                                    <Label
                                        activeIndex={_activeTrip}
                                        labels={[
                                            {
                                                class: "primary",
                                                title: 'Trip Pergi',
                                                value: false,
                                                onClick: () => {
                                                    _setActiveTrip(false)
                                                    _updateQuery({
                                                        "isPergi": true,
                                                        "isPulang": false
                                                    })
                                                    _setIsChangeFareTraject(!_isChangeFareTraject)
                                                }
                                            },
                                            {
                                                class: "warning",
                                                title: 'Trip Pulang',
                                                value: true,
                                                onClick: (value) => {
                                                    _setActiveTrip(true)
                                                    _updateQuery({
                                                        "isPergi": false,
                                                        "isPulang": true
                                                    })
                                                    _setIsChangeFareTraject(!_isChangeFareTraject)
                                                }
                                            }
                                        ]}
                                    />
                                </div>
                            </Col>

                            <div
                                className={styles.mb_1}
                            >
                                <Input
                                    withMargin
                                    title={"Cabang"}
                                    placeholder={'Pilih Cabang'}
                                    value={_form.branchName}
                                    suggestions={_branchRanges}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "branchId": value.value,
                                            "branchName": value.title
                                        })
                                    }}
                                />
                            </div>

                            <div
                                className={styles.mb_1}
                            >
                                <Input
                                    withMargin
                                    title={"Segmentasi"}
                                    placeholder={'Pilih Segmentasi'}
                                    value={_form.trajectTypeName}
                                    suggestions={_segmentRanges}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "trajectTypeId": value.value,
                                            "trajectTypeName": value.title,
                                            "category": value.category
                                        })

                                        _setIsChangeTraject(!_isChangeTraject)
                                    }}
                                />
                            </div>

                            <Input
                                withMargin
                                title={"Trayek"}
                                placeholder={'Pilih Trayek'}
                                value={_form.trajectMasterName}
                                suggestions={_trajectRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "trajectMasterId": value.value,
                                        "trajectMasterName": value.title,
                                        "pergiTrajectId": value.pergiTrajectId,
                                        "pulangTrajectId": value.pulangTrajectId
                                    })

                                    _setIsChangeFareTraject(!_isChangeFareTraject)
                                }}
                            />
                        </Col>

                        <Col
                            column={2}
                        >

                            <Input
                                withMargin
                                title={"Kategori Bis"}
                                placeholder={'Pilih Kategori'}
                                value={_form.busCategoryName}
                                suggestions={_busCategoryRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "busCategoryId": value.value,
                                        "busCategoryName": value.title,
                                        "seatLayout": value.seatLayout,
                                        "totalSeat": value.totalSeat,
                                        "classBus": value.name,
                                        "seatAvailable": value.totalSeat == null ? 0 : value.totalSeat
                                    })
                                }}
                            />


                            {
                                _form?.seatLayout != null && (
                                    <div
                                        style={{
                                            marginLeft: ".5rem"
                                        }}
                                    >

                                        <Col
                                            column={6}
                                            withPadding
                                        >
                                            <div
                                                style={{
                                                    display: "grid"
                                                }}
                                            >
                                                <span
                                                    className={styles.mb_1}
                                                >
                                                    Jumlah Kursi
                                                </span>
                                                <h3>{_form?.totalSeat}</h3>
                                            </div>
                                        </Col>

                                        <Col
                                            column={6}
                                            withPadding
                                            className={styles.mb_1}
                                        >
                                            <div
                                                style={{
                                                    display: "grid"
                                                }}
                                            >
                                                <span
                                                    className={styles.mb_1}
                                                >
                                                    Jumlah Kursi Tersedia
                                                </span>
                                                <h3>{_availableSeat}</h3>
                                            </div>
                                        </Col>

                                        <Col
                                            column={6}
                                            withPadding
                                        >
                                            <div
                                                style={{
                                                    display: "grid"
                                                }}
                                            >
                                                <span
                                                    className={styles.mb_1}
                                                >
                                                    Jumlah Kursi Ditutup
                                                </span>
                                                <h3>{_selectedSeats.length}</h3>
                                            </div>
                                        </Col>
                                    </div>
                                )
                            }
                        </Col>

                        <Col
                            column={1}
                        >
                            {
                                _seatsLayout && (
                                    <div
                                        className={styles.mb_1}
                                    >
                                        Pilih kursi yang ingin ditutup
                                    </div>
                                )
                            }

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
                                                                    justifyContent: 'center',
                                                                    padding: 4,
                                                                    flex: 0,
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



                    <Row>
                        <Col
                            column={2}
                        >


                        </Col>

                        <Col
                            column={2}
                        >

                        </Col>

                        <Col
                            column={2}
                        >

                        </Col>
                    </Row>

                    <Row>




                    </Row>

                    <Row
                        withPadding
                    >


                    </Row>

                    <Table
                        columns={__COLUMNS}
                        records={_fareTrajectRanges}
                    />

                    <Col
                        column={2}
                        withPadding
                        style={{ "marginTop": "3rem" }}
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