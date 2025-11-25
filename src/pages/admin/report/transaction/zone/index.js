import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import ReportAirportModal from '../../../../../components/ReportAirportModal'
import { currency, dateFilter, role } from '../../../../../utils/filters'
import styles from '../airport/Airport.module.scss'
import { BsChevronRight } from 'react-icons/bs'
import throttle from '../../../../../utils/throttle'
import Datepicker from '../../../../../components/Datepicker'
import Tabs from '../../../../../components/Tabs'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'
import ReportZoneModal from '../../../../../components/ReportZoneModal'
import { writeXLSX, utils, writeFile } from 'xlsx'

export default function Zone(props) {

    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal,
        end : dateFilter.basicDate(new Date()).normal,
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_openModalDetail, _setOpenModalDetail] = useState(false)
    const [_salesReportDetail, _setSalesReportDetail] = useState([])
    const [_summary, _setSummary] = useState({
        totalPnp: 0,
        totalAmount : 0,
        totalCash: 0,
        totalCashless: 0
    })
    const [_rowInfo, _setRowInfo] = useState({})
    const [_filteredData, _setFilteredData] = useState([])
   
    const [_typeRange, _setTypeRange] = useState([
        {
            value: "transaction",
            title: 'Pembelian'
        },
        {
            value: "departure",
            title: 'Keberangkatan'
        }
    ])

    const [_selectedType, _setSelectedType] = useState(_typeRange[0])

    useEffect(() => {

        _getSalesReport()
    

    },[])

    async function _getSalesReportDetail(row) {

        let params = {
            companyId: props.authData.companyId,
            branchId : row.branchId,
            startDate : _date.start,
            endDate : _date.end,
            typeReport : "LIST",
            typeTransaction : _selectedType.value
        }

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/zonasi/detail/list`, params, props.authData.token)
            _setSalesReportDetail(res)
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getSalesReport() {
        _setIsProcessing(true)

        let params = {
            companyId : props.authData.companyId,
            startDate: _date.start,
            endDate: _date.end,
            dateBy: _selectedType.value
        }

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/zonasi/list`, params, props.authData.token)
                
            _setSalesReport(res.data)
            _setIsProcessing(false)
            
            _setSummary({
                totalPnp: res.summary.totalPnp,
                totalAmount : res.summary.totalAmount,
                totalCash: res.summary.totalCash,
                totalCashless: res.summary.totalNonCash
            })

            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada penjualan', type : 'info' })
            }
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    function _compareDate(d1, d2){
        let date1 = new Date(d1)
        date1.setDate(date1.getDate()+32);
        date1 = date1.getTime()
        let date2 = new Date(d2).getTime();
    
        if(date1 >= date2){
            return true
        }else{
            return false
        }
    }

    async function _getAllChannelReport(){

        if(!_compareDate(_date.start, _date.end)){
            popAlert({ message : 'Rentang tanggal maksimal 31 hari', type : 'info' })
            return false
        }

        _setIsProcessing(true)

        let params = {
            companyId : props.authData.companyId,
            startDate: _date.start,
            endDate: _date.end,
            typeTransaction: _selectedType.value,
            typeReport: "CSV"
        }

        let branchs = []

        _salesReport.forEach(function(val, key){
            branchs.push(val.branchId)
        })

        params.branchId = branchs.toString()

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/zonasi/all/list`, params, props.authData.token, true)
            // _setDataExport(res.data)
            _downloadCsv(res, `Transaksi-zonasi-${_selectedType.title}-${_date.start}-s.d-${_date.end}.csv`);
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    function _downloadCsv(data, fileName){
        let template = document.createElement('template')
        let tableExport = "<table>"

        data = data.split("\n")
        data.forEach(function(val, key){
            let row = val.split(",")

            if(row[row.length-7] == "null"){
                row[row.length-7] = "Damri Apps"
            }

            row[row.length-2] = ""
            row[row.length-1] = ""

            tableExport += "<tr>"
                
            row.forEach(function(i, j){
                tableExport += "<td>"+i+"</td>"
            })

            tableExport += "</tr>"

        })

        tableExport += "</table>"
        template.innerHTML = tableExport

        const wb = utils.table_to_book(template.content.firstChild)
        return writeFile(wb, `${fileName.replace(".csv", "")}.xlsx`)
    }
    
    return (
        <Main>
            <ReportZoneModal
            visible={_openModalDetail}
            closeModal={() => {
                _setOpenModalDetail(false)
            }}
            report={_salesReportDetail}
            rowInfo={_rowInfo}
            date={_date}
            typeTransaction={_selectedType}
            >
            </ReportZoneModal>
            
            <AdminLayout>
                <Card>
                    <Row
                    verticalEnd
                    >
       
                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            id={"datePickerStart"}
                            title={"Tanggal Awal"}
                            value={_date.start}
                            onChange={value => {
                                _setDate( oldData => {
                                    return {
                                        ...oldData,
                                        start: dateFilter.basicDate(new Date(value)).normal
                                    }
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            id={"datePickerEnd"}
                            title={"Tanggal Akhir"}
                            value={_date.end}
                            onChange={value => {
                                _setDate( oldData => {
                                    return {
                                        ...oldData,
                                        end: dateFilter.basicDate(new Date(value)).normal
                                    }
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Berdasarkan Tanggal'}
                            value={_selectedType.title}
                            suggestions={_typeRange}
                            suggestionField={'title'}
                            onSuggestionSelect={(data) => {
                               _setSelectedType(data)
                            }}
                            />
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

                <Card>
                    <Row>
                        
                        <Col
                        mobileFullWidth
                        column={1}
                        withPadding
                        >
                            <div
                            className={styles.total_trx}
                            >
                                <span>Total Penumpang</span>
                                <strong>{currency(_summary.totalPnp)}</strong>
                            </div>
                        </Col>

                        <Col
                        mobileFullWidth
                        column={1}
                        withPadding
                        >
                            <div
                            className={styles.total_trx}
                            >
                                <span>Penjualan Tunai</span>
                                <strong>{currency(_summary.totalCash)}</strong>
                            </div>
                        </Col>

                        <Col
                        mobileFullWidth
                        column={1}
                        withPadding
                        >
                            <div
                            className={styles.total_trx}
                            >
                                <span>Penjualan Non Tunai</span>
                                <strong>{currency(_summary.totalCashless)}</strong>
                            </div>
                        </Col>
                        
                        <Col
                        column={2}
                        withPadding
                        >
                            <div
                            className={styles.total_trx}
                            >
                                <span>Total Penjualan</span>
                                <strong>{currency(_summary.totalAmount)}</strong>
                            </div>
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        style={{"display": "grid"}}
                        >   
                            <div style={{"margin": "auto"}}>
                                <Button
                                onProcess={_isProcessing}
                                title={'Export Xlsx'}
                                styles={Button.success}
                                onClick={() => {
                                    _getAllChannelReport()  
                                }}
                                />
                            </div>
                            
                        </Col>
                    </Row>
                </Card>
                
                <div
                className={styles.item_container}
                >   
                    {
                        _salesReport.map((val, key) => {
                            return (
                                <div
                                className={styles.column}
                                >   
                                   
                                    
                                    <div
                                    className={styles.title}
                                    onClick={() => {
                                        _setOpenModalDetail(true)
                                        _setRowInfo(val)
                                        _getSalesReportDetail(val)
                                    }}
                                    >
                                        <strong>{val.branchName}</strong>
                                        <div>
                                            <BsChevronRight/>
                                        </div>
                                    </div>
                                    
                                    <Row>
                                        <Col
                                        column={3}
                                        style={{
                                            "display": "grid"
                                        }}
                                        >
                                            <small>Penumpang</small>
                                            <span>{val.totalPnp}</span>
                                        </Col>
        
                                        <Col
                                        column={3}
                                        style={{
                                            "display": "grid"
                                        }}
                                        >
                                            <small>Penjualan</small>
                                            <span>{currency(val.totalAmount)}</span>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        })
                    }
                    
                </div>

            
            </AdminLayout>
        </Main>
    )

}