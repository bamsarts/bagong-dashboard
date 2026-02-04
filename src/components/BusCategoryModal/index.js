import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { useEffect, useState, useContext, createRef } from 'react'
import Input from '../Input'
import { postJSON, get, API_ENDPOINT, CACHE_URL } from '../../api/utils'
import Button from '../Button'
import styles from './BusCategoryModal.module.scss'
import { popAlert } from '../Main'
import { Col, Row } from '../Layout'
import { AiFillDelete } from 'react-icons/ai'
import generateClasses from '../../utils/generateClasses'
import SwitchButton from '../SwitchButton'
import backgroundColor from '../../styles/sass/background-color.module.scss'
import Seat from '../Seat'
import SelectArea from '../SelectArea'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    type: ""
}

BusCategoryModal.defaultProps = defaultProps

export default function BusCategoryModal(props = defaultProps) {
    const appContext = useContext(AppContext)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const CONFIG_PARAM = {
        "code": "",
        "seatLayout": "",
        "type": "",
        "totalSeat": "",
        "name": "",
        "id": "",
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_mediaCategories, _setMediaCategories] = useState([])
    const [_mediaRanges, _setMediaRanges] = useState([])
    const [_formMedia, _setFormMedia] = useState({})
    const [_facilityRanges, _setFacilityRanges] = useState([])
    const [_titleModal, _setTitleModal] = useState("Tambah Bus Kategori")
    const __seat_wrapper_ref = createRef()
    const __seat_wrapper_facility_ref = createRef()
    const [_seatWrapperWidth, _setSeatWrapperWidth] = useState(0)
    const [_seatsLayout, _setSeatsLayout] = useState(null)
    const [_trajectRanges, _setTrajectRanges] = useState([])
    const [_selectedTraject, _setSelectedTraject] = useState([])

    useEffect(() => {

        if (props.data?.id) {
            _updateQuery({
                ...props.data,
            })

            _setTitleModal("Ubah Bus Kategori")

            if (props.type == "media") {
                _getMedia()
                _getMediaBusCategory()
                _setTitleModal("Ubah Media Bus")
            }

            if (props.type == "facility") {
                _getTraject()
                _getFacilityBusCategory()
                _setTitleModal("Ubah Fasilitas Bus")
            }
        } else {
            _setSeatsLayout(null)
        }
    }, [props.data])

    useEffect(() => {

        if (_form?.seatLayout != "" && _form?.seatLayout != null) {
            let seatArray = new Array()

            _form.seatLayout.split(";").forEach(function (val, key) {
                seatArray[key] = new Array()
                val.split(",").forEach(function (i, j) {
                    let objSeat = {
                        type: "",
                        seatNumber: "",
                        status: "",
                        passenger: ""
                    }

                    i.split("|").forEach(function (a, b) {

                        if (b == 0) {
                            objSeat.type = a
                        } else if (b == 1) {
                            objSeat.seatNumber = a
                        } else if (b == 2) {
                            objSeat.status = a
                        } else {
                            objSeat.passenger = a
                        }
                    })
                    seatArray[key].push(objSeat)
                })
            })

            _setSeatsLayout(seatArray)

            if (props.type == "" || props.type == "facility") {
                _setSeatWrapperWidth(document.getElementsByClassName('seat_wrapper').offsetWidth)

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
            }
        }
    }, [_form.seatLayout])

    function _updateQuery(data = {}, type = null) {

        if (type == null) {
            _setForm(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })

        } else if (type == "media") {
            data.imageId = data.id
            let mediaFound = _mediaCategories
            mediaFound.push(data)
            var cleanMediaFound = mediaFound.filter((arr, index, self) =>
                index === self.findIndex((t) => (t.imageId === arr.imageId)))
            _setMediaCategories(cleanMediaFound)

        } else if (type == "del-media") {
            var cleanMediaFound = _mediaCategories.filter((arr, index, self) => index !== data)
            _setMediaCategories(cleanMediaFound)

        } else if (type == "update-facility") {
            let facility = _facilityRanges
            facility[data].status = !facility[data].status
            _setFacilityRanges(oldQuery => {
                return [
                    ...oldQuery
                ]
            })
        }
    }

    function _getSeatBackgroundColor(seat) {

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

    function _clearForm() {
        _setForm(CONFIG_PARAM)
    }

    async function _getMedia() {

        let params = {
            startFrom: 0,
            length: 460,
            orderBy: "id",
            sortMode: "desc"
        }

        try {
            const res = await postJSON(`/masterData/media/image/list`, params, appContext.authData.token)

            if (res) {
                _setMediaRanges(res.data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getMediaBusCategory() {
        try {
            const media = await get('/masterData/bus/kategori/image/' + props.data?.id, appContext.authData.token)
            _setMediaCategories(media.data)
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getFacilityBusCategory() {
        try {
            const facility = await get('/masterData/bus/kategori/fasilitas/' + props.data?.id + "/{traject_id}", appContext.authData.token)
            _setFacilityRanges(facility.data)
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    useEffect(() => {
        console.log(_selectedTraject)
    }, [_selectedTraject])

    async function _submitData() {
        _setIsProcessing(true)

        try {
            let typeUrl = "add"
            let query = {
                ..._form
            }

            if (props.data.id) {
                typeUrl = "update"
            } else {
                delete query.id
            }

            const result = await postJSON('/masterData/bus/kategori/' + typeUrl, query, appContext.authData.token)
            props.refresh()
            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil disimpan", "type": "success" })
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _updateMediaFacility(type) {
        _setIsProcessing(true)

        try {
            let query = {
                "bus_category_id": props.data?.id,
            }

            // if(type == "fasilitas"){
            //     query.traject_id = `${_selectedTraject[0].id}`
            // }

            if (type == "image") {
                let images = []
                _mediaCategories.forEach(function (val, key) {
                    images.push(val.imageId)
                })
                query.image_id = images.join()
                _cacheBusCategory("images/bus-category/" + props.data?.id)
            } else {
                let facilities = []
                _facilityRanges.forEach(function (val, key) {
                    if (val.status) {
                        facilities.push(val.id)
                    }
                })
                query.bus_facility_id = facilities.join()
                _cacheBusCategory("facilities/bus-category/" + props.data?.id)
            }

            const result = await postJSON('/masterData/bus/kategori/' + type + '/update', query, appContext.authData.token)
            props.refresh()
            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil disimpan", "type": "success" })
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _cacheBusCategory(targetUrl) {
        try {
            const resultCache = await get({
                url: "/api/api-server-side?url=" + CACHE_URL + "/cache/" + targetUrl
            })
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 900,
            "companyId": 1
        }

        try {
            const traject = await postJSON(`/masterData/trayek/list`, params, appContext.authData.token)


            traject.data.forEach(function (val, key) {
                val.name = "(" + val.code + ") " + val.name
            })

            _setTrajectRanges(traject.data)

        } catch (e) {
            console.log(e)
        }
    }

    function _updateTraject(data = {}, isDelete = false) {
        let trajects = [..._selectedTraject]
        const index = _selectedTraject.indexOf(data)

        if (index < 0 && !isDelete) {
            trajects.push(data)
        } else {
            trajects.splice(index, 1)
        }

        _setSelectedTraject(trajects)
    }


    return (
        <Modal
            visible={props.visible}
            centeredContent
            large
        >
            <ModalContent
                header={{
                    title: _titleModal,
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    },
                }}
            >
                {
                    props.type == "" && (
                        <Row>
                            <Col
                                column={4}
                            >

                                <Input
                                    withMargin
                                    title={"Kode Kategori"}
                                    placeholder={'Masukan Kode'}
                                    value={_form.code}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "code": value
                                        })
                                    }}
                                />

                                <Input
                                    withMargin
                                    title={"Nama Kategori"}
                                    placeholder={'Nama Kategori'}
                                    value={_form.name}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "name": value
                                        })
                                    }}
                                />

                                <Input
                                    withMargin
                                    title={"Jumlah Kursi"}
                                    placeholder={''}
                                    value={_form.totalSeat == null ? 0 : _form.totalSeat}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "totalSeat": value
                                        })
                                    }}
                                />

                                <Input
                                    withMargin
                                    title={"Tipe"}
                                    placeholder={'Masukan Tipe'}
                                    value={_form.type}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "type": value
                                        })
                                    }}
                                />

                                <Input
                                    withMargin
                                    multiline={3}
                                    title={"Layout Kursi"}
                                    placeholder={'Masukan format layout kursi'}
                                    value={_form.seatLayout}
                                    onChange={(data) => {
                                        _updateQuery({
                                            "seatLayout": data
                                        })
                                    }}
                                />


                                <div className={styles.buttonContainer}>
                                    <Button
                                        title={'Simpan'}
                                        styles={Button.secondary}
                                        onClick={_submitData}
                                        onProcess={_isProcessing}
                                    />
                                </div>
                            </Col>

                            <Col
                                column={2}
                            >
                                <div>
                                    <span>Preview Layout</span>

                                    <div
                                        class={'seat_wrapper'}
                                        ref={__seat_wrapper_ref}
                                    >
                                        {

                                            (_seatsLayout != null || _seatsLayout != "") && (

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
                                                                                visible={['SEAT', 'DRIVER', 'TOILET', 'STAIR_UP', 'STAIR_DOWN'].indexOf(col.type) >= 0}
                                                                                backgroundColor={_getSeatBackgroundColor(col)}
                                                                                number={col.type == "SEAT" ? col.seatNumber : ''}
                                                                                color={backgroundColor.warning}
                                                                                onSelect={false}
                                                                                isBusDriver={col.type}
                                                                                disabled={true}
                                                                            />
                                                                        </Col>
                                                                    )
                                                                })
                                                            }
                                                        </Row>
                                                    )
                                                })

                                            )
                                        }
                                    </div>
                                </div>
                            </Col>

                        </Row>
                    )
                }

                {
                    props.type == "media" && (
                        <>
                            <Input
                                title={"Gambar Bus"}
                                withMargin
                                placeholder={'Pilih Gambar'}
                                value={_formMedia.image_title}
                                suggestions={_mediaRanges}
                                suggestionField={'title'}
                                suggestionImage={'link'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery(value, "media")
                                }}
                            />

                            <Row
                                spaceEvenly
                            >
                                {
                                    _mediaCategories.map(function (val, key) {
                                        return (
                                            <div>
                                                <div
                                                    className={styles.media_item}
                                                >
                                                    <img
                                                        style={{ "margin": "auto" }}
                                                        src={val.link + "?option=thumbnail&size=10"}
                                                        width="100%"
                                                        heght="auto"
                                                    />
                                                </div>

                                                <div
                                                    title={"Hapus"}
                                                    className={generateClasses([
                                                        styles.button_action,
                                                        styles.text_red
                                                    ])}
                                                    onClick={() => {
                                                        _updateQuery(key, "del-media")
                                                    }}
                                                >
                                                    <AiFillDelete />
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </Row>

                            <div
                                style={{ "margin-top": "10rem" }}
                                className={styles.buttonContainer}
                            >
                                <Button
                                    title={'Simpan'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _updateMediaFacility("image")
                                    }}
                                    onProcess={_isProcessing}
                                />
                            </div>
                        </>
                    )
                }

                {
                    props.type == "facility" && (
                        <>
                            {/* <SelectArea
                            field={"name"}
                            title={'Trayek'}
                            onSelect={(data) => {
                                _updateTraject(data, true)
                            }}
                            select={_selectedTraject}
                            />

                            <Input
                            withMargin
                            title={""}
                            placeholder={'Pilih Trayek'}
                            value={_form.traject}
                            suggestions={_trajectRanges}
                            suggestionField={'name'}
                            onSuggestionSelect={(data) => {
                                _updateTraject(data)
                                return false
                            }}
                            /> */}

                            {
                                _facilityRanges.length > 0 && (


                                    <Row>
                                        <Col
                                            column={4}
                                        >
                                            {
                                                _facilityRanges.map(function (val, key) {
                                                    return (
                                                        <Row
                                                            spaceBetween
                                                            withPadding
                                                        >
                                                            <div
                                                                style={{ "display": "grid" }}
                                                            >
                                                                <img
                                                                    style={{ "margin": "auto" }}
                                                                    src={val.link + "?option=thumbnail&size=10"}
                                                                    width="50"
                                                                    height="50"
                                                                />
                                                            </div>

                                                            <span>{val.name}</span>

                                                            <SwitchButton
                                                                checked={val.status}
                                                                onClick={() => {
                                                                    _updateQuery(key, "update-facility")
                                                                }}
                                                            />
                                                        </Row>
                                                    )
                                                })
                                            }
                                        </Col>

                                        <Col
                                            column={2}
                                        >
                                            <div>
                                                <span>Preview Layout Fasilitas</span>

                                                <div
                                                    class={'seat_wrapper'}
                                                    ref={__seat_wrapper_ref}
                                                >
                                                    {

                                                        (_seatsLayout != null || _seatsLayout != "") && (

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
                                                                                            visible={['SEAT', 'DRIVER', 'TOILET', 'STAIR_UP', 'STAIR_DOWN'].indexOf(col.type) >= 0}
                                                                                            backgroundColor={_getSeatBackgroundColor(col)}
                                                                                            number={col.type == "SEAT" ? col.seatNumber : ''}
                                                                                            color={backgroundColor.warning}
                                                                                            onSelect={false}
                                                                                            isBusDriver={col.type}
                                                                                            disabled={true}
                                                                                        />
                                                                                    </Col>
                                                                                )
                                                                            })
                                                                        }
                                                                    </Row>
                                                                )
                                                            })

                                                        )
                                                    }
                                                </div>
                                            </div>
                                        </Col>

                                    </Row>

                                )
                            }

                            <div
                                className={styles.buttonContainer}
                            >
                                <Button
                                    title={'Simpan'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _updateMediaFacility("fasilitas")
                                    }}
                                    onProcess={_isProcessing}
                                />
                            </div>
                        </>
                    )
                }

            </ModalContent>

        </Modal>
    )
}