import { useState, useEffect, useContext } from 'react'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import styles from '../ReportAirportModal/ReportAirportModal.module.scss'
import { dateFilter, currency, paymentProvider } from '../../utils/filters'
import generateClasses from '../../utils/generateClasses'
import { TbRefresh  }  from 'react-icons/tb'
import { postJSON, SETTLEMENT_URL } from '../../api/utils'
import { popAlert } from '../Main'
import Input from '../Input'
import { getLocalStorage, setLocalStorage } from '../../utils/local-storage'
import { writeXLSX, utils, writeFile } from 'xlsx'
import Button from '../Button'
import AppContext from '../../context/app'

ReportZoneModal.defaultProps = {
    visible : false,
    closeModal : null,
    rowInfo : {},
    report: [],
    date: {},
    typeTransaction: {}
}

export default function ReportZoneModal(props = ReportZoneModal.defaultProps) {

    const appContext = useContext(AppContext)

    const [_search, _setSearch] = useState("")
    const [_summary, _setSummary] = useState({
        totalPnp: 0,
        totalAmount : 0,
        repeatTicket: 0,
        emoney: 0,
        debit: 0,
        credit: 0,
        cash: 0,
        QRIS: 0,
        kredit: 0,
        EDCBankBNI: 0,
        EDCBankMandiri: 0,
        EDCBankBCA: 0,
        EDCBankBRI: 0,
        EDCBankBTN: 0,
        Indomaret: 0,
        Gopay: 0,
    })
    const [_defaultReport, _setDefaultReport] = useState([])
    const [_report, _setReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {

        if(props.report?.data){
            _setReport(props.report.data)

            let totalAmount, totalPnp
            let data = props.report.data

            totalAmount = 0
            totalPnp = 0
                  
            if (data.length > 0) {

                let payment = {
                    emoney: 0,
                    credit: 0,
                    debit: 0,
                    credit: 0,
                    QRIS: 0,
                    cash: 0,
                    kredit: 0,
                    EDCBankBNI: 0,
                    EDCBankMandiri: 0,
                    EDCBankBCA: 0,
                    EDCBankBRI: 0,
                    EDCBankBTN: 0,
                    Indomaret: 0,
                    Gopay: 0,
                    Cash: 0,
                }
            
                data.forEach(item => {
                    totalAmount += item.amount_total
                    totalPnp += item.jumlah_penumpang
                    payment[item.metode_pembayaran.replace(/\s/g, '')] += item.amount_total

        
                })

                _setSummary({
                    totalPnp,
                    totalAmount,
                    ...payment
                })
            }
        }

    }, [props.report])


    useEffect(() => {
        if(_search != ""){
            if(_defaultReport.length == 0){
                _setDefaultReport(_report)
            }

            let suggestions = [..._report].filter(suggestion => 
                suggestion.kode_booking != null ? suggestion.kode_booking.toLowerCase().includes(_search.toLowerCase()) : ""
            )

            if(suggestions.length > 0){
                _setReport(suggestions)
            }

        }else{
            _setReport(_defaultReport)
        }
    }, [_search])

    async function _getAllChannelReport(){

        _setIsProcessing(true)

        let params = {
            companyId : appContext.authData.companyId,
            startDate: props.date?.start,
            endDate: props.date?.end,
            typeTransaction: props.typeTransaction?.value,
            branchId: props.rowInfo?.branchId,
            typeReport: "CSV"
        }

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/zonasi/detail/list`, params, appContext.authData.token, true)
           
            _downloadCsv(res, `Laporan-transaksi-zonasi-${props.rowInfo?.branchName}-${props.date?.start}-s.d-${props.date?.end}.csv`);
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    function _downloadCsv(data, fileName){
        let template = document.createElement('template')
        let tableExport = "<table>"

        data = data.split("\n")

        data.forEach(function(val, key){
            let row = val.split(",")

            if(row[row.length-7] == "null"){
                row[row.length-7] = "Damri Apps"
            }

            row[row.length-2] = ""
            row[row.length-1] = ""

            tableExport += "<tr>"
                
            row.forEach(function(i, j){
                tableExport += "<td>"+i+"</td>"
            })

            tableExport += "</tr>"

        })

        tableExport += "</table>"
        template.innerHTML = tableExport

        const wb = utils.table_to_book(template.content.firstChild)
        return writeFile(wb, `${fileName.replace(".csv", "")}.xlsx`)
    }


    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : ``,
                closeModal : props.closeModal
            }}
            >   
                <Row>
                    
                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Total Penumpang</span>
                            <strong>{currency(_summary.totalPnp)}</strong>    
                        </div> 
                    </Col>

                   
                </Row>

                <Row>
                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Debit</span>
                            <strong>{currency(_summary.debit, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Kredit</span>
                            <strong>{currency((_summary.credit+_summary.kredit), 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>QRIS</span>
                            <strong>{currency(_summary.QRIS, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Indomaret</span>
                            <strong>{currency(_summary.Indomaret, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Gopay</span>
                            <strong>{currency(_summary.Gopay, 'Rp')}</strong>    
                        </div> 
                    </Col>
                </Row>

                <Row>
                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Cash</span>
                            <strong>{currency(_summary.Cash + _summary.cash, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BRI</span>
                            <strong>{currency((_summary.EDCBankBRI), 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank Mandiri</span>
                            <strong>{currency(_summary.EDCBankMandiri, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BCA</span>
                            <strong>{currency(_summary.EDCBankBCA, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>EDC Bank BTN</span>
                            <strong>{currency(_summary.EDCBankBTN, 'Rp')}</strong>    
                        </div> 
                    </Col>

                    <Col
                    column={1}
                    withPadding
                    className={styles.detail_modal}
                    >
                        <div>
                            <span>Total Penjualan</span>
                            <strong>{currency(_summary.totalAmount, 'Rp')}</strong>    
                        </div> 
                    </Col>
                </Row>

                <Table
                exportToXls={false}
                fileName={"Penjualan-zonasi-tgl-"+props.date?.start+"-"+props.date?.end}
                headerContent={(
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={2}
                        withPadding
                        mobileFullWidth
                        >
                            <Input
                            title={`Cari kode booking`}
                            value={_search}
                            onChange={ticket => {
                                _setSearch(ticket)
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        withPadding
                        >
                            <Button
                            onProcess={_isProcessing}
                            title={'Export'}
                            styles={Button.secondary}
                            onClick={() => {
                                _getAllChannelReport()
                            }}
                            />
                        </Col>
                    </Row>
                )}
                columns={[
                    {
                        field : 'tanggal_pembelian',
                        title : 'Tanggal',
                        customCell : (value) => dateFilter.convertISO(new Date(value), "date")
                    },
                    {
                        field : 'kode_trayek',
                        title : 'Kode Trayek',
                    },
                    {
                        field : 'asal',
                        title : 'Asal',
                        textAlign: 'left',
                        customCell : (value) => {
                            return value || '-'
                        }
                    },
                    {
                        field : 'tujuan',
                        title : 'Tujuan',
                        textAlign: 'left'
                    },
                    {
                        field : 'kode_booking',
                        title : 'Kode Booking',
                        textAlign: 'left',
                        headCol: {
                            backgroundColor: "#fff",
                            position: "sticky",
                            left: "0px",
                            zIndex: "100",
                        },
                        style: {
                            backgroundColor: "#fff",
                            position: "sticky",
                            left: "0px",
                            zIndex: "100",
                        },
                    },
                    {
                        field : 'segmen',
                        title : 'Segmentasi',
                        textAlign: 'left',
                    },
                    {   //beforeChange baseFare
                        field : 'harga',
                        title : 'Harga Tiket (Rp)',
                        customCell : (value) => currency(value),
                        textAlign: 'right'
                    },
                    {
                        field : 'metode_pembayaran',
                        title : 'Metode Bayar'
                    },
                    {
                        field : 'jumlah_penumpang',
                        title : 'Penumpang',
                    },
                    {
                        field : 'void_status',
                        title : 'Void',
                        textAlign: 'left',
                    },
                    {
                        field : 'tanggal_keberangkatan',
                        title : 'Tanggal Keberangkatan',
                        customCell : (value, row) => {
                            if(value != null){
                                const date = new Date(value)
                                return dateFilter.getMonthDate(date) + " "+ row.jam_keberangkatan
                            }else{
                                return ''
                            }
                        }
                    },
                    {
                        field : 'nama_promosi',
                        title : 'Promo',
                    }
                ]}
                records={_report}
                />

                {
                    !_report && (
                        <div
                        style={{
                            "text-align": "center"
                        }}
                        >
                            <span>Memuat data..</span>
                        </div>
                    ) 
                }
                
                  
            </ModalContent>
        </Modal>
    )

}