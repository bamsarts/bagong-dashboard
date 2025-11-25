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
import styles from '../promo/Promo.module.scss'
import Tabs from '../../../../../components/Tabs'
import ConfirmationModal from '../../../../../components/ConfirmationModal'
import ApprovalNotesModal from '../../../../../components/ApprovalRedemption'
import Label from '../../../../../components/Label'

export default function PointLoyalty(props) {

    const router = useRouter()

    const __TABLE_HEADERS = [
        [
            { title: 'Judul', rowSpan: 2 },
            { title: 'Kategori', rowSpan: 2 },
            { title: 'Penerbit', rowSpan: 2 },
            { title: 'Jumlah Point', rowSpan: 2 },
            { title: 'Periode Transaksi', colSpan: 2 },
            { title: 'Kuota', rowSpan: 2 },
            { title: 'Status', rowSpan: 2 },
            { title: '', rowSpan: 2 },
        ],
        [
            { title: 'Awal' },
            { title: 'Akhir' },
        ]
    ]

    let __COLUMNS = [
        {
            title: '',
            field: 'title_point',
            textAlign: 'left',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'type_user',
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
            field: 'publisher',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'value_point',
            customCell: (value) => {
                return value
            }
        },
        {
            title: 'Keberangkatan Awal',
            field: 'start_periode',
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value)) + " " + value.split(" ")[1]
            }
        },
        {
            title: 'Keberangkatan Akhir',
            field: 'end_periode',
            customCell: (value) => {
                return dateFilter.getMonthDate(new Date(value)) + " " + value.split(" ")[1]
            }
        },
        {
            title: 'Kuota',
            field: 'quota_point',
            textAlign: 'right',
        },
        {
            title: 'Status',
            field: 'is_actived',
            customCell: (value) => value ? 'Aktif' : 'Tidak Aktif'
        },
        {
            field: 'id',
            customCell: (val, record) => {
                return (
                    <Button
                        title={'Detail'}
                        styles={Button.warning}
                        onProcess={_isProcessingDetail}
                        onClick={(value) => {
                            localStorage.setItem("setting_loyalty", JSON.stringify(record))
                            window.location.href = router.pathname + "/addSetting?detail=" + val
                        }}
                        small
                    />
                )
            }
        }
    ]

    const __TABLE_HEADERS_TRANSACTION = [
        [
            { title: 'Tanggal Expired', rowSpan: 1 },
            { title: 'Pengguna', rowSpan: 1 },
            { title: 'Poin', rowSpan: 1 },
            { title: 'Keterangan', rowSpan: 1 },
        ]
    ]

    let __COLUMNS_TRANSACTION = [
        {
            title: '',
            field: 'expired',
            textAlign: 'left',
            customCell: (value) => {
                if (value) {
                    return dateFilter.getMonthDate(new Date(value))
                } else {
                    return '';
                }
            }
        },
        {
            title: '',
            field: 'userName',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'value',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'reference',
            customCell: (value, row) => {
                return value + " " + row.reference_id
            }
        }
    ]

    const __TABLE_HEADERS_REPORT = [
        [
            { title: 'Pengguna', rowSpan: 1 },
            { title: 'Poin diperoleh', rowSpan: 1 },
            { title: 'Poin ditukar', rowSpan: 1 },
            { title: 'Total poin tersedia', rowSpan: 1 },
        ]
    ]

    let __COLUMNS_REPORT = [
        {
            title: '',
            field: 'userName',
            textAlign: 'left',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'totalValue',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'totalOut',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'totalValue',
            customCell: (value, row) => {
                return parseInt(value) - parseInt(row.totalOut)
            }
        }
    ]

    const __TABLE_HEADERS_REWARD = [
        [
            { title: '', rowSpan: 1 },
            { title: 'Produk', rowSpan: 1 },
            { title: 'Point', rowSpan: 1 },
            { title: '', rowSpan: 1 },
        ]
    ]

    let __COLUMNS_REWARD = [
        {
            title: '',
            field: 'product_image',
            textAlign: 'left',
            customCell: (value) => {
                return (
                    <img
                        src={value}
                        width={150}
                        height={"auto"}
                    />
                )
            }
        },
        {
            title: '',
            field: 'name',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'redeem_point_value',
            customCell: (value) => {
                return value
            }
        },
        {
            field: 'id',
            customCell: (value, record) => {
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
                                    window.location.href = router.pathname + "/addProduct?id=" + value
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

    const __TABLE_HEADERS_REDEEM = [
        [
            { title: 'Nama', rowSpan: 1 },
            { title: 'No Telepon', rowSpan: 1 },
            { title: 'Produk', rowSpan: 1 },
            { title: 'Status', rowSpan: 1 },
            { title: 'Catatan', rowSpan: 1 },
            { title: '', rowSpan: 1 },
        ]
    ]

    let __COLUMNS_REDEEM = [
        {
            title: '',
            field: 'user_name',
            textAlign: 'left',

        },
        {
            title: '',
            field: 'phone_number',
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'product_name',
            textAlign: "left",
            customCell: (value) => {
                return value
            }
        },
        {
            title: '',
            field: 'proses_label',
            customCell: (value, row) => {
                return (
                    <Col
                    verticalCenter
                    style={{
                        gap: ".5rem"
                    }}
                    >

                        <Label
                            activeIndex={true}
                            labels={[
                                {
                                    "class": _statusPayment(value).class,
                                    "title": _statusPayment(value).title,
                                    "value": true
                                }
                            ]}
                        />

                        <span>{row.approval_notes}</span>
                    </Col>
                )
            }
        },
         {
            title: '',
            field: 'notes',
            textAlign: "left",
            customCell: (value) => {
                return value
            }
        },
        {
            field: 'id',
            customCell: (value, record) => {

                if(record.proses_label == "Request"){
                    return (
                        <Row>
                            <Col
                            withPadding
                            >
                                <Button
                                title={'Persetujuan'}
                                styles={Button.success}
                                onProcess={_isProcessingDetail}
                                onClick={() => {
                                    _setApprovalModal({ visible: true, row: record })
                                }}
                                small
                                />
                            </Col>

                        </Row>
                    )
                }else{
                    return ''
                }
                
            }
        }
    ]

    const [_loyalty, _setLoyalty] = useState([])
    const [_isProcessingDetail, _setIsProcessingDetail] = useState(false)
    const [_activeIndex, _setActiveIndex] = useState("/point")
    const [_pointTransaction, _setPointTransaction] = useState([])
    const [_columnTable, _setColumnTable] = useState(__COLUMNS)
    const [_headerTable, _setHeaderTable] = useState(__TABLE_HEADERS)
    const [_formDeleteProduct, _setFormDeleteProduct] = useState({})
    const [_approvalModal, _setApprovalModal] = useState({ visible: false, record: null })

    // Set activeIndex based on URL query parameter
    useEffect(() => {
        if (router.isReady) {
            const { tab } = router.query
            if (tab) {
                _setActiveIndex(tab)
            }
        }
    }, [router.isReady, router.query])

    useEffect(() => {
        _getLoyalty()
    }, [_activeIndex])


    function _statusPayment(status) {
        // added switch case data
        // Fungsi ini menerima status pembayaran dan mengembalikan label yang sesuai

        let data = {
            "class": "primary",
            "title": ""
        }

        switch (status) {
            case "Berhasil":
                data.class = "primary"
                data.title = "Disetujui"
                break
            case "Decline":
                data.class = "danger"
                data.title = "Ditolak"
                break
            case "Request":
                data.class = "warning"
                data.title = "Diajukan"
                break
            default:
                data.class = "secondary"
                data.title = "Unknown"
                break
        }

        return data
    }

    async function _getLoyalty() {

        let params = {
            startFrom: 0,
            length: 780,
            orderBy: "id",
            sortMode: 'desc',
        }

        try {
            const res = await postJSON(`/loyalty` + _activeIndex + `/list`, params, props.authData.token)

            _setLoyalty(res.data)

            if (_activeIndex == "/point") {
                _setColumnTable(__COLUMNS_TRANSACTION)
                _setHeaderTable(__TABLE_HEADERS_TRANSACTION)
            } else if (_activeIndex == "/point/param") {
                _setColumnTable(__COLUMNS)
                _setHeaderTable(__TABLE_HEADERS)
            } else if (_activeIndex == "/product") {
                _setColumnTable(__COLUMNS_REWARD)
                _setHeaderTable(__TABLE_HEADERS_REWARD)
            } else if(_activeIndex == "/redeem"){
                 _setColumnTable(__COLUMNS_REDEEM)
                _setHeaderTable(__TABLE_HEADERS_REDEEM)
            } else {
                _setColumnTable(__COLUMNS_REPORT)
                _setHeaderTable(__TABLE_HEADERS_REPORT)
            }

            if (res.data.length === 0) {
                popAlert({ message: 'Tidak ada data', type: 'info' })
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _deleteProduct() {
        let params = {
            "id": _formDeleteProduct?.id
        }

        try {
            let scope = await postJSON('/loyalty/product/delete', params, props.authData.token)

            if (scope) {
                popAlert({ message: "Berhasil dihapus", "type": "success" })
                _setFormDeleteProduct({})
                _getLoyalty()
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    const handleApprovalClose = () => {
        _setApprovalModal({ visible: false, record: null })
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

            <ApprovalNotesModal
            visible={_approvalModal.visible}
            onClose={handleApprovalClose}
            onSuccess={() => {
                _getLoyalty()
                handleApprovalClose()
            }}
            title={`${_approvalModal.action === 'approve' ? 'Approve' : 'Decline'} Redemption`}
            isProcessing={_isProcessingDetail}
            row={_approvalModal.row}
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
                                    router.push({ pathname: router.pathname, query: { ...router.query, tab: "/point" } }, undefined, { shallow: true })
                                }
                            },
                            {
                                title: "Pengaturan",
                                value: "/point/param",
                                onClick: () => {
                                    _setActiveIndex("/point/param")
                                    router.push({ pathname: router.pathname, query: { ...router.query, tab: "/point/param" } }, undefined, { shallow: true })
                                }
                            },
                            {
                                title: "Hadiah",
                                value: "/product",
                                onClick: () => {
                                    _setActiveIndex("/product")
                                    router.push({ pathname: router.pathname, query: { ...router.query, tab: "/product" } }, undefined, { shallow: true })
                                }
                            },
                            {
                                title: "Laporan",
                                value: "/point/user",
                                onClick: () => {
                                    _setActiveIndex("/point/user")
                                    router.push({ pathname: router.pathname, query: { ...router.query, tab: "/point/user" } }, undefined, { shallow: true })
                                }
                            },
                            {
                                title: "Redeem",
                                value: "/redeem",
                                onClick: () => {
                                    _setActiveIndex("/redeem")
                                    router.push({ pathname: router.pathname, query: { ...router.query, tab: "/redeem" } }, undefined, { shallow: true })
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
                                            href={router.pathname + "/addSetting"}
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
                                            href={router.pathname + "/addProduct"}
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
                    records={_loyalty}
                    noPadding
                    />

                </Card>

            </AdminLayout>
        </Main>
    )

}