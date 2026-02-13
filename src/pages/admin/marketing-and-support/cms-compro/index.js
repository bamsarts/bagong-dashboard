import { useState, useEffect } from 'react'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Row, Col } from '../../../../components/Layout'
import Input from '../../../../components/Input'
import { AiFillEdit, AiFillDelete, AiOutlinePlus } from 'react-icons/ai'
import ActivityIndicator from '../../../../components/ActivityIndicator'
import { BUCKET } from '../../../../api/utils'

export default function CMSCompro(props) {
    const [_busData, _setBusData] = useState([])
    const [_loading, _setLoading] = useState(true)
    const [_saving, _setSaving] = useState(false)
    const [_editIndex, _setEditIndex] = useState(null)
    const [_form, _setForm] = useState({ title: '', image: '', description: '' })
    const [_uploadProgress, _setUploadProgress] = useState(0)

    useEffect(() => {
        _loadBusData()
    }, [])

    async function _loadBusData() {
        try {
            const response = await fetch(`${BUCKET}/bus-info.json?t=${Date.now()}`)
            const data = await response.json()
            _setBusData(data.buses || [])
        } catch (e) {
            _setBusData([])
        } finally {
            _setLoading(false)
        }
    }

    async function _handleImageUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'bus-info')

        try {
            _setUploadProgress(10)
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            _setUploadProgress(90)
            const result = await response.json()

            if (result.key) {
                const imageUrl = `${BUCKET}${result.key}`
                _setForm({ ..._form, image: imageUrl })
                popAlert({ message: 'Gambar berhasil diupload', type: 'success' })
            }
        } catch (e) {
            popAlert({ message: 'Gagal upload gambar: ' + e.message })
        } finally {
            _setUploadProgress(0)
        }
    }

    async function _saveBusData() {
        if (!_form.title || !_form.image) {
            popAlert({ message: 'Judul dan gambar wajib diisi' })
            return
        }

        _setSaving(true)

        try {
            let newBusData = [..._busData]

            if (_editIndex !== null) {
                newBusData[_editIndex] = _form
            } else {
                newBusData.push(_form)
            }

            const jsonData = { buses: newBusData }

            const response = await fetch('/api/bus-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData)
            })

            const result = await response.json()

            if (response.ok) {
                _setBusData(newBusData)
                _setForm({ title: '', image: '', description: '' })
                _setEditIndex(null)
                popAlert({ message: 'Data berhasil disimpan', type: 'success' })
            } else {
                throw new Error(result.error || 'Gagal menyimpan')
            }
        } catch (e) {
            popAlert({ message: 'Gagal menyimpan: ' + e.message })
        } finally {
            _setSaving(false)
        }
    }

    async function _deleteBus(index) {
        if (!confirm('Yakin ingin menghapus bus ini?')) return

        _setSaving(true)

        try {
            const newBusData = _busData.filter((_, i) => i !== index)
            const jsonData = { buses: newBusData }

            const response = await fetch('/api/bus-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData)
            })

            if (response.ok) {
                _setBusData(newBusData)
                popAlert({ message: 'Bus berhasil dihapus', type: 'success' })
            }
        } catch (e) {
            popAlert({ message: 'Gagal menghapus: ' + e.message })
        } finally {
            _setSaving(false)
        }
    }

    function _editBus(index) {
        _setEditIndex(index)
        _setForm(_busData[index])
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function _cancelEdit() {
        _setEditIndex(null)
        _setForm({ title: '', image: '', description: '' })
    }

    return (
        <Main>
            <AdminLayout>
                    

                    <Card style={{ backgroundColor: '#f9f9f9', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                            {_editIndex !== null ? 'Edit Bus' : 'Tambah Bus Baru'}
                        </h3>

                        <Row>
                            <Col column={2} withPadding>
                                <Input
                                    title="Judul Bus"
                                    placeholder="Contoh: Bus Executive"
                                    value={_form.title}
                                    onChange={(value) => _setForm({ ..._form, title: value })}
                                />
                            </Col>
                            <Col column={2} withPadding>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Gambar Bus
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={_handleImageUpload}
                                />
                                {_uploadProgress > 0 && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                        Uploading... {_uploadProgress}%
                                    </div>
                                )}
                            </Col>
                        </Row>

                        <Row>
                            <Col column={6} withPadding>
                                <Input
                                    type={"text"}
                                    multiline={3}
                                    title="Deskripsi (Opsional)"
                                    placeholder="Deskripsi singkat tentang bus"
                                    value={_form.description}
                                    onChange={(value) => _setForm({ ..._form, description: value })}
                                />
                            </Col>
                        </Row>

                        {_form.image && (
                            <Row>
                                <Col column={1} withPadding>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Preview Gambar
                                    </label>
                                    <img
                                        src={_form.image}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '300px',
                                            height: 'auto',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </Col>
                            </Row>
                        )}

                        <Row>
                            <Col column={1} withPadding>
                                <Button
                                    title={_editIndex !== null ? 'Update Bus' : 'Tambah Bus'}
                                    styles={Button.primary}
                                    onClick={_saveBusData}
                                    disabled={_saving}
                                    icon={_editIndex !== null ? <AiFillEdit /> : <AiOutlinePlus />}
                                />
                                {_editIndex !== null && (
                                    <Button
                                        title="Batal"
                                        styles={Button.secondary}
                                        onClick={_cancelEdit}
                                        style={{ marginLeft: '10px' }}
                                    />
                                )}
                            </Col>
                        </Row>
                    </Card>

                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                        Daftar Bus ({_busData.length})
                    </h3>

                    {_loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <ActivityIndicator />
                        </div>
                    ) : (
                        <Row>
                            {_busData.map((bus, index) => (
                                <Col key={index} column={3} withPadding>
                                    <Card style={{ position: 'relative' }}>
                                        <img
                                            src={bus.image}
                                            alt={bus.title}
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                marginBottom: '10px'
                                            }}
                                        />
                                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
                                            {bus.title}
                                        </h4>
                                        {bus.description && (
                                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                                {bus.description}
                                            </p>
                                        )}
                                        <Row>
                                            <Button
                                                title="Edit"
                                                icon={<AiFillEdit />}
                                                small
                                                onClick={() => _editBus(index)}
                                                style={{ marginRight: '5px' }}
                                            />
                                            <Button
                                                title="Hapus"
                                                icon={<AiFillDelete />}
                                                small
                                                styles={Button.danger}
                                                onClick={() => _deleteBus(index)}
                                            />
                                        </Row>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {!_loading && _busData.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#999',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px'
                        }}>
                            <p>Belum ada data bus. Tambahkan bus pertama Anda!</p>
                        </div>
                    )}
            </AdminLayout>
        </Main>
    )
}
