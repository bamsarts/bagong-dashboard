import { useEffect, useState, useContext } from 'react'
import AppContext from '../../context/app'
import { postJSON } from '../../api/utils'

import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import TicketListModal from '../TicketListModal'
import Tabs from '../Tabs'
import { Col, Row } from '../Layout'

import { currency } from '../../utils/filters'

import styles from './DepositModal.module.scss'

const defaultProps = {
    visible : false,
    onSuccess : null,
    closeModal : null,
    deposit : null,
    costs : null,
    crews : [],
    user : {
        token : ''
    },
    titleModal: null,
    showCommuterModal: null,
    depositOta: null,
    activeIndex: ""
}

DepositModal.defaultProps = defaultProps

export default function DepositModal(props = defaultProps) {
    const appContext = useContext(AppContext)
    const [_deposit, _setDeposit] = useState({})
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
            { title : 'Tiket', rowSpan : 2 },
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
            { value : "" },
        ],
    ]

    const __COLUMNS = [
        {
            field : 'trajectName'
        },
        {
            field : 'originName'
        },
        {
            field : 'destinationName'
        },
        {
            field : 'trip'
        },
        {
            field : 'baseFare',
            customCell : (value) => currency(value),
        },
        {
            field : 'pnpCash'
        },
        {
            field : 'cash'
        },
        {
            field : 'pnpEmoney'
        },
        {
            field : 'emoney'
        },
        {
            field : 'pnpQris'
        },
        {
            field : 'qris'
        },
        {
            field : 'pnpDebit'
        },
        {
            field : 'debit'
        },
        {
            field : 'pnpKredit'
        },
        {
            field : 'kredit'
        },
        {
            field: 'commuterScheduleId',
            customCell : (value, row, index) => {
                return (
                    <Button
                    title={'Lihat'}
                    styles={Button.warning}
                    onClick={() => _getTicketList(row, index)}
                    onProcess={_isGettingTicketList === index}
                    small
                    />
                )
            }
        }
    ]

    const __COLUMNS_OTA = [
        {
            title: 'Trayek',
            field : 'trajectName'
        },
        {
            title: 'Asal',
            field : 'originName'
        },
        {
            title: 'Tujuan',
            field : 'destinationName'
        },
        {
            title: 'Ritase Ke',
            field : 'trip'
        },
        {
            title: 'Tarif',
            field : 'baseFare',
            customCell : (value) => currency(value),
        },
        {
            title: 'Tiket',
            field: 'ticket'
        },
        {
            title: 'Channel',
            field: 'payment'
        }
    ]

    useEffect(() => {
        console.log("props index")
        console.log(props.activeIndex)
    }, [props.activeIndex])

    useEffect(() => {
        console.log("props deposit ota")
        console.log(props.depositOta)
    }, [props.depositOta])

    useEffect(() => {
        if(props.visible){
            if (props.deposit?.data) {
                const detail = props.deposit.data.map(item => {
                    return {
                        ...item,
                        destinationName : item.destinationName,
                        originName : item.originName,
                        trajectName : item.trajectName
                    }
                })
                let deposit = props.deposit
                deposit.detail = detail
                _setDeposit({...props.deposit, detail})
            }

            console.log("detail ota")
            console.log(props.deposit)
        }
    }, [props.visible])

    useEffect(() => {
        let pnpCash, cash, pnpEmoney, emoney, pnpQris, qris, pnpDebit, debit, pnpKredit, kredit

        pnpCash = cash = pnpEmoney = emoney = pnpQris = qris = pnpDebit = debit = pnpKredit = kredit = 0
        
        const datas = props.deposit ? props.deposit.data : null
      
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

    async function _getTicketList(trip, index) {
        _setIsGettingTicketList(index)
        const params = {
            commuterScheduleId : trip.commuterScheduleId,
            companyId : appContext.authData.companyId,
            date : trip.dateTransaction,
            busId: trip.busId
        }
        try {
            const tickets = await postJSON('/laporan/setoran/commuter/detail/v2/tiket', params, appContext.authData.token)
            _setSelectedTrip({
                trip,
                index,
                tickets : tickets.data
            })
            props.showCommuterModal(false)
        } catch (e) {
            
        } finally {
            _setIsGettingTicketList(null)
        }
    }

    return (
        <>
            <TicketListModal
            visibleReport={true}
            visibleForm={false}
            large={true}
            visible={_selectedTrip}
            _isValidate={true}
            {..._selectedTrip}
            closeModal={() => {
                _setSelectedTrip(null)
                props.showCommuterModal(true)
            }}
            refreshData={() => _getTicketList(_selectedTrip.trip, _selectedTrip.index)}
            />

            <Modal
            visible={props.visible}
            onBackdropClick={props.closeModal}
            extraLarge
            centeredContent
            >
                <ModalContent
                header={{
                    title : `Rincian Setoran`,
                    closeModal : props.closeModal
                }}
                >   
                    <div
                    className={styles.sub_content}
                    >   
                        {
                            (props.deposit && props.activeIndex == "NONOTA") && (
                                <div>
                                    <strong>Crew</strong>
                                    <span>{props.titleModal?.busCrewName}</span>
                                </div>
                            )
                        }
                        
                        <div>
                            <strong>Bus</strong>
                            <span>{props.titleModal?.busName}</span>
                        </div>
                    </div>
                    
                    {
                        (props.deposit && props.activeIndex == "NONOTA") && (
                            <div
                            className={styles.container}
                            >
                                <Table
                                headContent={[
                                    {
                                        title: "Counter",
                                        value: props.titleModal?.counterName
                                    },
                                    {
                                        title: "Crew",
                                        value: props.titleModal?.busCrewName
                                    }
                                ]}
                                headExport={[
                                    {
                                        title: "Trayek",
                                        value: 'trajectName'
                                    },
                                    {
                                        title: "Asal",
                                        value: 'originName'
                                    },
                                    {
                                        title: "Tujuan",
                                        value: 'destinationName'
                                    },
                                    {
                                        title: "Rit",
                                        value: 'destinationName'
                                    },
                                    {
                                        title: "Tarif",
                                        value: 'baseFare'
                                    },
                                    {
                                        title: "Total Pnp (Tunai)",
                                        value: 'pnpCash'
                                    },
                                    {
                                        title: "Total Nominal (Tunai)",
                                        value: 'cash'
                                    },
                                    {
                                        title: "Total Pnp (Emoney)",
                                        value: 'pnpEmoney'
                                    },
                                    {
                                        title: "Total Nominal (Emoney)",
                                        value: 'emoney'
                                    },
                                    {
                                        title: "Total Pnp (QRIS)",
                                        value: 'pnpQris'
                                    },
                                    {
                                        title: "Total Nominal (QRIS)",
                                        value: 'pnpQris'
                                    },
                                    {
                                        title: "Total Pnp (Debit)",
                                        value: 'pnpDebit'
                                    },
                                    {
                                        title: "Total Nominal (Debit)",
                                        value: 'debit'
                                    },
                                    {
                                        title: "Total Pnp (Kredit)",
                                        value: 'pnpKredit'
                                    },
                                    {
                                        title: "Total Nominal (Kredit)",
                                        value: 'kredit'
                                    }
                                ]}
                                tableHeaders={__TABLE_HEADERS}
                                columns={__COLUMNS}
                                records={props.deposit.detail || _deposit.detail}
                                insertColumns={__INSERT_COLUMNS}
                                extraLarge
                                />
                            </div>  
                        )
                    }

                    {
                        (props.depositOta && props.activeIndex == "OTA") && (
                            <div
                            className={styles.container}
                            >
                                <Table
                                headExport={[
                                    {
                                        title: "Trayek",
                                        value: 'trajectName'
                                    },
                                    {
                                        title: "Asal",
                                        value: 'originName'
                                    },
                                    {
                                        title: "Tujuan",
                                        value: 'destinationName'
                                    },
                                    {
                                        title: "Rit",
                                        value: 'destinationName'
                                    },
                                    {
                                        title: "Tarif",
                                        value: 'baseFare'
                                    },
                                    {
                                        title: "Tiket",
                                        value: 'ticket'
                                    },
                                    {
                                        title: "Channel",
                                        value: 'payment'
                                    },
                                ]}
                                columns={__COLUMNS_OTA}
                                records={props.depositOta.data}
                                extraLarge
                                />
                            </div>  
                        )
                    }
                </ModalContent>
            </Modal>
        </>
    )

}