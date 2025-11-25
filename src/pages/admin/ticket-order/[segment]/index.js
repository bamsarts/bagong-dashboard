import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import { FaTicketAlt } from 'react-icons/fa'
import { BsArrowRight } from 'react-icons/bs'

import { TICKET_ORDER_URL, DAMRI_APPS_URL, API_ENDPOINT, get, objectToParams, postJSON } from '../../../../api/utils'
import { getSessionStorage, setSessionStorage } from '../../../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'

import AdminLayout from '../../../../components/AdminLayout'
import Button from '../../../../components/Button'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import { Col, Row } from '../../../../components/Layout'
import Main, { popAlert } from '../../../../components/Main'
import TransactionHistoryModal from '../../../../components/TransactionHistoryModal'

import { currency, dateFilter } from '../../../../utils/filters'

import styles from '../TicketOrder.module.scss'
import TicketOrderCreate from '../create'
import generateClasses from '../../../../utils/generateClasses'

BusSchedule.BUS_SCHEDULE_QUERY_SESSION = 'BUS_SCHEDULE_QUERY_SESSION'
BusSchedule.ORIGIN_CACHE = "DAMRI_ORIGIN_TICKET_ORDER"

export default function BusSchedule(props) {
    
    const router = useRouter()
    const today = dateFilter.basicDate(new Date()).normal

    const { query : { segment } } = router

    const SEGMENT = segment.toUpperCase()

    const [_origins, _setOrigins] = useState([])
    const [_localOrigins, _setLocalOrigins] = useState([])
    const [_destinations, _setDestinations] = useState([])
    const [_selectedDate, _setSelectedDate] = useState(today)
    const [_selectedOrigin, _setSelectedOrigin] = useState(null)
    const [_selectedDestination, _setSelectedDestination] = useState(null)
    const [_schedule, _setSchedule] = useState(null)
    const [_isGettingSchedule, _setIsGettingSchedule] = useState(false)
    const [_transactionHistoryModalVisible, _setTransactionHistoryModalVisible] = useState(false)

    useEffect(() => {
        if(_localOrigins.length > 0){
            setLocalStorage(BusSchedule.ORIGIN_CACHE + '_' + SEGMENT, {
                origin : _localOrigins,
            })
        }
    }, [_localOrigins])

    useEffect(() => {
        _getOrigins()
        // _getPoints()
        try {
            const query = getSessionStorage(BusSchedule.BUS_SCHEDULE_QUERY_SESSION + '_' + SEGMENT)
            _setSelectedDate(query.selectedDate || today)
            _setSelectedOrigin(query.selectedOrigin || null)
            _setSelectedDestination(query.selectedDestination || null)
        } catch {}
    }, [SEGMENT])

    useEffect(() => {
        if (_selectedOrigin?.pointId) {
            _getDestinations(_selectedOrigin.pointId)
        }
    }, [_selectedOrigin])

    useEffect(() => {
        if (_selectedOrigin?.pointId && _selectedDestination?.pointId) {
            _getSchedule()
        }
        // if (_selectedOrigin?.id && _selectedDestination?.id) {
        //     _getSchedule()
        // }
    }, [_selectedDestination])

    async function _getPoints(){
        const params = {
            startFrom: 0,
            length: 570
        }

        try {
            const pointLists = await postJSON(`/masterData/point/lokasi/list`, params, props.authData.token)
            _setOrigins(pointLists.data)
            _setDestinations(pointLists.data)
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getLocalOrigin(){
        const query = getLocalStorage(BusSchedule.ORIGIN_CACHE + '_' + SEGMENT)
      
        if(query?.origin.length > 0){
            _setOrigins(query.origin)
        }else{
            _setOrigins([{
                title: "Sedang memuat data",
                alias: "Sedang memuat data",
                pointId: null
            }])
        }
    }

    async function _getOrigins() {
       
        _getLocalOrigin()

        try {
            // const result = await postJSON({ url : DAMRI_APPS_URL + `/${SEGMENT.toLowerCase()}/origin?category=${SEGMENT}` }, props.authData.token)
            const result = await get({ url : TICKET_ORDER_URL + `/dashboard/origin?category=${SEGMENT}` }, props.authData.token)

            let data = []
            

            // result.data.forEach(function(val, key){
            //     val.data.forEach(function(i, j){
            //         data.push(i)
            //     })
            // })

            result.data.forEach(function(val, key){
               data.push({
                   title: val.name,
                   alias: val.name,
                   pointId: val.pointId
               })
            })

            _setOrigins(data)
            _setLocalOrigins(data)

        } catch {}
    }

    async function _getDestinations(pointId) {
        _setDestinations([{
            title: "Sedang memuat data",
            alias: "Sedang memuat data",
            pointId: null
        }])
        
        try {
            let data = []
            // const result = await postJSON({ url : DAMRI_APPS_URL + `/${SEGMENT.toLowerCase()}/destination?category=${SEGMENT}&pointId=${pointId}` }, props.authData.token)
            const result = await get({ url : TICKET_ORDER_URL + `/dashboard/destination?category=${SEGMENT}&pointId=${pointId}` }, props.authData.token)
            
            // result.data.forEach(function(val, key){
            //     val.data.forEach(function(i, j){
            //         data.push(i)
            //     })
            // })

            result.data.forEach(function(val, key){
                data.push({
                    title: val.name,
                    alias: val.name,
                    pointId: val.pointId
                })
            })


            _setDestinations(data)
        } catch {}
    }

    function _filterSchedule(data){
        let clean = data.filter((arr, index, self) => 
            index === self.findIndex((t) => 
                (t.trajectCode === arr.trajectCode && t.busName === arr.busName && t.busCategoryName === arr.busCategoryName)
            )
        )

        return clean
    }

    async function _getSchedule() {
        _setIsGettingSchedule(true)
        _setSchedule(null)
        const query = {
            category : SEGMENT,
            date : _selectedDate,
            originId : _selectedOrigin.pointId,
            destinationId : _selectedDestination.pointId,
            // originId : _selectedOrigin.id,
            // destinationId : _selectedDestination.id
        }

        try {

            //v3 get from self database
            //v2 get from SIMA DAMRI
            //v1 get from OTA DAMRI

            const result = await postJSON({ url : TICKET_ORDER_URL + `/dashboard/schedule?${objectToParams(query)}` }, null, props.authData.token)
            
            _setSchedule(_filterSchedule(result.data))

            setSessionStorage(BusSchedule.BUS_SCHEDULE_QUERY_SESSION + '_' + SEGMENT, {
                selectedDate : _selectedDate,
                selectedOrigin : _selectedOrigin,
                selectedDestination : _selectedDestination,
            })
        } catch (e) {
            popAlert({ message: e.message.id })
        }
        finally {
            _setIsGettingSchedule(false)
        }
    }

    return (
        <Main>
            <TransactionHistoryModal
            visible={_transactionHistoryModalVisible}
            closeModal={() => _setTransactionHistoryModalVisible(false)}
            />
            <AdminLayout>
                <Card
                headerContent={(
                    <Row
                    verticalCenter
                    spaceBetween
                    marginBottom
                    >
                        <Col
                        column={3}
                        >
                            <b>
                                Cari Jadwal
                            </b>
                        </Col>
                        <Col
                        column={3}
                        alignEnd
                        >
                            <Button
                            title={'Riwayat Transaksi'}
                            styles={Button.secondary}
                            onClick={() => _setTransactionHistoryModalVisible(true)}
                            small
                            />
                        </Col>
                    </Row>
                )}
                >
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={5}
                        >
                            <Row>
                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Tanggal'}
                                    type={'date'}
                                    min={today}
                                    value={_selectedDate}
                                    onChange={date => _setSelectedDate(dateFilter.basicDate(new Date(date)).normal)}
                                    />
                                </Col>
                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Asal'}
                                    value={_selectedOrigin?.title || ''}
                                    suggestions={_origins}
                                    suggestionField={'alias'}
                                    onSuggestionSelect={(origin) => {
                                        _setSelectedDestination(null)
                                        _setSelectedOrigin(origin)
                                        return false
                                    }}
                                    />
                                </Col>
                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Tujuan'}
                                    value={_selectedDestination?.title || ''}
                                    suggestions={_destinations}
                                    suggestionField={'alias'}
                                    onSuggestionSelect={(destination) => {
                                        _setSelectedDestination(destination)
                                        return false
                                    }}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Button
                            title={'Cari Tiket'}
                            icon={<FaTicketAlt/>}
                            onProcess={_isGettingSchedule}
                            fluidWidth
                            onClick={() => {
                                if (_selectedDestination?.pointId) {
                                    _getSchedule()
                                }
                                // if (_selectedDestination?.id) {
                                //     _getSchedule()
                                // }
                            }}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    _schedule && (
                        <Card
                        noPadding
                        headerContent={(
                            <Row
                            spaceBetween
                            verticalCenter
                            withPadding
                            >
                                <Col
                                column={4}
                                withPadding
                                >
                                    <h3
                                    style={{
                                        margin : 0
                                    }}
                                    >
                                        {_schedule.length > 0 ? 'Jadwal Tersedia' : 'Jadwal Tidak Tersedia'}
                                    </h3>
                                </Col>
                                {/* <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    />
                                </Col> */}
                            </Row>
                        )}
                        >
                            {
                                _schedule.map((item, key) => {
                                    return (
                                        <Row
                                        key={key}
                                        className={generateClasses([
                                            styles.schedule,
                                            item.seatAvailable === 0 && styles.seat_sold_out
                                        ])}
                                        verticalCenter
                                        >
                                            <Col
                                            column={2}
                                            mobileFullWidth
                                            className={styles.bus}
                                            >
                                                <Row
                                                >
                                                    <Col
                                                    column={3}
                                                    ignoreScreenSize
                                                    >
                                                        <h3>
                                                            {item.busName}
                                                        </h3>
                                                        <small>
                                                            <b>
                                                                {item.busCategoryName}
                                                            </b>
                                                        </small>
                                                        {
                                                            item.note && (
                                                                <div>
                                                                    <p
                                                                    style={{
                                                                        fontSize : '.65rem',
                                                                        padding : '.25rem',
                                                                        whiteSpace : 'pre-line'
                                                                    }}
                                                                    >
                                                                        {item.note}
                                                                    </p>
                                                                </div>
                                                            )
                                                        }
                                                    </Col>
                                                    <Col
                                                    column={3}
                                                    ignoreScreenSize
                                                    >
                                                        <p>
                                                            <small>
                                                                Trayek
                                                            </small>
                                                        </p>
                                                        <p>
                                                            <b>
                                                                {item.trajectCode}
                                                            </b>
                                                        </p>
                                                    </Col>
                                                </Row>
                                            </Col>
                                            <Col
                                            column={3}
                                            >
                                                <Row
                                                verticalCenter
                                                >
                                                    <Col
                                                    column={4}
                                                    mobileFullWidth
                                                    >
                                                        <Row
                                                        verticalCenter
                                                        center
                                                        >
                                                            <Col
                                                            column={2}
                                                            ignoreScreenSize
                                                            >
                                                                <p>
                                                                    <small>
                                                                        Asal
                                                                    </small>
                                                                </p>
                                                                <b>
                                                                    <small>
                                                                        {item.originName}
                                                                    </small>
                                                                </b>
                                                                <small
                                                                style={{
                                                                    fontSize : '.75rem',
                                                                    display : 'block'
                                                                }}
                                                                >
                                                                    {dateFilter.getMonthDate(new Date(item.departureDate))} {item.estimatedTime ? item.estimatedTime.substr(0,5) + ` WIB` : null}
                                                                </small>
                                                            </Col>
                                                            <Col
                                                            column={2}
                                                            ignoreScreenSize
                                                            style={{
                                                                justifyContent : 'center',
                                                                display : 'flex'
                                                            }}
                                                            >
                                                                <p>
                                                                    <BsArrowRight
                                                                    size={22}
                                                                    />
                                                                </p>
                                                            </Col>
                                                            <Col
                                                            column={2}
                                                            ignoreScreenSize
                                                            alignEnd
                                                            >
                                                                <p>
                                                                    <small>
                                                                        Tujuan
                                                                    </small>
                                                                </p>
                                                                <b
                                                                style={{
                                                                    textAlign : 'end'
                                                                }}
                                                                >
                                                                    <small>
                                                                        {item.destinationName}
                                                                    </small>
                                                                </b>
                                                                <small
                                                                style={{
                                                                    fontSize : '.75rem',
                                                                    textAlign : 'right'
                                                                }}
                                                                >
                                                                    {item.arrivalTime ? item.tripDuration !== '00:00:00' ? `${item.arrivalTime.substr(0,5)} ${item.arrivalTimeZone} (${dateFilter.getDurationFromTimeFormat(item.tripDuration)})` : '-' : null}
                                                                </small>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    {
                                                        item.trajectTypeCategory != 'COMMUTER' && (
                                                            <Col
                                                            column={2}
                                                            mobileFullWidth
                                                            style={{
                                                                textAlign : 'center'
                                                            }}
                                                            >
                                                                <p>
                                                                    <small>
                                                                        Kursi Tersedia
                                                                    </small>
                                                                </p>
                                                                <p>
                                                                    <b>
                                                                        {item.seatAvailable}
                                                                    </b>
                                                                </p>
                                                            </Col>
                                                        )
                                                    }
                                                </Row>
                                            </Col>
                                            <Col
                                            column={1}
                                            alignEnd
                                            mobileFullWidth
                                            >
                                                <h3>
                                                    {currency(item.fare, 'Rp ')}
                                                </h3>
                                                {
                                                    (item.seatAvailable > 0 || item.trajectTypeCategory === 'COMMUTER') && (
                                                        <Button
                                                        title={'Beli Tiket'}
                                                        styles={Button.secondary}
                                                        onClick={() => {
                                                            setSessionStorage(TicketOrderCreate.SCHEDULE_SELECTED_SESSION, item)
                                                            router.push('/admin/ticket-order/create')
                                                        }}
                                                        fluidWidth
                                                        />
                                                    )
                                                }
                                            </Col>
                                            {/* <pre>
                                                {JSON.stringify(item, null, 2)}
                                            </pre> */}
                                        </Row>
                                    )
                                })
                            }
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>

    )

}