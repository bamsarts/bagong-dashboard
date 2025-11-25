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
import styles from './Airport.module.scss'
import { BsChevronRight } from 'react-icons/bs'
import throttle from '../../../../../utils/throttle'
import Datepicker from '../../../../../components/Datepicker'
import Tabs from '../../../../../components/Tabs'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'

export default function Sales(props) {

    const [_accessMenu, _setAccessMenu] = useState({
        "adminCabangAkap": false,
        "adminCabangAll": false,
        "Angkasapura": false,
        "Divre2": false,
        "selectedBranch": ""
    })

    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal,
        end : dateFilter.basicDate(new Date()).normal,
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRange, _setBranchRange] = useState([])
    const [_branch, _setBranch] = useState({
        title: props.branch?.branchName ? props.branch?.branchName : '',
        value: props.branch?.branchId ? props.branch?.branchId : ''
    })
    const [_poolRange, _setPoolRange] = useState([])
    const [_pool, _setPool] = useState({
        "title": "",
        "value": ""
    })
    const [_openModalDetail, _setOpenModalDetail] = useState(false)
    const [_salesReportDetail, _setSalesReportDetail] = useState([])
    const [_summary, _setSummary] = useState({
        totalPnp: 0,
        totalAmount : 0,
    })
    const [_rowInfo, _setRowInfo] = useState({})
    const [_filteredData, _setFilteredData] = useState([])
    const [_officer, _setOfficer] = useState({
        title: "",
        value: ""
    })
    const [_officerRange, _setOfficerRange] = useState([])
    const [_activeIndex, _setActiveIndex] = useState("loket")

    useEffect(() => {

        let selectedBranch = ""

        if (typeof window !== 'undefined') {
            // Perform localStorage action
            
            let storage = getLocalStorage("access_menu_damri")
            
            if( storage == null){
                // window.location.href = "/sign-in"
            }else{
                const item = JSON.parse(storage)
                let access = {}
               
                if(item.length > 0){
                    item.forEach(function(val, key){
                        access[val.menu] = val.viewRole

                        if(val.menu == "Divre2" && val.viewRole){
                            access.selectedBranch = val.apiLink

                            selectedBranch = val.apiLink
                        }
                    })
                }

                _setAccessMenu(access)
            }
        }

        if(props.branch?.branchId){
            _setAccessMenu( oldQuery => ({
                ...oldQuery,
                "adminCabangAll": true
            }))
        }
        
        // _getSalesReport()
        _getBranch(selectedBranch)
        _getPool()

    },[])

    useEffect(() => {
        // _getSalesReport()
    }, [_activeIndex])

    function _getOfficer(data){
        let foundData = []
        _salesReport.forEach(function(val, key){
            if(val.userName == data){
                foundData.push(val)
            }
        })
        _setFilteredData(data != "" ? foundData : _salesReport)
    }

    function _filteredOfficer(data){
        let filtered = [{
            title: "Semua Petugas",
            value: ""
        }]

        data = data.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.userName === value.userName
            ))
        )

        data.forEach(function(val, key){
            filtered.push({
                title: val.userName + " ("+val.counterName+")",
                value: val.userName
            })
        })

        _setOfficerRange(filtered)
    }

    function summary(row){
        let totalAmount, totalPnp

        totalAmount = totalPnp = 0
              
        if (row.length > 0) {
            row.forEach(item => {
                totalAmount += item.totalAmount
                totalPnp += item.totalPnp
            })
        }

        _setSummary({
            totalPnp, totalAmount
        })
    }

    async function _getSalesReportDetail(row) {

        let params = {
            companyId: row.companyId,
            userId : row.userId,
            date : row.dateTransaction,
            length: 690,
            startFrom: 0,
        }

        if(_branch.value != "") params.branchId = _branch.value
        if(_pool.value != "") params.poolId = _pool.value


        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/${_activeIndex}/detail`, params, props.authData.token)
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
            endDate: _date.end
        }

        if(_branch.value != "") params.branchId = String(_branch.value)
        if(_pool.value != "") params.poolId = _pool.value

        if(_accessMenu.selectedBranch) params.branchId = _accessMenu.selectedBranch

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/${_activeIndex}/list`, params, props.authData.token)
            let filteredResult = []

            res.data.forEach(function(val, key){
                if(props.counter?.counterName){
                    if(props.counter?.counterName == val.counterName){
                        filteredResult.push(val)
                    }
                }else{
                    filteredResult.push(val)
                }
            })
                
            _setSalesReport(filteredResult)
            _setFilteredData(filteredResult)
            _setIsProcessing(false)
            _filteredOfficer(filteredResult)

            _setOfficer({
                title: "",
                value: ""
            })

            summary(filteredResult)

            if (filteredResult.length === 0) {
                popAlert({ message : 'Tidak ada penjualan', type : 'info' })
            }
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    async function _getBranch(selectedBranch = ""){
        
        let params = {
            startFrom : 0,
            length: 80,
        }

        try {
            const res = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Cabang",
                        value: ""
                    })
                }

                if(selectedBranch){
                    selectedBranch.split(",").forEach(function(i, j){
                        if(i == String(val.id)){
                            data.push({
                                title: val.name,
                                value: val.id,
                            })
                        }
                    })
                }else{
                    data.push({
                        title: val.name,
                        value: val.id
                    })
                }

                
            })

            if(res) {
                _setBranchRange(data)
                
                if(!props.branch?.branchId){
                    _setBranch(data[0])
                }
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getPool(){
        
        let params = {
            startFrom : 0,
            length: 80,
        }

        try {
            const res = await postJSON(`/masterData/branch/pool/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Pool",
                        value: ""
                    })
                }
                data.push({
                    title: val.name,
                    value: val.id
                })
            })

            if(res) {
                _setPoolRange(data)
                _setPool(data[0])
            }

        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Main>
            <ReportAirportModal
            visible={_openModalDetail}
            closeModal={() => {
                _setOpenModalDetail(false)
            }}
            report={_salesReportDetail}
            rowInfo={_rowInfo}
            role={props.role_id}
            >
            </ReportAirportModal>
            
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Semua Segmentasi',
                        value : 'loket',
                        onClick : () => {
                            _setActiveIndex('loket')
                        }
                    },
                    {
                        title : 'Bandara',
                        value : 'bandara',
                        isHide: _accessMenu.Angkasapura || _accessMenu.Divre2,
                        onClick : () => {
                            _setActiveIndex('bandara')
                        }
                    },
                    {
                        title : 'AKAP',
                        value : 'akap',
                        isHide: _accessMenu.Angkasapura || _accessMenu.Divre2,
                        onClick : () => {
                            _setActiveIndex('akap')
                        }
                    },
                    {
                        title : 'AKDP',
                        value : 'akdp',
                        isHide: _accessMenu.Angkasapura || _accessMenu.Divre2,
                        onClick : () => {
                            _setActiveIndex('akdp')
                        }
                    }
                ]}
                />
            }
            >
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
                        
                        {
                            !_accessMenu.adminCabangAll && (
                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Cabang'}
                                    placeholder={'Semua Cabang'}
                                    value={_branch.title}
                                    suggestions={_branchRange}
                                    onSuggestionSelect={counter => {
                                        _setBranch(counter)
                                    }}
                                    />
                                </Col>
                            )
                        }

                        {
                            (!_accessMenu.Angkasapura && !_accessMenu.Divre2)  && (
                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Pool'}
                                    placeholder={'Semua Pool'}
                                    value={_pool.title}
                                    suggestions={_poolRange}
                                    onSuggestionSelect={pool => {
                                        _setPool(pool)
                                    }}
                                    />
                                </Col>
                            )
                        }

                        

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
                        column={2}
                        mobileFullWidth
                        withPadding
                        >   
                            <div style={{"max-width": "90%"}}>
                                <Input
                                title={'Petugas / Loket'}
                                placeholder={'Cari Petugas'}
                                value={_officer.title}
                                suggestions={_officerRange}
                                onSuggestionSelect={data => {
                                    _setOfficer(data)
                                    _getOfficer(data.value)
                                }}
                                />
                            </div>
                        </Col>

                        <Col
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
                        column={2}
                        withPadding
                        >
                            <div
                            className={styles.total_trx}
                            style={{"margin-left": "1rem"}}
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
                                title={'Export Xlsx'}
                                styles={Button.success}
                                headExport={[
                                    {
                                        title: 'Username',
                                        value: 'userName'
                                    },
                                    {
                                        title: 'Loket',
                                        value: 'counterName',
                                    },
                                    {
                                        title: 'SN MPOS',
                                        value: 'snMPOS',
                                    },
                                    {
                                        title: 'Tanggal',
                                        value: 'dateTransaction',
                                    },
                                    {
                                        title: 'Total Penumpang',
                                        value: 'totalPnp'
                                    },
                                    {
                                        title: 'Total Penjualan',
                                        value: 'totalAmount',
                                    },
                                ]}
                                dataExport={_salesReport}
                                titleExport={"Laporan_Bandara_"+_date.start+"_sd_"+_date.end+".xlsx"}
                                />
                            </div>
                            
                        </Col>
                    </Row>
                </Card>
                
                <div
                className={styles.item_container}
                >   
                    {
                        _filteredData.map((val, key) => {
                            return (
                                <div
                                className={styles.column}
                                >   
                                    <Row
                                    spaceBetween
                                    >
                                        <small>{dateFilter.getMonthDate(new Date(val.dateTransaction))}</small>
                                        <small>Shift {val.shiftId}</small>
                                    </Row>

                                    <div
                                    style={{
                                        display: "grid"
                                    }}
                                    >
                                        <small>{val.counterName}</small>
                                        <small
                                        style={{
                                            color: "gray",
                                        }}
                                        >
                                            {val.snMPOS}
                                        </small>
                                    </div>

                                    <div
                                    className={styles.title}
                                    onClick={() => {
                                        _setOpenModalDetail(true)
                                        _setRowInfo(val)
                                        _getSalesReportDetail(val)
                                    }}
                                    >
                                        <strong>{val.userName}</strong>
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