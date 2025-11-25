import { useEffect, useState, useContext, forwardRef } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
// import styles from './AccessRoleModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import Label from '../Label'
import { dateFilter } from '../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
}

PublishedTicketModal.defaultProps = defaultProps

export default function PublishedTicketModal(props = defaultProps) {

    const appContext = useContext(AppContext)
    const CONFIG_PARAM = {
        "oldTransactionId": "",
        "newDate": "",
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_startDate, _setStartDate] = useState(new Date())
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_availableSchedule, _setAvailableSchedule] = useState([])
    const [_selectedSchedule, _setSelectedSchedule] = useState(null)
    const [_selectedSeats, _setSelectedSeats] = useState([])
    const [_totalPassenger, _setTotalPassenger] = useState([])

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                title={"Tanggal Keberangkatan"}
                onClick={onClick}
                ref={ref}
                value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    useEffect(() => {

    }, [props.visible])

    useEffect(() => {
        if (props.data?.id) {
            console.log(props.data)
            _updateQuery({
                "oldTransactionId": `${props.data?.id}`,
                "newDate": props.data.tanggal_keberangkatan
            })

            _setStartDate(new Date(props.data.tanggal_keberangkatan))
        }
    }, [props.data])

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _clearForm() {
        _setForm(CONFIG_PARAM)
        _setSelectedSchedule(null)
        _setSelectedSeats([])
        _setTotalPassenger([])
        _setAvailableSchedule([])
    }

    async function _submitData() {
        _setIsProcessing(true)
        try {
            let query = {
                "oldTransactionId": _form.oldTransactionId,
                "selectedSchedule": _selectedSchedule,
                "selectedSeats": _selectedSeats
            }

            delete query.selectedSchedule.availableSeats
            delete query.priceComparison

            const result = await postJSON('/ticket/finalize-regeneration', query, appContext.authData.token)

            if (result) props.closeModal()
            props.onSuccess()
            _clearForm()
            popAlert({ "message": "Berhasil diterbikan ulang tiket", "type": "success" })
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getSchedule() {
        _setIsProcessing(true)
        try {
            const query = {
                oldTransactionId: _form.oldTransactionId,
                newDate: _form.newDate
            }

            const result = await postJSON('/ticket/check-schedule', query, appContext.authData.token)

            if (result) {
                // Handle successful response
                _setAvailableSchedule(result.data.availableSchedules)
                _setTotalPassenger(result.data.transactionData?.transaction_intercity.transaction_intercity_details)
            }

            return result
        } catch (e) {
            popAlert({ message: e.message })
            console.error('Schedule check error:', e)
        } finally {
            _setIsProcessing(false)
        }
    }


    return (
        <Modal
            large
            visible={props.visible}
            centeredContent
        >

            <ModalContent
                header={{
                    title: 'Terbitkan Tiket',
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    }
                }}
            >

                {
                    !_selectedSchedule && (
                        <Row>
                            <Col
                            withPadding
                            >
                                <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    selected={_startDate}
                                    onChange={(date) => {
                                        _setStartDate(date)
                                        _updateQuery({
                                            "newDate": dateFilter.basicDate(date).normal,
                                        })
                                    }}
                                    customInput={
                                        <CustomDatePicker />
                                    }
                                />
                            </Col>

                            <Col
                            withPadding
                            justifyEnd
                            >
                                <Button
                                    title={'Cari Jadwal'}
                                    styles={Button.secondary}
                                    onClick={_getSchedule}
                                    onProcess={_isProcessing}
                                />
                            </Col>
                        </Row>
                    )
                }


                <Row>
                    {(_availableSchedule.length > 0 && !_selectedSchedule) && (
                        <Col>
                            <div style={{ marginTop: '1rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: '#333' }}>Jadwal Bus Tersedia</h4>
                                {Object.entries(_availableSchedule).map(([key, schedule]) => (
                                    <div key={key} style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '1rem',
                                        backgroundColor: '#f9f9f9'
                                    }}>
                                        <Row style={{ marginBottom: '0.5rem' }}>
                                            <strong style={{ color: '#2c5aa0' }}>{schedule.bis}</strong>
                                            <span style={{ marginLeft: '1rem', color: '#666' }}>
                                                {schedule.jenis} - {schedule.format}
                                            </span>
                                        </Row>

                                        <Row style={{ marginBottom: '0.5rem' }}>
                                            <Col>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span><strong>Rute:</strong> {schedule.nm_asal} → {schedule.nm_tujuan}</span>
                                                    <span><strong>Trayek:</strong> {schedule.kd_trayek}</span>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row style={{ marginBottom: '0.5rem' }}>
                                            <Col>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span><strong>Tanggal:</strong> {schedule.tanggal}</span>
                                                    <span><strong>Jam:</strong> {schedule.jam} {schedule.timezone}</span>
                                                    <span><strong>Estimasi:</strong> {schedule.estimasi}</span>
                                                    <span><strong>Durasi:</strong> {schedule.durasi}</span>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row style={{ marginBottom: '0.5rem' }}>
                                            <Col>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span><strong>Harga:</strong> {schedule.kd_uang} {Number(schedule.harga).toLocaleString('id-ID')}</span>
                                                    <span><strong>Total Kursi:</strong> {schedule.jumlah_kursi}</span>
                                                    <span><strong>Kursi Tersedia:</strong>
                                                        <span style={{
                                                            color: schedule.availableSeats?.filter(seat => seat.status === 'free').length > 0 ? '#28a745' : '#dc3545',
                                                            fontWeight: 'bold',
                                                            marginLeft: '0.25rem'
                                                        }}>
                                                            {schedule.availableSeats?.filter(seat => seat.status === 'free').length || 0}
                                                        </span>
                                                    </span>
                                                </div>
                                            </Col>
                                        </Row>

                                        {schedule.priceComparison && (
                                            <Row style={{ marginBottom: '0.5rem' }}>
                                                <Col>
                                                    <div style={{
                                                        padding: '0.5rem',
                                                        backgroundColor: props.data?.harga === schedule.priceComparison.newPrice ? '#d4edda' : '#f8d7da',
                                                        borderRadius: '4px',
                                                        fontSize: '0.9rem',
                                                        display: "flex",
                                                        gap: "1rem"
                                                    }}>
                                                        <strong>Status: </strong> {props.data?.harga === schedule.priceComparison.newPrice ? 'Harga Sesuai' : 'Harga Tidak Sama'}
                                                        {props.data?.harga !== schedule.priceComparison.newPrice && (
                                                            <span style={{ marginLeft: '1rem' }}>
                                                                {schedule.kd_uang} {Number(schedule.priceComparison.oldPrice).toLocaleString('id-ID')} → {schedule.kd_uang} {Number(schedule.priceComparison.newPrice).toLocaleString('id-ID')}
                                                            </span>
                                                        )}

                                                        {
                                                            schedule.bis == _totalPassenger[0].bus_code && (
                                                                <span>Rekomendasi</span>
                                                            )
                                                        }
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}

                                        <Row>
                                            <Col>
                                                <Button
                                                    title={`Pilih Kursi pada ${schedule.bis}`}
                                                    styles={Button.primary}
                                                    onClick={() => {
                                                        _setSelectedSchedule(schedule);
                                                        _setSelectedSeats([]);
                                                    }}
                                                    disabled={schedule.availableSeats?.filter(seat => seat.status === 'free').length === 0}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    )}
                </Row>

                {/* Seat Selection Section */}
                {_selectedSchedule && (
                    <Row>
                        <Col>
                            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: '#333', margin: 0 }}>Pilih Kursi - {_selectedSchedule.bis}</h4>
                                    <Button
                                        title="Kembali ke Jadwal"
                                        styles={Button.secondary}
                                        onClick={() => {
                                            _setSelectedSchedule(null);
                                            _setSelectedSeats([]);
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    <strong>Rute:</strong> {_selectedSchedule.nm_asal} → {_selectedSchedule.nm_tujuan} |
                                    <strong> Tanggal:</strong> {_selectedSchedule.tanggal} |
                                    <strong> Jam:</strong> {_selectedSchedule.jam}
                                </div>
                                
                                {
                                    _totalPassenger.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h5 style={{ marginBottom: '0.5rem', color: '#333' }}>Daftar Penumpang:</h5>
                                            {_totalPassenger?.map((passenger, index) => {
                                                const assignedSeat = _selectedSeats[index];
                                                return (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.5rem',
                                                        marginBottom: '0.25rem',
                                                        backgroundColor: assignedSeat ? '#e8f5e8' : '#fff3cd',
                                                        borderRadius: '4px',
                                                        border: '1px solid ' + (assignedSeat ? '#c3e6c3' : '#ffeaa7')
                                                    }}>
                                                        <span style={{ fontWeight: '500' }}>
                                                            {passenger?.name + ` | Kursi ${passenger?.seat_number}`}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '0.9rem',
                                                            color: assignedSeat ? '#28a745' : '#856404',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {assignedSeat ? `Kursi ${assignedSeat}` : 'Belum dipilih'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                }
                               
                                {/* Passenger Count Info */}
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#fff3cd',
                                    borderRadius: '4px',
                                    marginBottom: '1rem',
                                    fontSize: '0.9rem',
                                    border: '1px solid #ffeaa7'
                                }}>
                                    <strong>Total Penumpang:</strong> {_totalPassenger?.length || 0} |
                                    <strong> Kursi Dipilih:</strong> {_selectedSeats.length} |
                                    <strong> Sisa yang dapat dipilih:</strong> {Math.max(0, (_totalPassenger?.length || 0) - _selectedSeats.length)}
                                </div>

                                {/* Seat Legend */}
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '20px', height: '20px', backgroundColor: '#28a745', borderRadius: '4px' }}></div>
                                        <span>Tersedia</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '20px', height: '20px', backgroundColor: '#007bff', borderRadius: '4px' }}></div>
                                        <span>Dipilih</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '20px', height: '20px', backgroundColor: '#dc3545', borderRadius: '4px' }}></div>
                                        <span>Terisi</span>
                                    </div>
                                </div>

                                {/* Seat Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '8px',
                                    maxWidth: '300px',
                                    margin: '0 auto 1rem auto'
                                }}>
                                    {_selectedSchedule.availableSeats?.map((seat) => {
                                        const isSelected = _selectedSeats.includes(seat.seat);
                                        const isFree = seat.status === 'free';

                                        let backgroundColor = '#dc3545'; // occupied
                                        if (isFree) {
                                            backgroundColor = isSelected ? '#007bff' : '#28a745';
                                        }

                                        return (
                                            <button
                                                key={seat.seat}
                                                onClick={() => {
                                                    if (isFree) {
                                                        if (isSelected) {
                                                            _setSelectedSeats(prev => prev.filter(s => s !== seat.seat));
                                                        } else {
                                                            // Validate that selection doesn't exceed total passenger count
                                                            const totalPassengerCount = _totalPassenger?.length || 0;
                                                            if (_selectedSeats.length >= totalPassengerCount) {
                                                                popAlert({
                                                                    message: `Tidak dapat memilih lebih dari ${totalPassengerCount} kursi sesuai jumlah penumpang`,
                                                                    type: "error"
                                                                });
                                                                return;
                                                            }
                                                            _setSelectedSeats(prev => [...prev, seat.seat]);
                                                        }
                                                    }
                                                }}
                                                disabled={!isFree}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    backgroundColor,
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: isFree ? 'pointer' : 'not-allowed',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                title={isFree ? `Kursi ${seat.seat} - Tersedia` : `Kursi ${seat.seat} - Terisi oleh ${seat.penumpang_nama || 'Penumpang'}`}
                                            >
                                                {seat.seat}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Selected Seats Info */}
                                {_selectedSeats.length > 0 && (
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#e3f2fd',
                                        borderRadius: '4px',
                                        marginBottom: '1rem',
                                        textAlign: 'center'
                                    }}>
                                        <strong>Kursi Dipilih:</strong> {_selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                                        <br />
                                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                            Total: {_selectedSeats.length} kursi × {_selectedSchedule.kd_uang} {Number(_selectedSchedule.harga).toLocaleString('id-ID')} =
                                            {_selectedSchedule.kd_uang} {Number(_selectedSchedule.harga * _selectedSeats.length).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {/* Confirm Selection Button */}
                                <div style={{ textAlign: 'center' }}>
                                    <Button
                                        title={`Konfirmasi Pilihan (${_selectedSeats.length} kursi)`}
                                        styles={Button.primary}
                                        onClick={() => {
                                            _submitData()
                                        }}
                                        disabled={props.data?.jumlah_penumpang != _selectedSeats.length}
                                    />
                                </div>
                            </div>
                        </Col>
                    </Row>
                )}




            </ModalContent>

        </Modal>
    )
}