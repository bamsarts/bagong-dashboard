import { useEffect, useState, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { Row, Col } from '../Layout'
import { popAlert } from '../Main'
import TicketListModal from '../TicketListModal'
import EditTicketModal from '../EditTicketModal'

import { AiFillEdit } from 'react-icons/ai'

import { currency } from '../../utils/filters'

import styles from './CommuterDepositModal.module.scss'

const defaultProps = {
    visible : false,
    onSuccess : null,
    closeModal : null,
    deposit : {
        detail : null
    },
    costs : null,
    crews : [],
    showCommuterModal: null
}

CommuterDepositModal.defaultProps = defaultProps

export default function CommuterDepositModal(props = defaultProps) {

    const appContext = useContext(AppContext)

    const __TABLE_HEADERS = [
        [
            { title : 'Trayek', rowSpan : 2 },
            { title : 'Asal', rowSpan : 2 },
            { title : 'Tujuan', rowSpan : 2 },
            { title : 'Ritase Ke', rowSpan : 2 },
            { title : 'Tarif', rowSpan : 2 },
            { title : 'Tunai', colSpan : 2 },
            { title : 'E-Money', colSpan : 2 },
            { title : 'QRIS', colSpan : 2 },
            { title : 'Debit', colSpan : 2 },
            { title : 'Kredit', colSpan : 2 },
            { title : 'Aksi', rowSpan : 2 },
        ],
        [
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
            { title : 'Pnp'},
            { title : 'Rp' },
        ]
    ]

    const __COLUMNS = [
        {
            field : 'trajectName',
            style : {
                maxWidth : '180px'
            }
        },
        {
            field : 'originName',
            style : {
                maxWidth : '120px'
            },
            className : styles.table_column_left_align
        },
        {
            field : 'destinationName',
            style : {
                maxWidth : '120px'
            },
            className : styles.table_column_left_align
        },
        {
            field : 'trip'
        },
        {
            field : 'baseFare',
            customCell : (value) => currency(value, ''),
        },
        {
            field : 'pnpCash'
        },
        {
            field : 'cash',
            customCell : (value) => currency(value, ''),
        },
        {
            field : 'pnpEmoney'
        },
        {
            field : 'emoney',
            customCell : (value) => currency(value, ''),
        },
        {
            field : 'pnpQris'
        },
        {
            field : 'qris',
            customCell : (value) => currency(value, ''),
        },
        {
            field : 'pnpDebit'
        },
        {
            field : 'debit',
            customCell : (value) => currency(value, ''),
        },
        {
            field : 'pnpKredit'
        },
        {
            field : 'kredit',
            customCell : (value) => currency(value, ''),
        },
        {
            field : 'totalPnp',
            customCell : (value, row, index) => {
                return (
                    <Row
                    spaceEvenly
                    center
                    style={{
                        "align-items": "center"
                    }}
                    >
    
                        {
                            value > 0 && (
                                <div
                                title={"Ubah"}
                                className={styles.button_action}
                                onClick={() => {
                                    _getTicketList(row, index)
                                    props.showCommuterModal(false)
                                    _setIsEdit(true)
                                }}
                                >
                                    <AiFillEdit/>
                                </div>
                            )
                        }
                        
                    </Row>
                    
                )
            }
        }
    ]

    const [_isGettingTicket, _setIsGettingTicket] = useState(false)
    const [_isVisibleTableTicket, _setIsVisibleTableTicket] = useState(true)
    const [_isEdit, _setIsEdit] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_selectedTrip, _setSelectedTrip] = useState(null)
    const [_summary, _setSummary] = useState({
        pnpCash : 0,
        cash : 0,
        pnpEmoney : 0,
        emoney : 0,
        pnpQris : 0,
        qris : 0,
        pnpDebit : 0,
        debit : 0,
        pnpKredit : 0,
        kredit : 0,
    })

    const __INSERT_COLUMNS = [
        [
            { value : 'Total', colSpan : 5},
            { value : _summary.pnpCash },
            { value : currency(_summary.cash, 'Rp ') },
            { value : _summary.pnpEmoney },
            { value : currency(_summary.emoney, 'Rp ') },
            { value : _summary.pnpQris },
            { value : currency(_summary.qris, 'Rp ') },
            { value : _summary.pnpDebit },
            { value : currency(_summary.debit, 'Rp ') },
            { value : _summary.pnpKredit },
            { value : currency(_summary.kredit, 'Rp ') },
            { value : '' }
        ],
    ]

    useEffect(() => {
        let pnpCash, cash, pnpEmoney, emoney, pnpQris, qris, pnpDebit, debit, pnpKredit, kredit

        pnpCash = cash = pnpEmoney = emoney = pnpQris = qris = pnpDebit = debit = pnpKredit = kredit = 0
        
        const datas = props.deposit ? props.deposit.detail || props.deposit.history : null
      
        if (datas) {
            datas.forEach(item => {
                pnpCash += item.pnpCash
                cash += item.cash
                pnpEmoney += item.pnpEmoney
                emoney += item.emoney
                pnpQris += item.pnpQris
                qris += item.qris
                pnpDebit += item.pnpDebit
                debit += item.debit
                pnpKredit += item.pnpKredit
                kredit += item.kredit
            })
            _setSummary({
                pnpCash, cash, pnpEmoney, emoney, pnpQris, qris, pnpDebit, debit, pnpKredit, kredit
            })
        }
    }, [props.deposit])

    async function _getTicketList(trip, index, filteredValidate = false) {
        const params = {
            commuterScheduleId : trip?.commuterScheduleId,
            companyId : appContext.authData.companyId,
            date : props.deposit.date,
            busId: trip?.busId
        }
        try {
            let tickets = await postJSON('/keuangan/setoran/commuter/detail/tiket', params, appContext.authData.token)

            if(filteredValidate){
                tickets.data.forEach(function(val, key){
                    if(val.validatedBy == null){
                        delete tickets.data[key]
                    }
                })
            }

            _setSelectedTrip({
                trip,
                index,
                tickets : tickets.data
            })
        } catch (e) {
            
        } finally {
        }
    }

    function isDuplicate(data, target){
        let isFound = false
        data.forEach(function(val, key){
            if(val == target){
                isFound = true
            }
        })
        return isFound
    }

    function _submit(){
        _setIsProcessing(true)

        let promises = []
        let commuterId = []
       
        props.deposit.history.forEach(function(val, key){
            if(val.totalPnp > 0 && !isDuplicate(commuterId, val.commuterScheduleId)){
                let query = {
                    companyId : appContext.authData.companyId,
                    commuterScheduleId : val.commuterScheduleId,
                    date : val.date,
                    busId: val.busId
                }
    
                var result = postJSON("/keuangan/setoran/commuter/detail/v2/setor", query, appContext.authData.token)
                promises.push(result)
                commuterId.push(val.commuterScheduleId)
            }  
        })

        Promise.all(promises)
            .then(function handleData(data){
                popAlert({ message : 'Setoran berhasil diterima', type : 'success' })
                setTimeout(() => {
                    props.closeModal()
                    props.onSuccess()
                    _setIsProcessing(false)
                }, 1000);
            })
            .catch(function handleError(error){
                popAlert({ message : error.message })    
                _setIsProcessing(false)
            })  
    }
    
    return (
        <>
            <TicketListModal
            visibleForm={_isVisibleTableTicket}
            visibleTable={_isVisibleTableTicket}
            visible={_selectedTrip}
            {..._selectedTrip}
            closeModal={() => {
                _setSelectedTrip(null)
                props.showCommuterModal(true)
            }}
            refreshData={
                (filteredValidate = false) => 
                _getTicketList(_selectedTrip.trip, _selectedTrip.index, filteredValidate)
            }
            />

            <EditTicketModal
            visible={_isEdit}
            {..._selectedTrip}
            closeModal={() => {
                _setSelectedTrip(null)
                _setIsEdit(false)
                props.showCommuterModal(true)
            }}
            />

            <Modal
            visible={props.visible}
            onBackdropClick={props.closeModal}
            extraLarge
            centeredContent
            >
            
                <ModalContent
                header={{
                    title : `Rincian Setoran \n ${props.deposit?.driver} - ${props.deposit?.busName}`,
                    closeModal : props.closeModal
                }}
                >
                    {
                        props.deposit?.history && (
                            <div
                            className={styles.container}
                            >
                                <Table
                                tableHeaders={__TABLE_HEADERS}
                                columns={__COLUMNS}
                                records={props.deposit.history}
                                insertColumns={__INSERT_COLUMNS}
                                />

                                <Row>
                                    <Col
                                    column={2}
                                    withPadding
                                    >
                                        <Button
                                        title={'Terima Setoran'}
                                        onClick={_submit}
                                        onProcess={_isProcessing}
                                        />
                                    </Col>
                                </Row>
                            </div>
                        )
                    }
                </ModalContent>
            </Modal>
        </>
    )

}