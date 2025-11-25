import { useEffect, useState } from 'react'

import { API_ENDPOINT, BASE_URL, postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import { Col, Row } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import { dateFilter } from '../../../../../utils/filters'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../promo/Promo.module.scss'
import Tabs from '../../../../../components/Tabs'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function Referral(props) {

    const router = useRouter()

    const __TABLE_HEADERS = [
        [ 
            { title : 'Judul', rowSpan : 2 },
            { title : 'Kategori', rowSpan : 2 },
            { title : 'Deskripsi', rowSpan : 2 },
            { title : 'Jumlah Point', rowSpan : 2 },
            { title : 'Periode Transaksi', colSpan : 2 },
            { title : 'Kuota', rowSpan : 2 },
            { title : 'Status', rowSpan : 2 },
            { title : '', rowSpan : 2 },
        ],
        [
            { title : 'Awal'},
            { title : 'Akhir' },
        ]
    ]

    let __COLUMNS = [
        {
            title: '',
            field : 'title_point',
            textAlign: 'left',
            customCell: (value) => {
               return value
            }
        },
        {
            title: '',
            field : 'type_user',
            textAlign: 'left',
            customCell: (value) => {

                let data = {
                    "NEW_USER": 'Pengguna Baru',
                    "EXISTING_USER": "Pengguna Lama"
                }

                return data?.[value] ? data[value] : value
            }
        },
        {
            title: '',
            field : 'desc',
            textAlign: "left",
            customCell: (value) => {
               return value
            }
        },
        {
            title: '',
            field : 'value_point',
            customCell: (value) => {
                return value
            }
        },
        {
            title: 'Keberangkatan Awal',
            field : 'start_periode',
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value)) + " "+value.split(" ")[1]
            }
        },
        {
            title: 'Keberangkatan Akhir',
            field : 'end_periode',
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value)) + " "+value.split(" ")[1]
            }
        },
        {
            title: 'Kuota',
            field : 'quota_point',
            textAlign: 'right',
        },
        {
            title: 'Status',
            field : 'is_actived',
            customCell : (value) => value ? 'Aktif' : 'Tidak Aktif'
        },
        {
            field : 'id',
            customCell : (val, record) => {
                return (

                    <Row>
                        <Col
                        withPadding
                        >
                            <Button
                            title={'Detail'}
                            styles={Button.warning}
                            onProcess={_isProcessingDetail}
                            onClick={(value) => {
                                localStorage.setItem("setting_loyalty", JSON.stringify(record))
                                window.location.href = router.asPath+"/addSetting?detail="+val
                            }}
                            small
                            />
                        </Col>

                        <Col
                        withPadding
                        >
                            <Button
                            title={'Hapus'}
                            styles={Button.error}
                            onProcess={_isProcessingDetail}
                            onClick={() => {
                                _setFormDeleteProduct(record)
                            }}
                            small
                            />
                        </Col>
                    </Row>
                )
            }
        }
    ]

    const __TABLE_HEADERS_TRANSACTION = [
        [
            { title : 'Tanggal Expired', rowSpan : 1 },
            { title : 'Pengguna', rowSpan : 1 },
            { title : 'Poin', rowSpan : 1 },
            { title : 'Keterangan', rowSpan : 1 },
        ]
    ]

    let __COLUMNS_TRANSACTION = [
        {
            title: '',
            field : 'expired',
            textAlign: 'left',
            customCell: (value) => {
                if(value){
                    return dateFilter.getMonthDate(new Date(value))
                }else{
                    return '';
                }
            }
        },
        {
            title: '',
            field : 'userName',
            customCell: (value) => {
               return value
            }
        },
        {
            title: '',
            field : 'value',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field : 'reference',
            customCell: (value, row) => {
                return value + " " + row.reference_id
            }
        }
    ]

    const __TABLE_HEADERS_REPORT = [
        [
            { title : 'Pengguna', rowSpan : 1 },
            { title : 'Total Poin', rowSpan : 1 },
            { title : '', rowSpan : 1 },
        ]
    ]

    let __COLUMNS_REPORT = [
        {
            title: '',
            field : 'userName',
            textAlign: 'left',
            customCell: (value) => {
               return value
            }
        },
        {
            title: '',
            field : 'totalValue',
            customCell: (value) => {
               return value
            }
        },
        {
            field : 'id',
            customCell : (val, record) => {
                return (
                    <Button
                    title={'Detail'}
                    styles={Button.warning}
                    onProcess={_isProcessingDetail}
                    onClick={(value) => {
                        
                    }}
                    small
                    />
                )
            }
        }
    ]

    const __TABLE_HEADERS_REWARD = [
        [
            { title : '', rowSpan : 1 },
            { title : 'Produk', rowSpan : 1 },
            { title : 'Point', rowSpan : 1 },
            { title : '', rowSpan : 1 },
        ]
    ]

    let __COLUMNS_REWARD = [
        {
            title: '',
            field : 'product_image',
            textAlign: 'left',
            customCell: (value) => {
               return (
                   <img
                   src={BASE_URL+"/public/"+value.split("/public/")[1]}
                   width={150}
                   height={"auto"}
                   />
               )
            }
        },
        {
            title: '',
            field : 'name',
            customCell: (value) => {
               return value
            }
        },
        {
            title: '',
            field : 'redeem_point_value',
            customCell: (value) => {
               return value
            }
        },
        {
            field : 'id',
            customCell : (value, record) => {
                return (
                    <Row>
                        <Col
                        withPadding
                        >
                            <Button
                            title={'Detail'}
                            styles={Button.warning}
                            onProcess={_isProcessingDetail}
                            onClick={() => {
                                localStorage.setItem("product_loyalty", JSON.stringify(record))
                                window.location.href = window.location.href+"/addProduct?id="+value
                            }}
                            small
                            />
                        </Col>

                        <Col
                        withPadding
                        >
                            <Button
                            title={'Hapus'}
                            styles={Button.error}
                            onProcess={_isProcessingDetail}
                            onClick={() => {
                                _setFormDeleteProduct(record)
                            }}
                            small
                            />
                        </Col>
                    </Row>
                            
                )
            }
        }
    ]

    const [_referral, _setReferral] = useState([])
    const [_isProcessingDetail, _setIsProcessingDetail] = useState(false)
    const [_activeIndex, _setActiveIndex] = useState("/point")
    const [_pointTransaction, _setPointTransaction] = useState([])
    const [_columnTable, _setColumnTable] = useState(__COLUMNS)
    const [_headerTable, _setHeaderTable] = useState(__TABLE_HEADERS)
    const [_formDeleteProduct, _setFormDeleteProduct] = useState({})

    useEffect(() => {
        _getReferral()
    },[_activeIndex])

    useEffect(() => {
        console.log(_formDeleteProduct)
    }, [_formDeleteProduct])
    
    async function _getReferral() {

        let params = {
            startFrom : 0,
            length: 780,
            orderBy: "id",
            sortMode: 'desc',
        }

        try {
            const res = await postJSON(`/referal`+_activeIndex+`/list`, params, props.authData.token)
            
            _setReferral(res.data)

            if(_activeIndex == "/point"){
                _setColumnTable(__COLUMNS_TRANSACTION)
                _setHeaderTable(__TABLE_HEADERS_TRANSACTION)
            }else if(_activeIndex == "/point/param"){
                _setColumnTable(__COLUMNS)
                _setHeaderTable(__TABLE_HEADERS)
            }else if(_activeIndex == "/product"){
                _setColumnTable(__COLUMNS_REWARD)
                _setHeaderTable(__TABLE_HEADERS_REWARD)
            }else{
                _setColumnTable(__COLUMNS_REPORT)
                _setHeaderTable(__TABLE_HEADERS_REPORT)
            }

            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada data', type : 'info' })
            }
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    function findURLs(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    async function _deleteProduct(){
        let params = {
            "id": _formDeleteProduct?.id
        } 
        
        let link = "/referal/product/delete"

        if(!_formDeleteProduct?.product_code){
            link = "/referal/point/param/delete"   
        }

        try {
            let scope = await postJSON(link, params, props.authData.token)

            if(scope){
                popAlert({ message : "Berhasil dihapus", "type": "success" })
                _setFormDeleteProduct({})
                _getReferral()
            }
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    return (
        <Main>

            <ConfirmationModal
            visible={_formDeleteProduct?.id}
            closeModal={() => {
                _setFormDeleteProduct({})
            }}
            onDelete={_deleteProduct}
            />

            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title: "Transaksi",
                        value: "/point",
                        onClick: () => {
                            _setActiveIndex("/point")
                        }
                    },
                    {
                        title: "Pengaturan",
                        value: "/point/param",
                        onClick: () => {
                            _setActiveIndex("/point/param")
                        }
                    },
                    {
                        title: "Hadiah",
                        value: "/product",
                        onClick: () => {
                            _setActiveIndex("/product")
                        }
                    },
                    {
                        title: "Laporan",
                        value: "/point/user",
                        onClick: () => {
                            _setActiveIndex("/point/user")
                        }
                    }
                ]}
                />
            }
            >
               
                <Card
                noPadding
                >
                    <Table
                    headerContent={
                        <Row
                        verticalEnd
                        >

                            {
                                _activeIndex == "/point/param" && (
                                    <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Link
                                        href={router.asPath+"/addSetting"}
                                        >
                                            <div
                                            className={styles.button}
                                            >  
                                                <span>Tambah Pengaturan</span>
                                            </div>
                                        </Link>
                                    </Col>
                                )
                            }

                            {
                                _activeIndex == "/product" && (
                                    <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Link
                                        href={router.asPath+"/addProduct"}
                                        >
                                            <div
                                            className={styles.button}
                                            >  
                                                <span>Tambah Hadiah</span>
                                            </div>
                                        </Link>
                                    </Col>
                                )
                            }
                            
                        </Row>
                    }
                    tableHeaders={_headerTable}
                    columns={_columnTable}
                    records={_referral}
                    noPadding
                    />
                        
                </Card>
                    
            </AdminLayout>
        </Main>
    )

}