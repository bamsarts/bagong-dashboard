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
export default function AddProduct(props) {

    const router = useRouter()
    
    const CONFIG_PARAM = {
        "name": "",
        "desc": "",
        "product_image": "",
        "product_code": "",
        "redeem_point_value": "",
        "is_actived": true,
        "file": ""   
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

    const [_formDelete, _setFormDelete] = useState({})

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
            let scope = await postJSON('/referal/product/inventory/delete', params, props.authData.token)
            
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
            }else{
                query.product_image = link
            }

            
            delete query.file

            const result = await postJSON('/referal/product/'+method, query, props.authData.token)
            
            if(result){
                popAlert({"message": "Berhasil "+message, "type": "success"})
                window.location.href = "/admin/marketing-and-support/marketing/referral"
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

    async function _uploadImage(){
        
        if(router.query?.id){
            _submitData()
            return false
        }

        _setIsProcessing(true)

        try{
            const query = {
                "title": _form.name+"-img",
                "file": _form.file
            }

            const result = await postFormData("/masterData/media/image/upload", {
                ...query
            }, props.authData.token)

            if(result) {
                _getMedia()
            }
            
        }catch(e){
            popAlert({ message : e.message })    
            _setIsProcessing(false)   
        } finally{
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
            let scope = await postJSON('/referal/product/inventory/list', params, props.authData.token)
            
            _setDataTable(scope.data)

            _calculateSummary(scope.data)

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    function _getProductImage(image){

        image = image.split("/public/")

        return BASE_URL+"/public/"+image[1]+"?option=thumbnail&size=50"
    }

    useEffect(() => {
        if(router.query?.id){
            _getInventory()

            const product = localStorage.getItem("product_loyalty")

            if(product){
                _setForm(JSON.parse(product))
            }
        }
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
            if(item.type === "1" || item.type === 1 || item.type) {
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
            
            const result = await postJSON("/referal/product/inventory/add", {
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
                        <Link href="/admin/marketing-and-support/marketing/referral">
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
                                title={"Kode"}
                                placeholder={'AF001'}
                                value={_form.product_code}
                                onChange={(value) => {
                                    _updateQuery({
                                        "product_code": value
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
                                        "redeem_point_value": value
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
                                title={"Keterangan"}
                                placeholder={'Masukan keterangan'}
                                value={_form.desc}
                                onChange={(value) => {
                                    _updateQuery({
                                        "desc": value
                                    })
                                }}
                                />
                            </Col>

                            

                            <Col
                            column={6}
                            mobileFullWidth
                            withPadding
                            >
                                <div
                                style={{"margin": "1rem 0rem 1rem 0rem"}}
                                >
                                    Gambar
                                </div>

                                <form
                                id={"form"}
                                style={{"padding": ".5rem"}}
                                >

                                    {
                                        _form?.id && (
                                            <img
                                            src={_getProductImage(_form.product_image)}
                                            width={"100"}
                                            height={"auto"}
                                            />
                                        )
                                    }

                                    <input
                                    style={{"width": "100%"}}
                                    type={'file'}
                                    accept={'.png, .jpg, .jpeg'}
                                    onChange={(e) => {
                                        _updateQuery({
                                            "file": e.target.files[0]
                                        })
                                    }}
                                    />
                                </form>
                            </Col>

                            <Col
                            column={2}
                            withPadding
                            >
                                <Button
                                onProcess={_isProcessing}
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _uploadImage()
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