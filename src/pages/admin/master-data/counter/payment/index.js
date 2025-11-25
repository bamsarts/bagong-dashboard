import { useEffect, useState } from 'react'
import Link from 'next/link'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'
import { useRouter } from 'next/router'
import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { AiOutlineLeft, AiFillDelete, AiOutlineClose, AiOutlineCheck} from 'react-icons/ai'
import generateClasses from '../../../../../utils/generateClasses'
import styles from './Payment.module.scss'
import CounterPaymentModal from '../../../../../components/CounterPaymentModal'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function PaymentCounter(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Cabang',
            field : 'branchName',
            textAlign: 'left'
        },
        {
            title : 'Pembayaran',
            field : 'paymentLabel',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <div
                    title={"Hapus"}
                    className={generateClasses([
                        styles.button_action,
                        styles.text_red
                    ])}
                    onClick={() => {
                        _setFormDelete({
                            "id": value
                        })
                    }}
                    >
                        <AiFillDelete/>
                    </div>
                )
            }
        }
    ]

    const [_accessData, _setAccessData] = useState({})
    const [_userLists, _setUserLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_openModal, _setOpenModal] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formDelete, _setFormDelete] = useState({})
    const [_paymentRanges, _setPaymentRanges] = useState([])

    useEffect(() => {
        _getData(_page)
    }, [])

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }
    
    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }
        params.counterId = router.query.counter

        if (query) params.query = query

        try {
            const users = await postJSON('/masterData/counter/payment/list', params, props.authData.token)
            let payment = []

            users.paymentList.forEach(function(val, key){
                payment.push({
                    title: val.label,
                    value: val.id,
                    checked: false
                })
            })

            _setPaymentRanges(payment)
            _setUserLists(users)
            _setPaginationConfig({
                recordLength : users.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(users.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deletePayment(){
        _setIsProcessing(true)
       
        try {    
            const res = await postJSON('/masterData/counter/payment/delete', _formDelete, props.authData.token)
            _getData()
            _setFormDelete({})
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }
    
    return (
        <Main>
            <CounterPaymentModal
            visible={_openModal}
            closeModal={() => {
                _setOpenModal(false)
            }}
            onSuccess={() => {
                _getData()
            }}
            data={_paymentRanges}
            />

            <ConfirmationModal
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({})
            }}
            onDelete={_deletePayment}
            onLoading={_isProcessing}
            />

            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <Link href={"/admin/master-data/counter?refQuery="+router.query.refQuery+"&refPage="+router.query.refPage}>
                            <AiOutlineLeft/>
                        </Link>
                        <strong>{router.query.name}</strong>
                    </div>
                </div>
            }
            >
        
                <Card
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_userLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
                            >
                                <Input
                                placeholder={'Cari'}
                                value={_searchQuery}
                                onChange={(query) => {
                                    const pagination = {
                                        length : Table.defaultProps.recordsPerPageValues[0],
                                        startFrom : 0
                                    }
                                    _setSearchQuery(query)
                                    if (query.length > 1) {
                                        throttle(() => _getData(pagination, query), 300)()
                                    } else {
                                        _getData(pagination, query)
                                    }
                                    _setPage(pagination)
                                }}
                                />
                            </Col>
                            <Col
                            column={2}
                            withPadding
                            >
                                <Button
                                title={'Tambah Pembayaran'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _setOpenModal(true)
                                }}
                                small
                                />
                            </Col>
                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}