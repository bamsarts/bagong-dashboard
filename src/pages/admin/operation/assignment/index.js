import { useEffect, useState, forwardRef } from 'react'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { Col, Row } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { postJSON } from '../../../../api/utils'
import { dateFilter } from '../../../../utils/filters'
import AssignmentModal from '../../../../components/AssignmentModal'
import AssigmentEditModal from '../../../../components/AssigmentEditModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'


/* ================= HELPERS ================= */

function buildGroupedReadonlyRecords(apiResponse) {
  const result = []
  if (!apiResponse?.data?.length) return result

  // pola urutan ritase
  const ritaseOrderMap = {
    '1 & 2': 1,
    '3 & 1': 2,
    '2 & 3': 3,
    '3 & 4': 4,
    '4 & 1': 5
  }

  const normalize = g => g.replace(/\s+/g, ' ').trim()

  // ================= HITUNG SEQUENCE TERKECIL GROUP =================
  const groups = apiResponse.data.map(group => {
    let minSequence = Infinity

    group.penugasan.forEach(item => {
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

  // ================= SORT GROUP BERDASARKAN SEQUENCE =================
  groups.sort((a, b) => a.minSequence - b.minSequence)

  groups.forEach(group => {

    // ================= GROUP HEADER =================
    result.push({
      __type: 'GROUP',
      title: group.group_key_display || group.group_key
    })

    const map = {}

    // ================= COLLECT & GROUP =================
    group.penugasan.forEach(item => {
      const key = `${item.bus_id}|${item.group_ritase}`

      if (!map[key]) {
        map[key] = {
          __type: 'ROW',
          bus_id: Number(item.bus_id),
          bus: item.bus_name,
          sequence: Number(item.sequence), // simpan sequence
          group_ritase: item.group_ritase,
          traject_name: item.traject_master_name,

          driver: item.bus_crew2_name,
          driverId: item.bus_crew2_id,
          kondektur: item.bus_crew1_name,
          kondekturId: item.bus_crew1_id,
          kernet: item.bus_crew3_name,
          kernetId: item.bus_crew3_id,

          notes: item.notes || '',

          ritaseJamMap: {},
          penugasanMap: {}
        }
      }

      // simpan jam
      if (item.ritase && item.departure_time) {
        map[key].ritaseJamMap[item.ritase] =
          item.departure_time.slice(0, 5)
      }

      if (item.ritase && item.id) {
        map[key].penugasanMap[item.ritase] = item
      }
    })

    // ================= BUILD ROWS =================
    Object.values(map)
      .sort((a, b) => {

        // 1️⃣ sort SEQUENCE bus dulu
        if (a.sequence !== b.sequence) {
          return a.sequence - b.sequence
        }

        // 2️⃣ fallback bus_id
        if (a.bus_id !== b.bus_id) {
          return a.bus_id - b.bus_id
        }

        // 3️⃣ sort berdasarkan pola ritase
        const orderA = ritaseOrderMap[normalize(a.group_ritase)] ?? 999
        const orderB = ritaseOrderMap[normalize(b.group_ritase)] ?? 999

        return orderA - orderB
      })
      .forEach(row => {

        const ritaseOrder = row.group_ritase
          .split('&')
          .map(v => v.trim())

        const jamOrdered = ritaseOrder
          .map(r => row.ritaseJamMap[r])
          .filter(Boolean)

        result.push({
          ...row,
          departure_time: jamOrdered.join(' & ')
        })
      })
  })

  return result
}

/* ================= COMPONENT ================= */

export default function Assignment(props) {
  const [_records, _setRecords] = useState([])
  const [_loading, _setLoading] = useState(false)
  const [_createModalVisible, _setCreateModalVisible] = useState(false)
  const [_editModalVisible, _setEditModalVisible] = useState(false)

  const [_selectedDate, _setSelectedDate] = useState(new Date())

  const [_trajectRange, _setTrajectRange] = useState([])
  const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
  const [_selectedTraject, _setSelectedTraject] = useState(null)
  const [_selectedRow, _setSelectedRow] = useState(null)
  const [_orientation, _setOrientation] = useState('portrait')

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

  /* ================= TABLE COLUMNS ================= */

  const COLUMNS = [
    {
      title: 'BUS / NOPOL',
      field: 'bus',
      customCell: (value, row) =>
        row.__type === 'GROUP'
          ? <strong>Bus Inap {row.title}</strong>
          : value
    },
    {
      title: 'DRIVER',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : (row.driver || '-')
    },
    {
      title: 'KONDEKTUR',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : (row.kondektur || '-')
    },
    {
      title: 'KERNET',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : (row.kernet || '-')
    },
    {
      title: 'RITASE',
      field: 'group_ritase',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : row.group_ritase
    },
    {
      title: 'JAM KEBERANGKATAN',
      field: 'departure_time',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : (row.departure_time || '-')
    },
    {
      title: 'Keterangan',
      field: 'notes',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : (row.notes)
    },
    {
      title: 'AKSI',
      field: 'aksi',
      customCell: (_, row) => {
        if (row.__type === 'GROUP') return null

        return (
          <Button
            small
            title="Edit"
            onClick={() => {
              _setSelectedRow(row)
              _setEditModalVisible(true)
            }}
          />
        )
      }
    }
  ]

  /* ================= API ================= */

  useEffect(() => {
    getTraject()
  }, [])

  async function getTraject() {
    try {
      const res = await postJSON(
        '/masterData/trayekMaster/list',
        { startFrom: 0, length: 360 },
        props.authData.token
      )
      _setTrajectRange(res.data || [])
    } catch (e) {
      popAlert({ message: e.message })
    }
  }

  async function fetchData() {
    if (_loading) return

    if (!_selectedTraject) {
      popAlert({ message: 'Silakan pilih trayek terlebih dahulu' })
      return
    }

    try {
      _setLoading(true)

      const params = {
        startDate: dateFilter.basicDate(_selectedDate).normal,
        endDate: dateFilter.basicDate(_selectedDate).normal,
        traject_master_id: _selectedTraject.id,
        groupBy: 'bus_inap',
        sortMode: 'asc'
      }

      const res = await postJSON(
        '/data/penugasan/list',
        params,
        props.authData.token
      )

      _setRecords(buildGroupedReadonlyRecords(res))

    } catch (e) {
      popAlert({ message: e.message })
    } finally {
      _setLoading(false)
    }
  }

  /* ================= EXPORT PDF ================= */

  function exportPDF() {

    const doc = new jsPDF({
      orientation: _orientation,
      unit: 'mm',
      format: [210, 330] // F4
    })

    const trajectName = _selectedTraject?.name || '-'
    const tanggal = dateFilter.getMonthDate(_selectedDate)

    /* ================= HEADER ================= */

    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(10)
    doc.text('ROSTER CREW BUS', pageWidth / 2, 10, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`Trayek : ${trajectName}`, pageWidth / 2, 16, { align: 'center' })
    doc.text(`Tanggal : ${tanggal}`, pageWidth / 2, 21, { align: 'center' })

    const rows = []

    _records.forEach(row => {
      if (row.__type === 'GROUP') {
        rows.push([
          {
            content: `Bus Inap ${row.title}`,
            colSpan: 7,
            styles: { fontStyle: 'bold', halign: 'left' }
          }
        ])
      } else {
        rows.push([
          row.bus || '-',
          row.driver || '-',
          row.kondektur || '-',
          row.kernet || '-',
          row.group_ritase || '-',
          row.departure_time || '-',
          row.notes 
        ])
      }
    })

    autoTable(doc, {
      head: [[
        'BUS / NOPOL',
        'DRIVER',
        'KONDEKTUR',
        'KERNET',
        'RITASE',
        'JAM',
        'KETERANGAN'
      ]],

      body: rows,
      theme: 'grid',

      startY: 28, // ⬅️ penting supaya tabel turun dari header

      margin: {
        left: 5,
        right: 5
      },

      styles: {
        fontSize: 7,
        cellPadding: 1
      }
    })

    const date = dateFilter.basicDate(_selectedDate).normal
    doc.save(`Laporan_roaster_${trajectName}_${date}.pdf`)
  }


  /* ================= RENDER ================= */

  return (
    <Main>

      <AssignmentModal
        visible={_createModalVisible}
        closeModal={() => _setCreateModalVisible(false)}
        onSuccess={fetchData}
      />

      <AssigmentEditModal
        visible={_editModalVisible}
        closeModal={() => _setEditModalVisible(false)}
        records={_selectedRow?.penugasanMap}
        authToken={props.authData.token}
        onSuccess={fetchData}
      />

      <AdminLayout
        headerContent={(
          <Button
            title="Tambah Penugasan"
            styles={Button.secondary}
            onClick={() => _setCreateModalVisible(true)}
          />
        )}
      >
        <Card noPadding>
          <Row verticalEnd withPadding>
            <Col column={1} withPadding mobileFullWidth>
              <DatePicker
                selected={_selectedDate}
                onChange={_setSelectedDate}
                customInput={<CustomDatePicker />}
              />
            </Col>

            <Col column={2} withPadding mobileFullWidth>
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

            <Col column={1} withPadding mobileFullWidth>
              <Button
                title="Terapkan"
                styles={Button.secondary}
                onClick={fetchData}
                small
                disabled={_loading || !_selectedTraject}
              />
            </Col>
            <Col withPadding>
              <div style={{ marginTop: 8 }}>
                <label>
                  <input
                    type="radio"
                    value="portrait"
                    checked={_orientation === 'portrait'}
                    onChange={(e) => _setOrientation(e.target.value)}
                  />
                  Portrait
                </label>

                <label style={{ marginLeft: 15 }}>
                  <input
                    type="radio"
                    value="landscape"
                    checked={_orientation === 'landscape'}
                    onChange={(e) => _setOrientation(e.target.value)}
                  />
                  Landscape
                </label>
              </div>
              <Button
                title="Export PDF"
                onClick={exportPDF}
              />
            </Col>
          </Row>

          {_loading ? (
            <div style={{ padding: 16 }}>Memuat data…</div>
          ) : (
            <Table
              records={_records}
              columns={COLUMNS}
              exportToXls={false}
            />
          )}
        </Card>
      </AdminLayout>
    </Main>
  )
}
