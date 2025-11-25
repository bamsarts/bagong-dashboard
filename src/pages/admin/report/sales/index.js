import { useEffect, useState } from 'react'

import { get, postJSON } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import { Col, Row } from '../../../../components/Layout'
import Table from '../../../../components/Table'
import ReportSalesModal from '../../../../components/ReportSalesModal'
import { currency, dateFilter, role } from '../../../../utils/filters'
import { utils } from 'xlsx'
import { getSessionStorage, setSessionStorage } from '../../../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'

export default function Sales(props) {

    
    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal,
        end : dateFilter.basicDate(new Date()).normal,
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isProcessingDetail, _setIsProcessingDetail] = useState(false)
    const [_counterRange, _setCounterRange] = useState([])
    const [_counter, _setCounter] = useState({
        "title": "",
        "value": ""
    })
    const [_openModalDetail, _setOpenModalDetail] = useState(false)
    const [_salesReportDetail, _setSalesReportDetail] = useState([])
    const [_summary, _setSummary] = useState({
        pnp: 0,
        cash : 0,
        emoney : 0,
        qris : 0,
        debit : 0,
        kredit: 0,
        totalNominal: 0,
        mdr: 0,
        edcBtn: 0,
        edcMandiri: 0,
        edcBca: 0,
        edcBri: 0,
        edcBtn: 0,
        qrisTap: 0,
    })
    const [_rowInfo, _setRowInfo] = useState({})
    const [_isLoaded, _setIsLoaded] = useState(false)
    const [_accessMenu, _setAccessMenu] = useState([])
    
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

            _getCounter()
            _getSalesReport()
        }
    }, [])

    const __INSERT_COLUMNS = [
        [
            { value : 'Total', colSpan : 2},
            { value : _summary.pnp },
            { value : currency(_summary.cash), textAlign: 'right' },
            { value : currency(_summary.debit), textAlign: 'right' },
            { value : currency(_summary.kredit), textAlign: 'right' },
            { value : currency(_summary.emoney), textAlign: 'right' },
            { value : currency(_summary.qris), textAlign: 'right' },
            { value : currency(_summary.edcBri), textAlign: 'right' },
            { value : currency(_summary.edcMandiri), textAlign: 'right' },
            { value : currency(_summary.edcBni), textAlign: 'right' },
            { value : currency(_summary.edcBca), textAlign: 'right' },
            { value : currency(_summary.edcBtn), textAlign: 'right' },
            { value : currency(_summary.qrisTap), textAlign: 'right' },
            { value : currency(_summary.totalNominal), textAlign: 'right' },
            { value : currency(_summary.mdr), textAlign: 'right', hide: !_getRole() },
            { value : "", colSpan: 2 },
        ],
    ]

    let __COLUMNS = [
        {
            title: 'Counter',
            field : 'counterName',
            textAlign: 'left'
        },
        {   
            title: 'Tanggal',
            field : 'dateTransaction',
            customCell : (value) => dateFilter.getMonthDate(new Date(value))
        },
        {
            title: 'Pnp',
            minWidth: '110px',
            field : 'totalPnp',
        },
        {
            title: 'Tunai (Rp)',
            field : 'cash',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title: 'Debit (Rp)',
            field : 'debit',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title: 'Kredit (Rp)',
            field : 'kredit',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title: 'Emoney (Rp)',
            field : 'emoney',
            textAlign: 'right',
            minWidth: '150px',
            customCell : (value) => currency(value)
        },
        {
            title: 'QRIS (Rp)',
            field : 'qris',
            textAlign: 'right',
            minWidth: '150px',
            customCell : (value) => currency(value)
        },
        {
            title: 'EDC BRI',
            field : 'edcBankBri',
            textAlign: 'right',
            minWidth: "70px",
            customCell : (value) => currency(value)
        },
        {
            title: 'EDC Mandiri',
            field : 'edcBankMandiri',
            textAlign: 'right',
            minWidth: '150px',
            customCell : (value) => currency(value)
        },       
        {
            title: 'EDC BNI',
            field : 'edcBankBni',
            textAlign: 'right',
            minWidth: '130px',
            customCell : (value) => currency(value)
        },        
        {
            title: 'EDC BCA',
            field : 'edcBankBca',
            textAlign: 'right',
            minWidth: '130px',
            customCell : (value) => currency(value)
        },       
        {
            title: 'EDC BTN',
            field : 'edcBankBtn',
            textAlign: 'right',
            minWidth: "70px",
            customCell : (value) => currency(value)
        },       
        {
            title: 'QRIS Tap',
            field : 'qrisTap',
            textAlign: 'right',
            minWidth: "70px",
            customCell : (value) => currency(value)
        },       
        {
            title: 'Total Nominal (Rp)',
            field : 'totalAmount',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title: 'Fee (Rp)',
            field : 'mdrValue',
            textAlign: 'right',
            customCell : (value) => currency(value),
            hide: !_getRole()
        },
        {
            title: 'Status',
            field : 'status',
            customCell : (value) => {
                return value ? 'Selesai' : 'Belum Selesai'
            }
        },
        {
            field : 'counterId',
            customCell : (value, record) => {
                return (
                    <Button
                    title={'Rincian'}
                    styles={Button.warning}
                    onProcess={_isProcessingDetail}
                    onClick={(value) => {
                        _getSalesReportDetail(record)
                        _setRowInfo(record)
                    }}
                    small
                    />
                )
            }
        }
    ]
    

    useEffect(() => {
       
    },[])

    function summary(row){
        let cash, emoney, qris, debit, kredit, totalNominal, pnp, mdr, edcBtn, edcMandiri, edcBni, edcBri, edcBca, qrisTap

        cash = emoney = qris = debit = kredit = totalNominal = pnp = mdr = edcBtn = edcMandiri = edcBca = edcBni = edcBri = qrisTap = 0
              
        if (row.length > 0) {
            row.forEach(item => {
                let mdrValue = item.mdrValue == null ? 0 : item.mdrValue

                pnp += item.totalPnp
                cash += item.cash
                emoney += item.emoney
                qris += item.qris
                debit += item.debit
                kredit += item.kredit
                totalNominal += item.totalAmount
                mdr += mdrValue
                edcBca += item.edcBankBca
                edcBri += item.edcBankBri
                edcBtn += item.edcBankBtn
                edcMandiri += item.edcBankMandiri
                edcBni += item.edcBankBni
                qrisTap += item.qrisTap
            })

            _setSummary({
                pnp, cash, emoney, qris, debit, kredit, totalNominal, mdr, edcBca, edcBri, edcBtn, edcMandiri, edcBni, qrisTap
            })
        }
    }

    async function _getSalesReportDetail(row) {
        _setIsProcessingDetail(true)

        let params = {
            counterId : row.counterId,
            date : row.dateTransaction,
            length: 1460,
            startFrom: 0,
        }

        try {
            const res = await postJSON(`/laporan/pendapatan/commuter/detail`, params, props.authData.token)
            _setSalesReportDetail(res)
            _setIsProcessingDetail(false)
            _setOpenModalDetail(true)
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessingDetail(false)
        }
    }

    async function _getSalesReport() {

        let params = {
            companyId : props.authData.companyId,
            startFrom : 0,
            length: 1370,
            orderBy: "created_at",
            sortMode: 'desc',
            startDate: _date.start,
            endDate: _date.end
        }

        if(!_compareDate(params.startDate, params.endDate)){
            popAlert({ message : 'Rentang tanggal maksimal 7 hari', type : 'info' })
            return false
        }

        if(props.branch?.branchId) params.branchId = props.branch?.branchId
        if(_counter.value != "") params.counterId = _counter.value

        _setIsProcessing(true)

        try {
            const res = await postJSON(`/laporan/pendapatan/commuter/list`, params, props.authData.token)
            _setSalesReport(res.data)
            _setIsProcessing(false)
            summary(res.data)
            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada pendapatan', type : 'info' })
            }
        } catch (e) {
            if(e.message?.name){
                popAlert({ message : e.message.name })
            }else{
                popAlert({ message : e.message })
            }
            _setIsProcessing(false)
        }
    }

    function _getRole(token){
        let isAllowedMdr = false
        
        if(_accessMenu.length > 0){
            _accessMenu.forEach(function(val, key){
                if(val.menu == "Laporan>PendapatanFee"){
                    isAllowedMdr = val.viewRole
                }
            })
        }
        
        return isAllowedMdr
    }

    async function _getCounter(){
        
        let params = {
            startFrom : 0,
            length: 410,
        }

        try {
            const res = await postJSON(`/masterData/counter/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Counter",
                        value: ""
                    })
                }

                if(props.branch?.branchId){
                    if(val.branchId == props.branch?.branchId){
                        data.push({
                            title: val.name,
                            value: val.id
                        })
                    }
                }else{
                    data.push({
                        title: val.name,
                        value: val.id
                    })
                }
               
            })

            if(res) {
                _setCounterRange(data)
                _setCounter(data[0])
            }

        } catch (e) {
            console.log(e)
        }
    }

    function _compareDate(d1, d2){
        let date1 = new Date(d1)
        date1.setDate(date1.getDate()+7);
        date1 = date1.getTime()
        let date2 = new Date(d2).getTime();
    
        if(date1 >= date2){
            return true
        }else{
            return false
        }
    }


    return (
        <Main>
            <ReportSalesModal
            visible={_openModalDetail}
            closeModal={() => {
                _setOpenModalDetail(false)
            }}
            report={_salesReportDetail}
            rowInfo={_rowInfo}
            >
            </ReportSalesModal>
            
            <AdminLayout>
                <Card>
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={3}
                        >

                            <small
                            style={{
                                "font-size": '10px'
                            }}
                            >*Maksimal 1 Minggu</small>


                            <Row>
                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Tanggal Awal'}
                                    type={'date'}
                                    value={_date.start}
                                    onChange={date => _setDate(oldData => {
                                        return {
                                            ...oldData,
                                            start : dateFilter.basicDate(new Date(date)).normal
                                        }
                                    })}
                                    />
                                </Col>
                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Tanggal Akhir'}
                                    type={'date'}
                                    value={_date.end}
                                    min={_date.start}
                                    onChange={date => _setDate(oldData => {
                                        return {
                                            ...oldData,
                                            end : dateFilter.basicDate(new Date(date)).normal
                                        }
                                    })}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col
                        column={2}
                        withPadding
                        mobileFullWidth
                        >
                            <Row
                            verticalEnd
                            >
                                <Col
                                column={6}
                                >
                                    <Input
                                    title={'Counter'}
                                    placeholder={'Semua Counter'}
                                    value={_counter.title}
                                    suggestions={_counterRange}
                                    onSuggestionSelect={counter => {
                                        _setCounter(counter)
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
                            title={'Terapkan'}
                            onProcess={_isProcessing}
                            onClick={_getSalesReport}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    _salesReport && (
                        <Card
                        noPadding
                        >
                    
                            <Table
                                fileName={"Laporan-pendapatan-"+_counter.title+"-"+dateFilter.basicDate(new Date(_date.start)).normal+"-s.d-"+dateFilter.basicDate(new Date(_date.end)).normal}
                                headExport={[
                                {
                                    title: 'Counter',
                                    value: 'counterName'
                                },
                                {
                                    title: 'Tanggal',
                                    value: 'dateTransaction',
                                },
                                {
                                    title: 'Penumpang',
                                    value: 'totalPnp'
                                },
                                {
                                    title: 'Tunai',
                                    value: 'cash',
                                },
                                {
                                    title: 'Debit',
                                    value: 'debit'
                                },
                                {
                                    title: 'Kredit',
                                    value: 'kredit',
                                },
                                {
                                    title: 'Emoney',
                                    value: 'emoney',
                                },
                                {
                                    title: 'QRIS',
                                    value: 'qris'
                                },
                                {
                                    title: 'EDC Bank BRI',
                                    value: 'edcBankBri'
                                },
                                {
                                    title: 'EDC Bank Mandiri',
                                    value: 'edcBankMandiri'
                                },
                                {
                                    title: 'EDC Bank BNI',
                                    value: 'edcBankBni'
                                },
                                {
                                    title: 'EDC Bank BCA',
                                    value: 'edcBankBca'
                                },
                                {
                                    title: 'EDC Bank BTN',
                                    value: 'edcBankBtn'
                                },
                                {
                                    title: 'QRIS Tap',
                                    value: 'qrisTap'
                                },
                                {
                                    title: 'Total Nominal',
                                    value: 'totalAmount'
                                },
                                {
                                    title: 'Fee',
                                    value: 'mdrValue',
                                    hide: !_getRole()
                                },
                                {
                                    title: 'Status',
                                    value: 'status',
                                    enum: ["Selesai","Belum Selesai"]
                                }
                            ]}
                            columns={__COLUMNS}
                            records={_salesReport}
                            insertColumns={__INSERT_COLUMNS}
                            noPadding
                            extraLarge
                            isLoading={_isProcessing}
                            />
                                
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}