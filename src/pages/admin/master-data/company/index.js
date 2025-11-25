import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import { AiFillEye } from 'react-icons/ai'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import styles from './Company.module.scss'
import generateClasses from '../../../../utils/generateClasses'
import Link from 'next/link'

export default function Company(props) {

    const __COLUMNS = [
        {
            title : 'Kode Perusahaan',
            field : 'code'
        },
        {
            title : 'Nama Perusahaan',
            field : 'name'
        },
        {
            title : 'Alamat',
            field : 'address'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (    
                    <Link
                    href={window.location.href+"/"+value+"?company="+row.name}
                    >
                        <div
                        title={"Lihat"}
                        className={generateClasses([
                            styles.button_action
                        ])}
                        >
                            <AiFillEye/>
                        </div>
                    </Link>
                )
            }
        }
    ]

    const [_companyLists, _setCompanyLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: 'id',
        sortMode: 'desc'
    })

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
    
    async function _getData(pagination = _page) {
        const params = {
            ...pagination,
        }

        try {
            const companyLists = await postJSON('/masterData/company/list', params, props.authData.token)
            _setCompanyLists(companyLists)
            _setPaginationConfig({
                recordLength : companyLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(companyLists.totalFiltered / pagination.length)  
            })
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
                    columns={__COLUMNS}
                    records={_companyLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}