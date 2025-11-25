import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import Datepicker from '../Datepicker'
import { dateFilter, currency } from '../../utils/filters'
import { Col, Row } from '../Layout'

const defaultProps = {
    visible : false,
    closeModal : null,
    data: {}
}

OccupancyModal.defaultProps = defaultProps

export default function OccupancyModal(props = defaultProps) {

   
    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: "Notifikasi Okupansi",
                closeModal: props.closeModal
            }}
            >
                {

                    props.data.length > 0 && (
                        props.data.map((val, key) => {
                            return (
                                <>
                                    <Row
                                    style={{
                                        margin: "1rem 0rem"
                                    }}
                                    spaceBetween
                                    >
                                        <Col>
                                            <span>Rute {val.traject_code}</span>
                                            <div>
                                                <small>{val?.bus_category_name}</small> 
                                                <small> | {val?.bus_code}</small>
                                                <small> | {val?.bus_category_format}</small>  
                                            </div>
                                        </Col>
                                        <Col
                                        alignEnd
                                        >
                                          <span> {dateFilter.getMonthDate(new Date(val.departure_date))}</span>
                                          <small>{val?.departure_time}</small>
                                        </Col>
                                    </Row>
                                    <div
                                    key={key} 
                                    style={{ width: '100%', background: '#eee', borderRadius: '8px', height: '16px', margin: '16px 0' }}>
                                        <div
                                        style={{
                                            width: `${val.occupancy || 0}%`,
                                            background: '#4caf50',
                                            height: '100%',
                                            borderRadius: '8px',
                                            transition: 'width 0.3s ease'
                                        }}
                                        />
                                    </div>
    
                                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
                                        Mencapai {val.occupancy || 0}% kursi terisi
                                    </div>
                                </>
                            )
                        })
                    )
                   
                }
               
                
            </ModalContent>
        </Modal>
    )
}
