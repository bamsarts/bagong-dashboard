import { useEffect, useState, useContext, forwardRef } from 'react'
import { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignmentModal.module.scss'
import Button from '../Button'
import { BASE_URL, get, objectToParams, postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { dateFilter } from '../../utils/filters'
import { Col, Row } from '../Layout'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Table from '../Table'
import SelectFloating from '../SelectFloating'

/* ================= DEFAULT ================= */

const defaultProps = {
  visible: false,
  closeModal: () => {},
  onSuccess: null
}

/* ================= HELPERS ================= */

function buildGroupedRecords(source) {
  const result = []
  if (!source?.data?.length) return result

  // ✅ hitung sequence terkecil tiap group
  const groups = source.data.map(group => {
    let minSequence = Infinity

    group.templates.forEach(item => {
      const seq = Number(item.sequence)
      if (!isNaN(seq) && seq < minSequence) {
        minSequence = seq
      }
    })

    return {
      ...group,
      minSequence
    }
  })

  // ✅ urutkan group berdasarkan sequence bus
  groups.sort((a, b) => a.minSequence - b.minSequence)

  groups.forEach(group => {
    result.push({
      __type: 'GROUP',
      title: group.group_key_display || group.group_key
    })

    const map = {}

    group.templates.forEach(item => {
      const key = `${item.bus_id}|${item.group_ritase}`

      if (!map[key]) {
        map[key] = {
          bus_id: item.bus_id,
          bus: item.bus_name,
          group_ritase: item.group_ritase,
          sequence: Number(item.sequence),
          ritaseJamMap: {},
          items: []
        }
      }

      if (item.schedule_id && item.ritase) {
        map[key].items.push({
          scheduleAssignId: item.schedule_id,
          ritase: item.ritase,
          departure_time: item.departure_time
        })
      }

      if (item.ritase && item.departure_time) {
        map[key].ritaseJamMap[item.ritase] =
          item.departure_time.slice(0, 5)
      }
    })

    const rows = Object.values(map)

    // ✅ urutkan bus berdasarkan sequence
    rows.sort((a, b) => a.sequence - b.sequence)

    rows.forEach(row => {
      // ⬅️ tetap gunakan urutan group_ritase (tidak diubah)
      const ritaseOrder = row.group_ritase
        .split('&')
        .map(r => r.trim())

      const jamOrdered = ritaseOrder
        .map(r => row.ritaseJamMap[r])
        .filter(Boolean)

      result.push({
        __type: 'ROW',
        bus_id: row.bus_id,
        bus: row.bus,
        bus_inap: group.group_key,
        sequence: row.sequence,
        group_ritase: row.group_ritase,
        departure_time: jamOrdered.join(' & '),
        items: row.items
      })
    })
  })

  return result
}


function rowKey(row) {
  if (row.__type !== 'ROW') return null
  return `${row.bus_id}|${row.group_ritase}`
}

/* ================= COMPONENT ================= */

export default function AssignmentModal(props = defaultProps) {
  const { authData } = useContext(AppContext)
  const appContext = useContext(AppContext)

  const [_records, _setRecords] = useState([])
  const [_loading, _setLoading] = useState(false)

  const [_driverRanges, _setDriverRanges] = useState([])
  const [_kondekturRanges, _setKondekturRanges] = useState([])
  const [_kernetRanges, _setKernetRanges] = useState([])
  const [_busRanges, _setBusRanges] = useState([])

  const [_trajectRange, _setTrajectRange] = useState([])
  const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
  const [_selectedTraject, _setSelectedTraject] = useState(null)

  const [_crewInput, _setCrewInput] = useState({})
  const [_selectedDate, _setSelectedDate] = useState(getTomorrow())

  /* ================= DATE PICKER ================= */

  const CustomDatePicker = forwardRef(({ onClick }, ref) => (
    <Input
      title="Tanggal"
      onClick={onClick}
      ref={ref}
      value={dateFilter.getMonthDate(_selectedDate)}
      readOnly
    />
  ))

  /* ================= HANDLERS ================= */

  function getTomorrow() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  }

  function updateCrew(row, role, data) {
    const key = rowKey(row)
    if (!key) return

    _setCrewInput(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [role]: {
          id: data.value,
          name: data.title
        }
      }
    }))
  }

  function clearForm() {
    _setCrewInput({})
    _setSelectedDate(getTomorrow())
    _setSelectedTraject(null)
    _setTrajectFilterValue('')
    _setRecords([])
  }

  function handleCloseModal() {
    clearForm()
    props.closeModal()
  }

  function resetRow(row) {
    // pastikan hanya berlaku untuk row data
    if (!row || row.__type !== 'ROW') return

    const key = rowKey(row)
    if (!key) return

    // optional: konfirmasi reset
    const confirmReset = window.confirm('Reset data crew pada baris ini?')
    if (!confirmReset) return

    _setCrewInput(prev => {
      const newState = { ...prev }

      // hapus data crew pada row tersebut
      if (newState[key]) {
        delete newState[key]
      }

      return newState
    })
  }

  /* ================= COLUMNS ================= */

  const crewColumn = (role, ranges, placeholder) => ({
    title: placeholder.toUpperCase(),
    customCell: (_, row) => {
      if (row.__type === 'GROUP') return null

      return (
        <SelectFloating
          row={row}
          role={role}
          ranges={ranges}
          placeholder={placeholder}
          value={_crewInput[rowKey(row)]?.[role]?.name || ''}
          onSelect={item => updateCrew(row, role, item)}
        />
      )
    }
  })

  const COLUMNS = [
    {
      title: 'BUS / NOPOL',
      customCell: (_, row) => {
        if (row.__type === 'GROUP') {
          return <strong>Bus Inap {row.title}</strong>
        }

        return (
          <SelectFloating
            row={row}
            role="bus"
            ranges={_busRanges}
            placeholder="Pilih Bus"
            value={row.bus}
            onSelect={item => {
              _setRecords(prev =>
                prev.map(r =>
                  r === row
                    ? {
                        ...r,
                        bus: item.title,
                        bus_id: item.value
                      }
                    : r
                )
              )
            }}
          />
        )
      }
    },
    crewColumn('driver', _driverRanges, 'Pilih Driver'),
    crewColumn('kondektur', _kondekturRanges, 'Pilih Kondektur'),
    crewColumn('kernet', _kernetRanges, 'Pilih Kernet'),
    {
      title: 'RITASE',
      field: 'group_ritase',
      customCell: (_, row) => row.__type === 'GROUP' ? null : row.group_ritase
    },
    {
      title: 'JAM KEBERANGKATAN',
      field: 'departure_time',
      customCell: (_, row) => row.__type === 'GROUP' ? null : row.departure_time
    },
    {
      title: 'Keterangan',
      customCell: (_, row) => {
        if (row.__type === 'GROUP') return null

        return (
          <Input
            placeholder="Keterangan"
            onChange={val => {
              const key = rowKey(row)
              _setCrewInput(prev => ({
                ...prev,
                [key]: {
                  ...prev[key],
                  note: val
                }
              }))
            }}
            value={_crewInput[rowKey(row)]?.note || ''}
          />
        )
      }
    },
    {
      title: 'RESET',
      customCell: (_, row) => {
        if (row.__type === 'GROUP') return null

        return (
          <Button
            small
            title="Reset"
            type="secondary"
            onClick={() => resetRow(row)}
          />
        )
      }
    }
  ]

  /* ================= API ================= */

  useEffect(() => {
    getCrewList(17)
    getCrewList(19)
    getCrewList(18)
    getTraject()
    _getBusList() 
  }, [])

  useEffect(() => {
    if (!_selectedTraject) return

    _setCrewInput({})
    _setRecords([])
    fetchTemplates()
  }, [_selectedTraject])

  async function fetchTemplates() {
    if (!_selectedTraject || _loading) return

    try {
      _setLoading(true)

      const res = await get(
        `/penugasan/templates/list?${new URLSearchParams({
          traject_master_id: _selectedTraject.id,
          group_by: 'bus_inap',
          sort_mode: 'ASC'
        })}`,
        authData.token
      )

      _setRecords(res?.data?.length ? buildGroupedRecords(res) : [])

      if (!res?.data?.length) {
        popAlert({ message: 'Data tidak ditemukan' })
      }

    } catch (e) {
      popAlert({ message: e.message })
    } finally {
      _setLoading(false)
    }
  }

  async function _getBusList() {
    try {
      const params = {
        "companyId": appContext.authData.companyId,
        "startFrom": 0,
        "length": 999,
        "orderBy": "id",
        "sortMode": "desc"
      }

      const result = await get(
        {url: BASE_URL + `/data/masterData/bus/list?${objectToParams(params)}`},
        appContext.authData.token
      )

      _setBusRanges(
        result.data.map(v => ({
          title: v.name,
          value: v.id,
          data: v
        }))
      )

    } catch (err) {
      console.log('API ERROR:', err)

      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Terjadi kesalahan saat mengambil data bus'

      popAlert({ message })
    }
  }

  async function getCrewList(roleId) {
    try {
      const res = await postJSON(
        '/masterData/userRoleAkses/user/list',
        {
          startFrom: 0,
          length: 9999,
          orderBy: 'idUser',
          sortMode: 'desc',
          role_id: roleId
        },
        authData.token
      )

      const list = res.data.map(v => ({
        title: v.name,
        value: v.idUser
      }))

      if (roleId === 18) _setKernetRanges(list)
      else if (roleId === 19) _setKondekturRanges(list)
      else _setDriverRanges(list)

    } catch (e) {
      console.error(e)
    }
  }

  async function getTraject() {
    try {
      const res = await postJSON(
        '/masterData/trayekMaster/list',
        { startFrom: 0, length: 360 },
        authData.token
      )
      _setTrajectRange(res.data || [])
    } catch (e) {
      popAlert({ message: e.message })
    }
  }

  /* ================= SUBMIT ================= */


  function isSubmitDisabled() {
    let hasValidRow = false
    let hasInvalidRow = false

    _records.forEach(row => {
      if (row.__type === 'GROUP') return

      const data = _crewInput[rowKey(row)] || {}

      const hasDriver = !!data.driver
      const hasKondektur = !!data.kondektur
      const hasKernet = !!data.kernet
      const hasNote = !!data.note?.trim()

      // kosong total
      if (!hasDriver && !hasKondektur && !hasKernet && !hasNote) return

      // ✅ VALID: hanya keterangan
      if (!hasDriver && !hasKondektur && !hasKernet && hasNote) {
        hasValidRow = true
        return
      }

      // ❌ driver & kondektur harus berpasangan
      if (hasDriver !== hasKondektur) {
        hasInvalidRow = true
        return
      }

      // ❌ kernet tidak boleh sendiri
      if (hasKernet && (!hasDriver || !hasKondektur)) {
        hasInvalidRow = true
        return
      }

      // ✅ VALID: driver + kondektur
      hasValidRow = true
    })

    return !hasValidRow || hasInvalidRow
  }

  async function _submitData() {
    const assignDate = _selectedDate

    const payloads = _records
      .filter(row => row.__type === 'ROW')
      .map(row => {
        const data = _crewInput[rowKey(row)] || {}

        const hasDriver = !!data.driver
        const hasKondektur = !!data.kondektur
        const hasNote = !!data.note?.trim()

        // ❌ benar-benar kosong
        if (!hasDriver && !hasKondektur && !hasNote) return null

        return {
          assignDate,
          companyId: 2,
          busId: row.bus_id,
          sequence: row.sequence,
          bus_inap: row.bus_inap,

          crew1_id: hasKondektur ? data.kondektur.id : null,
          crew2_id: hasDriver ? data.driver.id : null,
          crew3_id: data.kernet?.id || null,

          note: data.note || '',
          group_ritase: row.group_ritase,
          items: row.items || []
        }
      })
      .filter(Boolean)

    if (!payloads.length) {
      popAlert({ message: 'Tidak ada data valid untuk disimpan' })
      return
    }

    _setLoading(true)

    try {
      // ✅ KIRIM ARRAY SEKALIGUS
      await postJSON(
        '/data/penugasan/add',
        payloads,
        authData.token
      )

      popAlert({ message: 'Berhasil disimpan', type: 'success' })
      clearForm()
      props.closeModal()
      props.onSuccess?.()
    } catch (e) {
      popAlert({
        message: e.message?.details?.[0]?.message || e.message
      })
    } finally {
      _setLoading(false)
    }
  }


  /* ================= RENDER ================= */

  return (
    <div className={styles.modal_wrapper}>
      <div
        className={`${styles.backdrop} ${props.visible ? styles.visible : ''}`}
        onClick={handleCloseModal}
      />

      <div
        className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`}
        style={{ minWidth: '80%' }}
      >
        <ModalContent
          header={{
            title: 'Tambah Penugasan',
            closeModal: handleCloseModal
          }}
        >
          <div style={{ minHeight: '80vh' }}>
            <Row verticalEnd style={{ marginBottom: 12 }}>
              <Col column={2} withPadding>
                <Input
                  title="Trayek"
                  placeholder="Pilih Trayek"
                  value={_trajectFilterValue}
                  onChange={_setTrajectFilterValue}
                  suggestions={_trajectRange}
                  suggestionField="name"
                  onSuggestionSelect={t => {
                    _setSelectedTraject(t)
                    _setTrajectFilterValue(t.name)
                  }}
                />
              </Col>

              <Col column={2} withPadding>
                <DatePicker
                  selected={_selectedDate}
                  onChange={_setSelectedDate}
                  customInput={<CustomDatePicker />}
                />
              </Col>
            </Row>

            {_loading ? (
                <div style={{ padding: 12 }}>Memuat data…</div>
            ): (
                <>
                    <Table
                        records={_records}
                        columns={COLUMNS}
                        exportToXls={false}
                    />
                    <Row flexEnd>
                        <Button
                            title="Simpan Penugasan"
                            onClick={_submitData}
                            disabled={isSubmitDisabled() || _loading}
                        />
                    </Row>
                </>
            )}
          </div>
        </ModalContent>
      </div>
    </div>
  )
}
