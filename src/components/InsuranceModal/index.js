import { useEffect, useState, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import Input from '../Input'
import { Row, Col } from '../Layout'
import { popAlert } from '../Main'
import TicketListModal from '../TicketListModal'
import { AiOutlineCloudDownload }  from 'react-icons/ai'
import { currency, dateFilter } from '../../utils/filters'
import ActivityIndicator from '../ActivityIndicator'

const defaultProps = {
    data : {},
}

InsuranceModal.defaultProps = defaultProps

export default function InsuranceModal(props = defaultProps) {

    const appContext = useContext(AppContext)

    const __COLUMNS = [
        {
            title: "Kode Booking",
            field : 'bookingCode',
            textAlign: 'left',
            style : {
                minWidth : '150px'
            }
        },
        {
            title: "Tiket",
            field : 'ticket',
            textAlign: 'left',
            style : {
                minWidth : '150px'
            }
        },
        {
            title: "Trayek",
            field : 'trajectCode',
            textAlign: 'left',
            style : {
                minWidth : '80px'
            }
        },
        {
            title: 'Moda',
            field : 'moda',
            style : {
                minWidth : '90px'
            },
            customCell: (value) => {
                return value == "Commuter" ? 'Pemadumoda' : value 
            }
        },
        {
            title: "Tarif",
            field : 'amount',
            textAlign: 'right',
            style : {
                minWidth : '70px'
            },
            customCell: (value) => {
                return currency(value)
            }
        },
        {
            title: 'Nama',
            field : 'name',
            textAlign: 'left',
            style : {
                minWidth : '60px'
            }
        },
        {
            title: 'Usia',
            field : 'age',
            style : {
                minWidth : '70px'
            },
            customCell: (value) => {
                if(value == "ADULT"){
                    return 'Dewasa';
                }else if(value == "CHILD"){
                    return 'Anak';
                }else{
                    return value;
                }
            }
        },
        {
            title: 'NIK',
            field : 'identity',
            style : {
                minWidth : '10px'
            },
        },
        {
            title: "No Order",
            textAlign: 'left',
            field : 'insuranceOrderId',
        },
        {
            title: "No Polis",
            textAlign: 'left',
            field : 'insurancePolicyId'
        },
        {
            title: 'Nilai Asuransi (Rp)',
            field : 'insurancePrice',
            textAlign: 'right',
            customCell : (value) => currency(value),
        },
        {
            title: "Pembayaran",
            textAlign: 'left',
            field : 'pembayaran'
        },
        {
            title: 'Polis',
            field : 'insurancePolicyDoc',
            customCell : (value, row, index) => {

                if(value != null){
                    return (
                        <Button
                        tooltip={"Download"}
                        small
                        title={<AiOutlineCloudDownload/>}
                        styles={Button.warning}
                        onClick={() => {
                            window.open(value, '_blank')
                        }}
                        />
                    )
                }else{
                    return ''
                }
            }
        }
    ]

    const [_insurance, _setInsurance] = useState([])
    const [_polisNotPublished, _setPolisNotPublished] = useState(0)
    const [_isLoadData, _setIsLoadData] = useState(true)
    const [_data, _setData] = useState(props.data)
    const [_search, _setSearch] = useState("")
    const [_defaultInsurance, _setDefaultInsurance] = useState([])

    useEffect(() => {
        if(_search != ""){
            if(_defaultInsurance.length == 0){
                _setDefaultInsurance(_insurance)
            }

            let suggestions = [..._insurance].filter(suggestion => 
                suggestion.ticket != null ? suggestion.ticket.toLowerCase().includes(_search.toLowerCase()) : ""
            )

            if(suggestions.length > 0){
                _setInsurance(suggestions)
            }else{
                let suggestionsBooking =  [..._insurance].filter(suggestion => suggestion.bookingCode.toLowerCase().includes(_search.toLowerCase()))
                _setInsurance(suggestionsBooking)
            }

        }else{
            _setInsurance(_defaultInsurance)
        }
    }, [_search])

    useEffect(() => {
        if(props.data?.date){
            _getDetailInsurance()
        }else{
            _setIsLoadData(true)
            _setInsurance([])
            _setPolisNotPublished(0)
        }
    }, [props.data])

    async function _getDetailInsurance() {
        
        const params = {
            date : props.data?.date,
            companyId : appContext.authData.companyId,
            startFrom : 0,
            length: 7340
        }

        try {
            const result = await postJSON('/laporan/asuransi/detail', params, appContext.authData.token)
            _setInsurance(result.data)

            let polis = 0
            result.data.forEach(function(val, key){
                if(val.insurancePolicyDoc == null){
                    polis += 1
                }
            })

            _setPolisNotPublished(polis)
            _setIsLoadData(false)

        } catch (e) {
            
        } finally {
            
        }
    }
    
    return (
        <Modal
        visible={props.data?.date}
        onBackdropClick={props.closeModal}
        extraLarge
        centeredContent
        >
            <ModalContent
            header={{
                closeModal : props.closeModal
            }}
            >

                <Row>
                    <Col
                    column={1}
                    mobileFullWidth
                    style={{
                        paddingBottom: "1rem"
                    }}
                    >
                        <h5>Tanggal</h5>
                        <span>{dateFilter.getMonthDate(new Date(props.data.date))}</span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    style={{
                        paddingBottom: "1rem"
                    }}
                    >
                        <h5>Pnp Pemadumoda</h5>
                        <span>{props.data.totalPnpCommuter}</span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    style={{
                        paddingBottom: "1rem"
                    }}
                    >
                        <h5>Asuransi Pemadumoda</h5>
                        <span>{currency(props.data.totalPriceCommuter)}</span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    style={{
                        paddingBottom: "1rem"
                    }}
                    >
                        <h5>Pnp AKAP</h5>
                        <span>{props.data.totalPnpIntercity}</span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    style={{
                        paddingBottom: "1rem"
                    }}
                    >
                        <h5>Asuransi AKAP</h5>
                        <span>{currency(props.data.totalPriceIntercity)}</span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    style={{
                        paddingBottom: "1rem"
                    }}
                    >
                        <h5>Polis belum Terbit</h5>
                        <span>{_polisNotPublished}</span>
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

                
                        <div>
                            <Table
                            headerContent={(
                                <Row
                                verticalEnd
                                >
                                    <Col
                                    column={2}
                                    withPadding
                                    >
                                        <Input
                                        title={`Cari Tiket / Kode Booking`}
                                        value={_search}
                                        onChange={ticket => {
                                            _setSearch(ticket)
                                        }}
                                        />
                                    </Col>
                                        
                                </Row>
                            )}
                            fileName={"Transaksi-Asuransi-"+dateFilter.basicDate(new Date(props.data?.date)).id+"-Detail"}
                            headExport={[
                                {
                                    title: 'Tanggal',
                                    value: 'date'
                                },
                                {
                                    title: 'Kode Booking',
                                    value: 'bookingCode'
                                },
                                {
                                    title: "Tiket",
                                    value: "ticket",
                                    customCell: function(value, data){
                                        return "'"+value
                                    }
                                },
                                {
                                    title: "Trayek",
                                    value: "trajectCode"
                                },
                                {
                                    title: "Tarif",
                                    value: "amount"
                                },
                                {
                                    title: "Moda",
                                    value: "moda"
                                },
                                {
                                    title: "Nama",
                                    value: "name"
                                },
                                {
                                    title: "Jenis Kelamin",
                                    value: "gender"
                                },
                                {
                                    title: "Usia",
                                    value: "age"
                                },
                                {
                                    title: "No Order",
                                    value: "insuranceOrderId"
                                },
                                {
                                    title: "No Polis",
                                    value: "insurancePolicyId"
                                },
                                {
                                    title: "Nilai Asuransi",
                                    value: "insurancePrice"
                                },
                                {
                                    title: "Pembayaran",
                                    value: "pembayaran"
                                },
                            ]}
                            columns={__COLUMNS}
                            records={_insurance}
                            extraLarge
                            />
                        </div>
                    
                
            </ModalContent>
        </Modal>
    )

}