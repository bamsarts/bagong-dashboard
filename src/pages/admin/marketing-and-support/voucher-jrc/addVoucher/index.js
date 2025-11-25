import { useEffect, useState } from 'react'

import { DAMRI_APPS_URL, postJSON, TICKET_ORDER_URL, get } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import styles from '../Voucher.module.scss'
import { BsChevronLeft, BsPlus } from 'react-icons/bs'
import Label from '../../../../../components/Label'
import { useRouter } from 'next/router'
import Table from '../../../../../components/Table'
import Datepicker from '../../../../../components/Datepicker'
import { dateFilter, currency } from '../../../../../utils/filters'
import Link from 'next/link'

export default function AddVoucher(props) {

    const router = useRouter()

    const CONFIG_PARAM = {
        "desc": "",
        "companyId": String(props.authData.companyId),
        "title": "",
        "typeUser": "",
        "redemptionQuota": 0,
        "validityPeriod": 0,
        "voucherPrice": 0,
        "availableStock": 0,
        "validFrom": dateFilter.basicDate(new Date()).normal,
        "validUntil": dateFilter.basicDate(new Date()).normal,
        "isActived": true,
        "typeUserOption": {
            "title": ""
        },
        "timeValidFrom": "00:00",
        "timeValidUntil": "23:59",
        "publisher": "",
        "voucherBaseFare": 0,
        "voucherValue": 0,
        "privacy": "PUBLIC",
        "notes": "",
        "actionBy": "",
    }
    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_dataTable, _setDataTable] = useState([])
    const [_isActive, _setIsActive] = useState(1)
    const [_trajectRange, _setTrajectRange] = useState([])
    const [_coverageTargetRange, _setCoverageTargetRange] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_coverageRange, _setCoverageRange] = useState([])
    const [_categoryRange, _setCategoryRange] = useState([
        {
            value: "NEW_USER",
            title: 'Pengguna Baru'
        },
        {
            value: "EXISTING_USER",
            title: 'Pengguna Lama'
        },
        {
            value: "MEMBER",
            title: 'Keanggotaan'
        }
    ])
    const [_companyRange, _setCompanyRange] = useState([
        {
            value: "1",
            title: "DAMRI"
        }
    ])
    
    const [_formArea, _setFormArea] = useState({
        "loyalty_point_param_id": "",
        "scope_table": "",
        "scope_target_id": "",
        "point": {
            "title": ""
        },
        "selectedArea": {
            "title": ""
        }
    })

    const [_pointRange, _setPointRange] = useState([
        {
            "title": "Trayek",
            "value": "TRAJECT"
        },
        {
            "title": "Keanggotaan",
            "value": "MEMBER"
        },
        {
            "title": "Perusahaan",
            "value": "COMPANY"
        },
        {
            "title": "Pembayaran",
            "value": "PAYMENT_PROVIDER_DETAIL"
        }
        
    ])

    const [_selectedAreaRange, _setSelectedAreaRange] = useState([])
    const __COLUMNS = [
        {
            "title": 'Area',
            "field": "scopeTable",
            "textAlign": "left",
            customCell: (value, record, key) => {
                return value.title
            }
        },
        {
            "title": 'Target',
            "field": "title",
            "textAlign": "left"
        },
        {
            "title": "",
            "field": "value",
            customCell: (value, record, key) => {
                return (
                    <Button
                    title={'Hapus'}
                    styles={Button.warning}
                    onClick={() => {
                        _deleteData(key)

                        if(record.scopeTable.id){
                            _deletePointArea(record.scopeTable.id)
                        }
                    }}
                    small
                    />
                )
            }
        }
    ]

    function _getTableTitle(value){
        let data = {}

        if(value.scopeTable == "TRAJECT"){
            data = _trajectRange.find(v => v.id == parseInt(value.scopeTargetId))
        }
        
        return data.name
    }

    function _getScopeTableTitle(value){
        let data = _pointRange.find(v => v.value == value)
        return data.title
    }

    function _updateQuery(data = {}, type = "form"){

        if(type == "form"){
            _setForm(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })
        }else{
            _setFormArea(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })
        }
       
    }

    // Convert string values with thousand separators to integers for voucherValue, voucherPrice, voucherBaseFare
    const parseCurrency = (val) => {
        if (typeof val === "string") {
            // Remove all non-digit characters
            const cleaned = val.replace(/[^\d]/g, "");
            return cleaned ? parseInt(cleaned, 10) : 0;
        }
        return typeof val === "number" ? val : 0;
    };

    async function _submitData(){
        _setIsProcessing(true)

        try{
            let method = 'add'
            let message = "ditambahkan"
            let query = {
                ..._form
            }
            
            query.validUntil = query.validUntil+" "+query.timeValidUntil+":00"
            query.validFrom = query.validFrom+" "+query.timeValidFrom+":00"
            query.typeUser = query.typeUserOption.value
            query.companyId = String(query.companyId);
            query.voucherValue = parseCurrency(query.voucherValue);
            query.voucherPrice = parseCurrency(query.voucherPrice);
            query.voucherBaseFare = parseCurrency(query.voucherBaseFare);

            // Remove any property from query that does not exist in CONFIG_PARAM
            Object.keys(query).forEach(key => {
                if (!(key in CONFIG_PARAM)) {
                    delete query[key];
                }
            });

            delete query.timeValidFrom
            delete query.timeValidUntil
            delete query.typeUserOption
            delete query.typeUser

            if(router.query?.detail){
                method = "update"
                message = "diubah"
                query.id = router.query?.detail
            }

            query.voucherParams = []

            _dataTable.forEach(function(val, key){
                query.voucherParams.push({
                    "scopeTable": val.scopeTable.value,
                    "scopeTargetId": String(val.id)
                })
            })

            const result = await postJSON('/masterData/voucher/'+method, query, props.authData.token)
            
            if(result){
                popAlert({"message": "Berhasil "+message, "type": "success"})

                setTimeout(() => {
                    window.location.href = "/admin/marketing-and-support/voucher-jrc"
                }, 1000);
            }
           

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    function _deleteData(key){
        _setDataTable(_dataTable.filter((v, i) => i !== key))
    }

    function _addData(){

        

        let result = [{
            ..._formArea.selectedArea
        }]

        console.log("add")
        console.log(result)

        let dataTable = [
            ..._dataTable,
            ...result
        ]

        let cleanDataTable = dataTable.filter((arr, index, self) => index === self.findIndex((t) => (t.id == arr.id)))

        _setDataTable(oldData => {
            return [
                ...cleanDataTable,
            ]
        })
        
    }

    async function _getScopeTable() {
        try {
            const scope = await get('/loyalty/point/scope/table/list', props.authData.token)
            let data = {
                "branch": "Cabang",
                "bus": "Bis",
                "bus_category": "Kategori Bis",
                "company": "Perusahaan",
                "counter": "Loket",
                "member": "Keanggotaan",
                "payment_provider_detail": "Pembayaran",
                "point": "Lokasi",
                "role": "Role",
                "traject": "Trayek",
                "traject_track": "Segmentasi"
            }         
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getSelectedArea(table = "") {

        let params = {
            "scopeTable": table ? table : _formArea.point.value.toLowerCase(),
            "startFrom": 0,
            "length": 850,
            "orderBy": "id",
            "sortMode": "desc"
        }

        try {
            let scope = await postJSON('/loyalty/point/scope/table/target/list', params, props.authData.token)
            
            scope.data.forEach(function(val, key){

                if(_formArea.point.value == "TRAJECT"){
                    val.title = "("+val.code+") "+val.name
                }else{
                    val.title = val.name
                }

                val.value = val.id
                val.scopeTable = _formArea.point
            })

            if(table == "traject"){
                _setTrajectRange(scope.data)
            }

           
            _setCoverageRange(scope.data)

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }


    function snakeToCamel(obj) {
        if (Array.isArray(obj)) {
            return obj.map(snakeToCamel);
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((acc, key) => {
                const camelKey = key.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
                acc[camelKey] = snakeToCamel(obj[key]);
                return acc;
            }, {});
        }
        return obj;
    }

    // Function to get date and time in "YYYY-MM-DD HH:MM" format from a string like "2025-08-08 00:00:00"
    function getDateTimeHHMM(value) {
        if (!value) return "";
        // value is expected in "YYYY-MM-DD HH:MM:SS"
        // Split date and time
        const [datePart, timePart] = value.split(" ");
        if (!datePart || !timePart) return value;
        // Get HH:MM from timePart
        const [hh, mm] = timePart.split(":");

        return {
            "date": datePart,
            "time": hh+":"+mm
        }
    }

    async function _getDetailParam(){
    
        try {
            let scope = await get('/masterData/voucher/detail/'+router.query?.detail, props.authData.token)
            
            if(scope.data?.id){
                let datatable = []
                let query = {
                    ...snakeToCamel(scope.data),
                }

                let dateFrom = getDateTimeHHMM(query.validFrom)
                let dateUntil = getDateTimeHHMM(query.validUntil)

                query.validFrom = dateFrom.date
                query.timeValidFrom = dateFrom.time
                query.validUntil = dateUntil.date
                query.timeValidUntil = dateUntil.time
                query.voucherBaseFare = currency(query.voucherBaseFare)
                query.voucherPrice = currency(query.voucherPrice)
                query.voucherValue = currency(query.voucherValue)

                query.voucherParams.forEach(function(val, key){
                    datatable.push({
                        "title": _getTableTitle(val),
                        "value": val.scopeTargetId,
                        "scopeTable": {
                            "id": val.id,
                            "value": val.scopeTable,
                            "title": _getScopeTableTitle(val.scopeTable)
                        },
                    })
                })
                
               
                _updateQuery(query)
                _setDataTable(datatable)

            }

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _deletePointArea(id){
        let params = {
            "loyalty_point_param_id": router.query?.detail,
            "id": id
        }

        try {
            let scope = await postJSON('/loyalty/point/param/detail/delete', params, props.authData.token)

            if(scope){
                popAlert({ message : "Berhasil dihapus", "type": "success" })
            }
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    useEffect(() => {
        if(_trajectRange.length > 0){
            _getDetailParam()
        }
    }, [_trajectRange])

    useEffect(() => {
        _getScopeTable()

        if(router.query?.detail){
            _getSelectedArea("traject")
           
        }
    }, [])

    useEffect(() => {
        if(_formArea.point?.value){
            _getSelectedArea()
        }
    }, [_formArea.point])


    return (
        <Main>
            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href="/admin/marketing-and-support/voucher-jrc">
                            <BsChevronLeft/>
                        </Link>
                        <strong>{router.query?.detail ? 'Ubah' : 'Tambah'} Voucher JR Connexion</strong>
                    </div>
                </div>
            }
            >
                <Row>
                    <Col
                    column={3}
                    >
                        <Card>
                            <Col
                            column={2}
                            mobileFullWidth
                            withPadding
                            >
                                <Input
                                title={"Voucher Area"}
                                placeholder={'Pilih voucher area'}
                                value={_formArea.point.title}
                                suggestions={_pointRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateQuery({
                                        "point": data,
                                        "scopeTable": data.value
                                    }, "formArea")
                                }}
                                />
                            </Col>

                            <Row
                            >
                                <Col
                                withPadding
                                column={5}
                                mobileFullWidth
                                >
                                    <Input
                                    title={"Target"}
                                    placeholder={'Pilih target'}
                                    value={_formArea.selectedArea.title}
                                    suggestions={_coverageRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(data) => {
                                        _updateQuery({
                                            "selectedArea": data
                                        }, "formArea")
                                    }}
                                    />
                                </Col>

                                <Col
                                withPadding
                                alignEnd
                                column={1}
                                justifyEnd
                                >
                                    <Button
                                    small
                                    icon={<BsPlus/>}
                                    styles={Button.danger}
                                    onClick={() => {
                                        _addData()
                                    }}
                                    />
                                </Col>
                            </Row>

                            <Table
                            style={{
                                marginTop: "1rem"
                            }}
                            exportToXls={false}
                            columns={__COLUMNS}
                            records={_dataTable}
                            noPadding
                            />
                            
                        </Card>
                    </Col>
                    
                    <Col
                    column={3}
                    >
                        <Card>    
                            <Row
                            marginBottom
                            verticalEnd
                            >   

                                <Col
                                column={6}
                                mobileFullWidth
                                withPadding
                                > 
                                    <Input
                                    title={"Judul Voucher"}
                                    placeholder={'Masukan judul'}
                                    value={_form.title}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "title": value
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={6}
                                mobileFullWidth
                                withPadding
                                > 
                                    <Input
                                    multiline={2}
                                    title={"Deskripsi"}
                                    placeholder={'Masukan deskripsi'}
                                    value={_form.desc}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "desc": value
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={"Catatan"}
                                    placeholder={'Masukan catatan'}
                                    value={_form.notes}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "notes": value
                                        })
                                    }}
                                    />
                                </Col>
                            </Row>

                            <Row
                            marginBottom
                            >
                                
                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >
                                    <strong>Periode</strong>

                                    <Row>
                                        <Col
                                        column={6}
                                        withPadding
                                        >
                                            <Row>
                                                
                                                <Col
                                                column={3}
                                                >
                                                    <Datepicker
                                                    id={"startAt"}
                                                    title={"Dari"}
                                                    value={_form.validFrom}
                                                    onChange={date => {
                                                        _updateQuery({
                                                            "validFrom": dateFilter.basicDate(new Date(date)).normal,
                                                        })
                                                    }}
                                                    />
                                                </Col>

                                                <Col
                                                column={3}
                                                >
                                                    <Input
                                                    maxLength={5}
                                                    title={"Jam:Menit"}
                                                    placeholder={'00:00'}
                                                    value={_form.timeValidFrom}
                                                    onChange={(value) => {
                                                        _updateQuery({
                                                            "timeValidFrom": value
                                                        })
                                                    }}
                                                    />
                                                </Col>
                                                
                                            </Row>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col
                                        column={6}
                                        withPadding
                                        >
                                            <Row>
                                                <Col
                                                column={3}
                                                >
                                                    <Datepicker
                                                    id={"endAt"}
                                                    title={"Sampai"}
                                                    value={_form.validUntil}
                                                    onChange={date => {
                                                        _updateQuery({
                                                            "validUntil": dateFilter.basicDate(new Date(date)).normal,
                                                        })
                                                    }}
                                                    />
                                                </Col>
                                                
                                                <Col
                                                column={3}
                                                >
                                                    <Input
                                                    maxLength={5}
                                                    title={"Jam:Menit"}
                                                    placeholder={'23:59'}
                                                    value={_form.timeValidUntil}
                                                    onChange={(value) => {
                                                        _updateQuery({
                                                            "timeValidUntil": value
                                                        })
                                                    }}
                                                    />
                                                </Col>
                                                
                                            </Row>
                                            
                                        </Col>
                                    </Row>
                                </Col>

                                <Row
                                style={{
                                    marginTop: "1rem"
                                }}
                                >
                                    <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                    > 
                                        <Input
                                        type={"number"}
                                        title={"Masa Berlaku (Hari)"}
                                        placeholder={'Masukan jumlah hari'}
                                        value={_form.validityPeriod}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "validityPeriod": value
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
                                        type={"number"}
                                        title={"Kuota Redeem"}
                                        placeholder={'Masukan kuota'}
                                        value={_form.redemptionQuota}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "redemptionQuota": value
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
                                        type={"number"}
                                        title={"Stok"}
                                        placeholder={'Masukan jumlah stok'}
                                        value={_form.availableStock}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "availableStock": value
                                            })
                                        }}
                                        />
                                    </Col>
                                </Row>
                                                
                            
                                <Row
                                style={{
                                    marginTop: "1rem"
                                }}
                                >
                                    <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                    > 
                                        <Input
                                        type={"currency"}
                                        title={"Harga Modal (Rp)"}
                                        placeholder={'Masukan harga'}
                                        value={_form.voucherBaseFare}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "voucherBaseFare": value
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
                                        type={"currency"}
                                        title={"Nominal Voucher (Rp)"}
                                        placeholder={'Masukan nominal'}
                                        value={_form.voucherValue}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "voucherValue": value
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
                                        type={"currency"}
                                        title={"Harga Jual (Rp)"}
                                        placeholder={'Masukan harga'}
                                        value={_form.voucherPrice}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "voucherPrice": value
                                            })
                                        }}
                                        />
                                    </Col>

                                    {/* <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Input
                                        title={"Pengguna"}
                                        placeholder={'Pilih pengguna'}
                                        value={_form.typeUserOption.title}
                                        suggestions={_categoryRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateQuery({
                                                "typeUser": data.value,
                                                "typeUserOption": data
                                            })
                                        }}
                                        />
                                    </Col> */}

                                    
                                </Row>
                            </Row>
                                    

                            <Row>

                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >   
                                    <div
                                    className={styles.container}
                                    >
                                        <div
                                        className={styles.activate_container}
                                        >
                                            <p
                                            className={styles.mb_1}
                                            >
                                                Dapat Diakses
                                            </p>
                                            
                                            <Label
                                            activeIndex={_form.privacy}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Public',
                                                    value: "PUBLIC",
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "privacy": "PUBLIC"
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Private',
                                                    value: "PRIVATE",
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "privacy": "PRIVATE"
                                                        })
                                                    }
                                                }
                                            ]}
                                            />
                                        </div>
                                    </div>
                                </Col>

                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                > 
                                    <Input
                                    title={"Penerbit"}
                                    placeholder={'Contoh: BISKU'}
                                    value={_form.publisher}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "publisher": value
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                >   
                                    <div
                                    className={styles.container}
                                    >
                                        <div
                                        className={styles.activate_container}
                                        >
                                            <p
                                            className={styles.mb_1}
                                            >
                                                Pembelian Berdasarkan
                                            </p>
                                            
                                            <Label
                                            activeIndex={_form.actionBy}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Kode Booking',
                                                    value: "BOOKING_CODE",
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "actionBy": "BOOKING_CODE"
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Tiket',
                                                    value: "TICKET",
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "actionBy": "TICKET"
                                                        })
                                                    }
                                                }
                                            ]}
                                            />
                                        </div>
                                    </div>
                                </Col>

                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >   
                                    <div
                                    className={styles.container}
                                    >
                                        <div
                                        className={styles.activate_container}
                                        >
                                            <p
                                            className={styles.mb_1}
                                            >
                                                Aktivasi
                                            </p>
                                            
                                            <Label
                                            activeIndex={_form.isActived}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Tidak',
                                                    value: false,
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "isActived": false
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Ya',
                                                    value: true,
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "isActived": true
                                                        })
                                                    }
                                                }
                                            ]}
                                            />
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <Col
                            column={6}
                            mobileFullWidth
                            withPadding
                            justifyEnd
                            >
                                <Button
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={_submitData}
                                onProcess={_isProcessing}
                                />  
                            </Col>
                        </Card>
                    </Col>
                </Row>
                
                
                
            </AdminLayout>
        </Main>
    )

}