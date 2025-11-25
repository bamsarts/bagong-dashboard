import { useEffect, useState } from 'react'

import { DAMRI_APPS_URL, postJSON, postFormData, get, BASE_URL } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from '../../promo/addPromo/AddPromo.module.scss'
import { BsChevronLeft } from 'react-icons/bs'
import Label from '../../../../../../components/Label'
import { useRouter } from 'next/router'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import { dateFilter, currency } from '../../../../../../utils/filters'
import Link from 'next/link'
import ConfirmationModal from '../../../../../../components/ConfirmationModal'
import MinioModal from "../../../../../../components/MinioModal";

export default function AddProduct(props) {

    const router = useRouter()
    
    const CONFIG_PARAM = {
        "name": "",
        "desc": "",
        "product_image": "",
        "product_code": "",
        "redeem_point_value": "",
        "is_actived": true,
        "file": "",
        "type": "",
        "notes": "",
        "sub_title": ""   
    }

    const CONFIG_MUTATION = {
        "qnty": "",
        "type": "1",
        "notes": "",
    }

    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_dataTable, _setDataTable] = useState([])
    const [_formMutation, _setFormMutation] = useState(CONFIG_MUTATION) 
    const [_summary, _setSummary] = useState({
        "masuk": 0,
        "keluar": 0,
        "total": 0
    })
    const [_isOpenModalS3, _setIsOpenModalS3] = useState(false)
    const [_typeRange, _setTypeRange] = useState([
        {
            "title": "PRODUCT DIGITAL"
        },
        {
            "title": "VOUCHER"
        },
         {
            "title": "E-WALLET"
        },
        {
            "title": "BARANG"
        }
    ])

    const [_formDelete, _setFormDelete] = useState({})
    const [_voucherCodeRange, _setVoucherCodeRange] = useState([])

    let __COLUMNS_INVENTORY = [
        {
            title: 'Tanggal',
            field : 'created_at',
            textAlign: 'left',
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value)) + " " + dateFilter.getTime(new Date(value)) 
            }
        },
        {
            title: 'Mutasi',
            field : 'type',
            textAlign: 'center',
            customCell: (value) => {
                return (
                    <Label
                    activeIndex={true}
                    labels={[
                        {
                            "class": value == "1" ? 'primary' : "danger",
                            "title": value == "1" ? 'Masuk' : "Keluar",
                            "value": true
                        }
                    ]}
                    />
                )  
            }
        },
        {
            title: 'Kuantitas',
            field : 'qnty',
            textAlign: 'right',
            customCell: (value) => {
                return value
            }
        },
        {
            title: 'Keterangan',
            field : 'notes',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field : 'id',
            customCell: (value) => {
                return (
                    <Button
                    small
                    styles={Button.error}
                    title={"Hapus"}
                    onClick={() => {
                       _setFormDelete({
                            id: value
                       })
                    }}
                    />
                )
            }
        },
    ]

    const __INSERT_COLUMNS = [
        [
            { value: "Total" },
            { value: ""},
            { value: _summary.total},
            { value: ""},
            { value: ""},
        ]
    ]

    async function _deleteInventory(){
        let params = {
            "id": _formDelete.id
        }

        try {
            let scope = await postJSON('/loyalty/product/inventory/delete', params, props.authData.token)
            
            if(scope){
                _getInventory()
                _setFormDelete({})
            }

        } catch (e) {
            popAlert({ message : e.message })
        } 
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
            _setFormMutation(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })
        }
       
    }

    async function _submitData(link = false){
        _setIsProcessing(true)

        try{
            let method = 'add'
            let message = "ditambahkan"
            let query = {
                ..._form
            }

            if(router.query?.id){
                query.id = router.query?.id
                method = 'update'
                message = "diubah"
            }

            delete query.file

            const result = await postJSON('/loyalty/product/'+method, query, props.authData.token)
            
            if(result){
                popAlert({"message": "Berhasil "+message, "type": "success"})
                window.location.href = "/admin/marketing-and-support/marketing/loyalty-point?tab=/product"
            }
           

        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _getMedia(){
        
        let params = {
            startFrom : 0,
            length: 1,
            orderBy: "id",
            sortMode: "desc"
        }

        try {
            const res = await postJSON(`/masterData/media/image/list`, params, props.authData.token)
        
            if(res) {
                _submitData(res.data[0].link)
            }

        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    async function _getInventory(){
        let params = {
            "product_id": router.query?.id,
            "length": 330,
            "orderBy": "id",
            "sortMode": "desc",
            "startFrom": 0
        }

        try {
            let scope = await postJSON('/loyalty/product/inventory/list', params, props.authData.token)
            
            _setDataTable(scope.data)

            _calculateSummary(scope.data)

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _getVoucherCode(){

        let params = {
            startFrom : 0,
            length: 350,
            orderBy: "id",
            sortMode: "desc"
        }

        try {
            const res = await postJSON(`/masterData/voucher/list`, params, props.authData.token)
        
            if(res) {

                let filtered = []

                res.data.map((val, key) => {
                    if(val.privacy == "PRIVATE"){   
                        val.title = val.code + " - "+val.title

                        filtered.push(val)
                    }
                })

               _setVoucherCodeRange(filtered)
            }

        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        if(router.query?.id){
            _getInventory()

            const product = localStorage.getItem("product_loyalty")

            if(product){
                _setForm(JSON.parse(product))
            }
        }

        _getVoucherCode()
    }, [])

    function _validateMutationForm() {
       
        if (!_formMutation.qnty) {
           
            return false
        }

        if (!_formMutation.type) {
           
            return false
        }

        return true
    }

    function _calculateSummary(data) {
        let masuk = 0;
        let keluar = 0;

        data.forEach(item => {
            if(item.type === "1" || item.type === 1) {
                masuk += parseInt(item.qnty) || 0;
            } else {
                keluar += parseInt(item.qnty) || 0;
            }
        });

        _setSummary({
            masuk,
            keluar,
            total: masuk - keluar
        })
    }

    async function _submitDataMutation(){
        _setIsProcessing(true)

        try{
            const query = {
                ..._formMutation
            }

            query.product_id = router.query?.id
            
            const result = await postJSON("/loyalty/product/inventory/add", {
                ...query
            }, props.authData.token)

            if(result) {
                _getInventory()
                popAlert({
                    message: "Mutasi berhasil disimpan",
                    type: 'success'
                })

                _setFormMutation(CONFIG_MUTATION)
            }
            
        }catch(e){
            popAlert({ message : e.message })    
            _setIsProcessing(false)   
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <MinioModal
            visible={_isOpenModalS3}
            closeModal={() => {
                _setIsOpenModalS3(false)
            }}
            />

            <ConfirmationModal
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({})
            }}
            onDelete={_deleteInventory}
            />

            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href="/admin/marketing-and-support/marketing/loyalty-point?tab=/product">
                            <BsChevronLeft/>
                        </Link>
                        <strong>{router.query?.id ? 'Ubah' : 'Tambah'} Hadiah</strong>
                    </div>
                </div>
            }
            >
                <Row>
                    <Col
                    column={2}
                    >
                        <Card>
                            <Col
                            column={6}
                            mobileFullWidth
                            withPadding
                            >
                                <Input
                                title={"Jenis Produk"}
                                placeholder={'Pilih jenis produk'}
                                value={_form.type}
                                suggestions={_typeRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "type": value.title,
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
                                title={"Produk"}
                                placeholder={'Nama produk'}
                                value={_form.name}
                                onChange={(value) => {
                                    _updateQuery({
                                        "name": value
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            withPadding
                            column={6}
                            mobileFullWidth
                            >
                                <Input
                                title={"Sub judul produk"}
                                placeholder={'Masukan sub judul'}
                                value={_form.sub_title}
                                onChange={(value) => {
                                    _updateQuery({
                                        "sub_title": value
                                    })
                                }}
                                />
                            </Col>


                            <Col
                            withPadding
                            column={6}
                            mobileFullWidth
                            >
                                
                                <Input
                                title={"Kode Voucher"}
                                placeholder={'Pilih kode voucher'}
                                value={_form.product_code}
                                suggestions={_voucherCodeRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "product_code": value.code,
                                        "desc": value.notes
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            withPadding
                            column={6}
                            mobileFullWidth
                            >
                                <Input
                                title={"Point"}
                                placeholder={'Masukan point'}
                                value={_form.redeem_point_value}
                                onChange={(value) => {
                                    _updateQuery({
                                        "redeem_point_value": value,
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            withPadding
                            column={6}
                            mobileFullWidth
                            >
                                <Input
                                multiline={2}
                                title={"Deskripsi"}
                                placeholder={'Masukkan deskripsi'}
                                value={_form.desc}
                                onChange={(value) => {
                                    _updateQuery({
                                        "desc": value
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            withPadding
                            column={6}
                            mobileFullWidth
                            >
                                <Input
                                multiline={2}
                                title={"S&K / Cara Pakai"}
                                value={_form.notes}
                                onChange={(value) => {
                                    _updateQuery({
                                        "notes": value
                                    })
                                }}
                                />
                            </Col>


                            <Col
                            marginBottom
                            withPadding
                            column={6}
                            mobileFullWidth
                            style={{
                                gap: "1rem",
                                display: "grid"
                            }}
                            >
                                <div
                                style={{
                                    marginBottom: "1rem"
                                }}
                                >
                                    Gambar
                                </div>


                                {
                                    _form?.product_image && (
                                        <img
                                        style={{
                                            marginBottom: "1rem"
                                        }}
                                        src={_form.product_image}
                                        width={"100"}
                                        height={"auto"}
                                        />
                                    )
                                }

                                <Input
                                style={{
                                    marginBottom: "1rem"
                                }}
                                title={""}
                                placeholder={'Masukkan link'}
                                value={_form.product_image}
                                onChange={(value) => {
                                    _updateQuery({
                                        "product_image": value
                                    })
                                }}
                                />

                                <Button
                                small
                                title={'Media S3'}
                                onClick={() => {
                                    _setIsOpenModalS3(true)
                                }}
                                />
                            </Col>

                            <Col
                            style={{
                                marginTop: "1rem"
                            }}
                            column={2}
                            withPadding
                            >
                                <Button
                                onProcess={_isProcessing}
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _submitData()
                                }}
                                />
                            </Col>
                            
                        </Card>
                    </Col>

                    {
                        router.query?.id && (
                            <Col
                            column={4}
                            >
        
                                <Card>
        
                                    <p>Mutasi Produk</p>
                                    
                                    <Row
                                    marginBottom
                                    style={{
                                        marginTop: "1rem"
                                    }}
                                    >
        
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
                                                        Mutasi
                                                    </p>
                                                    
                                                    <Label
                                                    activeIndex={_formMutation.type}
                                                    labels={[
                                                        {
                                                            class: "warning",
                                                            title: 'Keluar',
                                                            value: "0",
                                                            onClick : () => {
                                                                _updateQuery({
                                                                    "type": "0"
                                                                }, "formMutation")
                                                            }
                                                        },
                                                        {
                                                            class: "primary",
                                                            title: 'Masuk',
                                                            value: "1",
                                                            onClick : () => {
                                                                _updateQuery({
                                                                    "type": "1"
                                                                }, "formMutation")
                                                            }
                                                        }
                                                    ]}
                                                    />
                                                </div>
                                            </div>
                                        </Col>
        
                                        <Col
                                        withPadding
                                        column={1}
                                        mobileFullWidth
                                        >
                                            <Input
                                            title={"Kuantitas"}
                                            placeholder={'Qty'}
                                            value={_formMutation.qnty}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "qnty": value
                                                }, "formMutation")
                                            }}
                                            />
                                        </Col>
        
                                        <Col
                                        withPadding
                                        column={2}
                                        mobileFullWidth
                                        >
                                            <Input
                                            title={"Keterangan"}
                                            placeholder={'Masukan keterangan'}
                                            value={_formMutation.notes}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "notes": value
                                                }, "formMutation")
                                            }}
                                            />
                                        </Col>

                                        <Col
                                        justifyEnd
                                        alignEnd
                                        withPadding
                                        column={1}
                                        mobileFullWidth
                                        >
                                            <Button
                                            disabled={!_validateMutationForm()}
                                            title={'Simpan'}
                                            onClick={() => {
                                                _submitDataMutation()
                                            }}
                                            />
                                        </Col>
                                    </Row>
        
                                    <Table
                                    exportToXls={false}
                                    columns={__COLUMNS_INVENTORY}
                                    records={_dataTable}
                                    insertColumns={__INSERT_COLUMNS}
                                    />
                                </Card>
                               
                            </Col>
                        )
                    }

                   
                    
                
                </Row>
                
                
                
            </AdminLayout>
        </Main>
    )

}