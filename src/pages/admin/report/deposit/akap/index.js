import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import DepositModal from '../../../../../components/DepositModal'
import Table from '../../../../../components/Table'
import Datepicker from '../../../../../components/Datepicker'
import Link from 'next/link'
import { dateFilter, currency } from '../../../../../utils/filters'
import { FaRoute, FaUsers } from 'react-icons/fa'
import styles from './Akap.module.scss'
import generateClasses from '../../../../../utils/generateClasses'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'
import Tabs from '../../../../../components/Tabs'

export default function ReportAkap(props) {

    const __COLUMNS = [
        {
            title : 'No.',
            customCell : (value, record, key) => {
                return key + 1
            }
        },
        {
            title: "Tanggal Keberangkatan",
            field: "departureDate",
            customCell: (value, record, key) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title : 'Kode Jadwal / Produk Bus',
            field : 'busName'
        },
        {
            title : 'Trayek',
            field : 'trajectName',
            textAlign: 'left'
        },
        {
            title : 'Total Penumpang',
            field : 'totalPnp',
        },
        {
            title : 'Total Nominal (Rp)',
            field : 'totalAmount',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'busId',
            customCell : (value, row) => {
                return (
                    <Row>
                    
                        <Link
                        href={window.location.href+"/passenger?detail="+value+"&date="+row.departureDate+"&traject="+row.trajectId+"&bus="+row.busName}
                        >
                            <div
                            title={"Lihat Penumpang"}
                            className={generateClasses([
                                styles.button_action,
                                styles.text_red
                            ])}
                            >
                                <FaUsers/>
                            </div>
                        </Link>
                        
                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_SIMA_MANIFEST = [
        {
            title: 'Kode Booking',
            field : 'bookingCode',
            textAlign: 'left'
        },
        {
            title: 'Kode Tiket',
            field : 'ticket',
            textAlign: 'left'
        },
        {
            title: 'Nama',
            field : 'name',
            textAlign: 'left'
        },
        {
            title: 'No Telepon',
            field : 'nohp',
            textAlign: 'left'
        },
        {
            title: 'Kewarganegaraan',
            field : 'nationality',
            textAlign: 'left',
            customCell: (value, row) => {
                return (
                    <>
                        <p>{value}</p>
                        <span>{row.passport}</span>
                    </>
                )
            }
        },
        {
            title: 'Asal',
            field : 'asal',
            textAlign: 'left',
        },
        {
            title: 'Tujuan',
            field : 'tujuan',
            textAlign: 'left',
        },
        {
            title: 'No Kursi',
            field : 'seatNumber',
            textAlign: 'left',
        },
        {
            title: 'Harga',
            field : 'baseFare',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            title: 'Pemesanan',
            field : 'platform',
            textAlign: 'left',
            customCell: (value, row) => {

                if(row.email == "surge@.id"){
                    return value
                }else{
                    return row.email
                }
            }
        },
        {
            title: 'Diperbarui',
            field : 'update',
            textAlign: 'left',
            customCell: (value, row) => {
                return value
            }
        },
    ]

    const [_date, _setDate] = useState(dateFilter.basicDate(new Date()).normal)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDeposit, _setIsGettingDeposit] = useState(false)
    const [_deposits, _setDeposits] = useState([])
    const [_branch, _setBranch] = useState({
        "title": "Semua Cabang",
        "value": "",
        "id_cabang": ""
    })
    const [_branchRange, _setBranchRange] = useState([])
    const [_accessMenu, _setAccessMenu] = useState({
        "adminCabangAkap": false,
        "SimaDamriManifestPenumpang": false,
        "Divre2": false,
        "selectedBranch": ""
    })
    const [_activeIndex, _setActiveIndex] = useState("internal")
    const [_trajectRanges, _setTrajectRanges] = useState([])
    const [_traject, _setTraject] = useState({
        "value": "",
        "text": ""
    })

    const [_busRanges, _setBusRanges] = useState([])
    const [_bus, _setBus] = useState({
        "text": "",
        "value": ""
    })

    const [_pointsRanges, _setPointsRanges] = useState([])

    const [_manifestSima, _setManifestSima] = useState([])
    const [_counterRanges, _setCounterRanges] = useState([])

    const HEAD_EXPORT_BISKU = [
        {
            title: 'Kode Bus',
            value: "busName"
        },
        {
            title: 'Trayek',
            value: "trajectName"
        },
        {
            title: 'Total Setoran',
            value: "totalAmount"
        },
        {
            title: 'Tanggal Transaksi',
            value: "dateTransaction"
        }
    ]

    async function _getCounter() {
        
        try {
            const param = {
                startFrom: 0,
                length: 940
            }

            const res = await postJSON('/masterData/counter/list', param, props.authData.token)
            
        
            if (res.data) {
                _setCounterRanges(res.data)
            }

            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    async function _getPoints() {
        
        try {
            const param = {
                startFrom: 0,
                length: 940
            }

            const res = await postJSON('/masterData/point/lokasi/list', param, props.authData.token)
            
        
            if (res.data) {
                _setPointsRanges(res.data)
            }

            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    async function _getTrajectSima() {
        
        try {
            const param = {
                tanggal: _date,
                cabang: `${_branch.id_cabang}`
            }

            const res = await postJSON('/simaDamri/manifestPenumpang/trayek/list', param, props.authData.token)
            
        
            if (res.data) {
                _setTrajectRanges(res.data)
            }
            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    async function _getBusSima() {
        
        try {
            const param = {
                tanggal: _date,
                cabang: `${_branch.id_cabang}`,
                kd_trayek: _traject.value
            }

            const res = await postJSON('/simaDamri/manifestPenumpang/bus/list', param, props.authData.token)
            
        
            if (res.data) {
                _setBusRanges(res.data)
            }

            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    function removeBracketsContent(data) {
        return data.replace(/\[.*?\]/g, '').trim();
    }

    async function _getDeposits() {
        _setIsProcessing(true)
        // _setDeposits(null)
        try {
            const param = {
                companyId: props.authData.companyId,
                date: _date,
                startFrom: 0,
                length: 210
            }

            if(_branch.value != "") param.branchId = String(_branch.value);

            if(_accessMenu.selectedBranch) param.branchId = _accessMenu.selectedBranch
            
            const res = await postJSON('/laporan/setoran/akap/list', param, props.authData.token)

            _setDeposits(res.data)
            _setTrajectRanges(res.trajectList)
            _setBusRanges(res.busList)

            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada keberangkatan', type : 'info' })
            }
            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    function _searchTraject(trajectCode){
       
        let traject = {}

        _pointsRanges.forEach(function(val, key){
            if(trajectCode == val.damriCode){
                traject = val
            }
        })

        return traject
    }

    function _searchCounter(counter){

        if(counter != "DAMRIAPPS" && counter != null){

            _counterRanges.forEach(function(val, key){

                if(val.id == parseInt(counter.split("-")[1])){
                    counter = val.name
                }
            })
        }
       
        return counter    
    }

    async function _getDepositsSimaDamri() {
        _setIsProcessing(true)

        let params = {
            tanggal : _date,
            cabang: `${_branch.id_cabang}`,
            trayek: `${_traject.value}`,
            bus: `${_bus.value}`
        }

        try {
            const res = await postJSON(`/simaDamri/manifestPenumpang/list `, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
            
                let origin = _searchTraject(val.asal)
                let destination = _searchTraject(val.tujuan)
                let platform = _searchCounter(val.platform)

                data.push({
                    bookingCode: val.kd_booking,
                    ticket: val.kd_tiket,
                    name: val.penumpang_nama,
                    traject: origin.name+"-"+destination.name,
                    seatNumber: val.kursi,
                    baseFare: val.harga,
                    email: val.email == "surge@.id" ? platform : val.email,
                    bus: _bus.text,
                    trajectCode: val.asal+"-"+val.tujuan,
                    departureDate: _date,
                    aksi: val.aksi,
                    asal: val.asal,
                    tujuan: val.tujuan,
                    selectedTraject: removeBracketsContent(_traject.text),
                    platform: platform,
                    update: val.user_update,
                    nohp: val.nohp,
                    passport: val.passport,
                    nationality: val.nationality
                })

            })

            if(res) {
                _setManifestSima(data)
            }

            _setIsProcessing(false)

        } catch (e) {
            _setIsProcessing(false)
            console.log(e)
        }
    }

    async function _getBranch(filterBranch = ""){
        
        let params = {
            startFrom : 0,
            length: 300,
        }

        try {
            const res = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0 && !props.branch?.branchId){
                    data.push({
                        title: "Semua Cabang",
                        value: "",
                        id_cabang: ""
                    })
                }

                if(!props.branch?.branchId){
                  
                    if(filterBranch){
                        filterBranch.split(",").forEach(function(i, j){
                            if(i == String(val.id)){
                                data.push({
                                    title: val.name,
                                    value: val.id,
                                    id_cabang: val.id_cabang
                                })
                            }
                        })
                    }else{
                        data.push({
                            title: val.name,
                            value: val.id,
                            id_cabang: val.id_cabang
                        })
    
                    }
                }else{
                    if(val.name == props.branch.branchName){
                        data.push({
                            title: val.name,
                            value: val.id,
                            id_cabang: val.id_cabang
                        })
                    }

                   
                }
            })

            if(res) {
                _setBranchRange(data)
                _setBranch(data[0])
            }

        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {

        if (typeof window !== 'undefined') {

            let storage = getLocalStorage("access_menu_damri")
            
            if( storage == null){
                window.location.href = "/sign-in"
            }else{
                const item = JSON.parse(storage)
                
                console.log(item, "local")
                let statusAdminCabangAkap = false
                let statusSimaDamri = false
                let Divre2 = false
                let selectedBranch = ""

                item.forEach(function(val, key){
                    if(val.menu == "AdminCabangAKAP" && val.viewRole){
                        statusAdminCabangAkap = true
                    }

                    if(val.menu == "SimaDamri>ManifestPenumpang" && val.viewRole){
                        statusSimaDamri = true
                        _setActiveIndex("simadamri")
                    }

                    if(val.menu == "Divre2" && val.viewRole){
                        selectedBranch = val.apiLink
                        Divre2 = true
                    }
                })

                _getBranch(selectedBranch)
                _getPoints()

                setTimeout(() => {
                    
                    if(props.branch?.branchName){

                        statusAdminCabangAkap = true
                        
                        _setBranch({
                            title: props.branch?.branchName,
                            value: props.branch?.branchId
                        })
                    }

                    _setAccessMenu({
                        "adminCabangAkap": statusAdminCabangAkap,
                        "SimaDamriManifestPenumpang": statusSimaDamri,
                        Divre2,
                        selectedBranch
                    })
                   

                    // if(!statusAdminCabangAkap){
                    //     _getBranch()
                    //     _getDeposits()
                    // }
                    
                }, 100);
                
            }
        }
    }, [])

    useEffect(() => {

        console.log(_branch)

        if(_branch.id_cabang != ""){
            if(_activeIndex == "internal"){
                _getDeposits()
            }else{
                
                _getTrajectSima()
                _getCounter()  
            }
            
        }
    }, [_branch])

    useEffect(() => {
        if(_activeIndex == "simadamri"){
            _getBusSima()
        }
    }, [_traject])

    useEffect(() => {
        if(_activeIndex == "simadamri" && _accessMenu.SimaDamriManifestPenumpang && _branch?.id_cabang){
            _getTrajectSima()
            
            if(_counterRanges.length == 0){
                _getCounter()
            }
        }
    }, [_activeIndex])

    // useEffect(() => {
    //     if(_branch.id_cabang){
    //         _getTrajectSima()
    //     }
    // }, [_date])

    return (
        <Main>
            <AdminLayout
            headerContent={
                
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Bisku',
                        value : 'internal',
                        isHide: !_accessMenu.SimaDamriManifestPenumpang,
                        onClick : (value) => {
                            _setActiveIndex("internal")
                        }
                    },
                    {
                        title : 'SIMA DAMRI',
                        value : 'simadamri',
                        onClick : (value) => {
                            _setActiveIndex("simadamri")
                        }
                    },
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
                            title={"Tanggal Keberangkatan"}
                            value={_date}
                            onChange={date => _setDate(dateFilter.basicDate(new Date(date)).normal)}
                            />
                        </Col>

                        {
                            !_accessMenu.adminCabangAkap && (
                                <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Cabang'}
                                    placeholder={'Semua Cabang'}
                                    value={_branch.title}
                                    suggestions={_branchRange}
                                    onSuggestionSelect={branch => {
                                        
                                        _setBranch(branch)
                                    }}
                                    />
                                </Col>
                            )
                        }

                        {
                            _trajectRanges.length > 0 && (
                                <>
                                    <Col
                                    column={3}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Input
                                        title={'Trayek'}
                                        placeholder={'Pilih Trayek'}
                                        value={_traject.text}
                                        suggestionField={'text'}
                                        suggestions={_trajectRanges}
                                        onSuggestionSelect={traject => {
                                            _setTraject(traject)
                                        }}
                                        />
                                    </Col>

                                    <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Input
                                        title={'Bus'}
                                        placeholder={'Pilih Bus'}
                                        value={_bus.text}
                                        suggestionField={'text'}
                                        suggestions={_busRanges}
                                        onSuggestionSelect={bus => {
                                            _setBus(bus)
                                        }}
                                        />
                                    </Col>
                                </>
                            )
                        }

                        
                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            title={'Cari Keberangkatan'}
                            onProcess={_isProcessing}
                            onClick={_activeIndex == "internal" ? _getDeposits : _getDepositsSimaDamri}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    (_deposits.length > 0 || _manifestSima.length > 0) && (
                        <Card
                        noPadding
                        >
                            <Table
                            headerContent={(
                                <Row
                                style={{
                                    display: _activeIndex == "internal" ? 'none' : 'flex'
                                }}
                                >
                                    {/* <Col
                                    column={1}
                                    >
                                        <Button
                                        title={'Rekap AP3'}
                                        styles={Button.secondary}
                                        onClick={() => {
                                            setLocalStorage("penjualan_damri", JSON.stringify(_manifestSima))
                                            let url = window.location.href + "/ap3?date="+_date
                                            window.open(url.replace("passenger", 'ap3'),'_blank');
                                        }}
                                        small
                                        />
                                    </Col> */}

                                    <Col
                                    column={1}
                                    >
                                        <Button
                                        title={'Rekap AP3'}
                                        styles={Button.secondary}
                                        onClick={() => {
                                            setLocalStorage("penjualan_damri", JSON.stringify(_manifestSima))
                                            let url = window.location.href + "/ap3Sima?date="+_date+"&bus="+_bus.value+"&trayek="+_traject.value+"&cabang="+_branch.id_cabang
                                            window.open(url.replace("passenger", 'ap3'),'_blank');
                                        }}
                                        small
                                        />
                                    </Col>

                                    <Col
                                    column={1}
                                    >
                                        <Button
                                        title={'Penjualan'}
                                        styles={Button.primary}
                                        onClick={() => {
                                            setLocalStorage("penjualan_damri", JSON.stringify(_manifestSima))
                                            let url = window.location.href + "/sales?date="+_date+"&bus="+_bus.value+"&trayek="+_traject.value+"&cabang="+_branch.id_cabang
                                            window.open(url.replace("passenger", 'sales'),'_blank');
                                        }}
                                        small
                                        />
                                    </Col>
                                </Row>
                            )}
                            headExport={_activeIndex == "internal" ? HEAD_EXPORT_BISKU : false}
                            columns={_activeIndex == "internal" ? __COLUMNS : __COLUMNS_SIMA_MANIFEST}
                            records={_activeIndex == "internal" ? _deposits : _manifestSima}
                            noPadding
                            />
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}