import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Main, { popAlert } from '../../../../../components/Main'
import Table from '../../../../../components/Table'
import Button from '../../../../../components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './TrajectCommuter.module.scss'
import { BsFillSignpostFill, BsThreeDotsVertical, BsFillWalletFill, BsCursorFill, BsFillTrashFill, BsEarbuds } from 'react-icons/bs'
import generateClasses from '../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function TrajectCommuter(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Kode Trayek',
            field : 'code'
        },
        {
            title : 'Dari',
            field : 'orignName',
            textAlign: 'left'
        },
        {
            title : 'Ke',
            field : 'destinationName',
            textAlign: 'left'
        },
        {
            title : 'Kategori',
            field : 'trajectTypeCategory'
        },
        {
            title : 'Segmentasi',
            field : 'trajectTypeName',
            textAlign: 'left'
        },
        {
            title : 'Cabang',
            field : 'branchName',
            textAlign: 'left'
        },
        {
            title : 'Pool',
            field : 'poolName',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
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
                            <BsThreeDotsVertical/>
                        </div>

                        <div
                        style={{"display": "none"}}
                        className={ generateClasses([
                            styles.dropdown_action,
                            "dropdown-item "+row.id
                        ])}
                        >
                            <Link
                            href={router.asPath+"/addTraject?id="+row.id}
                            >
                                <div
                                className={styles.button_action}
                                onClick={() => {
                                    localStorage.setItem("traject_damri", JSON.stringify(row))
                                }}
                                >
                                    <BsFillSignpostFill/>
                                    <span>Ubah Trayek</span>
                                </div>
                            </Link>
                            
                            <Link
                            href={router.asPath+"/addRoute?traject="+row.id+"&code="+row.code}
                            className={styles.button_action}
                            >
                                <div
                                className={styles.button_action}
                                onClick={() => {
                                    localStorage.setItem("traject_damri", JSON.stringify(row))
                                }}
                                >
                                    <BsCursorFill/>
                                    <span>Ubah Point</span>
                                </div>
                                
                            </Link>

                            <Link
                            href={router.asPath+"/addPrice?traject="+row.id+"&code="+row.code}
                            className={styles.button_action}
                            >
                                <div
                                className={styles.button_action}
                                onClick={() => {
                                    localStorage.setItem("traject_damri", JSON.stringify(row))
                                }}
                                >
                                    <BsFillWalletFill/>
                                    <span>Ubah Tarif</span>
                                </div>
                            </Link>

                            <Link
                            href={router.asPath+"/addFacility?traject="+row.id+"&code="+row.code}
                            className={styles.button_action}
                            >
                                <div
                                className={styles.button_action}
                                onClick={() => {
                                    localStorage.setItem("traject_damri", JSON.stringify(row))
                                }}
                                >
                                    <BsEarbuds/>
                                    <span>Ubah Fasilitas</span>
                                </div>
                            </Link>
                           
                            <div
                            style={{"color":"red"}}
                            className={styles.button_action}
                            onClick={() => {
                                _setFormDelete(row.id)
                            }}
                            >
                                <BsFillTrashFill/>
                                <span>Hapus Trayek</span>
                            </div>
                            
                        </div>
                    </div>                        
                )
            }
        }
    ]

    const [_intercityTrajects, _setIntercityTrajects] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_categoryRanges, _setOfficerRanges] = useState([
        {
            title: "Semua Kategori",
            value: ""
        },
        {
            title: "Commuter",
            value: "COMMUTER"
        },
        {
            title: "AKAP",
            value: "INTERCITY"
        }
    ])
    const [_category, _setCategory] = useState({
        title: "Semua Kategori",
        value: ""
    })
    const [_formDelete, _setFormDelete] = useState("")
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {
        _getData(_page)
    }, [])

    useEffect(() => {
        _getData(_page)
    }, [_category])

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
    
    async function _getData(pagination, query = _searchQuery) {
        const params = {
            ...pagination,
            companyId : props.authData.companyId
        }

        if (query) params.query = query
        if (_category.value != "") params.categoryName = _category.value

        try {
            const intercityTrajects = await postJSON('/masterData/trayek/list', params, props.authData.token)
            _setIntercityTrajects(intercityTrajects)
            _setPaginationConfig({
                recordLength : intercityTrajects.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(intercityTrajects.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteTraject(){
        _setIsProcessing(true)
        try{
            
            let query = {
                id: _formDelete
            }

            const result = await postJSON('/masterData/trayek/delete', query, props.authData.token)
            
            popAlert({"message": "Berhasil dihapus", "type": "success"})
            _getData(_page)
            _setFormDelete("")
        } catch (e){
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <ConfirmationModal
            visible={_formDelete != ""}
            closeModal={() => {
                _setFormDelete("")
            }}
            onDelete={_deleteTraject}
            onLoading={_isProcessing}
            />

            <AdminLayout>
                <Card
                noPadding
                >
                    <Table
                    headExport={[
                        {
                            title: "Kode Asal",
                            value: 'originCode'
                        },
                        {
                            title: "Asal",
                            value: 'orignName'
                        },
                        {
                            title: "Kode Tujuan",
                            value: 'destinationCode'
                        },
                        {
                            title: "Tujuan",
                            value: 'destinationName'
                        },
                        {
                            title: "Kode Trayek",
                            value: 'code'
                        },
                        {
                            title: "Trayek",
                            value: 'name'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_intercityTrajects.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
                            mobileFullWidth
                            withPadding
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
                            mobileFullWidth
                            withPadding
                            >
                                <Input
                                placeholder={'Semua Kategori'}
                                value={_category.title}
                                suggestions={_categoryRanges}
                                onSuggestionSelect={category => {
                                    _setCategory(category)
                                }}
                                />

                            </Col>

                            <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                            >
                                <Link
                                href={router.asPath+"/addTraject"}
                                >
                                    <div
                                    className={styles.button}
                                    >  
                                        <span>Tambah</span>
                                    </div>
                                </Link>
                            </Col>
                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )
}