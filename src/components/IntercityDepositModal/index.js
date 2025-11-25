import { useEffect, useState, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { Row, Col } from '../Layout'
import { popAlert } from '../Main'
import TicketListModal from '../TicketListModal'

import { currency } from '../../utils/filters'

import styles from './IntercityDepositModal.module.scss'

const defaultProps = {
    visible : false,
    onSuccess : null,
    closeModal : null,
    deposit : {
        detail : null
    },
    costs : null,
    crews : [],
}

IntercityDepositModal.defaultProps = defaultProps

export default function IntercityDepositModal(props = defaultProps) {

    const appContext = useContext(AppContext)

    const __TABLE_HEADERS = [
        [
            { title : 'Trayek', rowSpan : 2 },
            { title : 'Asal', rowSpan : 2 },
            { title : 'Tujuan', rowSpan : 2 },
            { title : 'Trip', rowSpan : 2 },
            { title : 'Unit Price', rowSpan : 2 },
            { title : 'Tunai', colSpan : 2 },
            { title : 'E-Money', colSpan : 2 },
            { title : 'QRIS', colSpan : 2 },
            { title : 'Aksi', rowSpan : 2 },
        ],
        [
            { title : 'Penumpang'},
            { title : 'Pendapatan' },
            { title : 'Penumpang'},
            { title : 'Pendapatan' },
            { title : 'Penumpang'},
            { title : 'Pendapatan' },
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
            customCell : (value) => currency(value, 'Rp '),
        },
        {
            field : 'pnpCash'
        },
        {
            field : 'cash',
            customCell : (value) => currency(value, 'Rp '),
        },
        {
            field : 'pnpEmoney'
        },
        {
            field : 'emoney',
            customCell : (value) => currency(value, 'Rp '),
        },
        {
            field : 'pnpQris'
        },
        {
            field : 'qris',
            customCell : (value) => currency(value, 'Rp '),
        },
        {
            field : '',
            customCell : (value, row, index) => {
                return (
                    <Button
                    small
                    title={'Tiket'}
                    styles={Button.warning}
                    onClick={() => _getTicketList(row, index)}
                    onProcess={_isGettingTicketList === index}
                    />
                )
            }
        }
    ]

    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingTicketList, _setIsGettingTicketList] = useState(null)
    const [_selectedTrip, _setSelectedTrip] = useState(null)
    const [_summary, _setSummary] = useState({
        pnpCash : 0,
        cash : 0,
        pnpEmoney : 0,
        emoney : 0,
        pnpQris : 0,
        qris : 0,
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
            { value : '' }
        ],
    ]

    useEffect(() => {
        let pnpCash, cash, pnpEmoney, emoney, pnpQris, qris

        pnpCash = cash = pnpEmoney = emoney = pnpQris = qris = 0
        
        const datas = props.deposit ? props.deposit.detail || props.deposit.history : null

        if (datas) {
            datas.forEach(item => {
                pnpCash += item.pnpCash
                cash += item.cash
                pnpEmoney += item.pnpEmoney
                emoney += item.emoney
                pnpQris += item.pnpQris
                qris += item.qris
            })
            _setSummary({
                pnpCash, cash, pnpEmoney, emoney, pnpQris, qris
            })
        }
    }, [props.deposit])

    async function _getTicketList(trip, index) {
        _setIsGettingTicketList(index)
        const params = {
            trajectId : trip.trajectId,
            companyId : appContext.authData.companyId,
            date : props.deposit.date,
        }
        try {
            const tickets = await postJSON('/keuangan/setoran/akap/detail/tiket', params, appContext.authData.token)
            _setSelectedTrip({
                trip,
                index,
                tickets : tickets.data
            })
        } catch (e) {
            
        } finally {
            _setIsGettingTicketList(null)
        }
    }

    async function _submit() {
        _setIsProcessing(true)
        try {
            
            let query = {
                companyId : props.deposit.companyId,
                busId : props.deposit.busId,
                userId : props.deposit.userId,
                date : props.deposit.date
            }

            await postJSON({ url : BASE_URL + `/company/deposit/save?${objectToParams(query)}` }, null, props.user.token)
            popAlert({ message : 'Setoran berhasil diterima', type : 'success' })
            props.closeModal()
            props.onSuccess()
        } catch (e) {
            popAlert({ message : e.message['id'] })       
        } finally {
            _setIsProcessing(false)
        }
    }
    
    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        extraLarge
        centeredContent
        >
            <TicketListModal
            visible={_selectedTrip}
            {..._selectedTrip}
            closeModal={() => _setSelectedTrip(null)}
            refreshData={() => _getTicketList(_selectedTrip.trip, _selectedTrip.index)}
            />

            <ModalContent
            header={{
                title : `Rincian Setoran \n ${props.deposit?.driver} - ${props.deposit?.busName}`,
                closeModal : props.closeModal
            }}
            >
                {
                    props.deposit?.detail && (
                        <div
                        className={styles.container}
                        >
                            <Table
                            tableHeaders={__TABLE_HEADERS}
                            columns={__COLUMNS}
                            records={props.deposit.detail || _deposit.detail}
                            insertColumns={__INSERT_COLUMNS}
                            />
                            <Row
                            verticalEnd
                            >
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
                        </div>
                    )
                }
            </ModalContent>
        </Modal>
    )

}