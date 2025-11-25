import { useEffect, useState } from 'react'

import { DAMRI_APPS_URL, postJSON, TICKET_ORDER_URL, get } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from '../../promo/addPromo/AddPromo.module.scss'
import { BsChevronLeft, BsPlus } from 'react-icons/bs'
import Label from '../../../../../../components/Label'
import { useRouter } from 'next/router'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import { dateFilter, currency } from '../../../../../../utils/filters'
import Link from 'next/link'

export default function AddSetting(props) {

    const router = useRouter()

    const CONFIG_PARAM = {
        "desc": "",
        "end_periode": dateFilter.basicDate(new Date()).normal + " 23:59:59",
        "company_id": props.authData.companyId,
        "start_periode": dateFilter.basicDate(new Date()).normal + " 00:00:00",
        "title_point": "",
        "type_user": "",
        "value_point": 0,
        "quota_point": 0,
        "validFrom": dateFilter.basicDate(new Date()).normal,
        "validUntil": dateFilter.basicDate(new Date()).normal,
        "is_actived": "",
        "type_user_option": {
            "title": ""
        },
        "timeValidFrom": "00:00",
        "timeValidUntil": "23:59",
    }
    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_dataTable, _setDataTable] = useState([])
    const [_isActive, _setIsActive] = useState(1)
    const [_typeDiscount, _setTypeDiscount] = useState(1)
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
            value: "COMPANY",
            title: 'Perusahaan'
        },
        {
            value: "STAF",
            title: 'Karyawan'
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
            "value": "traject"
        },
        {
            "title": "Keanggotaan",
            "value": "member"
        },
        {
            "title": "Perusahaan",
            "value": "company"
        },
        {
            "title": "Pembayaran",
            "value": "payment_provider_detail"
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

    async function _submitData(){
        _setIsProcessing(true)

        try{
            let method = 'add'
            let message = "ditambahkan"
            let query = {
                ..._form
            }
            
            query.end_periode = query.validUntil+" "+query.timeValidUntil+":00"
            query.start_periode = query.validFrom+" "+query.timeValidFrom+":00"
            query.type_user = query.type_user_option.value

            if(router.query?.detail){
                method = "update"
                message = "diubah"
            }


            delete query.timeValidFrom
            delete query.timeStartAt    
            delete query.validFrom
            delete query.validUntil
            delete query.type_user_option
            delete query.timeValidUntil
            delete query.timeValidFrom
            delete query.detail
            delete query.is_deleted 
            delete query.created_at
            delete query.updated_at 
            delete query.created_by
            delete query.last_modified_by
            delete query.last_modified_at
            delete query.publisher
            delete query.min_amount_transaction
            delete query.quota_daily
            delete query.repetition
            delete query.privacy
            delete query.action_by

            const result = await postJSON('/referal/point/param/'+method, query, props.authData.token)
            
            if(result){
                popAlert({"message": "Berhasil "+message, "type": "success"})

                if(!router.query?.detail){
                    _getListParam()
                }
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

        if(router.query?.detail){
            _submitPointArea(router.query?.detail, _formArea.selectedArea.value, _formArea.point.value) 
            return false;    
        }

        let result = [{
            ..._formArea.selectedArea
        }]

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

    async function _getSelectedArea() {

        let params = {
            "scopeTable": _formArea.point.value,
            "startFrom": 0,
            "length": 850,
            "orderBy": "id",
            "sortMode": "desc"
        }

        try {
            let scope = await postJSON('/loyalty/point/scope/table/target/list', params, props.authData.token)
            
            scope.data.forEach(function(val, key){

                if(_formArea.point.value == "traject"){
                    val.title = "("+val.code+") "+val.name
                }else{
                    val.title = val.name
                }

                val.value = val.id
                val.scopeTable = _formArea.point
            })

            _setCoverageRange(scope.data)

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getListParam(){
        let params = {
            "startFrom": 0,
            "length": 1,
            "orderBy": "id",
            "sortMode": "desc"
        }

        try {
            let scope = await postJSON('/referal/point/param/list', params, props.authData.token)
            
            if(scope.data.length > 0){

                for(const item of _dataTable){
                    _submitPointArea(scope.data[0].id, item.id, item.scopeTable.value)
                }

                // if(!router.query?.detail){
                //     setTimeout(() => {
                //         window.location.href = "/admin/marketing-and-support/marketing/loyalty-point"
                //     }, 1000);
                // }
            }

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _submitPointArea(id, targetId, scopeTable){
        let params = {}

        params.scope_table = scopeTable
        params.scope_target_id = `${targetId}`
        params.referal_point_param_id = id

        delete params.point
        delete params.selectedArea

        try {
            let scope = await postJSON('/referal/point/param/detail/add', params, props.authData.token)
            
            if(router.query?.detail){
                _getDetailParam()
            }
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getDetailParam(){
        let params = {
            "startFrom": 0,
            "length": 1,
            "orderBy": "id",
            "sortMode": "desc",
            "referal_point_param_id": router.query?.detail
        }

        try {
            let scope = await postJSON('/referal/point/param/detail/list', params, props.authData.token)
            
            if(scope.data.length > 0){
                let category = _categoryRange.find(v => v.value == scope.data[0].type_user)
                let datatable = []
                let query = {
                    ...scope.data[0],
                    type_user: category.value,
                    type_user_option: category
                }

                let startPeriod = scope.data[0].start_periode.split(" ")
                let startTimePeriod = startPeriod[1].split(":")
                let endPeriod = scope.data[0].end_periode.split(" ")
                let endTimePeriod = endPeriod[1].split(":")

                query.repetition = scope.data[0].repetition == 1 ? true : false
                query.quota_daily = scope.data[0].quota_daily == 1 ? true : false
                query.is_actived = scope.data[0].is_actived == 1 ? true : false
                query.validFrom = startPeriod[0]
                query.timeValidFrom = startTimePeriod[0]+":"+startTimePeriod[1]
                query.validUntil = endPeriod[0]
                query.timeValidUntil = endTimePeriod[0]+":"+endTimePeriod[1]

                for(const item of scope.data[0].detail){

                    item.scope_target.forEach(function(val, key){
                        datatable.push({
                            "title": val.name,
                            "value": val.target_id,
                            "scopeTable": {
                                "id": val.scope_table_id,
                                "value": item.scope_table,
                                "title": _getScopeTableTitle(item.scope_table)
                            },
                        })
                    })
                }

                _updateQuery(query)
                _setDataTable(datatable)

            }

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _deletePointArea(id){
        let params = {
            "referal_point_param_id": router.query?.detail,
            "id": id
        }

        try {
            let scope = await postJSON('/referal/point/param/detail/delete', params, props.authData.token)

            if(scope){
                popAlert({ message : "Berhasil dihapus", "type": "success" })
            }
        } catch (e) {
            popAlert({ message : e.message })
        }
    }


    useEffect(() => {
        _getScopeTable()

        if(router.query?.detail){
           _getDetailParam()
        }
    }, [])

    useEffect(() => {
        if(_formArea.point?.value){
            _getSelectedArea()
        }
    }, [_formArea.point])

    useEffect(() => {
        console.log("f")
        console.log(_form)
    }, [_form])

    return (
        <Main>
            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href="/admin/marketing-and-support/marketing/referral">
                            <BsChevronLeft/>
                        </Link>
                        <strong>{router.query?.detail ? 'Ubah' : 'Tambah'} Pengaturan</strong>
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
                                title={"Referal Area"}
                                placeholder={'Pilih referal area'}
                                value={_formArea.point.title}
                                suggestions={_pointRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateQuery({
                                        "point": data,
                                        "scope_table": data.value
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
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={"Kategori"}
                                    placeholder={'Pilih kategori'}
                                    value={_form.type_user_option.title}
                                    suggestions={_categoryRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(data) => {
                                        _updateQuery({
                                            "type_user": data.value,
                                            "type_user_option": data
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
                                    title={"Judul Referal"}
                                    placeholder={'Masukan judul referal'}
                                    value={_form.title_point}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "title_point": value
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
                                                            "start_periode": dateFilter.basicDate(new Date(date)).normal + " 00:00:00",
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
                                                            "end_periode": dateFilter.basicDate(new Date(date)).normal + " 23:59:59",
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
                                        title={"Jumlah Poin"}
                                        placeholder={'Masukan poin'}
                                        value={_form.value_point}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "value_point": value
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
                                        title={"Kuota"}
                                        placeholder={'Masukan nilai'}
                                        value={_form.quota_point}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "quota_point": value
                                            })
                                        }}
                                        />
                                    </Col>
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
                                                Aktivasi
                                            </p>
                                            
                                            <Label
                                            activeIndex={_form.is_actived}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Tidak',
                                                    value: false,
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "is_actived": false
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Ya',
                                                    value: true,
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "is_actived": true
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