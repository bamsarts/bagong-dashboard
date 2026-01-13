import { useEffect, useState, useContext } from 'react'
import { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignmentTemplateModal.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { dateFilter } from '../../utils/filters'
import { Col, Row } from '../Layout'
import "react-datepicker/dist/react-datepicker.css";

const defaultProps = {
  visible: false,
  closeModal: null,
  onSuccess: null
}

export default function AssignmentTemplateModal(props = defaultProps) {
  const appContext = useContext(AppContext)

  /* ================= STATE ================= */

  const CONFIG_PARAM = {
    items: [
      {
        busId: "",
        bus: null,
        scheduleAssignId: "",
        scheduleSelected: { title: "" },
        ritase: "",
        jamBerangkat: ""
      }
    ]
  }

  const [_form, _setForm] = useState(CONFIG_PARAM)
  const [_isProcessing, _setIsProcessing] = useState(false)
  const [_isComplete, _setIsComplete] = useState(true)

  const [_busRanges, _setBusRanges] = useState([])
  const [_scheduleRanges, _setScheduleRanges] = useState([])

  const [_trajectRange, _setTrajectRange] = useState([])
  const [_trajectFilterValue, _setTrajectFilterValue] = useState("")
  const [_selectedTraject, _setSelectedTraject] = useState(null)

  /* ================= HELPERS ================= */

  function _updateQuery(data = {}) {
    _setForm(old => ({ ...old, ...data }))
  }

  function _updateItem(index, field, value) {
    const items = [..._form.items]
    items[index][field] = value
    _updateQuery({ items })
  }

  function _addItem() {
    _updateQuery({
      items: [
        ..._form.items,
        {
          busId: "",
          bus: null,
          scheduleAssignId: "",
          scheduleSelected: { title: "" },
          ritase: "",
          jamBerangkat: ""
        }
      ]
    })
  }

  function _removeItem(index) {
    const items = [..._form.items]
    items.splice(index, 1)
    _updateQuery({ items })
  }

  function _clearForm() {
    _setForm(CONFIG_PARAM)
    _setSelectedTraject(null)
    _setTrajectFilterValue("")
  }

  /* ================= EFFECT ================= */

  useEffect(() => {
    _getBusList()
    _getScheduleList()
    _getTraject()
  }, [])

  useEffect(() => {
    if (props.visible) {
      _updateQuery({
        assignDate: dateFilter.basicDate(new Date()).normal,
        companyId: appContext.authData.companyId
      })
    }
  }, [props.visible])

  useEffect(() => {
    const valid =
        _form.items.length > 0 &&
        _form.items.every(i =>
        i.busId &&
        i.scheduleAssignId &&
        i.ritase &&
        i.jamBerangkat
    )

_setIsComplete(!valid)
  }, [_form])

  /* ================= API ================= */

  async function _getBusList() {
    const res = await postJSON(
      '/masterData/bus/list',
      { startFrom: 0, length: 100, companyId: appContext.authData.companyId },
      appContext.authData.token
    )

    _setBusRanges(
      res.data.map(v => ({
        title: v.name,
        value: v.id,
        data: v
      }))
    )
  }

  async function _getScheduleList() {
    const res = await postJSON(
      '/masterData/jadwal/master/list',
      {
        startFrom: 0,
        length: 60,
        scheduleType: "INTERCITY",
        orderBy: "id",
        sortMode: "desc"
      },
      appContext.authData.token
    )

    _setScheduleRanges(
      res.data.map(v => ({
        title: `${v.code} | ${v.trajectMasterName}`,
        value: v.id,
        data: v
      }))
    )
  }

  async function _getTraject() {
    const res = await postJSON(
      '/masterData/trayekMaster/list',
      { startFrom: 0, length: 360 },
      appContext.authData.token
    )
    _setTrajectRange(res.data || [])
  }

  /* ================= SUBMIT ================= */

  async function _submitData() {
  if (!_selectedTraject) {
    popAlert({ message: "Trayek wajib dipilih" })
    return
  }


  const payload = _form.items.map(item => ({
    bus_id: item.busId,
    traject_id: _selectedTraject.id,
    schedule_id: item.scheduleAssignId,
    ritase: Number(item.ritase),
    departure_time: item.jamBerangkat + ":00"
    }))

  console.log("PAYLOAD TO API:", payload)

  _setIsProcessing(true)

  try {
    await postJSON(
      '/penugasan/templates/add',
      payload,
      appContext.authData.token
    )

    popAlert({ message: "Berhasil disimpan", type: "success" })
    props.closeModal()
    _clearForm()
    props.onSuccess && props.onSuccess()

  } catch (e) {
    popAlert({ message: e.message })
  } finally {
    _setIsProcessing(false)
  }
}


  /* ================= RENDER ================= */

  


  return (
    <div className={styles.modal_wrapper}>
      <div className={`${styles.backdrop} ${props.visible ? styles.visible : ''}`} onClick={props.closeModal} />

      <div className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`} style={{ minWidth: "80%" }}>
        <ModalContent
          header={{
            title: 'Tambah Penugasan Template',
            closeModal: () => {
              props.closeModal()
              _clearForm()
            }
          }}
        >

          <Row>
            <Col column={2} withPadding>
              <Input
                title="Trayek"
                placeholder="Pilih Trayek"
                value={_trajectFilterValue}
                onChange={_setTrajectFilterValue}
                suggestions={_trajectRange}
                suggestionField="name"
                onSuggestionSelect={(t) => {
                  _setSelectedTraject(t)
                  _setTrajectFilterValue(t.name)
                }}
              />
            </Col>
          </Row>

          <div style={{ margin: "1rem 0", display: "flex", gap: "1rem" }}>
            <strong>List Penugasan</strong>
            <Button small title="Tambah" styles={Button.primary} onClick={_addItem} />
          </div>

          {_form.items.map((item, index) => (
            <Row key={index} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>

              <Col withPadding>
                <Input
                  title="Bus"
                  placeholder="Pilih Bus"
                  value={item.bus?.title || ""}
                  suggestions={_busRanges}
                  suggestionField="title"
                  onSuggestionSelect={(d) => {
                    _updateItem(index, "busId", d.value)
                    _updateItem(index, "bus", d)
                  }}
                />
              </Col>

              <Col column={2} withPadding>
                <Input
                  title="Jadwal"
                  placeholder="Cari Jadwal"
                  value={item.scheduleSelected.title}
                  suggestions={_scheduleRanges}
                  suggestionField="title"
                  onSuggestionSelect={(v) => {
                    _updateItem(index, "scheduleAssignId", v.value)
                    _updateItem(index, "scheduleSelected", v)
                  }}
                />
              </Col>

              <Col column={1} withPadding>
                <Input
                  title="Ritase"
                  value={item.ritase}
                  onChange={(v) => _updateItem(index, "ritase", v)}
                />
              </Col>

              <Col column={1} withPadding>
                <Input
                  title="Jam Berangkat"
                  value={item.jamBerangkat}
                  onChange={(v) => _updateItem(index, "jamBerangkat", v)}
                />
              </Col>

              {_form.items.length > 1 && (
                <Col alignEnd>
                  <Button
                    small
                    title="Hapus"
                    styles={Button.error}
                    onClick={() => _removeItem(index)}
                  />
                </Col>
              )}
            </Row>
          ))}

          <Button
            title="Simpan"
            styles={Button.secondary}
            disabled={_isComplete}
            onClick={_submitData}
            onProcess={_isProcessing}
          />

        </ModalContent>
      </div>
    </div>
  )
}
