'use client'

import { useEffect, useState, forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { postJSON, get } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import Tabs from '../../../../../components/Tabs'
import { Col, Row } from '../../../../../components/Layout'
import throttle from '../../../../../utils/throttle'
import Label from '../../../../../components/Label'
import { dateFilter } from '../../../../../utils/filters'
import Button from '../../../../../components/Button'
import RejectAccontBankModal from '../../../../../components/RejectAccountBankModal'
import { writeXLSX, utils, writeFile, zipWriter, BlobWriter } from 'xlsx'


export default function UserApps(props) {

    const __COLUMNS_USER = [
        {
            title : 'Nama',
            field : 'name',
            textAlign: "left"
        },
        {
            title : 'Email',
            field : 'email',
            textAlign: "left"
        },
        {
            title : 'Telepon',
            field : 'phoneNumber'
        },
        {
            title : 'NIK',
            field : 'identity'
        },
        {
            title : 'Jenis Kelamin',
            field : 'gender',
            customCell: (value) => {
                if(value == "MALE"){
                    return "Laki-laki"
                }else if(value == "FEMALE"){
                    return 'Perempuan'
                }else{
                    return ''
                }
            }
        },
        {
            title : "Tanggal Lahir",
            field : "birthDate",
            customCell: (value) => {
                return value
            }
        },
        {
            title : 'Status',
            field : 'isBanned',
            customCell: (value) => {
                
                return (
                    <Label
                    activeIndex={true}
                    labels={[
                        {
                          "class": value ? 'danger': 'primary',
                          "title": value ? 'Diblokir': 'Aktif',
                          "value": true
                        }
                    ]}
                    />
                )
            }
        }
    ]

    const __COLUMNS_PASSENGER = [
        {
            title: 'Nama',
            field: 'nama',
            textAlign: "left"
        },
        {
            title : 'No Identitas',
            field : 'nomor_identitas'
        },
        {
            title : 'No Telepon',
            field : "phone_number",
        },
        {
            title : "Email",
            field : "email",
            textAlign: "left"
        },
        {
            title : "Usia",
            field : "kategori_usia",
            customCell: (value) => {
                if(value == "ADULT"){
                    return 'Dewasa'
                }else if(value == "CHILD"){
                    return 'Anak-anak'
                }else if(value == "ELDERLY"){
                    return 'Lansia'
                }else{
                    return value
                }
            }
        },
        {
            title : "Jenis Kelamin",
            field : "jenis_kelamin",
            customCell: (value) => {
                if(value == "MALE"){
                    return 'Laki-laki'
                }else if(value == "FEMALE"){
                    return 'Perempuan'
                }else{
                    return value
                }
            }
        }
    ]

    const __COLUMNS_PURCHASE = [
        {
            title: 'Cabang',
            field: 'branch_nama',
            textAlign: "left"
        },
        {
            title : 'Trayek',
            field : "traject_nama",
            textAlign: "left"
        },
        {
            title : "Nama Pengguna",
            field : "name",
            textAlign: "left"
        },
        {
            title : "Nama Penumpang",
            field : "nama",
            textAlign: "left"
        },
        {
            title : 'Email',
            field : 'email',
            textAlign: "left"
        },
        {
            title : "No Telepon",
            field : "phone_number",
            textAlign: "left"
        },
        {
            title : "Usia",
            field : "kategori_usia",
            customCell: (value, row) => {

                let age = ""

                if(value == "ADULT"){
                    age = "Dewasa"
                }else if(value == "CHILD"){
                    age = "Anak-anak"
                }else if(value == "ELDERLY"){
                    age = "Lansia"
                }else {
                    age = value
                }

                return age
            }
        },
        {
            title : "Total Transaksi",
            field : "totalPurchase",
        }
    ]


    const [_userLists, _setUserLists] = useState([])
    const [_passengerLists, _setPassengerLists] = useState([])
    const [_accountBankLists, _setAccountBankLists] = useState([])
    
    let [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    let [_paginationConfigPurchase, _setPaginationConfigPurchase] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_pageUser, _setPageUser] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })
    const [_pagePassenger, _setPagePassenger] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })

    const [_pagePurchase, _setPagePurchase] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })

    const [_pageAccountBank, _setPageAccountBank] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })
   

    const [_activeIndex, _setActiveIndex] = useState(0)
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isOpenRejectModal, _setIsOpenRejectModal] = useState(false)
    const [_statusVerify, _setStatusVerify] = useState([
        {
            title: "Semua Status",
            value: ""
        },
        {
            title: "Terverifikasi",
            value: "true"
        },
        {
            title: "Belum Terverifikasi",
            value: "false"
        }
    ])

  
    const [_rowAccountBank, _setRowAccountBank] = useState({})
    const [_purchaseLists, _setPurchaseLists] = useState([])
    const [_typePurchase, _setTypePurchase] = useState([
        {
            title: "Transaksi",
            value: "transaction"
        },
        {
            title: "Keberangkatan",
            value: "departure"
        }
    ])

    const CONFIG_PARAM = {
        "status": "",
        "statusName": "Semua Status",
        "typePurchase": _typePurchase[0],
        "branch": {
            "title": "",
            "value": ""
        },
        "traject": {
            "title": "",
            "value": ""
        }
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)

    const [_startDate, _setStartDate] = useState(new Date())
    const [_endDate, _setEndDate] = useState(new Date())
    const [_branchRanges, _setBranchRanges] = useState([])
    const [_trajectRanges, _setTrajectRanges] = useState([])

    const EndDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            title={"Tanggal Awal"}
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
            title={"Tanggal Akhir"}
            onClick={onClick}
            ref={ref}
            value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    useEffect(() => {
        _getBranch()   
        _getTraject()
        _getUser(_pageUser)
        _setActiveIndex('user')
    }, [])

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }
  
    function _setPagination(pagination) {
    
        _setPageUser(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })

        _getUser(pagination)
    }

    function _setPaginationPassenger(pagination){
        _setPagePassenger(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        
        _getPassenger(pagination)
    }

    function _setPaginationPurchase(pagination){
        _setPagePurchase(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        
        _getPurchase(pagination)
    }

    async function _getBranch() {
        const params = {
            startFrom : 0,
            length : 1560,
        }
        try {
            const branch = await postJSON('/masterData/branch/list', params, props.authData.token)
            let data = []
            branch.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        "title": 'Semua Cabang',
                        "value": ""
                    })
                }
                data.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setBranchRanges(data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

  
    async function _getUser(pagination, query = '', type = "") {
        const params = {
            ...pagination
        }

        params.role_id = "1"

        if(type == "CSV"){
            params.typeResponse = "CSV"
            params.length = 20000
        }

        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }

        _setIsProcessing(true)

    
        try {
            const userList = await postJSON(`/masterData/userRoleAkses/user/list`, params, props.authData.token, type == "CSV" ? true : false)
            
            if(type == "CSV"){
                _downloadCsv(userList, `pengguna-${new Date().toISOString()}.csv`);
            }else{
                _setUserLists(userList)

                _setPaginationConfig({
                    recordLength : userList.totalFiltered,
                    recordsPerPage : pagination.length,
                    activePage : (pagination.startFrom / pagination.length) + 1,
                    totalPages : Math.ceil(userList.totalFiltered / pagination.length)  
                })
            }

            
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 900,
            "companyId": props.authData.companyId,
            "categoryName": "INTERCITY"
        }
        
        try {
            const traject = await postJSON(`/masterData/trayek/list`, params, props.authData.token)
            let trajectRange = [];
            traject.data.forEach(function(val, key){

                if(key == 0){
                    trajectRange.push({
                        "title": "Semua Rute",
                        "value": ""
                    })
                }

                trajectRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setTrajectRanges(trajectRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getPurchase(pagination) {
        const params = {
            ...pagination
        }

        params.companyId = "1";
        params.sortMode = "desc";
        params.typeTransaction = _form.typePurchase.value;
        params.startDate = dateFilter.basicDate(_startDate).normal;
        params.endDate = dateFilter.basicDate(_endDate).normal;
        
        if(_form.branch?.value){
            params.branchId = _form.branch.value
        }

        if(_form.traject?.value){
            params.trajectId = _form.traject.value
        }
        
        _setIsProcessing(true)  
        
        try {
            const purchaseList = await postJSON(`/laporan/dashboard/dataPenumpang/purchase/list`, params, props.authData.token)
            
            if(purchaseList){
                _setPurchaseLists(purchaseList.data)

                _setPaginationConfigPurchase({
                    recordLength : purchaseList.totalFiltered,
                    recordsPerPage : pagination.length,
                    activePage : (pagination.startFrom / pagination.length) + 1,
                    totalPages : Math.ceil(purchaseList.totalFiltered / pagination.length)  
                })
            }

        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getPassenger(pagination, query = '', type = "LIST") {
        const params = {
            ...pagination
        }

        params.companyId = "1";
        params.orderBy = "name";
        params.sortMode = "asc";

        if(type == "CSV"){
            params.length = 40000
            params.typeResponse = "CSV"
        }

        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }
        _setIsProcessing(true)

        try {
            const passengerLists = await postJSON(`/laporan/dashboard/dataPenumpang/list`, params, props.authData.token, type == "CSV" ? true : false)
            
            if(type == "CSV"){
                _downloadCsv(passengerLists, `penumpang-${new Date().toISOString()}.csv`);
            }else{
                _setPassengerLists(passengerLists)
                _setPaginationConfig({
                    recordLength : passengerLists.totalFiltered,
                    recordsPerPage : pagination.length,
                    activePage : (pagination.startFrom / pagination.length) + 1,
                    totalPages : Math.ceil(passengerLists.totalFiltered / pagination.length)  
                })
            }

        } catch (e) {
            popAlert({ message : e.message })

        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getAccountBank(pagination, query = '') {
        const params = {
            ...pagination
        }

        if(_form.status != "") params.is_verified = _form.status
      
        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }

        _setIsProcessing(true)

        try {
            const accountBank = await postJSON(`/masterData/userRoleAkses/user/bank/list`, params, props.authData.token)

            _setAccountBankLists(accountBank)

            _setPaginationConfig({
                recordLength : accountBank.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(accountBank.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })

        } finally {
            _setIsProcessing(false)
        }
    }

    async function _verifyBank(id) {
        const params = {
            "is_verified": true,
            "id": id
        }

        _setIsProcessing(true)

        try {
            const accountBank = await postJSON(`/masterData/userRoleAkses/user/bank/update`, params, props.authData.token)

            if(accountBank){
                _getAccountBank(_pageAccountBank)
            }

        } catch (e) {
            popAlert({ message : e.message })

        } finally {
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        _getAccountBank(_pageAccountBank)
    }, [_form.status])


    function parseCSV(str) {
        const rows = [];
        let row = [], value = '';
        let inQuotes = false;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const nextChar = str[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') {
                    value += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    value += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    row.push(value);
                    value = '';
                } else if (char === '\n') {
                    row.push(value);
                    rows.push(row);
                    row = [];
                    value = '';
                } else if (char === '\r') {
                    continue; // skip carriage return
                } else {
                    value += char;
                }
            }
        }

        // push last value if any
        if (value || row.length > 0) {
            row.push(value);
            rows.push(row);
        }

        return rows;
    }


    const _downloadCsv = async (data, fileName) => {
        const rows = parseCSV(data.trim());

        // Process rows
        const modifiedRows = rows.map((row, index) => {
            // Only modify data rows (not header)
            if (index > 0) {
                if (row[4] === "null") row[4] = "Damri Apps"; // kategori_usia fallback
                row[5] = ""; // clear jenis_kelamin
                row[6] = ""; // clear birth_date
            }
            return row;
        });
    
        // Convert to Excel
        const ws = utils.aoa_to_sheet(modifiedRows);

        // 2. Add password protection on the sheet
        ws['!protect'] = {
            password: 'yourPassword123',
            formatCells: true,
            formatColumns: true,
            formatRows: true
            // You can enable/disable features using boolean flags
        };
        const wb = utils.book_new();
        
        utils.book_append_sheet(wb, ws, "Sheet1");

        return writeFile(wb, `${fileName.replace(".csv", "")}.xlsx`);
    }

    return (
        <Main>

            <RejectAccontBankModal
            visible={_rowAccountBank?.id}
            closeModal={
                () => {
                   _setRowAccountBank({})
                   _getAccountBank(_pageAccountBank)
                }
            }
            data={_rowAccountBank}
            onSuccess={() => {
            }}
            />
            
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Pengguna',
                        value : 'user',
                        onClick : () => {
                            _setActiveIndex('user')
                            _getUser(_pageUser)
                        }
                    },
                    {
                        title : 'Penumpang',
                        value : 'passenger',
                        onClick : () => {
                            _setActiveIndex('passenger')
                            _getPassenger(_pagePassenger)
                        }
                    },
                    {
                        title : 'Pembelian',
                        value : 'purchase',
                        onClick : () => {
                            _setActiveIndex('purchase')
                        }
                    }
                ]}
                />
            }
            >  

            {
                _activeIndex == "user" && (
                    <Card
                    noPadding
                    >
                        <Table
                        exportToXls={false}
                        headerContent={(
                            <Row>
                                <Col
                                withPadding
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getUser(_pageUser, query), 100)()
                                        }else{
                                            _getUser(_pageUser, query)  
                                        }
                                    }}
                                    />
                                </Col>
                                
                                <Col
                                withPadding
                                column={2}
                                >
                                    <Button
                                    onProcess={_isProcessing}
                                    title={'Export Xlsx'}
                                    styles={Button.success}
                                    onClick={() => {
                                        _getUser(_pageUser, "", "CSV")
                                    }}
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={__COLUMNS_USER}
                        records={_userLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPagination({ ..._pageUser, startFrom : (page - 1) * _pageUser.length })}
                        />
                    </Card>
                )
            }    

            {
                _activeIndex == "passenger" && (
                    <Card
                    noPadding
                    >
                        <Table
                        exportToXls={false}
                        isLoading={_isProcessing}
                        headerContent={(
                            <Row>
                                <Col
                                withPadding
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getPassenger(_pagePassenger, query), 100)()
                                        }else{
                                            _getPassenger(_pagePassenger, query)  
                                        }
                                    }}
                                    />
                                </Col>

                                <Col
                                withPadding
                                column={2}
                                >
                                    <Button
                                    onProcess={_isProcessing}
                                    title={'Export Xlsx'}
                                    styles={Button.success}
                                    onClick={() => {
                                        _getPassenger(_pagePassenger, "", "CSV") 
                                    }}
                                    />
                                </Col>
                                
                            </Row>
                        )}
                        columns={__COLUMNS_PASSENGER}
                        records={_passengerLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPaginationPassenger({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPaginationPassenger({ ..._pagePassenger, startFrom : (page - 1) * _pagePassenger.length })}
                        />
                    </Card>
                )
            }         

            {
                _activeIndex == "purchase" && (
                    <Card
                    noPadding
                    >
                        <Table
                        isLoading={_isProcessing}
                        headerContent={(
                            <Row
                            >
                                 <Col
                                withPadding
                                column={1}
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
                                withPadding
                                column={1}
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
                                withPadding
                                column={1}
                                >
                                    <Input
                                    title={"Berdasarkan Tanggal"}
                                    placeholder={'Pilih Status'}
                                    value={_form.typePurchase.title}
                                    suggestions={_typePurchase}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "typePurchase": value
                                        })
                                    }}
                                    />
                                </Col>

                                
                                <Col
                                withPadding
                                column={3}
                                >
                                    <Input
                                    title={"Rute"}
                                    placeholder={'Pilih Rute'}
                                    value={_form.traject.title}
                                    suggestions={_trajectRanges}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "traject": value
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                withPadding
                                column={1}
                                >
                                    <Input
                                    title={"Cabang"}
                                    placeholder={'Pilih Cabang'}
                                    value={_form.branch.title}
                                    suggestions={_branchRanges}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "branch": value
                                        })
                                    }}
                                    />
                                </Col>


                               

                                <Col
                                withPadding
                                column={1}
                                justifyCenter
                                >
                                    <Button
                                    onProcess={_isProcessing}
                                    title={'Terapkan'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _getPurchase(_pagePurchase)
                                    }}
                                    small
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={__COLUMNS_PURCHASE}
                        records={_purchaseLists}
                        config={_paginationConfigPurchase}
                        onRecordsPerPageChange={perPage => _setPaginationPurchase({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPaginationPurchase({ ..._pagePurchase, startFrom : (page - 1) * _pagePurchase.length })}
                        />
                    </Card>
                )
            }         
                  
            </AdminLayout>
        </Main>
    )

}