import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'
import { AiFillEdit, AiOutlineEllipsis, AiOutlineTeam, AiOutlineSisternode, AiFillCreditCard } from 'react-icons/ai'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import { Row, Col } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import CounterModal from '../../../../components/CounterModal'
import styles from './Counter.module.scss'
import generateClasses from '../../../../utils/generateClasses'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import Link from 'next/link'
import { dateFilter, currency } from '../../../../utils/filters'
import { useRouter } from 'next/router'

export default function Counter(props) {
    const router = useRouter()
    let refPage = 0

    const __COLUMNS = [
        {
            title : 'Nama Loket',
            field : 'name',
            textAlign: 'left'
        },
        {
            title : 'Alamat Loket',
            field : 'address',
            textAlign: 'left'
        },
        {
            title : 'Cabang',
            field : 'branchName',
            textAlign: 'left'
        },
        {
            title : 'Saldo',
            field : 'saldoDePosit',
            textAlign: 'right',
            minWidth: '70px',
            customCell : (value) => currency(value)
        },
        {
            title : 'Topup',
            field : 'isDeposit',
            minWidth: '60px',
            customCell: (value) => value ? 'Ya' : 'Tidak'
        },
        {
            title : 'Multi Trayek',
            field : 'isMulti',
            minWidth: '60px',
            customCell: (value) => value ? 'Ya' : 'Tidak'
        },
        {
            title : 'Aksi',
            field : "id",
            minWidth: '60px',
            style: {"position": "relative"},
            customCell : (value, row) => {

                return (
                    <div>
                        <div
                        title={"Aksi"}
                        className={styles.dropdown}
                        onClick={() => {
                            _setDropdown(row.id)
                        }}
                        >
                            <AiOutlineEllipsis/>
                        </div>
                        
                        <div
                        style={{"display": "none"}}
                        className={ generateClasses([
                            styles.dropdown_action,
                            "dropdown-item "+row.id
                        ])}
                        >
                            <div
                            title={"Ubah"}
                            className={styles.button_action}
                            onClick={() => {
                                _setIsOpenModal(true)
                                _setForm(row)
                            }}
                            >
                                <AiFillEdit/>
                                <span>Ubah</span>
                            </div>

                            <Link
                            href={router.pathname+"/user/?counter="+row.id+"&name="+row.name+"&refQuery="+_searchQuery+"&refPage="+_page.startFrom}
                            >
                                <div
                                title={"Lihat Petugas"}
                                className={generateClasses([
                                    styles.button_action
                                ])}
                                >
                                    <AiOutlineTeam/>
                                    <span>Petugas</span>
                                </div>
                            </Link>

                            <Link
                            href={router.pathname+"/traject/?counter="+row.id+"&name="+row.name+"&refQuery="+_searchQuery+"&refPage="+_page.startFrom}
                            >
                                <div
                                title={"Lihat Trayek"}
                                className={generateClasses([
                                    styles.button_action
                                ])}
                                >
                                    <AiOutlineSisternode/>
                                    <span>Trayek</span>
                                </div>
                            </Link>

                            <Link
                            href={router.pathname+"/payment/?counter="+row.id+"&name="+row.name+"&refQuery="+_searchQuery+"&refPage="+_page.startFrom}
                            className={styles.tes}
                            >
                                <div
                                title={"Lihat Pembayaran"}
                                className={generateClasses([
                                    styles.button_action,
                                    styles.btn_payment
                                ])}
                                >
                                    <AiFillCreditCard/>
                                    <span>Pembayaran</span>
                                </div>
                            </Link>

                        </div>
                    </div>
                )               
            }
        }
    ]

    const [_counterLists, _setCounterLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_searchQuery, _setSearchQuery] = useState(router.query?.refQuery ? router.query.refQuery : '')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_busDelete, _setBusDelete] = useState(false)
    const [_form, _setForm] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)

    if(router.query?.refPage && _searchQuery == ""){
        refPage = router.query?.refPage
    }

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : refPage
    })

    useEffect(() => {
        _getData(_page)
        console.log(router)
    }, []) 

    function _toggleModal(data){
        _setBusCreate(data)
    }

    function _resetDropdown(){
        const parent = document.getElementsByClassName("dropdown-item")
        parent[0].style.display = "none"
    }

    function _setDropdown(id){
        const parent = document.getElementsByClassName("dropdown-item "+id)
        

        if(parent[0].style.display == "none"){
            parent[0].style.display = "flex"
        }else{
            parent[0].style.display = "none"
        }
    }

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
        
        if (query) {
            params.query = query
        } 

        try {
            const counters = await postJSON('/masterData/counter/list', params, props.authData.token)
            _setCounterLists(counters)
            _setPaginationConfig({
                recordLength : counters.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(counters.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteBus(){
        _setIsProcessing(true)
       
        try {    
            const res = await postJSON('/masterData/bus/delete', _form, props.authData.token)
            _getData()
            _setBusDelete(false)
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }
    
    return (
        <Main>
            <CounterModal
            visible={_isOpenModal}
            closeModal={
                () => {
                    _setIsOpenModal(false)
                    _setForm({})
                }
            }
            data={_form}
            refresh={() => _getData()}
            />
        
            <AdminLayout>

                <Card
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_counterLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={(page) => {
                        _setPagination({ ..._page, startFrom : (page - 1) * _page.length })
                        _resetDropdown()
                    }}
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
                                title={'Tambah Loket'}
                                styles={Button.secondary}
                                onClick={() => _setIsOpenModal(true)}
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