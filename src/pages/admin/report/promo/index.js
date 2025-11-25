import { useEffect, useState, forwardRef } from 'react'

import { postJSON } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import Table from '../../../../components/Table'
import DatePicker from 'react-datepicker'
import Input from '../../../../components/Input'
import { AiFillEye, AiFillDelete, AiFillCaretRight, AiOutlineClose } from 'react-icons/ai'
import "react-datepicker/dist/react-datepicker.css";

import { dateFilter, currency } from '../../../../utils/filters'

export default function Promo(props) {

    const __COLUMNS = [
        {
            title : 'Kode Booking',
            field: 'codeBooking'
        },
        {
            title : 'Judul Promo',
            field : 'promotionTitle',
            textAlign: "left"
        },
        {
            title : 'Trayek',
            field : 'codeTraject',
        },
        {
            title : 'Penumpang',
            field : 'totalPassenger'
        },
        {
            title : 'Kode Voucher',
            field : 'voucherCode'
        },
        {
            title : 'Harga Tiket (Rp)',
            field : 'ticketPrice',
            textAlign: "right",
            customCell : (value) => currency(value)
        },
        {
            title : 'Diskon (Rp)',
            field : 'discount',
            textAlign: "right",
            customCell : (value) => currency(value)
        },
        {
            title : 'Bayar (Rp)',
            field : 'totalPayment',
            textAlign: "right",
            customCell : (value) => currency(value)
        },
        {
            title : 'Tanggal Pembelian',
            field : 'dateTransaction',
            customCell : (value) => {
                const date = new Date(value)
                return dateFilter.getMonthDate(date)
            }
        },
        {
            title : 'Tanggal Berangkat',
            field : 'depatureDate',
            customCell : (value) => {
                const date = new Date(value)
                return dateFilter.getMonthDate(date)
            }
        },
        {
            title : 'Pembayaran',
            field : 'methodPayment',
            textAlign: "left",
        },
    ]

    const [_startDate, _setStartDate] = useState(new Date())
    const [_endDate, _setEndDate] = useState(new Date())
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_promo, _setPromo] = useState([])
    const [_codeVoucher, _setCodeVoucher] = useState("")
    const [_titlePromo, _setTitlePromo] = useState({
        "title": "Semua Promo",
        "value": ""
    })
    const [_titlePromoRange, _setTitlePromoRange] = useState([])
    const [_providerPromoRange, _setProviderPromoRange] = useState([])
    const [_titleProvider, _setTitleProvider] = useState({
        "title": "Semua Penerbit",
        "value": ""
    })
    const [_summary, _setSummary] = useState({
        "ticket": 0,
        "discount": 0,
        "nettPay": 0
    })

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
    })

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[1],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })

    const EndDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            title={"Tanggal Akhir"}
            onClick={onClick}
            ref={ref}
            value={_endDate == "" ? "" : dateFilter.getMonthDate(_endDate)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    const StartDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            title={"Tanggal Awal"}
            onClick={onClick}
            ref={ref}
            value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));


    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getPromo(pagination)
    }

    async function _getPromo(pagination = _page) {
        _setIsProcessing(true)

        try {
            let param = {
                companyId: props.authData.companyId,
                startDate: dateFilter.basicDate(new Date(_startDate)).normal,
                endDate: dateFilter.basicDate(new Date(_endDate)).normal,
               ...pagination
            }

            if(_codeVoucher) param.codeVoucher = _codeVoucher
            if(_titlePromo.value) param.promotionTitle = _titlePromo.title
            if(_titleProvider.value) param.provider = _titleProvider.value

            const res = await postJSON('/marketingSupport/promosi/report/list', param, props.authData.token)
            let summary = {
                "ticket": 0,
                "discount": 0,
                "nettPay": 0
            }
            
            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada laporan', type : 'info' })
            }else{
                res.data.forEach(function(val, key){
                    summary.ticket += val.ticketPrice
                    summary.discount += val.discount
                    summary.nettPay += val.totalPayment
                })
            }


            _setSummary(summary)
            _setPaginationConfig({
                recordLength : res.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(res.totalFiltered / pagination.length)  
            })

            _setPromo(res.data)

            _setIsProcessing(false)

        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    useEffect(() => {
        _getPromoList()
    }, [])

    async function _getPromoList() {

        let params = {
            startFrom : 0,
            length: 780,
            orderBy: "id",
            sortMode: 'desc',
        }

        try {
            const res = await postJSON(`/marketingSupport/promosi/list`, params, props.authData.token)
            
            let clean = res.data.filter((arr, index, self) => 
            index === self.findIndex((t) => (t.title === arr.title && t.title !== null)))
            
            let provider = res.providerList.map((val, key) => {
                return {
                    "value": val,
                    "title": val
                }
            })

            _setProviderPromoRange([
                _titleProvider,
                ...provider
            ])

            _setTitlePromoRange([
                _titlePromo,
                ...clean
            ])
           
        } catch (e) {
            popAlert({ message : e.message })
        }
    }



    return (
        <Main>
            
            <AdminLayout>
                <Card>

                    <span>Tanggal Pembelian</span>

                    <Row
                    verticalEnd
                    >
                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <DatePicker
                            style={{
                                width: "100%"
                            }}
                            selected={_startDate}
                            onChange={(date) => {
                                _setStartDate(date)                
                            }}
                            customInput={<StartDatePicker/>}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <DatePicker
                            style={{
                                width: "100%"
                            }}
                            selected={_endDate}
                            onChange={(date) => {
                                _setEndDate(date)                
                            }}
                            customInput={<EndDatePicker/>}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                        
                            <Input
                            title={'Judul Promo'}
                            placeholder={'Semua Promo'}
                            value={_titlePromo.title}
                            suggestions={_titlePromoRange}
                            suggestionField={'title'}
                            onSuggestionSelect={title => {
                                _setTitlePromo(title)
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                        
                            <Input
                            title={'Penerbit'}
                            placeholder={'Semua Penerbit'}
                            value={_titleProvider.title}
                            suggestions={_providerPromoRange}
                            suggestionField={'title'}
                            onSuggestionSelect={title => {
                                _setTitleProvider(title)
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={`Kode Voucher`}
                            value={_codeVoucher}
                            onChange={code => {
                                _setCodeVoucher(code)
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            title={'Terapkan'}
                            onProcess={_isProcessing}
                            onClick={_getPromo}
                            />
                        </Col>
                    </Row>
                </Card>
       
                <Card
                noPadding
                >
                    {
                        _promo.length > 0 && (
                            <Table
                            headerContent={(
                                <Row
                                >
                                    <Col
                                    withPadding
                                    column={1}
                                    style={{
                                        display: "grid"
                                    }}
                                    >
                                        <strong
                                        style={{
                                            marginBottom: ".5rem"
                                        }}
                                        >
                                            Total Harga Tiket
                                        </strong>
                                        <span>{currency(_summary.ticket, "Rp")}</span>
                                    </Col>
                                    
                                    <Col
                                    column={1}
                                    withPadding
                                    style={{
                                        display: "grid"
                                    }}
                                    >
                                        <strong
                                        style={{
                                            marginBottom: ".5rem"
                                        }}
                                        >
                                            Total Diskon
                                        </strong>
                                        <span>{currency(_summary.discount, "Rp")}</span>
                                    </Col>

                                    <Col
                                    withPadding
                                    column={1}
                                    style={{
                                        display: "grid"
                                    }}
                                    >
                                        <strong
                                        style={{
                                            marginBottom: ".5rem"
                                        }}
                                        >
                                            Total Bayar
                                        </strong>
                                        <span>{currency(_summary.nettPay, "Rp")}</span>
                                    </Col>

                                </Row>
                            )}
                            headExport={[
                                {
                                    title: "Kode Booking",
                                    value: 'codeBooking',
                                },
                                {
                                    title: "Judul Promo",
                                    value: 'promotionTitle',
                                },
                                {
                                    title: "Kode Trayek",
                                    value: 'codeTraject',
                                },
                                {
                                    title: "Trayek",
                                    value: 'segmen',
                                },
                                {
                                    title: "Kode Voucher",
                                    value: 'voucherCode',
                                },
                                {
                                    title: "Total Penumpang",
                                    value: 'totalPassenger',
                                },
                                {
                                    title: "Harga Tiket",
                                    value: 'ticketPrice',
                                },
                                {
                                    title: "Diskon",
                                    value: 'discount',
                                },
                                {
                                    title: "Total Bayar",
                                    value: 'totalPayment',
                                },
                                {
                                    title: "Tanggal Pembelian",
                                    value: 'dateTransaction',
                                },
                                {
                                    title: "Tanggal Berangkat",
                                    value: 'depatureDate',
                                },
                                {
                                    title: "Pembayaran",
                                    value: 'methodPayment',
                                },
                                {
                                    title: "Penyedia Pembayaran",
                                    value: 'paymentProvider',
                                },
                                {
                                    title: "Platform",
                                    value: 'counter',
                                },
                            ]}
                            columns={__COLUMNS}
                            records={_promo}
                            config={_paginationConfig}
                            defaultLength={50}
                            onRecordsPerPageChange={perPage => _setPagination({..._page, length : perPage, startFrom : 0 })}
                            onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                            noPadding
                            isLoading={_isProcessing}
                            />
                        )
                    }
                   
                </Card>
                    
            </AdminLayout>
        </Main>
    )

}