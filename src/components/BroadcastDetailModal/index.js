import { useState, useEffect, useContext } from 'react'

import { get, postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
// import styles from './ReportSalesModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'
import generateClasses from '../../utils/generateClasses'
import throttle from '../../utils/throttle'

BroadcastDetailModal.defaultProps = {
    visible : false,
    closeModal : null,
    rowInfo : {},
}

export default function BroadcastDetailModal(props = BroadcastDetailModal.defaultProps) {

    const appContext = useContext(AppContext)
    const [_checkedRange, _setCheckedRange] = useState([])
    const [_dataUser, _setDataUser] = useState([])

    const __COLUMNS = [
        {
            title : 'Pilih Semua',
            field : 'isChecked',
            customCell : (val, row, key) => {
                return <Input
                type={"checkbox"}
                checked={_checkedRange[key]?.hasCheck}
                value={"isChecked"}
                onChange={(value) => {
                    _handleChecked(key, _checkedRange[key]?.hasCheck)
            
                    updateUser(row)
                }}
                />
            }
        },
        {
            title : 'Nama',
            field : 'name',
        },
        {
            title : 'Email',
            field : 'email'
        },
        {
            title : 'No Telepon',
            field : 'phone_number'
        },
        {
            title : 'Status',
            field : 'isChecked',
            customCell: (value, row, key) => {
                return value ? 'Terkirim' : 'Belum dikirim'
            }
        }
    ]

    function uniqueByToken(items) {
        const set = new Set();
        return items.filter((item) => {
            const isDuplicate = set.has(item.token);
            set.add(item.token);
            return !isDuplicate;
        });
    }
      
    const updateUser = (newItems) => {
        _setDataUser((user) => {
            return uniqueByToken([...user, newItems]);
        });
    };
      

    const _handleChecked = (position, check) => {
       
        let update = []

        _checkedRange.forEach(function(val, key){
            if(key == position){
                val.hasCheck = !check
            }
            update.push(val)
        })

        _setCheckedRange(update);
    }

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: 'desc'
    })

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_searchQuery, _setSearchQuery] = useState('')

    const [_isProcessing, _setIsProcessing] = useState(false)

    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            broadcastId: props.rowInfo?.id,
            ...pagination,
        }

        if (query) params.query = query

        try {
            const result = await postJSON('/masterData/broadcast/detail/list', params, appContext.authData.token)

            _setCheckedRange(result.data)

            _setPaginationConfig({
                recordLength : result.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(result.totalFiltered / pagination.length)  
            })
            
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getExistUser(){
        try {
            const result = await get({
                url: "/files/broadcast-demo.json"
            }, null, appContext.authData.token)

            _setDataUser(result.data)
            
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    useEffect(() => {
        console.log(_dataUser)
    }, [_dataUser])

    async function _submitData(){
               
        let query  = {
            broadcastId: props.rowInfo?.id,
            details: []
        }

        
        _dataUser.forEach(function(val, key){

            // if(val.hasCheck){
            //     query.details.push({
            //         "userId": val.id,
            //         "receiver": props.rowInfo?.type == "APPS" ? val.token : val.email
            //     })
            // }

            query.details.push({
                "userId": val.id,
                "receiver": props.rowInfo?.type == "APPS" ? val.token : val.email
            })
            
        })

        if(props.rowInfo?.type == "EMAIL"){
            query.details = query.details.filter((arr, index, self) => 
                index === self.findIndex( (t) => (t.receiver === arr.receiver || arr.receiver == null) ) )
        }

      
        _setIsProcessing(true)

        try{
            
            const result = await postJSON('/masterData/broadcast/detail/add', query, appContext.authData.token)
            
            if(result) props.closeModal()

            popAlert({"message": "Berhasil ditambahkan", "type": "success"})
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }


    useEffect(() => {


        if(props.rowInfo?.id){
            // _getData()
            _getExistUser()
        }
    }, [props.rowInfo])

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : `Target Pengguna`,
                closeModal : props.closeModal
            }}
            >   
                
                <Table
                columns={__COLUMNS}
                records={_checkedRange}
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
                                    startFrom : 0,
                                    orderBy: 'id',
                                    sortMode: 'desc'
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

                <Button
                title={'Simpan'}
                styles={Button.secondary}
                onClick={_submitData}
                onProcess={_isProcessing}
                />
                  
            </ModalContent>
        </Modal>
    )

}