import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import { Col, Row } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import { dateFilter } from '../../../../../utils/filters'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Promo.module.scss'

export default function Promo(props) {

    const router = useRouter()

    const __TABLE_HEADERS = [
        [
            { title : 'Judul Promosi', rowSpan : 2 },
            { title : 'Periode Pembelian', colSpan : 2 },
            { title : 'Periode Keberangkatan', colSpan : 2 },
            { title : 'Kuota', rowSpan : 2 },
            { title : 'Status', rowSpan : 2 },
            { title : 'Detail', rowSpan : 2 },
        ],
        [
            { title : 'Awal'},
            { title : 'Akhir' },
            { title : 'Awal'},
            { title : 'Akhir'}
        ]
    ]

    let __COLUMNS = [
        {
            title: 'Judul Promosi',
            field : 'title',
            textAlign: 'left'
        },
        {
            title: 'Periode Awal',
            field : 'validFrom',
            customCell: (value) => {
                let isValid = value.split("-")

                if(isValid[0] != "0000"){
                    return dateFilter.getMonthDate(new Date(value))+" "+dateFilter.getTime(new Date(value))
                }else{
                    return 'N/A'
                }
            }
        },
        {
            title: 'Periode Akhir',
            field : 'validUntil',
            customCell: (value) => {
                let isValid = value.split("-")

                if(isValid[0] != "0000"){
                    return dateFilter.getMonthDate(new Date(value))+" "+dateFilter.getTime(new Date(value))
                }else{
                    return 'N/A'
                }
            }
        },
        {
            title: 'Keberangkatan Awal',
            field : 'startAt',
            customCell: (value) => dateFilter.convertISO(new Date(value))
        },
        {
            title: 'Keberangkatan Akhir',
            field : 'endAt',
            customCell: (value) => {
                let isValid = value.split("-")

                if(isValid[0] != "0000"){
                    return dateFilter.convertISO(new Date(value))
                }else{
                    return 'N/A'
                }
            }
        },
        {
            title: 'Kuota',
            field : 'quota',
            textAlign: 'right',
        },
        {
            title: 'Status',
            field : 'isActive',
            customCell : (value) => value ? 'Aktif' : 'Tidak Aktif'
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
                        localStorage.setItem("promo_damri", JSON.stringify(record))
                        window.location.href = router.asPath+"/addPromo?detail="+val
                    }}
                    small
                    />
                )
            }
        }
    ]

    const [_promo, _setPromo] = useState([])
    const [_isProcessingDetail, _setIsProcessingDetail] = useState(false)
  
    useEffect(() => {
        _getPromo()
    },[])

    async function _getPromo() {

        let params = {
            startFrom : 0,
            length: 780,
            orderBy: "id",
            sortMode: 'desc',
        }

        try {
            const res = await postJSON(`/marketingSupport/promosi/list`, params, props.authData.token)
            _setPromo(res.data)
            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada promo', type : 'info' })
            }
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    return (
        <Main>
    
            <AdminLayout>
               
                <Card
                noPadding
                >
                    <Table
                    headerContent={
                        <Row
                        verticalEnd
                        >
                            <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                            >
                                <Link
                                href={router.asPath+"/addPromo"}
                                >
                                    <div
                                    className={styles.button}
                                    >  
                                        <span>Tambah Promo</span>
                                    </div>
                                </Link>
                            </Col>
                        </Row>
                    }
                    headExport={[
                        {
                            title: 'Judul Promosi',
                            value: 'title'
                        },
                        {
                            title: 'Deskripsi',
                            value: 'description',
                        },
                        {
                            title: 'Periode Awal',
                            value: 'startAt'
                        },
                        {
                            title: 'Periode Akhir',
                            value: 'endAt',
                        },
                        {
                            title: 'Keberangkatan Awal',
                            value: 'validFrom'
                        },
                        {
                            title: 'Keberangkatan Akhir',
                            value: 'validUntil',
                        },
                        {
                            title: 'Kuota',
                            value: 'quota',
                        },
                        {
                            title: 'Status',
                            value: 'isActive'
                        },
                        {
                            title: 'Nominal',
                            value: 'value',
                        },
                        {
                            title: 'Nominal Maksimal',
                            value: 'maxAmount'
                        },
                        {
                            title: 'Jenis Potongan',
                            value: 'format',
                        }
                    ]}
                    tableHeaders={__TABLE_HEADERS}
                    columns={__COLUMNS}
                    records={_promo}
                    noPadding
                    />
                        
                </Card>
                    
            </AdminLayout>
        </Main>
    )

}