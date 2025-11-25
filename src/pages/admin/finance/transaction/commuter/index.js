import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { currency, dateFilter } from '../../../../../utils/filters'
import BoardingModal from '../../../../../components/BoardingModal'
import Datepicker from '../../../../../components/Datepicker'
import { getSessionStorage, setSessionStorage } from '../../../../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'
import Tabs from '../../../../../components/Tabs'
import ActivityIndicator from '../../../../../components/ActivityIndicator'

export default function TransactionCommuter(props) {

    const [_activeIndex, _setActiveIndex] = useState("NONOTA")

    const __COLUMNS = [
        {
            title : 'Ticket',
            field : 'ticket'
        },
        {
            title : 'Bus',
            field : 'busName'
        },
        {
            title : 'Trayek',
            field : 'trajectName'
        },
        {
            title : 'Ritase Ke',
            field : 'trip'
        },
        {
            title : _activeIndex == "OTA" ? 'Channel' : 'Tipe Pembayaran',
            field : 'payment'
        },
        {
            title : 'Harga Tiket',
            field : 'baseFare',
            customCell: (value, row) => {
                return currency(row.totalAmount/row.totalPnp)
            }
        },
        {
            title : 'Tanggal',
            field : 'boarding_at',
            customCell: (value) => {
                return value == null ? '' : dateFilter.convertISO(value)
            }
        },
        {
            title : 'Jumlah Scan',
            field : 'scanCount'
        },
        {
            title : 'Jumlah Cetak',
            field : 'printCount'
        },
    ]

    const [_transactionLists, _setTransactionLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_crewRanges, _setCrewRanges] = useState([])
    const [_busRanges, _setBusRanges] = useState([])
    const [_boardingRange, _setBoardingRange] = useState({
        title: "Belum Verifikasi",
        value: "notBoarding"
    })
    const _BOARDING_RANGES=[
        {  
            title: "Semua",
            value: "all"
        },
        {  
            title: "Sudah Verifikasi",
            value: "boarding"
        },
        {  
            title: "Belum Verifikasi",
            value: "notBoarding"
        }
    ]

    const [_dateRange, _setDateRange] = useState({
        startDate : dateFilter.basicDate(new Date()).normal,
        endDate : dateFilter.basicDate(new Date()).normal
    })
    const [_accessMenu, _setAccessMenu] = useState([])
    const [_isLoaded, _setIsLoaded] = useState(false)
    const [_paymentRanges, _setPaymentRanges] = useState([
        {
            title: "Semua Pembayaran",
            value: ""
        },
        {
            title: "Debit",
            value: "debit"
        },
        {
            title: "Emoney",
            value: "emoney"
        },
        {
            title: "QRIS",
            value: "QRIS"
        },
        {
            title: "Kredit",
            value: "kredit"
        },
        {
            title: "Tunai",
            value: "cash"
        }
    ])
    const [_paymentSelected, _setPaymentSelected] = useState({
        title: "Semua Pembayaran",
        value: ""
    })
    const [_allTransaction, _setAllTransaction] = useState([])
    const [_isChangeTransaction, _setIsChangeTransaction] = useState(false)
    
    useEffect(() => {
        _setIsLoaded(false)
        // _setTransactionLists([])
        _getData()
    }, [_boardingRange, _dateRange, _activeIndex])

    useEffect(() => {
        _getCrew()
        _getBus()
    }, [])  

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }

    async function _getCrew() {
        const params = {
            role_id : 3,
            startFrom : 0,
            length : 890,
        }
        try {
            const crews = await postJSON('/masterData/userRoleAkses/user/list', params, props.authData.token)
            let data = []
            crews.data.forEach(function(val, key){
                data.push({
                    "title": val.name,
                    "value": val.id
                })
            })
           
            _setCrewRanges(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getBus() {
        const params = {
            startFrom : 0,
            length : 1560,
        }
        try {
            const bus = await postJSON('/masterData/bus/list', params, props.authData.token)
            let data = []
            bus.data.forEach(function(val, key){
                data.push({
                    "title": val.code,
                    "value": val.id
                })
            })
            _setBusRanges(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }
    
    async function _getData(pagination = _page, query = _searchQuery) {
        _setPaymentSelected({
            title: "Semua Pembayaran",
            value: ""
        })
        const params = {
            ...pagination,
        }
        let isOta = _activeIndex == "OTA" ? 'ota/' : ''

        if (query) params.query = query
        params.status = _boardingRange.value
        params.orderBy = "id"
        params.sortMode = "desc"
        params.startDate = _dateRange.startDate
        params.endDate = _dateRange.endDate

        try {
            const transactionLists = await postJSON(`/keuangan/transaksi/commuter/boarding/v2/${isOta}list`, params, props.authData.token)
            
            _setAllTransaction(transactionLists.data)
            _setTransactionLists(transactionLists.data)
        
            _setPaginationConfig({
                recordLength : transactionLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(transactionLists.totalFiltered / pagination.length)  
            })
            _setIsLoaded(true)
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    function _isRoleValidation(){
        let allowed = false
       
        _accessMenu.forEach(function(val, key){
            if(val.menu == "Keuangan>Transaksi>PemadumodaValidasi"){
                allowed = val.updateRole
            }
        })
        return allowed
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Perform localStorage action
            
            let storage = getLocalStorage("access_menu_damri")
            
            if( storage == null){
                window.location.href = "/sign-in"
            }else{
                const item = JSON.parse(storage)
                _setAccessMenu(item)
            }
        }
    }, [])

    function _filterPayment(){

        let filteredData = [] 

        if(_paymentSelected.value != ""){
            _allTransaction.forEach(function(val, key){
                if(val.payment == _paymentSelected.value){
                    filteredData.push(val)
                }
            })

            _setTransactionLists(filteredData)
        }else{
            _setTransactionLists(_allTransaction)
        }
    }

    useEffect(() => {
        _filterPayment()
    }, [_paymentSelected])
    
    
    return (
        <Main>
            <BoardingModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
            }}
            crews={_crewRanges}
            bus={_busRanges}
            date={_dateRange}
            />
            <AdminLayout>
                <Card
                >    
                    <Row
                    verticalEnd
                    >
                        
                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Datepicker
                            id={"datePickerStart"}
                            title={"Tanggal Awal"}
                            value={_dateRange.startDate}
                            onChange={value => {
                                _setDateRange( oldData => {
                                    return {
                                        ...oldData,
                                        startDate: dateFilter.basicDate(new Date(value)).normal
                                    }
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Datepicker
                            id={"datePickerEnd"}
                            title={"Tanggal Akhir"}
                            value={_dateRange.endDate}
                            onChange={value => {
                                _setDateRange( oldData => {
                                    return {
                                        ...oldData,
                                        endDate: dateFilter.basicDate(new Date(value)).normal
                                    }
                                })
                            }}
                            />

                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={"Status"}
                            placeholder={'Boarding'}
                            value={_boardingRange.title}
                            suggestions={_BOARDING_RANGES}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                                _setBoardingRange(data)
                                return false
                            }}
                            />

                        </Col>

                        {
                            _isRoleValidation() && (
                                <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                                >
                                    <Button
                                    title={'Validasi Tiket'}
                                    styles={Button.primary}
                                    onClick={() => {
                                        _setIsOpenModal(true)
                                    }}
                                    />
                                </Col>        
                            )
                        }
                       
                    </Row>
                </Card>

                <Card
                noPadding
                >
    
                    <Table
                    headExport={[
                        {
                            title: 'Ticket',
                            value: "ticket"
                        },
                        {
                            title: 'Tanggal',
                            value: "dateTransaction"
                        },
                        {
                            title: 'Kode Bus',
                            value: "busName"
                        },
                        {
                            title: 'Trayek',
                            value: "trajectName"
                        },
                        {
                            title: 'Ritase Ke',
                            value: "trip"
                        },
                        {
                            title: 'Tipe Pemabayaran',
                            value: "payment"
                        },
                        {
                            title: 'Harga Tiket',
                            value: "baseFare"
                        },
                        {
                            title: 'Jumlah Cetak',
                            value: "printCount"
                        },
                        {
                            title: 'Jumlah Scan',
                            value: "scanCount"
                        }
                    ]}
                    headerContent={(
                        <Row>
                            <Col
                            mobileFullWidth
                            column={2}
                            withPadding
                            >
                                
                                <Tabs
                                disabled={!_isLoaded}
                                activeIndex={_activeIndex}
                                tabs={[
                                    {
                                        title : 'Non OTA',
                                        value : 'NONOTA',
                                        onClick : () => {
                                            if(_isLoaded){
                                                _setActiveIndex('NONOTA')                                                
                                            }
                                        }
                                    },
                                    {
                                        title : 'OTA',
                                        value : 'OTA',
                                        onClick : () => {
                                            if(_isLoaded){
                                                _setActiveIndex('OTA')
                                            }
                                        }
                                    },
                                ]}
                                />
                                 
                            </Col>

                            <Col
                            column={2}
                            withPadding
                            mobileFullWidth
                            >
                                <Input
                                placeholder={'Cari'}
                                value={_searchQuery}
                                onChange={(query) => {
                                    _setSearchQuery(query)
                                    if(query.length > 1){
                                        throttle(() => _getData(_page, query), 100)()
                                    }else{
                                        _getData(_page, query)  
                                    }
                                }}
                                />
                            </Col>

                            <Col
                            column={2}
                            withPadding
                            mobileFullWidth
                            >
                                <Input
                                placeholder={'Semua Pembayaran'}
                                value={_paymentSelected.title}
                                suggestions={_paymentRanges}
                                onSuggestionSelect={payment => {
                                    _setPaymentSelected(payment)
                                }}
                                />
                            </Col>
                        </Row>
                    )}
                    columns={__COLUMNS}
                    records={_transactionLists}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    />

                    {
                        !_isLoaded && (
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
                </Card>
            </AdminLayout>
        </Main>
    )

}