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

/* ================= HELPERS ================= */

function buildGroupedReadonlyRecords(apiResponse) {
  const result = []
  if (!apiResponse?.data?.length) return result

  apiResponse.data.forEach(group => {
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
          bus_id: Number(item.bus_id),          // 🔑 cast ke number
          bus: item.bus_name,
          group_ritase: item.group_ritase,
          traject_name: item.traject_master_name,

          // sesuai kontrak backend kamu
          driver: item.bus_crew2_name,
          kondektur: item.bus_crew1_name,
          kernet: item.bus_crew3_name,

          notes: item.notes || '',
          ritaseJamMap: {}
        }
      }

      if (item.ritase && item.departure_time) {
        map[key].ritaseJamMap[item.ritase] =
          item.departure_time.slice(0, 5)
      }
    })

    // ================= BUILD ROWS =================
    Object.values(map)
      .sort((a, b) => {
        // 1️⃣ sort BUS dulu
        if (a.bus_id !== b.bus_id) {
          return a.bus_id - b.bus_id
        }

        // 2️⃣ sort RITASE (1&2 < 3&4)
        const aR = Number(a.group_ritase.split('&')[0])
        const bR = Number(b.group_ritase.split('&')[0])

        return aR - bR
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
  const [_modalVisible, _setModalVisible] = useState(false)

  const [_selectedDate, _setSelectedDate] = useState(new Date())

  const [_trajectRange, _setTrajectRange] = useState([])
  const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
  const [_selectedTraject, _setSelectedTraject] = useState(null)

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
        row.__type === 'GROUP' ? null : (row.notes || '-')
    }
  ]

  /* ================= API ================= */

  useEffect(() => {
    getTraject()
    fetchData()
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

    try {
      _setLoading(true)

      const params = {
        startDate: dateFilter.basicDate(_selectedDate).normal,
        endDate: dateFilter.basicDate(_selectedDate).normal,
        traject_master_id: _selectedTraject?.id || null,
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

  /* ================= RENDER ================= */

  return (
    <Main>

      <AssignmentModal
        visible={_modalVisible}
        closeModal={() => _setModalVisible(false)}
        onSuccess={fetchData}
      />

      <AdminLayout
        headerContent={(
          <Button
            title="Tambah Penugasan"
            styles={Button.secondary}
            onClick={() => _setModalVisible(true)}
          />
        )}
      >
        <Card noPadding>
          <Row verticalEnd withPadding>
            <Col column={2} withPadding mobileFullWidth>
              <DatePicker
                selected={_selectedDate}
                onChange={_setSelectedDate}
                customInput={<CustomDatePicker />}
              />
            </Col>

            <Col column={3} withPadding mobileFullWidth>
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
                disabled={_loading}
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
