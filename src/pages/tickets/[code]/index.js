import { postJSON } from '../../../api/utils'
import { Col, Row } from '../../../components/Layout'
import styles from './Code.module.scss'
import { dateFilter } from '../../../utils/filters'

async function _validateTicket(_ticketNumber) {

  let parsedTicket = _ticketNumber.split("/tickets/")

  if(parsedTicket.length > 1){
    parsedTicket = parsedTicket[1]
  }else{
    parsedTicket = parsedTicket[0]
  }

  try {
    const res = await postJSON('/public/ticket/v2/detail', { ticket : parsedTicket })
    return res
  } catch (e) {
      return e
  } finally {
     
  }
}

export async function getServerSideProps(ctx) {
  console.log(ctx.query)
  const isSuccess = await _validateTicket(ctx.query.code)
  let icon = "check.png"
  let status = true
  if(isSuccess.status == "ERROR" || isSuccess.status == "EROR"){
    icon = "delete.png"
    status = false
  }

  return {
    props : {
      "data": isSuccess,
      "icon": icon,
      "ticket": ctx.query.code,
      "status": status 
    }
  }
}

export default function Ticket(props){

  const PAYMENTS = [
    "","Gopay","Virtual Account","QRIS","e-money",
    "Debit","Kredit","Akulaku","OVO","Shopee Pay",
    "Link Aja","Tunai"
  ]

  return (

      <div
      className={styles.container}
      >
        <img
        className={styles.logo}
        src={'/assets/logo/damri.png'}
        />

        <div
        className={styles.mt_1}
        >

        <img
          className={styles.check}
          src={`/assets/icons/${props.icon}`}
          />
        </div>
        
        <div
        className={styles.mb_1}
        >
          <span>{!props.status ? 'Tidak Terverifikasi' : 'Terverifikasi'}</span>
        </div>

        <Row
        style={{
          "text-align": "left",
          "margin": "1rem"
        }}
        >
          <Col
          column={1}
          >
            <strong>No Tiket</strong>
          </Col>
          <Col
          column={2}
          style={{
            "margin-left": "1rem"
          }}
          >
            <span>{props.ticket}</span>
          </Col>
        </Row>

        {
          props.data.data?.kd_tiket && (
            <div>

              <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Kode Tiket</strong>
                </Col>
                <Col
                column={2}
                style={{
                  "margin-left": "1rem"
                }}
                >
                  <span>{props.data.data?.kd_tiket}</span>
                </Col>
              </Row>

               
              <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Nama</strong>
                </Col>
                <Col
                column={2}
                style={{
                  "margin-left": "1rem"
                }}
                >
                  <span>{props.data.data.nama == "" ? '-' : props.data.data.name}</span>
                </Col>
              </Row>

              {/* <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>No Telepon</strong>
                </Col>
                <Col
                column={2}
                style={{
                  "margin-left": "1rem"
                }}
                >
                  <span>{props.data.data.phoneNumber == null ? '-' : props.data.data.phoneNumber}</span>
                </Col>
              </Row> */}

            {/* <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Trayek</strong>
                </Col>
                <Col
                column={2}
                style={{
                  "margin-left": "1rem"
                }}
                >
                  <span>{props.data.data.trajectName}</span>
                </Col>
              </Row> */}

              <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Dari</strong>
                </Col>
                <Col
                column={2}
                style={{
                  "margin-left": "1rem"
                }}
                >
                  <span>{props.data.data.nm_asal}</span>
                </Col>
              </Row>

              <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Tujuan</strong>
                </Col>
                <Col
                style={{
                  "margin-left": "1rem"
                }}
                column={2}
                >
                  <span>{props.data.data.nm_tujuan}</span>
                </Col>
              </Row>

              <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Pembayaran</strong>
                </Col>
                <Col
                style={{
                  "margin-left": "1rem"
                }}
                column={2}
                >
                  <span>
                    {
                      props.data.data.pay <= PAYMENTS.length && (
                        PAYMENTS[props.data.data.pay]
                      )
                    }
                  </span>
                </Col>
              </Row>

              <Row
              style={{
                "text-align": "left",
                "margin": "1rem"
              }}
              >
                <Col
                column={1}
                >
                  <strong>Tgl Berangkat</strong>
                </Col>
                <Col
                style={{
                  "margin-left": "1rem"
                }}
                column={2}
                >
                  <span>{dateFilter.getMonthDate(new Date(props.data.data.tanggal ))}</span>
                </Col>
              </Row>

             

        
            </div>
    
          )
        }

        
      </div>
  )  
}