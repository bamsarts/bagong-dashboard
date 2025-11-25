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
import { BsFillSignpostFill, BsThreeDotsVertical, BsFillWalletFill, BsCursorFill, BsFillTrashFill, BsEarbuds } from 'react-icons/bs'
import generateClasses from '../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../components/ConfirmationModal'
import styles from '../commuter/TrajectCommuter.module.scss'

export default function Transit(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'Koneksi Trayek',
            field : 'code',
            customCell: (value, row) => {
                return (
                    <>
                        <p>
                            A - {row['Traject1.name']}
                        </p>
                        <p>
                            B - {row['Traject2.name']}
                        </p>
                    </>
                )
            }
        },
        {
            title : 'Deskripsi',
            field : 'desc',
            textAlign: 'left'
        },
        {
            title : 'Tanggal dibuat',
            field : 'created_at',
            textAlign: 'left'
        },
        {
            title : 'Tanggal diperbarui',
            field : 'last_modified_at'
        },
        {
            title : 'Aksi',
            field : "id",
            style: {"position": "relative"},
            customCell : (value, row) => {
                return (
                    <div
                    style={{"color":"red"}}
                    className={styles.button_action}
                    onClick={() => {
                        _updateQuery({
                            "id": value
                        })
                    }}
                    >
                        <BsFillTrashFill/>
                        <span>Hapus Trayek</span>
                    </div>
                )
            }
        }
    ]

    const FORM = {
        "id": "",
        "traject1_id": "",
        "traject2_id": "",
        "traject1_name": "",
        "traject2_name": "",
        "desc": ""
    }

    const [_trajectMulti, _setTrajectMulti] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formDelete, _setFormDelete] = useState("")
    const [_trajectRanges, _setTrajectRanges] = useState([])
    const [_formTraject, _setFormTraject] = useState(FORM)

    useEffect(() => {
        _getData(_page)
        _getTraject()
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
    
    async function _getData(pagination, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        if (query) params.query = query

        try {
            const transitTrajects = await postJSON('/masterData/connection/traject/list', params, props.authData.token)
            _setTrajectMulti(transitTrajects.data)
            _setPaginationConfig({
                recordLength : transitTrajects.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(transitTrajects.totalFiltered / pagination.length)  
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

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 880,
            "companyId": props.authData.companyId
        }
        
        try {
            let traject = await postJSON(`/masterData/trayek/list`, params, props.authData.token)
            
            if(traject){
                traject.data.forEach(function(val, key){
                    val.name = val.name + " ("+val.code+")"
                })
            }

            _setTrajectRanges(traject.data)
        } catch (e) {
            console.log(e)
        }
    }

    async function _updateQuery(data = {}){
        _setFormTraject(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitData(){
        _setIsProcessing(true)

        let query = {
            ..._formTraject
        }

        delete query.traject1_name
        delete query.traject2_name
        delete query.id

        try {
            await postJSON('/masterData/connection/traject/add', query, props.authData.token)

            popAlert({ message : 'Berhasil disimpan', type : 'success' })
            _updateQuery(FORM)
            _getData(_page)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _deleteTraject(){
        _setIsProcessing(true)

        let query = {
            "id": _formTraject.id
        }

        try {
            await postJSON('/masterData/connection/traject/delete', query, props.authData.token)

            popAlert({ message : 'Berhasil dihapus', type : 'success' })
            _getData(_page)
            _setFormTraject(FORM)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <ConfirmationModal
            visible={_formTraject?.id}
            closeModal={() => {
                _setFormTraject(FORM)
            }}
            onDelete={_deleteTraject}
            onLoading={_isProcessing}
            />

            <AdminLayout>

                <Card>
                    <Input
                    withMargin
                    title={"Trayek A"}
                    placeholder={'Pilih Trayek A'}
                    value={_formTraject.traject1_name}
                    suggestions={_trajectRanges}
                    suggestionField={'name'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "traject1_id": value.id,
                            "traject1_name": value.name
                        })
                    }}
                    />

                    <Input
                    withMargin
                    title={"Trayek B"}
                    placeholder={'Pilih Trayek B'}
                    value={_formTraject.traject2_name}
                    suggestions={_trajectRanges}
                    suggestionField={'name'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "traject2_id": value.id,
                            "traject2_name": value.name
                        })
                    }}
                    />

                    <Input
                    withMargin
                    title={"Deskripsi"}
                    placeholder={'Masukan deskripsi'}
                    value={_formTraject.desc}
                    onChange={(value) => {
                        _updateQuery({
                            "desc": value,
                        })
                    }}
                    />

                    <Col
                    column={2}
                    withPadding
                    style={{"marginTop": "1rem"}}
                    >
                        <Button
                        title={'Simpan'}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                        />
                    </Col>

                </Card>

                <Card
                noPadding
                >
                    <Table
                    headExport={[
                        {
                            title: "Trayek A",
                            value: 'Traject1.name'
                        },
                        {
                            title: "Trayek B",
                            value: 'Traject2.name'
                        },
                        {
                            title: "Deskripsi",
                            value: 'desc'
                        },
                        {
                            title: "Trayek A Kode",
                            value: 'Traject1.code'
                        },
                        {
                            title: "Trayek B Kode",
                            value: 'Traject2.code'
                        },
                        {
                            title: "Tanggal diperbarui",
                            value: 'last_modified_at'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_trajectMulti}
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

                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )
}