import { useEffect, useState } from 'react'

import Head from 'next/head'

import { QRCode } from 'react-qrcode-logo'

import { API_ENDPOINT, get } from '../../../../api/utils'
import { auth, redirect } from '../../../../utils/server-side-auth'

import Button from '../../../../components/Button'

import styles from './ticket.module.scss'
import { currency, dateFilter } from '../../../../utils/filters'
import { Router, useRouter } from 'next/router'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'

export default function Ticket(props) {

    const { transaction, user } = props
    const router = useRouter()
    const [_transactionDetail, _setTransactionDetail] = useState({})

    useEffect(() => {
        console.log("ts")
        console.log(props)

        if(!transaction?.transactionDetail){
            _getLocalTransaction()
        }else{
            _setTransactionDetail(transaction)
        }
    }, [])

    async function _getLocalTransaction(){
        let storage = getLocalStorage("ticket_damri")

        if(storage == null){
            // window.location.href = "/admin/report/deposit/akap/passenger"

            _setTransactionDetail({
                "originName": "faf",
                "destinationName": "faf",
                "departureDate": "sfaf",
                "departureTime": "fsaf",
                "busCode": "fsaf",
                "busCategoryName":"fasf",
                "seatNumber": "fsaf",
                "finalAmount": 214,
                "email": "faf@asf.fsaf",
                "transactionDetail": [{
                    "partnerTicket": "4214",
                    "trajectCode": "faf",
                    "departureDate": "fafaf"
                }]
            })
        }else{
            storage = JSON.parse(storage)
            console.log(storage)
            let data = [{
                "partnerTicket": storage.ticket,
                "trajectCode": storage.trajectCode,
                "departureDate": storage.departureDate
            }]
            
            _setTransactionDetail({
                "originName": storage.traject.split("-")[0],
                "destinationName": storage.traject.split("-")[1],
                "departureDate": storage.departureDate,
                "departureTime": storage.bus.split("|")[2],
                "busCode": storage.bus.split("|")[0],
                "busCategoryName": storage.bus.split("|")[1],
                "seatNumber": storage.seatNumber,
                "finalAmount": storage.baseFare.replace(".00", ""),
                "email": storage.email,
                "transactionDetail": data
            })
            
        }
    }

    const NOTES = [
        'Ketentuan :',
        'Harga Tiket termasuk asuransi Jasa Raharja',
        'Tiket ini berlaku untuk satu orang dan satu kali perjalanan',
        'Reschedule tiket dapat dilakukan 6 jam sebelum keberangkatan dengan denda sebesar 10% dari harga tiket',
        'Pembatalan tiket dapat dilakukan 6 jam sebelum keberangkatan dengan denda sebesar 25% dari harga tiket dan dicairkan maksimal tiga minggu',
        'Barang bawaan diatas 20 kg akan dikenakan biaya',
        'Dilarang membawa hewan peliharaan',
        'Penumpang bertanggung jawab atas barang bawaan sendiri',
        'Pemilik tiket mengetahui dan menyetujui persyaratan ini',
    ]

    const COMMUTER_NOTES = [
        'Tiket hilang, rusak, tertukar risiko penumpang',
        'Barang hilang, rusak, tertukar risiko penumpang',
        'Tiket yang sudah dibeli tidak dapat dikembalikan',
        'Tiket hanya berlaku 1 kali perjalanan',
        'Hello Damri : 1500825'
    ]

    return (
        <>
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width, maximum-scale=1, user-scalable=yes" />
                <meta name="description" content="Bisku"/>
                <link rel="shortcut icon" href="/assets/logo/favicon.png" type="image/x-icon"></link>
                <title>Damri Dashboard</title>
            </Head>
            <div
            className={styles.page_action}
            >
                <Button
                title={'Cetak Tiket'}
                onClick={() => print()}
                />
            </div>
            {
                _transactionDetail?.transactionDetail && (

                    _transactionDetail.transactionDetail.map((ticket, key) => {

                        const passenger = [
                            {
                                title : 'Nama',
                                value : ticket.name
                            },
                            {
                                title : 'Asal',
                                value : _transactionDetail.originName
                            },
                            {
                                title : 'Tujuan',
                                value : _transactionDetail.destinationName
                            },
                            {
                                title : 'Tanggal',
                                value : dateFilter.getFullDate(new Date(_transactionDetail.departureDate))
                            },
                            {
                                title : 'Jam',
                                value : _transactionDetail.departureTime ? _transactionDetail.departureTime + ' ' + ' WIB' : ''
                            },
                            {
                                title : 'Bis',
                                value : (_transactionDetail.busCode ? _transactionDetail.busCode + ' | ' : '') + (_transactionDetail?.busCategoryName)
                            },
                            {
                                title : 'Kursi',
                                value : ticket.seatNumber
                            },
                            {
                                title : 'Harga',
                                value : currency(_transactionDetail.finalAmount || _transactionDetail.amount, 'Rp ')
                            },
                            {
                                title : 'Petugas',
                                value : _transactionDetail?.email || router.query?.source || user?.name || "Loket"
                            },
                            {
                                title : 'Pembayaran',
                                value : props.transaction.paymentLabel + (props.transaction?.issuer ? " - " +props.transaction.issuer : '')
                            },
                            {
                                title : 'Catatan',
                                value : _transactionDetail?.note
                            },
                        ]

                        return (
                            <div
                            key={key}
                            >
                                <div
                                className={styles.page}
                                >
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td
                                                align={'center'}
                                                >
                                                    <img
                                                    src={'/assets/logo/damri-BW.png'}
                                                    style={{
                                                        width : '80%',
                                                    }}
                                                    />

                                                    <QRCode
                                                    value={`${ticket.partnerTicket}`}
                                                    ecLevel={'H'}
                                                    logoWidth={30}
                                                    logoHeight={30}
                                                    fgColor={'#000'}
                                                    removeQrCodeBehindLogo={true}
                                                    style={{
                                                        marginBottom : '1rem',
                                                    }}
                                                    />

                                                    <br/>
                                                    
                                                    <p
                                                    style={{
                                                        fontSize: "1.1rem"
                                                    }}
                                                    >
                                                        {ticket.partnerTicket}
                                                    </p>
                                                    <b
                                                    style={{
                                                        fontSize: "1.1rem"
                                                    }}
                                                    >
                                                        {_transactionDetail.trajectCode}
                                                    </b>
                                                    <br/>
                                                    <small
                                                    style={{
                                                        fontSize: ".9rem"
                                                    }}
                                                    >
                                                        {dateFilter.getFullDate(new Date(_transactionDetail.departureDate))}
                                                    </small>
                                                    <br/>
                                                    <br/>
                                                </td>    
                                            </tr>    
                                        </tbody>    
                                    </table>
                                    <table>
                                        <tbody>
                                            {
                                                passenger.map((data, key2) => {
                                                    console.log(data)
                                                    if (data.value) {
                                                        return (
                                                            <tr
                                                            key={key2}
                                                            >
                                                                <td
                                                                width={'31%'}
                                                                style={{
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                >
                                                                    <small>
                                                                        {data.title}
                                                                    </small>
                                                                </td>
                                                                <td
                                                                width={'5%'}
                                                                style={{
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                >
                                                                    :
                                                                </td>
                                                                <td
                                                                width={'64%'}
                                                                style={{
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                >
                                                                    <small>
                                                                        {data.value}
                                                                    </small>
                                                                </td>
                                                            </tr>
                                                        )
                                                    }
                                                })
                                            }
                                        </tbody>    
                                    </table>
                                    <br/>
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div
                                                    style={{
                                                        width : '100%',
                                                        borderBottom : '1px dashed',
                                                        textAlign : 'right',
                                                        paddingBottom : '.75rem',
                                                        position : 'relative'
                                                    }}
                                                    >
                                                        <div
                                                        style={{
                                                            width : '100%',
                                                            textAlign : 'center',
                                                            padding : '.1rem',
                                                            position : 'absolute',
                                                            bottom : -10,
                                                            zIndex : 100
                                                        }}
                                                        >
                                                            <small
                                                            style={{
                                                                backgroundColor : 'white',
                                                                fontSize : '.85rem',
                                                                padding : 7
                                                            }}
                                                            >
                                                                &#9986; Potong di sini &#9986;
                                                            </small>
                                                        </div>
                                                        <small
                                                        style={{
                                                            fontSize : '.75rem',
                                                            // margin: '1rem'
                                                        }}
                                                        >
                                                            <i>
                                                                Lembar Petugas
                                                            </i>
                                                        </small>
                                                    </div>
                                                    <br/>
                                                    <div
                                                    style={{
                                                        textAlign : 'right'
                                                    }}
                                                    >
                                                        <small
                                                        style={{
                                                            fontSize : '.75rem'
                                                        }}
                                                        >
                                                            <i>
                                                                Lembar Penumpang
                                                            </i>
                                                        </small>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td
                                                align={'center'}
                                                >
                                                    <img
                                                    src={'/assets/logo/damri-BW.png'}
                                                    style={{
                                                        width : '80%',
                                                    }}
                                                    />
                                                    <br/>
                                                    <p
                                                    style={{
                                                        fontSize: "1.1rem"
                                                    }}
                                                    >
                                                        {ticket.partnerTicket}
                                                    </p>
                                                    <b
                                                    style={{
                                                        fontSize: "1.1rem"
                                                    }}
                                                    >
                                                        {_transactionDetail.trajectCode}
                                                    </b>
                                                    <br/>
                                                    <small
                                                    style={{
                                                        fontSize: ".9rem"
                                                    }}
                                                    >
                                                        {dateFilter.getFullDate(new Date(_transactionDetail.departureDate))}
                                                    </small>
                                                    <br/>
                                                    <br/>
                                                </td>    
                                            </tr>    
                                        </tbody>    
                                    </table>
                                    <table>
                                        <tbody>
                                            {
                                                passenger.map((data, key2) => {
                                                    if (data.value && data.title != "Pembayaran") {
                                                        return (
                                                            <tr
                                                            key={key2}
                                                            >
                                                                <td
                                                                width={'30%'}
                                                                style={{
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                >
                                                                    <small>
                                                                        {data.title}
                                                                    </small>
                                                                </td>
                                                                <td
                                                                width={'5%'}
                                                                style={{
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                >
                                                                    :
                                                                </td>
                                                                <td
                                                                width={'65%'}
                                                                style={{
                                                                    fontSize: '1.1rem'
                                                                }}
                                                                >
                                                                    <small>
                                                                        {data.value}
                                                                    </small>
                                                                </td>
                                                            </tr>
                                                        )
                                                    }
                                                })
                                            }
                                        </tbody>    
                                    </table>
                                    <br/>
                                    {
                                        (props.query.includes('INTERCITY')) && (
                                            <table
                                            cellPadding={0}
                                            cellSpacing={0}
                                            >
                                                <tbody>
                                                    {
                                                        NOTES.map((note, key3) => {
                                                            return (
                                                                <tr
                                                                key={key3}
                                                                >
                                                                    <td
                                                                    style={{
                                                                        fontSize : '10px',
                                                                    }}
                                                                    >
                                                                        {note}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    }
                                                    <tr>
                                                        <td
                                                        style={{
                                                            fontSize : '11px',
                                                            fontWeight : 'bold'
                                                        }}
                                                        >
                                                            Siap di tempat satu jam sebelum keberangkatan
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        )
                                    }

                                    {
                                        (props.query.includes('COMMUTER')) && (
                                            <table
                                            cellPadding={0}
                                            cellSpacing={0}
                                            >
                                                <tbody>
                                                    {
                                                        COMMUTER_NOTES.map((note, key3) => {
                                                            return (
                                                                <tr
                                                                key={key3}
                                                                >
                                                                    <td
                                                                    style={{
                                                                        fontSize : '12px',
                                                                    }}
                                                                    >
                                                                        {note}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                        )
                                    }
                                    <br/>
                                    <br/>
                                </div>
                                {
                                    (key < _transactionDetail.length - 1) && (
                                        <div
                                        className={styles.page_break}
                                        />
                                    )
                                }
                            </div>
                        )
                    })

                )
            }
        </>
    )

}

export async function getServerSideProps(ctx) {
    const token = auth(ctx)
    let transaction = {}
    let user = {}
    let query

    console.log(ctx)
    if(!ctx.query?.src){
        try {
            query = ctx.params['type*id'].replace('*', '/')
            const result = await get({ url : API_ENDPOINT.ticketOrder + '/dashboard/transaction/' + query }, token)
            if (result.data) transaction = result.data
        } catch (e) {
            return redirect('/')
        }
    }else{
        query = ctx.params['type*id'].replace('*', '/')
    }
   
    try {
        const result = await get({ url : API_ENDPOINT.ticketOrder + '/user/profile' }, token)
        if (result.data) user = result.data
    } catch (e) {}
    
    return {
      props : {
        transaction,
        user,
        query,
      }
    }
}

